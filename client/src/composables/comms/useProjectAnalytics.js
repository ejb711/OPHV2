// client/src/composables/comms/useProjectAnalytics.js
import { ref, computed, watch } from 'vue'
import { collection, query, where, onSnapshot, Timestamp } from 'firebase/firestore'
import { db } from '@/firebase'
import { useAuthStore } from '@/stores/auth'
import { LOUISIANA_REGIONS } from '@/config/louisiana-regions'

export function useProjectAnalytics(projects = ref([])) {
  // State
  const loading = ref(false)
  const error = ref(null)
  const dateRange = ref({ start: null, end: null })
  const selectedRegion = ref('')
  
  // Real-time counters
  const totalMessages = ref(0)
  const totalFiles = ref(0)
  const activeCoordinators = ref(new Set())
  
  // Get auth store
  const authStore = useAuthStore()
  
  // Set default date range (last 30 days)
  const initializeDateRange = () => {
    try {
      const end = new Date()
      const start = new Date()
      start.setDate(start.getDate() - 30)
      
      dateRange.value = {
        start: start.toISOString().split('T')[0],
        end: end.toISOString().split('T')[0]
      }
    } catch (error) {
      console.error('Error initializing date range:', error)
      dateRange.value = { start: null, end: null }
    }
  }
  
  // Filter projects by date range
  const filteredProjects = computed(() => {
    if (!projects.value || !Array.isArray(projects.value)) return []
    if (!dateRange.value.start || !dateRange.value.end) return projects.value
    
    const startDate = new Date(dateRange.value.start)
    const endDate = new Date(dateRange.value.end)
    endDate.setHours(23, 59, 59, 999)
    
    return projects.value.filter(project => {
      if (!project) return false
      const created = project.createdAt instanceof Date ? project.createdAt : project.createdAt?.toDate()
      return created && created >= startDate && created <= endDate
    })
  })
  
  // Helper function to normalize status values
  const normalizeStatus = (status) => {
    if (!status) return 'unknown';
    
    // Convert to lowercase and replace spaces with underscores
    const normalized = status.toString().toLowerCase().replace(/\s+/g, '_');
    
    // Handle specific variations
    const statusMap = {
      'draft': 'planning',
      'pending': 'pending_approval',
      'approved': 'review',
      'under_review': 'review',
      'not_started': 'not_started',
      'planning': 'planning',
      'in_progress': 'in_progress',
      'review': 'review',
      'pending_approval': 'pending_approval',
      'completed': 'completed',
      'on_hold': 'on_hold',
      'cancelled': 'cancelled'
    };
    
    return statusMap[normalized] || normalized;
  }
  
  // Basic metrics
  const metrics = computed(() => {
    const projectsArray = filteredProjects.value || []
    const filtered = selectedRegion.value 
      ? projectsArray.filter(p => p && p.region === selectedRegion.value)
      : projectsArray
      
    // Only count non-deleted projects for the total
    const nonDeletedProjects = filtered.filter(p => p && !p.deleted)
    
    return {
      total: nonDeletedProjects.length,
      active: nonDeletedProjects.filter(p => {
        const normalizedStatus = normalizeStatus(p.status);
        return ['planning', 'in_progress', 'review'].includes(normalizedStatus);
      }).length,
      completed: nonDeletedProjects.filter(p => {
        const normalizedStatus = normalizeStatus(p.status);
        return normalizedStatus === 'completed';
      }).length,
      pending: nonDeletedProjects.filter(p => {
        const normalizedStatus = normalizeStatus(p.status);
        return normalizedStatus === 'pending_approval';
      }).length,
      deleted: filtered.filter(p => p && p.deleted).length
    }
  })
  
  // Status breakdown
  const statusBreakdown = computed(() => {
    const breakdown = {}
    const projectsArray = filteredProjects.value || []
    const filtered = selectedRegion.value 
      ? projectsArray.filter(p => p && p.region === selectedRegion.value)
      : projectsArray
      
    filtered.forEach(project => {
      if (project && !project.deleted && project.status) {
        const normalizedStatus = normalizeStatus(project.status)
        breakdown[normalizedStatus] = (breakdown[normalizedStatus] || 0) + 1
      }
    })
    
    const totalNonDeleted = filtered.filter(p => p && !p.deleted).length || 1
    
    return Object.entries(breakdown)
      .filter(([status]) => status != null) // Filter out undefined/null status
      .map(([status, count]) => ({
        status: status || 'unknown',
        count,
        percentage: Math.round((count / totalNonDeleted) * 100)
      }))
  })
  
  // Priority distribution
  const priorityDistribution = computed(() => {
    const distribution = { high: 0, medium: 0, low: 0 }
    const projectsArray = filteredProjects.value || []
    const filtered = selectedRegion.value 
      ? projectsArray.filter(p => p && p.region === selectedRegion.value)
      : projectsArray
      
    filtered.forEach(project => {
      if (project && !project.deleted && project.priority && distribution.hasOwnProperty(project.priority)) {
        distribution[project.priority]++
      }
    })
    
    return distribution
  })
  
  // Regional distribution
  const regionalDistribution = computed(() => {
    const distribution = {}
    const projectsArray = filteredProjects.value || []
    
    projectsArray.forEach(project => {
      if (project && !project.deleted && project.region) {
        // Normalize region to handle old formats like "Region 2 - Baton Rouge"
        let normalizedRegion = project.region
        if (project.region.includes('Region')) {
          const match = project.region.match(/Region (\d)/)
          if (match) {
            normalizedRegion = match[1]
          }
        }
        distribution[normalizedRegion] = (distribution[normalizedRegion] || 0) + 1
      }
    })
    
    const totalNonDeleted = projectsArray.filter(p => p && !p.deleted).length || 1
    
    return Object.entries(distribution).map(([regionId, count]) => ({
      regionId,
      regionName: LOUISIANA_REGIONS[regionId]?.name || `Unknown Region (${regionId})`,
      count,
      percentage: Math.round((count / totalNonDeleted) * 100)
    })).sort((a, b) => b.count - a.count)
  })
  
  // Timeline data for charts
  const timelineData = computed(() => {
    const data = {}
    const projectsArray = filteredProjects.value || []
    
    projectsArray.forEach(project => {
      if (project && !project.deleted) {
        const date = project.createdAt instanceof Date 
          ? project.createdAt 
          : project.createdAt?.toDate()
          
        if (date) {
          const monthKey = date.toISOString().slice(0, 7) // YYYY-MM
          data[monthKey] = (data[monthKey] || 0) + 1
        }
      }
    })
    
    return Object.entries(data)
      .map(([month, count]) => ({ month, count }))
      .sort((a, b) => a.month.localeCompare(b.month))
  })
  
  // Completion rate
  const completionRate = computed(() => {
    const projectsArray = filteredProjects.value || []
    const filtered = selectedRegion.value 
      ? projectsArray.filter(p => p && p.region === selectedRegion.value)
      : projectsArray
      
    const nonDeleted = filtered.filter(p => p && !p.deleted)
    if (nonDeleted.length === 0) return 0
    
    const completed = nonDeleted.filter(p => {
      const normalizedStatus = normalizeStatus(p.status)
      return normalizedStatus === 'completed'
    }).length
    
    return Math.round((completed / nonDeleted.length) * 100)
  })
  
  // Average completion time (in days)
  const avgCompletionTime = computed(() => {
    const projectsArray = filteredProjects.value || []
    const completed = projectsArray.filter(p => {
      if (!p || p.deleted) return false
      const normalizedStatus = normalizeStatus(p.status)
      return normalizedStatus === 'completed' && p.createdAt && p.completedAt
    })
    
    if (completed.length === 0) return 0
    
    const totalDays = completed.reduce((sum, project) => {
      const created = project.createdAt instanceof Date 
        ? project.createdAt 
        : project.createdAt?.toDate()
      const completedDate = project.completedAt instanceof Date 
        ? project.completedAt 
        : project.completedAt?.toDate()
        
      if (created && completedDate) {
        const days = Math.ceil((completedDate - created) / (1000 * 60 * 60 * 24))
        return sum + days
      }
      return sum
    }, 0)
    
    return Math.round(totalDays / completed.length)
  })
  
  // Count coordinators
  watch(projects, (newProjects) => {
    if (!newProjects || !Array.isArray(newProjects)) return
    
    const coordinators = new Set()
    const projectsArray = newProjects || []
    projectsArray.forEach(project => {
      if (project && project.coordinatorId) {
        coordinators.add(project.coordinatorId)
      }
    })
    activeCoordinators.value = coordinators
  }, { immediate: true })
  
  // Set up file counters listener
  const setupFileCounters = () => {
    if (!authStore.currentUser?.uid) return

    const q = query(
      collection(db, 'comms_files'),
      where('deleted', '==', false)
    )
    
    return onSnapshot(q, 
      (snapshot) => {
        totalFiles.value = snapshot.size
      },
      (err) => {
        console.error('Error listening to files:', err)
      }
    )
  }
  
  // Set up message counters listener with improved permission check
  const setupMessageCounters = () => {
    if (!authStore.currentUser?.uid) return
    
    // Check if user has permission to view messages
    if (!authStore.hasPermission('view_comms')) {
      console.log('User does not have permission to view communications messages')
      return
    }

    try {
      const q = query(
        collection(db, 'comms_messages'),
        where('deleted', '==', false)
      )
      
      return onSnapshot(q, 
        (snapshot) => {
          totalMessages.value = snapshot.size
        },
        (err) => {
          // Don't log permission errors as they're expected for users without access
          if (err.code !== 'permission-denied') {
            console.error('Error listening to messages:', err)
          }
        }
      )
    } catch (error) {
      console.error('Error setting up message listener:', error)
    }
  }
  
  // Set date range
  const setDateRange = (start, end) => {
    dateRange.value = { start, end }
  }
  
  // Set selected region
  const setSelectedRegion = (region) => {
    selectedRegion.value = region
  }
  
  // Initialize
  let unsubscribeFiles = null
  let unsubscribeMessages = null
  
  const initialize = () => {
    initializeDateRange()
    unsubscribeFiles = setupFileCounters()
    unsubscribeMessages = setupMessageCounters()
  }
  
  const cleanup = () => {
    if (unsubscribeFiles) unsubscribeFiles()
    if (unsubscribeMessages) unsubscribeMessages()
  }
  
  // Initialize on creation
  initialize()
  
  return {
    // State
    loading,
    error,
    dateRange,
    selectedRegion,
    
    // Metrics
    metrics,
    statusBreakdown,
    priorityDistribution,
    regionalDistribution,
    timelineData,
    completionRate,
    avgCompletionTime,
    
    // Counters
    totalFiles,
    totalMessages,
    activeCoordinators,
    
    // Methods
    setDateRange,
    setSelectedRegion,
    cleanup
  }
}