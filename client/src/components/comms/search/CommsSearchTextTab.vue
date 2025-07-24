<!-- client/src/components/comms/search/CommsSearchTextTab.vue -->
<template>
  <div class="position-relative">
    <!-- Overlay for coming soon -->
    <div class="coming-soon-overlay">
      <v-chip
        color="info"
        variant="flat"
        size="small"
        prepend-icon="mdi-wrench"
      >
        Under Development
      </v-chip>
    </div>
    
    <v-text-field
      :model-value="searchQuery"
      label="Search Query"
      variant="outlined"
      density="comfortable"
      clearable
      autofocus
      persistent-hint
      hint="Enter keywords to search in project titles, descriptions, and tags"
      class="mb-4"
      @update:model-value="$emit('update:searchQuery', $event)"
    />

    <div class="mb-4">
      <p class="text-body-2 text-grey-darken-1 mb-2">
        Search in:
      </p>
      <v-chip-group
        :model-value="searchFields"
        multiple
        color="primary"
        variant="outlined"
        @update:model-value="$emit('update:searchFields', $event)"
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
        :model-value="searchMode"
        inline
        hide-details
        @update:model-value="$emit('update:searchMode', $event)"
      >
        <v-radio label="All keywords" value="all" />
        <v-radio label="Any keyword" value="any" />
      </v-radio-group>
    </div>

    <CommsSearchAdvancedCriteria
      v-model="localAdvancedCriteria"
      class="mb-4"
    />

    <div>
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
            @click="$emit('applyQuickSearch', quick.id)"
          >
            <v-icon start>{{ quick.icon }}</v-icon>
            {{ quick.name }}
          </v-btn>
        </v-col>
      </v-row>
    </div>
  </div>
</template>

<script setup>
import { ref, watch } from 'vue'
import CommsSearchAdvancedCriteria from './CommsSearchAdvancedCriteria.vue'

// Props
const props = defineProps({
  searchQuery: {
    type: String,
    default: ''
  },
  searchFields: {
    type: Array,
    default: () => ['title', 'description', 'tags']
  },
  searchMode: {
    type: String,
    default: 'all'
  },
  advancedCriteria: {
    type: Object,
    default: () => ({})
  },
  quickSearches: {
    type: Array,
    default: () => []
  }
})

// Emits
const emit = defineEmits([
  'update:searchQuery',
  'update:searchFields',
  'update:searchMode',
  'update:advancedCriteria',
  'applyQuickSearch'
])

// Local state for advanced criteria
const localAdvancedCriteria = ref({ ...props.advancedCriteria })

// Watch for changes to sync back
watch(localAdvancedCriteria, (newVal) => {
  emit('update:advancedCriteria', newVal)
}, { deep: true })

// Watch for external changes
watch(() => props.advancedCriteria, (newVal) => {
  localAdvancedCriteria.value = { ...newVal }
}, { deep: true })
</script>

<style scoped>
.position-relative {
  position: relative;
}

.coming-soon-overlay {
  position: absolute;
  top: -10px;
  right: 0;
  z-index: 10;
}
</style>