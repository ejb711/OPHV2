<template>
  <v-dialog
    v-model="dialog"
    fullscreen
    transition="dialog-bottom-transition"
    :persistent="false"
  >
    <v-card>
      <v-toolbar color="primary" dark>
        <v-btn icon @click="close">
          <v-icon>mdi-close</v-icon>
        </v-btn>
        <v-toolbar-title>Communications Analytics Dashboard</v-toolbar-title>
        <v-spacer />
        <v-btn icon @click="refresh">
          <v-icon>mdi-refresh</v-icon>
        </v-btn>
      </v-toolbar>

      <v-container fluid class="pa-4">
        <!-- Analytics Date Range and Export Controls -->
        <CommsDashboardToolbar
          :analytics="analytics"
          :exporting="exporting"
          :visible-projects-count="visibleProjects.length"
          @export-csv="handleExportCSV"
          @export-pdf="handleExportPDF"
          @update-date-range="updateDateRange"
          class="mb-6"
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

        <!-- Additional Analytics Content -->
        <v-row>
          <v-col cols="12">
            <v-card>
              <v-card-title>
                <v-icon class="mr-2">mdi-chart-timeline-variant</v-icon>
                Project Timeline Analysis
              </v-card-title>
              <v-card-text>
                <p class="text-body-2 text-grey">
                  Additional analytics visualizations can be added here
                </p>
              </v-card-text>
            </v-card>
          </v-col>
        </v-row>
      </v-container>
    </v-card>
  </v-dialog>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useCommsDashboard } from '@/composables/comms/useCommsDashboard'
import CommsDashboardToolbar from './CommsDashboardToolbar.vue'
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
  analytics.refresh()
}
</script>

<style scoped>
.v-container {
  max-width: 1600px;
  margin: 0 auto;
}
</style>