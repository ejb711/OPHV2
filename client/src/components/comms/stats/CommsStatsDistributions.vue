// client/src/components/comms/stats/CommsStatsDistributions.vue
<!-- Status and priority distribution component (~150 lines) -->
<!-- Dependencies: useCommsStatsHelpers composable -->
<!-- Props: statusBreakdown (Array), priorityBreakdown (Object) -->
<!-- Purpose: Displays project distributions by status and priority with visual indicators -->
<template>
  <v-row class="mt-4">
    <v-col cols="12" md="6">
      <v-card>
        <v-card-title class="text-h6">
          Projects by Status
        </v-card-title>
        <v-card-text>
          <v-row no-gutters>
            <v-col 
              v-for="item in statusBreakdown" 
              :key="item.status"
              cols="4"
              class="text-center"
            >
              <v-avatar
                :color="getStatusColor(item.status)"
                size="56"
                class="mb-2"
              >
                <span class="text-h6 font-weight-bold">{{ item.count }}</span>
              </v-avatar>
              <p class="text-caption text-medium-emphasis mt-2 mb-0">
                {{ formatStatus(item.status) }}
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
                <span class="text-h6 font-weight-bold">
                  {{ priorityBreakdown?.[priority] || 0 }}
                </span>
              </v-avatar>
              <p class="text-caption mt-2 mb-0">{{ priority.toUpperCase() }}</p>
            </v-col>
          </v-row>
        </v-card-text>
      </v-card>
    </v-col>
  </v-row>
</template>

<script setup>
import { useCommsStatsHelpers } from '@/composables/comms/useCommsStatsHelpers'

// Props
const props = defineProps({
  statusBreakdown: {
    type: Array,
    default: () => []
  },
  priorityBreakdown: {
    type: Object,
    default: () => ({})
  }
})

// Composable
const { getStatusColor, getPriorityColor, formatStatus } = useCommsStatsHelpers()
</script>