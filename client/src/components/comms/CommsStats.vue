// client/src/components/comms/CommsStats.vue
<!-- Main orchestrator component - Modularized version (~80 lines) -->
<!-- Dependencies: CommsStatsMetrics, CommsStatsDistributions, CommsStatsAdditional -->
<!-- Props: analytics (Object), showDistributions (Boolean) -->
<!-- Purpose: Displays project analytics in a modular dashboard format -->
<template>
  <div>
    <!-- Main Metrics Component -->
    <CommsStatsMetrics
      :analytics="analytics"
      class="mb-4"
    />

    <!-- Status and Priority Distribution Component -->
    <CommsStatsDistributions
      v-if="showDistributions"
      :status-breakdown="analytics?.statusBreakdown"
      :priority-breakdown="analytics?.priorityBreakdown"
      class="mb-4"
    />

    <!-- Additional Metrics Component -->
    <CommsStatsAdditional
      :total-coordinators="analytics?.totalCoordinators"
      :total-files="analytics?.totalFiles"
      :total-messages="analytics?.totalMessages"
    />
  </div>
</template>

<script setup>
import { watch } from 'vue'
// Child Components
import CommsStatsMetrics from './stats/CommsStatsMetrics.vue'
import CommsStatsDistributions from './stats/CommsStatsDistributions.vue'
import CommsStatsAdditional from './stats/CommsStatsAdditional.vue'

// Debug incoming analytics
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

// Debug analytics prop
watch(() => props.analytics, (newAnalytics) => {
  }, { immediate: true, deep: true })
</script>