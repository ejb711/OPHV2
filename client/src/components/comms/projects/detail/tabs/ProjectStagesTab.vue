<!-- client/src/components/comms/projects/detail/tabs/ProjectStagesTab.vue -->
<template>
  <v-card-text class="pa-6">
    <!-- Current Progress -->
    <div class="mb-6">
      <div class="d-flex align-center justify-space-between mb-2">
        <label class="field-label">Project Progress</label>
        <span class="text-caption text-grey-darken-1">
          {{ completedStages }} of {{ totalStages }} stages completed
        </span>
      </div>
      
      <v-progress-linear
        :model-value="progressPercentage"
        height="24"
        rounded
        color="primary"
      >
        <template v-slot:default="{ value }">
          <strong>{{ Math.ceil(value) }}%</strong>
        </template>
      </v-progress-linear>
    </div>
    
    <!-- Stages List -->
    <div class="stages-container">
      <h4 class="text-subtitle-1 font-weight-medium mb-4">
        Project Stages
      </h4>
      
      <v-timeline
        side="end"
        density="compact"
        class="stage-timeline"
      >
        <v-timeline-item
          v-for="(stage, index) in displayedStages"
          :key="index"
          :dot-color="getStageColor(stage, index)"
          :icon="getStageIcon(stage, index)"
          :size="index === currentStageIndex ? 'large' : 'default'"
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
                    v-if="index === currentStageIndex"
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
              
              <!-- Stage Actions (Edit Mode) -->
              <div v-if="editing && canEdit" class="ml-4">
                <v-btn-group density="compact">
                  <v-btn
                    icon="mdi-check"
                    size="small"
                    :color="stage.completed ? 'success' : 'default'"
                    :variant="stage.completed ? 'flat' : 'outlined'"
                    @click="toggleStageComplete(index)"
                  >
                    <v-icon size="small">
                      {{ stage.completed ? 'mdi-check-circle' : 'mdi-circle-outline' }}
                    </v-icon>
                    <v-tooltip activator="parent" location="top">
                      {{ stage.completed ? 'Mark as incomplete' : 'Mark as complete' }}
                    </v-tooltip>
                  </v-btn>
                  
                  <v-btn
                    v-if="index === currentStageIndex"
                    icon="mdi-skip-next"
                    size="small"
                    variant="outlined"
                    @click="moveToNextStage"
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
      </v-timeline>
      
      <!-- Edit Stages (Edit Mode) -->
      <div v-if="editing && canEdit" class="mt-6">
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
            @click="addStage"
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
        
        <!-- Stage Editor -->
        <div class="stage-editor">
          <div
            v-for="(stage, index) in editedProject.stages"
            :key="`edit-${index}`"
            class="stage-edit-item"
          >
            <v-row dense align="center">
              <v-col cols="auto">
                <v-icon>mdi-drag</v-icon>
              </v-col>
              
              <v-col cols="5">
                <v-text-field
                  v-model="stage.name"
                  label="Stage Name"
                  density="compact"
                  variant="outlined"
                  hide-details
                />
              </v-col>
              
              <v-col cols="5">
                <v-text-field
                  v-model="stage.description"
                  label="Description (optional)"
                  density="compact"
                  variant="outlined"
                  hide-details
                />
              </v-col>
              
              <v-col cols="auto">
                <v-btn
                  icon="mdi-delete"
                  size="small"
                  variant="text"
                  color="error"
                  @click="removeStage(index)"
                />
              </v-col>
            </v-row>
          </div>
        </div>
      </div>
    </div>
  </v-card-text>
</template>

<script setup>
import { computed } from 'vue'

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

// Computed
const displayedStages = computed(() => {
  return props.editing ? props.editedProject.stages : props.project.stages || []
})

const currentStageIndex = computed(() => {
  return props.editing 
    ? props.editedProject.currentStageIndex || 0 
    : props.project.currentStageIndex || 0
})

const totalStages = computed(() => displayedStages.value.length)

const completedStages = computed(() => {
  return displayedStages.value.filter(stage => stage.completed).length
})

const progressPercentage = computed(() => {
  if (totalStages.value === 0) return 0
  return (completedStages.value / totalStages.value) * 100
})

// Methods
function getStageColor(stage, index) {
  if (stage.completed) return 'success'
  if (index === currentStageIndex.value) return 'primary'
  if (index < currentStageIndex.value) return 'warning'
  return 'grey'
}

function getStageIcon(stage, index) {
  if (stage.completed) return 'mdi-check-circle'
  if (index === currentStageIndex.value) return 'mdi-circle-slice-8'
  if (index < currentStageIndex.value) return 'mdi-alert-circle'
  return 'mdi-circle-outline'
}

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

function toggleStageComplete(index) {
  const stages = [...props.editedProject.stages]
  stages[index].completed = !stages[index].completed
  
  if (stages[index].completed) {
    stages[index].completedAt = new Date()
  } else {
    stages[index].completedAt = null
  }
  
  emit('update', { stages })
}

function moveToNextStage() {
  const nextIndex = currentStageIndex.value + 1
  if (nextIndex < totalStages.value) {
    // Mark current stage as completed
    const stages = [...props.editedProject.stages]
    stages[currentStageIndex.value].completed = true
    stages[currentStageIndex.value].completedAt = new Date()
    
    // Update current stage index
    emit('update', { 
      stages,
      currentStageIndex: nextIndex 
    })
  }
}

function addStage() {
  const stages = [...props.editedProject.stages]
  stages.push({
    name: `Stage ${stages.length + 1}`,
    description: '',
    completed: false,
    startedAt: null,
    completedAt: null
  })
  
  emit('update', { stages })
}

function removeStage(index) {
  if (displayedStages.value.length <= 1) {
    return // Don't allow removing the last stage
  }
  
  const stages = [...props.editedProject.stages]
  stages.splice(index, 1)
  
  // Adjust current stage index if needed
  let newCurrentIndex = props.editedProject.currentStageIndex
  if (index <= newCurrentIndex && newCurrentIndex > 0) {
    newCurrentIndex--
  }
  
  emit('update', { 
    stages,
    currentStageIndex: newCurrentIndex
  })
}
</script>

<style scoped>
.stage-timeline {
  margin-left: 12px;
}

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

.stage-editor {
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  padding: 16px;
  background-color: #fafafa;
}

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
</style>