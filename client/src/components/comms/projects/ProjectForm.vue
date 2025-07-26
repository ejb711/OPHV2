<!-- client/src/components/comms/projects/ProjectForm.vue -->
<template>
  <v-dialog
    v-model="dialogOpen"
    max-width="800"
    persistent
    class="create-project-dialog"
  >
    <v-card class="create-project-dialog">
      <!-- Header -->
      <v-card-title class="d-flex align-center pa-6 bg-grey-lighten-5">
        <div class="d-flex align-center">
          <div class="rounded-lg pa-2 mr-4" style="background-color: rgba(25, 118, 210, 0.1);">
            <v-icon size="28" color="primary">mdi-folder-plus</v-icon>
          </div>
          <div>
            <h2 class="text-h5 font-weight-bold text-grey-darken-3 mb-1">Create New Project</h2>
            <p class="text-body-2 text-grey-darken-1 mb-0">{{ currentStepDescription }}</p>
          </div>
        </div>
        <v-spacer />
        <v-btn
          icon="mdi-close"
          variant="text"
          size="small"
          @click="handleCancel"
          :disabled="saving"
        />
      </v-card-title>

      <v-divider />

      <!-- Stepper -->
      <ProjectFormStepper
        :current-step="currentStep"
        :steps="steps"
      />

      <v-divider />

      <!-- Form Content -->
      <v-card-text class="form-container">
        <ProjectFormStep1
          v-show="currentStep === 1"
          ref="step1Ref"
          v-model="step1Valid"
          :form-data="formData"
          @update:form-data="updateFormData"
          @coordinator-auto-selected="onCoordinatorAutoSelected"
        />

        <ProjectFormStep2
          v-show="currentStep === 2"
          ref="step2Ref"
          v-model="step2Valid"
          :form-data="formData"
          @update:form-data="updateFormData"
        />

        <ProjectFormStep3
          v-show="currentStep === 3"
          ref="step3Ref"
          v-model="step3Valid"
          :form-data="formData"
          @update:form-data="updateFormData"
        />
      </v-card-text>

      <v-divider />

      <!-- Actions -->
      <v-card-actions class="pa-6 bg-grey-lighten-5">
        <v-btn
          variant="text"
          @click="handleCancel"
          :disabled="saving"
          class="text-grey-darken-1"
        >
          Cancel
        </v-btn>
        
        <v-spacer />
        
        <div class="d-flex ga-3">
          <v-btn
            v-if="currentStep > 1"
            variant="outlined"
            @click="previousStep"
            :disabled="saving"
            prepend-icon="mdi-arrow-left"
          >
            Back
          </v-btn>
          
          <v-btn
            v-if="currentStep < 3"
            color="primary"
            variant="elevated"
            @click="nextStep"
            :disabled="!currentStepValid || saving"
            append-icon="mdi-arrow-right"
            min-width="120"
          >
            Next
          </v-btn>
          
          <v-btn
            v-if="currentStep === 3"
            color="primary"
            variant="elevated"
            @click="handleSave"
            :loading="saving"
            :disabled="!allStepsValid || saving"
            prepend-icon="mdi-folder-plus"
            min-width="140"
          >
            Create Project
          </v-btn>
        </div>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script setup>
import { ref, computed, watch, onMounted, onUnmounted, nextTick } from 'vue'
import { useRouter } from 'vue-router'
import { useCommsProjects } from '@/composables/comms/useCommsProjects'
import { useSnackbar } from '@/composables/useSnackbar'
import { useAudit } from '@/composables/useAudit'
import ProjectFormStepper from './ProjectFormStepper.vue'
import ProjectFormStep1 from './ProjectFormStep1.vue'
import ProjectFormStep2 from './ProjectFormStep2.vue'
import ProjectFormStep3 from './ProjectFormStep3.vue'

// Props & Emits
const props = defineProps({
  modelValue: { type: Boolean, default: false }
})
const emit = defineEmits(['update:modelValue', 'created'])

// Composables
const router = useRouter()
const { createProject } = useCommsProjects()
const { showSuccess, showError } = useSnackbar()
const { logEvent } = useAudit()

// Dialog state
const dialogOpen = computed({
  get: () => props.modelValue,
  set: (value) => emit('update:modelValue', value)
})

// Form state
const currentStep = ref(1)
const saving = ref(false)
const step1Ref = ref(null)
const step2Ref = ref(null)
const step3Ref = ref(null)
const step1Valid = ref(false)
const step2Valid = ref(true)
const step3Valid = ref(true)

// Form data - Use a function to create initial state
const createInitialFormData = () => ({
  title: '', 
  description: '', 
  region: '', 
  coordinatorId: '', 
  priority: 'normal',
  deadline: null, 
  stages: [], 
  visibility: 'coordinator', 
  tags: [], 
  enableForum: true,
  requiresApproval: true,
  templateId: null
})

const formData = ref(createInitialFormData())

// Configuration
const steps = [
  { id: 1, title: 'Basic Info', subtitle: 'Project details' },
  { id: 2, title: 'Stages', subtitle: 'Project workflow' },
  { id: 3, title: 'Settings', subtitle: 'Additional options' }
]

// Computed
const currentStepDescription = computed(() => {
  return `Step ${currentStep.value} of 3 - ${steps[currentStep.value - 1]?.title}`
})

const currentStepValid = computed(() => {
  return [step1Valid.value, step2Valid.value, step3Valid.value][currentStep.value - 1]
})

const allStepsValid = computed(() => step1Valid.value && step2Valid.value && step3Valid.value)

// Methods
function updateFormData(newData) {
  // Merge the new data without causing reactive loops
  Object.assign(formData.value, newData)
}

function onCoordinatorAutoSelected(event) {
  console.log('Coordinator auto-selected:', event)
}

function handleCancel() {
  if (!saving.value) {
    resetForm()
    dialogOpen.value = false
  }
}

async function nextStep() {
  const currentRef = [step1Ref.value, step2Ref.value, step3Ref.value][currentStep.value - 1]
  if (currentRef) {
    const validation = await currentRef.validate()
    if (validation.valid && currentStep.value < 3) {
      currentStep.value++
    }
  }
}

function previousStep() {
  if (currentStep.value > 1) currentStep.value--
}

async function handleSave() {
  // Validate all steps
  const validations = await Promise.all([
    step1Ref.value?.validate(),
    step2Ref.value?.validate(),
    step3Ref.value?.validate()
  ])

  const invalidStep = validations.findIndex(v => !v?.valid)
  if (invalidStep !== -1) {
    currentStep.value = invalidStep + 1
    return
  }

  saving.value = true
  try {
    // Create the project
    const projectData = {
      ...formData.value,
      deadline: formData.value.deadline ? new Date(formData.value.deadline).toISOString() : null
    }
    
    const newProject = await createProject(projectData)
    
    // Log audit event
    await logEvent('project_created', {
      projectId: newProject.id,
      projectTitle: newProject.title,
      region: newProject.region,
      coordinatorId: newProject.coordinatorId
    })
    
    showSuccess('Project created successfully')
    emit('created', newProject)
    
    // Reset and close
    resetForm()
    dialogOpen.value = false
    
    // Navigate to the new project (if route exists)
    if (router.hasRoute('project-detail')) {
      router.push({ name: 'project-detail', params: { id: newProject.id } })
    }
  } catch (error) {
    console.error('Error creating project:', error)
    showError(error.message || 'Failed to create project')
  } finally {
    saving.value = false
  }
}

function resetForm() {
  // Reset step
  currentStep.value = 1
  
  // Reset validation states
  step1Valid.value = false
  step2Valid.value = true
  step3Valid.value = true
  
  // Reset form data by creating new object
  formData.value = createInitialFormData()
}

// Handle dialog close on escape
function handleEscape(event) {
  if (event.key === 'Escape' && !saving.value) {
    handleCancel()
  }
}

// Lifecycle
onMounted(() => {
  window.addEventListener('keydown', handleEscape)
})

onUnmounted(() => {
  window.removeEventListener('keydown', handleEscape)
})

// Watch for dialog open and reset form when opened
watch(dialogOpen, (isOpen) => {
  if (isOpen) {
    // Reset form when dialog opens
    nextTick(() => {
      resetForm()
    })
  }
})
</script>

<style scoped>
/* Card styling */
.create-project-dialog :deep(.v-card) {
  border-radius: 12px;
  overflow: hidden;
}

/* Header styling */
.v-card-title {
  border-bottom: 1px solid rgba(0, 0, 0, 0.08);
}

/* Form container */
.form-container {
  max-height: 60vh;
  overflow-y: auto;
  position: relative;
}

/* Ensure dropdowns are visible */
.form-container :deep(.v-overlay__content) {
  z-index: 2000 !important;
}

/* Actions footer */
.v-card-actions {
  border-top: 1px solid rgba(0, 0, 0, 0.08);
  position: sticky;
  bottom: 0;
  background: #fafafa;
  z-index: 1;
}

/* Dialog animations */
.create-project-dialog {
  transition: all 0.3s cubic-bezier(0.25, 0.8, 0.25, 1);
}

/* Button styling */
.v-btn {
  text-transform: none;
  font-weight: 500;
  letter-spacing: 0.02em;
}

/* Responsive adjustments */
@media (max-width: 599px) {
  .v-card-title {
    padding: 16px !important;
  }
  
  .v-card-title h2 {
    font-size: 1.125rem !important;
  }
  
  .form-container {
    max-height: 70vh;
  }
}
</style>