<!-- client/src/components/comms/CommsDashboard.vue -->
<template>
  <v-container fluid>
    <!-- Header -->
    <div class="d-flex align-center justify-space-between mb-6">
      <div>
        <h1 class="text-h4 font-weight-bold text-grey-darken-3 mb-2">
          Communications Dashboard
        </h1>
        <p class="text-body-1 text-grey-darken-1">
          Manage communications projects across Louisiana's 9 health regions
        </p>
      </div>
      <div class="d-flex ga-3">
        <v-btn
          color="primary"
          variant="elevated"
          prepend-icon="mdi-folder-plus"
          :disabled="!canCreateProjects"
          @click="showCreateDialog = true"
        >
          New Project
        </v-btn>
        <v-menu>
          <template v-slot:activator="{ props }">
            <v-btn
              v-bind="props"
              variant="outlined"
              prepend-icon="mdi-export"
              :disabled="visibleProjects.length === 0"
              :loading="exporting"
            >
              Export
              <v-icon end>mdi-menu-down</v-icon>
            </v-btn>
          </template>
          <v-list>
            <v-list-item @click="handleExportCSV">
              <v-list-item-title>
                <v-icon start>mdi-file-excel</v-icon>
                Export to CSV
              </v-list-item-title>
            </v-list-item>
            <v-list-item @click="handleExportPDF">
              <v-list-item-title>
                <v-icon start>mdi-file-pdf-box</v-icon>
                Export to PDF
              </v-list-item-title>
            </v-list-item>
          </v-list>
        </v-menu>
      </div>
    </div>

    <!-- Analytics Date Range Filter -->
    <v-row class="mb-4" v-if="analytics?.dateRange">
      <v-col cols="12" md="6">
        <v-text-field
          v-model="analytics.dateRange.value.start"
          label="Start Date"
          type="date"
          variant="outlined"
          density="compact"
          hide-details
          @update:model-value="updateDateRange"
        />
      </v-col>
      <v-col cols="12" md="6">
        <v-text-field
          v-model="analytics.dateRange.value.end"
          label="End Date"
          type="date"
          variant="outlined"
          density="compact"
          hide-details
          @update:model-value="updateDateRange"
        />
      </v-col>
    </v-row>

    <!-- Stats Cards with Real Analytics -->
    <CommsStats 
      :analytics="analyticsData"
      class="mb-6"
    />

    <!-- Coordinator Workload and Regional Distribution -->
    <v-row class="mb-6">
      <v-col cols="12" lg="6">
        <CoordinatorWorkload :projects="projects" />
      </v-col>
      
      <!-- Regional Distribution -->
      <v-col cols="12" lg="6">
        <v-card>
          <v-card-title>
            <v-icon class="mr-2">mdi-map-marker-multiple</v-icon>
            Regional Distribution
          </v-card-title>
          <v-card-text>
            <v-list>
              <v-list-item
                v-for="region in analyticsData.regionalDistribution"
                :key="region.regionId"
                :title="region.regionName"
                :subtitle="`${region.count || 0} projects (${region.percentage || 0}%)`"
              >
                <template v-slot:prepend>
                  <v-avatar
                    :color="LOUISIANA_REGIONS[region.regionId]?.color || 'grey'"
                    size="32"
                  >
                    {{ region.count }}
                  </v-avatar>
                </template>
                <template v-slot:append>
                  <v-progress-linear
                    :model-value="region.percentage"
                    :color="LOUISIANA_REGIONS[region.regionId]?.color || 'grey'"
                    height="6"
                    rounded
                    class="ml-4"
                    style="min-width: 100px"
                  />
                </template>
              </v-list-item>
            </v-list>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>

    <!-- Filters -->
    <CommsFilters 
      :filters="filters"
      @update:filters="handleFilterUpdate"
      class="mb-6"
    />

    <!-- Projects List -->
    <ProjectList
      ref="projectListRef"
      :filters="filters"
      @select="handleProjectSelect"
      @stats-update="handleStatsUpdate"
      @delete="handleProjectDelete"
    />

    <!-- Create Project Dialog -->
    <ProjectForm
      v-model="showCreateDialog"
      @created="handleProjectCreated"
    />

    <!-- Project Detail Drawer -->
    <ProjectDetail
      ref="projectDetailRef"
      @updated="handleProjectUpdated"
      @deleted="handleProjectDeleted"
    />

    <!-- Delete Confirmation Snackbar -->
    <v-snackbar
      v-model="deleteSnackbar"
      :color="deleteHard ? 'error' : 'warning'"
      timeout="5000"
    >
      Project {{ deleteHard ? 'permanently deleted' : 'moved to trash' }}
      <template v-slot:actions>
        <v-btn
          variant="text"
          @click="deleteSnackbar = false"
        >
          Close
        </v-btn>
      </template>
    </v-snackbar>

    <!-- Success/Error Snackbars -->
    <v-snackbar
      v-model="successSnackbar"
      color="success"
      timeout="3000"
    >
      {{ successMessage }}
      <template v-slot:actions>
        <v-btn
          variant="text"
          @click="successSnackbar = false"
        >
          Close
        </v-btn>
      </template>
    </v-snackbar>

    <v-snackbar
      v-model="errorSnackbar"
      color="error"
      timeout="5000"
    >
      {{ errorMessage }}
      <template v-slot:actions>
        <v-btn
          variant="text"
          @click="errorSnackbar = false"
        >
          Close
        </v-btn>
      </template>
    </v-snackbar>
  </v-container>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted, watch } from 'vue'
import { usePermissions } from '@/composables/usePermissions'
import { useCommsProjects } from '@/composables/comms/useCommsProjects'
import { useProjectAnalytics } from '@/composables/comms/useProjectAnalytics'
import { useProjectExport } from '@/composables/comms/useProjectExport'
import { LOUISIANA_REGIONS } from '@/config/louisiana-regions'
import CommsStats from './CommsStats.vue'
import CommsFilters from './CommsFilters.vue'
import ProjectList from './projects/ProjectList.vue'
import ProjectForm from './projects/ProjectForm.vue'
import ProjectDetail from './projects/ProjectDetail.vue'
import CoordinatorWorkload from './coordinators/CoordinatorWorkload.vue'

// Composables
const { hasPermission } = usePermissions()
const { 
  softDeleteProject, 
  hardDeleteProject 
} = useCommsProjects()

// State
const showCreateDialog = ref(false)
const projectDetailRef = ref(null)
const projectListRef = ref(null)
const deleteSnackbar = ref(false)
const deleteHard = ref(false)
const successSnackbar = ref(false)
const successMessage = ref('')
const errorSnackbar = ref(false)
const errorMessage = ref('')

// Get projects ref from ProjectList for analytics
const projects = ref([])

// Add this watch to sync projects from ProjectList
watch(() => projectListRef.value?.projects, (newProjects) => {
  if (newProjects) {
    projects.value = newProjects
  }
}, { immediate: true })

// Initialize analytics with projects
const analytics = useProjectAnalytics(projects)

// Initialize export functionality
const { exportToCSV, exportToPDF, exporting } = useProjectExport()

// Initialize filters with plain object
const filters = ref({
  region: null,
  status: null,
  priority: null,
  search: ''
})

// Initialize stats with plain object
const projectStats = ref({
  total: 0,
  byStatus: {},
  byPriority: {},
  byRegion: {}
})

// Computed
const canCreateProjects = computed(() => 
  hasPermission('create_comms_projects')
)

// Get visible projects from ProjectList for export
const visibleProjects = computed(() => {
  // Access projects from the ProjectList component if available
  return projectListRef.value?.visibleProjects || []
})

// Safe analytics data for template - ensure all computed refs are properly accessed
const analyticsData = computed(() => {
  return {
    metrics: analytics.metrics?.value || { total: 0, active: 0, completed: 0, pending: 0 },
    completionRate: analytics.completionRate?.value || 0,
    avgCompletionTime: analytics.avgCompletionTime?.value || 0,
    statusBreakdown: analytics.statusBreakdown?.value || [],
    priorityDistribution: analytics.priorityDistribution?.value || { high: 0, medium: 0, low: 0 },
    regionalDistribution: analytics.regionalDistribution?.value || [],
    activeCoordinators: analytics.activeCoordinators?.value || new Set(),
    totalFiles: analytics.totalFiles?.value || 0,
    totalMessages: analytics.totalMessages?.value || 0
  }
})

// Methods
function handleFilterUpdate(newFilters) {
  // Simply assign the new filters
  filters.value = newFilters
}

function handleProjectSelect(project) {
  console.log('Project selected:', project)
  if (projectDetailRef.value) {
    projectDetailRef.value.open(project.id)
  }
}

function handleStatsUpdate(stats) {
  // Update both legacy stats and projects for analytics
  projectStats.value = stats
  
  // Update projects ref if ProjectList provides it
  if (projectListRef.value?.projects) {
    projects.value = projectListRef.value.projects
  }
}

function handleProjectCreated(project) {
  console.log('Project created:', project)
  // The list will auto-refresh due to Firestore listener
}

function handleProjectUpdated(project) {
  console.log('Project updated:', project)
  // The list will auto-refresh due to Firestore listener
}

function handleProjectDeleted(project, hard) {
  console.log('Project deleted from detail:', { project, hard })
  deleteHard.value = hard
  deleteSnackbar.value = true
  // The list will auto-refresh due to Firestore listener
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
    // Error handling is done in the composable with snackbar notifications
  }
}

// Export handlers
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

// Update date range for analytics
function updateDateRange() {
  if (analytics?.setDateRange) {
    analytics.setDateRange(
      analytics.dateRange.value.start,
      analytics.dateRange.value.end
    )
  }
}

// Notification helpers
function showSuccess(message) {
  successMessage.value = message
  successSnackbar.value = true
}

function showError(message) {
  errorMessage.value = message
  errorSnackbar.value = true
}

// Check for analytics initialization
onMounted(() => {
  // Get initial projects on mount
  // Wait for ProjectList to be ready
  setTimeout(() => {
    if (projectListRef.value?.projects) {
      projects.value = projectListRef.value.projects
    }
  }, 500)
})

// Clean up analytics on unmount
onUnmounted(() => {
  if (analytics?.cleanup && typeof analytics.cleanup === 'function') {
    analytics.cleanup()
  }
})
</script>

<style scoped>
/* Container adjustments */
.v-container {
  max-width: 1400px;
}

/* Header styling */
h1 {
  font-family: 'ITC Franklin Gothic Demi', 'Arial Black', sans-serif;
  letter-spacing: -0.02em;
}

/* Button styling */
.v-btn {
  text-transform: none;
  font-weight: 500;
  letter-spacing: 0.02em;
}

/* Responsive adjustments */
@media (max-width: 599px) {
  .d-flex {
    flex-direction: column;
    align-items: stretch !important;
  }
  
  .d-flex.ga-3 {
    gap: 8px !important;
  }
  
  h1 {
    font-size: 1.5rem !important;
  }
}
</style>