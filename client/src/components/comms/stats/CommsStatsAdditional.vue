// client/src/components/comms/stats/CommsStatsAdditional.vue
<!-- Additional metrics component (~100 lines) -->
<!-- Dependencies: None -->
<!-- Props: totalCoordinators, totalFiles, totalMessages (all Numbers) -->
<!-- Purpose: Displays additional project metrics (coordinators, files, messages) -->
<template>
  <v-row>
    <v-col cols="12" sm="4">
      <v-card class="text-center">
        <v-card-text>
          <v-icon size="48" color="primary" class="mb-2">
            mdi-account-group
          </v-icon>
          <p class="text-h5 font-weight-bold mb-1">
            {{ totalCoordinators || 0 }}
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
            {{ totalFiles || 0 }}
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
            {{ totalMessages || 0 }}
          </p>
          <p class="text-caption text-medium-emphasis">
            Total Messages
          </p>
        </v-card-text>
      </v-card>
    </v-col>
  </v-row>
</template>

<script setup>
import { watch } from 'vue'

// Props
const props = defineProps({
  totalCoordinators: {
    type: Number,
    default: 0
  },
  totalFiles: {
    type: Number,
    default: 0
  },
  totalMessages: {
    type: Number,
    default: 0
  }
})

// Debug props
watch(() => props, (newProps) => {
  }, { immediate: true, deep: true })
</script>