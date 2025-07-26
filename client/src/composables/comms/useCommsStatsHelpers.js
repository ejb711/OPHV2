// client/src/composables/comms/useCommsStatsHelpers.js
/**
 * Helper functions for CommsStats components
 * Purpose: Provides color coding and formatting utilities for project statistics
 * Used by: CommsStatsMetrics, CommsStatsDistributions
 */
export function useCommsStatsHelpers() {
  /**
   * Get color for status badges
   * @param {string} status - Project status
   * @returns {string} Vuetify color name
   */
  const getStatusColor = (status) => {
    const colors = {
      not_started: 'grey',
      planning: 'blue',
      in_progress: 'amber',
      review: 'orange',
      completed: 'success'
    }
    return colors[status] || 'grey'
  }

  /**
   * Get color for priority badges
   * @param {string} priority - Project priority
   * @returns {string} Vuetify color name
   */
  const getPriorityColor = (priority) => {
    const colors = {
      high: 'red',
      medium: 'amber',
      low: 'green'
    }
    return colors[priority] || 'grey'
  }

  /**
   * Get color for completion time indicator
   * @param {number} days - Average completion time in days
   * @returns {string} Vuetify color name
   */
  const getCompletionTimeColor = (days) => {
    if (!days) return 'grey'
    if (days <= 7) return 'success'
    if (days <= 14) return 'warning'
    return 'error'
  }

  /**
   * Format status string for display
   * Handles undefined/null values gracefully
   * @param {string|undefined|null} status - Status to format
   * @returns {string} Formatted status string
   */
  const formatStatus = (status) => {
    // Handle edge cases where status might not be a string
    if (!status || typeof status !== 'string') {
      return 'Unknown'
    }

    return status
      .split('_')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ')
  }

  return {
    getStatusColor,
    getPriorityColor,
    getCompletionTimeColor,
    formatStatus
  }
}