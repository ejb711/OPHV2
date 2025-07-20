// functions/src/users/status.js
// OPHV2 User Status Management Operations
// File size: ~120 lines (well under 350 line limit)

const functions = require('firebase-functions/v1')
const admin = require('firebase-admin')

// Import utility functions
const { 
  validateAuth, 
  validatePermission, 
  validateUserManagement,
  validateUserId,
  preventSelfTargeting,
  getUserPermissions 
} = require('../utils/permissions')

const { createSimpleAuditLog } = require('./helpers')

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

console.log('✅ User Status Functions loaded - 1 function available')
console.log('📋 Status Functions: updateUserStatus')