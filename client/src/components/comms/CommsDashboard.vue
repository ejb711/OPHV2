// client/src/components/comms/CommsDashboard.vue
<!-- Main orchestrator component - Modularized version (~150 lines) -->
<!-- Dependencies: CommsDashboardHeader, CommsDashboardToolbar, CommsDialogs, CommsNotifications -->
<!-- Composables: useCommsDashboard, usePermissions -->
<!-- Child Components: CommsStats, CommsFilters, ProjectList, CoordinatorWorkload, CommsRegionalDistribution -->
<template>
  <v-container fluid>
    <!-- Header Component -->
    <CommsDashboardHeader 
      @create-project="showCreateDialog = true"
    />

    <!-- Toolbar with Analytics Controls -->
    <CommsDashboardToolbar
      :analytics="analytics"
      :exporting="exporting"
      :visible-projects-count="visibleProjects.length"
      @export-csv="handleExportCSV"
      @export-pdf="handleExportPDF"
      @update-date-range="updateDateRange"
    />

    <!-- Stats Cards -->
    <CommsStats 
      :analytics="analyticsData"
      class="mb-6"
    />

    <!-- Workload and Distribution Grid -->
    <v-row class="mb-6">
      <v-col cols="12" lg="6">
        <CoordinatorWorkload :projects="projects" />
      </v-col>
      
      <v-col cols="12" lg="6">
        <CommsRegionalDistribution 
          :regional-distribution="analyticsData.regionalDistribution"
        />
      </v-col>
    </v-row>

    <!-- Search and Filters -->
    <CommsFilters 
      :filters="filters"
      @update="handleFilterUpdate"
      class="mb-4"
    />

    <!-- Project List -->
    <ProjectList
      ref="projectListRef"
      :filters="filters"
      @select="handleProjectSelectCustom"
      @delete="handleProjectDelete"
      @stats-update="handleStatsUpdate"
    />

    <!-- Dialogs Component -->
    <CommsDialogs
      ref="commsDialogsRef"
      v-model:create-dialog="showCreateDialog"
      @project-created="handleProjectCreated"
      @project-updated="handleProjectUpdated"
      @project-deleted="handleProjectDeleted"
    />

    <!-- Notifications Component -->
    <CommsNotifications
      v-model:delete-snackbar="deleteSnackbar"
      v-model:success-snackbar="successSnackbar"
      v-model:error-snackbar="errorSnackbar"
      :delete-hard="deleteHard"
      :success-message="successMessage"
      :error-message="errorMessage"
    />
  </v-container>
</template>

<script setup>
import { ref, computed, watch, onMounted, nextTick } from 'vue'
import { usePermissions } from '@/composables/usePermissions'
import { useCommsDashboard } from '@/composables/comms/useCommsDashboard'

// Components
import CommsDashboardHeader from './dashboard/CommsDashboardHeader.vue'
import CommsDashboardToolbar from './dashboard/CommsDashboardToolbar.vue'
import CommsStats from './CommsStats.vue'
import CommsFilters from './CommsFilters.vue'
import ProjectList from './projects/ProjectList.vue'
import CoordinatorWorkload from './coordinators/CoordinatorWorkload.vue'
import CommsRegionalDistribution from './dashboard/CommsRegionalDistribution.vue'
import CommsDialogs from './dashboard/CommsDialogs.vue'
import CommsNotifications from './dashboard/CommsNotifications.vue'

// Composables
const { hasPermission } = usePermissions()

// Refs
const commsDialogsRef = ref(null)

// Use the dashboard composable for business logic
const {
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
} = useCommsDashboard()

// Custom project select handler that uses the dialogs ref
function handleProjectSelectCustom(project) {
  console.log('Project selected:', project)
  // Use nextTick to ensure the ref is available
  nextTick(() => {
    if (commsDialogsRef.value && commsDialogsRef.value.projectDetailRef) {
      commsDialogsRef.value.projectDetailRef.open(project.id)
    } else {
      console.error('ProjectDetail ref not available')
    }
  })
}

// Watch for project list changes
watch(() => projectListRef.value?.projects, (newProjects) => {
  if (newProjects) {
    projects.value = newProjects
  }
}, { immediate: true })

// Set up the projectDetailRef after component is mounted
onMounted(() => {
  nextTick(() => {
    if (commsDialogsRef.value && commsDialogsRef.value.projectDetailRef) {
      projectDetailRef.value = commsDialogsRef.value.projectDetailRef
    }
  })
})
</script>

<style scoped>
/* Container adjustments */
.v-container {
  max-width: 1400px;
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
}
</style>