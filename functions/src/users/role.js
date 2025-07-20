// functions/src/users/role.js
// OPHV2 User Role Management Operations
// File size: ~120 lines (well under 350 line limit)

const functions = require('firebase-functions/v1')
const admin = require('firebase-admin')

// Import utility functions
const { 
  validateAuth, 
  validatePermission, 
  validateUserManagement,
  validateUserId,
  validateRole,
  preventSelfTargeting,
  getUserPermissions 
} = require('../utils/permissions')

const { createSimpleAuditLog } = require('./helpers')

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

console.log('✅ User Role Functions loaded - 1 function available')
console.log('📋 Role Functions: updateUserRole')