<!-- client/src/components/comms/CommsStats.vue -->
<template>
  <div>
    <!-- Main Metrics -->
    <v-row>
      <v-col cols="12" sm="6" md="3">
        <v-card class="text-center">
          <v-card-text>
            <p class="text-overline text-medium-emphasis mb-1">
              Total Projects
            </p>
            <p class="text-h4 font-weight-bold">
              {{ analytics?.metrics?.total || 0 }}
              <v-icon 
                size="small"
                color="primary"
                class="ml-1"
              >
                mdi-folder-multiple
              </v-icon>
            </p>
          </v-card-text>
        </v-card>
      </v-col>

      <v-col cols="12" sm="6" md="3">
        <v-card class="text-center">
          <v-card-text>
            <p class="text-overline text-medium-emphasis mb-1">
              Active Projects
            </p>
            <p class="text-h4 font-weight-bold">
              {{ analytics?.metrics?.active || 0 }}
              <v-icon 
                size="small"
                color="warning"
                class="ml-1"
              >
                mdi-clock-outline
              </v-icon>
            </p>
          </v-card-text>
        </v-card>
      </v-col>

      <v-col cols="12" sm="6" md="3">
        <v-card class="text-center">
          <v-card-text>
            <p class="text-overline text-medium-emphasis mb-1">
              Completion Rate
            </p>
            <p class="text-h4 font-weight-bold">
              {{ analytics?.completionRate || 0 }}%
              <v-icon 
                size="small"
                color="success"
                class="ml-1"
              >
                mdi-check-circle
              </v-icon>
            </p>
          </v-card-text>
        </v-card>
      </v-col>

      <v-col cols="12" sm="6" md="3">
        <v-card class="text-center">
          <v-card-text>
            <p class="text-overline text-medium-emphasis mb-1">
              Avg. Completion
            </p>
            <p class="text-h4 font-weight-bold">
              {{ analytics?.avgCompletionTime || 0 }}
              <span class="text-body-2 text-medium-emphasis">days</span>
              <v-icon 
                size="small"
                :color="getCompletionTimeColor(analytics?.avgCompletionTime)"
                class="ml-1"
              >
                mdi-timer-sand
              </v-icon>
            </p>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>

    <!-- Status and Priority Distribution -->
    <v-row class="mt-4" v-if="showDistributions">
      <v-col cols="12" md="6">
        <v-card>
          <v-card-title class="text-h6">
            Projects by Status
          </v-card-title>
          <v-card-text>
            <v-row no-gutters>
              <v-col 
                v-for="(count, status) in analytics?.statusBreakdown" 
                :key="status"
                cols="4"
                class="text-center"
              >
                <v-avatar
                  :color="getStatusColor(status)"
                  size="56"
                  class="mb-2"
                >
                  <span class="text-h6 font-weight-bold">{{ count }}</span>
                </v-avatar>
                <p class="text-caption text-medium-emphasis mt-2 mb-0">
                  {{ formatStatus(status) }}
                </p>
              </v-col>
            </v-row>
          </v-card-text>
        </v-card>
      </v-col>

      <v-col cols="12" md="6">
        <v-card>
          <v-card-title class="text-h6">
            Priority Distribution
          </v-card-title>
          <v-card-text>
            <v-row no-gutters>
              <v-col 
                v-for="priority in ['high', 'medium', 'low']" 
                :key="priority"
                cols="4"
                class="text-center"
              >
                <v-avatar
                  :color="getPriorityColor(priority)"
                  size="56"
                  class="mb-2"
                >
                  <span class="text-h6 font-weight-bold">{{ analytics?.priorityBreakdown?.[priority] || 0 }}</span>
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
              {{ analytics?.totalCoordinators || 0 }}
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
      statusBreakdown: {},
      priorityBreakdown: {},
      totalCoordinators: 0,
      totalFiles: 0,
      totalMessages: 0
    })
  },
  showDistributions: {
    type: Boolean,
    default: true
  }
})

// Methods
const getStatusColor = (status) => {
  const colors = {
    not_started: 'grey',
    planning: 'blue',
    in_progress: 'amber',
    review: 'orange',
    completed: 'success'
  }
  return colors[status] || 'grey'
}

const getPriorityColor = (priority) => {
  const colors = {
    high: 'red',
    medium: 'amber',
    low: 'green'
  }
  return colors[priority] || 'grey'
}

const getCompletionTimeColor = (days) => {
  if (!days) return 'grey'
  if (days <= 7) return 'success'
  if (days <= 14) return 'warning'
  return 'error'
}

const formatStatus = (status) => {
  return status
    .split('_')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ')
}
</script>