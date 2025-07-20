// client/src/composables/useActivityTracker.js - Complete Fixed Version
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
  let lastSuccessfulUpdate = 0

  // Update user's last active timestamp with improved error handling
  async function updateActivity() {
    if (!auth.user || hasPermissionError) return
    
    // Throttle updates - don't update more than once per minute
    const now = Date.now()
    if (now - lastSuccessfulUpdate < 60000) return
    
    try {
      // Only update the lastActive field to minimize permission issues
      await updateDoc(doc(db, 'users', auth.user.uid), {
        lastActive: serverTimestamp()
      })
      
      // Reset error state on success
      hasPermissionError = false
      retryCount = 0
      lastSuccessfulUpdate = now
      
      if (import.meta.env.DEV) {
        console.log('Activity updated successfully')
      }
      
    } catch (error) {
      retryCount++
      
      // Handle permission errors
      if (error.code === 'permission-denied' || 
          error.message.includes('Missing or insufficient permissions')) {
        console.warn('Activity tracking permission denied - stopping tracker')
        hasPermissionError = true
        stopTracking()
        return
      }
      
      // Handle temporary Firestore issues
      if (error.code === 'failed-precondition' || 
          error.code === 'unavailable' || 
          error.code === 'deadline-exceeded') {
        if (retryCount >= maxRetries) {
          console.warn('Activity tracking failed after max retries - temporary pause')
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
        console.warn('Network unavailable - activity tracking paused')
        return
      }
      
      // Log other errors but don't stop tracking
      console.error('Activity update error:', error.code, error.message)
      
      // Stop trying if we get too many consecutive errors
      if (retryCount >= maxRetries) {
        console.warn('Too many activity tracking errors - pausing for 10 minutes')
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
    if (!auth.user || hasPermissionError) return
    
    // Update immediately after a short delay to allow auth to settle
    setTimeout(() => {
      if (auth.user && !hasPermissionError) {
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
    
    // Update on user interaction (throttled to once per minute)
    const events = ['mousedown', 'keydown', 'scroll', 'touchstart', 'click']
    let lastInteractionUpdate = 0
    
    const handleActivity = () => {
      const now = Date.now()
      // Only update if it's been more than 1 minute since last update
      if (now - lastInteractionUpdate > 60 * 1000 && !hasPermissionError && auth.user) {
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
      console.log('Activity tracking started')
    }
  }

  // Stop tracking - COMPLETE FUNCTION (this was cut off before)
  function stopTracking() {
    if (activityInterval) {
      clearInterval(activityInterval)  // This was truncated to "clea" in the original
      activityInterval = null
    }
    
    if (window._activityCleanup) {
      window._activityCleanup()
      delete window._activityCleanup
    }
    
    if (import.meta.env.DEV) {
      console.log('Activity tracking stopped')
    }
  }

  // Reset error state (call this after fixing permissions)
  function resetErrorState() {
    hasPermissionError = false
    retryCount = 0
    lastSuccessfulUpdate = 0
    if (import.meta.env.DEV) {
      console.log('Activity tracker error state reset')
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
      if (auth.ready && auth.user && !hasPermissionError) {
        startTracking()
      } else if (auth.ready && !auth.user) {
        stopTracking()
      } else if (!auth.ready) {
        // Check again in 200ms if auth not ready
        setTimeout(checkAuthReady, 200)
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

  // Return all functions - THIS IS WHAT WAS MISSING!
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