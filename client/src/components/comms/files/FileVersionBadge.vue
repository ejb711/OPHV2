<!-- client/src/components/comms/files/FileVersionBadge.vue -->
<template>
  <span>
    <!-- Always show "Current" if it's the only version, regardless of version number -->
    <v-chip 
      v-if="isSingle" 
      size="x-small" 
      color="blue-grey"
      variant="outlined"
      class="ml-2 version-chip"
    >
      <v-icon size="x-small" start>mdi-file-check</v-icon>
      Current
    </v-chip>
    <!-- Show "Latest" if it's the newest of multiple versions -->
    <v-chip 
      v-else-if="isLatest" 
      size="x-small" 
      color="success"
      class="ml-2 version-chip"
    >
      <v-icon size="x-small" start>mdi-check</v-icon>
      Latest
    </v-chip>
    <!-- Show version number for older versions -->
    <v-chip 
      v-else-if="file.version && file.version > 1" 
      size="x-small" 
      color="orange"
      class="ml-2 version-chip"
    >
      v{{ file.version }}
    </v-chip>
  </span>
</template>

<script setup>
// Props
defineProps({
  file: {
    type: Object,
    required: true
  },
  isLatest: {
    type: Boolean,
    default: false
  },
  isSingle: {
    type: Boolean,
    default: false
  },
  hasMultiple: {
    type: Boolean,
    default: false
  }
})
</script>

<style scoped>
/* Add subtle animation to version badges */
.version-chip {
  transition: all 0.2s ease;
}

/* Hover effect when parent is hovered */
:deep(.v-list-item:hover) .version-chip {
  transform: translateY(-1px);
}
</style>