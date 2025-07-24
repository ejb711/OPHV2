<!-- client/src/components/comms/search/SavedFiltersDialog.vue -->
<template>
  <v-card>
    <v-card-title class="d-flex align-center">
      <v-icon class="mr-2">mdi-folder-open</v-icon>
      Load Saved Filters
      <v-spacer />
      <v-btn
        icon
        density="comfortable"
        @click="$emit('close')"
      >
        <v-icon>mdi-close</v-icon>
      </v-btn>
    </v-card-title>

    <v-divider />

    <v-card-text class="pa-4">
      <v-tabs v-model="tab" color="primary" class="mb-4">
        <v-tab value="saved">
          <v-icon start>mdi-content-save</v-icon>
          Saved Filters
        </v-tab>
        <v-tab value="recent">
          <v-icon start>mdi-history</v-icon>
          Recent Filters
        </v-tab>
      </v-tabs>

      <v-window v-model="tab">
        <!-- Saved Filters Tab -->
        <v-window-item value="saved">
          <v-list v-if="savedFilters.length > 0">
            <v-list-item
              v-for="filterSet in savedFilters"
              :key="filterSet.id"
              @click="loadFilter(filterSet)"
              :title="filterSet.name"
              :subtitle="filterSet.description || formatFilterSummary(filterSet)"
            >
              <template v-slot:prepend>
                <v-icon>mdi-filter-variant</v-icon>
              </template>
              <template v-slot:append>
                <v-chip size="x-small" variant="tonal">
                  {{ formatDate(filterSet.createdAt) }}
                </v-chip>
                <v-btn
                  icon
                  size="x-small"
                  variant="text"
                  class="ml-2"
                  @click.stop="deleteFilter(filterSet.id)"
                >
                  <v-icon size="small" color="error">mdi-delete</v-icon>
                </v-btn>
              </template>
            </v-list-item>
          </v-list>
          
          <v-alert
            v-else
            type="info"
            variant="tonal"
            text="No saved filters yet. Save your current filters to reuse them later."
          />
        </v-window-item>

        <!-- Recent Filters Tab -->
        <v-window-item value="recent">
          <v-list v-if="recentFilters.length > 0">
            <v-list-item
              v-for="(recent, index) in recentFilters"
              :key="index"
              @click="loadFilter(recent)"
              :title="`Filter from ${formatDate(recent.timestamp)}`"
              :subtitle="formatFilterSummary(recent)"
            >
              <template v-slot:prepend>
                <v-icon>mdi-history</v-icon>
              </template>
            </v-list-item>
          </v-list>
          
          <v-alert
            v-else
            type="info"
            variant="tonal"
            text="No recent filters. Your filter history will appear here."
          />
        </v-window-item>
      </v-window>
    </v-card-text>
  </v-card>
</template>

<script setup>
import { ref } from 'vue'
import { useProjectFilters } from '@/composables/comms/useProjectFilters'

// Emits
const emit = defineEmits(['load', 'close'])

// Composables
const { savedFilters, recentFilters, deleteFilterSet } = useProjectFilters()

// State
const tab = ref('saved')

// Methods
function loadFilter(filterSet) {
  emit('load', filterSet)
}

function deleteFilter(filterSetId) {
  if (confirm('Delete this saved filter?')) {
    deleteFilterSet(filterSetId)
  }
}

function formatFilterSummary(filterSet) {
  const filters = filterSet.filters || {}
  const parts = []
  
  if (filters.region) parts.push('Region')
  if (filters.status) parts.push('Status')
  if (filters.priority) parts.push('Priority')
  if (filters.tags?.length) parts.push('Tags')
  
  return parts.length > 0 ? parts.join(', ') : 'No filters'
}

function formatDate(dateString) {
  if (!dateString) return ''
  const date = new Date(dateString)
  const now = new Date()
  const diffMs = now - date
  const diffMins = Math.floor(diffMs / 60000)
  const diffHours = Math.floor(diffMs / 3600000)
  const diffDays = Math.floor(diffMs / 86400000)
  
  if (diffMins < 60) return `${diffMins}m ago`
  if (diffHours < 24) return `${diffHours}h ago`
  if (diffDays < 7) return `${diffDays}d ago`
  
  return date.toLocaleDateString()
}
</script>