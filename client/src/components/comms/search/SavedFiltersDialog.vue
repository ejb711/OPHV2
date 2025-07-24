<!-- Saved Filters Dialog Component -->
<template>
  <v-card>
    <v-card-title class="d-flex align-center">
      <span>Saved Filters</span>
      <v-spacer />
      <v-btn
        icon
        variant="text"
        size="small"
        @click="$emit('close')"
      >
        <v-icon>mdi-close</v-icon>
      </v-btn>
    </v-card-title>

    <v-divider />

    <v-card-text class="pa-0">
      <v-list v-if="savedFilters.length > 0" lines="two">
        <v-list-item
          v-for="filterSet in savedFilters"
          :key="filterSet.id"
          @click="loadFilter(filterSet)"
        >
          <template v-slot:prepend>
            <v-icon>mdi-filter-variant</v-icon>
          </template>

          <v-list-item-title>{{ filterSet.name }}</v-list-item-title>
          <v-list-item-subtitle>
            {{ filterSet.description || 'No description' }}
          </v-list-item-subtitle>
          <v-list-item-subtitle class="text-caption">
            Created {{ formatDate(filterSet.createdAt) }}
          </v-list-item-subtitle>

          <template v-slot:append>
            <v-btn
              icon
              size="small"
              variant="text"
              @click.stop="deleteFilter(filterSet.id)"
            >
              <v-icon size="small" color="error">mdi-delete</v-icon>
            </v-btn>
          </template>
        </v-list-item>
      </v-list>

      <v-empty-state
        v-else
        icon="mdi-filter-off"
        title="No saved filters"
        text="Save your current filter configuration to quickly apply it later."
        class="my-8"
      />
    </v-card-text>

    <v-divider />

    <v-card-actions>
      <v-btn
        variant="text"
        @click="$emit('close')"
      >
        Cancel
      </v-btn>
    </v-card-actions>
  </v-card>
</template>

<script setup>
import { computed } from 'vue'
import { useProjectFilters } from '@/composables/comms/useProjectFilters'

// Emits
const emit = defineEmits(['load', 'close'])

// Composables
const { savedFilters, deleteFilterSet } = useProjectFilters()

// Methods
function loadFilter(filterSet) {
  emit('load', filterSet)
}

function deleteFilter(filterId) {
  if (confirm('Delete this saved filter?')) {
    deleteFilterSet(filterId)
  }
}

function formatDate(dateString) {
  const date = new Date(dateString)
  const now = new Date()
  const diffTime = Math.abs(now - date)
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
  
  if (diffDays < 1) {
    return 'today'
  } else if (diffDays === 1) {
    return 'yesterday'
  } else if (diffDays < 7) {
    return `${diffDays} days ago`
  } else {
    return date.toLocaleDateString()
  }
}
</script>