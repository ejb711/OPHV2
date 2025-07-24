<!-- client/src/components/comms/projects/detail/tabs/components/StageTimelineItem.vue -->
<template>
  <v-timeline-item
    :dot-color="stageColor"
    :icon="stageIcon"
    :size="isCurrentStage ? 'large' : 'default'"
  >
    <!-- Stage Content -->
    <div class="stage-item">
      <div class="d-flex align-center justify-space-between">
        <div class="flex-grow-1">
          <!-- Stage Name -->
          <div class="d-flex align-center gap-2">
            <h5 class="text-subtitle-2 font-weight-medium">
              {{ stage.name }}
            </h5>
            <v-chip
              v-if="isCurrentStage"
              color="primary"
              size="x-small"
            >
              Current
            </v-chip>
          </div>
          
          <!-- Stage Description -->
          <p 
            v-if="stage.description" 
            class="text-body-2 text-grey-darken-1 mt-1"
          >
            {{ stage.description }}
          </p>
          
          <!-- Stage Dates -->
          <div class="text-caption text-grey mt-2">
            <div v-if="stage.startedAt">
              Started: {{ formatDate(stage.startedAt) }}
            </div>
            <div v-if="stage.completedAt">
              Completed: {{ formatDate(stage.completedAt) }}
            </div>
            <div v-if="stage.estimatedDuration && !stage.completedAt">
              Estimated duration: {{ stage.estimatedDuration }} days
            </div>
          </div>
        </div>
        
        <!-- Stage Actions (Available when user has edit permissions) -->
        <div v-if="canEdit" class="ml-4">
          <v-btn-group density="compact">
            <v-btn
              icon="mdi-check"
              size="small"
              :color="stage.completed ? 'success' : 'default'"
              :variant="stage.completed ? 'flat' : 'outlined'"
              @click="$emit('toggle-complete')"
            >
              <v-icon size="small">
                {{ stage.completed ? 'mdi-check-circle' : 'mdi-circle-outline' }}
              </v-icon>
              <v-tooltip activator="parent" location="top">
                {{ stage.completed ? 'Mark as incomplete' : 'Mark as complete' }}
              </v-tooltip>
            </v-btn>
            
            <v-btn
              v-if="isCurrentStage && !isLastStage"
              icon="mdi-skip-next"
              size="small"
              variant="outlined"
              @click="$emit('move-next')"
            >
              <v-tooltip activator="parent" location="top">
                Move to next stage
              </v-tooltip>
            </v-btn>
          </v-btn-group>
        </div>
      </div>
    </div>
  </v-timeline-item>
</template>

<script setup>
import { computed } from 'vue'

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
  },
  totalStages: {
    type: Number,
    default: 0
  }
})

// Emits
defineEmits(['toggle-complete', 'move-next'])

// Computed
const isCurrentStage = computed(() => props.index === props.currentStageIndex)
const isLastStage = computed(() => props.index === props.totalStages - 1)

const stageColor = computed(() => {
  if (props.stage.completed) return 'success'
  if (isCurrentStage.value) return 'primary'
  if (props.index < props.currentStageIndex) return 'warning'
  return 'grey'
})

const stageIcon = computed(() => {
  if (props.stage.completed) return 'mdi-check-circle'
  if (isCurrentStage.value) return 'mdi-circle-slice-8'
  if (props.index < props.currentStageIndex) return 'mdi-alert-circle'
  return 'mdi-circle-outline'
})

// Methods
function formatDate(timestamp) {
  if (!timestamp) return ''
  
  try {
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp)
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    }).format(date)
  } catch (error) {
    return ''
  }
}
</script>

<style scoped>
.stage-item {
  padding: 16px;
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  margin-bottom: 16px;
  transition: all 0.3s ease;
}

.stage-item:hover {
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}
</style>