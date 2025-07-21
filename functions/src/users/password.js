// functions/src/users/password.js
// OPHV2 User Password Management - Admin password reset functionality
// Handles password reset operations with proper permissions and audit logging

const functions = require('firebase-functions/v1')
const admin = require('firebase-admin')

// Import utility functions
const { 
  validateAuth, 
  validatePermission, 
  validateUserManagement,
  validateUserId,
  getUserPermissions 
} = require('../utils/permissions')

const { createSimpleAuditLog } = require('./helpers')

/* ---------- Reset User Password Function ---------- */

/**
 * Reset a user's password - Admin only function
 * Allows administrators to set a new password for users
 */
exports.resetUserPassword = functions.https.onCall(async (data, context) => {
  console.log('🔐 ResetUserPassword function called')
  
  validateAuth(context)
  
  const { userId, newPassword, requirePasswordChange } = data
  
  // Validate inputs
  validateUserId(userId)
  
  if (!newPassword || newPassword.length < 6) {
    throw new functions.https.HttpsError('invalid-argument', 'Password must be at least 6 characters')
  }
  
  // Prevent self password reset (must use profile security tab)
  if (context.auth.uid === userId) {
    throw new functions.https.HttpsError('permission-denied', 'Cannot reset your own password through admin panel. Use your profile security settings.')
  }
  
  try {
    // Check permissions
    const callerPerms = await getUserPermissions(context.auth.uid)
    validatePermission(callerPerms, 'manage_users', 'reset user passwords')
    
    // Get target user data
    const targetUserDoc = await admin.firestore().collection('users').doc(userId).get()
    if (!targetUserDoc.exists) {
      throw new functions.https.HttpsError('not-found', 'User not found')
    }
    
    const targetUserData = targetUserDoc.data()
    
    // Validate permission hierarchy
    validateUserManagement(callerPerms, targetUserData)
    
    // Update the password in Firebase Auth
    await admin.auth().updateUser(userId, {
      password: newPassword
    })
    
    // Update Firestore document with password reset info
    const updateData = {
      passwordResetAt: admin.firestore.FieldValue.serverTimestamp(),
      passwordResetBy: context.auth.uid,
      requirePasswordChange: requirePasswordChange || false,
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    }
    
    await admin.firestore().collection('users').doc(userId).update(updateData)
    
    // Create detailed audit log
    await createSimpleAuditLog({
      action: 'admin_password_reset',
      userId: context.auth.uid,
      userEmail: context.auth.token.email || 'unknown',
      targetUserId: userId,
      details: {
        targetUserEmail: targetUserData.email,
        targetUserRole: targetUserData.role,
        requirePasswordChange: requirePasswordChange || false,
        resetMethod: 'admin_panel',
        adminRole: callerPerms.role
      }
    })
    
    console.log(`✅ Password reset successfully for user ${userId} by admin ${context.auth.uid}`)
    
    return {
      success: true,
      message: 'Password reset successfully',
      userId: userId,
      requirePasswordChange: requirePasswordChange || false
    }
    
  } catch (error) {
    console.error('Error resetting user password:', error)
    
    if (error instanceof functions.https.HttpsError) {
      throw error
    }
    
    // Handle specific Firebase Auth errors
    if (error.code === 'auth/weak-password') {
      throw new functions.https.HttpsError('invalid-argument', 'Password is too weak. Please use a stronger password.')
    }
    
    if (error.code === 'auth/user-not-found') {
      throw new functions.https.HttpsError('not-found', 'User authentication record not found')
    }
    
    throw new functions.https.HttpsError('internal', 'Failed to reset password')
  }
})

console.log('✅ User Password Management loaded - 1 function available')
console.log('📋 Functions: resetUserPassword')