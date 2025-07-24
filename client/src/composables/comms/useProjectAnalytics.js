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
  
  // Basic metrics
  const metrics = computed(() => {
    const projectsArray = filteredProjects.value || []
    const filtered = selectedRegion.value 
      ? projectsArray.filter(p => p && p.region === selectedRegion.value)
      : projectsArray
      
    return {
      total: filtered.length,
      active: filtered.filter(p => p && ['planning', 'in_progress', 'review'].includes(p.status) && !p.deleted).length,
      completed: filtered.filter(p => p && p.status === 'completed' && !p.deleted).length,
      pending: filtered.filter(p => p && p.status === 'pending_approval' && !p.deleted).length,
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
        const status = project.status || 'unknown'
        breakdown[status] = (breakdown[status] || 0) + 1
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
        distribution[project.region] = (distribution[project.region] || 0) + 1
      }
    })
    
    const totalNonDeleted = projectsArray.filter(p => p && !p.deleted).length || 1
    
    return Object.entries(distribution).map(([regionId, count]) => ({
      regionId,
      regionName: LOUISIANA_REGIONS[regionId]?.name || 'Unknown',
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
      
    const total = filtered.filter(p => p && !p.deleted).length
    const completed = filtered.filter(p => p && p.status === 'completed' && !p.deleted).length
    
    return total > 0 ? Math.round((completed / total) * 100) : 0
  })
  
  // Average completion time
  const avgCompletionTime = computed(() => {
    const projectsArray = filteredProjects.value || []
    const completedProjects = projectsArray.filter(p => 
      p && p.status === 'completed' && p.completedAt && !p.deleted
    )
    
    if (completedProjects.length === 0) return 0
    
    const totalDays = completedProjects.reduce((sum, project) => {
      if (!project) return sum
      const created = project.createdAt instanceof Date ? project.createdAt : project.createdAt?.toDate()
      const completed = project.completedAt instanceof Date ? project.completedAt : project.completedAt?.toDate()
      
      if (created && completed) {
        const days = Math.floor((completed - created) / (1000 * 60 * 60 * 24))
        return sum + days
      }
      return sum
    }, 0)
    
    return Math.round(totalDays / completedProjects.length)
  })
  
  // Upcoming deadlines
  const upcomingDeadlines = computed(() => {
    const now = new Date()
    const projectsArray = filteredProjects.value || []
    const filtered = selectedRegion.value 
      ? projectsArray.filter(p => p && p.region === selectedRegion.value)
      : projectsArray
      
    return filtered
      .filter(p => {
        if (!p || p.deleted || p.status === 'completed') return false
        const deadline = p.deadline instanceof Date ? p.deadline : p.deadline?.toDate()
        return deadline && deadline > now
      })
      .map(p => {
        const deadline = p.deadline instanceof Date ? p.deadline : p.deadline?.toDate()
        return {
          ...p,
          daysUntil: deadline ? Math.ceil((deadline - now) / (1000 * 60 * 60 * 24)) : 0
        }
      })
      .sort((a, b) => a.daysUntil - b.daysUntil)
      .slice(0, 5)
  })
  
  // Set up real-time listeners
  const setupListeners = () => {
    try {
      // Listen to messages count
      const messagesQuery = query(collection(db, 'comms_messages'), where('deleted', '==', false))
      const messagesUnsubscribe = onSnapshot(messagesQuery, 
        (snapshot) => {
          totalMessages.value = snapshot.size
        },
        (error) => {
          console.error('Error listening to messages:', error)
          totalMessages.value = 0
        }
      )
      
      // Listen to files count
      const filesQuery = query(collection(db, 'comms_files'), where('deleted', '==', false))
      const filesUnsubscribe = onSnapshot(filesQuery, 
        (snapshot) => {
          totalFiles.value = snapshot.size
        },
        (error) => {
          console.error('Error listening to files:', error)
          totalFiles.value = 0
        }
      )
      
      // Listen to coordinators
      const coordinatorsQuery = collection(db, 'comms_coordinators')
      const coordinatorsUnsubscribe = onSnapshot(coordinatorsQuery, 
        (snapshot) => {
          activeCoordinators.value = new Set(snapshot.docs.map(doc => doc.id))
        },
        (error) => {
          console.error('Error listening to coordinators:', error)
          activeCoordinators.value = new Set()
        }
      )
      
      // Return cleanup function
      return () => {
        try {
          messagesUnsubscribe()
          filesUnsubscribe()
          coordinatorsUnsubscribe()
        } catch (error) {
          console.error('Error during cleanup:', error)
        }
      }
    } catch (error) {
      console.error('Error setting up analytics listeners:', error)
      return () => {} // Return empty cleanup function
    }
  }
  
  // Initialize
  let cleanup = () => {}
  try {
    initializeDateRange()
    cleanup = setupListeners()
  } catch (error) {
    console.error('Error initializing analytics:', error)
  }
  
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
    upcomingDeadlines,
    totalMessages,
    totalFiles,
    activeCoordinators,
    
    // Methods
    setDateRange: (start, end) => {
      if (start && end) {
        dateRange.value = { start, end }
      }
    },
    setRegion: (region) => {
      selectedRegion.value = region || ''
    },
    cleanup
  }
}