<template>
  <v-row>
    <!-- Total Projects -->
    <v-col cols="12" sm="6" md="3">
      <v-card>
        <v-card-text class="pb-2">
          <div class="d-flex align-center justify-space-between">
            <div>
              <p class="text-caption text-medium-emphasis mb-1">
                Total Projects
              </p>
              <p class="text-h4 font-weight-bold">
                {{ stats.total || 0 }}
              </p>
            </div>
            <v-avatar color="primary" variant="tonal">
              <v-icon>mdi-folder-multiple</v-icon>
            </v-avatar>
          </div>
        </v-card-text>
      </v-card>
    </v-col>

    <!-- Active Projects -->
    <v-col cols="12" sm="6" md="3">
      <v-card>
        <v-card-text class="pb-2">
          <div class="d-flex align-center justify-space-between">
            <div>
              <p class="text-caption text-medium-emphasis mb-1">
                Active Projects
              </p>
              <p class="text-h4 font-weight-bold">
                {{ activeProjects }}
              </p>
            </div>
            <v-avatar color="amber" variant="tonal">
              <v-icon>mdi-progress-clock</v-icon>
            </v-avatar>
          </div>
        </v-card-text>
      </v-card>
    </v-col>

    <!-- Pending Approval -->
    <v-col cols="12" sm="6" md="3">
      <v-card>
        <v-card-text class="pb-2">
          <div class="d-flex align-center justify-space-between">
            <div>
              <p class="text-caption text-medium-emphasis mb-1">
                Pending Approval
              </p>
              <p class="text-h4 font-weight-bold">
                {{ pendingProjects }}
              </p>
            </div>
            <v-avatar color="orange" variant="tonal">
              <v-icon>mdi-clock-alert</v-icon>
            </v-avatar>
          </div>
        </v-card-text>
      </v-card>
    </v-col>

    <!-- Completed This Month -->
    <v-col cols="12" sm="6" md="3">
      <v-card>
        <v-card-text class="pb-2">
          <div class="d-flex align-center justify-space-between">
            <div>
              <p class="text-caption text-medium-emphasis mb-1">
                Completed
              </p>
              <p class="text-h4 font-weight-bold">
                {{ completedProjects }}
              </p>
            </div>
            <v-avatar color="green" variant="tonal">
              <v-icon>mdi-check-circle</v-icon>
            </v-avatar>
          </div>
        </v-card-text>
      </v-card>
    </v-col>
  </v-row>
</template>

<script setup>
import { computed } from 'vue'

// Props
const props = defineProps({
  stats: {
    type: Object,
    default: () => ({
      total: 0,
      byStatus: {},
      byPriority: {},
      byRegion: {}
    })
  }
})

// Computed
const activeProjects = computed(() => {
  const activeStatuses = ['in_progress', 'planning', 'review']
  return activeStatuses.reduce((sum, status) => {
    return sum + (props.stats.byStatus[status] || 0)
  }, 0)
})

const pendingProjects = computed(() => {
  return props.stats.byStatus['pending_approval'] || 0
})

const completedProjects = computed(() => {
  return props.stats.byStatus['completed'] || 0
})
</script>