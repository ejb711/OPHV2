<!-- Standard Filters Component -->
<template>
  <v-row align="center">
    <!-- Search -->
    <v-col cols="12" md="4">
      <v-text-field
        :model-value="filters.search"
        label="Search projects"
        prepend-inner-icon="mdi-magnify"
        density="comfortable"
        hide-details
        clearable
        variant="outlined"
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
    </v-col>

    <!-- Region Filter -->
    <v-col cols="12" sm="6" md="2">
      <div class="field-group">
        <label class="field-label">Region</label>
        <v-select
          :model-value="filters.region"
          :items="regionOptions"
          placeholder="All regions"
          density="comfortable"
          hide-details
          clearable
          variant="outlined"
          @update:model-value="updateFilter('region', $event)"
        />
      </div>
    </v-col>

    <!-- Status Filter -->
    <v-col cols="12" sm="6" md="2">
      <div class="field-group">
        <label class="field-label">Status</label>
        <v-select
          :model-value="filters.status"
          :items="statusOptions"
          placeholder="All statuses"
          density="comfortable"
          hide-details
          clearable
          variant="outlined"
          @update:model-value="updateFilter('status', $event)"
        />
      </div>
    </v-col>

    <!-- Priority Filter -->
    <v-col cols="12" sm="6" md="2">
      <div class="field-group">
        <label class="field-label">Priority</label>
        <v-select
          :model-value="filters.priority"
          :items="priorityOptions"
          placeholder="All priorities"
          density="comfortable"
          hide-details
          clearable
          variant="outlined"
          @update:model-value="updateFilter('priority', $event)"
        />
      </div>
    </v-col>

    <!-- Actions -->
    <v-col cols="12" sm="6" md="2" class="text-right">
      <v-menu>
        <template v-slot:activator="{ props }">
          <v-btn
            v-bind="props"
            variant="text"
            size="small"
            :disabled="!hasActiveFilters"
          >
            <v-badge
              :content="activeFilterCount"
              :model-value="activeFilterCount > 0"
              color="primary"
              inline
            >
              <span>Filters</span>
            </v-badge>
            <v-icon end>mdi-menu-down</v-icon>
          </v-btn>
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
          <v-divider class="my-1" />
          <v-list-item @click="$emit('clear-all')">
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
</template>

<script setup>
import { computed } from 'vue'
import { useProjectSearch } from '@/composables/comms/useProjectSearch'
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

// Options
const regionOptions = computed(() => getRegionOptions())
const statusOptions = STATUS_OPTIONS
const priorityOptions = PRIORITY_OPTIONS

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
</script>

<style scoped>
/* External label styling - matching UserManagementFilters pattern */
.field-group {
  width: 100%;
}

.field-label {
  display: block;
  font-size: 0.875rem;
  font-weight: 600;
  color: #003057;
  margin-bottom: 8px;
  font-family: 'Cambria', Georgia, serif;
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
@media (max-width: 599px) {
  .text-right {
    text-align: left !important;
  }
  
  /* Add spacing between field groups on mobile */
  .field-group {
    margin-bottom: 16px;
  }
}
</style>