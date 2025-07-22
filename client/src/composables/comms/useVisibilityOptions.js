// client/src/composables/comms/useVisibilityOptions.js
import { computed } from 'vue'

/**
 * Provides visibility options for communications projects
 * with proper display formatting
 */
export function useVisibilityOptions() {
  const visibilityOptions = [
    { 
      title: 'Private (Only me)', 
      value: 'private',
      subtitle: 'Only you can view this project',
      icon: 'mdi-lock'
    },
    { 
      title: 'Coordinator & Creator', 
      value: 'coordinator',
      subtitle: 'Project creator and assigned coordinator can view',
      icon: 'mdi-account-multiple'
    },
    { 
      title: 'Communications Team', 
      value: 'team',
      subtitle: 'All communications team members can view',
      icon: 'mdi-account-group'
    },
    { 
      title: 'Public (Anyone with link)', 
      value: 'public',
      subtitle: 'Anyone with the project link can view',
      icon: 'mdi-earth'
    }
  ]
  
  /**
   * Get the display title for a visibility value
   * @param {string} value - The visibility value (e.g., 'coordinator')
   * @returns {string} The display title (e.g., 'Coordinator & Creator')
   */
  const getVisibilityTitle = (value) => {
    const option = visibilityOptions.find(opt => opt.value === value)
    return option?.title || value
  }
  
  /**
   * Get the full option object for a visibility value
   * @param {string} value - The visibility value
   * @returns {Object|null} The full option object or null
   */
  const getVisibilityOption = (value) => {
    return visibilityOptions.find(opt => opt.value === value) || null
  }
  
  return {
    visibilityOptions,
    getVisibilityTitle,
    getVisibilityOption
  }
}