<!-- client/src/components/comms/projects/detail/tabs/components/StageTimeline.vue -->
<template>
  <div class="stages-container">
    <h4 class="text-subtitle-1 font-weight-medium mb-4">
      Project Stages
    </h4>
    
    <v-timeline
      side="end"
      density="compact"
      class="stage-timeline"
    >
      <StageTimelineItem
        v-for="(stage, index) in stages"
        :key="index"
        :stage="stage"
        :index="index"
        :current-stage-index="currentStageIndex"
        :editing="editing"
        :can-edit="canEdit"
        @toggle-complete="$emit('toggle-complete', index)"
        @move-next="$emit('move-next')"
      />
    </v-timeline>
  </div>
</template>

<script setup>
import StageTimelineItem from './StageTimelineItem.vue'

// Props
defineProps({
  stages: {
    type: Array,
    required: true
  },
  currentStageIndex: {
    type: Number,
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

// Emits
defineEmits(['toggle-complete', 'move-next'])
</script>

<style scoped>
.stage-timeline {
  margin-left: 12px;
}
</style>