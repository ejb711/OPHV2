// client/src/composables/useLoadingState.js - Centralized loading state management
import { ref, computed } from 'vue'

// Global loading states for app-wide operations
const globalLoadingStates = ref(new Map())

export function useLoadingState() {
  // Local loading states
  const loadingStates = ref(new Map())
  
  /**
   * Check if any operation is loading
   */
  const isLoading = computed(() => {
    return loadingStates.value.size > 0
  })
  
  /**
   * Check if a specific operation is loading
   */
  function isOperationLoading(operationKey) {
    return loadingStates.value.has(operationKey)
  }
  
  /**
   * Start loading for an operation
   */
  function startLoading(operationKey, message = null) {
    loadingStates.value.set(operationKey, {
      startTime: Date.now(),
      message
    })
  }
  
  /**
   * Stop loading for an operation
   */
  function stopLoading(operationKey) {
    const state = loadingStates.value.get(operationKey)
    if (state) {
      const duration = Date.now() - state.startTime
      loadingStates.value.delete(operationKey)
      return duration
    }
    return 0
  }
  
  /**
   * Stop all loading operations
   */
  function stopAllLoading() {
    loadingStates.value.clear()
  }
  
  /**
   * Get loading message for an operation
   */
  function getLoadingMessage(operationKey) {
    return loadingStates.value.get(operationKey)?.message || 'Loading...'
  }
  
  /**
   * Get all active loading operations
   */
  const activeOperations = computed(() => {
    return Array.from(loadingStates.value.entries()).map(([key, state]) => ({
      key,
      message: state.message,
      duration: Date.now() - state.startTime
    }))
  })
  
  /**
   * Wrap an async operation with loading state
   */
  async function withLoading(operationKey, asyncFn, options = {}) {
    const {
      message = null,
      minDuration = 0,
      onError = null,
      global = false
    } = options
    
    const states = global ? globalLoadingStates : loadingStates
    
    try {
      const startTime = Date.now()
      states.value.set(operationKey, { startTime, message })
      
      const result = await asyncFn()
      
      // Ensure minimum duration for UX consistency
      const elapsed = Date.now() - startTime
      if (minDuration > elapsed) {
        await new Promise(resolve => setTimeout(resolve, minDuration - elapsed))
      }
      
      return result
    } catch (error) {
      if (onError) {
        onError(error)
      }
      throw error
    } finally {
      states.value.delete(operationKey)
    }
  }
  
  /**
   * Create a loading overlay configuration
   */
  function createLoadingOverlay(operationKey, options = {}) {
    const {
      fullscreen = false,
      opacity = 0.8,
      color = 'primary',
      size = 64
    } = options
    
    return computed(() => ({
      active: isOperationLoading(operationKey),
      fullscreen,
      opacity,
      color,
      size,
      text: getLoadingMessage(operationKey)
    }))
  }
  
  /**
   * Sequential operations with loading states
   */
  async function withSequentialLoading(operations) {
    const results = []
    
    for (const { key, message, fn } of operations) {
      try {
        startLoading(key, message)
        const result = await fn()
        results.push({ key, success: true, result })
      } catch (error) {
        results.push({ key, success: false, error })
        throw error
      } finally {
        stopLoading(key)
      }
    }
    
    return results
  }
  
  /**
   * Parallel operations with loading states
   */
  async function withParallelLoading(operations) {
    // Start all loading states
    operations.forEach(({ key, message }) => {
      startLoading(key, message)
    })
    
    try {
      // Execute all operations in parallel
      const promises = operations.map(async ({ key, fn }) => {
        try {
          const result = await fn()
          return { key, success: true, result }
        } catch (error) {
          return { key, success: false, error }
        } finally {
          stopLoading(key)
        }
      })
      
      return await Promise.all(promises)
    } catch (error) {
      // Stop any remaining loading states
      operations.forEach(({ key }) => stopLoading(key))
      throw error
    }
  }
  
  /**
   * Create a progress tracker for multi-step operations
   */
  function createProgressTracker(totalSteps) {
    const currentStep = ref(0)
    const stepMessages = ref([])
    
    const progress = computed(() => {
      if (totalSteps === 0) return 0
      return Math.round((currentStep.value / totalSteps) * 100)
    })
    
    function nextStep(message = null) {
      if (currentStep.value < totalSteps) {
        currentStep.value++
        if (message) {
          stepMessages.value.push({
            step: currentStep.value,
            message,
            timestamp: Date.now()
          })
        }
      }
    }
    
    function reset() {
      currentStep.value = 0
      stepMessages.value = []
    }
    
    return {
      currentStep: computed(() => currentStep.value),
      totalSteps,
      progress,
      stepMessages: computed(() => stepMessages.value),
      nextStep,
      reset,
      isComplete: computed(() => currentStep.value >= totalSteps)
    }
  }
  
  return {
    // State
    isLoading,
    activeOperations,
    
    // Methods
    startLoading,
    stopLoading,
    stopAllLoading,
    isOperationLoading,
    getLoadingMessage,
    withLoading,
    withSequentialLoading,
    withParallelLoading,
    
    // Utilities
    createLoadingOverlay,
    createProgressTracker
  }
}

/**
 * Global loading state for app-wide operations
 */
export function useGlobalLoading() {
  const isGlobalLoading = computed(() => {
    return globalLoadingStates.value.size > 0
  })
  
  const globalOperations = computed(() => {
    return Array.from(globalLoadingStates.value.entries()).map(([key, state]) => ({
      key,
      message: state.message,
      duration: Date.now() - state.startTime
    }))
  })
  
  return {
    isGlobalLoading,
    globalOperations,
    startGlobalLoading: (key, message) => {
      globalLoadingStates.value.set(key, {
        startTime: Date.now(),
        message
      })
    },
    stopGlobalLoading: (key) => {
      globalLoadingStates.value.delete(key)
    }
  }
}