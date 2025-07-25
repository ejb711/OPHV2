<!-- client/src/components/comms/projects/detail/tabs/info/ProjectStatusApproval.vue -->
<template>
  <v-row>
    <!-- Status Field -->
    <v-col cols="12" md="6">
      <div class="field-group">
        <label class="field-label">Status</label>
        <!-- Show status badge in view mode -->
        <div v-if="!editing" class="mt-2">
          <StatusBadge :status="displayStatus" />
          <p class="text-caption text-grey mt-2">
            {{ statusDescription }}
          </p>
        </div>
        <!-- Show status info and manual approval toggle in edit mode -->
        <div v-else>
          <div class="mt-2 mb-4">
            <StatusBadge :status="displayStatus" />
            <p class="text-caption text-grey mt-2">
              {{ statusDescription }}
            </p>
          </div>
          
          <!-- Manual pending approval toggle (only show if project is at 100% and requires approval) -->
          <v-alert
            v-if="canTogglePendingApproval"
            type="info"
            variant="tonal"
            density="compact"
            class="mb-3"
          >
            <v-switch
              v-model="localPendingApproval"
              color="primary"
              density="compact"
              hide-details
              @update:model-value="handlePendingApprovalChange"
            >
              <template v-slot:label>
                <span class="text-body-2">Mark as Pending Approval</span>
              </template>
            </v-switch>
          </v-alert>
        </div>
      </div>
    </v-col>
    
    <!-- Requires Approval Field -->
    <v-col cols="12" md="6">
      <div class="field-group">
        <label class="field-label">Approval Requirement</label>
        <!-- Show text in view mode -->
        <div v-if="!editing" class="mt-2">
          <v-chip
            :color="requiresApproval ? 'orange' : 'grey'"
            size="small"
            label
          >
            {{ requiresApproval ? 'Approval Required' : 'No Approval Needed' }}
          </v-chip>
        </div>
        <!-- Show switch in edit mode -->
        <v-switch
          v-else
          v-model="localRequiresApproval"
          color="primary"
          density="comfortable"
          hide-details
          @update:model-value="$emit('update:requiresApproval', $event)"
        >
          <template v-slot:label>
            <div>
              <div class="font-weight-medium">Requires Approval</div>
              <div class="text-caption text-grey">
                Project must be approved before completion
              </div>
            </div>
          </template>
        </v-switch>
      </div>
    </v-col>
  </v-row>
</template>

<script setup>
import { ref, computed, watch, toRef } from 'vue'
import { useProjectStatus } from '@/composables/comms/useProjectStatus'
import StatusBadge from '@/components/comms/shared/StatusBadge.vue'

// Props
const props = defineProps({
  project: {
    type: Object,
    required: true
  },
  status: {
    type: String,
    default: ''
  },
  requiresApproval: {
    type: Boolean,
    default: false
  },
  editing: {
    type: Boolean,
    default: false
  }
})

// Emits
const emit = defineEmits(['update:status', 'update:requiresApproval'])

// Use project status composable
const projectRef = toRef(props, 'project')
const { 
  progressPercentage, 
  calculatedStatus,
  hasPendingApprovalStage,
  pendingApprovalCompleted
} = useProjectStatus(projectRef)

// Local state
const localRequiresApproval = ref(props.requiresApproval)
const localPendingApproval = ref(props.status === 'pending_approval')

// Computed
const displayStatus = computed(() => {
  // If manually set to pending_approval, show that
  if (localPendingApproval.value && props.editing) {
    return 'pending_approval'
  }
  // Otherwise use calculated status
  return calculatedStatus.value
})

const statusDescription = computed(() => {
  const progress = progressPercentage.value
  
  if (displayStatus.value === 'pending_approval') {
    return 'Project is awaiting approval'
  }
  
  if (displayStatus.value === 'completed') {
    return 'All stages completed' + (pendingApprovalCompleted.value ? ' and approved' : '')
  }
  
  if (displayStatus.value === 'not_started') {
    return 'No stages have been started'
  }
  
  return `${progress}% complete (${displayStatus.value.replace('_', ' ')})`
})

const canTogglePendingApproval = computed(() => {
  // Can toggle to pending approval if:
  // 1. Progress is 100%
  // 2. Project requires approval
  // 3. Not already completed (approved)
  return progressPercentage.value === 100 && 
         (localRequiresApproval.value || hasPendingApprovalStage.value) &&
         calculatedStatus.value !== 'completed'
})

// Methods
function handlePendingApprovalChange(value) {
  if (value) {
    emit('update:status', 'pending_approval')
  } else {
    // Clear the manual status override
    emit('update:status', '')
  }
}

// Watchers
watch(() => props.requiresApproval, (newVal) => {
  localRequiresApproval.value = newVal
})

watch(() => props.status, (newVal) => {
  localPendingApproval.value = newVal === 'pending_approval'
})
</script>

<style scoped>
/* Ensure switch labels are properly styled */
.v-switch :deep(.v-label) {
  opacity: 1 !important;
}

/* Alert styling */
.v-alert {
  border: 1px solid rgba(33, 150, 243, 0.3);
}
</style>