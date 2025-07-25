// client/src/composables/comms/useCommsDashboard.js
// Dashboard business logic composable (~180 lines)
// Purpose: Extract all business logic from the component
// Dependencies: useCommsProjects, useProjectAnalytics, useProjectExport
import { ref, computed, onMounted, onUnmounted } from 'vue'
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

  // Initialize analytics
  const analytics = useProjectAnalytics(projects)
  
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
    return {
      metrics: analytics.metrics?.value || { total: 0, active: 0, completed: 0, pending: 0 },
      completionRate: analytics.completionRate?.value || 0,
      avgCompletionTime: analytics.avgCompletionTime?.value || 0,
      statusBreakdown: analytics.statusBreakdown?.value || [],
      priorityBreakdown: analytics.priorityDistribution?.value || { high: 0, medium: 0, low: 0 }, // Fixed: was priorityDistribution
      regionalDistribution: analytics.regionalDistribution?.value || [],
      activeCoordinators: analytics.activeCoordinators?.value || new Set(),
      totalCoordinators: analytics.activeCoordinators?.value?.size || 0, // Fixed: use Set size
      totalFiles: analytics.totalFiles?.value || 0,
      totalMessages: analytics.totalMessages?.value || 0
    }
  })

  // Methods
  function handleFilterUpdate(newFilters) {
    filters.value = newFilters
  }

  function handleProjectSelect(project) {
    console.log('Project selected:', project)
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
    console.log('Project created:', project)
    showSuccess('Project created successfully')
  }

  function handleProjectUpdated(project) {
    console.log('Project updated:', project)
    showSuccess('Project updated successfully')
  }

  function handleProjectDeleted(project, hard) {
    console.log('Project deleted:', { project, hard })
    deleteHard.value = hard
    deleteSnackbar.value = true
  }

  async function handleProjectDelete(project, hard = false) {
    console.log('Handling project delete:', { project, hard })
    
    try {
      if (hard) {
        await hardDeleteProject(project.id)
      } else {
        await softDeleteProject(project.id)
      }
      
      deleteHard.value = hard
      deleteSnackbar.value = true
    } catch (error) {
      console.error('Error deleting project:', error)
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
    if (analytics?.setDateRange) {
      analytics.setDateRange(dateRange.start, dateRange.end)
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

  // Lifecycle
  onMounted(() => {
    // Get initial projects on mount
    setTimeout(() => {
      if (projectListRef.value?.projects) {
        projects.value = projectListRef.value.projects
      }
    }, 500)
  })

  onUnmounted(() => {
    if (analytics?.cleanup && typeof analytics.cleanup === 'function') {
      analytics.cleanup()
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