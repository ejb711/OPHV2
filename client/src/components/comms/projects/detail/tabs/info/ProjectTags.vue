<!-- client/src/components/comms/projects/detail/tabs/info/ProjectTags.vue -->
<template>
  <div class="field-group">
    <label class="field-label">Tags</label>
    <v-combobox
      :model-value="tags"
      :readonly="!editing"
      :variant="editing ? 'outlined' : 'plain'"
      chips
      :closable-chips="editing"
      multiple
      density="comfortable"
      :hide-details="!editing"
      :hint="editing ? 'Press enter to add tags' : ''"
      :persistent-hint="editing"
      @update:model-value="$emit('update:tags', $event)"
    />
  </div>
</template>

<script setup>
// Props
defineProps({
  tags: {
    type: Array,
    default: () => []
  },
  editing: {
    type: Boolean,
    default: false
  }
})

// Emits
defineEmits(['update:tags'])
</script>

<style scoped>
/* Component-specific styles are handled by comms-dashboard.css */

/* Ensure chips in view mode don't appear interactive */
.field-group .v-combobox--readonly .v-chip {
  cursor: default !important;
}

/* Remove hover effects on readonly chips */
.field-group .v-combobox--readonly .v-chip:hover {
  opacity: 1 !important;
}
</style>