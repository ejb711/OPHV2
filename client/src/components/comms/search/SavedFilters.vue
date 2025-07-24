<!-- client/src/components/comms/search/SavedFilters.vue -->
<template>
  <div>
    <div class="d-flex justify-space-between align-center mb-3">
      <h4 class="text-body-1">Saved Filter Sets</h4>
    </div>

    <v-list
      v-if="savedFilters.length > 0"
      density="compact"
      class="border rounded"
    >
      <v-list-item
        v-for="filterSet in savedFilters"
        :key="filterSet.id"
        @click="$emit('load', filterSet.id)"
      >
        <template v-slot:prepend>
          <v-icon size="small">mdi-filter-variant</v-icon>
        </template>

        <v-list-item-title>{{ filterSet.name }}</v-list-item-title>
        <v-list-item-subtitle v-if="filterSet.description">
          {{ filterSet.description }}
        </v-list-item-subtitle>

        <template v-slot:append>
          <v-btn
            icon
            size="x-small"
            variant="text"
            @click.stop="$emit('delete', filterSet.id)"
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
      text="No saved filters yet"
    />
  </div>
</template>

<script setup>
import { useProjectFilters } from '@/composables/comms/useProjectFilters'

// Emits
defineEmits(['load', 'delete'])

// Composables
const { savedFilters } = useProjectFilters()
</script>

<style scoped>
.border {
  border: 1px solid rgba(0, 0, 0, 0.12);
}
</style>