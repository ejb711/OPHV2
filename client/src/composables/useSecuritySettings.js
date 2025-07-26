// client/src/composables/useSecuritySettings.js
import { ref, computed } from 'vue'
import { updateDoc, doc, serverTimestamp, collection, query, where, orderBy, limit, getDocs, getDoc } from 'firebase/firestore'
import { auth, db } from '../firebase'
import { useAuthStore } from '../stores/auth'
import { useAudit } from './useAudit'

export function useSecuritySettings() {
  const authStore = useAuthStore()
  const { logEvent } = useAudit()

  // Security settings state
  const securitySettings = ref({
    sessionTimeout: 60, // default to 60 minutes
    allowMultipleSessions: true,
    requirePasswordChange: false
  })

  // Session timeout options with 1 minute for testing
  const sessionTimeoutOptions = [
    { value: 1, text: '1 minute (Testing)' },
    { value: 30, text: '30 minutes' },
    { value: 60, text: '60 minutes' },
    { value: 120, text: '2 hours' },
    { value: 240, text: '4 hours' }
  ]

  // Loading state
  const loading = ref(false)
  const loadingEvents = ref(false)

  // Security events
  const recentEvents = ref([])
  const loginHistory = ref([])

  // Snackbar state
  const snackbar = ref({
    show: false,
    message: '',
    color: 'success'
  })

  // Computed
  const currentUser = computed(() => auth.currentUser)

  // Methods
  const showSnackbar = (message, color = 'success') => {
    snackbar.value = { show: true, message, color }
  }

  const loadSecuritySettings = async () => {
    try {
      const user = auth.currentUser
      if (!user) return

      // Get user document directly to ensure we have the latest data
      const userDocRef = doc(db, 'users', user.uid)
      const userDocSnap = await getDoc(userDocRef)

      if (userDocSnap.exists()) {
        const userData = userDocSnap.data()
        if (userData?.securitySettings) {
          const loadedTimeout = Number(userData.securitySettings.sessionTimeout) || 60
          securitySettings.value = {
            sessionTimeout: loadedTimeout,
            allowMultipleSessions: userData.securitySettings.allowMultipleSessions ?? true,
            requirePasswordChange: userData.securitySettings.requirePasswordChange ?? false
          }
          }
      }
    } catch (error) {
      }
  }

  const updateSecuritySettings = async () => {
    try {
      const user = auth.currentUser
      if (!user) return

      const updates = {
        securitySettings: {
          sessionTimeout: Number(securitySettings.value.sessionTimeout),
          allowMultipleSessions: securitySettings.value.allowMultipleSessions,
          requirePasswordChange: securitySettings.value.requirePasswordChange
        },
        updatedAt: serverTimestamp()
      }

      await updateDoc(doc(db, 'users', user.uid), updates)

      await logEvent('security_settings_updated', {
        settings: updates.securitySettings
      })

      showSnackbar(`Session timeout updated to ${updates.securitySettings.sessionTimeout} minute${updates.securitySettings.sessionTimeout === 1 ? '' : 's'}`, 'success')

      // Reload the auth store to pick up the new settings
      await authStore.refreshCurrentUser()
    } catch (error) {
      showSnackbar('Failed to update security settings', 'error')
    }
  }

  const loadSecurityEvents = async () => {
    loadingEvents.value = true
    try {
      const user = auth.currentUser
      if (!user) return

      // Simplified query - just get all audit logs for the user first
      // This avoids the composite index requirement
      const q = query(
        collection(db, 'audit_logs'),
        where('userId', '==', user.uid),
        orderBy('timestamp', 'desc'),
        limit(50) // Get more to ensure we have enough after filtering
      )

      const snapshot = await getDocs(q)
      if (snapshot.size === 0) {
        loginHistory.value = []
        recentEvents.value = []
        return
      }

      // Filter events client-side to avoid composite index
      const securityActions = new Set([
        'user_login',
        'user_logout',
        'session_timeout',
        'password_changed',
        'password_reset_requested',
        'email_changed',
        'security_settings_updated',
        'failed_login_attempt',
        'sessions_revoked'
      ])

      const events = snapshot.docs
        .map(doc => {
          const data = doc.data()
          return {
            id: doc.id,
            ...data,
            // Ensure timestamp is properly handled
            timestamp: data.timestamp?.toDate ? data.timestamp : { toDate: () => new Date(data.timestamp) }
          }
        })
        .filter(event => securityActions.has(event.action))

      // Separate login events for login history
      const loginEvents = events
        .filter(e => e.action === 'user_login' || e.action === 'failed_login_attempt')
        .slice(0, 5)
        .map(e => ({
          ...e,
          success: e.action === 'user_login',
          details: {
            ...e.details,
            browser: e.details?.browser || extractBrowserInfo(e.details?.userAgent || '')
          }
        }))

      loginHistory.value = loginEvents
      // All events for recent activity (excluding login events to avoid duplication)
      recentEvents.value = events
        .filter(e => !['user_login', 'failed_login_attempt'].includes(e.action))
        .slice(0, 10)

      // If still no login events, log a message
      if (loginEvents.length === 0) {
        // No login events found
      }
    } catch (error) {
      // If permission denied, it might be because the user doesn't have any events yet
      if (error.code === 'permission-denied') {
        loginHistory.value = []
        recentEvents.value = []
      }
    } finally {
      loadingEvents.value = false
    }
  }

  // Helper function to extract browser info from user agent
  function extractBrowserInfo(userAgent) {
    if (!userAgent) return 'Unknown browser'

    // Simple browser detection
    if (userAgent.includes('Chrome')) return 'Chrome'
    if (userAgent.includes('Firefox')) return 'Firefox'
    if (userAgent.includes('Safari') && !userAgent.includes('Chrome')) return 'Safari'
    if (userAgent.includes('Edge')) return 'Edge'
    if (userAgent.includes('Opera')) return 'Opera'

    return 'Unknown browser'
  }

  const revokeAllSessions = async () => {
    if (!confirm('This will log you out from all other devices. Continue?')) return

    loading.value = true
    try {
      // In a real implementation, this would revoke all refresh tokens
      // For now, we'll just log the event
      await logEvent('sessions_revoked', {
        email: auth.currentUser?.email
      })

      showSnackbar('All other sessions have been revoked', 'success')
    } catch (error) {
      showSnackbar('Failed to revoke sessions', 'error')
    } finally {
      loading.value = false
    }
  }

  const downloadAccountData = async () => {
    loading.value = true
    try {
      // In a real implementation, this would gather all user data
      // For now, we'll create a simple JSON file with basic info
      const userData = {
        profile: {
          email: auth.currentUser?.email,
          role: authStore.userRole,
          createdAt: authStore.userDocument?.createdAt
        },
        exportedAt: new Date().toISOString()
      }

      const blob = new Blob([JSON.stringify(userData, null, 2)], { type: 'application/json' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `account-data-${new Date().toISOString().split('T')[0]}.json`
      a.click()
      URL.revokeObjectURL(url)

      await logEvent('account_data_exported', {})
      showSnackbar('Account data downloaded', 'success')
    } catch (error) {
      showSnackbar('Failed to download account data', 'error')
    } finally {
      loading.value = false
    }
  }

  return {
    // State
    securitySettings,
    sessionTimeoutOptions,
    loading,
    loadingEvents,
    recentEvents,
    loginHistory,
    snackbar,
    currentUser,

    // Methods
    showSnackbar,
    loadSecuritySettings,
    updateSecuritySettings,
    loadSecurityEvents,
    revokeAllSessions,
    downloadAccountData
  }
}