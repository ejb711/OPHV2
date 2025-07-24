// client/src/composables/comms/useProjectFilters.js
import { ref, computed, watch } from 'vue'
import { useLocalStorage } from '@vueuse/core'

const SAVED_FILTERS_KEY = 'comms_saved_filters'
const RECENT_FILTERS_KEY = 'comms_recent_filters'
const MAX_RECENT_FILTERS = 5

export function useProjectFilters() {
  // Current active filters
  const activeFilters = ref({
    region: null,
    status: null,
    priority: null,
    coordinator: null,
    tags: [],
    visibility: null,
    sharedWith: null,
    deleted: false
  })
  
  // Filter logic mode
  const filterMode = ref('and') // 'and' or 'or'
  
  // Saved filter sets
  const savedFilters = useLocalStorage(SAVED_FILTERS_KEY, [])
  const recentFilters = useLocalStorage(RECENT_FILTERS_KEY, [])
  
  // Predefined filter sets
  const presetFilters = ref([
    {
      id: 'active-high-priority',
      name: 'Active High Priority',
      icon: 'mdi-fire',
      description: 'In-progress projects with high or urgent priority',
      filters: {
        status: 'in_progress',
        priority: ['high', 'urgent']
      }
    },
    {
      id: 'pending-approval',
      name: 'Pending Approval',
      icon: 'mdi-clock-alert',
      description: 'Projects awaiting approval',
      filters: {
        status: 'pending_approval'
      }
    },
    {
      id: 'my-region',
      name: 'My Region Only',
      icon: 'mdi-map-marker',
      description: 'Projects in your assigned regions',
      filters: {
        region: 'USER_REGIONS' // Special placeholder
      }
    },
    {
      id: 'shared-with-me',
      name: 'Shared With Me',
      icon: 'mdi-share-variant',
      description: 'Projects explicitly shared with you',
      filters: {
        sharedWith: 'CURRENT_USER' // Special placeholder
      }
    }
  ])
  
  // Quick filters (simpler than presets)
  const quickFilters = ref([
    { id: 'not-started', label: 'Not Started', field: 'status', value: 'not_started' },
    { id: 'in-progress', label: 'In Progress', field: 'status', value: 'in_progress' },
    { id: 'completed', label: 'Completed', field: 'status', value: 'completed' },
    { id: 'high-priority', label: 'High Priority', field: 'priority', value: 'high' },
    { id: 'urgent', label: 'Urgent', field: 'priority', value: 'urgent' }
  ])
  
  // Methods
  function applyFilters(projects, userContext = {}) {
    return projects.filter(project => {
      const checks = []
      
      // Region filter
      if (activeFilters.value.region) {
        const regionFilter = activeFilters.value.region === 'USER_REGIONS' 
          ? userContext.userRegions?.includes(project.region)
          : project.region === activeFilters.value.region
        checks.push(regionFilter)
      }
      
      // Status filter
      if (activeFilters.value.status) {
        if (Array.isArray(activeFilters.value.status)) {
          checks.push(activeFilters.value.status.includes(project.status))
        } else {
          checks.push(project.status === activeFilters.value.status)
        }
      }
      
      // Priority filter
      if (activeFilters.value.priority) {
        if (Array.isArray(activeFilters.value.priority)) {
          checks.push(activeFilters.value.priority.includes(project.priority))
        } else {
          checks.push(project.priority === activeFilters.value.priority)
        }
      }
      
      // Coordinator filter
      if (activeFilters.value.coordinator) {
        checks.push(project.coordinatorId === activeFilters.value.coordinator)
      }
      
      // Tags filter
      if (activeFilters.value.tags?.length > 0) {
        const hasTags = activeFilters.value.tags.some(tag => 
          project.tags?.includes(tag)
        )
        checks.push(hasTags)
      }
      
      // Visibility filter
      if (activeFilters.value.visibility) {
        checks.push(project.visibility === activeFilters.value.visibility)
      }
      
      // Shared with filter
      if (activeFilters.value.sharedWith) {
        const sharedWithUser = activeFilters.value.sharedWith === 'CURRENT_USER'
          ? project.sharedWith?.includes(userContext.userId)
          : project.sharedWith?.includes(activeFilters.value.sharedWith)
        checks.push(sharedWithUser)
      }
      
      // Deleted filter
      if (activeFilters.value.deleted !== null) {
        checks.push(project.deleted === activeFilters.value.deleted)
      }
      
      // Apply filter logic
      if (checks.length === 0) return true
      
      return filterMode.value === 'or' 
        ? checks.some(check => check)
        : checks.every(check => check)
    })
  }
  
  function setFilter(field, value) {
    activeFilters.value[field] = value
    saveToRecent()
  }
  
  function clearFilter(field) {
    activeFilters.value[field] = Array.isArray(activeFilters.value[field]) ? [] : null
  }
  
  function clearAllFilters() {
    activeFilters.value = {
      region: null,
      status: null,
      priority: null,
      coordinator: null,
      tags: [],
      visibility: null,
      sharedWith: null,
      deleted: false
    }
  }
  
  function applyPreset(presetId, userContext = {}) {
    const preset = presetFilters.value.find(p => p.id === presetId)
    if (!preset) return
    
    clearAllFilters()
    
    // Apply preset filters with placeholder resolution
    Object.entries(preset.filters).forEach(([field, value]) => {
      if (value === 'USER_REGIONS') {
        activeFilters.value[field] = userContext.userRegions?.[0] || null
      } else if (value === 'CURRENT_USER') {
        activeFilters.value[field] = userContext.userId
      } else {
        activeFilters.value[field] = value
      }
    })
    
    saveToRecent()
  }
  
  function applyQuickFilter(filterId) {
    const quick = quickFilters.value.find(q => q.id === filterId)
    if (!quick) return
    
    setFilter(quick.field, quick.value)
  }
  
  function saveFilterSet(name, description = '') {
    const filterSet = {
      id: Date.now().toString(),
      name,
      description,
      filters: { ...activeFilters.value },
      filterMode: filterMode.value,
      createdAt: new Date().toISOString()
    }
    
    savedFilters.value = [filterSet, ...savedFilters.value]
    return filterSet
  }
  
  function loadFilterSet(filterSetId) {
    const filterSet = savedFilters.value.find(f => f.id === filterSetId)
    if (!filterSet) return
    
    activeFilters.value = { ...filterSet.filters }
    filterMode.value = filterSet.filterMode || 'and'
    saveToRecent()
  }
  
  function deleteFilterSet(filterSetId) {
    savedFilters.value = savedFilters.value.filter(f => f.id !== filterSetId)
  }
  
  function saveToRecent() {
    const currentState = {
      filters: { ...activeFilters.value },
      filterMode: filterMode.value,
      timestamp: new Date().toISOString()
    }
    
    // Avoid duplicates in recent
    const isDuplicate = recentFilters.value.some(recent => 
      JSON.stringify(recent.filters) === JSON.stringify(currentState.filters)
    )
    
    if (!isDuplicate) {
      recentFilters.value = [
        currentState,
        ...recentFilters.value
      ].slice(0, MAX_RECENT_FILTERS)
    }
  }
  
  // Computed
  const hasActiveFilters = computed(() => {
    return Object.entries(activeFilters.value).some(([key, value]) => {
      if (key === 'deleted') return value !== false
      if (Array.isArray(value)) return value.length > 0
      return value !== null && value !== ''
    })
  })
  
  const activeFilterCount = computed(() => {
    return Object.entries(activeFilters.value).reduce((count, [key, value]) => {
      if (key === 'deleted' && value !== false) return count + 1
      if (Array.isArray(value) && value.length > 0) return count + 1
      if (value !== null && value !== '') return count + 1
      return count
    }, 0)
  })
  
  const filterSummary = computed(() => {
    const summary = []
    
    if (activeFilters.value.region) summary.push('Region')
    if (activeFilters.value.status) summary.push('Status')
    if (activeFilters.value.priority) summary.push('Priority')
    if (activeFilters.value.coordinator) summary.push('Coordinator')
    if (activeFilters.value.tags?.length) summary.push(`${activeFilters.value.tags.length} Tags`)
    if (activeFilters.value.visibility) summary.push('Visibility')
    if (activeFilters.value.sharedWith) summary.push('Shared')
    if (activeFilters.value.deleted) summary.push('Deleted')
    
    return summary.join(', ')
  })
  
  return {
    // State
    activeFilters,
    filterMode,
    savedFilters,
    recentFilters,
    presetFilters,
    quickFilters,
    
    // Computed
    hasActiveFilters,
    activeFilterCount,
    filterSummary,
    
    // Methods
    applyFilters,
    setFilter,
    clearFilter,
    clearAllFilters,
    applyPreset,
    applyQuickFilter,
    saveFilterSet,
    loadFilterSet,
    deleteFilterSet
  }
}