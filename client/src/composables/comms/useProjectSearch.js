// client/src/composables/comms/useProjectSearch.js
import { ref, computed, watch } from 'vue'
import { useLocalStorage } from '@vueuse/core'
import { useDebounce } from '@/composables/useDebounce'

const SEARCH_HISTORY_KEY = 'comms_search_history'
const MAX_HISTORY_ITEMS = 10

export function useProjectSearch() {
  // Search state
  const searchQuery = ref('')
  const searchFields = ref(['title', 'description', 'tags'])
  const searchMode = ref('all') // 'all' or 'any'
  const isAdvancedSearch = ref(false)
  
  // Search history with localStorage persistence
  const searchHistory = useLocalStorage(SEARCH_HISTORY_KEY, [])
  
  // Debounced search query for performance
  const debouncedQuery = useDebounce(searchQuery, 300)
  
  // Advanced search criteria
  const advancedCriteria = ref({
    createdBy: '',
    dateRange: {
      start: null,
      end: null
    },
    hasFiles: null,
    hasMessages: null,
    overdue: false,
    modifiedWithin: null // days
  })
  
  // Quick search templates
  const quickSearches = ref([
    {
      id: 'recent',
      name: 'Recently Modified',
      icon: 'mdi-clock-outline',
      apply: () => {
        advancedCriteria.value.modifiedWithin = 7
      }
    },
    {
      id: 'my-projects',
      name: 'My Projects',
      icon: 'mdi-account',
      apply: (userId) => {
        advancedCriteria.value.createdBy = userId
      }
    },
    {
      id: 'overdue',
      name: 'Overdue Projects',
      icon: 'mdi-alert',
      apply: () => {
        advancedCriteria.value.overdue = true
      }
    },
    {
      id: 'with-files',
      name: 'Has Attachments',
      icon: 'mdi-paperclip',
      apply: () => {
        advancedCriteria.value.hasFiles = true
      }
    }
  ])
  
  // Methods
  function performSearch(projects) {
    if (!debouncedQuery.value && !isAdvancedSearch.value) {
      return projects
    }
    
    return projects.filter(project => {
      // Basic text search
      if (debouncedQuery.value) {
        const query = debouncedQuery.value.toLowerCase()
        const fieldsToSearch = searchFields.value
        
        const matches = fieldsToSearch.map(field => {
          const value = project[field]
          if (!value) return false
          
          if (Array.isArray(value)) {
            return value.some(item => 
              item.toString().toLowerCase().includes(query)
            )
          }
          
          return value.toString().toLowerCase().includes(query)
        })
        
        const hasMatch = searchMode.value === 'any' 
          ? matches.some(m => m) 
          : matches.every(m => m)
          
        if (!hasMatch) return false
      }
      
      // Advanced criteria
      if (isAdvancedSearch.value) {
        const criteria = advancedCriteria.value
        
        // Created by filter
        if (criteria.createdBy && project.createdBy !== criteria.createdBy) {
          return false
        }
        
        // Date range filter
        if (criteria.dateRange.start || criteria.dateRange.end) {
          const projectDate = project.createdAt?.toDate?.() || new Date(project.createdAt)
          
          if (criteria.dateRange.start) {
            const startDate = new Date(criteria.dateRange.start)
            if (projectDate < startDate) return false
          }
          
          if (criteria.dateRange.end) {
            const endDate = new Date(criteria.dateRange.end)
            endDate.setHours(23, 59, 59, 999)
            if (projectDate > endDate) return false
          }
        }
        
        // Has files filter
        if (criteria.hasFiles !== null) {
          const hasFiles = project.fileCount > 0
          if (criteria.hasFiles !== hasFiles) return false
        }
        
        // Has messages filter
        if (criteria.hasMessages !== null) {
          const hasMessages = project.messageCount > 0
          if (criteria.hasMessages !== hasMessages) return false
        }
        
        // Overdue filter
        if (criteria.overdue) {
          if (!project.deadline) return false
          const deadline = project.deadline?.toDate?.() || new Date(project.deadline)
          const isOverdue = deadline < new Date() && project.status !== 'completed'
          if (!isOverdue) return false
        }
        
        // Modified within filter
        if (criteria.modifiedWithin) {
          const modifiedDate = project.updatedAt?.toDate?.() || new Date(project.updatedAt)
          const daysAgo = new Date()
          daysAgo.setDate(daysAgo.getDate() - criteria.modifiedWithin)
          if (modifiedDate < daysAgo) return false
        }
      }
      
      return true
    })
  }
  
  function addToHistory(query) {
    if (!query || query.length < 2) return
    
    // Remove duplicates and add to beginning
    const newHistory = [
      query,
      ...searchHistory.value.filter(item => item !== query)
    ].slice(0, MAX_HISTORY_ITEMS)
    
    searchHistory.value = newHistory
  }
  
  function clearHistory() {
    searchHistory.value = []
  }
  
  function applyQuickSearch(searchId, userId = null) {
    const quickSearch = quickSearches.value.find(qs => qs.id === searchId)
    if (quickSearch) {
      // Reset advanced criteria
      resetAdvancedCriteria()
      isAdvancedSearch.value = true
      quickSearch.apply(userId)
    }
  }
  
  function resetAdvancedCriteria() {
    advancedCriteria.value = {
      createdBy: '',
      dateRange: {
        start: null,
        end: null
      },
      hasFiles: null,
      hasMessages: null,
      overdue: false,
      modifiedWithin: null
    }
  }
  
  function resetSearch() {
    searchQuery.value = ''
    searchFields.value = ['title', 'description', 'tags']
    searchMode.value = 'all'
    isAdvancedSearch.value = false
    resetAdvancedCriteria()
  }
  
  // Watch for search execution
  watch(debouncedQuery, (newQuery) => {
    if (newQuery) {
      addToHistory(newQuery)
    }
  })
  
  // Computed
  const hasActiveSearch = computed(() => {
    return !!(searchQuery.value || isAdvancedSearch.value)
  })
  
  const activeSearchCount = computed(() => {
    let count = 0
    if (searchQuery.value) count++
    if (advancedCriteria.value.createdBy) count++
    if (advancedCriteria.value.dateRange.start || advancedCriteria.value.dateRange.end) count++
    if (advancedCriteria.value.hasFiles !== null) count++
    if (advancedCriteria.value.hasMessages !== null) count++
    if (advancedCriteria.value.overdue) count++
    if (advancedCriteria.value.modifiedWithin) count++
    return count
  })
  
  return {
    // State
    searchQuery,
    searchFields,
    searchMode,
    isAdvancedSearch,
    searchHistory,
    advancedCriteria,
    quickSearches,
    
    // Computed
    debouncedQuery,
    hasActiveSearch,
    activeSearchCount,
    
    // Methods
    performSearch,
    addToHistory,
    clearHistory,
    applyQuickSearch,
    resetAdvancedCriteria,
    resetSearch
  }
}