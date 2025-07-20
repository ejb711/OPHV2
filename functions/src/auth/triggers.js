// functions/src/auth/triggers.js
// OPHV2 Authentication Event Triggers - FIXED
// Handles Firebase Auth user lifecycle events without overwriting admin-created users

const functions = require('firebase-functions/v1')
const admin = require('firebase-admin')

/* ---------- User Creation Handler ---------- */

/**
 * Handle new user creation in Firebase Auth
 * Creates user document ONLY if it doesn't already exist
 * This prevents overwriting admin-created users with profile data
 */
exports.onUserCreated = functions.auth.user().onCreate(async (user) => {
  try {
    console.log(`Auth trigger: New user detected: ${user.email} (${user.uid})`)
    
    // CRITICAL FIX: Check if user document already exists
    const existingDoc = await admin.firestore().collection('users').doc(user.uid).get()
    
    if (existingDoc.exists) {
      console.log(`✅ User document already exists for ${user.email}, preserving existing data`)
      
      // Just update the auth-related fields without overwriting profile data
      await admin.firestore().collection('users').doc(user.uid).update({
        lastActive: admin.firestore.FieldValue.serverTimestamp(),
        'metadata.emailVerified': user.emailVerified || false,
        'metadata.lastSignInTime': user.metadata?.lastSignInTime || null
      })
      
      // Create audit log for existing user
      await createSimpleAuditLog({
        action: 'user_auth_linked',
        userId: 'system',
        userEmail: 'system@ophv2.app',
        targetUserId: user.uid,
        details: {
          email: user.email,
          documentExisted: true,
          creationMethod: 'admin_panel'
        }
      })
      
      return
    }
    
    // Only create new document if it doesn't exist (self-registration flow)
    console.log(`Creating new user document for self-registered user: ${user.email}`)
    
    const userData = {
      email: user.email,
      displayName: user.displayName || null,
      photoURL: user.photoURL || null,
      role: 'pending',
      status: 'pending',
      
      // Initialize profile fields as empty strings (matching admin creation)
      phone: '',
      department: '',
      title: '',
      region: '',
      location: '',
      bio: '',
      
      // Permission arrays
      customPermissions: [],
      deniedPermissions: [],
      
      // Metadata
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      lastActive: admin.firestore.FieldValue.serverTimestamp(),
      createdBy: 'system',
      
      // Preferences
      preferences: {
        theme: 'light',
        notifications: true,
        language: 'en'
      },
      
      // Auth metadata
      metadata: {
        provider: user.providerData[0]?.providerId || 'unknown',
        emailVerified: user.emailVerified || false,
        creationTime: user.metadata?.creationTime || new Date().toISOString()
      }
    }
    
    await admin.firestore().collection('users').doc(user.uid).set(userData)
    
    // Create audit log entry
    await createSimpleAuditLog({
      action: 'user_created',
      userId: 'system',
      userEmail: 'system@ophv2.app',
      targetUserId: user.uid,
      details: {
        email: user.email,
        provider: user.providerData[0]?.providerId || 'unknown',
        emailVerified: user.emailVerified || false,
        creationMethod: 'self_registration'
      }
    })

    console.log(`✅ User document created for self-registered user: ${user.email}`)
    
  } catch (error) {
    console.error('❌ Error in onUserCreated:', error)
    
    // Try to create a minimal audit log even if user creation failed
    try {
      await createSimpleAuditLog({
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
    await createSimpleAuditLog({
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
      await createSimpleAuditLog({
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
 * Create simple audit log entry directly to Firestore
 * @param {Object} logData - Audit log data
 */
async function createSimpleAuditLog(logData) {
  try {
    await admin.firestore().collection('audit_logs').add({
      ...logData,
      timestamp: admin.firestore.FieldValue.serverTimestamp(),
      source: 'auth_trigger'
    })
  } catch (error) {
    console.error('Error creating audit log:', error)
    // Don't throw - audit logging shouldn't break main functionality
  }
}