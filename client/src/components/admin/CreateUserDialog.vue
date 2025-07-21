<!-- client/src/components/admin/CreateUserDialog.vue -->
<template>
  <v-dialog
    v-model="dialogOpen"
    :max-width="$vuetify.display.smAndDown ? '100%' : '650'"
    persistent
    scrollable
    :fullscreen="$vuetify.display.smAndDown"
    transition="dialog-bottom-transition"
  >
    <v-card class="create-user-dialog">
      <!-- Modern Header -->
      <div class="dialog-header">
        <div class="header-content">
          <div class="header-icon">
            <v-icon size="28" color="primary">mdi-account-plus</v-icon>
          </div>
          <div>
            <h2 class="header-title">Create New User</h2>
            <p class="header-subtitle">Add a new user to the system</p>
          </div>
        </div>
        <v-btn
          icon
          variant="text"
          size="small"
          @click="handleCancel"
          class="close-btn"
        >
          <v-icon>mdi-close</v-icon>
        </v-btn>
      </div>

      <!-- Modern Stepper -->
      <div class="stepper-container">
        <div class="stepper-wrapper">
          <div 
            class="stepper-step"
            :class="{ active: currentStep === 1, completed: currentStep > 1 }"
          >
            <div class="step-number">
              <v-icon v-if="currentStep > 1" size="20">mdi-check</v-icon>
              <span v-else>1</span>
            </div>
            <div class="step-info">
              <div class="step-title">Account Details</div>
              <div class="step-subtitle">Login credentials</div>
            </div>
          </div>
          
          <div class="stepper-divider" :class="{ completed: currentStep > 1 }"></div>
          
          <div 
            class="stepper-step"
            :class="{ active: currentStep === 2, completed: currentStep > 2 }"
          >
            <div class="step-number">
              <v-icon v-if="currentStep > 2" size="20">mdi-check</v-icon>
              <span v-else>2</span>
            </div>
            <div class="step-info">
              <div class="step-title">Profile Information</div>
              <div class="step-subtitle">Additional details</div>
            </div>
          </div>
        </div>
      </div>

      <!-- Form Content -->
      <v-card-text class="dialog-content">
        <v-window v-model="currentStep">
          <v-window-item :value="1">
            <v-form ref="step1Form" v-model="step1Valid">
              <AccountDetailsStep
                v-model="form"
                :available-roles="availableRoles"
                :show-password="showPassword"
                :show-confirm-password="showConfirmPassword"
                @toggle-password="showPassword = !showPassword"
                @toggle-confirm-password="showConfirmPassword = !showConfirmPassword"
                @generate-password="generatePassword"
              />
            </v-form>
          </v-window-item>

          <v-window-item :value="2">
            <v-form ref="step2Form" v-model="step2Valid">
              <ProfileDetailsStep
                v-model="form"
              />
            </v-form>
          </v-window-item>
        </v-window>
      </v-card-text>

      <!-- Modern Actions -->
      <v-card-actions class="dialog-actions">
        <v-btn
          variant="text"
          size="large"
          @click="handleCancel"
          :disabled="creating"
          class="cancel-btn"
        >
          Cancel
        </v-btn>
        <v-spacer />
        <v-btn
          v-if="currentStep > 1"
          variant="outlined"
          size="large"
          @click="handleBack"
          :disabled="creating"
          class="back-btn"
        >
          <v-icon start>mdi-arrow-left</v-icon>
          Back
        </v-btn>
        <v-btn
          color="primary"
          variant="elevated"
          size="large"
          @click="handleNext"
          :loading="creating"
          :disabled="creating"
          class="next-btn"
        >
          {{ currentStep === totalSteps ? 'Create User' : 'Continue' }}
          <v-icon end>
            {{ currentStep === totalSteps ? 'mdi-check' : 'mdi-arrow-right' }}
          </v-icon>
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import AccountDetailsStep from './user-form/AccountDetailsStep.vue'
import ProfileDetailsStep from './user-form/ProfileDetailsStep.vue'
import { useCreateUser } from '../../composables/useCreateUser'

const emit = defineEmits(['update:modelValue', 'user-created', 'showSnackbar'])
const props = defineProps({
  modelValue: {
    type: Boolean,
    default: false
  }
})

// Dialog state
const dialogOpen = computed({
  get: () => props.modelValue,
  set: (value) => emit('update:modelValue', value)
})

// Form refs
const step1Form = ref(null)
const step2Form = ref(null)
const step1Valid = ref(false)
const step2Valid = ref(false)

// Form management
const {
  form,
  currentStep,
  totalSteps,
  creating,
  showPassword,
  showConfirmPassword,
  availableRoles,
  resetForm,
  generatePassword,
  createUser
} = useCreateUser()

// Navigation handlers
const handleCancel = () => {
  resetForm()
  step1Valid.value = false
  step2Valid.value = false
  dialogOpen.value = false
}

const handleBack = () => {
  if (currentStep.value > 1) {
    currentStep.value--
  }
}

const handleNext = async () => {
  // Validate current step
  let isValid = false
  
  if (currentStep.value === 1 && step1Form.value) {
    const { valid } = await step1Form.value.validate()
    isValid = valid
  } else if (currentStep.value === 2 && step2Form.value) {
    const { valid } = await step2Form.value.validate()
    isValid = valid
  }

  if (!isValid) return

  if (currentStep.value < totalSteps) {
    currentStep.value++
  } else {
    const result = await createUser()
    if (result.success) {
      emit('showSnackbar', result.message)
      emit('user-created', result.userData)
      resetForm()
      step1Valid.value = false
      step2Valid.value = false
      dialogOpen.value = false
    } else {
      emit('showSnackbar', result.message, 'error')
    }
  }
}

// Reset form when dialog closes
watch(dialogOpen, (isOpen) => {
  if (!isOpen && !creating.value) {
    resetForm()
    currentStep.value = 1
    step1Valid.value = false
    step2Valid.value = false
  }
})
</script>

<style scoped>
/* Modern dialog styling */
.create-user-dialog {
  border-radius: 16px !important;
  overflow: hidden;
}

/* Header styling */
.dialog-header {
  background: linear-gradient(135deg, #f8f9fa 0%, #ffffff 100%);
  padding: 24px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  border-bottom: 1px solid #e0e0e0;
}

.header-content {
  display: flex;
  align-items: center;
  gap: 16px;
}

.header-icon {
  width: 48px;
  height: 48px;
  background: rgba(25, 118, 210, 0.1);
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.header-title {
  font-family: 'ITC Franklin Gothic', Arial, sans-serif;
  font-size: 1.5rem;
  font-weight: 600;
  color: #1a1a1a;
  margin: 0;
  line-height: 1.2;
}

.header-subtitle {
  font-family: 'Cambria', Georgia, serif;
  font-size: 0.875rem;
  color: #666;
  margin: 0;
  margin-top: 2px;
}

.close-btn {
  margin: -8px -8px -8px 0;
}

/* Modern stepper */
.stepper-container {
  background-color: #fafafa;
  padding: 20px 24px;
  border-bottom: 1px solid #e0e0e0;
}

.stepper-wrapper {
  display: flex;
  align-items: center;
  justify-content: center;
  max-width: 500px;
  margin: 0 auto;
}

.stepper-step {
  display: flex;
  align-items: center;
  gap: 12px;
  opacity: 0.6;
  transition: all 0.3s ease;
}

.stepper-step.active {
  opacity: 1;
}

.stepper-step.completed {
  opacity: 1;
}

.step-number {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: #e0e0e0;
  color: #666;
  font-weight: 600;
  font-size: 0.875rem;
  transition: all 0.3s ease;
}

.stepper-step.active .step-number {
  background-color: #1976d2;
  color: white;
  box-shadow: 0 0 0 4px rgba(25, 118, 210, 0.12);
}

.stepper-step.completed .step-number {
  background-color: #4caf50;
  color: white;
}

.step-info {
  display: none;
}

@media (min-width: 600px) {
  .step-info {
    display: block;
  }
  
  .step-title {
    font-family: 'ITC Franklin Gothic', Arial, sans-serif;
    font-size: 0.875rem;
    font-weight: 600;
    color: #1a1a1a;
    line-height: 1.3;
  }
  
  .step-subtitle {
    font-family: 'Cambria', Georgia, serif;
    font-size: 0.75rem;
    color: #666;
    margin-top: 2px;
  }
  
  .stepper-step.active .step-title {
    color: #1976d2;
  }
}

.stepper-divider {
  flex: 1;
  height: 2px;
  background-color: #e0e0e0;
  margin: 0 16px;
  position: relative;
  overflow: hidden;
}

.stepper-divider::after {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  height: 100%;
  width: 0%;
  background-color: #4caf50;
  transition: width 0.3s ease;
}

.stepper-divider.completed::after {
  width: 100%;
}

/* Content area */
.dialog-content {
  padding: 0 !important;
  background-color: #ffffff;
}

/* Action buttons */
.dialog-actions {
  padding: 20px 24px !important;
  background-color: #fafafa;
  border-top: 1px solid #e0e0e0;
  gap: 12px;
}

.cancel-btn {
  color: #666 !important;
  font-weight: 500;
}

.back-btn {
  border-color: #e0e0e0 !important;
  color: #666 !important;
}

.next-btn {
  min-width: 140px;
  font-weight: 600;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.next-btn:hover {
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.15);
}

/* Responsive adjustments */
@media (max-width: 599px) {
  .dialog-header {
    padding: 20px;
  }
  
  .stepper-container {
    padding: 16px 20px;
  }
  
  .dialog-actions {
    padding: 16px 20px !important;
  }
}
</style>