<!-- Communications Filters - Main Coordinator Component -->
<template>
  <v-card elevation="0" class="rounded-lg">
    <!-- Quick Filters Bar -->
    <CommsQuickFilters
      :current-filters="localFilters"
      @toggle-filter="toggleQuickFilter"
      @advanced-search="handleAdvancedSearch"
      @advanced-filter="handleAdvancedFilter"
    />

    <!-- Standard Filters -->
    <v-card-text class="pa-4">
      <CommsStandardFilters
        :filters="localFilters"
        :has-active-filters="hasActiveFilters"
        :active-filter-count="totalActiveFilters"
        @update:filters="updateFilters"
        @save-filters="saveCurrentFilters"
        @show-saved-filters="showSavedFilters = true"
        @clear-all="clearAllFilters"
      />

      <!-- Active Filters Summary -->
      <v-expand-transition>
        <div v-if="activeFilterSummary" class="mt-3">
          <v-chip
            size="small"
            closable
            class="mr-2 mb-1"
            @click:close="clearAllFilters"
          >
            <v-icon start size="small">mdi-filter</v-icon>
            {{ activeFilterSummary }}
          </v-chip>
        </div>
      </v-expand-transition>
    </v-card-text>

    <!-- Saved Filters Dialog -->
    <v-dialog v-model="showSavedFilters" max-width="600">
      <SavedFiltersDialog
        @load="loadSavedFilter"
        @close="showSavedFilters = false"
      />
    </v-dialog>
  </v-card>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useProjectFilters } from '@/composables/comms/useProjectFilters'
import { DEFAULT_FILTERS } from '@/config/commsFilterOptions'
import CommsQuickFilters from './CommsQuickFilters.vue'
import CommsStandardFilters from './CommsStandardFilters.vue'
import SavedFiltersDialog from './search/SavedFiltersDialog.vue'

// Props
const props = defineProps({
  filters: {
    type: Object,
    default: () => ({ ...DEFAULT_FILTERS })
  }
})

// Emits
const emit = defineEmits(['update:filters'])

// Composables
const { clearAllFilters: clearFilters } = useProjectFilters()

// Local state
const localFilters = ref({ ...props.filters })
const showSavedFilters = ref(false)
const hasAdvancedSearch = ref(false)

// Computed
const hasActiveFilters = computed(() => {
  return !!(
    localFilters.value.region ||
    localFilters.value.status ||
    localFilters.value.priority ||
    localFilters.value.coordinator ||
    localFilters.value.search
  )
})

const totalActiveFilters = computed(() => {
  let count = 0
  if (localFilters.value.region) count++
  if (localFilters.value.status) count++
  if (localFilters.value.priority) count++
  if (localFilters.value.coordinator) count++
  if (localFilters.value.search) count++
  if (hasAdvancedSearch.value) count++
  return count
})

const activeFilterSummary = computed(() => {
  const parts = []
  if (localFilters.value.region) parts.push('Region')
  if (localFilters.value.status) parts.push('Status')
  if (localFilters.value.priority) parts.push('Priority')
  if (localFilters.value.coordinator) parts.push('Coordinator')
  if (localFilters.value.search) parts.push('Search')
  if (hasAdvancedSearch.value) parts.push('Advanced')
  return parts.join(', ')
})

// Methods
function updateFilters(filters) {
  localFilters.value = filters
  emit('update:filters', filters)
}

function clearAllFilters() {
  localFilters.value = { ...DEFAULT_FILTERS }
  hasAdvancedSearch.value = false
  clearFilters()
  emit('update:filters', { ...DEFAULT_FILTERS })
}

function toggleQuickFilter(filter) {
  // Apply the quick filter logic
  const newFilters = { ...localFilters.value }
  if (filter.field === 'status') {
    newFilters.status = newFilters.status === filter.value ? null : filter.value
  } else if (filter.field === 'priority') {
    newFilters.priority = newFilters.priority === filter.value ? null : filter.value
  } else if (filter.field === 'coordinator') {
    newFilters.coordinator = newFilters.coordinator === filter.value ? null : filter.value
  }
  updateFilters(newFilters)
}

function handleAdvancedSearch(searchParams) {
  hasAdvancedSearch.value = !!searchParams
  emit('update:filters', {
    ...localFilters.value,
    advancedSearch: searchParams
  })
}

function handleAdvancedFilter(filterParams) {
  if (filterParams.preset) {
    updateFilters(localFilters.value)
  }
}

function saveCurrentFilters() {
  // Implementation would use saveFilterSet from useProjectFilters
  console.log('Save current filters')
}

function loadSavedFilter(filterSet) {
  if (filterSet.filters) {
    updateFilters({
      region: filterSet.filters.region || null,
      status: filterSet.filters.status || null,
      priority: filterSet.filters.priority || null,
      coordinator: filterSet.filters.coordinator || null,
      search: filterSet.filters.search || ''
    })
  }
  showSavedFilters.value = false
}
</script>