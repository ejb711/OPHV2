// functions/src/config/audit.js - Audit System Configuration
// Centralized audit logging and retention configuration for OPHV2

/* ---------- Retention Configuration ---------- */
const RETENTION_CONFIG = {
  // Standard retention periods
  FULL_RETENTION_DAYS: 90,
  COMPRESSED_RETENTION_DAYS: 365,
  COMPLIANCE_RETENTION_YEARS: 7,
  
  // Batch processing limits
  CLEANUP_BATCH_SIZE: 100,
  MAX_BATCH_OPERATIONS: 500,
  CLEANUP_INTERVAL_DAYS: 7,
  
  // Performance settings
  QUERY_LIMIT: 1000,
  TIMEOUT_SECONDS: 540, // 9 minutes (under 10min function limit)
  RETRY_ATTEMPTS: 3
}

/* ---------- Action Classifications ---------- */
const COMPLIANCE_ACTIONS = [
  // Critical security events
  'user_deleted',
  'user_role_changed', 
  'permission_granted',
  'permission_revoked',
  'admin_access_granted',
  'system_access_attempt',
  
  // Security alerts
  'security_alert',
  'unauthorized_access',
  'failed_permission_check',
  'suspicious_activity',
  
  // Data modifications
  'data_export',
  'bulk_operation',
  'system_configuration_changed',
  'role_permissions_modified'
]

const STANDARD_ACTIONS = [
  // Regular user activities
  'user_created',
  'user_updated',
  'user_login',
  'user_logout',
  'profile_updated',
  
  // Content operations
  'project_created',
  'project_updated',
  'project_deleted',
  'post_created',
  'post_updated',
  'event_created',
  
  // System operations
  'system_backup',
  'routine_maintenance',
  'cache_cleared'
]

const SYSTEM_ACTIONS = [
  // Automated system events
  'retention_cleanup',
  'index_maintenance',
  'health_check',
  'backup_completed',
  'function_executed'
]

/* ---------- Retention Tiers ---------- */
const RETENTION_TIERS = {
  compliance: {
    name: 'Compliance',
    description: 'Long-term retention for regulatory compliance',
    retentionDays: 365 * 7, // 7 years
    compressionDays: 365,   // Compress after 1 year
    priority: 'high'
  },
  
  security: {
    name: 'Security',
    description: 'Security-related events with extended retention',
    retentionDays: 365 * 2, // 2 years
    compressionDays: 180,   // Compress after 6 months
    priority: 'high'
  },
  
  standard: {
    name: 'Standard',
    description: 'Normal business operations',
    retentionDays: 365,     // 1 year
    compressionDays: 90,    // Compress after 3 months
    priority: 'medium'
  },
  
  operational: {
    name: 'Operational',
    description: 'System operations and maintenance',
    retentionDays: 90,      // 3 months
    compressionDays: 30,    // Compress after 1 month
    priority: 'low'
  }
}

/* ---------- Helper Functions ---------- */

/**
 * Determine retention tier based on action
 */
function getRetentionTier(action) {
  if (COMPLIANCE_ACTIONS.includes(action)) {
    return 'compliance'
  }
  
  if (action.includes('security') || action.includes('unauthorized') || action.includes('failed')) {
    return 'security'
  }
  
  if (SYSTEM_ACTIONS.includes(action)) {
    return 'operational'
  }
  
  return 'standard'
}

/**
 * Get compression date based on action
 */
function getCompressionDate(action) {
  const tier = getRetentionTier(action)
  const config = RETENTION_TIERS[tier]
  return new Date(Date.now() + config.compressionDays * 24 * 60 * 60 * 1000)
}

/**
 * Get deletion date based on action
 */
function getDeletionDate(action) {
  const tier = getRetentionTier(action)
  const config = RETENTION_TIERS[tier]
  return new Date(Date.now() + config.retentionDays * 24 * 60 * 60 * 1000)
}

/**
 * Determine retention health status
 */
function getRetentionHealth(totalLogs, compressedLogs, recentLogs) {
  if (totalLogs === 0) return 'unknown'
  
  const compressionRate = compressedLogs / totalLogs
  const recentRate = recentLogs / totalLogs
  
  // Health scoring logic
  if (compressionRate > 0.8) return 'poor'      // Too many old logs
  if (compressionRate > 0.5) return 'warning'   // Moderate compression needed
  if (recentRate > 0.7) return 'good'           // Healthy activity
  if (recentRate > 0.3) return 'excellent'      // Optimal balance
  
  return 'good' // Default
}

module.exports = {
  RETENTION_CONFIG,
  COMPLIANCE_ACTIONS,
  STANDARD_ACTIONS,
  SYSTEM_ACTIONS,
  RETENTION_TIERS,
  
  // Helper functions
  getRetentionTier,
  getCompressionDate,
  getDeletionDate,
  getRetentionHealth
}