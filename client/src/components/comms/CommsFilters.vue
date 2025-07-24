<!-- client/src/components/comms/CommsFilters.vue -->
<template>
  <v-card elevation="0" class="rounded-lg">
    <!-- Quick Filters Bar -->
    <v-card-text class="pa-3 border-b">
      <div class="d-flex align-center">
        <span class="text-body-2 text-grey-darken-1 mr-3">
          Quick Filters:
        </span>
        <v-chip-group
          v-model="activeQuickFilters"
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

    <!-- Standard Filters -->
    <v-card-text class="pa-4">
      <v-row align="center">
        <!-- Search -->
        <v-col cols="12" md="4">
          <v-text-field
            v-model="localSearch"
            label="Search projects"
            prepend-inner-icon="mdi-magnify"
            density="comfortable"
            hide-details
            clearable
            variant="outlined"
            @update:model-value="debouncedUpdate"
          >
            <template v-slot:append-inner>
              <v-menu
                v-if="searchHistory.length > 0"
                location="bottom"
              >
                <template v-slot:activator="{ props }">
                  <v-btn
                    v-bind="props"
                    icon
                    size="x-small"
                    variant="text"
                  >
                    <v-icon size="small">mdi-menu-down</v-icon>
                  </v-btn>
                </template>
                <v-list density="compact">
                  <v-list-subheader>Recent Searches</v-list-subheader>
                  <v-list-item
                    v-for="(term, index) in searchHistory.slice(0, 5)"
                    :key="index"
                    @click="localSearch = term"
                  >
                    <v-list-item-title>{{ term }}</v-list-item-title>
                  </v-list-item>
                </v-list>
              </v-menu>
            </template>
          </v-text-field>
        </v-col>

        <!-- Region Filter -->
        <v-col cols="12" sm="6" md="2">
          <v-select
            v-model="localRegion"
            :items="regionOptions"
            label="Region"
            density="comfortable"
            hide-details
            clearable
            variant="outlined"
            @update:model-value="updateFilters"
          />
        </v-col>

        <!-- Status Filter -->
        <v-col cols="12" sm="6" md="2">
          <v-select
            v-model="localStatus"
            :items="statusOptions"
            label="Status"
            density="comfortable"
            hide-details
            clearable
            variant="outlined"
            @update:model-value="updateFilters"
          />
        </v-col>

        <!-- Priority Filter -->
        <v-col cols="12" sm="6" md="2">
          <v-select
            v-model="localPriority"
            :items="priorityOptions"
            label="Priority"
            density="comfortable"
            hide-details
            clearable
            variant="outlined"
            @update:model-value="updateFilters"
          />
        </v-col>

        <!-- Actions -->
        <v-col cols="12" sm="6" md="2" class="text-right">
          <v-menu>
            <template v-slot:activator="{ props }">
              <v-btn
                v-bind="props"
                variant="text"
                size="small"
                :disabled="!hasActiveFilters && !hasAdvancedSearch"
              >
                <v-badge
                  :content="totalActiveFilters"
                  :model-value="totalActiveFilters > 0"
                  color="primary"
                  inline
                >
                  <span>Filters</span>
                </v-badge>
                <v-icon end>mdi-menu-down</v-icon>
              </v-btn>
            </template>
            <v-list density="compact">
              <v-list-item @click="saveCurrentFilters">
                <template v-slot:prepend>
                  <v-icon size="small">mdi-content-save</v-icon>
                </template>
                <v-list-item-title>Save Filters</v-list-item-title>
              </v-list-item>
              <v-list-item @click="showSavedFilters = true">
                <template v-slot:prepend>
                  <v-icon size="small">mdi-folder-open</v-icon>
                </template>
                <v-list-item-title>Load Saved</v-list-item-title>
              </v-list-item>
              <v-divider class="my-1" />
              <v-list-item @click="clearAllFilters">
                <template v-slot:prepend>
                  <v-icon size="small" color="error">mdi-close</v-icon>
                </template>
                <v-list-item-title class="text-error">
                  Clear All
                </v-list-item-title>
              </v-list-item>
            </v-list>
          </v-menu>
        </v-col>
      </v-row>

      <!-- Active Filters Summary -->
      <v-expand-transition>
        <div v-if="filterSummary" class="mt-3">
          <v-chip
            size="small"
            closable
            class="mr-2 mb-1"
            @click:close="clearAllFilters"
          >
            <v-icon start size="small">mdi-filter</v-icon>
            {{ filterSummary }}
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
import { ref, computed, watch } from 'vue'
import { LOUISIANA_REGIONS } from '@/config/louisiana-regions'
import { useProjectSearch } from '@/composables/comms/useProjectSearch'
import { useProjectFilters } from '@/composables/comms/useProjectFilters'
import CommsSearch from './CommsSearch.vue'
import SavedFiltersDialog from './search/SavedFiltersDialog.vue'

// Props
const props = defineProps({
  filters: {
    type: Object,
    default: () => ({
      region: null,
      status: null,
      priority: null,
      search: ''
    })
  }
})

// Emits
const emit = defineEmits(['update:filters'])

// Composables
const { searchHistory, addToHistory } = useProjectSearch()
const { 
  quickFilters,
  activeFilterCount,
  filterSummary,
  clearAllFilters: clearFilters,
  applyQuickFilter
} = useProjectFilters()

// Local state - Initialize from props
const localRegion = ref(props.filters.region)
const localStatus = ref(props.filters.status)
const localPriority = ref(props.filters.priority)
const localSearch = ref(props.filters.search)
const activeQuickFilters = ref([])
const showSavedFilters = ref(false)
const hasAdvancedSearch = ref(false)

// Debounce timer
let debounceTimer = null

// Filter options
const regionOptions = computed(() => {
  return Object.entries(LOUISIANA_REGIONS).map(([key, region]) => ({
    title: region.name,
    value: key
  }))
})

const statusOptions = [
  { title: 'Not Started', value: 'not_started' },
  { title: 'Planning', value: 'planning' },
  { title: 'In Progress', value: 'in_progress' },
  { title: 'Under Review', value: 'review' },
  { title: 'Pending Approval', value: 'pending_approval' },
  { title: 'Approved', value: 'approved' },
  { title: 'Completed', value: 'completed' },
  { title: 'On Hold', value: 'on_hold' },
  { title: 'Cancelled', value: 'cancelled' }
]

const priorityOptions = [
  { title: 'Low', value: 'low' },
  { title: 'Medium', value: 'medium' },
  { title: 'High', value: 'high' },
  { title: 'Urgent', value: 'urgent' }
]

// Computed
const hasActiveFilters = computed(() => {
  return !!(
    localRegion.value ||
    localStatus.value ||
    localPriority.value ||
    localSearch.value ||
    activeQuickFilters.value.length > 0
  )
})

const totalActiveFilters = computed(() => {
  let count = 0
  if (localRegion.value) count++
  if (localStatus.value) count++
  if (localPriority.value) count++
  if (localSearch.value) count++
  count += activeQuickFilters.value.length
  if (hasAdvancedSearch.value) count++
  return count
})

// Methods
function updateFilters() {
  const filters = {
    region: localRegion.value,
    status: localStatus.value,
    priority: localPriority.value,
    search: localSearch.value,
    quickFilters: activeQuickFilters.value
  }
  
  emit('update:filters', filters)
  
  // Add search to history
  if (localSearch.value) {
    addToHistory(localSearch.value)
  }
}

function debouncedUpdate() {
  clearTimeout(debounceTimer)
  debounceTimer = setTimeout(() => {
    updateFilters()
  }, 300)
}

function clearAllFilters() {
  localRegion.value = null
  localStatus.value = null
  localPriority.value = null
  localSearch.value = ''
  activeQuickFilters.value = []
  hasAdvancedSearch.value = false
  clearFilters()
  updateFilters()
}

function toggleQuickFilter(filter) {
  // Apply the quick filter logic
  if (filter.field === 'status') {
    localStatus.value = localStatus.value === filter.value ? null : filter.value
  } else if (filter.field === 'priority') {
    localPriority.value = localPriority.value === filter.value ? null : filter.value
  }
  updateFilters()
}

function handleAdvancedSearch(searchParams) {
  hasAdvancedSearch.value = !!searchParams
  emit('update:filters', {
    ...props.filters,
    advancedSearch: searchParams
  })
}

function handleAdvancedFilter(filterParams) {
  // Handle preset filters from advanced search
  if (filterParams.preset) {
    // Apply preset logic
    updateFilters()
  }
}

function saveCurrentFilters() {
  // This would open a dialog to save current filter configuration
  // Implementation would use the saveFilterSet method from useProjectFilters
}

function loadSavedFilter(filterSet) {
  // Apply loaded filter set
  if (filterSet.filters) {
    localRegion.value = filterSet.filters.region || null
    localStatus.value = filterSet.filters.status || null
    localPriority.value = filterSet.filters.priority || null
    localSearch.value = filterSet.filters.search || ''
    updateFilters()
  }
  showSavedFilters.value = false
}

// Watch for external changes to filters
watch(() => props.filters.region, (newVal) => {
  if (newVal !== localRegion.value) {
    localRegion.value = newVal
  }
})

watch(() => props.filters.status, (newVal) => {
  if (newVal !== localStatus.value) {
    localStatus.value = newVal
  }
})

watch(() => props.filters.priority, (newVal) => {
  if (newVal !== localPriority.value) {
    localPriority.value = newVal
  }
})

watch(() => props.filters.search, (newVal) => {
  if (newVal !== localSearch.value) {
    localSearch.value = newVal
  }
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
  
  .text-right {
    text-align: left !important;
  }
}
</style>