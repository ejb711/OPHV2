// functions/src/users/bulk.js
// OPHV2 User Bulk Operations
// File size: ~180 lines (well under 350 line limit)

const functions = require('firebase-functions/v1')
const admin = require('firebase-admin')

// Import utility functions
const { 
  validateAuth, 
  validatePermission, 
  validateUserManagement,
  getUserPermissions 
} = require('../utils/permissions')

const { createSimpleAuditLog } = require('./helpers')

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

console.log('✅ User Bulk Functions loaded - 1 function available')
console.log('📋 Bulk Functions: bulkUpdateUsers')