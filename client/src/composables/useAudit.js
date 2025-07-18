// Enhanced useAudit.js with automatic retention management
import { collection, addDoc, serverTimestamp, query, where, orderBy, limit, getDocs, deleteDoc, updateDoc } from 'firebase/firestore'
import { db } from '../firebase'
import { useAuthStore } from '../stores/auth'

// Retention configuration
const RETENTION_CONFIG = {
  // Keep full details for 90 days
  FULL_RETENTION_DAYS: 90,
  
  // Keep compressed logs for 365 days total
  COMPRESSED_RETENTION_DAYS: 365,
  
  // Actions that should be kept longer for compliance
  COMPLIANCE_ACTIONS: [
    'user_deleted',
    'role_changed', 
    'permission_granted',
    'permission_revoked',
    'security_alert',
    'unauthorized_access'
  ],
  
  // Max logs to process in cleanup batch
  CLEANUP_BATCH_SIZE: 100,
  
  // How often to run cleanup (in days)
  CLEANUP_INTERVAL_DAYS: 7
}

export function useAudit() {
  const authStore = useAuthStore()

  /**
   * Log an audit event with automatic retention management
   */
  async function logEvent(action, details = {}) {
    if (!action || typeof action !== 'string' || !authStore.user) {
      return
    }

    try {
      // Clean the details object
      const cleanDetails = {}
      if (details && typeof details === 'object') {
        Object.entries(details).forEach(([key, value]) => {
          if (value !== undefined && value !== null) {
            cleanDetails[key] = value
          }
        })
      }

      // Create audit log entry
      const auditEntry = {
        action: action.toLowerCase().trim(),
        details: cleanDetails,
        timestamp: serverTimestamp(),
        userId: authStore.user.uid,
        userEmail: authStore.user.email || 'unknown@system',
        
        // Retention metadata
        retentionTier: getRetentionTier(action),
        compressAfter: getCompressionDate(action),
        deleteAfter: getDeletionDate(action)
      }

      await addDoc(collection(db, 'audit_logs'), auditEntry)
      
      // Periodically run cleanup (don't await to avoid blocking)
      if (Math.random() < 0.1) { // 10% chance to trigger cleanup
        setTimeout(() => performRetentionCleanup(), 1000)
      }
      
    } catch (error) {
      console.error('Failed to log audit event:', error)
    }
  }

  /**
   * Determine retention tier based on action type
   */
  function getRetentionTier(action) {
    if (RETENTION_CONFIG.COMPLIANCE_ACTIONS.includes(action)) {
      return 'compliance' // Keep longer
    }
    
    if (action.includes('admin') || action.includes('security')) {
      return 'security' // Medium retention
    }
    
    return 'operational' // Standard retention
  }

  /**
   * Get compression date based on retention tier
   */
  function getCompressionDate(action) {
    const date = new Date()
    date.setDate(date.getDate() + RETENTION_CONFIG.FULL_RETENTION_DAYS)
    return date
  }

  /**
   * Get deletion date based on retention tier
   */
  function getDeletionDate(action) {
    const date = new Date()
    const tier = getRetentionTier(action)
    
    switch (tier) {
      case 'compliance':
        date.setDate(date.getDate() + (RETENTION_CONFIG.COMPRESSED_RETENTION_DAYS * 2)) // 2 years
        break
      case 'security':
        date.setDate(date.getDate() + RETENTION_CONFIG.COMPRESSED_RETENTION_DAYS) // 1 year
        break
      default:
        date.setDate(date.getDate() + RETENTION_CONFIG.FULL_RETENTION_DAYS) // 90 days
    }
    
    return date
  }

  /**
   * Perform automatic retention cleanup
   */
  async function performRetentionCleanup() {
    try {
      const now = new Date()
      
      // Step 1: Compress old logs (remove detailed info, keep summary)
      await compressOldLogs(now)
      
      // Step 2: Delete expired logs
      await deleteExpiredLogs(now)
      
      console.log('✅ Audit log retention cleanup completed')
    } catch (error) {
      console.error('❌ Error during retention cleanup:', error)
    }
  }

  /**
   * Compress logs older than retention period
   */
  async function compressOldLogs(now) {
    const compressionDate = new Date(now)
    compressionDate.setDate(compressionDate.getDate() - RETENTION_CONFIG.FULL_RETENTION_DAYS)
    
    const q = query(
      collection(db, 'audit_logs'),
      where('timestamp', '<', compressionDate),
      where('compressed', '==', false),
      limit(RETENTION_CONFIG.CLEANUP_BATCH_SIZE)
    )
    
    const snapshot = await getDocs(q)
    
    for (const doc of snapshot.docs) {
      const data = doc.data()
      
      // Create compressed version
      const compressedDetails = {
        action: data.action,
        userId: data.userId,
        userEmail: data.userEmail,
        timestamp: data.timestamp,
        summary: createSummary(data),
        compressed: true,
        originalSize: JSON.stringify(data.details).length
      }
      
      // Update document with compressed data
      await updateDoc(doc.ref, compressedDetails)
    }
    
    if (snapshot.docs.length > 0) {
      console.log(`🗜️ Compressed ${snapshot.docs.length} audit logs`)
    }
  }

  /**
   * Delete logs past their retention period
   */
  async function deleteExpiredLogs(now) {
    const deletionDate = new Date(now)
    deletionDate.setDate(deletionDate.getDate() - RETENTION_CONFIG.COMPRESSED_RETENTION_DAYS)
    
    const q = query(
      collection(db, 'audit_logs'),
      where('timestamp', '<', deletionDate),
      limit(RETENTION_CONFIG.CLEANUP_BATCH_SIZE)
    )
    
    const snapshot = await getDocs(q)
    
    for (const doc of snapshot.docs) {
      // Don't delete compliance logs
      const data = doc.data()
      if (data.retentionTier !== 'compliance') {
        await deleteDoc(doc.ref)
      }
    }
    
    if (snapshot.docs.length > 0) {
      console.log(`🗑️ Deleted ${snapshot.docs.length} expired audit logs`)
    }
  }

  /**
   * Create summary for compressed logs
   */
  function createSummary(logData) {
    const { action, details } = logData
    
    // Create human-readable summaries
    switch (action) {
      case 'user_updated':
        return `User ${details.userEmail} updated by ${logData.userEmail}`
      case 'role_changed':
        return `Role changed from ${details.fromRole} to ${details.toRole}`
      case 'admin_tab_viewed':
        return `Viewed ${details.tab} tab`
      default:
        return `${action.replace(/_/g, ' ')} action`
    }
  }

  /**
   * Get retention statistics for monitoring
   */
  async function getRetentionStats() {
    try {
      const now = new Date()
      const thirtyDaysAgo = new Date(now)
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

      // Count recent logs
      const recentQuery = query(
        collection(db, 'audit_logs'),
        where('timestamp', '>', thirtyDaysAgo)
      )
      const recentSnapshot = await getDocs(recentQuery)

      // Count compressed logs
      const compressedQuery = query(
        collection(db, 'audit_logs'),
        where('compressed', '==', true)
      )
      const compressedSnapshot = await getDocs(compressedQuery)

      return {
        totalLogs: recentSnapshot.size,
        compressedLogs: compressedSnapshot.size,
        storageEstimate: estimateStorageUsage(recentSnapshot.docs),
        retentionHealth: 'good' // Could be calculated based on ratios
      }
    } catch (error) {
      console.error('Error getting retention stats:', error)
      return null
    }
  }

  /**
   * Estimate storage usage
   */
  function estimateStorageUsage(docs) {
    let totalBytes = 0
    docs.forEach(doc => {
      totalBytes += JSON.stringify(doc.data()).length
    })
    
    // Convert to human readable
    if (totalBytes < 1024) return `${totalBytes} B`
    if (totalBytes < 1024 * 1024) return `${(totalBytes / 1024).toFixed(1)} KB`
    return `${(totalBytes / (1024 * 1024)).toFixed(1)} MB`
  }

  /**
   * Predefined audit event helpers
   */
  const log = {
    // User management
    userCreated: (userEmail) => 
      logEvent('user_created', { userEmail }),
    
    userUpdated: (userId, userEmail, changes) => 
      logEvent('user_updated', { userId, userEmail, changes }),
    
    userDeleted: (userId, userEmail) => 
      logEvent('user_deleted', { userId, userEmail }),
    
    roleChanged: (userId, userEmail, fromRole, toRole) => 
      logEvent('role_changed', { userId, userEmail, fromRole, toRole }),
    
    // Permission management
    permissionGranted: (userId, userEmail, permission) => 
      logEvent('permission_granted', { userId, userEmail, permission }),
    
    permissionRevoked: (userId, userEmail, permission) => 
      logEvent('permission_revoked', { userId, userEmail, permission }),
    
    // Admin actions
    adminTabViewed: (tab) => 
      logEvent('admin_tab_viewed', { tab }),
    
    // Data operations
    dataExported: (type, recordCount, filters = {}) => 
      logEvent('data_exported', { type, recordCount, filters }),
    
    // Security events
    unauthorizedAccess: (attemptedAction, resource) => 
      logEvent('unauthorized_access', { attemptedAction, resource }),
    
    suspiciousActivity: (details) => 
      logEvent('suspicious_activity', details),
    
    // Bulk operations
    bulkOperation: (operation, userCount, details = {}) => 
      logEvent('bulk_operation', { operation, userCount, ...details }),
    
    // Authentication
    userLogin: (method = 'email') => 
      logEvent('user_login', { method }),
    
    userLogout: () => 
      logEvent('user_logout', {}),
    
    // Custom events
    custom: (action, details = {}) => 
      logEvent(action, details)
  }

  return {
    logEvent,
    log,
    performRetentionCleanup,
    getRetentionStats,
    RETENTION_CONFIG
  }
}