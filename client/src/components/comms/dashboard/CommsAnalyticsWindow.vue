<template>
  <v-dialog
    v-model="dialog"
    :max-width="1200"
    transition="dialog-transition"
    :persistent="false"
    :fullscreen="$vuetify.display.smAndDown"
  >
    <v-card class="d-flex flex-column analytics-card" :height="$vuetify.display.smAndDown ? '100%' : '90vh'">
      <!-- Fixed Toolbar -->
      <v-toolbar color="primary" dark class="flex-grow-0" density="compact">
        <v-btn icon size="small" @click="close">
          <v-icon size="small">mdi-close</v-icon>
        </v-btn>
        <v-toolbar-title class="text-body-1">Communications Analytics Dashboard</v-toolbar-title>
        <v-spacer />
        <v-btn icon size="small" @click="refresh">
          <v-icon size="small">mdi-refresh</v-icon>
        </v-btn>
      </v-toolbar>

      <!-- Fixed Tabs -->
      <v-tabs
        v-model="activeTab"
        color="primary"
        class="flex-grow-0 border-b tabs-container"
        density="compact"
        :show-arrows="$vuetify.display.smAndDown"
        hide-slider
      >
        <v-tab value="overview">
          <v-icon size="small" class="mr-1">mdi-view-dashboard</v-icon>
          <span class="text-caption">Overview</span>
        </v-tab>
        <v-tab value="statistics">
          <v-icon size="small" class="mr-1">mdi-chart-box</v-icon>
          <span class="text-caption">Statistics</span>
        </v-tab>
        <v-tab value="coordinators">
          <v-icon size="small" class="mr-1">mdi-account-group</v-icon>
          <span class="text-caption">Coordinators</span>
        </v-tab>
        <v-tab value="regional">
          <v-icon size="small" class="mr-1">mdi-map-marker-radius</v-icon>
          <span class="text-caption">Regional</span>
        </v-tab>
        <v-tab value="exports">
          <v-icon size="small" class="mr-1">mdi-download</v-icon>
          <span class="text-caption">Exports</span>
        </v-tab>
      </v-tabs>

      <!-- Scrollable Tab Content -->
      <v-card-text class="flex-grow-1 pa-0 overflow-hidden d-flex flex-column">
        <v-window v-model="activeTab" class="flex-grow-1 overflow-hidden">
          <!-- Overview Tab -->
          <v-window-item value="overview" class="h-100 overflow-hidden">
            <div class="tab-content h-100">
              <v-container fluid class="pa-3">
                <h2 class="text-h6 mb-2">Analytics Overview</h2>

                <!-- Date Range Filter -->
                <v-card class="mb-3" elevation="1" density="compact">
                  <v-card-title class="text-subtitle-2 pa-2">
                    <v-icon size="small" class="mr-1">mdi-calendar-range</v-icon>
                    Date Range Filter
                  </v-card-title>
                  <v-card-text class="pa-2">
                    <v-row align="center">
                      <v-col cols="12" sm="5">
                        <v-text-field
                          v-model="localDateRange.start"
                          label="Start Date"
                          type="date"
                          variant="outlined"
                          density="compact"
                          clearable
                          @update:model-value="handleStartDateChange"
                        />
                      </v-col>
                      <v-col cols="12" sm="5">
                        <v-text-field
                          v-model="localDateRange.end"
                          label="End Date"
                          type="date"
                          variant="outlined"
                          density="compact"
                          clearable
                          @update:model-value="handleEndDateChange"
                        />
                      </v-col>
                      <v-col cols="12" sm="2">
                        <v-btn
                          size="small"
                          :variant="isAllTime ? 'elevated' : 'tonal'"
                          :color="isAllTime ? 'success' : 'primary'"
                          block
                          @click="selectAllDates"
                        >
                          <v-icon v-if="isAllTime" start size="small">mdi-check</v-icon>
                          All Time
                        </v-btn>
                      </v-col>
                    </v-row>
                    <v-alert
                      v-if="dateRangeMessage"
                      type="info"
                      variant="tonal"
                      density="compact"
                      class="mt-2 text-caption"
                      closable
                      @click:close="dateRangeMessage = ''"
                    >
                      {{ dateRangeMessage }}
                    </v-alert>
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
          <v-window-item value="statistics" class="h-100 overflow-hidden">
            <div class="tab-content h-100">
              <v-container fluid class="pa-3">
                <h2 class="text-h6 mb-2">Detailed Statistics</h2>

                <!-- Full Stats Display -->
                <CommsStats
                  :analytics="analyticsData"
                  :show-distributions="true"
                  class="mb-3"
                />

                <!-- Additional Charts -->
                <v-row>
                  <v-col cols="12">
                    <v-card density="compact">
                      <v-card-title class="text-body-1 pa-3">
                        <v-icon size="small" class="mr-1">mdi-chart-timeline-variant</v-icon>
                        Project Timeline Analysis
                      </v-card-title>
                      <v-card-text style="min-height: 150px;" class="pa-3">
                        <p class="text-caption text-grey">
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
          <v-window-item value="coordinators" class="h-100 overflow-hidden">
            <div class="tab-content h-100">
              <v-container fluid class="pa-3">
                <h2 class="text-h6 mb-2">Coordinator Workload Analysis</h2>
                <CoordinatorWorkload
                  :projects="projects"
                  class="coordinator-workload-card"
                />
              </v-container>
            </div>
          </v-window-item>

          <!-- Regional Tab -->
          <v-window-item value="regional" class="h-100 overflow-hidden">
            <div class="tab-content h-100">
              <v-container fluid class="pa-3">
                <h2 class="text-h6 mb-2">Regional Distribution</h2>
                <CommsRegionalDistribution
                  :regional-distribution="analyticsData.regionalDistribution"
                  class="regional-card"
                />
              </v-container>
            </div>
          </v-window-item>

          <!-- Exports Tab -->
          <v-window-item value="exports" class="h-100 overflow-hidden">
            <div class="tab-content h-100">
              <v-container fluid class="pa-3">
                <h2 class="text-h6 mb-2">Export Analytics Data</h2>

                <v-row>
                  <v-col cols="12" md="6">
                    <v-card density="compact">
                      <v-card-title class="text-body-1 pa-3">
                        <v-icon size="small" class="mr-1">mdi-file-excel</v-icon>
                        CSV Export
                      </v-card-title>
                      <v-card-text class="pa-3">
                        <p class="text-caption mb-2">Export analytics data to CSV format.</p>
                        <v-btn
                          color="success"
                          variant="elevated"
                          block
                          size="small"
                          :loading="exporting"
                          :disabled="visibleProjects.length === 0"
                          @click="handleExportCSV"
                        >
                          <v-icon start size="small">mdi-download</v-icon>
                          Export to CSV
                        </v-btn>
                      </v-card-text>
                    </v-card>
                  </v-col>

                  <v-col cols="12" md="6">
                    <v-card density="compact">
                      <v-card-title class="text-body-1 pa-3">
                        <v-icon size="small" class="mr-1">mdi-file-pdf-box</v-icon>
                        PDF Report
                      </v-card-title>
                      <v-card-text class="pa-3">
                        <p class="text-caption mb-2">Generate a comprehensive PDF report.</p>
                        <v-btn
                          color="error"
                          variant="elevated"
                          block
                          size="small"
                          :loading="exporting"
                          :disabled="visibleProjects.length === 0"
                          @click="handleExportPDF"
                        >
                          <v-icon start size="small">mdi-download</v-icon>
                          Export to PDF
                        </v-btn>
                      </v-card-text>
                    </v-card>
                  </v-col>
                </v-row>

                <v-alert type="info" variant="tonal" class="mt-3" density="compact">
                  <v-icon size="small">mdi-information</v-icon>
                  <span class="text-caption">Exports include data from {{ visibleProjects.length }} projects based on current filters and date range.</span>
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
import { ref, computed, watch } from 'vue'
import CommsStats from '../CommsStats.vue'
import CoordinatorWorkload from '../coordinators/CoordinatorWorkload.vue'
import CommsRegionalDistribution from './CommsRegionalDistribution.vue'

const props = defineProps({
  modelValue: {
    type: Boolean,
    default: false
  },
  projects: {
    type: Array,
    default: () => []
  },
  analytics: {
    type: Object,
    default: null
  },
  analyticsData: {
    type: Object,
    required: true
  },
  visibleProjects: {
    type: Array,
    default: () => []
  },
  exporting: {
    type: Boolean,
    default: false
  }
})

const emit = defineEmits(['update:modelValue', 'export-csv', 'export-pdf', 'update-date-range'])

const dialog = computed({
  get: () => props.modelValue,
  set: (value) => emit('update:modelValue', value)
})

// State
const activeTab = ref('overview')
const dateRangeMessage = ref('')

// Use props instead of creating new instance
const projects = computed(() => {
  return props.projects
})
const analytics = computed(() => props.analytics)
const analyticsData = computed(() => props.analyticsData)
const visibleProjects = computed(() => props.visibleProjects)
const exporting = computed(() => props.exporting)

// Local date range state
const localDateRange = ref({
  start: null,
  end: null
})

// Check if showing all time
const isAllTime = computed(() => !localDateRange.value.start && !localDateRange.value.end)

// Initialize local date range from analytics when available
watch(() => analytics.value?.dateRange?.value, (newRange) => {
  if (newRange) {
    localDateRange.value = { ...newRange }
  }
}, { immediate: true })

// Debug analytics data
watch(() => analyticsData.value, (newData) => {
  // Analytics data changed
}, { immediate: true, deep: true })

// Debug projects prop
watch(() => props.projects, (newProjects) => {
  // Projects prop changed
}, { immediate: true, deep: true })

// Debug props
watch(() => props.analyticsData, (newData) => {
  // Analytics data prop changed
}, { immediate: true, deep: true })

function close() {
  dialog.value = false
}

function refresh() {
  // Trigger analytics refresh
  if (analytics.value && analytics.value.refresh) {
    analytics.value.refresh()
  }
}

function handleStartDateChange(value) {
  localDateRange.value.start = value
  dateRangeMessage.value = ''
  emit('update-date-range', {
    start: value,
    end: localDateRange.value.end
  })
}

function handleEndDateChange(value) {
  localDateRange.value.end = value
  dateRangeMessage.value = ''
  emit('update-date-range', {
    start: localDateRange.value.start,
    end: value
  })
}

function selectAllDates() {
  // Clear both dates to show all data
  localDateRange.value = { start: null, end: null }
  dateRangeMessage.value = 'Showing all data across all time periods'
  emit('update-date-range', { start: null, end: null })

  // Clear message after 3 seconds
  setTimeout(() => {
    dateRangeMessage.value = ''
  }, 3000)
}

function handleExportCSV() {
  emit('export-csv')
}

function handleExportPDF() {
  emit('export-pdf')
}
</script>

<style scoped>
/* Make card fill dialog and use flexbox */
.analytics-card {
  display: flex !important;
  flex-direction: column !important;
  overflow: hidden !important;
  position: relative;
}

/* Tab content wrapper with scrolling */
.tab-content {
  overflow-y: auto;
  overflow-x: hidden;
  position: relative;
  padding-bottom: 16px;
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
  max-width: 100%;
  padding: 16px;
}

/* Tab container styling */
.tabs-container {
  background-color: #fafafa;
  z-index: 2;
  flex-shrink: 0;
  min-height: 48px;
}

/* Card styling for better visibility */
.coordinator-workload-card,
.regional-card {
  min-height: 250px;
}

/* Responsive adjustments */
@media (max-width: 960px) {
  .v-container {
    max-width: 100%;
    padding: 12px;
  }

  .tabs-container {
    overflow-x: auto;
    -webkit-overflow-scrolling: touch;
  }

  .analytics-card {
    border-radius: 0;
  }
}

@media (max-width: 600px) {
  .v-container {
    padding: 8px;
  }

  :deep(.v-tab) {
    min-width: 90px;
    font-size: 0.75rem;
    padding: 0 8px;
  }
}

/* Tab styling */
:deep(.v-tab) {
  text-transform: none;
  letter-spacing: normal;
  min-width: 100px;
  min-height: 48px;
  padding: 0 12px;
  white-space: nowrap;
}

:deep(.v-tab__content) {
  display: flex;
  align-items: center;
  gap: 4px;
}

/* Ensure proper card text flex */
:deep(.v-card-text) {
  display: flex !important;
  flex-direction: column !important;
  position: relative;
}

/* Window styling */
:deep(.v-window) {
  height: 100%;
}

:deep(.v-window__container) {
  height: 100%;
}

:deep(.v-window-item) {
  height: 100%;
}

/* Border utility */
.border-b {
  border-bottom: 1px solid rgba(0, 0, 0, 0.12);
}

/* Height utility */
.h-100 {
  height: 100%;
}

/* Ensure dialog fills viewport on mobile */
@media (max-width: 600px) {
  :deep(.v-dialog--fullscreen > .v-overlay__content) {
    width: 100%;
    height: 100%;
    max-height: 100%;
    margin: 0;
    border-radius: 0;
  }
}
</style>