// client/src/components/comms/stats/CommsStatsMetrics.vue
<!-- Main metrics cards component (~120 lines) -->
<!-- Dependencies: useCommsStatsHelpers composable -->
<!-- Props: analytics (Object) -->
<!-- Purpose: Displays main project metrics (total, active, completion rate, avg time) -->
<template>
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
</template>

<script setup>
import { useCommsStatsHelpers } from '@/composables/comms/useCommsStatsHelpers'
import { watch } from 'vue'

// Props
const props = defineProps({
  analytics: {
    type: Object,
    default: () => ({})
  }
})

// Debug analytics data
watch(() => props.analytics, (newAnalytics) => {
  }, { immediate: true, deep: true })

// Composable
const { getCompletionTimeColor } = useCommsStatsHelpers()
</script>