<!-- client/src/components/comms/CommsStats.vue -->
<template>
  <div>
    <!-- Main Stats Cards -->
    <v-row class="mb-4">
      <v-col cols="12" sm="6" md="3">
        <v-card class="stat-card">
          <v-card-text class="pb-2">
            <div class="d-flex align-center justify-space-between">
              <div>
                <p class="text-caption text-medium-emphasis mb-1">
                  Total Projects
                </p>
                <p class="text-h4 font-weight-bold">
                  {{ analytics?.metrics?.total || 0 }}
                </p>
              </div>
              <v-avatar :color="REGION_COLORS?.primary || 'primary'" variant="tonal">
                <v-icon>mdi-folder-multiple</v-icon>
              </v-avatar>
            </div>
          </v-card-text>
        </v-card>
      </v-col>

      <v-col cols="12" sm="6" md="3">
        <v-card class="stat-card">
          <v-card-text class="pb-2">
            <div class="d-flex align-center justify-space-between">
              <div>
                <p class="text-caption text-medium-emphasis mb-1">
                  Active Projects
                </p>
                <p class="text-h4 font-weight-bold">
                  {{ analytics?.metrics?.active || 0 }}
                </p>
              </div>
              <v-avatar color="amber" variant="tonal">
                <v-icon>mdi-progress-clock</v-icon>
              </v-avatar>
            </div>
          </v-card-text>
        </v-card>
      </v-col>

      <v-col cols="12" sm="6" md="3">
        <v-card class="stat-card">
          <v-card-text class="pb-2">
            <div class="d-flex align-center justify-space-between">
              <div>
                <p class="text-caption text-medium-emphasis mb-1">
                  Completion Rate
                </p>
                <p class="text-h4 font-weight-bold">
                  {{ analytics?.completionRate || 0 }}%
                </p>
              </div>
              <v-avatar color="green" variant="tonal">
                <v-icon>mdi-check-circle</v-icon>
              </v-avatar>
            </div>
          </v-card-text>
        </v-card>
      </v-col>

      <v-col cols="12" sm="6" md="3">
        <v-card class="stat-card">
          <v-card-text class="pb-2">
            <div class="d-flex align-center justify-space-between">
              <div>
                <p class="text-caption text-medium-emphasis mb-1">
                  Avg. Completion
                </p>
                <p class="text-h4 font-weight-bold">
                  {{ analytics?.avgCompletionTime || 0 }}
                  <span class="text-caption">days</span>
                </p>
              </div>
              <v-avatar color="blue" variant="tonal">
                <v-icon>mdi-timer-sand</v-icon>
              </v-avatar>
            </div>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>

    <!-- Secondary Stats -->
    <v-row class="mb-4">
      <v-col cols="12" md="6">
        <v-card>
          <v-card-title class="text-subtitle-1">
            Projects by Status
          </v-card-title>
          <v-card-text>
            <div v-if="!analytics?.statusBreakdown || analytics.statusBreakdown.length === 0" 
                 class="text-center py-4 text-medium-emphasis">
              No project data available
            </div>
            <div v-else>
              <div v-for="item in analytics.statusBreakdown" 
                   :key="item?.status || 'unknown'" 
                   class="mb-3">
                <div class="d-flex justify-space-between align-center mb-1">
                  <span class="text-body-2">{{ formatStatus(item?.status) }}</span>
                  <span class="text-caption">{{ item?.count || 0 }}</span>
                </div>
                <v-progress-linear
                  :model-value="item?.percentage || 0"
                  :color="getStatusColor(item?.status)"
                  height="6"
                  rounded
                />
              </div>
            </div>
          </v-card-text>
        </v-card>
      </v-col>

      <v-col cols="12" md="6">
        <v-card>
          <v-card-title class="text-subtitle-1">
            Priority Distribution
          </v-card-title>
          <v-card-text>
            <v-row>
              <v-col v-for="priority in ['high', 'medium', 'low']" 
                     :key="priority" 
                     cols="4" 
                     class="text-center">
                <v-avatar :color="getPriorityColor(priority)" size="64">
                  <span class="text-h6 font-weight-bold">{{ analytics?.priorityDistribution?.[priority] || 0 }}</span>
                </v-avatar>
                <p class="text-caption mt-2 mb-0">{{ priority.toUpperCase() }}</p>
              </v-col>
            </v-row>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>

    <!-- Additional Metrics -->
    <v-row>
      <v-col cols="12" sm="4">
        <v-card class="text-center">
          <v-card-text>
            <v-icon size="48" color="primary" class="mb-2">
              mdi-account-group
            </v-icon>
            <p class="text-h5 font-weight-bold mb-1">
              {{ analytics?.activeCoordinators?.size || 0 }}
            </p>
            <p class="text-caption text-medium-emphasis">
              Active Coordinators
            </p>
          </v-card-text>
        </v-card>
      </v-col>

      <v-col cols="12" sm="4">
        <v-card class="text-center">
          <v-card-text>
            <v-icon size="48" color="primary" class="mb-2">
              mdi-file-multiple
            </v-icon>
            <p class="text-h5 font-weight-bold mb-1">
              {{ analytics?.totalFiles || 0 }}
            </p>
            <p class="text-caption text-medium-emphasis">
              Total Files
            </p>
          </v-card-text>
        </v-card>
      </v-col>

      <v-col cols="12" sm="4">
        <v-card class="text-center">
          <v-card-text>
            <v-icon size="48" color="primary" class="mb-2">
              mdi-message-text
            </v-icon>
            <p class="text-h5 font-weight-bold mb-1">
              {{ analytics?.totalMessages || 0 }}
            </p>
            <p class="text-caption text-medium-emphasis">
              Total Messages
            </p>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { LOUISIANA_REGIONS, REGION_COLORS } from '@/config/louisiana-regions'

// Props
const props = defineProps({
  analytics: {
    type: Object,
    default: () => ({
      metrics: {
        total: 0,
        active: 0,
        completed: 0,
        pending: 0
      },
      completionRate: 0,
      avgCompletionTime: 0,
      statusBreakdown: [],
      priorityDistribution: {
        high: 0,
        medium: 0,
        low: 0
      },
      activeCoordinators: new Set(),
      totalFiles: 0,
      totalMessages: 0
    })
  }
})

// Format status for display
const formatStatus = (status) => {
  if (!status) return 'Unknown'
  return status.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())
}

// Get color for status
const getStatusColor = (status) => {
  if (!status) return 'grey'
  const colors = {
    not_started: 'grey',
    planning: 'blue',
    in_progress: 'amber',
    review: 'orange',
    pending_approval: 'deep-orange',
    completed: 'green'
  }
  return colors[status] || 'grey'
}

// Get color for priority
const getPriorityColor = (priority) => {
  if (!priority) return 'grey'
  const colors = {
    high: 'red',
    medium: 'orange',
    low: 'green'
  }
  return colors[priority] || 'grey'
}
</script>

<style scoped>
.stat-card {
  transition: all 0.3s ease;
  cursor: default;
}

.stat-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}
</style>