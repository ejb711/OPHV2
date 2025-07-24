<!-- client/src/components/comms/CommsSearch.vue -->
<template>
  <v-dialog
    v-model="dialog"
    max-width="800"
    scrollable
  >
    <template v-slot:activator="{ props: activatorProps }">
      <v-btn
        v-bind="activatorProps"
        :color="hasActiveSearch ? 'primary' : undefined"
        :variant="hasActiveSearch ? 'tonal' : 'text'"
        icon
      >
        <v-badge
          :content="activeSearchCount"
          :model-value="activeSearchCount > 0"
          color="error"
          floating
        >
          <v-icon>mdi-magnify</v-icon>
        </v-badge>
      </v-btn>
    </template>

    <v-card>
      <v-card-title>
        <div class="w-100">
          <div class="d-flex align-center">
            <v-icon class="mr-2">mdi-magnify</v-icon>
            <span class="text-h6">Advanced Search</span>
            <v-chip
              color="info"
              variant="flat"
              size="small"
              class="ml-3"
            >
              <v-icon start size="x-small">mdi-flask-outline</v-icon>
              Coming Soon
            </v-chip>
            <v-spacer />
            <v-btn
              icon
              density="comfortable"
              @click="dialog = false"
            >
              <v-icon>mdi-close</v-icon>
            </v-btn>
          </div>
          <div class="text-caption text-medium-emphasis mt-1">
            This feature is currently being developed and debugged. It will be fully operational in an upcoming release.
          </div>
        </div>
      </v-card-title>

      <v-divider />

      <v-card-text class="pa-0">
        <v-tabs v-model="tab" color="primary">
          <v-tab value="search">
            <v-icon start>mdi-text-search</v-icon>
            Text Search
          </v-tab>
          <v-tab value="filters">
            <v-icon start>mdi-filter</v-icon>
            Filters
          </v-tab>
          <v-tab value="history">
            <v-icon start>mdi-history</v-icon>
            History
          </v-tab>
        </v-tabs>

        <v-window v-model="tab" class="mt-4">
          <!-- Text Search Tab -->
          <v-window-item value="search" class="px-4 pb-4">
            <CommsSearchTextTab
              v-model:search-query="searchQuery"
              v-model:search-fields="searchFields"
              v-model:search-mode="searchMode"
              v-model:advanced-criteria="advancedCriteria"
              :quick-searches="quickSearches"
              @apply-quick-search="applyQuickSearch"
            />
          </v-window-item>

          <!-- Filters Tab -->
          <v-window-item value="filters" class="px-4 pb-4">
            <CommsSearchFiltersTab
              :has-active-filters="hasActiveFilters"
              @load="handleLoadFilter"
              @delete="handleDeleteFilter"
              @apply="handleApplyPreset"
              @save="showSaveDialog = true"
            />
          </v-window-item>

          <!-- History Tab -->
          <v-window-item value="history" class="px-4 pb-4">
            <CommsSearchHistoryTab
              v-model:search-query="searchQuery"
              :search-history="searchHistory"
              @clear="clearHistory"
            />
          </v-window-item>
        </v-window>
      </v-card-text>

      <v-divider />

      <v-card-actions>
        <v-btn
          variant="text"
          @click="handleReset"
          disabled
        >
          Reset All
        </v-btn>
        <v-spacer />
        <v-btn
          variant="text"
          @click="dialog = false"
        >
          Cancel
        </v-btn>
        <v-tooltip location="top">
          <template v-slot:activator="{ props }">
            <span v-bind="props">
              <v-btn
                color="primary"
                variant="flat"
                disabled
              >
                Apply Search
              </v-btn>
            </span>
          </template>
          <span>This feature is coming soon</span>
        </v-tooltip>
      </v-card-actions>
    </v-card>

    <!-- Save Filter Dialog -->
    <CommsSearchSaveDialog
      v-model="showSaveDialog"
      @save="handleSaveFilter"
    />
  </v-dialog>
</template>

<script setup>
import { ref } from 'vue'
import { useProjectSearch } from '@/composables/comms/useProjectSearch'
import { useProjectFilters } from '@/composables/comms/useProjectFilters'
import CommsSearchTextTab from './search/CommsSearchTextTab.vue'
import CommsSearchFiltersTab from './search/CommsSearchFiltersTab.vue'
import CommsSearchHistoryTab from './search/CommsSearchHistoryTab.vue'
import CommsSearchSaveDialog from './search/CommsSearchSaveDialog.vue'

// Props & Emits
const emit = defineEmits(['search', 'filter'])

// Composables
const {
  searchQuery,
  searchFields,
  searchMode,
  searchHistory,
  advancedCriteria,
  quickSearches,
  hasActiveSearch,
  activeSearchCount,
  clearHistory,
  applyQuickSearch,
  resetSearch
} = useProjectSearch()

const {
  hasActiveFilters,
  saveFilterSet,
  loadFilterSet,
  deleteFilterSet
} = useProjectFilters()

// Local state
const dialog = ref(false)
const tab = ref('search')
const showSaveDialog = ref(false)

// Methods
function handleApply() {
  emit('search', {
    query: searchQuery.value,
    fields: searchFields.value,
    mode: searchMode.value,
    advanced: advancedCriteria.value
  })
  dialog.value = false
}

function handleReset() {
  resetSearch()
  emit('search', null)
}

function handleLoadFilter(filterSetId) {
  loadFilterSet(filterSetId)
  tab.value = 'search'
}

function handleDeleteFilter(filterSetId) {
  deleteFilterSet(filterSetId)
}

function handleApplyPreset(presetId) {
  emit('filter', { preset: presetId })
  dialog.value = false
}

function handleSaveFilter(name, description) {
  saveFilterSet(name, description)
  showSaveDialog.value = false
}
</script>

<style scoped>
/* Ensure proper spacing in dialog */
.v-window-item {
  min-height: 300px;
}

.w-100 {
  width: 100%;
}
</style>