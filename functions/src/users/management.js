// functions/src/users/management.js - User Management Functions
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
const { getRetentionTier, getCompressionDate, getDeletionDate } = require('../config/audit')

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
  
  // Rate limiting
  if (!checkRateLimit(context.auth.uid, 'delete_user', 5)) {
    throw new functions.https.HttpsError('resource-exhausted', 'Too many deletion attempts. Please wait.')
  }
  
  try {
    // Get caller's permissions
    const callerPerms = await getUserPermissions(context.auth.uid)
    validatePermission(callerPerms, 'delete_users', 'delete users')
    
    // Get target user to verify permissions
    const targetUserDoc = await admin.firestore().collection('users').doc(userId).get()
    if (!targetUserDoc.exists) {
      throw new functions.https.HttpsError('not-found', 'User not found')
    }
    
    const targetUserData = targetUserDoc.data()
    validateUserManagement(callerPerms, targetUserData.role, 'delete user')
    
    // Create comprehensive audit log before deletion
    await createAuditLog({
      action: 'user_deleted',
      userId: context.auth.uid,
      userEmail: context.auth.token.email || 'unknown',
      targetUserId: userId,
      targetUserEmail: targetUserData.email || 'unknown',
      details: {
        deletedUserRole: targetUserData.role,
        deletedUserEmail: targetUserData.email,
        deletedUserStatus: targetUserData.status,
        reason: reason || 'Administrative action',
        deletionMethod: 'cloud_function',
        callerRole: callerPerms.role,
        timestamp: new Date().toISOString()
      }
    })
    
    // Delete user document from Firestore
    await admin.firestore().collection('users').doc(userId).delete()
    
    // Try to delete the Firebase Auth user
    try {
      await admin.auth().deleteUser(userId)
      console.log(`✅ Deleted Auth user: ${userId}`)
    } catch (authError) {
      console.warn(`⚠️ Could not delete auth user ${userId}:`, authError.message)
      // Don't throw error - user might only exist in Firestore
    }
    
    // Clean up related user data asynchronously
    cleanupUserData(userId, targetUserData.email)
      .catch(error => console.error('Error in async user data cleanup:', error))
    
    return {
      success: true,
      message: 'User deleted successfully',
      deletedUserId: userId,
      deletedAt: new Date().toISOString()
    }
    
  } catch (error) {
    console.error('Error deleting user:', error)
    
    // Create audit log for failed deletion
    await createAuditLog({
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
 * Create a new user account with specified role and permissions
 */
exports.createUser = functions.https.onCall(async (data, context) => {
  validateAuth(context)
  
  const { email, password, role, sendWelcomeEmail } = data
  validateEmail(email)
  validateRole(role)
  
  if (!password || password.length < 6) {
    throw new functions.https.HttpsError('invalid-argument', 'Password must be at least 6 characters')
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
    
    // Create Firebase Auth user
    const userRecord = await admin.auth().createUser({
      email: email.toLowerCase().trim(),
      password,
      emailVerified: false
    })
    
    // Create Firestore user document
    const userData = {
      email: email.toLowerCase().trim(),
      displayName: null,
      photoURL: null,
      role: role || 'user',
      status: 'active',
      customPermissions: [],
      deniedPermissions: [],
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      lastActive: admin.firestore.FieldValue.serverTimestamp(),
      createdBy: context.auth.uid,
      preferences: {
        theme: 'light',
        notifications: true,
        language: 'en'
      }
    }
    
    await admin.firestore().collection('users').doc(userRecord.uid).set(userData)
    
    // Create audit log
    await createAuditLog({
      action: 'user_created_by_admin',
      userId: context.auth.uid,
      userEmail: context.auth.token.email || 'unknown',
      targetUserId: userRecord.uid,
      targetUserEmail: email,
      details: {
        assignedRole: role,
        createdBy: context.auth.uid,
        creatorRole: callerPerms.role,
        sendWelcomeEmail: sendWelcomeEmail || false
      }
    })
    
    // TODO: Send welcome email if requested
    if (sendWelcomeEmail) {
      // Implement email sending logic here
      console.log(`📧 Welcome email should be sent to: ${email}`)
    }
    
    return {
      success: true,
      message: 'User created successfully',
      userId: userRecord.uid,
      email: email
    }
    
  } catch (error) {
    console.error('Error creating user:', error)
    
    // Create audit log for failed creation
    await createAuditLog({
      action: 'user_creation_failed',
      userId: context.auth.uid,
      userEmail: context.auth.token.email || 'unknown',
      details: {
        targetEmail: email,
        attemptedRole: role,
        error: error.message,
        errorCode: error.code || 'unknown'
      }
    })
    
    if (error instanceof functions.https.HttpsError) {
      throw error
    }
    
    throw new functions.https.HttpsError('internal', 'Failed to create user')
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
    
    // Validate permissions for both old and new roles
    validateUserManagement(callerPerms, oldRole, 'modify user')
    validateUserManagement(callerPerms, newRole, 'assign role')
    
    // Update user role
    await admin.firestore().collection('users').doc(userId).update({
      role: newRole,
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedBy: context.auth.uid
    })
    
    // Create audit log
    await createAuditLog({
      action: 'user_role_changed',
      userId: context.auth.uid,
      userEmail: context.auth.token.email || 'unknown',
      targetUserId: userId,
      targetUserEmail: targetUserData.email,
      details: {
        oldRole,
        newRole,
        reason: reason || 'Administrative action',
        changedBy: context.auth.uid,
        changerRole: callerPerms.role
      }
    })
    
    return {
      success: true,
      message: 'User role updated successfully',
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

/* ---------- Helper Functions ---------- */

/**
 * Clean up all user-related data asynchronously
 * @param {string} userId - User ID
 * @param {string} userEmail - User email for logging
 */
async function cleanupUserData(userId, userEmail) {
  try {
    const batch = admin.firestore().batch()
    let cleanupCount = 0
    
    // Collections to clean up
    const collectionsToClean = [
      'user_sessions',
      'user_preferences',
      'user_notifications',
      'user_activity',
      'user_files',
      'user_projects'
    ]
    
    for (const collectionName of collectionsToClean) {
      const query = await admin.firestore()
        .collection(collectionName)
        .where('userId', '==', userId)
        .limit(500)
        .get()
      
      query.docs.forEach(doc => {
        batch.delete(doc.ref)
        cleanupCount++
      })
    }
    
    // Remove user from any group memberships, project assignments, etc.
    const userReferences = await admin.firestore()
      .collectionGroup('members')
      .where('userId', '==', userId)
      .get()
    
    userReferences.docs.forEach(doc => {
      batch.delete(doc.ref)
      cleanupCount++
    })
    
    if (cleanupCount > 0) {
      await batch.commit()
      console.log(`✅ Cleaned up ${cleanupCount} related documents for user: ${userId}`)
    }
    
    // Create audit log for cleanup
    await createAuditLog({
      action: 'user_data_cleanup',
      userId: 'system',
      userEmail: 'system@ophv2.app',
      targetUserId: userId,
      targetUserEmail: userEmail,
      details: {
        cleanupCount,
        collections: collectionsToClean,
        completedAt: new Date().toISOString()
      }
    })
    
  } catch (error) {
    console.error('Error cleaning up user data:', error)
    
    await createAuditLog({
      action: 'user_data_cleanup_failed',
      userId: 'system',
      userEmail: 'system@ophv2.app',
      targetUserId: userId,
      targetUserEmail: userEmail,
      details: {
        error: error.message,
        failedAt: new Date().toISOString()
      }
    })
  }
}

/**
 * Create audit log entry
 * @param {Object} logData - Audit log data
 */
async function createAuditLog(logData) {
  try {
    const auditEntry = {
      ...logData,
      timestamp: admin.firestore.FieldValue.serverTimestamp(),
      retentionTier: getRetentionTier(logData.action),
      compressAfter: getCompressionDate(logData.action),
      deleteAfter: getDeletionDate(logData.action),
      userAgent: 'cloud-function',
      ipAddress: 'internal'
    }
    
    await admin.firestore().collection('audit_logs').add(auditEntry)
    
  } catch (error) {
    console.error('Failed to create audit log:', error)
  }
}