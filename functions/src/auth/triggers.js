// functions/src/auth/triggers.js - Authentication Event Handlers
// Handles Firebase Auth user lifecycle events

const functions = require('firebase-functions/v1')
const admin = require('firebase-admin')
const { getRetentionTier, getCompressionDate, getDeletionDate } = require('../config/audit')

/* ---------- User Creation Handler ---------- */

/**
 * Handle new user creation in Firebase Auth
 * Creates corresponding user document in Firestore
 */
exports.onUserCreated = functions.auth.user().onCreate(async (user) => {
  try {
    console.log(`New user created: ${user.email} (${user.uid})`)
    
    // Create user document with default pending role
    const userData = {
      email: user.email,
      displayName: user.displayName || null,
      photoURL: user.photoURL || null,
      role: 'pending',
      status: 'pending',
      customPermissions: [],
      deniedPermissions: [],
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      lastActive: admin.firestore.FieldValue.serverTimestamp(),
      createdBy: 'system',
      preferences: {
        theme: 'light',
        notifications: true,
        language: 'en'
      },
      metadata: {
        provider: user.providerData[0]?.providerId || 'unknown',
        emailVerified: user.emailVerified || false,
        creationTime: user.metadata?.creationTime || new Date().toISOString()
      }
    }
    
    await admin.firestore().collection('users').doc(user.uid).set(userData)
    
    // Create audit log entry
    await createAuditLog({
      action: 'user_created',
      userId: 'system',
      userEmail: 'system@ophv2.app',
      targetUserId: user.uid,
      details: {
        email: user.email,
        provider: user.providerData[0]?.providerId || 'unknown',
        emailVerified: user.emailVerified || false,
        creationMethod: 'firebase_auth'
      }
    })

    console.log(`✅ User document created for: ${user.email}`)
    
  } catch (error) {
    console.error('❌ Error in onUserCreated:', error)
    
    // Try to create a minimal audit log even if user creation failed
    try {
      await createAuditLog({
        action: 'user_creation_failed',
        userId: 'system',
        userEmail: 'system@ophv2.app',
        targetUserId: user.uid,
        details: {
          email: user.email,
          error: error.message,
          errorCode: error.code || 'unknown'
        }
      })
    } catch (auditError) {
      console.error('Failed to create audit log for failed user creation:', auditError)
    }
  }
})

/* ---------- User Deletion Handler ---------- */

/**
 * Handle user deletion from Firebase Auth
 * Cleans up user document and related data
 */
exports.onUserDeleted = functions.auth.user().onDelete(async (user) => {
  try {
    console.log(`User deleted from Auth: ${user.email} (${user.uid})`)
    
    // Get user data before deletion for audit log
    const userDoc = await admin.firestore().collection('users').doc(user.uid).get()
    const userData = userDoc.exists ? userDoc.data() : null
    
    // Delete user document if it exists
    if (userDoc.exists) {
      await admin.firestore().collection('users').doc(user.uid).delete()
      console.log(`✅ Cleaned up Firestore document for: ${user.uid}`)
    }
    
    // Clean up related user data (batch operations for efficiency)
    const batch = admin.firestore().batch()
    let deletionCount = 0
    
    // Clean up user's personal data collections
    const collectionsToClean = [
      'user_sessions',
      'user_preferences', 
      'user_notifications',
      'user_activity'
    ]
    
    for (const collectionName of collectionsToClean) {
      const userDataQuery = await admin.firestore()
        .collection(collectionName)
        .where('userId', '==', user.uid)
        .limit(500) // Firestore batch limit
        .get()
      
      userDataQuery.docs.forEach(doc => {
        batch.delete(doc.ref)
        deletionCount++
      })
    }
    
    // Commit batch deletion if there's anything to delete
    if (deletionCount > 0) {
      await batch.commit()
      console.log(`✅ Cleaned up ${deletionCount} related documents`)
    }
    
    // Create comprehensive audit log
    await createAuditLog({
      action: 'user_auth_deleted',
      userId: 'system',
      userEmail: 'system@ophv2.app',
      targetUserId: user.uid,
      details: {
        email: user.email || 'unknown',
        role: userData?.role || 'unknown',
        deletionSource: 'firebase_auth',
        cleanupCount: deletionCount,
        hadFirestoreDoc: userDoc.exists,
        lastActive: userData?.lastActive || null
      }
    })

    console.log(`✅ User cleanup completed for: ${user.uid}`)
    
  } catch (error) {
    console.error('❌ Error in onUserDeleted:', error)
    
    // Create audit log for the failure
    try {
      await createAuditLog({
        action: 'user_deletion_cleanup_failed',
        userId: 'system',
        userEmail: 'system@ophv2.app',
        targetUserId: user.uid,
        details: {
          email: user.email || 'unknown',
          error: error.message,
          errorCode: error.code || 'unknown'
        }
      })
    } catch (auditError) {
      console.error('Failed to create audit log for failed user deletion:', auditError)
    }
  }
})

/* ---------- Helper Functions ---------- */

/**
 * Create audit log entry with proper retention settings
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
      ipAddress: 'internal',
      sessionId: 'system'
    }
    
    await admin.firestore().collection('audit_logs').add(auditEntry)
    
  } catch (error) {
    console.error('Failed to create audit log:', error)
    // Don't re-throw - audit log failures shouldn't break main functionality
  }
}

/**
 * Validate user data before creation
 * @param {Object} userData - User data to validate
 * @returns {Object} Validated and sanitized user data
 */
function validateUserData(userData) {
  const sanitized = {
    email: userData.email?.toLowerCase()?.trim(),
    displayName: userData.displayName?.trim() || null,
    photoURL: userData.photoURL?.trim() || null,
    role: 'pending', // Always start as pending
    status: 'pending',
    customPermissions: [],
    deniedPermissions: []
  }
  
  // Validate email format
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  if (!sanitized.email || !emailRegex.test(sanitized.email)) {
    throw new Error('Invalid email format')
  }
  
  // Sanitize display name
  if (sanitized.displayName && sanitized.displayName.length > 100) {
    sanitized.displayName = sanitized.displayName.substring(0, 100)
  }
  
  return sanitized
}

module.exports = {
  onUserCreated: exports.onUserCreated,
  onUserDeleted: exports.onUserDeleted
}