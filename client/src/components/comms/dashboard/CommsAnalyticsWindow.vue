<template>
  <v-dialog
    v-model="dialog"
    fullscreen
    transition="dialog-bottom-transition"
    :persistent="false"
  >
    <v-card class="d-flex flex-column analytics-card">
      <!-- Fixed Toolbar -->
      <v-toolbar color="primary" dark class="flex-grow-0">
        <v-btn icon @click="close">
          <v-icon>mdi-close</v-icon>
        </v-btn>
        <v-toolbar-title>Communications Analytics Dashboard</v-toolbar-title>
        <v-spacer />
        <v-btn icon @click="refresh">
          <v-icon>mdi-refresh</v-icon>
        </v-btn>
      </v-toolbar>

      <!-- Fixed Tabs -->
      <v-tabs 
        v-model="activeTab" 
        color="primary"
        class="flex-grow-0 border-b"
      >
        <v-tab value="overview">
          <v-icon class="mr-2">mdi-view-dashboard</v-icon>
          Overview
        </v-tab>
        <v-tab value="statistics">
          <v-icon class="mr-2">mdi-chart-box</v-icon>
          Statistics
        </v-tab>
        <v-tab value="coordinators">
          <v-icon class="mr-2">mdi-account-group</v-icon>
          Coordinators
        </v-tab>
        <v-tab value="regional">
          <v-icon class="mr-2">mdi-map-marker-radius</v-icon>
          Regional
        </v-tab>
        <v-tab value="exports">
          <v-icon class="mr-2">mdi-download</v-icon>
          Exports
        </v-tab>
      </v-tabs>

      <!-- Scrollable Tab Content -->
      <v-card-text class="flex-grow-1 pa-0 overflow-hidden">
        <v-window v-model="activeTab" class="h-100">
          <!-- Overview Tab -->
          <v-window-item value="overview" class="h-100">
            <div class="tab-content">
              <v-container fluid class="pa-4">
                <h2 class="text-h5 mb-4">Analytics Overview</h2>
                
                <!-- Date Range Filter -->
                <v-card class="mb-4" elevation="2">
                  <v-card-title class="text-subtitle-1">
                    <v-icon class="mr-2">mdi-calendar-range</v-icon>
                    Date Range Filter
                  </v-card-title>
                  <v-card-text>
                    <v-row>
                      <v-col cols="12" sm="6">
                        <v-text-field
                          :model-value="analytics?.dateRange?.value?.start"
                          label="Start Date"
                          type="date"
                          variant="outlined"
                          density="compact"
                          @update:model-value="handleStartDateChange"
                        />
                      </v-col>
                      <v-col cols="12" sm="6">
                        <v-text-field
                          :model-value="analytics?.dateRange?.value?.end"
                          label="End Date"
                          type="date"
                          variant="outlined"
                          density="compact"
                          @update:model-value="handleEndDateChange"
                        />
                      </v-col>
                    </v-row>
                  </v-card-text>
                </v-card>

                <!-- Key Metrics Summary -->
                <CommsStats 
                  :analytics="analyticsData"
                  :show-distributions="false"
                />
              </v-container>
            </div>
          </v-window-item>

          <!-- Statistics Tab -->
          <v-window-item value="statistics" class="h-100">
            <div class="tab-content">
              <v-container fluid class="pa-4">
                <h2 class="text-h5 mb-4">Detailed Statistics</h2>
                
                <!-- Full Stats Display -->
                <CommsStats 
                  :analytics="analyticsData"
                  :show-distributions="true"
                  class="mb-4"
                />

                <!-- Additional Charts -->
                <v-row>
                  <v-col cols="12">
                    <v-card>
                      <v-card-title>
                        <v-icon class="mr-2">mdi-chart-timeline-variant</v-icon>
                        Project Timeline Analysis
                      </v-card-title>
                      <v-card-text style="min-height: 300px;">
                        <p class="text-body-2 text-grey">
                          Timeline visualization can be added here
                        </p>
                      </v-card-text>
                    </v-card>
                  </v-col>
                </v-row>
              </v-container>
            </div>
          </v-window-item>

          <!-- Coordinators Tab -->
          <v-window-item value="coordinators" class="h-100">
            <div class="tab-content">
              <v-container fluid class="pa-4">
                <h2 class="text-h5 mb-4">Coordinator Workload Analysis</h2>
                <CoordinatorWorkload 
                  :projects="projects" 
                  class="coordinator-workload-card"
                />
              </v-container>
            </div>
          </v-window-item>

          <!-- Regional Tab -->
          <v-window-item value="regional" class="h-100">
            <div class="tab-content">
              <v-container fluid class="pa-4">
                <h2 class="text-h5 mb-4">Regional Distribution</h2>
                <CommsRegionalDistribution 
                  :regional-distribution="analyticsData.regionalDistribution"
                  class="regional-card"
                />
              </v-container>
            </div>
          </v-window-item>

          <!-- Exports Tab -->
          <v-window-item value="exports" class="h-100">
            <div class="tab-content">
              <v-container fluid class="pa-4">
                <h2 class="text-h5 mb-4">Export Analytics Data</h2>
                
                <v-row>
                  <v-col cols="12" md="6">
                    <v-card>
                      <v-card-title>
                        <v-icon class="mr-2">mdi-file-excel</v-icon>
                        CSV Export
                      </v-card-title>
                      <v-card-text>
                        <p class="mb-4">Export analytics data to CSV format for use in Excel or other spreadsheet applications.</p>
                        <v-btn
                          color="success"
                          variant="elevated"
                          block
                          :loading="exporting"
                          :disabled="visibleProjects.length === 0"
                          @click="handleExportCSV"
                        >
                          <v-icon start>mdi-download</v-icon>
                          Export to CSV
                        </v-btn>
                      </v-card-text>
                    </v-card>
                  </v-col>

                  <v-col cols="12" md="6">
                    <v-card>
                      <v-card-title>
                        <v-icon class="mr-2">mdi-file-pdf-box</v-icon>
                        PDF Report
                      </v-card-title>
                      <v-card-text>
                        <p class="mb-4">Generate a comprehensive PDF report with charts and detailed analytics.</p>
                        <v-btn
                          color="error"
                          variant="elevated"
                          block
                          :loading="exporting"
                          :disabled="visibleProjects.length === 0"
                          @click="handleExportPDF"
                        >
                          <v-icon start>mdi-download</v-icon>
                          Export to PDF
                        </v-btn>
                      </v-card-text>
                    </v-card>
                  </v-col>
                </v-row>

                <v-alert type="info" variant="tonal" class="mt-4">
                  <v-icon>mdi-information</v-icon>
                  Exports include data from {{ visibleProjects.length }} projects based on current filters and date range.
                </v-alert>
              </v-container>
            </div>
          </v-window-item>
        </v-window>
      </v-card-text>
    </v-card>
  </v-dialog>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useCommsDashboard } from '@/composables/comms/useCommsDashboard'
import CommsStats from '../CommsStats.vue'
import CoordinatorWorkload from '../coordinators/CoordinatorWorkload.vue'
import CommsRegionalDistribution from './CommsRegionalDistribution.vue'

const props = defineProps({
  modelValue: {
    type: Boolean,
    default: false
  }
})

const emit = defineEmits(['update:modelValue'])

const dialog = computed({
  get: () => props.modelValue,
  set: (value) => emit('update:modelValue', value)
})

// State
const activeTab = ref('overview')

// Use the dashboard composable for analytics logic
const {
  projects,
  analytics,
  analyticsData,
  visibleProjects,
  exporting,
  handleExportCSV,
  handleExportPDF,
  updateDateRange
} = useCommsDashboard()

function close() {
  dialog.value = false
}

function refresh() {
  // Trigger analytics refresh
  if (analytics.value?.refresh) {
    analytics.value.refresh()
  }
}

function handleStartDateChange(value) {
  updateDateRange({
    start: value,
    end: analytics.value?.dateRange?.value?.end
  })
}

function handleEndDateChange(value) {
  updateDateRange({
    start: analytics.value?.dateRange?.value?.start,
    end: value
  })
}
</script>

<style scoped>
/* Make card fill dialog and use flexbox */
.analytics-card {
  height: 100% !important;
  display: flex !important;
  flex-direction: column !important;
  overflow: hidden !important;
}

/* Tab content wrapper with scrolling */
.tab-content {
  height: 100%;
  overflow-y: auto;
  overflow-x: hidden;
}

/* Custom scrollbar */
.tab-content::-webkit-scrollbar {
  width: 8px;
}

.tab-content::-webkit-scrollbar-track {
  background: #f1f1f1;
}

.tab-content::-webkit-scrollbar-thumb {
  background: #888;
  border-radius: 4px;
}

.tab-content::-webkit-scrollbar-thumb:hover {
  background: #555;
}

/* Responsive container */
.v-container {
  max-width: 1400px;
  margin: 0 auto;
}

/* Card styling for better visibility */
.coordinator-workload-card,
.regional-card {
  min-height: 400px;
}

/* Responsive adjustments */
@media (max-width: 960px) {
  .v-container {
    max-width: 100%;
  }
  
  .v-tabs {
    overflow-x: auto;
  }
}

/* Tab styling */
:deep(.v-tab) {
  text-transform: none;
  letter-spacing: normal;
  min-width: 120px;
}

/* Ensure proper card text flex */
:deep(.v-card-text) {
  display: flex !important;
  flex-direction: column !important;
}

/* Border utility */
.border-b {
  border-bottom: 1px solid rgba(0, 0, 0, 0.12);
}
</style>