// client/src/composables/useSnackbar.js
// Simple snackbar composable for notifications

import { ref } from 'vue'

// Global snackbar state (shared across all components)
const snackbar = ref({
  show: false,
  message: '',
  color: 'success',
  timeout: 4000,
  location: 'bottom'
})

export function useSnackbar() {
  /**
   * Show a success message
   * @param {string} message - The message to display
   * @param {Object} options - Additional options
   */
  function showSuccess(message, options = {}) {
    snackbar.value = {
      show: true,
      message,
      color: 'success',
      timeout: options.timeout || 4000,
      location: options.location || 'bottom'
    }
  }

  /**
   * Show an error message
   * @param {string} message - The message to display
   * @param {Object} options - Additional options
   */
  function showError(message, options = {}) {
    snackbar.value = {
      show: true,
      message,
      color: 'error',
      timeout: options.timeout || 6000,
      location: options.location || 'bottom'
    }
  }

  /**
   * Show an info message
   * @param {string} message - The message to display
   * @param {Object} options - Additional options
   */
  function showInfo(message, options = {}) {
    snackbar.value = {
      show: true,
      message,
      color: 'info',
      timeout: options.timeout || 4000,
      location: options.location || 'bottom'
    }
  }

  /**
   * Show a warning message
   * @param {string} message - The message to display
   * @param {Object} options - Additional options
   */
  function showWarning(message, options = {}) {
    snackbar.value = {
      show: true,
      message,
      color: 'warning',
      timeout: options.timeout || 5000,
      location: options.location || 'bottom'
    }
  }

  /**
   * Show a custom snackbar
   * @param {Object} config - Full snackbar configuration
   */
  function showSnackbar(config) {
    snackbar.value = {
      show: true,
      message: config.message || '',
      color: config.color || 'success',
      timeout: config.timeout || 4000,
      location: config.location || 'bottom',
      ...config
    }
  }

  /**
   * Hide the snackbar
   */
  function hideSnackbar() {
    snackbar.value.show = false
  }

  return {
    // State
    snackbar,
    
    // Methods
    showSuccess,
    showError,
    showInfo,
    showWarning,
    showSnackbar,
    hideSnackbar
  }
}