<!-- client/src/components/comms/projects/detail/tabs/components/StageEditorItem.vue -->
<template>
  <div class="stage-edit-item">
    <v-row dense align="center">
      <v-col cols="auto">
        <v-icon class="drag-handle" size="small">mdi-drag-vertical</v-icon>
      </v-col>
      
      <v-col cols="5">
        <v-text-field
          :model-value="stage.name"
          label="Stage Name"
          density="compact"
          variant="outlined"
          hide-details
          @update:model-value="updateField('name', $event)"
        />
      </v-col>
      
      <v-col cols="5">
        <v-text-field
          :model-value="stage.description"
          label="Description (optional)"
          density="compact"
          variant="outlined"
          hide-details
          @update:model-value="updateField('description', $event)"
        />
      </v-col>
      
      <v-col cols="auto">
        <v-btn
          icon
          size="small"
          variant="tonal"
          color="error"
          :disabled="!canDelete"
          @click="$emit('remove')"
        >
          <v-icon size="small">mdi-delete-outline</v-icon>
          <v-tooltip activator="parent" location="top">
            {{ canDelete ? 'Remove stage' : 'Cannot remove last stage' }}
          </v-tooltip>
        </v-btn>
      </v-col>
    </v-row>
  </div>
</template>

<script setup>
// Props
const props = defineProps({
  stage: {
    type: Object,
    required: true
  },
  index: {
    type: Number,
    required: true
  },
  canDelete: {
    type: Boolean,
    default: true
  }
})

// Emits
const emit = defineEmits(['update', 'remove'])

// Methods
function updateField(field, value) {
  emit('update', {
    ...props.stage,
    [field]: value
  })
}
</script>

<style scoped>
.stage-edit-item {
  padding: 12px;
  margin-bottom: 8px;
  background-color: white;
  border-radius: 8px;
  border: 1px solid #e0e0e0;
  transition: all 0.2s ease;
}

.stage-edit-item:hover {
  border-color: #bdbdbd;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
}

.stage-edit-item:last-child {
  margin-bottom: 0;
}

.drag-handle {
  cursor: move;
  color: #9e9e9e;
  transition: all 0.2s ease;
}

.drag-handle:hover {
  color: #616161;
  transform: scale(1.1);
}

/* Ensure button is visible */
.v-btn--icon {
  opacity: 0.7;
  transition: all 0.2s ease;
}

.v-btn--icon:hover:not(:disabled) {
  opacity: 1;
  transform: scale(1.05);
}

.v-btn--icon:disabled {
  opacity: 0.3;
}
</style>