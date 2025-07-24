<!-- client/src/components/comms/search/CommsSearchHistoryTab.vue -->
<template>
  <div>
    <div class="d-flex justify-space-between align-center mb-3">
      <p class="text-body-2 text-grey-darken-1">
        Recent searches:
      </p>
      <v-btn
        v-if="searchHistory.length > 0"
        size="small"
        variant="text"
        color="error"
        @click="$emit('clear')"
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
        @click="$emit('update:searchQuery', item)"
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
  </div>
</template>

<script setup>
// Props
defineProps({
  searchQuery: {
    type: String,
    default: ''
  },
  searchHistory: {
    type: Array,
    default: () => []
  }
})

// Emits
defineEmits(['update:searchQuery', 'clear'])
</script>