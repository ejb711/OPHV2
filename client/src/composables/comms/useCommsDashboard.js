// client/src/composables/comms/useCommsDashboard.js
// Dashboard business logic composable (~180 lines)
// Purpose: Extract all business logic from the component
// Dependencies: useCommsProjects, useProjectAnalytics, useProjectExport
import { ref, computed, onMounted, onUnmounted, watch, unref } from 'vue'
import { useCommsProjects } from './useCommsProjects'
import { useProjectAnalytics } from './useProjectAnalytics'
import { useProjectExport } from './useProjectExport'

export function useCommsDashboard() {
  // Composables
  const {
    softDeleteProject,
    hardDeleteProject
  } = useCommsProjects()

  // State
  const showCreateDialog = ref(false)
  const projectDetailRef = ref(null) // Will be set by parent component
  const projectListRef = ref(null)
  const deleteSnackbar = ref(false)
  const deleteHard = ref(false)
  const successSnackbar = ref(false)
  const successMessage = ref('')
  const errorSnackbar = ref(false)
  const errorMessage = ref('')
  const projects = ref([])

  // Initialize analytics - will be set after projects are loaded
  const analytics = ref(null)

  // Initialize export
  const { exportToCSV, exportToPDF, exporting } = useProjectExport()

  // Filters
  const filters = ref({
    region: null,
    status: null,
    priority: null,
    search: ''
  })

  // Computed
  const visibleProjects = computed(() => {
    return projectListRef.value?.visibleProjects || []
  })

  const analyticsData = computed(() => {
    if (!analytics.value) {
      return {
        metrics: { total: 0, active: 0, completed: 0, pending: 0 },
        completionRate: 0,
        avgCompletionTime: 0,
        statusBreakdown: [],
        priorityBreakdown: { high: 0, medium: 0, low: 0 },
        regionalDistribution: [],
        activeCoordinators: new Set(),
        totalCoordinators: 0,
        totalFiles: 0,
        totalMessages: 0
      }
    }

    // Get the raw analytics object
    const analyticsObj = analytics.value

    // Access computed values using unref to get the actual values
    const metricsValue = unref(analyticsObj.metrics) || { total: 0, active: 0, completed: 0, pending: 0 }
    const completionRateValue = unref(analyticsObj.completionRate) || 0
    const avgCompletionTimeValue = unref(analyticsObj.avgCompletionTime) || 0
    const statusBreakdownValue = unref(analyticsObj.statusBreakdown) || []
    const priorityDistributionValue = unref(analyticsObj.priorityDistribution) || { high: 0, medium: 0, low: 0 }
    const regionalDistributionValue = unref(analyticsObj.regionalDistribution) || []
    const activeCoordinatorsValue = unref(analyticsObj.activeCoordinators) || new Set()
    const totalFilesValue = unref(analyticsObj.totalFiles) || 0
    const totalMessagesValue = unref(analyticsObj.totalMessages) || 0

    // Ensure we're passing numbers for the counts
    const totalCoordinatorsCount = typeof activeCoordinatorsValue?.size === 'number' ? activeCoordinatorsValue.size : 0
    const totalFilesCount = typeof totalFilesValue === 'object' ? (totalFilesValue?.value || 0) : (totalFilesValue || 0)
    const totalMessagesCount = typeof totalMessagesValue === 'object' ? (totalMessagesValue?.value || 0) : (totalMessagesValue || 0)

    const data = {
      metrics: metricsValue,
      completionRate: completionRateValue,
      avgCompletionTime: avgCompletionTimeValue,
      statusBreakdown: statusBreakdownValue,
      priorityBreakdown: priorityDistributionValue,
      regionalDistribution: regionalDistributionValue,
      activeCoordinators: activeCoordinatorsValue,
      totalCoordinators: totalCoordinatorsCount,
      totalFiles: totalFilesCount,
      totalMessages: totalMessagesCount
    }

    return data
  })

  // Methods
  function handleFilterUpdate(newFilters) {
    filters.value = newFilters
  }

  function handleProjectSelect(project) {
    if (projectDetailRef.value) {
      projectDetailRef.value.open(project.id)
    }
  }

  function handleStatsUpdate(stats) {
    // Update projects ref if ProjectList provides it
    if (projectListRef.value?.projects) {
      projects.value = projectListRef.value.projects
    }
  }

  function handleProjectCreated(project) {
    showSuccess('Project created successfully')
  }

  function handleProjectUpdated(project) {
    showSuccess('Project updated successfully')
  }

  function handleProjectDeleted(project, hard) {
    deleteHard.value = hard
    deleteSnackbar.value = true
  }

  async function handleProjectDelete(project, hard = false) {
    try {
      if (hard) {
        await hardDeleteProject(project.id)
      } else {
        await softDeleteProject(project.id)
      }

      deleteHard.value = hard
      deleteSnackbar.value = true
    } catch (error) {
      showError(error.message || 'Failed to delete project')
    }
  }

  async function handleExportCSV() {
    const projectsToExport = visibleProjects.value
    if (projectsToExport.length === 0) {
      showError('No projects to export')
      return
    }

    const success = await exportToCSV(projectsToExport, 'comms_projects')
    if (success) {
      showSuccess('Projects exported to CSV successfully')
    } else {
      showError('Failed to export projects')
    }
  }

  async function handleExportPDF() {
    const projectsToExport = visibleProjects.value
    if (projectsToExport.length === 0) {
      showError('No projects to export')
      return
    }

    const success = await exportToPDF(projectsToExport, 'comms_projects_report')
    if (success) {
      showSuccess('Projects exported to PDF successfully')
    } else {
      showError('Failed to export projects')
    }
  }

  function updateDateRange(dateRange) {
    if (analytics.value && analytics.value.setDateRange) {
      analytics.value.setDateRange(dateRange.start, dateRange.end)
    }
  }

  function showSuccess(message) {
    successMessage.value = message
    successSnackbar.value = true
  }

  function showError(message) {
    errorMessage.value = message
    errorSnackbar.value = true
  }

  // Initialize analytics when projects are available
  const initializeAnalytics = () => {
    if (!analytics.value && projects.value.length > 0) {
      analytics.value = useProjectAnalytics(projects)
  }

  // Watch for projects changes to initialize analytics
  watch(projects, (newProjects) => {
    if (newProjects && newProjects.length > 0) {
      if (!analytics.value) {
        initializeAnalytics()
      }
    }
  }, { immediate: true, deep: true })

  // Lifecycle
  onMounted(() => {
    // Get initial projects on mount
    setTimeout(() => {
      if (projectListRef.value?.projects) {
        projects.value = projectListRef.value.projects
        initializeAnalytics()
      }
    }, 500)
  })

  onUnmounted(() => {
    if (analytics.value && analytics.value.cleanup && typeof analytics.value.cleanup === 'function') {
      analytics.value.cleanup()
    }
  })

  return {
    // State
    projects,
    filters,
    showCreateDialog,
    projectDetailRef,
    projectListRef,
    deleteSnackbar,
    deleteHard,
    successSnackbar,
    successMessage,
    errorSnackbar,
    errorMessage,

    // Analytics
    analytics,
    analyticsData,
    visibleProjects,

    // Export
    exporting,

    // Methods
    handleFilterUpdate,
    handleProjectSelect,
    handleStatsUpdate,
    handleProjectCreated,
    handleProjectUpdated,
    handleProjectDeleted,
    handleProjectDelete,
    handleExportCSV,
    handleExportPDF,
    updateDateRange,
    showSuccess,
    showError
  }
}