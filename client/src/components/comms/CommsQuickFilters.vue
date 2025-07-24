<!-- Quick Filters Bar Component -->
<template>
  <v-card-text class="pa-3 border-b">
    <div class="d-flex align-center">
      <span class="text-body-2 text-grey-darken-1 mr-3">
        Quick Filters:
      </span>
      <v-chip-group
        v-model="localActiveFilters"
        multiple
        color="primary"
        class="flex-grow-1"
      >
        <v-chip
          v-for="filter in quickFilters"
          :key="filter.id"
          :value="filter.id"
          size="small"
          variant="outlined"
          @click="toggleQuickFilter(filter)"
        >
          {{ filter.label }}
        </v-chip>
      </v-chip-group>
      
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
  activeFilters: {
    type: Array,
    default: () => []
  }
})

// Emits
const emit = defineEmits(['update:activeFilters', 'toggle-filter', 'advanced-search', 'advanced-filter'])

// Composables
const { quickFilters } = useProjectFilters()

// Local state
const localActiveFilters = ref([...props.activeFilters])

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

// Watch for external changes
watch(() => props.activeFilters, (newVal) => {
  localActiveFilters.value = [...newVal]
})

// Update parent when local changes
watch(localActiveFilters, (newVal) => {
  emit('update:activeFilters', newVal)
})
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