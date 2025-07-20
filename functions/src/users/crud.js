// functions/src/users/crud.js
// OPHV2 User CRUD Operations - Create, Read, Update, Delete
// Complete file with all CRUD operations including getUserDetails

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
 * FIXED: Now properly saves all profile fields to Firestore
 */
exports.createUser = functions.https.onCall(async (data, context) => {
  console.log('🚀 CreateUser function called with data:', JSON.stringify(data, null, 2))
  
  validateAuth(context)
  
  // Extract all parameters including profile fields
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
  
  // Validate required inputs
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
    
    // FIXED: Create comprehensive user document with ALL profile fields
    const userData = {
      // Basic user info
      email: email.toLowerCase().trim(),
      displayName: displayName.trim(),
      role: role,
      status: 'active',
      
      // Profile fields - ensure they're saved even if empty
      phone: phone ? String(phone).replace(/\D/g, '') : '',
      department: department || '',
      title: title || '',
      region: region || '',
      location: location || '',
      bio: bio || '',
      
      // Permission arrays
      customPermissions: [],
      deniedPermissions: [],
      
      // Additional metadata
      photoURL: null,
      metadata: {
        creationTime: new Date().toISOString(),
        emailVerified: false,
        provider: 'password'
      },
      preferences: {
        theme: 'light',
        language: 'en',
        notifications: true
      },
      
      // Timestamps
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      createdBy: context.auth.uid,
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      lastActive: admin.firestore.FieldValue.serverTimestamp()
    }
    
    console.log('📊 User data to be saved to Firestore:', JSON.stringify(userData, null, 2))
    
    // Save to Firestore
    await admin.firestore().collection('users').doc(userRecord.uid).set(userData)
    
    console.log('✅ User document saved to Firestore with all profile fields')
    
    // Set custom claims for role-based access
    await admin.auth().setCustomUserClaims(userRecord.uid, {
      role: role,
      status: 'active'
    })
    
    console.log('✅ Custom claims set')
    
    // Create comprehensive audit log
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
    
    console.log('✅ Audit log created')
    
    // Prepare response with profile field confirmation
    const profileFieldsSaved = {
      phone: phone ? 'saved' : 'empty',
      department: department ? 'saved' : 'empty',
      title: title ? 'saved' : 'empty',
      region: region ? 'saved' : 'empty',
      location: location ? 'saved' : 'empty',
      bio: bio ? 'saved' : 'empty'
    }
    
    // Send welcome email if requested (placeholder for email service)
    if (sendWelcomeEmail) {
      console.log('📧 Welcome email requested - would send to:', email)
      // TODO: Implement email sending logic here
    }
    
    console.log('✅ User creation completed successfully')
    
    return {
      success: true,
      userId: userRecord.uid,
      email: email.toLowerCase().trim(),
      message: 'User created successfully',
      profileFieldsSaved: profileFieldsSaved
    }
    
  } catch (error) {
    console.error('❌ Error creating user:', error)
    
    // Clean up if user was partially created
    if (error.userRecord && error.userRecord.uid) {
      try {
        await admin.auth().deleteUser(error.userRecord.uid)
        console.log('🧹 Cleaned up partially created user')
      } catch (cleanupError) {
        console.error('Failed to cleanup:', cleanupError)
      }
    }
    
    if (error instanceof functions.https.HttpsError) {
      throw error
    }
    
    throw new functions.https.HttpsError('internal', 'Failed to create user with profile information')
  }
})

/* ---------- Delete User Function ---------- */

/**
 * Securely delete a user from both Firebase Auth and Firestore
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
    }
    
    // Delete from Firestore
    await admin.firestore().collection('users').doc(userId).delete()
    
    // Log the deletion
    await createSimpleAuditLog({
      action: 'user_deleted',
      userId: context.auth.uid,
      userEmail: context.auth.token.email || 'unknown',
      targetUserId: userId,
      details: {
        deletedUserEmail: targetUserData.email,
        deletedUserRole: targetUserData.role,
        reason: reason || 'No reason provided'
      }
    })
    
    return {
      success: true,
      message: 'User deleted successfully'
    }
    
  } catch (error) {
    console.error('Error deleting user:', error)
    
    if (error instanceof functions.https.HttpsError) {
      throw error
    }
    
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