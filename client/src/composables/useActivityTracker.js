// File: client/src/composables/useActivityTracker.js - Fixed Version
import { onMounted, onUnmounted } from 'vue'
import { useAuthStore } from '../stores/auth'
import { doc, updateDoc, serverTimestamp } from 'firebase/firestore'
import { db } from '../firebase'

export function useActivityTracker() {
  const auth = useAuthStore()
  let activityInterval = null
  let hasPermissionError = false
  let retryCount = 0
  const maxRetries = 3

  // Update user's last active timestamp with error handling
  async function updateActivity() {
    if (!auth.user || hasPermissionError) return
    
    try {
      await updateDoc(doc(db, 'users', auth.user.uid), {
        lastActive: serverTimestamp()
      })
      
      // Reset error state on success
      hasPermissionError = false
      retryCount = 0
      
    } catch (error) {
      retryCount++
      
      if (error.code === 'permission-denied' || error.message.includes('Missing or insufficient permissions')) {
        hasPermissionError = true
        stopTracking() // Stop trying if we don't have permission
        return
      }
      
      if (error.code === 'failed-precondition' || error.code === 'unavailable') {
        if (retryCount >= maxRetries) {
          hasPermissionError = true
          stopTracking()
        }
        return
      }
      
      // Log other errors but don't stop tracking
      console.error('Activity update error:', error)
    }
  }

  // Start tracking activity with better error handling
  function startTracking() {
    if (!auth.user || hasPermissionError) return
    
    // Update immediately (with delay to allow auth to settle)
    setTimeout(updateActivity, 2000)
    
    // Update every 5 minutes
    activityInterval = setInterval(updateActivity, 5 * 60 * 1000)
    
    // Update on user interaction (throttled)
    const events = ['mousedown', 'keydown', 'scroll', 'touchstart']
    let lastUpdate = Date.now()
    
    const handleActivity = () => {
      const now = Date.now()
      // Only update if it's been more than 5 minutes since last update
      if (now - lastUpdate > 5 * 60 * 1000 && !hasPermissionError) {
        updateActivity()
        lastUpdate = now
      }
    }
    
    // Add event listeners with passive option
    events.forEach(event => {
      document.addEventListener(event, handleActivity, { passive: true })
    })
    
    // Store cleanup function
    window._activityCleanup = () => {
      events.forEach(event => {
        document.removeEventListener(event, handleActivity)
      })
    }
  }

  // Stop tracking
  function stopTracking() {
    if (activityInterval) {
      clearInterval(activityInterval)
      activityInterval = null
    }
    
    if (window._activityCleanup) {
      window._activityCleanup()
      delete window._activityCleanup
    }
  }

  // Reset error state (call this after fixing permissions)
  function resetErrorState() {
    hasPermissionError = false
    retryCount = 0
  }

  // Auto-start/stop based on auth state
  onMounted(() => {
    // Wait for auth to be ready before starting
    const checkAuthReady = () => {
      if (auth.ready && auth.user && !hasPermissionError) {
        startTracking()
      } else if (auth.ready && !auth.user) {
        stopTracking()
      } else {
        // Check again in 100ms if auth not ready
        setTimeout(checkAuthReady, 100)
      }
    }
    
    checkAuthReady()
    
    // Watch for auth changes
    const unwatchAuth = auth.$subscribe((mutation, state) => {
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

  return {
    updateActivity,
    startTracking,
    stopTracking,
    resetErrorState,
    hasPermissionError: () => hasPermissionError
  }
}