// useAudit.js - Fixed to only use CREATE operations
import { collection, addDoc, serverTimestamp, query, where, orderBy, limit, getDocs } from 'firebase/firestore'
import { db } from '../firebase'
import { useAuthStore } from '../stores/auth'

// Retention configuration
const RETENTION_CONFIG = {
  FULL_RETENTION_DAYS: 90,
  COMPRESSED_RETENTION_DAYS: 365,
  COMPLIANCE_ACTIONS: [
    'user_deleted',
    'role_changed',
    'permission_granted',
    'permission_revoked',
    'security_alert',
    'unauthorized_access'
  ],
  CLEANUP_BATCH_SIZE: 100,
  CLEANUP_INTERVAL_DAYS: 7
}

export function useAudit() {
  const authStore = useAuthStore()

  /**
   * Log an audit event - ONLY uses CREATE operations
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

      // Create audit log entry - ALWAYS CREATE NEW DOCUMENT
      const auditEntry = {
        action: action.toLowerCase().trim(),
        details: cleanDetails,
        timestamp: serverTimestamp(),
        userId: authStore.user.uid,
        userEmail: authStore.user.email || 'unknown@system',

        // Retention metadata
        retentionTier: getRetentionTier(action),
        compressAfter: getCompressionDate(action),
        deleteAfter: getDeletionDate(action),

        // System metadata
        userAgent: navigator.userAgent || 'unknown',
        ipAddress: 'client', // Will be set by Cloud Functions if needed
        sessionId: authStore.sessionId || 'unknown'
      }

      // Use addDoc to CREATE a new document (never update)
      await addDoc(collection(db, 'audit_logs'), auditEntry)

    } catch (error) {
      // Don't throw error to avoid breaking app functionality
      // In development, show more details
      if (import.meta.env.DEV) {
        }
    }
  }

  /**
   * Get retention tier for action
   */
  function getRetentionTier(action) {
    if (RETENTION_CONFIG.COMPLIANCE_ACTIONS.includes(action)) {
      return 'compliance'
    }
    if (action.includes('admin') || action.includes('system')) {
      return 'admin'
    }
    return 'standard'
  }

  /**
   * Get compression date
   */
  function getCompressionDate(action) {
    const date = new Date()
    date.setDate(date.getDate() + RETENTION_CONFIG.FULL_RETENTION_DAYS)
    return date
  }

  /**
   * Get deletion date
   */
  function getDeletionDate(action) {
    const date = new Date()
    const days = RETENTION_CONFIG.COMPLIANCE_ACTIONS.includes(action)
      ? RETENTION_CONFIG.COMPRESSED_RETENTION_DAYS * 2 // Compliance logs kept longer
      : RETENTION_CONFIG.COMPRESSED_RETENTION_DAYS
    date.setDate(date.getDate() + days)
    return date
  }

  /**
   * Get recent audit logs for current user
   */
  async function getRecentActivity(limitCount = 50) {
    if (!authStore.user) return []

    try {
      const q = query(
        collection(db, 'audit_logs'),
        where('userId', '==', authStore.user.uid),
        orderBy('timestamp', 'desc'),
        limit(limitCount)
      )

      const snapshot = await getDocs(q)
      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }))
    } catch (error) {
      return []
    }
  }

  // Pre-defined audit logging functions for common actions
  const log = {
    // Authentication events
    userLogin: (details = {}) => logEvent('user_login', details),
    userLogout: (details = {}) => logEvent('user_logout', details),

    // Profile events
    profileViewed: (details = {}) => logEvent('profile_viewed', details),
    profileUpdated: (details = {}) => logEvent('profile_updated', details),
    settingsChanged: (details = {}) => logEvent('settings_changed', details),
    passwordChanged: (details = {}) => logEvent('password_changed', details),

    // Admin events
    adminPanelAccessed: (details = {}) => logEvent('admin_panel_accessed', details),
    adminTabViewed: (tab) => logEvent('admin_tab_viewed', { tab }),
    userCreated: (details = {}) => logEvent('user_created', details),
    userUpdated: (details = {}) => logEvent('user_updated', details),
    userDeleted: (details = {}) => logEvent('user_deleted', details),
    roleChanged: (details = {}) => logEvent('role_changed', details),
    permissionGranted: (details = {}) => logEvent('permission_granted', details),
    permissionRevoked: (details = {}) => logEvent('permission_revoked', details),
    bulkOperation: (details = {}) => logEvent('bulk_operation', details),

    // Project events (ready for future)
    projectCreated: (details = {}) => logEvent('project_created', details),
    projectUpdated: (details = {}) => logEvent('project_updated', details),
    projectDeleted: (details = {}) => logEvent('project_deleted', details),
    projectViewed: (details = {}) => logEvent('project_viewed', details),

    // Forum events (ready for future)
    forumPostCreated: (details = {}) => logEvent('forum_post_created', details),
    forumPostUpdated: (details = {}) => logEvent('forum_post_updated', details),
    forumPostDeleted: (details = {}) => logEvent('forum_post_deleted', details),

    // Calendar events (ready for future)
    eventCreated: (details = {}) => logEvent('event_created', details),
    eventUpdated: (details = {}) => logEvent('event_updated', details),
    eventDeleted: (details = {}) => logEvent('event_deleted', details),

    // Security events
    securityAlert: (details = {}) => logEvent('security_alert', details),
    unauthorizedAccess: (details = {}) => logEvent('unauthorized_access', details),
    systemError: (details = {}) => logEvent('system_error', details),

    // Generic logging
    custom: (action, details = {}) => logEvent(action, details)
  }

  // ESSENTIAL: Return all functions and utilities
  return {
    logEvent,
    getRecentActivity,
    log,
    // Retention utilities for reference
    RETENTION_CONFIG,
    // Helper functions
    getRetentionTier,
    getCompressionDate,
    getDeletionDate
  }
}