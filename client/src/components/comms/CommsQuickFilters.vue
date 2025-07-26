<!-- Quick Filters Bar Component -->
<template>
  <v-card-text class="pa-3 border-b">
    <div class="d-flex align-center">
      <span class="text-body-2 text-grey-darken-1 mr-3">
        Quick Filters:
      </span>
      <div class="d-flex flex-wrap gap-2 flex-grow-1">
        <v-chip
          v-for="filter in quickFilters"
          :key="filter.id"
          :color="isFilterActive(filter) ? 'primary' : undefined"
          :variant="isFilterActive(filter) ? 'flat' : 'outlined'"
          size="small"
          @click="toggleQuickFilter(filter)"
        >
          {{ filter.label }}
        </v-chip>
      </div>
      
      <!-- Advanced Search Button -->
      <CommsSearch
        @search="handleAdvancedSearch"
        @filter="handleAdvancedFilter"
        class="ml-2"
      />
    </div>
  </v-card-text>
</template>

<script setup>
import { ref, watch } from 'vue'
import { useProjectFilters } from '@/composables/comms/useProjectFilters'
import CommsSearch from './CommsSearch.vue'

// Props
const props = defineProps({
  currentFilters: {
    type: Object,
    default: () => ({})
  }
})

// Emits
const emit = defineEmits(['toggle-filter', 'advanced-search', 'advanced-filter'])

// Composables
const { quickFilters } = useProjectFilters()

// Methods
function toggleQuickFilter(filter) {
  emit('toggle-filter', filter)
}

function handleAdvancedSearch(searchParams) {
  emit('advanced-search', searchParams)
}

function handleAdvancedFilter(filterParams) {
  emit('advanced-filter', filterParams)
}

function isFilterActive(filter) {
  if (filter.field === 'status') {
    return props.currentFilters.status === filter.value
  } else if (filter.field === 'priority') {
    return props.currentFilters.priority === filter.value
  }
  return false
}
</script>

<style scoped>
.border-b {
  border-bottom: 1px solid rgba(0, 0, 0, 0.12);
}

.v-chip-group {
  gap: 8px;
}

/* Responsive adjustments */
@media (max-width: 599px) {
  .d-flex {
    flex-wrap: wrap;
  }
}
</style>