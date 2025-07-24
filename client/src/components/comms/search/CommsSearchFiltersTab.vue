<!-- client/src/components/comms/search/CommsSearchFiltersTab.vue -->
<template>
  <div>
    <SavedFilters
      @load="$emit('load', $event)"
      @delete="$emit('delete', $event)"
      class="mb-4"
    />

    <PresetFilters
      @apply="$emit('apply', $event)"
      class="mb-4"
    />

    <v-btn
      color="primary"
      variant="outlined"
      block
      :disabled="!hasActiveFilters"
      @click="$emit('save')"
    >
      <v-icon start>mdi-content-save</v-icon>
      Save Current Filters
    </v-btn>
  </div>
</template>

<script setup>
import SavedFilters from './SavedFilters.vue'
import PresetFilters from './PresetFilters.vue'

// Props
defineProps({
  hasActiveFilters: {
    type: Boolean,
    default: false
  }
})

// Emits
defineEmits(['load', 'delete', 'apply', 'save'])
</script>