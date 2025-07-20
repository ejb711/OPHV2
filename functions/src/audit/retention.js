// functions/src/audit/retention.js - Audit Log Retention System
// Automated cleanup and compression of audit logs based on retention policies

const functions = require('firebase-functions/v1')
const admin = require('firebase-admin')
const { RETENTION_CONFIG, RETENTION_TIERS } = require('../config/audit')
const { getUserPermissions, validateAuth, validatePermission } = require('../utils/permissions')

/* ---------- Scheduled Cleanup Function ---------- */

/**
 * Weekly scheduled cleanup of audit logs
 * Runs every Sunday at 2 AM to compress and delete old logs
 */
exports.cleanupAuditLogs = functions.pubsub.schedule('0 2 * * 0').onRun(async (context) => {
  console.log('🧹 Starting weekly audit log cleanup...')
  
  const db = admin.firestore()
  const now = new Date()
  const stats = {
    startTime: now.toISOString(),
    processed: 0,
    compressed: 0,
    deleted: 0,
    errors: 0,
    batches: 0
  }
  
  try {
    // Process compression (logs older than 90 days, not yet compressed)
    await processCompression(db, now, stats)
    
    // Process deletion (logs older than retention period)
    await processDeletion(db, now, stats)
    
    // Log cleanup statistics
    await logCleanupStats(stats)
    
    console.log(`✅ Audit cleanup completed: ${stats.processed} logs processed`)
    return { success: true, stats }
    
  } catch (error) {
    console.error('❌ Error during audit cleanup:', error)
    stats.errors++
    
    await logCleanupError(error, stats)
    return { success: false, error: error.message, stats }
  }
})

/* ---------- Manual Cleanup Function ---------- */

/**
 * Manual cleanup trigger for administrators
 * Allows on-demand cleanup with real-time progress
 */
exports.manualCleanupAuditLogs = functions.runWith({
  timeoutSeconds: 540, // 9 minutes
  memory: '512MB'
}).https.onCall(async (data, context) => {
  validateAuth(context)
  
  // Check permissions
  const userPerms = await getUserPermissions(context.auth.uid)
  validatePermission(userPerms, 'manage_system', 'perform manual audit cleanup')
  
  console.log(`🧹 Manual audit cleanup initiated by: ${context.auth.token.email}`)
  
  const db = admin.firestore()
  const now = new Date()
  const stats = {
    startTime: now.toISOString(),
    processed: 0,
    compressed: 0,
    deleted: 0,
    errors: 0,
    batches: 0,
    initiatedBy: context.auth.uid,
    initiatorEmail: context.auth.token.email
  }
  
  try {
    // Process with smaller batches for manual operation
    const originalBatchSize = RETENTION_CONFIG.CLEANUP_BATCH_SIZE
    RETENTION_CONFIG.CLEANUP_BATCH_SIZE = 50 // Smaller batches for manual operation
    
    await processCompression(db, now, stats)
    await processDeletion(db, now, stats)
    
    // Restore original batch size
    RETENTION_CONFIG.CLEANUP_BATCH_SIZE = originalBatchSize
    
    await logCleanupStats(stats, 'manual')
    
    return {
      success: true,
      message: `Cleanup completed! Processed ${stats.processed} logs (${stats.compressed} compressed, ${stats.deleted} deleted)`,
      stats
    }
    
  } catch (error) {
    console.error('❌ Error in manual cleanup:', error)
    stats.errors++
    
    await logCleanupError(error, stats, 'manual')
    throw new functions.https.HttpsError('internal', `Cleanup failed: ${error.message}`)
  }
})

/* ---------- Processing Functions ---------- */

/**
 * Process log compression for old but not yet compressed logs
 */
async function processCompression(db, now, stats) {
  console.log('📦 Processing log compression...')
  
  const compressionCutoff = new Date(now.getTime() - RETENTION_CONFIG.FULL_RETENTION_DAYS * 24 * 60 * 60 * 1000)
  
  let hasMore = true
  let lastDoc = null
  
  while (hasMore) {
    // Build query for logs needing compression
    let query = db.collection('audit_logs')
      .where('timestamp', '<', compressionCutoff)
      .where('retentionTier', 'in', ['standard', 'security']) // Don't compress compliance or operational
      .limit(RETENTION_CONFIG.CLEANUP_BATCH_SIZE)
      .orderBy('timestamp')
    
    if (lastDoc) {
      query = query.startAfter(lastDoc)
    }
    
    const snapshot = await query.get()
    
    if (snapshot.empty) {
      hasMore = false
      break
    }
    
    const batch = db.batch()
    
    snapshot.docs.forEach(doc => {
      const data = doc.data()
      
      // Create compressed version
      const compressedData = {
        action: data.action,
        userId: data.userId,
        targetUserId: data.targetUserId || null,
        timestamp: data.timestamp,
        retentionTier: 'compressed',
        compressedAt: admin.firestore.FieldValue.serverTimestamp(),
        originalSize: JSON.stringify(data).length,
        compressedFrom: data.retentionTier
      }
      
      batch.update(doc.ref, compressedData)
      stats.compressed++
    })
    
    await batch.commit()
    stats.batches++
    stats.processed += snapshot.docs.length
    
    lastDoc = snapshot.docs[snapshot.docs.length - 1]
    
    // Prevent infinite loops
    if (stats.batches >= RETENTION_CONFIG.MAX_BATCH_OPERATIONS) {
      console.log('⚠️ Reached maximum batch operations limit')
      break
    }
  }
  
  console.log(`📦 Compression complete: ${stats.compressed} logs compressed`)
}

/**
 * Process log deletion for logs past their retention period
 */
async function processDeletion(db, now, stats) {
  console.log('🗑️ Processing log deletion...')
  
  // Process each retention tier
  for (const [tierName, tierConfig] of Object.entries(RETENTION_TIERS)) {
    if (tierName === 'compliance') continue // Never auto-delete compliance logs
    
    const deletionCutoff = new Date(now.getTime() - tierConfig.retentionDays * 24 * 60 * 60 * 1000)
    
    let hasMore = true
    let processed = 0
    
    while (hasMore && processed < 1000) { // Safety limit per tier
      const query = db.collection('audit_logs')
        .where('timestamp', '<', deletionCutoff)
        .where('retentionTier', '==', tierName)
        .limit(RETENTION_CONFIG.CLEANUP_BATCH_SIZE)
        .orderBy('timestamp')
      
      const snapshot = await query.get()
      
      if (snapshot.empty) {
        hasMore = false
        break
      }
      
      const batch = db.batch()
      
      snapshot.docs.forEach(doc => {
        batch.delete(doc.ref)
        stats.deleted++
      })
      
      await batch.commit()
      processed += snapshot.docs.length
      stats.batches++
    }
  }
  
  console.log(`🗑️ Deletion complete: ${stats.deleted} logs deleted`)
}

/* ---------- Logging Functions ---------- */

/**
 * Log cleanup statistics
 */
async function logCleanupStats(stats, type = 'scheduled') {
  const endTime = new Date().toISOString()
  const duration = new Date(endTime).getTime() - new Date(stats.startTime).getTime()
  
  const auditEntry = {
    action: 'retention_cleanup',
    userId: stats.initiatedBy || 'system',
    userEmail: stats.initiatorEmail || 'system@ophv2.app',
    timestamp: admin.firestore.FieldValue.serverTimestamp(),
    retentionTier: 'operational',
    details: {
      type,
      ...stats,
      endTime,
      durationMs: duration,
      durationMinutes: Math.round(duration / 60000)
    }
  }
  
  try {
    await admin.firestore().collection('audit_logs').add(auditEntry)
  } catch (error) {
    console.error('Failed to log cleanup stats:', error)
  }
}

/**
 * Log cleanup errors
 */
async function logCleanupError(error, stats, type = 'scheduled') {
  const auditEntry = {
    action: 'retention_cleanup_failed',
    userId: stats.initiatedBy || 'system',
    userEmail: stats.initiatorEmail || 'system@ophv2.app',
    timestamp: admin.firestore.FieldValue.serverTimestamp(),
    retentionTier: 'security', // Security tier for errors
    details: {
      type,
      error: error.message,
      errorCode: error.code || 'unknown',
      stack: error.stack,
      partialStats: stats,
      failedAt: new Date().toISOString()
    }
  }
  
  try {
    await admin.firestore().collection('audit_logs').add(auditEntry)
  } catch (logError) {
    console.error('Failed to log cleanup error:', logError)
  }
}

/* ---------- Utility Functions ---------- */

/**
 * Get cleanup statistics for monitoring
 */
async function getCleanupStatistics() {
  try {
    const db = admin.firestore()
    const now = new Date()
    
    // Get counts by retention tier
    const tierCounts = {}
    for (const tierName of Object.keys(RETENTION_TIERS)) {
      const snapshot = await db.collection('audit_logs')
        .where('retentionTier', '==', tierName)
        .count()
        .get()
      
      tierCounts[tierName] = snapshot.data().count
    }
    
    // Get recent cleanup history
    const recentCleanups = await db.collection('audit_logs')
      .where('action', '==', 'retention_cleanup')
      .orderBy('timestamp', 'desc')
      .limit(10)
      .get()
    
    return {
      tierCounts,
      recentCleanups: recentCleanups.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        timestamp: doc.data().timestamp?.toDate?.()
      })),
      lastUpdated: now.toISOString()
    }
    
  } catch (error) {
    console.error('Error getting cleanup statistics:', error)
    return null
  }
}

module.exports = {
  cleanupAuditLogs: exports.cleanupAuditLogs,
  manualCleanupAuditLogs: exports.manualCleanupAuditLogs,
  getCleanupStatistics
}