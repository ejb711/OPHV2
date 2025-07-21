// functions/src/users/management.js
// OPHV2 User Management Functions - Complete Implementation
// Handles user CRUD operations with proper permissions and audit logging

const functions = require('firebase-functions/v1')
const admin = require('firebase-admin')

// Import utility functions
const { 
  validateAuth, 
  validatePermission, 
  validateUserManagement,
  validateUserId,
  validateEmail,
  validateRole,
  preventSelfTargeting,
  getUserPermissions 
} = require('../utils/permissions')

/* ---------- Helper Functions ---------- */

/**
 * Create simple audit log entry directly to Firestore
 * @param {Object} logData - Audit log data
 */
async function createSimpleAuditLog(logData) {
  try {
    await admin.firestore().collection('audit_logs').add({
      ...logData,
      timestamp: admin.firestore.FieldValue.serverTimestamp(),
      source: 'cloud_function'
    })
  } catch (error) {
    console.error('Error creating audit log:', error)
    // Don't throw - audit logging shouldn't break main functionality
  }
}

/* ---------- User Deletion Function ---------- */

/**
 * Securely delete a user from both Firebase Auth and Firestore
 * Includes proper permission checking and audit logging
 */
exports.deleteUser = functions.https.onCall(async (data, context) => {
  validateAuth(context)
  
  const { userId, reason } = data
  validateUserId(userId)
  
  // Prevent self-deletion
  preventSelfTargeting(context.auth.uid, userId, 'delete your own account')
  
  try {
    // Check permissions
    const callerPerms = await getUserPermissions(context.auth.uid)
    validatePermission(callerPerms, 'delete_users', 'delete users')
    
    // Get target user data before deletion
    const targetUserDoc = await admin.firestore().collection('users').doc(userId).get()
    if (!targetUserDoc.exists) {
      throw new functions.https.HttpsError('not-found', 'User not found')
    }
    
    const targetUserData = targetUserDoc.data()
    
    // Validate management permissions
    validateUserManagement(callerPerms, targetUserData.role, 'delete this user')
    
    // Prevent deletion of the last owner
    if (targetUserData.role === 'owner') {
      const ownerCount = await admin.firestore().collection('users')
        .where('role', '==', 'owner')
        .count()
        .get()
      
      if (ownerCount.data().count <= 1) {
        throw new functions.https.HttpsError(
          'failed-precondition', 
          'Cannot delete the last owner account'
        )
      }
    }
    
    // Delete from Firebase Auth first
    try {
      await admin.auth().deleteUser(userId)
    } catch (authError) {
      if (authError.code !== 'auth/user-not-found') {
        throw authError
      }
      // Continue if user not found in Auth but exists in Firestore
    }
    
    // Delete from Firestore
    await admin.firestore().collection('users').doc(userId).delete()
    
    // Create audit log for successful deletion
    await createSimpleAuditLog({
      action: 'user_deleted',
      userId: context.auth.uid,
      userEmail: context.auth.token.email || 'unknown',
      targetUserId: userId,
      details: {
        deletedUserEmail: targetUserData.email,
        deletedUserRole: targetUserData.role,
        reason: reason || 'Administrative action',
        deletedFields: {
          displayName: targetUserData.displayName,
          department: targetUserData.department,
          title: targetUserData.title,
          region: targetUserData.region
        }
      }
    })
    
    return {
      success: true,
      message: 'User deleted successfully',
      deletedUserId: userId,
      deletedEmail: targetUserData.email
    }
    
  } catch (error) {
    console.error('Error deleting user:', error)
    
    // Create audit log for failed deletion
    await createSimpleAuditLog({
      action: 'user_deletion_failed',
      userId: context.auth.uid,
      userEmail: context.auth.token.email || 'unknown',
      targetUserId: userId,
      details: {
        error: error.message,
        reason: reason || 'Administrative action',
        errorCode: error.code || 'unknown'
      }
    })
    
    // Re-throw known errors
    if (error instanceof functions.https.HttpsError) {
      throw error
    }
    
    // Log unexpected errors and throw generic error
    throw new functions.https.HttpsError('internal', 'Failed to delete user')
  }
})

/* ---------- Create User Function ---------- */

/**
 * Create a new user account with specified role and profile information
 */
exports.createUser = functions.https.onCall(async (data, context) => {
  validateAuth(context)
  
  const { 
    email, 
    password, 
    displayName,
    role, 
    phone,
    department,
    title,
    region,
    location,
    bio,
    sendWelcomeEmail 
  } = data
  
  // Validate inputs
  validateEmail(email)
  validateRole(role)
  
  if (!password || password.length < 6) {
    throw new functions.https.HttpsError('invalid-argument', 'Password must be at least 6 characters')
  }

  if (!displayName || displayName.trim().length === 0) {
    throw new functions.https.HttpsError('invalid-argument', 'Display name is required')
  }
  
  try {
    // Check permissions
    const callerPerms = await getUserPermissions(context.auth.uid)
    validatePermission(callerPerms, 'create_users', 'create users')
    
    // Verify caller can assign this role
    if (!callerPerms.isOwner && role === 'owner') {
      throw new functions.https.HttpsError('permission-denied', 'Cannot create owner accounts')
    }
    if (!callerPerms.isOwner && callerPerms.role !== 'admin' && role === 'admin') {
      throw new functions.https.HttpsError('permission-denied', 'Cannot create admin accounts')
    }
    
    // Check if user already exists
    try {
      await admin.auth().getUserByEmail(email.toLowerCase().trim())
      throw new functions.https.HttpsError('already-exists', 'A user with this email already exists')
    } catch (error) {
      // If user not found, continue with creation
      if (error.code !== 'auth/user-not-found') {
        throw error
      }
    }
    
    // Create user in Firebase Auth
    const userRecord = await admin.auth().createUser({
      email: email.toLowerCase().trim(),
      password: password,
      displayName: displayName.trim(),
      emailVerified: false
    })
    
    // Create user document in Firestore
    const userData = {
      email: email.toLowerCase().trim(),
      displayName: displayName.trim(),
      role: role,
      status: 'active',
      phone: phone || '',
      department: department || '',
      title: title || '',
      region: region || '',
      location: location || '',
      bio: bio || '',
      customPermissions: [],
      deniedPermissions: [],
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      createdBy: context.auth.uid,
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    }
    
    await admin.firestore().collection('users').doc(userRecord.uid).set(userData)
    
    // Set custom claims for role-based access
    await admin.auth().setCustomUserClaims(userRecord.uid, {
      role: role,
      status: 'active'
    })
    
    // Create audit log
    await createSimpleAuditLog({
      action: 'user_created',
      userId: context.auth.uid,
      userEmail: context.auth.token.email || 'unknown',
      targetUserId: userRecord.uid,
      details: {
        createdUserEmail: email.toLowerCase().trim(),
        assignedRole: role,
        method: 'admin_creation',
        sendWelcomeEmail: sendWelcomeEmail || false,
        profileData: {
          hasDisplayName: !!displayName,
          hasDepartment: !!department,
          hasTitle: !!title,
          hasRegion: !!region,
          hasLocation: !!location,
          hasPhone: !!phone,
          hasBio: !!bio
        }
      }
    })
    
    // Send welcome email if requested
    if (sendWelcomeEmail) {
      // TODO: Implement email sending functionality
      console.log(`Welcome email should be sent to ${email}`)
    }
    
    return {
      success: true,
      message: 'User created successfully',
      userId: userRecord.uid,
      email: email.toLowerCase().trim()
    }
    
  } catch (error) {
    console.error('Error creating user:', error)
    
    // Create audit log for failed creation
    await createSimpleAuditLog({
      action: 'user_creation_failed',
      userId: context.auth.uid,
      userEmail: context.auth.token.email || 'unknown',
      details: {
        attemptedEmail: email,
        attemptedRole: role,
        error: error.message,
        errorCode: error.code || 'unknown',
        profileData: {
          hasDisplayName: !!displayName,
          hasDepartment: !!department,
          hasTitle: !!title,
          hasRegion: !!region,
          hasLocation: !!location,
          hasPhone: !!phone,
          hasBio: !!bio
        }
      }
    })
    
    if (error instanceof functions.https.HttpsError) {
      throw error
    }
    
    throw new functions.https.HttpsError('internal', 'Failed to create user with profile information')
  }
})

/* ---------- Update User Role Function ---------- */

/**
 * Update a user's role with proper permission checks
 */
exports.updateUserRole = functions.https.onCall(async (data, context) => {
  validateAuth(context)
  
  const { userId, newRole, reason } = data
  validateUserId(userId)
  validateRole(newRole)
  
  // Prevent self-role changes
  preventSelfTargeting(context.auth.uid, userId, 'change your own role')
  
  try {
    // Get permissions
    const callerPerms = await getUserPermissions(context.auth.uid)
    validatePermission(callerPerms, 'edit_users', 'edit user roles')
    
    // Get target user
    const targetUserDoc = await admin.firestore().collection('users').doc(userId).get()
    if (!targetUserDoc.exists) {
      throw new functions.https.HttpsError('not-found', 'User not found')
    }
    
    const targetUserData = targetUserDoc.data()
    const oldRole = targetUserData.role
    
    // Validate management permissions for both old and new roles
    validateUserManagement(callerPerms, oldRole, 'modify this user')
    validateUserManagement(callerPerms, newRole, 'assign this role')
    
    // Prevent role escalation beyond caller's level
    if (!callerPerms.isOwner && newRole === 'owner') {
      throw new functions.https.HttpsError('permission-denied', 'Cannot assign owner role')
    }
    
    // Update role
    await admin.firestore().collection('users').doc(userId).update({
      role: newRole,
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      lastModifiedBy: context.auth.uid
    })
    
    // Update custom claims
    await admin.auth().setCustomUserClaims(userId, {
      role: newRole,
      status: targetUserData.status || 'active'
    })
    
    // Create audit log
    await createSimpleAuditLog({
      action: 'user_role_changed',
      userId: context.auth.uid,
      userEmail: context.auth.token.email || 'unknown',
      targetUserId: userId,
      details: {
        targetUserEmail: targetUserData.email,
        oldRole: oldRole,
        newRole: newRole,
        reason: reason || 'Administrative action'
      }
    })
    
    return {
      success: true,
      message: 'User role updated successfully',
      userId: userId,
      oldRole: oldRole,
      newRole: newRole
    }
    
  } catch (error) {
    console.error('Error updating user role:', error)
    
    // Create audit log for failed role update
    await createSimpleAuditLog({
      action: 'user_role_change_failed',
      userId: context.auth.uid,
      userEmail: context.auth.token.email || 'unknown',
      targetUserId: userId,
      details: {
        attemptedNewRole: newRole,
        reason: reason || 'Administrative action',
        error: error.message,
        errorCode: error.code || 'unknown'
      }
    })
    
    if (error instanceof functions.https.HttpsError) {
      throw error
    }
    
    throw new functions.https.HttpsError('internal', 'Failed to update user role')
  }
})

/* ---------- Update User Profile Function ---------- */

/**
 * Update user profile information
 */
exports.updateUserProfile = functions.https.onCall(async (data, context) => {
  validateAuth(context)
  
  const { 
    userId, 
    displayName, 
    phone, 
    department, 
    title, 
    region, 
    location, 
    bio 
  } = data
  
  validateUserId(userId)
  
  try {
    // Check permissions - users can edit their own profile, or admins can edit others
    const isOwnProfile = context.auth.uid === userId
    
    if (!isOwnProfile) {
      const callerPerms = await getUserPermissions(context.auth.uid)
      validatePermission(callerPerms, 'edit_users', 'edit user profiles')
      
      // Get target user for management validation
      const targetUserDoc = await admin.firestore().collection('users').doc(userId).get()
      if (!targetUserDoc.exists) {
        throw new functions.https.HttpsError('not-found', 'User not found')
      }
      
      validateUserManagement(callerPerms, targetUserDoc.data().role, 'edit this user profile')
    }
    
    // Get current user data for audit comparison
    const currentUserDoc = await admin.firestore().collection('users').doc(userId).get()
    if (!currentUserDoc.exists) {
      throw new functions.https.HttpsError('not-found', 'User not found')
    }
    
    const currentData = currentUserDoc.data()
    
    // Prepare update data
    const updateData = {
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      lastModifiedBy: context.auth.uid
    }
    
    // Only update fields that are provided and different
    if (displayName !== undefined && displayName !== currentData.displayName) {
      updateData.displayName = displayName.trim()
      
      // Also update Firebase Auth displayName
      await admin.auth().updateUser(userId, {
        displayName: displayName.trim()
      })
    }
    
    if (phone !== undefined && phone !== currentData.phone) {
      updateData.phone = phone
    }
    
    if (department !== undefined && department !== currentData.department) {
      updateData.department = department
    }
    
    if (title !== undefined && title !== currentData.title) {
      updateData.title = title
    }
    
    if (region !== undefined && region !== currentData.region) {
      updateData.region = region
    }
    
    if (location !== undefined && location !== currentData.location) {
      updateData.location = location
    }
    
    if (bio !== undefined && bio !== currentData.bio) {
      updateData.bio = bio
    }
    
    // Update Firestore document
    await admin.firestore().collection('users').doc(userId).update(updateData)
    
    // Create audit log
    await createSimpleAuditLog({
      action: 'user_profile_updated',
      userId: context.auth.uid,
      userEmail: context.auth.token.email || 'unknown',
      targetUserId: userId,
      details: {
        targetUserEmail: currentData.email,
        isOwnProfile: isOwnProfile,
        updatedFields: {
          displayName: displayName !== currentData.displayName ? displayName : null,
          department: department !== currentData.department ? department : null,
          title: title !== currentData.title ? title : null,
          region: region !== currentData.region ? region : null,
          location: location !== currentData.location ? location : null,
          phone: phone !== currentData.phone ? '***' : null, // Mask phone in logs
          bio: bio !== currentData.bio ? 'updated' : null
        }
      }
    })
    
    return {
      success: true,
      message: 'Profile updated successfully',
      userId: userId
    }
    
  } catch (error) {
    console.error('Error updating user profile:', error)
    
    if (error instanceof functions.https.HttpsError) {
      throw error
    }
    
    throw new functions.https.HttpsError('internal', 'Failed to update user profile')
  }
})

/* ---------- Update User Status Function ---------- */

/**
 * Update user account status (active, suspended, etc.)
 */
exports.updateUserStatus = functions.https.onCall(async (data, context) => {
  validateAuth(context)
  
  const { userId, status, reason } = data
  validateUserId(userId)
  
  const validStatuses = ['active', 'suspended', 'pending', 'disabled']
  if (!status || !validStatuses.includes(status)) {
    throw new functions.https.HttpsError('invalid-argument', `Invalid status. Must be one of: ${validStatuses.join(', ')}`)
  }
  
  // Prevent self-status changes to avoid lockouts
  preventSelfTargeting(context.auth.uid, userId, 'change your own account status')
  
  try {
    // Check permissions
    const callerPerms = await getUserPermissions(context.auth.uid)
    validatePermission(callerPerms, 'edit_users', 'change user status')
    
    // Get target user
    const targetUserDoc = await admin.firestore().collection('users').doc(userId).get()
    if (!targetUserDoc.exists) {
      throw new functions.https.HttpsError('not-found', 'User not found')
    }
    
    const targetUserData = targetUserDoc.data()
    const oldStatus = targetUserData.status || 'active'
    
    // Validate management permissions
    validateUserManagement(callerPerms, targetUserData.role, 'modify this user status')
    
    // Update status
    await admin.firestore().collection('users').doc(userId).update({
      status: status,
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      lastModifiedBy: context.auth.uid
    })
    
    // Update custom claims
    await admin.auth().setCustomUserClaims(userId, {
      role: targetUserData.role,
      status: status
    })
    
    // Disable/enable user in Firebase Auth based on status
    const disabled = status === 'suspended' || status === 'disabled'
    await admin.auth().updateUser(userId, { disabled })
    
    // Create audit log
    await createSimpleAuditLog({
      action: 'user_status_changed',
      userId: context.auth.uid,
      userEmail: context.auth.token.email || 'unknown',
      targetUserId: userId,
      details: {
        targetUserEmail: targetUserData.email,
        oldStatus: oldStatus,
        newStatus: status,
        reason: reason || 'Administrative action',
        authDisabled: disabled
      }
    })
    
    return {
      success: true,
      message: 'User status updated successfully',
      userId: userId,
      oldStatus: oldStatus,
      newStatus: status
    }
    
  } catch (error) {
    console.error('Error updating user status:', error)
    
    if (error instanceof functions.https.HttpsError) {
      throw error
    }
    
    throw new functions.https.HttpsError('internal', 'Failed to update user status')
  }
})

/* ---------- Bulk User Operations Function ---------- */

/**
 * Perform bulk operations on multiple users
 */
exports.bulkUpdateUsers = functions.https.onCall(async (data, context) => {
  validateAuth(context)
  
  const { userIds, operation, operationData } = data
  
  if (!Array.isArray(userIds) || userIds.length === 0) {
    throw new functions.https.HttpsError('invalid-argument', 'User IDs array is required')
  }
  
  if (userIds.length > 50) {
    throw new functions.https.HttpsError('invalid-argument', 'Cannot process more than 50 users at once')
  }
  
  const validOperations = ['role_change', 'status_change', 'delete']
  if (!validOperations.includes(operation)) {
    throw new functions.https.HttpsError('invalid-argument', `Invalid operation. Must be one of: ${validOperations.join(', ')}`)
  }
  
  try {
    // Check permissions
    const callerPerms = await getUserPermissions(context.auth.uid)
    
    switch (operation) {
      case 'role_change':
        validatePermission(callerPerms, 'edit_users', 'change user roles')
        break
      case 'status_change':
        validatePermission(callerPerms, 'edit_users', 'change user status')
        break
      case 'delete':
        validatePermission(callerPerms, 'delete_users', 'delete users')
        break
    }
    
    const results = {
      success: [],
      failed: [],
      totalProcessed: 0
    }
    
    // Process each user
    for (const userId of userIds) {
      try {
        // Prevent self-targeting for dangerous operations
        if (operation === 'delete' || operation === 'status_change') {
          if (context.auth.uid === userId) {
            results.failed.push({
              userId,
              reason: 'Cannot perform this operation on your own account'
            })
            continue
          }
        }
        
        // Get user data
        const userDoc = await admin.firestore().collection('users').doc(userId).get()
        if (!userDoc.exists) {
          results.failed.push({
            userId,
            reason: 'User not found'
          })
          continue
        }
        
        const userData = userDoc.data()
        
        // Validate management permissions
        try {
          validateUserManagement(callerPerms, userData.role, `perform ${operation} on this user`)
        } catch (error) {
          results.failed.push({
            userId,
            reason: error.message
          })
          continue
        }
        
        // Perform the operation
        switch (operation) {
          case 'role_change':
            await admin.firestore().collection('users').doc(userId).update({
              role: operationData.newRole,
              updatedAt: admin.firestore.FieldValue.serverTimestamp(),
              lastModifiedBy: context.auth.uid
            })
            await admin.auth().setCustomUserClaims(userId, {
              role: operationData.newRole,
              status: userData.status || 'active'
            })
            break
            
          case 'status_change':
            await admin.firestore().collection('users').doc(userId).update({
              status: operationData.newStatus,
              updatedAt: admin.firestore.FieldValue.serverTimestamp(),
              lastModifiedBy: context.auth.uid
            })
            const disabled = operationData.newStatus === 'suspended' || operationData.newStatus === 'disabled'
            await admin.auth().updateUser(userId, { disabled })
            break
            
          case 'delete':
            await admin.auth().deleteUser(userId)
            await admin.firestore().collection('users').doc(userId).delete()
            break
        }
        
        results.success.push({
          userId,
          email: userData.email
        })
        
      } catch (error) {
        console.error(`Error processing user ${userId}:`, error)
        results.failed.push({
          userId,
          reason: error.message || 'Unknown error'
        })
      }
      
      results.totalProcessed++
    }
    
    // Create audit log for bulk operation
    await createSimpleAuditLog({
      action: 'bulk_user_operation',
      userId: context.auth.uid,
      userEmail: context.auth.token.email || 'unknown',
      details: {
        operation: operation,
        operationData: operationData,
        totalRequested: userIds.length,
        totalProcessed: results.totalProcessed,
        successCount: results.success.length,
        failureCount: results.failed.length,
        reason: operationData.reason || 'Bulk administrative action'
      }
    })
    
    return {
      success: true,
      message: `Bulk operation completed. ${results.success.length} succeeded, ${results.failed.length} failed.`,
      results: results
    }
    
  } catch (error) {
    console.error('Error in bulk user operation:', error)
    
    if (error instanceof functions.https.HttpsError) {
      throw error
    }
    
    throw new functions.https.HttpsError('internal', 'Failed to complete bulk operation')
  }
})

/* ---------- Get User Details Function ---------- */

/**
 * Get detailed user information including permissions
 */
exports.getUserDetails = functions.https.onCall(async (data, context) => {
  validateAuth(context)
  
  const { userId } = data
  validateUserId(userId)
  
  try {
    // Check if requesting own data or if admin
    const isOwnData = context.auth.uid === userId
    
    if (!isOwnData) {
      const callerPerms = await getUserPermissions(context.auth.uid)
      validatePermission(callerPerms, 'view_users', 'view user details')
    }
    
    // Get user data from Firestore
    const userDoc = await admin.firestore().collection('users').doc(userId).get()
    if (!userDoc.exists) {
      throw new functions.https.HttpsError('not-found', 'User not found')
    }
    
    const userData = userDoc.data()
    
    // Get Firebase Auth data
    let authData = null
    try {
      const authUser = await admin.auth().getUser(userId)
      authData = {
        emailVerified: authUser.emailVerified,
        disabled: authUser.disabled,
        lastSignInTime: authUser.metadata.lastSignInTime,
        creationTime: authUser.metadata.creationTime,
        customClaims: authUser.customClaims
      }
    } catch (error) {
      console.warn(`Could not get auth data for user ${userId}:`, error.message)
    }
    
    // Create audit log for viewing user details (except for own data)
    if (!isOwnData) {
      await createSimpleAuditLog({
        action: 'user_details_viewed',
        userId: context.auth.uid,
        userEmail: context.auth.token.email || 'unknown',
        targetUserId: userId,
        details: {
          targetUserEmail: userData.email,
          viewedBy: 'admin_panel'
        }
      })
    }
    
    return {
      success: true,
      userData: {
        ...userData,
        authData: authData
      }
    }
    
  } catch (error) {
    console.error('Error getting user details:', error)
    
    if (error instanceof functions.https.HttpsError) {
      throw error
    }
    
    throw new functions.https.HttpsError('internal', 'Failed to get user details')
  }
})

console.log('✅ User Management Functions loaded - 7 functions available')
console.log('📋 Functions: deleteUser, createUser, updateUserRole, updateUserProfile, updateUserStatus, bulkUpdateUsers, getUserDetails')