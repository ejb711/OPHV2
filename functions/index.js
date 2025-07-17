// functions/index.js - Enhanced with permission system
const functions = require('firebase-functions/v1')
const admin = require('firebase-admin')

admin.initializeApp()

/* ---------- Default permissions and roles ---------- */
const DEFAULT_PERMISSIONS = [
  // User Management
  { id: 'manage_users', name: 'Manage Users', description: 'Create, edit, and delete users', category: 'user_management' },
  { id: 'view_users', name: 'View Users', description: 'View user profiles and lists', category: 'user_management' },
  { id: 'create_users', name: 'Create Users', description: 'Create new user accounts', category: 'user_management' },
  { id: 'edit_users', name: 'Edit Users', description: 'Edit user profiles and settings', category: 'user_management' },
  { id: 'delete_users', name: 'Delete Users', description: 'Delete user accounts', category: 'user_management' },
  
  // Role Management
  { id: 'manage_roles', name: 'Manage Roles', description: 'Create and modify user roles', category: 'user_management' },
  { id: 'manage_permissions', name: 'Manage Permissions', description: 'Assign permissions to roles', category: 'user_management' },
  { id: 'view_audit_logs', name: 'View Audit Logs', description: 'View system audit and change logs', category: 'user_management' },
  
  // Content Management
  { id: 'manage_projects', name: 'Manage Projects', description: 'Full project management access', category: 'content_management' },
  { id: 'view_projects', name: 'View Projects', description: 'View projects and project data', category: 'content_management' },
  { id: 'create_projects', name: 'Create Projects', description: 'Create new projects', category: 'content_management' },
  { id: 'edit_projects', name: 'Edit Projects', description: 'Edit project details', category: 'content_management' },
  { id: 'delete_projects', name: 'Delete Projects', description: 'Delete projects', category: 'content_management' },
  
  // Forum Management
  { id: 'manage_forums', name: 'Manage Forums', description: 'Full forum administration', category: 'content_management' },
  { id: 'view_forums', name: 'View Forums', description: 'View forum posts and discussions', category: 'content_management' },
  { id: 'create_posts', name: 'Create Posts', description: 'Create forum posts and replies', category: 'content_management' },
  { id: 'edit_posts', name: 'Edit Posts', description: 'Edit forum posts', category: 'content_management' },
  { id: 'delete_posts', name: 'Delete Posts', description: 'Delete forum posts', category: 'content_management' },
  { id: 'moderate_posts', name: 'Moderate Posts', description: 'Moderate and manage forum content', category: 'content_management' },
  
  // Calendar Management
  { id: 'manage_calendar', name: 'Manage Calendar', description: 'Full calendar administration', category: 'feature_access' },
  { id: 'view_calendar', name: 'View Calendar', description: 'View calendar events', category: 'feature_access' },
  { id: 'create_events', name: 'Create Events', description: 'Create calendar events', category: 'feature_access' },
  { id: 'edit_events', name: 'Edit Events', description: 'Edit calendar events', category: 'feature_access' },
  { id: 'delete_events', name: 'Delete Events', description: 'Delete calendar events', category: 'feature_access' },
  
  // System Management
  { id: 'manage_system', name: 'Manage System', description: 'System administration access', category: 'system_management' },
  { id: 'view_analytics', name: 'View Analytics', description: 'View system analytics and reports', category: 'system_management' },
  { id: 'manage_settings', name: 'Manage Settings', description: 'Configure system settings', category: 'system_management' }
]

const DEFAULT_ROLES = [
  {
    id: 'owner',
    name: 'Owner',
    hierarchy: 5,
    permissions: [], // Owners get all permissions by default
    isSystemRole: true
  },
  {
    id: 'admin',
    name: 'Administrator',
    hierarchy: 4,
    permissions: [
      'manage_users', 'view_users', 'create_users', 'edit_users', 'delete_users',
      'manage_roles', 'view_audit_logs',
      'manage_projects', 'view_projects', 'create_projects', 'edit_projects', 'delete_projects',
      'manage_forums', 'view_forums', 'create_posts', 'edit_posts', 'delete_posts', 'moderate_posts',
      'manage_calendar', 'view_calendar', 'create_events', 'edit_events', 'delete_events',
      'view_analytics', 'manage_settings'
    ],
    isSystemRole: true
  },
  {
    id: 'user',
    name: 'User',
    hierarchy: 3,
    permissions: [
      'view_projects', 'create_projects', 'edit_projects',
      'view_forums', 'create_posts', 'edit_posts',
      'view_calendar', 'create_events', 'edit_events'
    ],
    isSystemRole: true
  },
  {
    id: 'viewer',
    name: 'Viewer',
    hierarchy: 2,
    permissions: [
      'view_projects',
      'view_forums',
      'view_calendar'
    ],
    isSystemRole: true
  },
  {
    id: 'pending',
    name: 'Pending Approval',
    hierarchy: 1,
    permissions: [],
    isSystemRole: true
  }
]

/* ---------- Helper Functions ---------- */

async function getUserEffectivePermissions(user) {
  if (!user || user.role === 'pending') return []
  
  // Owners get all permissions
  if (user.role === 'owner') {
    const permissionsSnap = await admin.firestore().collection('permissions').get()
    return permissionsSnap.docs.map(doc => doc.id)
  }
  
  // Get role permissions
  const roleDoc = await admin.firestore().doc(`roles/${user.role}`).get()
  const rolePermissions = roleDoc.exists ? (roleDoc.data().permissions || []) : []
  
  // Add custom permissions
  const customPermissions = user.customPermissions || []
  
  // Remove denied permissions
  const deniedPermissions = user.deniedPermissions || []
  
  const effectivePermissions = new Set([...rolePermissions, ...customPermissions])
  deniedPermissions.forEach(p => effectivePermissions.delete(p))
  
  return Array.from(effectivePermissions)
}

async function updateUserCustomClaims(uid, userData) {
  const permissions = await getUserEffectivePermissions(userData)
  
  const customClaims = {
    role: userData.role,
    permissions: permissions
  }
  
  await admin.auth().setCustomUserClaims(uid, customClaims)
  console.log(`Updated custom claims for ${uid}:`, customClaims)
}

/* ---------- Initialization Function ---------- */

exports.initializeSystemData = functions.https.onCall(async (data, context) => {
  // Only allow admins or first-time setup
  if (context.auth && context.auth.token.role !== 'owner') {
    throw new functions.https.HttpsError('permission-denied', 'Only owners can initialize system data')
  }
  
  const batch = admin.firestore().batch()
  
  try {
    // Initialize permissions
    for (const permission of DEFAULT_PERMISSIONS) {
      const permissionRef = admin.firestore().doc(`permissions/${permission.id}`)
      batch.set(permissionRef, {
        ...permission,
        createdAt: admin.firestore.FieldValue.serverTimestamp()
      })
    }
    
    // Initialize roles
    for (const role of DEFAULT_ROLES) {
      const roleRef = admin.firestore().doc(`roles/${role.id}`)
      batch.set(roleRef, {
        ...role,
        createdAt: admin.firestore.FieldValue.serverTimestamp()
      })
    }
    
    await batch.commit()
    
    return { success: true, message: 'System data initialized successfully' }
  } catch (error) {
    console.error('Error initializing system data:', error)
    throw new functions.https.HttpsError('internal', 'Failed to initialize system data')
  }
})

/* ---------- Auth Triggers ---------- */

exports.onNewUser = functions.auth.user().onCreate(async (user) => {
  try {
    // Create user document
    await admin.firestore().doc(`users/${user.uid}`).set({
      email: user.email,
      role: 'pending',
      customPermissions: [],
      deniedPermissions: [],
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      lastActive: admin.firestore.FieldValue.serverTimestamp()
    })
    
    // Set initial custom claims
    await admin.auth().setCustomUserClaims(user.uid, { 
      role: 'pending',
      permissions: []
    })
    
    console.log(`New user created: ${user.email} (${user.uid})`)
  } catch (error) {
    console.error('Error creating new user:', error)
  }
})

exports.onUserRoleChange = functions.firestore
  .document('users/{uid}')
  .onUpdate(async (change, context) => {
    const uid = context.params.uid
    const before = change.before.data()
    const after = change.after.data()
    
    // Check if role or permissions changed
    const roleChanged = before.role !== after.role
    const customPermissionsChanged = JSON.stringify(before.customPermissions) !== JSON.stringify(after.customPermissions)
    const deniedPermissionsChanged = JSON.stringify(before.deniedPermissions) !== JSON.stringify(after.deniedPermissions)
    
    if (roleChanged || customPermissionsChanged || deniedPermissionsChanged) {
      try {
        await updateUserCustomClaims(uid, after)
        
        // Log the change
        await admin.firestore().collection('roleChanges').add({
          userId: uid,
          changes: {
            role: roleChanged ? { from: before.role, to: after.role } : null,
            customPermissions: customPermissionsChanged ? { 
              from: before.customPermissions || [], 
              to: after.customPermissions || [] 
            } : null,
            deniedPermissions: deniedPermissionsChanged ? { 
              from: before.deniedPermissions || [], 
              to: after.deniedPermissions || [] 
            } : null
          },
          changedAt: admin.firestore.FieldValue.serverTimestamp(),
          changedBy: context.auth?.uid || 'system'
        })
        
        console.log(`Updated permissions for user ${uid}`)
      } catch (error) {
        console.error('Error updating user custom claims:', error)
      }
    }
  })

exports.onRolePermissionsChange = functions.firestore
  .document('roles/{roleId}')
  .onUpdate(async (change, context) => {
    const roleId = context.params.roleId
    const before = change.before.data()
    const after = change.after.data()
    
    // Check if permissions changed
    if (JSON.stringify(before.permissions) !== JSON.stringify(after.permissions)) {
      try {
        // Find all users with this role and update their custom claims
        const usersSnap = await admin.firestore()
          .collection('users')
          .where('role', '==', roleId)
          .get()
        
        const updatePromises = usersSnap.docs.map(async (userDoc) => {
          await updateUserCustomClaims(userDoc.id, userDoc.data())
        })
        
        await Promise.all(updatePromises)
        
        console.log(`Updated custom claims for ${usersSnap.size} users with role '${roleId}'`)
      } catch (error) {
        console.error('Error updating users after role permission change:', error)
      }
    }
  })

/* ---------- User Activity Tracking ---------- */

exports.updateUserActivity = functions.https.onCall(async (data, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'User must be authenticated')
  }
  
  try {
    await admin.firestore().doc(`users/${context.auth.uid}`).update({
      lastActive: admin.firestore.FieldValue.serverTimestamp()
    })
    
    return { success: true }
  } catch (error) {
    console.error('Error updating user activity:', error)
    throw new functions.https.HttpsError('internal', 'Failed to update user activity')
  }
})

/* ---------- Permission Validation ---------- */

exports.validatePermission = functions.https.onCall(async (data, context) => {
  if (!context.auth) {
    return { hasPermission: false, reason: 'Not authenticated' }
  }
  
  const { permission } = data
  
  if (!permission) {
    return { hasPermission: false, reason: 'No permission specified' }
  }
  
  // Owners have all permissions
  if (context.auth.token.role === 'owner') {
    return { hasPermission: true }
  }
  
  // Check if user has the permission in their custom claims
  const userPermissions = context.auth.token.permissions || []
  const hasPermission = userPermissions.includes(permission)
  
  return { 
    hasPermission,
    reason: hasPermission ? null : `Missing permission: ${permission}`
  }
})