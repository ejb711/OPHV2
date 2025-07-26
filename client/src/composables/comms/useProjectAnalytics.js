// client/src/composables/comms/useProjectAnalytics.js
import { ref, computed, watch, isRef } from 'vue'
import { collection, query, where, onSnapshot, Timestamp, getDocs } from 'firebase/firestore'
import { db } from '@/firebase'
import { useAuthStore } from '@/stores/auth'
import { LOUISIANA_REGIONS } from '@/config/louisiana-regions'

export function useProjectAnalytics(projectsRef = ref([])) {
  // Get auth store
  const authStore = useAuthStore()

  // Ensure we have a reactive reference
  const projects = isRef(projectsRef) ? projectsRef : ref(projectsRef)

  // State
  const loading = ref(false)
  const error = ref(null)
  const dateRange = ref({ start: null, end: null })
  const selectedRegion = ref('')

  // Real-time counters
  const totalMessages = ref(0)
  const totalFiles = ref(0)
  const activeCoordinators = ref(new Set())

  // Set default date range (null = all time)
  const initializeDateRange = () => {
    try {
      // Default to showing all data
      dateRange.value = {
        start: null,
        end: null
      }
    } catch (error) {
      dateRange.value = { start: null, end: null }
    }
  }

  // Filter projects by date range
  const filteredProjects = computed(() => {
    if (!projects.value || !Array.isArray(projects.value)) return []

    // If no date range specified, return all projects
    if (!dateRange.value.start || !dateRange.value.end) {
      return projects.value
    }

    const startDate = new Date(dateRange.value.start)
    const endDate = new Date(dateRange.value.end)
    endDate.setHours(23, 59, 59, 999)

    const filtered = projects.value.filter(project => {
      if (!project) return false
      const created = project.createdAt instanceof Date ? project.createdAt : project.createdAt?.toDate()
      return created && created >= startDate && created <= endDate
    })

    return filtered
  })

  // Helper function to calculate status based on stages
  const calculateProjectStatus = (project) => {
    if (!project) return 'unknown';

    // First check if project has an explicit status set
    if (project.status) {
      return project.status;
    }

    // If no explicit status, calculate based on stages
    if (!project.stages || project.stages.length === 0) {
      return 'not_started';
    }

    // Count completed stages
    const completedCount = project.stages.filter(s => s.completed).length;

    // All completed
    if (completedCount === project.stages.length) {
      return 'completed';
    }

    // None completed
    if (completedCount === 0) {
      return 'not_started';
    }

    // Some completed - in progress
    return 'in_progress';
  }

  // Basic metrics
  const metrics = computed(() => {
    const projectsArray = filteredProjects.value || []
    const filtered = selectedRegion.value
      ? projectsArray.filter(p => p && p.region === selectedRegion.value)
      : projectsArray

    // Only count non-deleted projects for the total
    const nonDeletedProjects = filtered.filter(p => p && !p.deleted)
    const result = {
      total: nonDeletedProjects.length,
      active: nonDeletedProjects.filter(p => {
        const status = calculateProjectStatus(p);
        return ['not_started', 'in_progress'].includes(status);
      }).length,
      completed: nonDeletedProjects.filter(p => {
        const status = calculateProjectStatus(p);
        return status === 'completed';
      }).length,
      pending: nonDeletedProjects.filter(p => {
        const status = calculateProjectStatus(p);
        return status === 'pending_approval';
      }).length,
      deleted: filtered.filter(p => p && p.deleted).length
    }

    return result
  })

  // Status breakdown
  const statusBreakdown = computed(() => {
    const breakdown = {}
    const projectsArray = filteredProjects.value || []
    const filtered = selectedRegion.value
      ? projectsArray.filter(p => p && p.region === selectedRegion.value)
      : projectsArray

    filtered.forEach(project => {
      if (project && !project.deleted) {
        const status = calculateProjectStatus(project)
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
    const distribution = { high: 0, medium: 0, low: 0, urgent: 0 }
    const projectsArray = filteredProjects.value || []
    const filtered = selectedRegion.value
      ? projectsArray.filter(p => p && p.region === selectedRegion.value)
      : projectsArray

    filtered.forEach(project => {
      if (project && !project.deleted && project.priority) {
        // Handle 'normal' priority from seeded data
        const priority = project.priority === 'normal' ? 'medium' : project.priority
        if (distribution.hasOwnProperty(priority)) {
          distribution[priority]++
        }
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
      const status = calculateProjectStatus(p)
      return status === 'completed'
    }).length

    return Math.round((completed / nonDeleted.length) * 100)
  })

  // Average completion time (in days)
  const avgCompletionTime = computed(() => {
    const projectsArray = filteredProjects.value || []
    const completed = projectsArray.filter(p => {
      if (!p || p.deleted) return false
      const status = calculateProjectStatus(p)
      return status === 'completed' && p.createdAt && p.completedAt
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
    if (!newProjects || !Array.isArray(newProjects)) {
      return
    }

    const coordinators = new Set()
    const coordinatorDetails = {}
    const allCoordinatorIds = []
    const projectsArray = newProjects || []

    // Log all projects and their coordinator IDs
    projectsArray.forEach((project, index) => {
      if (project) {
        if (project.coordinatorId) {
          allCoordinatorIds.push(project.coordinatorId)
        }
      }
    })

    // Only count coordinators from non-deleted projects
    projectsArray.forEach(project => {
      if (project && !project.deleted && project.coordinatorId) {
        coordinators.add(project.coordinatorId)
        // Track which projects each coordinator has
        if (!coordinatorDetails[project.coordinatorId]) {
          coordinatorDetails[project.coordinatorId] = []
        }
        coordinatorDetails[project.coordinatorId].push(project.title || project.id)
      }
    })

    activeCoordinators.value = coordinators
  }, { immediate: true, deep: true })

  // Set up file counters listener
  const setupFileCounters = () => {
    if (!authStore.user?.uid) {
      return
    }

    // Try different query approaches
    const testQuery = async () => {
      try {
        // First try: Query with deleted filter
        const q = query(
          collection(db, 'comms_files'),
          where('deleted', '==', false)
        )
        const snapshot = await getDocs(q)
        totalFiles.value = snapshot.size

        // Set up real-time listener
        return onSnapshot(q,
          (snapshot) => {
            totalFiles.value = snapshot.size
          },
          (err) => {
            // Error in listener
          }
        )
      } catch (err) {
        // Second try: Simple collection query
        try {
          const allFilesQuery = collection(db, 'comms_files')
          const snapshot = await getDocs(allFilesQuery)
          // Filter client-side
          let nonDeleted = 0
          snapshot.forEach(doc => {
            const data = doc.data()
            if (!data.deleted) {
              nonDeleted++
            }
          })

          totalFiles.value = nonDeleted

          // Set up listener for all files
          return onSnapshot(allFilesQuery,
            (snapshot) => {
              let count = 0
              snapshot.forEach(doc => {
                if (!doc.data().deleted) count++
              })
              totalFiles.value = count
            },
            (err2) => {
              // Error with listener
            }
          )
        } catch (err2) {
          totalFiles.value = 0
        }
      }
    }

    return testQuery()
  }

  // Set up message counters listener with improved permission check
  const setupMessageCounters = () => {
    if (!authStore.user?.uid) {
      return
    }

    // Skip permission check for now - let Firebase handle it
    // Try different query approaches
    const testQuery = async () => {
      try {
        // First try: Query with deleted filter
        const q = query(
          collection(db, 'comms_messages'),
          where('deleted', '==', false)
        )
        const snapshot = await getDocs(q)
        totalMessages.value = snapshot.size

        // Set up real-time listener
        return onSnapshot(q,
          (snapshot) => {
            totalMessages.value = snapshot.size
          },
          (err) => {
            // Error in listener
          }
        )
      } catch (err) {
        // Log the error but continue with other approaches
        // Second try: Simple collection query
        try {
          const allMessagesQuery = collection(db, 'comms_messages')
          const snapshot = await getDocs(allMessagesQuery)
          // Filter client-side
          let nonDeleted = 0
          snapshot.forEach(doc => {
            const data = doc.data()
            if (!data.deleted) {
              nonDeleted++
            }
          })

          totalMessages.value = nonDeleted

          // Set up listener for all messages
          return onSnapshot(allMessagesQuery,
            (snapshot) => {
              let count = 0
              snapshot.forEach(doc => {
                if (!doc.data().deleted) count++
              })
              totalMessages.value = count
            },
            (err2) => {
              // Error with listener
            }
          )
        } catch (err2) {
          totalMessages.value = 0
        }
      }
    }

    return testQuery()
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

    // Set up a watcher for auth state to initialize counters when user is ready
    const checkAndSetupCounters = () => {
      const user = authStore?.user
      if (user?.uid && !unsubscribeFiles && !unsubscribeMessages) {
        unsubscribeFiles = setupFileCounters()
        unsubscribeMessages = setupMessageCounters()
        return true
      }
      return false
    }

    // Try immediately
    if (!checkAndSetupCounters()) {
      // If not ready, watch for changes
      const unwatch = watch(
        () => authStore.user,
        (newUser) => {
          if (checkAndSetupCounters()) {
            unwatch() // Stop watching once setup
          }
        },
        { immediate: true }
      )

      // Also try after a delay as a fallback
      setTimeout(() => {
        checkAndSetupCounters()
      }, 2000)
    }
  }

  const cleanup = () => {
    if (unsubscribeFiles) unsubscribeFiles()
    if (unsubscribeMessages) unsubscribeMessages()
  }

  // Initialize on creation
  initialize()

  // Debug return values
  return {
    // State
    loading,
    error,
    dateRange,
    selectedRegion,

    // Metrics (these are computed refs, so they need .value to access)
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