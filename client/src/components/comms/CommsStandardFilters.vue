<!-- Standard Filters Component -->
<template>
  <div class="filters-container">
    <!-- Main Filter Bar -->
    <div class="filter-bar">
      <!-- Search -->
      <div class="filter-item search-field">
        <v-text-field
          :model-value="filters.search"
          placeholder="Search projects..."
          prepend-inner-icon="mdi-magnify"
          density="compact"
          hide-details
          clearable
          variant="solo"
          flat
          class="flex-grow-1"
          @update:model-value="updateSearch"
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
                  @click="selectSearchHistory(term)"
                >
                  <v-list-item-title>{{ term }}</v-list-item-title>
                </v-list-item>
              </v-list>
            </v-menu>
          </template>
        </v-text-field>
      </div>

      <v-divider vertical class="mx-2 d-none d-sm-flex" />

      <!-- Filters Group -->
      <div class="filter-group">
        <!-- Region -->
        <v-menu>
          <template v-slot:activator="{ props }">
            <v-btn
              v-bind="props"
              variant="tonal"
              size="small"
              class="filter-btn"
              :color="filters.region ? 'primary' : undefined"
            >
              <v-icon start size="small">mdi-map-marker</v-icon>
              {{ filters.region ? getRegionName(filters.region) : 'All Regions' }}
              <v-icon end size="small">mdi-menu-down</v-icon>
            </v-btn>
          </template>
          <v-list>
            <v-list-item
              @click="updateFilter('region', null)"
              :active="!filters.region"
            >
              <v-list-item-title>All Regions</v-list-item-title>
            </v-list-item>
            <v-divider />
            <v-list-item
              v-for="region in regionOptions"
              :key="region.value"
              @click="updateFilter('region', region.value)"
              :active="filters.region === region.value"
            >
              <v-list-item-title>{{ region.title }}</v-list-item-title>
            </v-list-item>
          </v-list>
        </v-menu>

        <!-- Status -->
        <v-menu>
          <template v-slot:activator="{ props }">
            <v-btn
              v-bind="props"
              variant="tonal"
              size="small"
              class="filter-btn"
              :color="filters.status ? 'primary' : undefined"
            >
              <v-icon start size="small">mdi-list-status</v-icon>
              {{ filters.status ? getStatusName(filters.status) : 'All Status' }}
              <v-icon end size="small">mdi-menu-down</v-icon>
            </v-btn>
          </template>
          <v-list>
            <v-list-item
              @click="updateFilter('status', null)"
              :active="!filters.status"
            >
              <v-list-item-title>All Status</v-list-item-title>
            </v-list-item>
            <v-divider />
            <v-list-item
              v-for="status in statusOptions"
              :key="status.value"
              @click="updateFilter('status', status.value)"
              :active="filters.status === status.value"
            >
              <v-list-item-title>{{ status.title }}</v-list-item-title>
            </v-list-item>
          </v-list>
        </v-menu>

        <!-- Priority -->
        <v-menu>
          <template v-slot:activator="{ props }">
            <v-btn
              v-bind="props"
              variant="tonal"
              size="small"
              class="filter-btn"
              :color="filters.priority ? 'primary' : undefined"
            >
              <v-icon start size="small">mdi-alert-circle</v-icon>
              {{ filters.priority ? getPriorityName(filters.priority) : 'All Priorities' }}
              <v-icon end size="small">mdi-menu-down</v-icon>
            </v-btn>
          </template>
          <v-list>
            <v-list-item
              @click="updateFilter('priority', null)"
              :active="!filters.priority"
            >
              <v-list-item-title>All Priorities</v-list-item-title>
            </v-list-item>
            <v-divider />
            <v-list-item
              v-for="priority in priorityOptions"
              :key="priority.value"
              @click="updateFilter('priority', priority.value)"
              :active="filters.priority === priority.value"
            >
              <v-list-item-title>{{ priority.title }}</v-list-item-title>
            </v-list-item>
          </v-list>
        </v-menu>

        <!-- Coordinator -->
        <v-menu>
          <template v-slot:activator="{ props }">
            <v-btn
              v-bind="props"
              variant="tonal"
              size="small"
              class="filter-btn"
              :color="filters.coordinator ? 'primary' : undefined"
              :loading="loadingCoordinators"
            >
              <v-icon start size="small">mdi-account</v-icon>
              {{ filters.coordinator ? getCoordinatorName(filters.coordinator) : 'All Coordinators' }}
              <v-icon end size="small">mdi-menu-down</v-icon>
            </v-btn>
          </template>
          <v-list>
            <v-list-item
              @click="updateFilter('coordinator', null)"
              :active="!filters.coordinator"
            >
              <v-list-item-title>All Coordinators</v-list-item-title>
            </v-list-item>
            <v-divider />
            <v-list-item
              v-for="coord in coordinatorOptions"
              :key="coord.value"
              @click="updateFilter('coordinator', coord.value)"
              :active="filters.coordinator === coord.value"
            >
              <v-list-item-title>{{ coord.title }}</v-list-item-title>
            </v-list-item>
          </v-list>
        </v-menu>
      </div>

      <v-divider vertical class="mx-2 d-none d-sm-flex" />

      <!-- Sort -->
      <div class="sort-section">
        <v-btn-group variant="outlined" size="small" divided>
          <v-menu>
            <template v-slot:activator="{ props }">
              <v-btn
                v-bind="props"
                class="sort-btn"
              >
                <v-icon start size="small">mdi-sort</v-icon>
                {{ getCurrentSortName() }}
                <v-icon end size="small">mdi-menu-down</v-icon>
              </v-btn>
            </template>
            <v-list>
              <v-list-item
                v-for="option in sortOptions"
                :key="option.value"
                @click="updateSort(option.value)"
                :active="(filters.sortBy || 'updatedAt') === option.value"
              >
                <template v-slot:prepend>
                  <v-icon :icon="option.props.prependIcon" />
                </template>
                <v-list-item-title>{{ option.title }}</v-list-item-title>
              </v-list-item>
            </v-list>
          </v-menu>
          
          <v-btn
            icon
            @click="toggleSortDirection"
            :title="`Sort ${filters.sortDirection === 'asc' ? 'Ascending' : 'Descending'}`"
          >
            <v-icon>
              {{ filters.sortDirection === 'asc' ? 'mdi-sort-ascending' : 'mdi-sort-descending' }}
            </v-icon>
          </v-btn>
        </v-btn-group>
      </div>

      <!-- Actions -->
      <div class="actions-section">
        <v-btn
          v-if="hasActiveFilters"
          variant="text"
          size="small"
          @click="$emit('clear-all')"
          class="clear-btn"
        >
          <v-icon start size="small">mdi-close</v-icon>
          Clear
        </v-btn>
        
        <v-menu>
          <template v-slot:activator="{ props }">
            <v-btn
              v-bind="props"
              icon="mdi-dots-vertical"
              variant="text"
              size="small"
            />
          </template>
          <v-list density="compact">
            <v-list-item @click="$emit('save-filters')">
              <template v-slot:prepend>
                <v-icon size="small">mdi-content-save</v-icon>
              </template>
              <v-list-item-title>Save Filters</v-list-item-title>
            </v-list-item>
            <v-list-item @click="$emit('show-saved-filters')">
              <template v-slot:prepend>
                <v-icon size="small">mdi-folder-open</v-icon>
              </template>
              <v-list-item-title>Load Saved</v-list-item-title>
            </v-list-item>
          </v-list>
        </v-menu>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, onMounted, ref } from 'vue'
import { useProjectSearch } from '@/composables/comms/useProjectSearch'
import { useCoordinatorSelection } from '@/composables/comms/useCoordinatorSelection'
import { STATUS_OPTIONS, PRIORITY_OPTIONS, getRegionOptions } from '@/config/commsFilterOptions'

// Props
const props = defineProps({
  filters: {
    type: Object,
    required: true
  },
  hasActiveFilters: {
    type: Boolean,
    default: false
  },
  activeFilterCount: {
    type: Number,
    default: 0
  }
})

// Emits
const emit = defineEmits([
  'update:filters',
  'save-filters',
  'show-saved-filters',
  'clear-all'
])

// Composables
const { searchHistory, addToHistory } = useProjectSearch()
const { allCoordinators, loadingCoordinators, loadAllCoordinators } = useCoordinatorSelection()

// Options
const regionOptions = computed(() => getRegionOptions())
const statusOptions = STATUS_OPTIONS
const priorityOptions = PRIORITY_OPTIONS
const sortOptions = [
  { 
    title: 'Last Updated', 
    value: 'updatedAt',
    props: { prependIcon: 'mdi-clock-edit-outline' }
  },
  { 
    title: 'Date Created', 
    value: 'createdAt',
    props: { prependIcon: 'mdi-calendar-plus' }
  },
  { 
    title: 'Title', 
    value: 'title',
    props: { prependIcon: 'mdi-format-title' }
  },
  { 
    title: 'Priority', 
    value: 'priority',
    props: { prependIcon: 'mdi-alert-circle' }
  },
  { 
    title: 'Due Date', 
    value: 'deadline',
    props: { prependIcon: 'mdi-calendar-clock' }
  },
  { 
    title: 'Progress', 
    value: 'progress',
    props: { prependIcon: 'mdi-percent' }
  },
  { 
    title: 'Status', 
    value: 'status',
    props: { prependIcon: 'mdi-list-status' }
  }
]

// Coordinator options formatted for v-select
const coordinatorOptions = computed(() => {
  return allCoordinators.value.map(coord => ({
    title: coord.displayName || coord.name || coord.email,
    value: coord.id
  }))
})

// Debounce timer
let debounceTimer = null

// Methods
function updateFilter(field, value) {
  emit('update:filters', {
    ...props.filters,
    [field]: value
  })
}

function updateSearch(value) {
  clearTimeout(debounceTimer)
  debounceTimer = setTimeout(() => {
    updateFilter('search', value)
    if (value) {
      addToHistory(value)
    }
  }, 300)
}

function selectSearchHistory(term) {
  updateFilter('search', term)
}

function updateSort(value) {
  emit('update:filters', {
    ...props.filters,
    sortBy: value
  })
}

function toggleSortDirection() {
  emit('update:filters', {
    ...props.filters,
    sortDirection: props.filters.sortDirection === 'asc' ? 'desc' : 'asc'
  })
}

// Helper methods for display names
function getRegionName(value) {
  const region = regionOptions.value.find(r => r.value === value)
  return region?.title || value
}

function getStatusName(value) {
  const status = statusOptions.find(s => s.value === value)
  return status?.title || value
}

function getPriorityName(value) {
  const priority = priorityOptions.find(p => p.value === value)
  return priority?.title || value
}

function getCoordinatorName(value) {
  const coord = coordinatorOptions.value.find(c => c.value === value)
  return coord?.title || 'Unknown'
}

function getCurrentSortName() {
  const sortBy = props.filters.sortBy || 'updatedAt'
  const option = sortOptions.find(s => s.value === sortBy)
  return option?.title || 'Last Updated'
}

// Load coordinators on mount
onMounted(() => {
  loadAllCoordinators()
})
</script>

<style scoped>
.filters-container {
  width: 100%;
}

.filter-bar {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 8px;
  background-color: #f5f5f5;
  border-radius: 8px;
  flex-wrap: wrap;
}

.search-field {
  flex: 1;
  min-width: 200px;
}

.filter-group {
  display: flex;
  gap: 8px;
  align-items: center;
  flex-wrap: wrap;
}

.filter-btn {
  text-transform: none;
  font-weight: 400;
}

.sort-section {
  display: flex;
  align-items: center;
}

.sort-btn {
  text-transform: none;
}

/* Sort button group styling */
:deep(.v-btn-group) {
  box-shadow: none;
}

:deep(.v-btn-group .v-btn) {
  border-radius: 0;
}

:deep(.v-btn-group .v-btn:first-child) {
  border-top-left-radius: 4px;
  border-bottom-left-radius: 4px;
}

:deep(.v-btn-group .v-btn:last-child) {
  border-top-right-radius: 4px;
  border-bottom-right-radius: 4px;
}

.actions-section {
  display: flex;
  gap: 4px;
  align-items: center;
  margin-left: auto;
}

.clear-btn {
  text-transform: none;
}

/* Search field styling */
.search-field :deep(.v-field) {
  background-color: white;
}

.search-field :deep(.v-field__input) {
  padding-top: 6px;
  padding-bottom: 6px;
}

/* Button hover effects */
.filter-btn:hover,
.sort-btn:hover {
  transform: translateY(-1px);
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

/* Active filter button styling */
.filter-btn[color="primary"] {
  font-weight: 500;
}

/* Responsive design */
@media (max-width: 960px) {
  .filter-bar {
    gap: 8px;
  }
  
  .filter-group {
    flex: 1;
    justify-content: space-between;
  }
}

@media (max-width: 600px) {
  .filter-bar {
    padding: 4px;
  }
  
  .search-field {
    width: 100%;
    margin-bottom: 8px;
  }
  
  .filter-btn,
  .sort-btn {
    flex: 1;
    min-width: 0;
  }
  
  .filter-btn .v-btn__content,
  .sort-btn .v-btn__content {
    flex-wrap: nowrap;
    overflow: hidden;
  }
  
  .filter-btn span,
  .sort-btn span {
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  
  /* Hide icons on very small screens */
  @media (max-width: 400px) {
    .filter-btn .v-icon--start,
    .sort-btn .v-icon--start {
      display: none;
    }
  }
}

/* Hide Vuetify's built-in labels */
:deep(.v-select .v-field__label),
:deep(.v-select .v-label) {
  display: none !important;
}

/* Hide selection text overlay */
:deep(.v-select .v-field__input .v-select__selection-text) {
  display: none !important;
}

/* Ensure matching heights for both fields */
:deep(.v-text-field .v-field),
:deep(.v-select .v-field) {
  min-height: 40px !important;
}

:deep(.v-text-field .v-field__input),
:deep(.v-select .v-field__input) {
  min-height: 40px !important;
  padding-top: 10px !important;
  padding-bottom: 10px !important;
}

/* Responsive adjustments */
@media (max-width: 959px) {
  .text-right {
    text-align: left !important;
  }
  
  /* Add spacing between field groups on tablet/mobile */
  .field-group {
    margin-bottom: 16px;
  }
  
  /* Stack filters better on smaller screens */
  .v-col {
    padding-bottom: 8px;
  }
}

@media (max-width: 599px) {
  /* Full width on mobile */
  .v-col {
    flex: 0 0 100% !important;
    max-width: 100% !important;
  }
}
</style>