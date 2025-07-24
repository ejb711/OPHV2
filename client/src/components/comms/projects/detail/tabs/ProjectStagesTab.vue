<!-- client/src/components/comms/projects/detail/tabs/ProjectStagesTab.vue -->
<template>
  <v-card-text class="pa-6">
    <!-- Current Progress -->
    <ProjectProgress
      :completed-stages="completedStages"
      :total-stages="totalStages"
      :progress-percentage="progressPercentage"
    />
    
    <!-- Stages Timeline -->
    <StageTimeline
      :stages="displayedStages"
      :current-stage-index="currentStageIndex"
      :editing="editing"
      :can-edit="canEdit"
      @toggle-complete="toggleStageComplete"
      @move-next="moveToNextStage"
    />
    
    <!-- Stage Editor (Edit Mode) -->
    <StageEditor
      v-if="editing && canEdit"
      :stages="editedProject.stages"
      @add-stage="addStage"
      @remove-stage="removeStage"
      @update-stage="updateStage"
    />
  </v-card-text>
</template>

<script setup>
import { computed } from 'vue'
import ProjectProgress from './components/ProjectProgress.vue'
import StageTimeline from './components/StageTimeline.vue'
import StageEditor from './components/StageEditor.vue'
import { useProjectStages } from '@/composables/useProjectStages'

// Props
const props = defineProps({
  project: {
    type: Object,
    required: true
  },
  editedProject: {
    type: Object,
    required: true
  },
  editing: {
    type: Boolean,
    default: false
  },
  canEdit: {
    type: Boolean,
    default: false
  }
})

// Emit
const emit = defineEmits(['update'])

// Use composable for all business logic
const {
  displayedStages,
  currentStageIndex,
  totalStages,
  completedStages,
  progressPercentage,
  toggleStageComplete,
  moveToNextStage,
  addStage,
  removeStage,
  updateStage
} = useProjectStages(props, emit)
</script>