<!-- client/src/components/comms/projects/detail/tabs/components/StageEditor.vue -->
<template>
  <div class="mt-6">
    <v-divider class="mb-4" />
    
    <div class="d-flex align-center justify-space-between mb-4">
      <h4 class="text-subtitle-1 font-weight-medium">
        Customize Stages
      </h4>
      <v-btn
        color="primary"
        variant="tonal"
        size="small"
        prepend-icon="mdi-plus"
        :disabled="stages.length >= 10"
        @click="$emit('add-stage')"
      >
        Add Stage
      </v-btn>
    </div>
    
    <v-alert
      type="info"
      variant="tonal"
      density="compact"
      class="mb-4"
    >
      You can customize stage names and add descriptions. 
      Drag stages to reorder them.
    </v-alert>
    
    <!-- Stage Editor List -->
    <div class="stage-editor">
      <StageEditorItem
        v-for="(stage, index) in stages"
        :key="`edit-${index}`"
        :stage="stage"
        :index="index"
        :can-delete="stages.length > 1"
        @update="updateStage(index, $event)"
        @remove="$emit('remove-stage', index)"
      />
    </div>
  </div>
</template>

<script setup>
import StageEditorItem from './StageEditorItem.vue'

// Props
const props = defineProps({
  stages: {
    type: Array,
    required: true
  }
})

// Emits
const emit = defineEmits(['add-stage', 'remove-stage', 'update-stage'])

// Methods
function updateStage(index, updates) {
  emit('update-stage', { index, updates })
}
</script>

<style scoped>
.stage-editor {
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  padding: 16px;
  background-color: #fafafa;
}
</style>