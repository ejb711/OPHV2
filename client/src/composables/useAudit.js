// client/src/composables/useAudit.js
import { httpsCallable } from 'firebase/functions'
import { functions } from '../firebase'

export function useAudit() {
  /**
   * Log an audit event through Cloud Function
   * @param {string} action - The action type (e.g., 'user_updated', 'role_changed')
   * @param {object} details - Additional details about the action
   */
  async function logEvent(action, details) {
    try {
      const logAuditEvent = httpsCallable(functions, 'logAuditEvent')
      await logAuditEvent({ action, details })
    } catch (error) {
      console.error('Failed to log audit event:', error)
      // Don't throw - audit logging failure shouldn't break the app
    }
  }

  /**
   * Common audit event helpers
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
      logEvent('role_changed', { 
        userId, 
        userEmail, 
        fromRole, 
        toRole 
      }),
    
    // Permission management
    permissionGranted: (userId, userEmail, permission) => 
      logEvent('permission_granted', { userId, userEmail, permission }),
    
    permissionRevoked: (userId, userEmail, permission) => 
      logEvent('permission_revoked', { userId, userEmail, permission }),
    
    // Bulk operations
    bulkOperation: (action, userCount, details) => 
      logEvent('bulk_operation', { action, userCount, details }),
    
    // Admin actions
    adminTabViewed: (tab) => 
      logEvent('admin_tab_viewed', { tab }),
    
    // Security events
    suspiciousActivity: (details) => 
      logEvent('suspicious_activity', { details }),
    
    // Custom events
    custom: (action, details) => 
      logEvent(action, details)
  }

  return {
    logEvent,
    log
  }
}