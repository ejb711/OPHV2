<!-- client/src/components/comms/projects/detail/tabs/components/StageEditorItem.vue -->
<template>
  <div class="stage-edit-item">
    <v-row dense align="center">
      <v-col cols="auto">
        <v-icon class="drag-handle">mdi-drag</v-icon>
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
          icon="mdi-delete"
          size="small"
          variant="text"
          color="error"
          :disabled="!canDelete"
          @click="$emit('remove')"
        >
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
  padding: 8px;
  margin-bottom: 8px;
  background-color: white;
  border-radius: 4px;
  border: 1px solid #e0e0e0;
}

.stage-edit-item:last-child {
  margin-bottom: 0;
}

.drag-handle {
  cursor: move;
  opacity: 0.5;
  transition: opacity 0.2s;
}

.drag-handle:hover {
  opacity: 1;
}
</style>