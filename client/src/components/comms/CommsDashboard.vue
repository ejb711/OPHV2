// client/src/components/comms/CommsDashboard.vue
<!-- Main orchestrator component - Modularized version (~150 lines) -->
<!-- Dependencies: CommsDashboardHeader, CommsDashboardToolbar, CommsDialogs, CommsNotifications -->
<!-- Composables: useCommsDashboard, usePermissions -->
<!-- Child Components: CommsStats, CommsFilters, ProjectList, CoordinatorWorkload, CommsRegionalDistribution -->
<template>
  <v-container fluid class="comms-dashboard-container" :class="{ 'pa-0': $vuetify.display.smAndDown }">
    <!-- Mobile Header -->
    <div v-if="$vuetify.display.smAndDown" class="mobile-header">
      <div class="d-flex align-center justify-space-between pa-3">
        <h1 class="text-h6 font-weight-bold">Communications</h1>
        <div class="d-flex ga-2">
          <v-badge
            :content="activeFilterCount"
            :model-value="activeFilterCount > 0"
            color="primary"
            offset-x="-8"
            offset-y="-8"
          >
            <v-btn
              icon="mdi-filter-variant"
              size="small"
              variant="text"
              @click="showMobileFilters = true"
            />
          </v-badge>
          <v-btn
            icon="mdi-plus"
            size="small"
            color="primary"
            variant="flat"
            @click="showCreateDialog = true"
          />
        </div>
      </div>
    </div>

    <!-- Desktop Header -->
    <CommsDashboardHeader
      v-if="!$vuetify.display.smAndDown"
      @create-project="showCreateDialog = true"
      @manage-coordinators="showCoordinatorManagement = true"
    />

    <!-- Analytics Tab (only visible with permission and on desktop) -->
    <CommsAnalyticsTab
      v-if="!$vuetify.display.smAndDown"
      @open-analytics="showAnalyticsWindow = true"
    />

    <!-- Export Menu (desktop only) -->
    <div v-if="!$vuetify.display.smAndDown" class="d-flex justify-end mb-4">
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

    <!-- Desktop Search and Filters -->
    <CommsFilters
      v-if="!$vuetify.display.smAndDown"
      :filters="filters"
      @update="handleFilterUpdate"
      class="mb-4"
    />

    <!-- Mobile Filter Summary -->
    <div v-if="$vuetify.display.smAndDown && (activeFilterCount > 0 || filters.search)" class="mobile-filter-summary px-3 pb-3">
      <v-chip
        v-if="filters.search"
        size="small"
        closable
        @click:close="clearFilter('search')"
        class="mr-2 mb-1"
      >
        Search: {{ filters.search }}
      </v-chip>
      <v-chip
        v-if="filters.region"
        size="small"
        closable
        @click:close="clearFilter('region')"
        class="mr-2 mb-1"
      >
        Region: {{ filters.region }}
      </v-chip>
      <v-chip
        v-if="filters.status"
        size="small"
        closable
        @click:close="clearFilter('status')"
        class="mr-2 mb-1"
      >
        Status: {{ filters.status }}
      </v-chip>
      <v-chip
        v-if="filters.priority"
        size="small"
        closable
        @click:close="clearFilter('priority')"
        class="mr-2 mb-1"
      >
        Priority: {{ filters.priority }}
      </v-chip>
      <v-chip
        v-if="filters.coordinator"
        size="small"
        closable
        @click:close="clearFilter('coordinator')"
        class="mr-2 mb-1"
      >
        Coord: {{ getCoordinatorName(filters.coordinator) }}
      </v-chip>
    </div>

    <!-- Project List -->
    <ProjectList
      ref="projectListRef"
      :filters="filters"
      :mobile-view="$vuetify.display.smAndDown"
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

    <!-- Mobile Filter Panel -->
    <MobileFilterPanel
      v-model="showMobileFilters"
      :filters="filters"
      @update:filters="handleFilterUpdate"
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
import MobileFilterPanel from './MobileFilterPanel.vue'

// Composables
const { hasPermission } = usePermissions()
import { useCommsCoordinators } from '@/composables/comms/useCommsCoordinators'
const { coordinators } = useCommsCoordinators()

// Refs
const commsDialogsRef = ref(null)
const showAnalyticsWindow = ref(false)
const showCoordinatorManagement = ref(false)
const showMobileFilters = ref(false)

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

// Computed
const activeFilterCount = computed(() => {
  let count = 0
  if (filters.value.region) count++
  if (filters.value.status) count++
  if (filters.value.priority) count++
  if (filters.value.coordinator) count++
  return count
})

// Methods
function clearFilter(field) {
  const newFilters = { ...filters.value }
  newFilters[field] = field === 'search' ? '' : null
  handleFilterUpdate(newFilters)
}

function getCoordinatorName(uid) {
  const coordinator = coordinators.value.find(c => c.uid === uid)
  return coordinator ? (coordinator.displayName || coordinator.email.split('@')[0]) : uid
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

/* Mobile header */
.mobile-header {
  position: sticky;
  top: 0;
  z-index: 10;
  background: white;
  border-bottom: 1px solid rgba(0, 0, 0, 0.12);
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.08);
}

/* Mobile filter summary */
.mobile-filter-summary {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
}

/* Mobile container */
@media (max-width: 600px) {
  .comms-dashboard-container.pa-0 {
    padding: 0 !important;
  }
  
  .comms-dashboard-container.pa-0 > * {
    margin-left: 0 !important;
    margin-right: 0 !important;
  }
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