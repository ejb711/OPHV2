<!-- CreateUserDialog.vue - Enhanced with Merged Styling -->
<template>
  <v-dialog 
    v-model="dialogOpen" 
    :max-width="dialogWidth" 
    persistent
    :fullscreen="$vuetify.display.xs"
  >
    <v-card class="create-user-card">
      <!-- Header -->
      <v-card-title class="bg-primary text-white pa-4">
        <div class="d-flex align-center">
          <v-icon color="white" class="mr-3">mdi-account-plus</v-icon>
          <div>
            <div class="text-h6">Create New User</div>
            <div class="text-caption opacity-90">
              Step {{ currentStep }} of {{ totalSteps }}: {{ stepTitles[currentStep - 1] }}
            </div>
          </div>
        </div>
      </v-card-title>
      
      <!-- Progress Bar -->
      <v-progress-linear
        :model-value="(currentStep / totalSteps) * 100"
        color="primary"
        height="4"
      />

      <v-card-text class="pa-4 pa-md-6">
        <v-form ref="createUserFormRef" @submit.prevent="handleNext">
          
          <!-- Step 1: Account Information -->
          <div v-if="currentStep === 1" key="step1">
            <div class="form-header mb-4">
              <h3 class="form-title">Account Information</h3>
              <p class="form-subtitle">Basic login credentials and role assignment</p>
            </div>

            <v-row dense>
              <!-- Email -->
              <v-col cols="12">
                <div class="field-group">
                  <label class="field-label">Email Address *</label>
                  <v-text-field
                    v-model="form.email"
                    type="email"
                    variant="solo-filled"
                    density="compact"
                    flat
                    required
                    placeholder="Enter email address"
                    class="auth-field"
                    :rules="emailRules"
                    hide-details="auto"
                  />
                </div>
              </v-col>

              <!-- Display Name -->
              <v-col cols="12">
                <div class="field-group">
                  <label class="field-label">Display Name *</label>
                  <v-text-field
                    v-model="form.displayName"
                    variant="solo-filled"
                    density="compact"
                    flat
                    required
                    placeholder="Enter display name"
                    class="auth-field"
                    :rules="displayNameRules"
                    hide-details="auto"
                  />
                </div>
              </v-col>

              <!-- Password -->
              <v-col cols="12" :md="$vuetify.display.mdAndUp ? 6 : 12">
                <div class="field-group">
                  <label class="field-label">Password *</label>
                  <v-text-field
                    v-model="form.password"
                    :type="showPassword ? 'text' : 'password'"
                    variant="solo-filled"
                    density="compact"
                    flat
                    required
                    placeholder="Enter password"
                    class="auth-field"
                    :rules="passwordRules"
                    hide-details="auto"
                  >
                    <template #append-inner>
                      <v-btn
                        :icon="showPassword ? 'mdi-eye-off' : 'mdi-eye'"
                        size="small"
                        variant="text"
                        @click="showPassword = !showPassword"
                        title="Toggle password visibility"
                      />
                      <v-btn
                        icon="mdi-dice-6"
                        size="small"
                        variant="text"
                        color="primary"
                        @click="generatePassword"
                        title="Generate random password"
                      />
                    </template>
                  </v-text-field>
                </div>
              </v-col>

              <!-- Confirm Password -->
              <v-col cols="12" :md="$vuetify.display.mdAndUp ? 6 : 12">
                <div class="field-group">
                  <label class="field-label">Confirm Password *</label>
                  <v-text-field
                    v-model="form.confirmPassword"
                    :type="showConfirmPassword ? 'text' : 'password'"
                    variant="solo-filled"
                    density="compact"
                    flat
                    required
                    placeholder="Confirm password"
                    class="auth-field"
                    :rules="confirmPasswordRules"
                    hide-details="auto"
                  >
                    <template #append-inner>
                      <v-btn
                        :icon="showConfirmPassword ? 'mdi-eye-off' : 'mdi-eye'"
                        size="small"
                        variant="text"
                        @click="showConfirmPassword = !showConfirmPassword"
                        title="Toggle password visibility"
                      />
                    </template>
                  </v-text-field>
                </div>
              </v-col>

              <!-- Role -->
              <v-col cols="12">
                <div class="field-group">
                  <label class="field-label">Role *</label>
                  <v-select
                    v-model="form.role"
                    :items="availableRoles"
                    item-title="name"
                    item-value="id"
                    variant="solo"
                    density="compact"
                    placeholder="Select user role"
                    class="simple-select"
                    :rules="roleRules"
                    hide-details="auto"
                  >
                    <template #item="{ props, item }">
                      <v-list-item v-bind="props">
                        <template #prepend>
                          <v-icon :color="item.raw.color || 'primary'">
                            {{ item.raw.icon || 'mdi-account' }}
                          </v-icon>
                        </template>
                        <v-list-item-title>{{ item.raw.name }}</v-list-item-title>
                        <v-list-item-subtitle>{{ item.raw.description }}</v-list-item-subtitle>
                      </v-list-item>
                    </template>
                  </v-select>
                </div>
              </v-col>
            </v-row>
          </div>

          <!-- Step 2: Profile Details -->
          <div v-if="currentStep === 2" key="step2">
            <div class="form-header mb-4">
              <h3 class="form-title">Profile Details</h3>
              <p class="form-subtitle">Additional information and contact details (optional)</p>
            </div>

            <v-row dense>
              <!-- Phone -->
              <v-col cols="12" :md="$vuetify.display.mdAndUp ? 6 : 12">
                <div class="field-group">
                  <label class="field-label">Phone Number</label>
                  <v-text-field
                    v-model="formattedPhone"
                    variant="solo-filled"
                    density="compact"
                    flat
                    placeholder="(XXX) XXX-XXXX"
                    class="auth-field"
                    :rules="phoneRules"
                    maxlength="14"
                    hide-details="auto"
                  />
                </div>
              </v-col>

              <!-- Region -->
              <v-col cols="12" :md="$vuetify.display.mdAndUp ? 6 : 12">
                <div class="field-group">
                  <label class="field-label">Region</label>
                  <v-select
                    v-model="form.region"
                    :items="regionOptions"
                    variant="solo"
                    density="compact"
                    placeholder="Select region"
                    class="simple-select"
                    hide-details="auto"
                    clearable
                  />
                </div>
              </v-col>

              <!-- Department -->
              <v-col cols="12" :md="$vuetify.display.mdAndUp ? 6 : 12">
                <div class="field-group">
                  <label class="field-label">Department</label>
                  <v-text-field
                    v-model="form.department"
                    variant="solo-filled"
                    density="compact"
                    flat
                    placeholder="e.g., Public Health"
                    class="auth-field"
                    hide-details="auto"
                  />
                </div>
              </v-col>

              <!-- Title -->
              <v-col cols="12" :md="$vuetify.display.mdAndUp ? 6 : 12">
                <div class="field-group">
                  <label class="field-label">Job Title</label>
                  <v-text-field
                    v-model="form.title"
                    variant="solo-filled"
                    density="compact"
                    flat
                    placeholder="e.g., Health Specialist"
                    class="auth-field"
                    hide-details="auto"
                  />
                </div>
              </v-col>

              <!-- Location -->
              <v-col cols="12">
                <div class="field-group">
                  <label class="field-label">Location</label>
                  <v-text-field
                    v-model="form.location"
                    variant="solo-filled"
                    density="compact"
                    flat
                    placeholder="City, State"
                    class="auth-field"
                    hide-details="auto"
                  />
                </div>
              </v-col>

              <!-- Bio -->
              <v-col cols="12">
                <div class="field-group">
                  <label class="field-label">Bio</label>
                  <v-textarea
                    v-model="form.bio"
                    variant="solo-filled"
                    density="compact"
                    flat
                    placeholder="Brief description about the user..."
                    class="auth-field"
                    rows="2"
                    hide-details="auto"
                  />
                </div>
              </v-col>

              <!-- Send Welcome Email -->
              <v-col cols="12">
                <div class="field-group">
                  <v-checkbox
                    v-model="form.sendEmail"
                    color="primary"
                    density="compact"
                  >
                    <template #label>
                      <span class="field-label">Send welcome email with login instructions</span>
                    </template>
                  </v-checkbox>
                </div>
              </v-col>
            </v-row>
          </div>

          <!-- Account Creation Info -->
          <v-alert
            v-if="currentStep === totalSteps"
            type="info"
            variant="tonal"
            icon="mdi-information"
            class="mt-4"
            density="compact"
          >
            <div class="text-subtitle-2 font-weight-bold mb-1">Ready to Create</div>
            The user will be able to sign in immediately with the provided credentials.
            {{ form.sendEmail ? 'A welcome email will be sent with login instructions.' : '' }}
          </v-alert>
        </v-form>
      </v-card-text>

      <!-- Actions -->
      <v-card-actions class="pa-4 pa-md-6 pt-0">
        <v-btn 
          variant="text" 
          @click="handleBack"
          :disabled="creating || currentStep === 1"
          size="large"
        >
          <v-icon left>mdi-chevron-left</v-icon>
          Back
        </v-btn>
        
        <v-spacer />
        
        <v-btn 
          variant="outlined" 
          @click="handleCancel"
          :disabled="creating"
          size="large"
        >
          Cancel
        </v-btn>
        
        <v-btn 
          color="primary" 
          @click="handleNext"
          :loading="creating"
          size="large"
          class="submit-btn ml-2"
        >
          <span v-if="currentStep < totalSteps">Next</span>
          <span v-else>Create User</span>
          <v-icon v-if="currentStep < totalSteps" right>mdi-chevron-right</v-icon>
          <v-icon v-else right>mdi-check</v-icon>
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import { useDisplay } from 'vuetify'
import { httpsCallable } from 'firebase/functions'
import { functions, auth } from '../../firebase'
import { usePermissionsStore } from '../../stores/permissions'
import { useAudit } from '../../composables/useAudit'

const { mdAndUp } = useDisplay()
const permissionsStore = usePermissionsStore()
const { log } = useAudit()

// Props
const props = defineProps({
  modelValue: {
    type: Boolean,
    default: false
  }
})

// Emits
const emit = defineEmits(['update:modelValue', 'user-created', 'showSnackbar'])

// State
const dialogOpen = computed({
  get: () => props.modelValue,
  set: (value) => emit('update:modelValue', value)
})

const creating = ref(false)
const createUserFormRef = ref(null)
const currentStep = ref(1)
const totalSteps = 2
const showPassword = ref(false)
const showConfirmPassword = ref(false)

// Step titles
const stepTitles = ['Account Setup', 'Profile Details']

// Responsive dialog width
const dialogWidth = computed(() => {
  if (mdAndUp.value) return '600'
  return '95vw'
})

// Form data
const form = ref({
  email: '',
  password: '',
  confirmPassword: '',
  displayName: '',
  role: 'user',
  phone: '',
  department: '',
  title: '',
  region: '',
  location: '',
  bio: '',
  sendEmail: true
})

// Computed properties
const formattedPhone = computed({
  get() {
    return form.value.phone
  },
  set(value) {
    form.value.phone = formatPhoneNumber(value)
  }
})

const availableRoles = computed(() => {
  return permissionsStore.allRoles.filter(role => {
    // Only show roles the current user can assign
    if (role.id === 'owner') return false // Owners can only be created by system
    return true
  })
})

// Region options
const regionOptions = [
  { title: 'Region 1', value: '1' },
  { title: 'Region 2', value: '2' },
  { title: 'Region 3', value: '3' },
  { title: 'Region 4', value: '4' },
  { title: 'Region 5', value: '5' },
  { title: 'Region 6', value: '6' },
  { title: 'Region 7', value: '7' },
  { title: 'Region 8', value: '8' },
  { title: 'Region 9', value: '9' },
  { title: 'Central Office', value: 'central' }
]

// Validation rules
const rules = {
  required: value => !!value || 'This field is required'
}

const displayNameRules = [
  rules.required,
  value => (value && value.length >= 2) || 'Display name must be at least 2 characters'
]

// Fixed email rules - no longer requires la.gov
const emailRules = [
  rules.required,
  value => /.+@.+\..+/.test(value) || 'Email must be valid'
]

const passwordRules = [
  rules.required,
  value => (value && value.length >= 8) || 'Password must be at least 8 characters'
]

const confirmPasswordRules = [
  rules.required,
  value => value === form.value.password || 'Passwords must match'
]

const phoneRules = [
  value => !value || /^\(\d{3}\)\s\d{3}-\d{4}$/.test(value) || 'Phone must be in format (XXX) XXX-XXXX'
]

const roleRules = [
  rules.required
]

// Methods
const formatPhoneNumber = (value) => {
  if (!value) return ''
  
  const numericOnly = String(value).replace(/\D/g, '')
  
  if (numericOnly.length === 0) return ''
  if (numericOnly.length <= 3) return numericOnly
  if (numericOnly.length <= 6) {
    return `(${numericOnly.slice(0, 3)}) ${numericOnly.slice(3)}`
  }
  if (numericOnly.length <= 10) {
    return `(${numericOnly.slice(0, 3)}) ${numericOnly.slice(3, 6)}-${numericOnly.slice(6)}`
  }
  return `(${numericOnly.slice(0, 3)}) ${numericOnly.slice(3, 6)}-${numericOnly.slice(6, 10)}`
}

const generatePassword = () => {
  const length = 12
  const charset = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*'
  let password = ''
  for (let i = 0; i < length; i++) {
    password += charset.charAt(Math.floor(Math.random() * charset.length))
  }
  form.value.password = password
  form.value.confirmPassword = password
}

const showSnackbar = (message, color = 'success') => {
  emit('showSnackbar', message, color)
}

const resetForm = () => {
  form.value = {
    email: '',
    password: '',
    confirmPassword: '',
    displayName: '',
    role: 'user',
    phone: '',
    department: '',
    title: '',
    region: '',
    location: '',
    bio: '',
    sendEmail: true
  }
  currentStep.value = 1
  showPassword.value = false
  showConfirmPassword.value = false
  if (createUserFormRef.value) {
    createUserFormRef.value.resetValidation()
  }
}

const handleCancel = () => {
  resetForm()
  dialogOpen.value = false
}

const handleBack = () => {
  if (currentStep.value > 1) {
    currentStep.value--
  }
}

const validateCurrentStep = async () => {
  if (!createUserFormRef.value) return false
  
  const { valid } = await createUserFormRef.value.validate()
  return valid
}

const handleNext = async () => {
  const isValid = await validateCurrentStep()
  if (!isValid) return

  if (currentStep.value < totalSteps) {
    currentStep.value++
  } else {
    await createUser()
  }
}

const createUser = async () => {
  if (!createUserFormRef.value) return
  
  const { valid } = await createUserFormRef.value.validate()
  if (!valid) {
    showSnackbar('Please fill in all required fields correctly.', 'error')
    return
  }

  creating.value = true
  
  try {
    // Call the cloud function to create user
    const createUserFunction = httpsCallable(functions, 'createUser')
    
    const result = await createUserFunction({
      email: form.value.email.toLowerCase().trim(),
      password: form.value.password,
      displayName: form.value.displayName.trim(),
      role: form.value.role,
      phone: form.value.phone,
      department: form.value.department,
      title: form.value.title,
      region: form.value.region,
      location: form.value.location,
      bio: form.value.bio,
      sendWelcomeEmail: form.value.sendEmail
    })

    if (result.data.success) {
      // Log the creation event
      await log.userCreated({
        createdUserId: result.data.userId,
        createdUserEmail: form.value.email,
        assignedRole: form.value.role,
        method: 'admin_creation'
      })

      showSnackbar('User created successfully!', 'success')
      
      // Emit event to parent
      emit('user-created', result.data.userId)
      
      // Reset and close
      resetForm()
      dialogOpen.value = false
      
      // Refresh user list
      await permissionsStore.loadAllData()
    } else {
      throw new Error(result.data.message || 'Failed to create user')
    }
    
  } catch (error) {
    console.error('Error creating user:', error)
    
    // Log the failed attempt
    await log.custom('user_creation_failed', {
      attemptedEmail: form.value.email,
      attemptedRole: form.value.role,
      error: error.message
    })
    
    let errorMessage = 'Failed to create user'
    if (error.message.includes('already-exists')) {
      errorMessage = 'A user with this email already exists'
    } else if (error.message.includes('invalid-email')) {
      errorMessage = 'Please enter a valid email address'
    } else if (error.message.includes('permission-denied')) {
      errorMessage = 'You do not have permission to create users with this role'
    } else if (error.message) {
      errorMessage = error.message
    }
    
    showSnackbar(errorMessage, 'error')
  } finally {
    creating.value = false
  }
}

// Watch dialog state to reset form when closed
watch(dialogOpen, (newValue) => {
  if (newValue) {
    resetForm()
  }
})
</script>

<style scoped>
/* Compact styling */
.create-user-card {
  min-height: 70vh;
}

.form-header {
  text-align: center;
}

.form-title {
  font-family: 'ITC Franklin Gothic', Arial, sans-serif;
  font-size: 1.25rem;
  font-weight: 600;
  color: #003057;
  margin: 0 0 0.25rem 0;
}

.form-subtitle {
  font-family: 'Cambria', Georgia, serif;
  font-size: 0.875rem;
  color: #426DA9;
  margin: 0;
  opacity: 0.8;
}

/* Compact field groups */
.field-group {
  position: relative;
  margin-bottom: 0.75rem;
}

.field-label {
  display: block;
  font-family: 'ITC Franklin Gothic', Arial, sans-serif;
  font-size: 0.8125rem;
  font-weight: 600;
  color: #003057;
  margin-bottom: 0.375rem;
  letter-spacing: 0.25px;
}

/* Compact field styling for text inputs */
.auth-field :deep(.v-field) {
  background: #f8f9fa;
  border: 2px solid transparent;
  transition: all 0.2s ease;
  min-height: 40px !important;
}

.auth-field :deep(.v-field:hover) {
  background: #f0f2f5;
  border-color: rgba(66, 109, 169, 0.2);
}

.auth-field :deep(.v-field--focused) {
  background: white;
  border-color: #426DA9;
  box-shadow: 0 0 0 3px rgba(66, 109, 169, 0.1);
}

.auth-field :deep(.v-field__input) {
  font-family: 'Cambria', Georgia, serif;
  font-size: 0.9375rem;
  color: #003057;
  padding: 0.5rem 0.875rem !important;
  min-height: 40px !important;
}

.auth-field :deep(.v-field__input::placeholder) {
  color: #6c757d;
  opacity: 0.7;
}

/* Simple select field styling - clean and minimal */
.simple-select {
  margin-bottom: 4px;
}

.simple-select :deep(.v-field) {
  background: #f8f9fa;
  border: 1px solid #e9ecef;
  border-radius: 4px;
  min-height: 44px;
}

.simple-select :deep(.v-field:hover) {
  border-color: #426DA9;
}

.simple-select :deep(.v-field--focused) {
  border-color: #426DA9;
  box-shadow: 0 0 0 2px rgba(66, 109, 169, 0.2);
}

.simple-select :deep(.v-field__input) {
  padding: 8px 12px;
  font-size: 14px;
  line-height: 1.5;
}

.simple-select :deep(.v-select__selection) {
  font-size: 14px;
  line-height: 1.5;
}

.simple-select :deep(.v-field__append-inner) {
  padding-top: 0;
  align-items: center;
}

/* Remove internal labels */
.auth-field :deep(.v-label),
.simple-select :deep(.v-label) {
  display: none !important;
}

/* Error message styling */
.auth-field :deep(.v-messages),
.simple-select :deep(.v-messages) {
  font-family: 'Cambria', Georgia, serif;
  font-size: 0.75rem;
  margin-top: 0.25rem;
}

/* Button styling */
.submit-btn {
  font-family: 'ITC Franklin Gothic', Arial, sans-serif;
  font-weight: 600;
  text-transform: none;
  letter-spacing: 0.5px;
  height: 44px;
  border-radius: 8px;
}

/* Card styling */
.v-card-title {
  font-family: 'ITC Franklin Gothic', Arial, sans-serif;
}

/* Responsive adjustments */
@media (max-width: 600px) {
  .create-user-card {
    margin: 0;
    height: 100vh;
    border-radius: 0;
  }
  
  .form-title {
    font-size: 1.125rem;
  }
  
  .field-label {
    font-size: 0.8rem;
  }
}

/* Dense row spacing */
.v-row.dense {
  margin: -4px;
}

.v-row.dense > .v-col {
  padding: 4px;
}

/* Ensure proper spacing and layout */
.auth-field :deep(.v-input__details),
.simple-select :deep(.v-input__details) {
  margin-top: 4px;
  min-height: unset;
}
</style>