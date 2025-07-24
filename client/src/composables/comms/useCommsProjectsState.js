// client/src/composables/comms/useCommsProjectsState.js
import { ref } from 'vue'

/**
 * State management for communications projects
 * Provides reactive state and state setters
 */
export function useCommsProjectsState() {
  // Projects data
  const projects = ref([])
  
  // Loading states
  const loading = ref(false)
  const creating = ref(false)
  const updating = ref(false)
  const deleting = ref(false)
  
  // Error state
  const error = ref(null)
  
  // Filter states
  const filterRegion = ref(null)
  const filterStatus = ref(null)
  const filterPriority = ref(null)
  const filterCoordinator = ref(null)
  const filterSearch = ref('')
  const filterDeleted = ref(false)
  
  // State setters
  function setProjects(newProjects) {
    projects.value = newProjects
  }
  
  function setLoading(value) {
    loading.value = value
  }
  
  function setCreating(value) {
    creating.value = value
  }
  
  function setUpdating(value) {
    updating.value = value
  }
  
  function setDeleting(value) {
    deleting.value = value
  }
  
  function setError(errorMessage) {
    error.value = errorMessage
  }
  
  function clearError() {
    error.value = null
  }
  
  // Filter setters
  function setFilter(filterName, value) {
    switch (filterName) {
      case 'region':
        filterRegion.value = value
        break
      case 'status':
        filterStatus.value = value
        break
      case 'priority':
        filterPriority.value = value
        break
      case 'coordinator':
        filterCoordinator.value = value
        break
      case 'search':
        filterSearch.value = value
        break
      case 'deleted':
        filterDeleted.value = value
        break
    }
  }
  
  function clearFilters() {
    filterRegion.value = null
    filterStatus.value = null
    filterPriority.value = null
    filterCoordinator.value = null
    filterSearch.value = ''
    filterDeleted.value = false
  }
  
  return {
    // State
    projects,
    loading,
    creating,
    updating,
    deleting,
    error,
    
    // Filters
    filterRegion,
    filterStatus,
    filterPriority,
    filterCoordinator,
    filterSearch,
    filterDeleted,
    
    // State setters
    setProjects,
    setLoading,
    setCreating,
    setUpdating,
    setDeleting,
    setError,
    clearError,
    
    // Filter methods
    setFilter,
    clearFilters
  }
}