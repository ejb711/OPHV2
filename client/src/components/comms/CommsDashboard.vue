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
      @manage-coordinators="showCoordinatorManagement = true"
    />

    <!-- Analytics Tab (only visible with permission) -->
    <CommsAnalyticsTab
      @open-analytics="showAnalyticsWindow = true"
    />

    <!-- Export Menu (moved from toolbar) -->
    <div class="d-flex justify-end mb-4">
      <v-menu>
        <template v-slot:activator="{ props }">
          <v-btn
            v-bind="props"
            variant="outlined"
            prepend-icon="mdi-export"
            :disabled="visibleProjects.length === 0"
            :loading="exporting"
          >
            Export Projects
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
      @edit="handleProjectEdit"
      @delete="handleProjectDelete"
      @stats-update="handleStatsUpdate"
      @update:filters="handleFilterUpdate"
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

    <!-- Analytics Window -->
    <CommsAnalyticsWindow
      v-model="showAnalyticsWindow"
      :projects="projects"
      :analytics="analytics"
      :analytics-data="analyticsData"
      :visible-projects="visibleProjects"
      :exporting="exporting"
      @export-csv="handleExportCSV"
      @export-pdf="handleExportPDF"
      @update-date-range="updateDateRange"
    />

    <!-- Coordinator Management Dialog -->
    <CoordinatorManagement
      v-model="showCoordinatorManagement"
      @coordinator-updated="handleCoordinatorUpdated"
    />
  </v-container>
</template>

<script setup>
import { ref, computed, watch, onMounted, nextTick } from 'vue'
import { usePermissions } from '@/composables/usePermissions'
import { useCommsDashboard } from '@/composables/comms/useCommsDashboard'

// Components
import CommsDashboardHeader from './dashboard/CommsDashboardHeader.vue'
import CommsAnalyticsTab from './dashboard/CommsAnalyticsTab.vue'
import CommsAnalyticsWindow from './dashboard/CommsAnalyticsWindow.vue'
import CommsFilters from './CommsFilters.vue'
import ProjectList from './projects/ProjectList.vue'
import CommsDialogs from './dashboard/CommsDialogs.vue'
import CommsNotifications from './dashboard/CommsNotifications.vue'
import CoordinatorManagement from './coordinators/admin/CoordinatorManagement.vue'

// Composables
const { hasPermission } = usePermissions()

// Refs
const commsDialogsRef = ref(null)
const showAnalyticsWindow = ref(false)
const showCoordinatorManagement = ref(false)

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
  // Use nextTick to ensure the ref is available
  nextTick(() => {
    if (commsDialogsRef.value && commsDialogsRef.value.projectDetailRef) {
      commsDialogsRef.value.projectDetailRef.open(project.id)
    } else {
      showError('Unable to open project details. Please refresh the page.')
    }
  })
}

// Handle project edit
function handleProjectEdit(project) {
  // Open project detail in edit mode
  nextTick(() => {
    if (commsDialogsRef.value && commsDialogsRef.value.projectDetailRef) {
      commsDialogsRef.value.projectDetailRef.open(project.id, true) // true for edit mode
    } else {
      showError('Unable to open project editor. Please refresh the page.')
    }
  })
}

// Handle coordinator update
function handleCoordinatorUpdated() {
  // The project list will automatically refresh due to Firestore listeners
  // Just show success message
  showSuccess('Coordinator updated successfully')

  // Don't close the dialog - let user close it manually
}

// Watch for project list changes
watch(() => projectListRef.value?.projects, (newProjects) => {
  if (newProjects) {
    projects.value = newProjects
  }
}, { immediate: true, deep: true })

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