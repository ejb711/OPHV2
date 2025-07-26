// client/src/composables/useActivityTracker.js
import { onMounted, onUnmounted } from 'vue'
import { updateDoc, doc, serverTimestamp } from 'firebase/firestore'
import { auth, db } from '../firebase'
import { useAuthStore } from '../stores/auth'
import { signOut } from 'firebase/auth'

export function useActivityTracker() {
  const authStore = useAuthStore()

  let activityInterval = null
  let hasPermissionError = false
  let retryCount = 0
  const maxRetries = 3
  let lastSuccessfulUpdate = 0

  // Session timeout tracking
  let lastActivityTime = Date.now()
  let inactivityCheckInterval = null
  let sessionTimeoutMinutes = 60 // Default

  // Check for inactivity and log out if needed
  async function checkInactivity() {
    if (!authStore.user || hasPermissionError) return

    // Get the user's session timeout setting
    const userDoc = authStore.userDocument
    if (userDoc?.securitySettings?.sessionTimeout) {
      sessionTimeoutMinutes = Number(userDoc.securitySettings.sessionTimeout)
    }

    const now = Date.now()
    const inactiveMinutes = (now - lastActivityTime) / (1000 * 60)

    if (inactiveMinutes >= sessionTimeoutMinutes) {
      try {
        // Log the timeout event before signing out
        const auditModule = await import('./useAudit')
        const { logEvent } = auditModule.useAudit()
        await logEvent('session_timeout', {
          inactiveMinutes: Math.floor(inactiveMinutes),
          sessionTimeoutSetting: sessionTimeoutMinutes
        })

        // Sign out the user
        await signOut(auth)

        // Clear auth store
        authStore.signOut()

        // Show notification if possible
        if (window.alert) {
          alert('Your session has expired due to inactivity. Please log in again.')
        }
      } catch (error) {
        }
    }
  }

  // Update user's last active timestamp with better error handling
  async function updateActivity() {
    if (!authStore.user || hasPermissionError) return

    const now = Date.now()

    // Don't update more than once per minute
    if (now - lastSuccessfulUpdate < 60 * 1000) {
      return
    }

    try {
      await updateDoc(doc(db, 'users', authStore.user.uid), {
        lastActive: serverTimestamp()
      })

      lastSuccessfulUpdate = now
      lastActivityTime = now // Reset inactivity timer
      retryCount = 0 // Reset retry count on success

    } catch (error) {
      retryCount++

      // Handle permission errors
      if (error.code === 'permission-denied') {
        hasPermissionError = true
        stopTracking()
        return
      }

      // Handle temporary Firestore issues
      if (error.code === 'failed-precondition' ||
          error.code === 'unavailable' ||
          error.code === 'deadline-exceeded') {
        if (retryCount >= maxRetries) {
          hasPermissionError = true
          // Auto-retry after 5 minutes
          setTimeout(() => {
            hasPermissionError = false
            retryCount = 0
          }, 5 * 60 * 1000)
        }
        return
      }

      // Handle network errors
      if (error.code === 'unavailable' || !navigator.onLine) {
        return
      }

      // Log other errors but don't stop tracking
      // Stop trying if we get too many consecutive errors
      if (retryCount >= maxRetries) {
        hasPermissionError = true
        setTimeout(() => {
          hasPermissionError = false
          retryCount = 0
        }, 10 * 60 * 1000)
      }
    }
  }

  // Start tracking activity with better error handling
  function startTracking() {
    if (!authStore.user || hasPermissionError) return

    // Update immediately after a short delay to allow auth to settle
    setTimeout(() => {
      if (authStore.user && !hasPermissionError) {
        updateActivity()
      }
    }, 3000)

    // Update every 5 minutes
    if (!activityInterval) {
      activityInterval = setInterval(() => {
        if (!hasPermissionError) {
          updateActivity()
        }
      }, 5 * 60 * 1000)
    }

    // Check for inactivity every minute
    if (!inactivityCheckInterval) {
      inactivityCheckInterval = setInterval(() => {
        checkInactivity()
      }, 60 * 1000) // Check every minute
    }

    // Update on user interaction (throttled to once per minute)
    const events = ['mousedown', 'keydown', 'scroll', 'touchstart', 'click']
    let lastInteractionUpdate = 0

    const handleActivity = () => {
      const now = Date.now()
      lastActivityTime = now // Reset inactivity timer

      // Only update database if it's been more than 1 minute since last update
      if (now - lastInteractionUpdate > 60 * 1000 && !hasPermissionError && authStore.user) {
        updateActivity()
        lastInteractionUpdate = now
      }
    }

    // Add event listeners with passive option for better performance
    events.forEach(event => {
      document.addEventListener(event, handleActivity, {
        passive: true,
        capture: false
      })
    })

    // Store cleanup function
    window._activityCleanup = () => {
      events.forEach(event => {
        document.removeEventListener(event, handleActivity, {
          passive: true,
          capture: false
        })
      })
    }

    if (import.meta.env.DEV) {
      }
  }

  // Stop tracking
  function stopTracking() {
    if (activityInterval) {
      clearInterval(activityInterval)
      activityInterval = null
    }

    if (inactivityCheckInterval) {
      clearInterval(inactivityCheckInterval)
      inactivityCheckInterval = null
    }

    if (window._activityCleanup) {
      window._activityCleanup()
      delete window._activityCleanup
    }

    if (import.meta.env.DEV) {
      }
  }

  // Reset error state (call this after fixing permissions)
  function resetErrorState() {
    hasPermissionError = false
    retryCount = 0
    lastSuccessfulUpdate = 0
    if (import.meta.env.DEV) {
      }
  }

  // Manual update function for testing
  function forceUpdate() {
    if (!hasPermissionError) {
      updateActivity()
    }
  }

  // Auto-start/stop based on auth state
  onMounted(() => {
    // Wait for auth to be ready before starting
    const checkAuthReady = () => {
      if (authStore.ready && authStore.user && !hasPermissionError) {
        startTracking()
      } else if (authStore.ready && !authStore.user) {
        stopTracking()
      } else if (!authStore.ready) {
        // Check again in 200ms if auth not ready
        setTimeout(checkAuthReady, 200)
      }
    }

    checkAuthReady()

    // Watch for auth changes
    const unwatchAuth = authStore.$subscribe((mutation, state) => {
      if (state.user && state.ready && !hasPermissionError && !activityInterval) {
        startTracking()
      } else if (!state.user && activityInterval) {
        stopTracking()
      }
    })

    // Cleanup on unmount
    onUnmounted(() => {
      stopTracking()
      unwatchAuth()
    })
  })

  // Return all functions
  return {
    updateActivity,
    startTracking,
    stopTracking,
    resetErrorState,
    forceUpdate,
    hasPermissionError: () => hasPermissionError,
    isTracking: () => !!activityInterval
  }
}