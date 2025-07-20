// functions/src/system/health.js - System Health and Monitoring
// Provides health checks, system status, and monitoring endpoints

const functions = require('firebase-functions/v1')
const admin = require('firebase-admin')
const { getUserPermissions, validateAuth, validatePermission } = require('../utils/permissions')

/* ---------- Public Health Check ---------- */

/**
 * Basic health check endpoint for monitoring
 * Public endpoint that doesn't require authentication
 */
exports.healthCheck = functions.https.onRequest(async (req, res) => {
  try {
    const healthData = {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      version: '2.1.0',
      environment: process.env.FUNCTIONS_EMULATOR ? 'development' : 'production',
      services: {
        firestore: 'operational',
        auth: 'operational',
        functions: 'operational'
      },
      uptime: process.uptime(),
      memory: process.memoryUsage()
    }
    
    // Test basic Firestore connectivity
    try {
      await admin.firestore().collection('system').doc('health_check').set({
        lastCheck: admin.firestore.FieldValue.serverTimestamp()
      }, { merge: true })
    } catch (firestoreError) {
      healthData.services.firestore = 'degraded'
      healthData.status = 'degraded'
    }
    
    // Set response headers
    res.set('Cache-Control', 'no-cache, no-store, must-revalidate')
    res.set('Pragma', 'no-cache')
    res.set('Expires', '0')
    
    const statusCode = healthData.status === 'healthy' ? 200 : 503
    res.status(statusCode).json(healthData)
    
  } catch (error) {
    console.error('Health check failed:', error)
    
    res.status(500).json({
      status: 'unhealthy',
      error: error.message,
      timestamp: new Date().toISOString(),
      version: '2.1.0'
    })
  }
})

/* ---------- Detailed System Status ---------- */

/**
 * Comprehensive system status for administrators
 * Requires authentication and admin permissions
 */
exports.systemStatus = functions.https.onCall(async (data, context) => {
  validateAuth(context)
  
  const userPerms = await getUserPermissions(context.auth.uid)
  validatePermission(userPerms, 'view_system_status', 'view system status')
  
  try {
    const status = await gatherSystemStatus()
    
    return {
      success: true,
      data: status
    }
    
  } catch (error) {
    console.error('Error getting system status:', error)
    throw new functions.https.HttpsError('internal', 'Failed to get system status')
  }
})

/* ---------- Status Gathering Functions ---------- */

/**
 * Gather comprehensive system status information
 */
async function gatherSystemStatus() {
  const now = new Date()
  const status = {
    overview: {
      status: 'healthy',
      timestamp: now.toISOString(),
      version: '2.1.0',
      uptime: process.uptime()
    },
    services: await checkAllServices(),
    database: await checkDatabaseHealth(),
    performance: await checkPerformanceMetrics(),
    security: await checkSecurityStatus(),
    storage: await checkStorageStatus(),
    functions: await checkFunctionsStatus()
  }
  
  // Determine overall status
  status.overview.status = determineOverallStatus(status)
  
  return status
}

/**
 * Check all core services
 */
async function checkAllServices() {
  const services = {
    firestore: 'checking',
    auth: 'checking',
    functions: 'operational', // If we're running, functions are working
    hosting: 'unknown'
  }
  
  // Test Firestore
  try {
    const testDoc = await admin.firestore().collection('system').doc('health_test').get()
    services.firestore = 'operational'
  } catch (error) {
    console.error('Firestore health check failed:', error)
    services.firestore = 'degraded'
  }
  
  // Test Auth
  try {
    await admin.auth().listUsers(1) // Just try to list one user
    services.auth = 'operational'
  } catch (error) {
    console.error('Auth health check failed:', error)
    services.auth = 'degraded'
  }
  
  return services
}

/**
 * Check database health and statistics
 */
async function checkDatabaseHealth() {
  try {
    const db = admin.firestore()
    const now = new Date()
    const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000)
    
    // Get basic collection stats
    const collections = ['users', 'roles', 'permissions', 'audit_logs']
    const stats = {}
    
    for (const collection of collections) {
      const snapshot = await db.collection(collection).count().get()
      stats[collection] = snapshot.data().count
    }
    
    // Check recent activity
    const recentActivity = await db.collection('audit_logs')
      .where('timestamp', '>=', oneDayAgo)
      .count()
      .get()
    
    return {
      status: 'healthy',
      collections: stats,
      recentActivity: recentActivity.data().count,
      lastChecked: now.toISOString()
    }
    
  } catch (error) {
    console.error('Database health check failed:', error)
    return {
      status: 'error',
      error: error.message,
      lastChecked: new Date().toISOString()
    }
  }
}

/**
 * Check performance metrics
 */
async function checkPerformanceMetrics() {
  const memory = process.memoryUsage()
  
  return {
    memory: {
      used: Math.round(memory.heapUsed / 1024 / 1024),
      total: Math.round(memory.heapTotal / 1024 / 1024),
      external: Math.round(memory.external / 1024 / 1024),
      usage: Math.round((memory.heapUsed / memory.heapTotal) * 100)
    },
    uptime: {
      seconds: Math.round(process.uptime()),
      formatted: formatUptime(process.uptime())
    },
    status: memory.heapUsed / memory.heapTotal > 0.9 ? 'warning' : 'good'
  }
}

/**
 * Check security status and recent events
 */
async function checkSecurityStatus() {
  try {
    const db = admin.firestore()
    const now = new Date()
    const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000)
    
    // Check for security events in last 24 hours
    const securityEvents = await db.collection('audit_logs')
      .where('timestamp', '>=', oneDayAgo)
      .where('retentionTier', '==', 'security')
      .count()
      .get()
    
    // Check for failed operations
    const failedOps = await db.collection('audit_logs')
      .where('timestamp', '>=', oneDayAgo)
      .where('action', '>=', 'failed_')
      .where('action', '<', 'failed_~')
      .count()
      .get()
    
    const securityCount = securityEvents.data().count
    const failureCount = failedOps.data().count
    
    let status = 'good'
    if (securityCount > 10 || failureCount > 50) status = 'warning'
    if (securityCount > 50 || failureCount > 200) status = 'critical'
    
    return {
      status,
      securityEvents: securityCount,
      failedOperations: failureCount,
      lastChecked: now.toISOString()
    }
    
  } catch (error) {
    console.error('Security check failed:', error)
    return {
      status: 'error',
      error: error.message,
      lastChecked: new Date().toISOString()
    }
  }
}

/**
 * Check storage usage and projections
 */
async function checkStorageStatus() {
  try {
    const db = admin.firestore()
    
    // Get audit log counts by tier for storage estimation
    const tiers = ['standard', 'security', 'compliance', 'operational', 'compressed']
    const tierCounts = {}
    
    for (const tier of tiers) {
      const snapshot = await db.collection('audit_logs')
        .where('retentionTier', '==', tier)
        .count()
        .get()
      tierCounts[tier] = snapshot.data().count
    }
    
    // Estimate storage usage (rough calculation)
    const avgLogSizes = { standard: 400, security: 600, compliance: 800, operational: 200, compressed: 100 }
    let totalBytes = 0
    
    Object.entries(tierCounts).forEach(([tier, count]) => {
      totalBytes += count * (avgLogSizes[tier] || 400)
    })
    
    const totalMB = totalBytes / (1024 * 1024)
    
    return {
      status: totalMB > 1000 ? 'warning' : 'good',
      estimatedSizeMB: Math.round(totalMB),
      tierBreakdown: tierCounts,
      projectedGrowthMB: Math.round(totalMB * 0.1), // Rough 10% monthly growth
      lastChecked: new Date().toISOString()
    }
    
  } catch (error) {
    console.error('Storage check failed:', error)
    return {
      status: 'error',
      error: error.message,
      lastChecked: new Date().toISOString()
    }
  }
}

/**
 * Check Cloud Functions status and recent executions
 */
async function checkFunctionsStatus() {
  try {
    const db = admin.firestore()
    const now = new Date()
    const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000)
    
    // Check for recent function executions (via audit logs)
    const recentExecutions = await db.collection('audit_logs')
      .where('timestamp', '>=', oneHourAgo)
      .where('userAgent', '==', 'cloud-function')
      .count()
      .get()
    
    return {
      status: 'operational',
      recentExecutions: recentExecutions.data().count,
      memory: Math.round(process.memoryUsage().heapUsed / 1024 / 1024),
      uptime: Math.round(process.uptime()),
      lastChecked: now.toISOString()
    }
    
  } catch (error) {
    console.error('Functions check failed:', error)
    return {
      status: 'error',
      error: error.message,
      lastChecked: new Date().toISOString()
    }
  }
}

/* ---------- Utility Functions ---------- */

/**
 * Determine overall system status from component statuses
 */
function determineOverallStatus(status) {
  const components = [
    status.services.firestore,
    status.services.auth,
    status.database.status,
    status.performance.status,
    status.security.status,
    status.storage.status,
    status.functions.status
  ]
  
  if (components.includes('error') || components.includes('critical')) return 'critical'
  if (components.includes('degraded') || components.includes('warning')) return 'warning'
  return 'healthy'
}

/**
 * Format uptime in human-readable format
 */
function formatUptime(seconds) {
  const days = Math.floor(seconds / 86400)
  const hours = Math.floor((seconds % 86400) / 3600)
  const minutes = Math.floor((seconds % 3600) / 60)
  
  if (days > 0) return `${days}d ${hours}h ${minutes}m`
  if (hours > 0) return `${hours}h ${minutes}m`
  return `${minutes}m`
}

module.exports = {
  healthCheck: exports.healthCheck,
  systemStatus: exports.systemStatus
}