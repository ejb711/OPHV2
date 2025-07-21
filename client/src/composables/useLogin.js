// composables/useLogin.js
import { ref, watch } from 'vue'
import { useAuthStore } from '@/stores/auth'
import { useErrorHandler } from '@/composables/useErrorHandler'

export function useLogin() {
  // Stores & Composables
  const authStore = useAuthStore()
  const { handleError } = useErrorHandler()
  
  // State
  const loading = ref(false)
  const error = ref(null)
  
  // Login function
  async function login(email, password) {
    console.log('[useLogin] Starting login process for:', email)
    
    loading.value = true
    error.value = null
    
    try {
      // Call the auth store login method
      const result = await authStore.login(email, password)
      console.log('[useLogin] Auth store login result:', result)
      
      // Check if login was successful
      if (!result.success) {
        console.warn('[useLogin] Login failed:', result)
        
        // Create a proper error object for the error handler
        const err = new Error(result.error)
        err.code = result.errorCode || 'unknown'
        
        // Use the error handler to get user-friendly message
        const errorObj = handleError(err, { 
          component: 'useLogin', 
          action: 'login' 
        })
        
        error.value = errorObj
        return {
          success: false,
          error: errorObj.message
        }
      }
      
      console.log('[useLogin] Login successful, waiting for auth ready...')
      
      // Wait until the auth store is fully ready (includes role data)
      await waitForAuthReady()
      
      console.log('[useLogin] Auth ready, role:', authStore.role)
      
      // Return success with role information
      return {
        success: true,
        role: authStore.role,
        user: authStore.user
      }
      
    } catch (err) {
      console.error('[useLogin] Login error:', err)
      
      // Handle unexpected errors
      const errorObj = handleError(err, { 
        component: 'useLogin', 
        action: 'login' 
      })
      
      error.value = errorObj
      return {
        success: false,
        error: errorObj.message
      }
      
    } finally {
      loading.value = false
      console.log('[useLogin] Login process completed')
    }
  }
  
  // Helper function to wait for auth ready state
  function waitForAuthReady() {
    return new Promise(resolve => {
      if (authStore.ready) {
        console.log('[useLogin] Auth already ready')
        resolve()
        return
      }
      
      console.log('[useLogin] Waiting for auth ready...')
      const unwatch = watch(
        () => authStore.ready,
        (ready) => {
          console.log('[useLogin] Auth ready changed:', ready)
          if (ready) {
            unwatch()
            resolve()
          }
        }
      )
    })
  }
  
  // Clear error
  function clearError() {
    error.value = null
  }
  
  return {
    // State
    loading,
    error,
    
    // Methods
    login,
    clearError
  }
}