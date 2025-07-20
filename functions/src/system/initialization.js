// functions/src/system/initialization.js - System Setup and Configuration
// Handles initial setup of permissions, roles, and system configuration

const functions = require('firebase-functions/v1')
const admin = require('firebase-admin')
const { DEFAULT_PERMISSIONS, DEFAULT_ROLES } = require('../config/defaults')
const { getUserPermissions, validateAuth, validatePermission } = require('../utils/permissions')

/* ---------- Full System Initialization ---------- */

/**
 * Initialize all system data - permissions, roles, and configuration
 * Should only be run once during system setup or after major updates
 */
exports.initializeSystemData = functions.https.onCall(async (data, context) => {
  // Allow unauthenticated calls for initial setup
  if (context.auth) {
    const userPerms = await getUserPermissions(context.auth.uid)
    if (!userPerms.isOwner) {
      throw new functions.https.HttpsError('permission-denied', 'Only owners can initialize system data')
    }
  }
  
  console.log('🚀 Starting system initialization...')
  
  try {
    const results = {
      permissions: { created: 0, updated: 0, errors: 0 },
      roles: { created: 0, updated: 0, errors: 0 },
      configuration: { created: 0, updated: 0, errors: 0 }
    }
    
    // Initialize permissions first
    console.log('📋 Initializing permissions...')
    await initializePermissions(results.permissions)
    
    // Initialize roles (depends on permissions)
    console.log('👥 Initializing roles...')
    await initializeRoles(results.roles)
    
    // Initialize system configuration
    console.log('⚙️ Initializing system configuration...')
    await initializeSystemConfig(results.configuration)
    
    // Create audit log
    await createInitializationAuditLog(context.auth?.uid, results)
    
    console.log('✅ System initialization completed successfully')
    
    return {
      success: true,
      message: 'System data initialized successfully',
      results
    }
    
  } catch (error) {
    console.error('❌ Error initializing system data:', error)
    
    // Log the failure
    await createInitializationAuditLog(context.auth?.uid, null, error)
    
    throw new functions.https.HttpsError('internal', `Failed to initialize system data: ${error.message}`)
  }
})

/* ---------- Individual Setup Functions ---------- */

/**
 * Setup default permissions only
 */
exports.setupDefaultPermissions = functions.https.onCall(async (data, context) => {
  validateAuth(context)
  
  const userPerms = await getUserPermissions(context.auth.uid)
  validatePermission(userPerms, 'manage_permissions', 'setup default permissions')
  
  try {
    const results = { created: 0, updated: 0, errors: 0 }
    await initializePermissions(results)
    
    return {
      success: true,
      message: `Permissions setup completed: ${results.created} created, ${results.updated} updated`,
      results
    }
    
  } catch (error) {
    console.error('Error setting up permissions:', error)
    throw new functions.https.HttpsError('internal', 'Failed to setup permissions')
  }
})

/**
 * Setup default roles only
 */
exports.setupDefaultRoles = functions.https.onCall(async (data, context) => {
  validateAuth(context)
  
  const userPerms = await getUserPermissions(context.auth.uid)
  validatePermission(userPerms, 'manage_roles', 'setup default roles')
  
  try {
    const results = { created: 0, updated: 0, errors: 0 }
    await initializeRoles(results)
    
    return {
      success: true,
      message: `Roles setup completed: ${results.created} created, ${results.updated} updated`,
      results
    }
    
  } catch (error) {
    console.error('Error setting up roles:', error)
    throw new functions.https.HttpsError('internal', 'Failed to setup roles')
  }
})

/* ---------- Initialization Helper Functions ---------- */

/**
 * Initialize all default permissions
 */
async function initializePermissions(results) {
  const batch = admin.firestore().batch()
  const permissionsRef = admin.firestore().collection('permissions')
  
  for (const permission of DEFAULT_PERMISSIONS) {
    try {
      const permissionRef = permissionsRef.doc(permission.id)
      const existingDoc = await permissionRef.get()
      
      const permissionData = {
        ...permission,
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
      }
      
      if (existingDoc.exists) {
        // Update existing permission, preserving creation date
        batch.update(permissionRef, permissionData)
        results.updated++
      } else {
        // Create new permission
        permissionData.createdAt = admin.firestore.FieldValue.serverTimestamp()
        batch.set(permissionRef, permissionData)
        results.created++
      }
      
    } catch (error) {
      console.error(`Error processing permission ${permission.id}:`, error)
      results.errors++
    }
  }
  
  if (results.created > 0 || results.updated > 0) {
    await batch.commit()
  }
  
  console.log(`📋 Permissions: ${results.created} created, ${results.updated} updated, ${results.errors} errors`)
}

/**
 * Initialize all default roles
 */
async function initializeRoles(results) {
  const batch = admin.firestore().batch()
  const rolesRef = admin.firestore().collection('roles')
  
  for (const role of DEFAULT_ROLES) {
    try {
      const roleRef = rolesRef.doc(role.id)
      const existingDoc = await roleRef.get()
      
      const roleData = {
        ...role,
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
      }
      
      if (existingDoc.exists) {
        // Update existing role, but preserve custom modifications for non-system roles
        const existingData = existingDoc.data()
        
        if (role.isSystemRole) {
          // Force update system roles to latest definitions
          batch.update(roleRef, roleData)
          results.updated++
        } else if (shouldUpdateNonSystemRole(existingData, role)) {
          // Only update non-system roles if structure has changed
          batch.update(roleRef, roleData)
          results.updated++
        }
      } else {
        // Create new role
        roleData.createdAt = admin.firestore.FieldValue.serverTimestamp()
        batch.set(roleRef, roleData)
        results.created++
      }
      
    } catch (error) {
      console.error(`Error processing role ${role.id}:`, error)
      results.errors++
    }
  }
  
  if (results.created > 0 || results.updated > 0) {
    await batch.commit()
  }
  
  console.log(`👥 Roles: ${results.created} created, ${results.updated} updated, ${results.errors} errors`)
}

/**
 * Initialize system configuration
 */
async function initializeSystemConfig(results) {
  try {
    const configRef = admin.firestore().collection('system').doc('config')
    const existingConfig = await configRef.get()
    
    const systemConfig = {
      version: '2.1.0',
      initialized: true,
      initializedAt: admin.firestore.FieldValue.serverTimestamp(),
      features: {
        auditLogging: true,
        retentionSystem: true,
        permissionSystem: true,
        userManagement: true,
        profileManagement: true
      },
      settings: {
        defaultRole: 'pending',
        sessionTimeout: 24 * 60 * 60 * 1000, // 24 hours
        auditRetention: {
          fullRetentionDays: 90,
          compressedRetentionDays: 365,
          complianceRetentionYears: 7
        },
        security: {
          requireEmailVerification: false,
          enableRateLimit: true,
          maxLoginAttempts: 5
        }
      },
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    }
    
    if (existingConfig.exists) {
      await configRef.update(systemConfig)
      results.updated++
    } else {
      systemConfig.createdAt = admin.firestore.FieldValue.serverTimestamp()
      await configRef.set(systemConfig)
      results.created++
    }
    
    console.log(`⚙️ System configuration: ${results.created ? 'created' : 'updated'}`)
    
  } catch (error) {
    console.error('Error initializing system configuration:', error)
    results.errors++
  }
}

/* ---------- Utility Functions ---------- */

/**
 * Determine if a non-system role should be updated
 */
function shouldUpdateNonSystemRole(existing, newRole) {
  // Only update if the structure has significantly changed
  const significantChanges = [
    existing.hierarchy !== newRole.hierarchy,
    !existing.description && newRole.description,
    !Array.isArray(existing.permissions)
  ]
  
  return significantChanges.some(changed => changed)
}

/**
 * Create audit log for initialization process
 */
async function createInitializationAuditLog(userId, results, error = null) {
  try {
    const auditEntry = {
      action: error ? 'system_initialization_failed' : 'system_initialization',
      userId: userId || 'system',
      userEmail: 'system@ophv2.app',
      timestamp: admin.firestore.FieldValue.serverTimestamp(),
      retentionTier: 'compliance',
      details: error ? {
        error: error.message,
        errorCode: error.code || 'unknown',
        failedAt: new Date().toISOString()
      } : {
        results,
        completedAt: new Date().toISOString(),
        version: '2.1.0'
      }
    }
    
    await admin.firestore().collection('audit_logs').add(auditEntry)
    
  } catch (logError) {
    console.error('Failed to create initialization audit log:', logError)
  }
}

/**
 * Check system initialization status
 */
async function checkSystemStatus() {
  try {
    const configDoc = await admin.firestore().collection('system').doc('config').get()
    
    if (!configDoc.exists) {
      return { initialized: false, version: null }
    }
    
    const config = configDoc.data()
    return {
      initialized: config.initialized || false,
      version: config.version || 'unknown',
      initializedAt: config.initializedAt,
      features: config.features || {}
    }
    
  } catch (error) {
    console.error('Error checking system status:', error)
    return { initialized: false, version: null, error: error.message }
  }
}

module.exports = {
  initializeSystemData: exports.initializeSystemData,
  setupDefaultPermissions: exports.setupDefaultPermissions,
  setupDefaultRoles: exports.setupDefaultRoles,
  checkSystemStatus
}