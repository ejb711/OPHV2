// functions/src/users/management.js - Complete User Management Functions
// CRUD operations for user accounts with proper permission checks

const functions = require('firebase-functions/v1')
const admin = require('firebase-admin')
const { 
  getUserPermissions, 
  validateAuth, 
  validatePermission, 
  validateUserManagement,
  validateUserId,
  validateEmail,
  validateRole,
  preventSelfTargeting,
  checkRateLimit
} = require('../utils/permissions')
const { createAuditLog } = require('../audit/logging')

/* ---------- Delete User Function ---------- */

/**
 * Securely delete a user account and all associated data
 * Only admins can delete users, with proper permission checks
 */
exports.deleteUser = functions.https.onCall(async (data, context) => {
  // Validate authentication
  validateAuth(context)
  
  const { userId, reason } = data
  validateUserId(userId)
  
  // Prevent self-deletion
  preventSelfTargeting(context.auth.uid, userId, 'delete your own account')
  
  // Rate limiting for delete operations
  if (!checkRateLimit(context.auth.uid, 'delete_user', 5)) {
    throw new functions.https.HttpsError('resource-exhausted', 'Too many deletion attempts. Please wait.')
  }
  
  try {
    // Get caller permissions
    const callerPerms = await getUserPermissions(context.auth.uid)
    validatePermission(callerPerms, 'delete_users', 'delete users')
    
    // Get target user data before deletion
    const targetUserDoc = await admin.firestore().collection('users').doc(userId).get()
    if (!targetUserDoc.exists) {
      throw new functions.https.HttpsError('not-found', 'User not found')
    }
    
    const targetUserData = targetUserDoc.data()
    
    // Prevent deletion of higher-privilege users
    validateUserManagement(callerPerms, targetUserData.role, 'delete this user')
    
    // Create audit log before deletion
    await createSimpleAuditLog({
      action: 'user_deleted_by_admin',
      userId: context.auth.uid,
      userEmail: context.auth.token.email || 'unknown',
      targetUserId: userId,
      targetUserEmail: targetUserData.email,
      details: {
        deletedUserRole: targetUserData.role,
        deletedBy: context.auth.uid,
        deleterRole: callerPerms.role,
        reason: reason || 'Administrative action',
        userData: {
          displayName: targetUserData.displayName,
          email: targetUserData.email,
          role: targetUserData.role,
          createdAt: targetUserData.createdAt
        }
      }
    })
    
    // Delete from Firebase Auth first
    try {
      await admin.auth().deleteUser(userId)
    } catch (authError) {
      console.warn('Firebase Auth deletion failed (user may not exist):', authError.message)
    }
    
    // Delete from Firestore
    await admin.firestore().collection('users').doc(userId).delete()
    
    // Clean up related data (user-specific documents, etc.)
    // TODO: Add cleanup of user-specific subcollections if they exist
    
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
  
  /**
 * Validate email parameter
 * @param {string} email - Email to validate
 * @throws {functions.https.HttpsError} If validation fails
 */
function validateEmail(email) {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  if (!email || typeof email !== 'string' || !emailRegex.test(email)) {
    throw new functions.https.HttpsError('invalid-argument', 'Valid email is required')
  }
}
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
      // If user doesn't exist, continue (this is what we want)
      if (error.code !== 'auth/user-not-found') {
        throw error
      }
    }
    
    // Validate region if provided
    const validRegions = ['1', '2', '3', '4', '5', '6', '7', '8', '9', 'central']
    if (region && !validRegions.includes(region)) {
      throw new functions.https.HttpsError('invalid-argument', 'Invalid region specified')
    }

    // Validate phone format if provided
    if (phone && !/^\(\d{3}\)\s\d{3}-\d{4}$/.test(phone)) {
      throw new functions.https.HttpsError('invalid-argument', 'Phone number must be in format (XXX) XXX-XXXX')
    }
    
    // Create Firebase Auth user with display name
    const userRecord = await admin.auth().createUser({
      email: email.toLowerCase().trim(),
      password,
      displayName: displayName.trim(),
      emailVerified: false
    })
    
    // Create comprehensive Firestore user document with all profile fields
    const userData = {
      // Basic account info
      email: email.toLowerCase().trim(),
      displayName: displayName.trim(),
      photoURL: null,
      role: role || 'user',
      status: 'active',
      
      // Profile information
      phone: phone || '',
      department: department || '',
      title: title || '',
      region: region || '',
      location: location || '',
      bio: bio || '',
      
      // Permissions
      customPermissions: [],
      deniedPermissions: [],
      
      // Timestamps
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      lastActive: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      
      // Metadata
      createdBy: context.auth.uid,
      
      // Preferences
      preferences: {
        theme: 'light',
        notifications: true,
        language: 'en'
      }
    }
    
    await admin.firestore().collection('users').doc(userRecord.uid).set(userData)
    
    // Create detailed audit log
    await createSimpleAuditLog({
      action: 'user_created_by_admin',
      userId: context.auth.uid,
      userEmail: context.auth.token.email || 'unknown',
      targetUserId: userRecord.uid,
      targetUserEmail: email,
      details: {
        assignedRole: role,
        createdBy: context.auth.uid,
        creatorRole: callerPerms.role,
        sendWelcomeEmail: sendWelcomeEmail || false,
        profileData: {
          displayName: displayName.trim(),
          department: department || null,
          title: title || null,
          region: region || null,
          location: location || null,
          hasPhone: !!phone,
          hasBio: !!bio
        }
      }
    })
    
    // TODO: Send welcome email if requested
    if (sendWelcomeEmail) {
      console.log(`📧 Welcome email should be sent to: ${email}`)
      console.log(`   Display Name: ${displayName}`)
      console.log(`   Role: ${role}`)
      console.log(`   Department: ${department || 'Not specified'}`)
      console.log(`   Region: ${region || 'Not specified'}`)
    }
    
    return {
      success: true,
      message: 'User created successfully with complete profile',
      userId: userRecord.uid,
      email: email,
      displayName: displayName.trim(),
      role: role,
      profileFields: {
        department: department || null,
        title: title || null,
        region: region || null,
        location: location || null,
        phone: phone || null,
        bio: bio || null
      }
    }
    
  } catch (error) {
    console.error('Error creating user:', error)
    
    // Create audit log for failed creation
    await createSimpleAuditLog({
      action: 'user_creation_failed',
      userId: context.auth.uid,
      userEmail: context.auth.token.email || 'unknown',
      details: {
        targetEmail: email,
        attemptedRole: role,
        displayName: displayName || null,
        error: error.message,
        errorCode: error.code || 'unknown',
        profileFieldsAttempted: {
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
    
    // Create audit log
    await createSimpleAuditLog({
      action: 'user_role_updated',
      userId: context.auth.uid,
      userEmail: context.auth.token.email || 'unknown',
      targetUserId: userId,
      targetUserEmail: targetUserData.email,
      details: {
        oldRole,
        newRole,
        updatedBy: context.auth.uid,
        updaterRole: callerPerms.role,
        reason: reason || 'Administrative action'
      }
    })
    
    return {
      success: true,
      message: `User role updated from ${oldRole} to ${newRole}`,
      userId,
      oldRole,
      newRole
    }
    
  } catch (error) {
    console.error('Error updating user role:', error)
    
    if (error instanceof functions.https.HttpsError) {
      throw error
    }
    
    throw new functions.https.HttpsError('internal', 'Failed to update user role')
  }
})

/* ---------- Update User Profile Function ---------- */

/**
 * Update user profile information including region field
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
  
  if (!userId) {
    throw new functions.https.HttpsError('invalid-argument', 'User ID is required')
  }
  
  try {
    // Check permissions - users can edit their own profile, admins can edit others
    const callerPerms = await getUserPermissions(context.auth.uid)
    const isEditingSelf = context.auth.uid === userId
    
    if (!isEditingSelf && !callerPerms.hasPermission('edit_users')) {
      throw new functions.https.HttpsError('permission-denied', 'Cannot edit other users profiles')
    }
    
    // Validate region if provided
    const validRegions = ['1', '2', '3', '4', '5', '6', '7', '8', '9', 'central']
    if (region && !validRegions.includes(region)) {
      throw new functions.https.HttpsError('invalid-argument', 'Invalid region specified')
    }

    // Validate phone format if provided
    if (phone && !/^\(\d{3}\)\s\d{3}-\d{4}$/.test(phone)) {
      throw new functions.https.HttpsError('invalid-argument', 'Phone number must be in format (XXX) XXX-XXXX')
    }
    
    // Get current user data
    const userDoc = await admin.firestore().collection('users').doc(userId).get()
    if (!userDoc.exists) {
      throw new functions.https.HttpsError('not-found', 'User not found')
    }
    
    const currentData = userDoc.data()
    
    // Prepare update data
    const updateData = {
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    }
    
    // Only update fields that are provided
    if (displayName !== undefined) updateData.displayName = displayName.trim()
    if (phone !== undefined) updateData.phone = phone
    if (department !== undefined) updateData.department = department
    if (title !== undefined) updateData.title = title
    if (region !== undefined) updateData.region = region
    if (location !== undefined) updateData.location = location
    if (bio !== undefined) updateData.bio = bio
    
    // Update Firestore document
    await admin.firestore().collection('users').doc(userId).update(updateData)
    
    // Update Firebase Auth displayName if changed
    if (displayName !== undefined && displayName.trim() !== currentData.displayName) {
      await admin.auth().updateUser(userId, {
        displayName: displayName.trim()
      })
    }
    
    // Create audit log
    await createSimpleAuditLog({
      action: isEditingSelf ? 'profile_updated' : 'user_profile_updated_by_admin',
      userId: context.auth.uid,
      userEmail: context.auth.token.email || 'unknown',
      targetUserId: userId,
      details: {
        updatedBy: context.auth.uid,
        updaterRole: callerPerms.role,
        isEditingSelf,
        changes: {
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
  
  try {
    // Get permissions
    const callerPerms = await getUserPermissions(context.auth.uid)
    validatePermission(callerPerms, 'edit_users', 'update user status')
    
    // Get target user
    const targetUserDoc = await admin.firestore().collection('users').doc(userId).get()
    if (!targetUserDoc.exists) {
      throw new functions.https.HttpsError('not-found', 'User not found')
    }
    
    const targetUserData = targetUserDoc.data()
    validateUserManagement(callerPerms, targetUserData.role, 'modify this user')
    
    const oldStatus = targetUserData.status || 'active'
    
    // Update status
    await admin.firestore().collection('users').doc(userId).update({
      status,
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      lastModifiedBy: context.auth.uid
    })
    
    // Disable Firebase Auth account if suspended or disabled
    if (status === 'suspended' || status === 'disabled') {
      await admin.auth().updateUser(userId, { disabled: true })
    } else if (status === 'active') {
      await admin.auth().updateUser(userId, { disabled: false })
    }
    
    // Create audit log
    await createSimpleAuditLog({
      action: 'user_status_updated',
      userId: context.auth.uid,
      userEmail: context.auth.token.email || 'unknown',
      targetUserId: userId,
      targetUserEmail: targetUserData.email,
      details: {
        oldStatus,
        newStatus: status,
        updatedBy: context.auth.uid,
        updaterRole: callerPerms.role,
        reason: reason || 'Administrative action'
      }
    })
    
    return {
      success: true,
      message: `User status updated from ${oldStatus} to ${status}`,
      userId,
      oldStatus,
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

/* ---------- Bulk User Operations ---------- */

/**
 * Bulk update multiple users (role, status, etc.)
 */
exports.bulkUpdateUsers = functions.https.onCall(async (data, context) => {
  validateAuth(context)
  
  const { userIds, updates, reason } = data
  
  if (!Array.isArray(userIds) || userIds.length === 0) {
    throw new functions.https.HttpsError('invalid-argument', 'User IDs array is required')
  }
  
  if (userIds.length > 50) {
    throw new functions.https.HttpsError('invalid-argument', 'Cannot update more than 50 users at once')
  }
  
  if (!updates || typeof updates !== 'object') {
    throw new functions.https.HttpsError('invalid-argument', 'Updates object is required')
  }
  
  try {
    // Get permissions
    const callerPerms = await getUserPermissions(context.auth.uid)
    validatePermission(callerPerms, 'edit_users', 'bulk update users')
    
    const results = []
    const batch = admin.firestore().batch()
    
    // Process each user
    for (const userId of userIds) {
      try {
        validateUserId(userId)
        
        // Get user data
        const userDoc = await admin.firestore().collection('users').doc(userId).get()
        if (!userDoc.exists) {
          results.push({ userId, success: false, error: 'User not found' })
          continue
        }
        
        const userData = userDoc.data()
        validateUserManagement(callerPerms, userData.role, 'bulk update this user')
        
        // Prepare update
        const updateData = {
          ...updates,
          updatedAt: admin.firestore.FieldValue.serverTimestamp(),
          lastModifiedBy: context.auth.uid
        }
        
        batch.update(admin.firestore().collection('users').doc(userId), updateData)
        results.push({ userId, success: true })
        
      } catch (error) {
        results.push({ userId, success: false, error: error.message })
      }
    }
    
    // Commit batch update
    await batch.commit()
    
    // Create audit log
    await createSimpleAuditLog({
      action: 'bulk_user_update',
      userId: context.auth.uid,
      userEmail: context.auth.token.email || 'unknown',
      details: {
        targetUserIds: userIds,
        updates,
        updatedBy: context.auth.uid,
        updaterRole: callerPerms.role,
        reason: reason || 'Bulk administrative action',
        results
      }
    })
    
    return {
      success: true,
      message: `Bulk update completed`,
      results,
      totalProcessed: userIds.length,
      successCount: results.filter(r => r.success).length,
      errorCount: results.filter(r => !r.success).length
    }
    
  } catch (error) {
    console.error('Error in bulk user update:', error)
    
    if (error instanceof functions.https.HttpsError) {
      throw error
    }
    
    throw new functions.https.HttpsError('internal', 'Failed to perform bulk user update')
  }
})

/* ---------- Get User Details Function ---------- */

/**
 * Get detailed user information (for admin use)
 */
exports.getUserDetails = functions.https.onCall(async (data, context) => {
  validateAuth(context)
  
  const { userId } = data
  validateUserId(userId)
  
  try {
    // Get permissions
    const callerPerms = await getUserPermissions(context.auth.uid)
    const isViewingSelf = context.auth.uid === userId
    
    if (!isViewingSelf && !callerPerms.hasPermission('view_users')) {
      throw new functions.https.HttpsError('permission-denied', 'Cannot view other users details')
    }
    
    // Get user data
    const userDoc = await admin.firestore().collection('users').doc(userId).get()
    if (!userDoc.exists) {
      throw new functions.https.HttpsError('not-found', 'User not found')
    }
    
    const userData = userDoc.data()
    
    // Get Firebase Auth data
    let authData = null
    try {
      authData = await admin.auth().getUser(userId)
    } catch (error) {
      console.warn('Could not fetch Firebase Auth data:', error.message)
    }
    
    // Sanitize data based on permissions
    const response = {
      uid: userId,
      email: userData.email,
      displayName: userData.displayName,
      role: userData.role,
      status: userData.status || 'active',
      createdAt: userData.createdAt,
      lastActive: userData.lastActive,
      customPermissions: userData.customPermissions || [],
      deniedPermissions: userData.deniedPermissions || []
    }
    
    // Add profile information if viewing self or has permission
    if (isViewingSelf || callerPerms.hasPermission('view_user_profiles')) {
      response.profile = {
        phone: userData.phone || '',
        department: userData.department || '',
        title: userData.title || '',
        region: userData.region || '',
        location: userData.location || '',
        bio: userData.bio || ''
      }
    }
    
    // Add administrative information if admin
    if (callerPerms.hasPermission('view_user_admin_info')) {
      response.adminInfo = {
        createdBy: userData.createdBy,
        lastModifiedBy: userData.lastModifiedBy,
        emailVerified: authData?.emailVerified || false,
        disabled: authData?.disabled || false,
        lastSignInTime: authData?.metadata?.lastSignInTime,
        creationTime: authData?.metadata?.creationTime,
        preferences: userData.preferences || {}
      }
    }
    
    return {
      success: true,
      user: response
    }
    
  } catch (error) {
    console.error('Error getting user details:', error)
    
    if (error instanceof functions.https.HttpsError) {
      throw error
    }
    
    throw new functions.https.HttpsError('internal', 'Failed to get user details')
  }
})