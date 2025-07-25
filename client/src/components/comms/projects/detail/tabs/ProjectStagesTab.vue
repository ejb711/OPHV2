<!-- client/src/components/comms/projects/detail/tabs/ProjectStagesTab.vue -->
<template>
  <v-card-text class="pa-6">
    <!-- Current Progress -->
    <ProjectProgress
      :completed-stages="completedStages"
      :total-stages="totalStages"
      :progress-percentage="progressPercentage"
    />
    
    <!-- Approval Settings -->
    <v-card 
      v-if="editing || localRequiresApproval"
      variant="outlined" 
      class="mb-6"
    >
      <v-card-text class="pa-4">
        <div class="d-flex align-center justify-space-between">
          <div class="flex-grow-1">
            <div class="font-weight-medium mb-1">Approval Settings</div>
            
            <!-- Edit mode: show toggle -->
            <v-switch
              v-if="editing"
              v-model="localRequiresApproval"
              color="primary"
              density="compact"
              hide-details
              @update:model-value="handleRequiresApprovalChange"
            >
              <template v-slot:label>
                <span class="text-body-2">Project requires approval before completion</span>
              </template>
            </v-switch>
            
            <!-- View mode: show status and approve button if needed -->
            <div v-else>
              <div class="text-body-2 text-grey-darken-1">
                {{ localRequiresApproval ? 'This project requires approval before completion' : 'No approval required' }}
              </div>
              
              <!-- Approve toggle for projects requiring approval -->
              <v-switch
                v-if="canToggleApproval"
                :model-value="isApproved"
                color="success"
                density="compact"
                hide-details
                class="mt-3"
                @update:model-value="handleProjectApprovedChange"
              >
                <template v-slot:label>
                  <span class="text-body-2 font-weight-medium">Project Approved</span>
                </template>
              </v-switch>
            </div>
            
            <!-- No manual pending approval toggle in edit mode -->
          </div>
          
          <div class="ml-3">
            <v-chip
              v-if="calculatedStatus === 'pending_approval' && localRequiresApproval"
              color="orange"
              variant="tonal"
              size="small"
              prepend-icon="mdi-clock-alert"
            >
              Pending Approval
            </v-chip>
            <v-chip
              v-else-if="isApproved"
              color="green"
              variant="tonal"
              size="small"
              prepend-icon="mdi-check-all"
            >
              Approved
            </v-chip>
          </div>
        </div>
      </v-card-text>
    </v-card>
    
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
import { computed, ref, watch } from 'vue'
import ProjectProgress from './components/ProjectProgress.vue'
import StageTimeline from './components/StageTimeline.vue'
import StageEditor from './components/StageEditor.vue'
import { useProjectStages } from '@/composables/useProjectStages'
import { useProjectStatus } from '@/composables/comms/useProjectStatus'

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

// Project reference for reactive updates
const projectRef = computed(() => props.project)

// Use the project status composable for consistent status calculation
const { 
  calculatedStatus,
  pendingApprovalCompleted
} = useProjectStatus(projectRef)

// Local state for approval
const localRequiresApproval = ref(props.editedProject.requiresApproval)
console.log('Initial localRequiresApproval:', localRequiresApproval.value, 'from editedProject:', props.editedProject.requiresApproval)

// Check if project is approved - based on isApproved field or status
const isApproved = computed(() => {
  // First check the explicit isApproved field
  if (props.project.isApproved !== undefined) {
    return props.project.isApproved
  }
  
  // Fallback to status-based check for backward compatibility
  if (localRequiresApproval.value) {
    // If requires approval and status is not pending_approval, consider it approved
    return props.project.status !== 'pending_approval' && props.project.status !== 'not_started'
  }
  return false
})

// Computed
const canToggleApproval = computed(() => {
  // Can toggle approval when project requires approval and user can edit
  const result = localRequiresApproval.value && props.canEdit && !props.editing
  console.log('canToggleApproval:', {
    result,
    localRequiresApproval: localRequiresApproval.value,
    canEdit: props.canEdit,
    editing: props.editing
  })
  return result
})

// Methods
function handleRequiresApprovalChange(value) {
  emit('update', { requiresApproval: value })
}

function handleProjectApprovedChange(value) {
  console.log('handleProjectApprovedChange called with value:', value)
  console.log('Current project:', props.project)
  console.log('localRequiresApproval:', localRequiresApproval.value)
  console.log('progressPercentage:', progressPercentage.value)
  
  // When toggling approval, we update the isApproved field and status
  const updates = { isApproved: value, direct: !props.editing }
  
  if (value) {
    // Approving: set appropriate status based on progress
    console.log('Approving project')
    if (progressPercentage.value === 100) {
      // If 100% complete, set to completed
      updates.status = 'completed'
    } else {
      // If in progress, remove any pending_approval status
      if (props.project.status === 'pending_approval') {
        updates.status = 'in_progress'
      }
    }
  } else {
    // Rejecting/removing approval: always set to pending_approval if requires approval
    if (localRequiresApproval.value) {
      console.log('Setting project to pending_approval')
      updates.status = 'pending_approval'
    }
  }
  
  emit('update', updates)
}

// Watchers
watch(() => props.editedProject.requiresApproval, (newVal) => {
  // Update requires approval when edited project changes
  if (newVal !== undefined) {
    localRequiresApproval.value = newVal
  }
})

watch(() => props.project.requiresApproval, (newVal) => {
  // Update requires approval when viewing project
  if (!props.editing && newVal !== undefined) {
    localRequiresApproval.value = newVal
  }
})
</script>