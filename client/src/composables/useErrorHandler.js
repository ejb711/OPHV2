// client/src/composables/useErrorHandler.js - Updated with new Firebase error codes
import { ref } from 'vue'
import { useAudit } from './useAudit'

// Global error state for critical errors
const globalError = ref(null)

// Error type mapping for future extensibility
const ERROR_TYPES = {
  AUTH: 'authentication',
  PERMISSION: 'permission',
  NETWORK: 'network',
  VALIDATION: 'validation',
  NOT_FOUND: 'not_found',
  SERVER: 'server',
  UNKNOWN: 'unknown'
}

// User-friendly error messages
const ERROR_MESSAGES = {
  // Authentication errors - Updated for Firebase v9+ error codes
  'auth/invalid-credential': 'Invalid email or password',
  'auth/user-not-found': 'No account found with this email address',
  'auth/wrong-password': 'Incorrect password',
  'auth/invalid-email': 'Please enter a valid email address',
  'auth/user-disabled': 'This account has been disabled',
  'auth/email-already-in-use': 'An account with this email already exists',
  'auth/weak-password': 'Password should be at least 6 characters',
  'auth/too-many-requests': 'Too many failed attempts. Please try again later',
  'auth/network-request-failed': 'Network error. Please check your connection',
  'auth/operation-not-allowed': 'This sign-in method is not enabled',
  'auth/invalid-password': 'Invalid password',
  'auth/requires-recent-login': 'Please log out and log back in to continue',

  // Firestore errors
  'permission-denied': 'You don\'t have permission to perform this action',
  'not-found': 'The requested resource was not found',
  'already-exists': 'This item already exists',
  'failed-precondition': 'Operation failed due to system state',
  'resource-exhausted': 'Quota exceeded. Please try again later',
  'cancelled': 'Operation was cancelled',
  'data-loss': 'Data loss detected. Please contact support',
  'unauthenticated': 'Please log in to continue',

  // Custom app errors
  'invalid-role': 'Invalid role assignment',
  'invalid-permission': 'Invalid permission configuration',
  'user-pending': 'Your account is pending approval',
  'operation-not-allowed': 'This operation is not allowed',
  'quota-exceeded': 'You have exceeded your quota',

  // Network errors
  'network-error': 'Network connection error. Please check your internet connection',
  'timeout': 'Request timed out. Please try again',
  'server-error': 'Server error. Please try again later',

  // Default
  'unknown': 'An unexpected error occurred. Please try again'
}

export function useErrorHandler() {
  const { log } = useAudit()
  const error = ref(null)
  const loading = ref(false)

  /**
   * Main error handler with extensible error type detection
   */
  function handleError(err, context = {}) {
    // Detect error type
    const errorType = detectErrorType(err)
    const errorCode = getErrorCode(err)
    const userMessage = getUserMessage(errorCode, err)

    // Log critical errors
    if (shouldLogError(errorType, err)) {
      log.custom('error_occurred', {
        type: errorType,
        code: errorCode,
        message: err.message,
        context,
        stack: err.stack
      })
    }

    // Create error object
    const errorObj = {
      type: errorType,
      code: errorCode,
      message: userMessage,
      technical: err.message,
      timestamp: new Date(),
      context
    }

    // Set local error state
    error.value = errorObj

    // Set global error for critical errors
    if (isCriticalError(errorType, err)) {
      globalError.value = errorObj
    }

    return errorObj
  }

  /**
   * Detect error type for future categorization
   */
  function detectErrorType(err) {
    if (err.code?.startsWith('auth/')) return ERROR_TYPES.AUTH
    if (err.code === 'permission-denied') return ERROR_TYPES.PERMISSION
    if (err.code === 'not-found') return ERROR_TYPES.NOT_FOUND
    if (err.name === 'NetworkError' || err.message?.includes('network')) return ERROR_TYPES.NETWORK
    if (err.name === 'ValidationError') return ERROR_TYPES.VALIDATION
    if (err.status >= 500) return ERROR_TYPES.SERVER
    return ERROR_TYPES.UNKNOWN
  }

  /**
   * Get standardized error code
   */
  function getErrorCode(err) {
    return err.code || err.name || 'unknown'
  }

  /**
   * Get user-friendly message
   */
  function getUserMessage(code, err) {
    // Check predefined messages
    if (ERROR_MESSAGES[code]) {
      return ERROR_MESSAGES[code]
    }

    // Generate message based on error type
    const errorType = detectErrorType(err)
    switch (errorType) {
      case ERROR_TYPES.PERMISSION:
        return 'You don\'t have permission to perform this action'
      case ERROR_TYPES.NETWORK:
        return 'Network error. Please check your connection and try again'
      case ERROR_TYPES.NOT_FOUND:
        return 'The requested item was not found'
      case ERROR_TYPES.SERVER:
        return 'Server error. Our team has been notified'
      default:
        return ERROR_MESSAGES.unknown
    }
  }

  /**
   * Determine if error should be logged
   */
  function shouldLogError(errorType, err) {
    // Always log critical errors
    if (isCriticalError(errorType, err)) return true

    // Log permission and auth errors for security monitoring
    if ([ERROR_TYPES.AUTH, ERROR_TYPES.PERMISSION].includes(errorType)) return true

    // Don't log expected errors
    if (err.expected || err.silent) return false

    return true
  }

  /**
   * Check if error is critical
   */
  function isCriticalError(errorType, err) {
    return [ERROR_TYPES.SERVER, ERROR_TYPES.UNKNOWN].includes(errorType) ||
           err.critical === true
  }

  /**
   * Clear error state
   */
  function clearError() {
    error.value = null
  }

  /**
   * Clear global error
   */
  function clearGlobalError() {
    globalError.value = null
  }

  /**
   * Async operation wrapper with error handling
   */
  async function withErrorHandling(operation, context = {}) {
    loading.value = true
    error.value = null

    try {
      const result = await operation()
      return { success: true, data: result }
    } catch (err) {
      const errorObj = handleError(err, context)
      return { success: false, error: errorObj }
    } finally {
      loading.value = false
    }
  }

  /**
   * Create snackbar-compatible error
   */
  function createSnackbarError(err, defaultMessage = 'An error occurred') {
    const errorCode = getErrorCode(err)
    const message = getUserMessage(errorCode, err) || defaultMessage

    return {
      show: true,
      message,
      color: 'error',
      timeout: 6000
    }
  }

  /**
   * Retry helper for transient errors
   */
  async function retryOperation(operation, options = {}) {
    const {
      maxAttempts = 3,
      delay = 1000,
      backoff = 2,
      shouldRetry = (err) => detectErrorType(err) === ERROR_TYPES.NETWORK
    } = options

    let lastError

    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      try {
        return await operation()
      } catch (err) {
        lastError = err

        if (attempt === maxAttempts || !shouldRetry(err)) {
          throw err
        }

        const waitTime = delay * Math.pow(backoff, attempt - 1)
        await new Promise(resolve => setTimeout(resolve, waitTime))
      }
    }

    throw lastError
  }

  return {
    // State
    error,
    loading,
    globalError,

    // Methods
    handleError,
    clearError,
    clearGlobalError,
    withErrorHandling,
    createSnackbarError,
    retryOperation,

    // Constants
    ERROR_TYPES,
    ERROR_MESSAGES
  }
}