<!-- client/src/components/comms/projects/detail/tabs/ProjectStagesTab.vue -->
<template>
  <v-card-text>
    <!-- Current Stage Progress -->
    <div class="mb-6">
      <div class="d-flex align-center justify-space-between mb-2">
        <div class="text-subtitle-2">Project Progress</div>
        <div class="text-caption text-grey">
          Stage {{ currentStageIndex + 1 }} of {{ stages.length }}
        </div>
      </div>
      
      <v-progress-linear
        :model-value="progressPercentage"
        height="8"
        rounded
        color="primary"
      />
      
      <div class="text-caption text-center mt-2 text-grey">
        {{ progressPercentage }}% Complete
      </div>
    </div>
    
    <!-- Stages List -->
    <div class="text-subtitle-2 mb-3">Project Stages</div>
    
    <v-list density="compact" class="rounded">
      <draggable
        v-if="editing && canEdit"
        v-model="mutableStages"
        item-key="index"
        handle=".drag-handle"
        @change="handleStageReorder"
      >
        <template #item="{ element, index }">
          <v-list-item>
            <template v-slot:prepend>
              <v-icon class="drag-handle cursor-move">
                mdi-drag
              </v-icon>
              
              <v-icon 
                :color="getStageColor(index)"
                class="ml-2"
              >
                {{ getStageIcon(index) }}
              </v-icon>
            </template>
            
            <v-text-field
              v-model="mutableStages[index]"
              density="compact"
              variant="outlined"
              hide-details
              @update:model-value="handleStageEdit"
            />
            
            <template v-slot:append>
              <v-btn
                icon
                size="small"
                variant="text"
                color="error"
                :disabled="mutableStages.length <= 1"
                @click="removeStage(index)"
              >
                <v-icon>mdi-delete</v-icon>
              </v-btn>
            </template>
          </v-list-item>
        </template>
      </draggable>
      
      <!-- Read-only view -->
      <template v-else>
        <v-list-item
          v-for="(stage, index) in stages"
          :key="index"
          :class="{ 'bg-primary-lighten-5': index === currentStageIndex }"
        >
          <template v-slot:prepend>
            <v-icon :color="getStageColor(index)">
              {{ getStageIcon(index) }}
            </v-icon>
          </template>
          
          <v-list-item-title>
            {{ stage }}
            <v-chip
              v-if="index === currentStageIndex"
              size="x-small"
              color="primary"
              class="ml-2"
            >
              Current
            </v-chip>
          </v-list-item-title>
          
          <template v-slot:append v-if="!editing && canEdit">
            <v-btn
              v-if="index === currentStageIndex - 1"
              size="small"
              variant="text"
              color="warning"
              @click="moveToStage(index)"
            >
              Move Back
            </v-btn>
            
            <v-btn
              v-else-if="index === currentStageIndex + 1"
              size="small"
              variant="tonal"
              color="primary"
              @click="moveToStage(index)"
            >
              Move Forward
            </v-btn>
          </template>
        </v-list-item>
      </template>
    </v-list>
    
    <!-- Add Stage Button -->
    <v-btn
      v-if="editing && canEdit"
      variant="outlined"
      size="small"
      block
      class="mt-3"
      prepend-icon="mdi-plus"
      @click="addStage"
    >
      Add Stage
    </v-btn>
    
    <!-- Stage Templates -->
    <div v-if="editing && canEdit" class="mt-4">
      <v-divider class="mb-4" />
      
      <div class="text-caption text-grey mb-2">Quick Templates</div>
      
      <v-chip-group>
        <v-chip
          v-for="template in stageTemplates"
          :key="template.name"
          size="small"
          @click="applyTemplate(template)"
        >
          {{ template.name }}
        </v-chip>
      </v-chip-group>
    </div>
  </v-card-text>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import draggable from 'vuedraggable'

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

// State
const mutableStages = ref([])

// Stage templates
const stageTemplates = [
  {
    name: 'Basic',
    stages: ['Not Started', 'In Progress', 'Complete']
  },
  {
    name: 'Review Process',
    stages: ['Draft', 'Review', 'Revisions', 'Final', 'Approved']
  },
  {
    name: 'Development',
    stages: ['Planning', 'Design', 'Development', 'Testing', 'Deployment']
  }
]

// Computed
const stages = computed(() => {
  return props.editing 
    ? mutableStages.value 
    : (props.project.stages || [])
})

const currentStageIndex = computed(() => {
  return props.editing 
    ? (props.editedProject.currentStageIndex || 0)
    : (props.project.currentStageIndex || 0)
})

const progressPercentage = computed(() => {
  if (stages.value.length === 0) return 0
  return Math.round((currentStageIndex.value / (stages.value.length - 1)) * 100)
})

// Methods
function getStageIcon(index) {
  if (index < currentStageIndex.value) return 'mdi-check-circle'
  if (index === currentStageIndex.value) return 'mdi-circle-slice-6'
  return 'mdi-circle-outline'
}

function getStageColor(index) {
  if (index < currentStageIndex.value) return 'success'
  if (index === currentStageIndex.value) return 'primary'
  return 'grey'
}

function handleStageReorder() {
  emit('update', 'stages', [...mutableStages.value])
}

function handleStageEdit() {
  emit('update', 'stages', [...mutableStages.value])
}

function addStage() {
  mutableStages.value.push(`Stage ${mutableStages.value.length + 1}`)
  handleStageEdit()
}

function removeStage(index) {
  if (mutableStages.value.length <= 1) return
  
  mutableStages.value.splice(index, 1)
  
  // Adjust current stage index if needed
  if (currentStageIndex.value >= mutableStages.value.length) {
    emit('update', 'currentStageIndex', mutableStages.value.length - 1)
  }
  
  handleStageEdit()
}

function applyTemplate(template) {
  mutableStages.value = [...template.stages]
  emit('update', 'stages', [...template.stages])
  emit('update', 'currentStageIndex', 0)
}

function moveToStage(index) {
  emit('update', 'currentStageIndex', index)
}

// Watch for external changes
watch(() => props.editedProject.stages, (newStages) => {
  if (props.editing && newStages) {
    mutableStages.value = [...newStages]
  }
}, { immediate: true })
</script>

<style scoped>
.cursor-move {
  cursor: move;
}
</style>