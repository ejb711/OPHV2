<!-- client/src/components/comms/dashboard/CommsDashboardHeader.vue -->
<!-- Dashboard header component (~50 lines) -->
<!-- Purpose: Display title, description, and main action button -->
<!-- Events: create-project -->
<template>
  <div class="d-flex align-center justify-space-between mb-6">
    <div>
      <h1 class="text-h4 font-weight-bold text-grey-darken-3 mb-2">
        Communications Dashboard
      </h1>
      <p class="text-body-1 text-grey-darken-1">
        Manage communications projects across Louisiana's 9 health regions
      </p>
    </div>
    <v-btn
      color="primary"
      variant="elevated"
      prepend-icon="mdi-folder-plus"
      :disabled="!canCreateProjects"
      @click="$emit('create-project')"
    >
      New Project
    </v-btn>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { usePermissions } from '@/composables/usePermissions'

// Emit
defineEmits(['create-project'])

// Permissions
const { hasPermission } = usePermissions()
const canCreateProjects = computed(() => 
  hasPermission('create_comms_projects')
)
</script>

<style scoped>
h1 {
  font-family: 'ITC Franklin Gothic Demi', 'Arial Black', sans-serif;
  letter-spacing: -0.02em;
}

.v-btn {
  text-transform: none;
  font-weight: 500;
  letter-spacing: 0.02em;
}

@media (max-width: 599px) {
  h1 {
    font-size: 1.5rem !important;
  }
}
</style>