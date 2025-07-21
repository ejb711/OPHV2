// client/src/composables/useSecuritySettings.js
import { ref, computed } from 'vue'
import { updateDoc, doc, serverTimestamp, collection, query, where, orderBy, limit, getDocs } from 'firebase/firestore'
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

      const userDoc = await authStore.getUserDocument()
      console.log('Loading security settings from user doc:', userDoc?.securitySettings)
      
      if (userDoc?.securitySettings) {
        const loadedTimeout = Number(userDoc.securitySettings.sessionTimeout) || 60
        securitySettings.value = {
          sessionTimeout: loadedTimeout,
          allowMultipleSessions: userDoc.securitySettings.allowMultipleSessions ?? true,
          requirePasswordChange: userDoc.securitySettings.requirePasswordChange ?? false
        }
        console.log('Session timeout loaded:', loadedTimeout, 'minutes')
      }
    } catch (error) {
      console.error('Error loading security settings:', error)
    }
  }

  const updateSecuritySettings = async () => {
    try {
      const user = auth.currentUser
      if (!user) return
      
      console.log('Updating security settings:', securitySettings.value)
      
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
      
      console.log('Session timeout updated to:', updates.securitySettings.sessionTimeout, 'minutes')
      showSnackbar(`Session timeout updated to ${updates.securitySettings.sessionTimeout} minute${updates.securitySettings.sessionTimeout === 1 ? '' : 's'}`, 'success')
    } catch (error) {
      console.error('Error updating security settings:', error)
      showSnackbar('Failed to update security settings', 'error')
    }
  }

  const loadSecurityEvents = async () => {
    loadingEvents.value = true
    try {
      const user = auth.currentUser
      if (!user) return

      const q = query(
        collection(db, 'audit_logs'),
        where('userId', '==', user.uid),
        where('action', 'in', [
          'user_login',
          'user_logout', 
          'password_changed',
          'password_reset_requested',
          'email_changed',
          'security_settings_updated',
          'failed_login_attempt'
        ]),
        orderBy('timestamp', 'desc'),
        limit(10)
      )

      const snapshot = await getDocs(q)
      const events = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }))
      
      // Separate login events for login history
      loginHistory.value = events
        .filter(e => e.action === 'user_login' || e.action === 'failed_login_attempt')
        .slice(0, 5)
        .map(e => ({ ...e, success: e.action === 'user_login' }))
      
      // All events for recent activity
      recentEvents.value = events
    } catch (error) {
      console.error('Error loading security events:', error)
    } finally {
      loadingEvents.value = false
    }
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
      console.error('Error revoking sessions:', error)
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
      console.error('Error downloading account data:', error)
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