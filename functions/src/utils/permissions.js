// functions/src/utils/permissions.js - Permission System Utilities
// Reusable permission checking and user management utilities

const admin = require('firebase-admin')
const functions = require('firebase-functions/v1')

/* ---------- Permission Checking Functions ---------- */

/**
 * Get user permissions and role information
 * @param {string} uid - User ID
 * @returns {Promise<Object>} User permissions and role data
 */
async function getUserPermissions(uid) {
  try {
    const userDoc = await admin.firestore().collection('users').doc(uid).get()
    if (!userDoc.exists) {
      return { role: 'pending', permissions: ['view_own_profile'], isOwner: false, isAdmin: false }
    }
    
    const userData = userDoc.data()
    const role = userData.role || 'pending'
    
    // Get role permissions
    const roleDoc = await admin.firestore().collection('roles').doc(role).get()
    let rolePermissions = []
    if (roleDoc.exists) {
      rolePermissions = roleDoc.data().permissions || []
    }
    
    // Add custom permissions and remove denied ones
    const customPermissions = userData.customPermissions || []
    const deniedPermissions = userData.deniedPermissions || []
    
    const allPermissions = [...new Set([...rolePermissions, ...customPermissions])]
    const finalPermissions = allPermissions.filter(p => !deniedPermissions.includes(p))
    
    return {
      role,
      permissions: finalPermissions,
      customPermissions,
      deniedPermissions,
      isOwner: role === 'owner',
      isAdmin: role === 'admin' || role === 'owner',
      hierarchy: roleDoc.exists ? roleDoc.data().hierarchy || 0 : 0
    }
  } catch (error) {
    console.error('Error getting user permissions:', error)
    return { role: 'pending', permissions: ['view_own_profile'], isOwner: false, isAdmin: false }
  }
}

/**
 * Check if user has a specific permission
 * @param {Object} userPermissions - User permissions object from getUserPermissions
 * @param {string} required - Required permission
 * @returns {boolean} Whether user has permission
 */
function hasPermission(userPermissions, required) {
  if (!required) return true
  if (userPermissions.isOwner) return true
  return userPermissions.permissions.includes(required)
}

/**
 * Check if user can manage another user with specific role
 * @param {Object} managerPerms - Manager's permissions object
 * @param {string} targetRole - Target user's role
 * @returns {boolean} Whether manager can manage target user
 */
function canManageUserWithRole(managerPerms, targetRole) {
  if (managerPerms.isOwner) return true
  
  // Admins can manage all except owners and other admins
  if (managerPerms.role === 'admin' && targetRole !== 'owner' && targetRole !== 'admin') {
    return true
  }
  
  return false
}

/**
 * Check if user can assign a specific role
 * @param {Object} userPerms - User's permissions object
 * @param {string} roleToAssign - Role to be assigned
 * @returns {boolean} Whether user can assign this role
 */
function canAssignRole(userPerms, roleToAssign) {
  if (userPerms.isOwner) return true
  
  // Admins cannot assign owner or admin roles
  if (userPerms.role === 'admin' && (roleToAssign === 'owner' || roleToAssign === 'admin')) {
    return false
  }
  
  if (userPerms.role === 'admin') return true
  
  return false
}

/* ---------- Validation Functions ---------- */

/**
 * Validate authentication context
 * @param {Object} context - Firebase function context
 * @throws {functions.https.HttpsError} If authentication fails
 */
function validateAuth(context) {
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'User must be authenticated')
  }
}

/**
 * Validate required permissions
 * @param {Object} userPerms - User permissions object
 * @param {string} required - Required permission
 * @param {string} action - Action being attempted (for error message)
 * @throws {functions.https.HttpsError} If permission check fails
 */
function validatePermission(userPerms, required, action = 'perform this action') {
  if (!hasPermission(userPerms, required)) {
    throw new functions.https.HttpsError(
      'permission-denied', 
      `Insufficient permissions to ${action}. Required: ${required}`
    )
  }
}

/**
 * Validate user can manage target user
 * @param {Object} managerPerms - Manager's permissions
 * @param {string} targetRole - Target user's role
 * @param {string} action - Action being attempted
 * @throws {functions.https.HttpsError} If management check fails
 */
function validateUserManagement(managerPerms, targetRole, action = 'manage this user') {
  if (!canManageUserWithRole(managerPerms, targetRole)) {
    throw new functions.https.HttpsError(
      'permission-denied',
      `Cannot ${action} with role: ${targetRole}`
    )
  }
}

/* ---------- Data Validation Functions ---------- */

/**
 * Validate user ID parameter
 * @param {string} userId - User ID to validate
 * @param {string} paramName - Parameter name for error message
 * @throws {functions.https.HttpsError} If validation fails
 */
function validateUserId(userId, paramName = 'userId') {
  if (!userId || typeof userId !== 'string' || userId.trim().length === 0) {
    throw new functions.https.HttpsError('invalid-argument', `Valid ${paramName} is required`)
  }
}

/**
 * Validate email parameter
 * @param {string} email - Email to validate
 * @throws {functions.https.HttpsError} If validation fails
 */
function validateEmail(email) {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  if (!email || typeof email !== 'string' || !emailRegex.test(email)) {
    throw new functions.https.HttpsError('invalid-argument', 'Valid email is required')
  }
}

/**
 * Validate role parameter
 * @param {string} role - Role to validate
 * @param {Array} validRoles - Array of valid role IDs
 * @throws {functions.https.HttpsError} If validation fails
 */
function validateRole(role, validRoles = ['owner', 'admin', 'user', 'viewer', 'pending']) {
  if (!role || !validRoles.includes(role)) {
    throw new functions.https.HttpsError(
      'invalid-argument', 
      `Invalid role. Valid roles: ${validRoles.join(', ')}`
    )
  }
}

/* ---------- Security Helper Functions ---------- */

/**
 * Prevent self-targeting operations
 * @param {string} actorId - ID of user performing action
 * @param {string} targetId - ID of target user
 * @param {string} action - Action being attempted
 * @throws {functions.https.HttpsError} If self-targeting is detected
 */
function preventSelfTargeting(actorId, targetId, action = 'perform this action on yourself') {
  if (actorId === targetId) {
    throw new functions.https.HttpsError('invalid-argument', `Cannot ${action}`)
  }
}

/**
 * Rate limiting helper (basic implementation)
 * @param {string} userId - User ID
 * @param {string} action - Action being performed
 * @param {number} limit - Rate limit per hour
 * @returns {boolean} Whether action is allowed
 */
const rateLimitMap = new Map()
function checkRateLimit(userId, action, limit = 10) {
  const key = `${userId}-${action}`
  const now = Date.now()
  const hour = 60 * 60 * 1000
  
  if (!rateLimitMap.has(key)) {
    rateLimitMap.set(key, [])
  }
  
  const attempts = rateLimitMap.get(key)
  
  // Remove attempts older than 1 hour
  const recentAttempts = attempts.filter(time => (now - time) < hour)
  rateLimitMap.set(key, recentAttempts)
  
  if (recentAttempts.length >= limit) {
    return false
  }
  
  recentAttempts.push(now)
  return true
}

module.exports = {
  // Permission checking
  getUserPermissions,
  hasPermission,
  canManageUserWithRole,
  canAssignRole,
  
  // Validation functions
  validateAuth,
  validatePermission,
  validateUserManagement,
  validateUserId,
  validateEmail,
  validateRole,
  
  // Security helpers
  preventSelfTargeting,
  checkRateLimit
}