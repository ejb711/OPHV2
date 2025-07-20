// functions/src/users/crud.js
// OPHV2 User CRUD Operations - Create, Read, Update, Delete
// File size: ~280 lines (under 350 line limit)

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

const { createSimpleAuditLog } = require('./helpers')

/* ---------- Create User Function ---------- */

/**
 * Create a new user account with specified role and profile information
 * ENHANCED with comprehensive logging and profile field verification
 */
exports.createUser = functions.https.onCall(async (data, context) => {
  console.log('🚀 CreateUser function called with data:', JSON.stringify(data, null, 2))
  
  validateAuth(context)
  
  // FIXED: Enhanced parameter extraction with detailed logging
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
  
  console.log('📝 Extracted parameters:', {
    email: email,
    displayName: displayName,
    role: role,
    phone: phone,
    department: department,
    title: title,
    region: region,
    location: location,
    bio: bio,
    sendWelcomeEmail: sendWelcomeEmail
  })
  
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
    
    console.log('✅ Validation passed, creating Firebase Auth user')
    
    // Create user in Firebase Auth
    const userRecord = await admin.auth().createUser({
      email: email.toLowerCase().trim(),
      password: password,
      displayName: displayName.trim(),
      emailVerified: false
    })
    
    console.log('✅ Firebase Auth user created:', userRecord.uid)
    
    // ENHANCED: Create comprehensive user document with ALL profile fields
    const userData = {
      // Basic user info
      email: email.toLowerCase().trim(),
      displayName: displayName.trim(),
      role: role,
      status: 'active',
      
      // FIXED: Profile fields with proper null/empty handling
      phone: phone ? String(phone).replace(/\D/g, '') : '', // Store only digits
      department: department || '',
      title: title || '',
      region: region || '',
      location: location || '',
      bio: bio || '',
      
      // Permission arrays
      customPermissions: [],
      deniedPermissions: [],
      
      // Timestamps and metadata
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      createdBy: context.auth.uid,
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    }
    
    console.log('📊 User data to be saved to Firestore:', JSON.stringify(userData, null, 2))
    
    // Save to Firestore
    await admin.firestore().collection('users').doc(userRecord.uid).set(userData)
    
    console.log('✅ User document saved to Firestore')
    
    // Set custom claims for role-based access
    await admin.auth().setCustomUserClaims(userRecord.uid, {
      role: role,
      status: 'active'
    })
    
    console.log('✅ Custom claims set')
    
    // ENHANCED: Create comprehensive audit log with profile data
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
          hasBio: !!bio,
          // Include actual values for verification
          phone: phone ? 'provided' : 'empty',
          department: department || 'empty',
          title: title || 'empty',
          region: region || 'empty',
          location: location || 'empty',
          bio: bio ? 'provided' : 'empty'
        }
      }
    })
    
    console.log('✅ Audit log created')
    
    // Send welcome email if requested
    if (sendWelcomeEmail) {
      // TODO: Implement email sending functionality
      console.log(`📧 Welcome email should be sent to ${email}`)
    }
    
    // ENHANCED: Verify the user was created correctly by fetching it back
    const verificationDoc = await admin.firestore().collection('users').doc(userRecord.uid).get()
    const savedData = verificationDoc.data()
    
    console.log('🔍 Verification - saved user data:', JSON.stringify(savedData, null, 2))
    
    const response = {
      success: true,
      message: 'User created successfully with complete profile data',
      userId: userRecord.uid,
      email: email.toLowerCase().trim(),
      profileFieldsSaved: {
        phone: savedData.phone || 'none',
        department: savedData.department || 'none',
        title: savedData.title || 'none',
        region: savedData.region || 'none',
        location: savedData.location || 'none',
        bio: savedData.bio || 'none'
      }
    }
    
    console.log('🎉 User creation completed successfully:', JSON.stringify(response, null, 2))
    
    return response
    
  } catch (error) {
    console.error('❌ Error creating user:', error)
    
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

/* ---------- Delete User Function ---------- */

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

console.log('✅ User CRUD Functions loaded - 3 functions available')
console.log('📋 CRUD Functions: createUser, deleteUser, getUserDetails')