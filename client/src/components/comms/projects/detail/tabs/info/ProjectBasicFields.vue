<!-- client/src/components/comms/projects/detail/tabs/info/ProjectBasicFields.vue -->
<!-- Fixed height textarea implementation -->
<template>
  <div>
    <!-- Title Field -->
    <div class="field-group mb-4">
      <label class="field-label">
        Project Title
        <span v-if="editing" class="text-error">*</span>
      </label>
      <v-text-field
        :model-value="title"
        :readonly="!editing"
        :variant="editing ? 'outlined' : 'plain'"
        :rules="editing ? [rules.required] : []"
        density="comfortable"
        @update:model-value="$emit('update:title', $event)"
      />
    </div>
    
    <!-- Description Field -->
    <div class="field-group">
      <label class="field-label">Description</label>
      
      <!-- Display mode using div -->
      <div 
        v-if="!editing" 
        class="description-display"
      >
        {{ description || 'No description provided' }}
      </div>
      
      <!-- Edit mode using fixed height textarea -->
      <v-textarea
        v-else
        :model-value="description"
        variant="outlined"
        :rows="10"
        :no-resize="false"
        density="comfortable"
        hide-details
        class="description-textarea-fixed"
        @update:model-value="$emit('update:description', $event)"
      />
    </div>
  </div>
</template>

<script setup>
// Props
defineProps({
  title: {
    type: String,
    default: ''
  },
  description: {
    type: String,
    default: ''
  },
  editing: {
    type: Boolean,
    default: false
  },
  rules: {
    type: Object,
    required: true
  }
})

// Emits
defineEmits(['update:title', 'update:description'])
</script>

<style scoped>
/* Title field styling */
.field-group .v-field--variant-plain .v-field__input {
  color: rgba(0, 0, 0, 0.87) !important;
  font-size: 1rem !important;
}

/* Description display styling */
.description-display {
  padding: 12px 0;
  line-height: 1.5;
  color: rgba(0, 0, 0, 0.87);
  font-size: 1rem;
  max-height: 300px;
  overflow-y: auto;
  white-space: pre-wrap;
  word-break: break-word;
  /* Match the visual style of other plain fields */
  border-bottom: 1px solid rgba(0, 0, 0, 0.12);
}

/* Fixed height textarea styling */
.description-textarea-fixed .v-field__input {
  height: 250px !important;
  max-height: 250px !important;
  overflow-y: auto !important;
}

/* Style scrollbar for both display and edit modes */
.description-display::-webkit-scrollbar,
.description-textarea-fixed .v-field__input::-webkit-scrollbar {
  width: 6px;
}

.description-display::-webkit-scrollbar-track,
.description-textarea-fixed .v-field__input::-webkit-scrollbar-track {
  background: #f1f1f1;
  border-radius: 3px;
}

.description-display::-webkit-scrollbar-thumb,
.description-textarea-fixed .v-field__input::-webkit-scrollbar-thumb {
  background: #888;
  border-radius: 3px;
}

.description-display::-webkit-scrollbar-thumb:hover,
.description-textarea-fixed .v-field__input::-webkit-scrollbar-thumb:hover {
  background: #555;
}

/* Ensure consistent spacing */
.field-group {
  margin-bottom: 16px;
}

.field-group:last-child {
  margin-bottom: 0;
}
</style>