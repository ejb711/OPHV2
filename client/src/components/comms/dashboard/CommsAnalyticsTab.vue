<template>
  <v-expansion-panels v-if="hasViewAnalyticsPermission" class="mb-4">
    <v-expansion-panel>
      <v-expansion-panel-title>
        <v-icon class="mr-2">mdi-chart-line</v-icon>
        Analytics Dashboard
      </v-expansion-panel-title>
      <v-expansion-panel-text>
        <v-btn
          color="primary"
          variant="elevated"
          prepend-icon="mdi-open-in-new"
          @click="openAnalyticsWindow"
        >
          Open Analytics Dashboard
        </v-btn>
        <p class="text-caption mt-2 text-grey">
          View detailed analytics, statistics, and export options in a separate window
        </p>
      </v-expansion-panel-text>
    </v-expansion-panel>
  </v-expansion-panels>
</template>

<script setup>
import { computed } from 'vue'
import { useAuthStore } from '@/stores/auth'

const authStore = useAuthStore()

const hasViewAnalyticsPermission = computed(() => {
  return authStore.hasPermission('view_analytics')
})

function openAnalyticsWindow() {
  emit('open-analytics')
}

const emit = defineEmits(['open-analytics'])
</script>