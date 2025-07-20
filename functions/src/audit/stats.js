// functions/src/audit/stats.js - Audit Statistics and Reporting
// Provides audit analytics, retention statistics, and system health metrics

const functions = require('firebase-functions/v1')
const admin = require('firebase-admin')
const { RETENTION_TIERS, getRetentionHealth } = require('../config/audit')
const { getUserPermissions, validateAuth, validatePermission } = require('../utils/permissions')

/* ---------- Retention Statistics Function ---------- */

/**
 * Get detailed retention statistics for admin dashboard
 * Shows storage usage, compression rates, and system health
 */
exports.getRetentionStats = functions.https.onCall(async (data, context) => {
  validateAuth(context)
  
  const userPerms = await getUserPermissions(context.auth.uid)
  validatePermission(userPerms, 'view_audit_logs', 'view retention statistics')
  
  try {
    const db = admin.firestore()
    const now = new Date()
    
    // Get comprehensive statistics
    const stats = await gatherRetentionStatistics(db, now)
    
    return {
      success: true,
      data: stats
    }
    
  } catch (error) {
    console.error('Error getting retention stats:', error)
    throw new functions.https.HttpsError('internal', 'Failed to get retention statistics')
  }
})

/* ---------- Audit Analytics Function ---------- */

/**
 * Get detailed audit analytics and activity patterns
 * Provides insights into user activity, security events, and system usage
 */
exports.getAuditStatistics = functions.https.onCall(async (data, context) => {
  validateAuth(context)
  
  const userPerms = await getUserPermissions(context.auth.uid)
  validatePermission(userPerms, 'view_audit_logs', 'view audit statistics')
  
  const { timeRange, category, userId } = data || {}
  
  try {
    const db = admin.firestore()
    const analytics = await gatherAuditAnalytics(db, {
      timeRange: timeRange || '30d',
      category,
      userId
    })
    
    return {
      success: true,
      data: analytics
    }
    
  } catch (error) {
    console.error('Error getting audit statistics:', error)
    throw new functions.https.HttpsError('internal', 'Failed to get audit statistics')
  }
})

/* ---------- Statistics Gathering Functions ---------- */

/**
 * Gather comprehensive retention statistics
 */
async function gatherRetentionStatistics(db, now) {
  const stats = {
    overview: {},
    tierBreakdown: {},
    healthMetrics: {},
    storageEstimate: {},
    trends: {},
    lastUpdated: now.toISOString()
  }
  
  // Get total logs count
  const totalLogsSnapshot = await db.collection('audit_logs').count().get()
  const totalLogs = totalLogsSnapshot.data().count
  
  // Get counts by retention tier
  const tierCounts = {}
  const tierSizes = {}
  
  for (const [tierName, tierConfig] of Object.entries(RETENTION_TIERS)) {
    const tierSnapshot = await db.collection('audit_logs')
      .where('retentionTier', '==', tierName)
      .count()
      .get()
    
    tierCounts[tierName] = tierSnapshot.data().count
    tierSizes[tierName] = estimateStorageSize(tierCounts[tierName], tierName)
  }
  
  // Get compressed logs count
  const compressedSnapshot = await db.collection('audit_logs')
    .where('retentionTier', '==', 'compressed')
    .count()
    .get()
  const compressedLogs = compressedSnapshot.data().count
  
  // Get recent activity (last 7 days)
  const recentCutoff = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
  const recentSnapshot = await db.collection('audit_logs')
    .where('timestamp', '>=', recentCutoff)
    .count()
    .get()
  const recentLogs = recentSnapshot.data().count
  
  // Calculate overview metrics
  stats.overview = {
    totalLogs,
    compressedLogs,
    recentLogs,
    compressionRate: totalLogs > 0 ? (compressedLogs / totalLogs * 100).toFixed(1) : 0,
    retentionHealth: getRetentionHealth(totalLogs, compressedLogs, recentLogs)
  }
  
  // Tier breakdown
  stats.tierBreakdown = Object.entries(tierCounts).map(([tier, count]) => ({
    tier,
    name: RETENTION_TIERS[tier]?.name || tier,
    count,
    percentage: totalLogs > 0 ? (count / totalLogs * 100).toFixed(1) : 0,
    estimatedSize: tierSizes[tier],
    retentionDays: RETENTION_TIERS[tier]?.retentionDays || 0
  }))
  
  // Health metrics
  stats.healthMetrics = await calculateHealthMetrics(db, now)
  
  // Storage estimate
  const totalSize = Object.values(tierSizes).reduce((sum, size) => sum + size, 0)
  stats.storageEstimate = {
    totalBytes: totalSize,
    totalMB: (totalSize / (1024 * 1024)).toFixed(2),
    averageLogSize: totalLogs > 0 ? Math.round(totalSize / totalLogs) : 0,
    projectedGrowth: await calculateGrowthProjection(db, now)
  }
  
  return stats
}

/**
 * Gather audit analytics and activity patterns
 */
async function gatherAuditAnalytics(db, options) {
  const { timeRange, category, userId } = options
  const now = new Date()
  
  // Calculate time range
  const timeRangeMs = parseTimeRange(timeRange)
  const startTime = new Date(now.getTime() - timeRangeMs)
  
  // Build base query
  let query = db.collection('audit_logs')
    .where('timestamp', '>=', startTime)
    .orderBy('timestamp', 'desc')
  
  if (userId) {
    query = query.where('userId', '==', userId)
  }
  
  // Get activity data (limited for performance)
  const activitySnapshot = await query.limit(1000).get()
  const activities = activitySnapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data(),
    timestamp: doc.data().timestamp?.toDate?.()
  }))
  
  // Analyze patterns
  const analytics = {
    timeRange,
    totalActivities: activities.length,
    activityPatterns: analyzeActivityPatterns(activities),
    topActions: getTopActions(activities),
    userActivity: getUserActivityBreakdown(activities),
    securityEvents: getSecurityEvents(activities),
    systemHealth: getSystemHealthIndicators(activities),
    trends: calculateActivityTrends(activities, timeRangeMs)
  }
  
  return analytics
}

/* ---------- Analysis Helper Functions ---------- */

/**
 * Calculate health metrics for the retention system
 */
async function calculateHealthMetrics(db, now) {
  const metrics = {
    lastCleanup: null,
    cleanupFrequency: 'unknown',
    errorRate: 0,
    systemLoad: 'normal'
  }
  
  try {
    // Get last cleanup
    const lastCleanupSnapshot = await db.collection('audit_logs')
      .where('action', '==', 'retention_cleanup')
      .orderBy('timestamp', 'desc')
      .limit(1)
      .get()
    
    if (!lastCleanupSnapshot.empty) {
      metrics.lastCleanup = lastCleanupSnapshot.docs[0].data().timestamp?.toDate?.()
    }
    
    // Calculate error rate (last 24 hours)
    const dayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000)
    const errorsSnapshot = await db.collection('audit_logs')
      .where('timestamp', '>=', dayAgo)
      .where('action', '>=', 'error_')
      .where('action', '<', 'error_~')
      .count()
      .get()
    
    const totalSnapshot = await db.collection('audit_logs')
      .where('timestamp', '>=', dayAgo)
      .count()
      .get()
    
    const errors = errorsSnapshot.data().count
    const total = totalSnapshot.data().count
    
    metrics.errorRate = total > 0 ? (errors / total * 100).toFixed(2) : 0
    
    // Determine system load based on recent activity
    if (total > 1000) metrics.systemLoad = 'high'
    else if (total > 500) metrics.systemLoad = 'moderate'
    else metrics.systemLoad = 'normal'
    
  } catch (error) {
    console.error('Error calculating health metrics:', error)
  }
  
  return metrics
}

/**
 * Estimate storage size for logs
 */
function estimateStorageSize(count, tier) {
  // Average log sizes by tier (estimated bytes)
  const averageSizes = {
    compliance: 800,  // Detailed logs
    security: 600,    // Security events
    standard: 400,    // Normal logs
    operational: 200, // System logs
    compressed: 100   // Compressed logs
  }
  
  return count * (averageSizes[tier] || 400)
}

/**
 * Parse time range string to milliseconds
 */
function parseTimeRange(timeRange) {
  const ranges = {
    '1d': 24 * 60 * 60 * 1000,
    '7d': 7 * 24 * 60 * 60 * 1000,
    '30d': 30 * 24 * 60 * 60 * 1000,
    '90d': 90 * 24 * 60 * 60 * 1000
  }
  
  return ranges[timeRange] || ranges['30d']
}

/**
 * Analyze activity patterns (hourly distribution, etc.)
 */
function analyzeActivityPatterns(activities) {
  const patterns = {
    hourlyDistribution: new Array(24).fill(0),
    dailyDistribution: new Array(7).fill(0),
    peakHour: 0,
    peakDay: 0
  }
  
  activities.forEach(activity => {
    if (activity.timestamp) {
      const hour = activity.timestamp.getHours()
      const day = activity.timestamp.getDay()
      
      patterns.hourlyDistribution[hour]++
      patterns.dailyDistribution[day]++
    }
  })
  
  // Find peaks
  patterns.peakHour = patterns.hourlyDistribution.indexOf(Math.max(...patterns.hourlyDistribution))
  patterns.peakDay = patterns.dailyDistribution.indexOf(Math.max(...patterns.dailyDistribution))
  
  return patterns
}

/**
 * Get top actions by frequency
 */
function getTopActions(activities) {
  const actionCounts = {}
  
  activities.forEach(activity => {
    actionCounts[activity.action] = (actionCounts[activity.action] || 0) + 1
  })
  
  return Object.entries(actionCounts)
    .sort(([,a], [,b]) => b - a)
    .slice(0, 10)
    .map(([action, count]) => ({ action, count }))
}

/**
 * Get user activity breakdown
 */
function getUserActivityBreakdown(activities) {
  const userCounts = {}
  
  activities.forEach(activity => {
    const userId = activity.userId || 'unknown'
    userCounts[userId] = (userCounts[userId] || 0) + 1
  })
  
  return Object.entries(userCounts)
    .sort(([,a], [,b]) => b - a)
    .slice(0, 10)
    .map(([userId, count]) => ({ userId, count }))
}

/**
 * Get security-related events
 */
function getSecurityEvents(activities) {
  const securityActions = [
    'unauthorized_access',
    'failed_permission_check',
    'user_deleted',
    'role_changed',
    'security_alert'
  ]
  
  return activities.filter(activity => 
    securityActions.some(action => activity.action.includes(action))
  ).length
}

/**
 * Get system health indicators from activities
 */
function getSystemHealthIndicators(activities) {
  const errors = activities.filter(a => a.action.includes('error') || a.action.includes('failed')).length
  const total = activities.length
  
  return {
    errorCount: errors,
    errorRate: total > 0 ? (errors / total * 100).toFixed(2) : 0,
    healthStatus: errors / total < 0.05 ? 'healthy' : errors / total < 0.1 ? 'warning' : 'critical'
  }
}

/**
 * Calculate activity trends
 */
function calculateActivityTrends(activities, timeRangeMs) {
  const buckets = 10 // Divide time range into buckets
  const bucketSize = timeRangeMs / buckets
  const now = Date.now()
  
  const trend = new Array(buckets).fill(0)
  
  activities.forEach(activity => {
    if (activity.timestamp) {
      const age = now - activity.timestamp.getTime()
      const bucket = Math.floor(age / bucketSize)
      if (bucket >= 0 && bucket < buckets) {
        trend[buckets - 1 - bucket]++ // Reverse to show oldest to newest
      }
    }
  })
  
  return trend
}

/**
 * Calculate growth projection based on recent trends
 */
async function calculateGrowthProjection(db, now) {
  try {
    // Get activity for last 30 days
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
    const recentSnapshot = await db.collection('audit_logs')
      .where('timestamp', '>=', thirtyDaysAgo)
      .count()
      .get()
    
    const recentCount = recentSnapshot.data().count
    const dailyAverage = recentCount / 30
    
    return {
      dailyAverage: Math.round(dailyAverage),
      monthlyProjection: Math.round(dailyAverage * 30),
      yearlyProjection: Math.round(dailyAverage * 365)
    }
    
  } catch (error) {
    console.error('Error calculating growth projection:', error)
    return {
      dailyAverage: 0,
      monthlyProjection: 0,
      yearlyProjection: 0
    }
  }
}

module.exports = {
  getRetentionStats: exports.getRetentionStats,
  getAuditStatistics: exports.getAuditStatistics
}