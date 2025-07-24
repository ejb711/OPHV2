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
      <v-card-title class="d-flex align-center">
        <v-icon class="mr-2">mdi-magnify</v-icon>
        Advanced Search
        <v-spacer />
        <v-btn
          icon
          density="comfortable"
          @click="dialog = false"
        >
          <v-icon>mdi-close</v-icon>
        </v-btn>
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
            <v-text-field
              v-model="searchQuery"
              label="Search Query"
              variant="outlined"
              density="comfortable"
              clearable
              autofocus
              persistent-hint
              hint="Enter keywords to search in project titles, descriptions, and tags"
              class="mb-4"
            />

            <div class="mb-4">
              <p class="text-body-2 text-grey-darken-1 mb-2">
                Search in:
              </p>
              <v-chip-group
                v-model="searchFields"
                multiple
                color="primary"
                variant="outlined"
              >
                <v-chip value="title">Title</v-chip>
                <v-chip value="description">Description</v-chip>
                <v-chip value="tags">Tags</v-chip>
              </v-chip-group>
            </div>

            <div class="mb-4">
              <p class="text-body-2 text-grey-darken-1 mb-2">
                Match:
              </p>
              <v-radio-group
                v-model="searchMode"
                inline
                hide-details
              >
                <v-radio label="All keywords" value="all" />
                <v-radio label="Any keyword" value="any" />
              </v-radio-group>
            </div>

            <v-expansion-panels variant="accordion">
              <v-expansion-panel>
                <v-expansion-panel-title>
                  <v-icon start>mdi-tune</v-icon>
                  Advanced Criteria
                </v-expansion-panel-title>
                <v-expansion-panel-text>
                  <v-row>
                    <v-col cols="12" md="6">
                      <UserSelect
                        v-model="advancedCriteria.createdBy"
                        label="Created By"
                        clearable
                        density="comfortable"
                        variant="outlined"
                      />
                    </v-col>
                    
                    <v-col cols="12" md="6">
                      <v-select
                        v-model="advancedCriteria.modifiedWithin"
                        :items="modifiedOptions"
                        label="Modified Within"
                        clearable
                        density="comfortable"
                        variant="outlined"
                      />
                    </v-col>

                    <v-col cols="12" md="6">
                      <v-text-field
                        v-model="advancedCriteria.dateRange.start"
                        label="Created After"
                        type="date"
                        clearable
                        density="comfortable"
                        variant="outlined"
                        persistent-hint
                        hint="Start date"
                      />
                    </v-col>

                    <v-col cols="12" md="6">
                      <v-text-field
                        v-model="advancedCriteria.dateRange.end"
                        label="Created Before"
                        type="date"
                        clearable
                        density="comfortable"
                        variant="outlined"
                        persistent-hint
                        hint="End date"
                      />
                    </v-col>

                    <v-col cols="12">
                      <v-checkbox
                        v-model="advancedCriteria.overdue"
                        label="Only show overdue projects"
                        hide-details
                      />
                      <v-checkbox
                        v-model="advancedCriteria.hasFiles"
                        label="Has file attachments"
                        hide-details
                      />
                      <v-checkbox
                        v-model="advancedCriteria.hasMessages"
                        label="Has forum messages"
                        hide-details
                      />
                    </v-col>
                  </v-row>
                </v-expansion-panel-text>
              </v-expansion-panel>
            </v-expansion-panels>

            <div class="mt-4">
              <p class="text-body-2 text-grey-darken-1 mb-2">
                Quick Searches:
              </p>
              <v-row>
                <v-col
                  v-for="quick in quickSearches"
                  :key="quick.id"
                  cols="6"
                  sm="3"
                >
                  <v-btn
                    block
                    variant="outlined"
                    size="small"
                    @click="applyQuickSearch(quick.id)"
                  >
                    <v-icon start>{{ quick.icon }}</v-icon>
                    {{ quick.name }}
                  </v-btn>
                </v-col>
              </v-row>
            </div>
          </v-window-item>

          <!-- Filters Tab -->
          <v-window-item value="filters" class="px-4 pb-4">
            <SavedFilters
              @load="handleLoadFilter"
              @delete="handleDeleteFilter"
              class="mb-4"
            />

            <PresetFilters
              @apply="handleApplyPreset"
              class="mb-4"
            />

            <v-btn
              color="primary"
              variant="outlined"
              block
              @click="showSaveDialog = true"
              :disabled="!hasActiveFilters"
            >
              <v-icon start>mdi-content-save</v-icon>
              Save Current Filters
            </v-btn>
          </v-window-item>

          <!-- History Tab -->
          <v-window-item value="history" class="px-4 pb-4">
            <div class="d-flex justify-space-between align-center mb-3">
              <p class="text-body-2 text-grey-darken-1">
                Recent searches:
              </p>
              <v-btn
                v-if="searchHistory.length > 0"
                size="small"
                variant="text"
                color="error"
                @click="clearHistory"
              >
                Clear All
              </v-btn>
            </div>

            <v-list
              v-if="searchHistory.length > 0"
              density="compact"
            >
              <v-list-item
                v-for="(item, index) in searchHistory"
                :key="index"
                @click="searchQuery = item"
              >
                <template v-slot:prepend>
                  <v-icon size="small">mdi-history</v-icon>
                </template>
                <v-list-item-title>{{ item }}</v-list-item-title>
              </v-list-item>
            </v-list>
            
            <v-alert
              v-else
              type="info"
              variant="tonal"
              text="No search history yet"
            />
          </v-window-item>
        </v-window>
      </v-card-text>

      <v-divider />

      <v-card-actions>
        <v-btn
          variant="text"
          @click="handleReset"
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
        <v-btn
          color="primary"
          variant="flat"
          @click="handleApply"
        >
          Apply Search
        </v-btn>
      </v-card-actions>
    </v-card>

    <!-- Save Filter Dialog -->
    <v-dialog
      v-model="showSaveDialog"
      max-width="500"
    >
      <v-card>
        <v-card-title>Save Filter Set</v-card-title>
        <v-card-text>
          <v-text-field
            v-model="saveFilterName"
            label="Filter Name"
            variant="outlined"
            density="comfortable"
            placeholder="e.g., Q4 Marketing Projects"
            class="mb-3"
          />
          <v-textarea
            v-model="saveFilterDescription"
            label="Description (optional)"
            variant="outlined"
            density="comfortable"
            rows="2"
          />
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn
            variant="text"
            @click="showSaveDialog = false"
          >
            Cancel
          </v-btn>
          <v-btn
            color="primary"
            variant="flat"
            @click="handleSaveFilter"
            :disabled="!saveFilterName"
          >
            Save
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </v-dialog>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useProjectSearch } from '@/composables/comms/useProjectSearch'
import { useProjectFilters } from '@/composables/comms/useProjectFilters'
import { useAuthStore } from '@/stores/auth'
import UserSelect from '@/components/shared/UserSelect.vue'
import SavedFilters from './search/SavedFilters.vue'
import PresetFilters from './search/PresetFilters.vue'

// Props & Emits
const emit = defineEmits(['search', 'filter'])

// Stores
const authStore = useAuthStore()

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
const saveFilterName = ref('')
const saveFilterDescription = ref('')

// Options
const modifiedOptions = [
  { title: 'Today', value: 1 },
  { title: 'Last 3 days', value: 3 },
  { title: 'Last week', value: 7 },
  { title: 'Last 2 weeks', value: 14 },
  { title: 'Last month', value: 30 },
  { title: 'Last 3 months', value: 90 }
]

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
  // This would be handled by parent component
  emit('filter', { preset: presetId })
  dialog.value = false
}

function handleSaveFilter() {
  if (!saveFilterName.value) return
  
  saveFilterSet(saveFilterName.value, saveFilterDescription.value)
  
  // Reset dialog
  showSaveDialog.value = false
  saveFilterName.value = ''
  saveFilterDescription.value = ''
}
</script>

<style scoped>
.v-expansion-panel-text :deep(.v-expansion-panel-text__wrapper) {
  padding-top: 16px;
}

/* Fix for outlined text field label positioning */
:deep(.v-field--variant-outlined .v-field__overlay) {
  --v-field-border-opacity: 1;
}

:deep(.v-field--variant-outlined .v-label) {
  background-color: white;
  padding: 0 4px;
}

/* Ensure proper spacing in dialog */
.v-window-item {
  min-height: 300px;
}
</style>