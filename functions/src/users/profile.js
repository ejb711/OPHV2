// functions/src/users/profile.js
// OPHV2 User Profile Management Operations
// File size: ~120 lines (well under 350 line limit)

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

/* ---------- Update User Profile Function ---------- */

/**
 * Update user profile information
 * Enhanced with comprehensive field tracking and validation
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
  
  validateUserId(userId)
  
  try {
    // Check permissions - users can edit their own profile, or admins can edit others
    const isOwnProfile = context.auth.uid === userId
    
    if (!isOwnProfile) {
      const callerPerms = await getUserPermissions(context.auth.uid)
      validatePermission(callerPerms, 'edit_users', 'edit user profiles')
      
      // Get target user for management validation
      const targetUserDoc = await admin.firestore().collection('users').doc(userId).get()
      if (!targetUserDoc.exists) {
        throw new functions.https.HttpsError('not-found', 'User not found')
      }
      
      validateUserManagement(callerPerms, targetUserDoc.data().role, 'edit this user profile')
    }
    
    // Get current user data for audit comparison
    const currentUserDoc = await admin.firestore().collection('users').doc(userId).get()
    if (!currentUserDoc.exists) {
      throw new functions.https.HttpsError('not-found', 'User not found')
    }
    
    const currentData = currentUserDoc.data()
    
    // Prepare update data
    const updateData = {
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      lastModifiedBy: context.auth.uid
    }
    
    // Only update fields that are provided and different
    if (displayName !== undefined && displayName !== currentData.displayName) {
      updateData.displayName = displayName.trim()
      
      // Also update Firebase Auth displayName
      await admin.auth().updateUser(userId, {
        displayName: displayName.trim()
      })
    }
    
    if (phone !== undefined && phone !== currentData.phone) {
      // Store only digits for phone
      updateData.phone = String(phone).replace(/\D/g, '')
    }
    
    if (department !== undefined && department !== currentData.department) {
      updateData.department = department
    }
    
    if (title !== undefined && title !== currentData.title) {
      updateData.title = title
    }
    
    if (region !== undefined && region !== currentData.region) {
      updateData.region = region
    }
    
    if (location !== undefined && location !== currentData.location) {
      updateData.location = location
    }
    
    if (bio !== undefined && bio !== currentData.bio) {
      updateData.bio = bio
    }
    
    // Update Firestore document
    await admin.firestore().collection('users').doc(userId).update(updateData)
    
    // Create audit log
    await createSimpleAuditLog({
      action: 'user_profile_updated',
      userId: context.auth.uid,
      userEmail: context.auth.token.email || 'unknown',
      targetUserId: userId,
      details: {
        targetUserEmail: currentData.email,
        isOwnProfile: isOwnProfile,
        updatedFields: {
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

console.log('✅ User Profile Functions loaded - 1 function available')
console.log('📋 Profile Functions: updateUserProfile')