<!-- client/src/components/admin/CreateUserDialog.vue - FIXED with Complete Brand Styling -->
<template>
  <v-dialog
    v-model="dialogOpen"
    max-width="600"
    persistent
    scrollable
  >
    <v-card class="create-user-dialog">
      <!-- Header with Louisiana Department of Health Brand Colors -->
      <v-card-title class="dialog-header pa-0">
        <div class="header-content">
          <div class="d-flex align-center gap-3">
            <v-icon color="white" size="28">mdi-account-plus</v-icon>
            <div>
              <h2 class="text-h5 font-weight-bold">Create New User</h2>
              <p class="text-body-2 text-grey-lighten-1 mt-1 mb-0">
                Step {{ currentStep }} of {{ totalSteps }}: {{ stepTitle }}
              </p>
            </div>
          </div>
        </div>
      </v-card-title>

      <!-- Form Content -->
      <v-card-text class="dialog-content px-6 py-6">
        <v-form ref="createUserFormRef" @submit.prevent="handleNext">
          <!-- Step 1: Basic Information -->
          <div v-if="currentStep === 1" key="step1">
            <div class="form-header mb-4">
              <h3 class="form-title">Account Details</h3>
              <p class="form-subtitle">Essential information for account creation</p>
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
                    placeholder="user@example.com"
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
                    placeholder="Full Name"
                    class="auth-field"
                    :rules="displayNameRules"
                    hide-details="auto"
                  />
                </div>
              </v-col>

              <!-- Password -->
              <v-col cols="12" md="6">
                <div class="field-group">
                  <label class="field-label">Password *</label>
                  <v-text-field
                    v-model="form.password"
                    :type="showPassword ? 'text' : 'password'"
                    variant="solo-filled"
                    density="compact"
                    flat
                    required
                    placeholder="Password"
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
                        icon="mdi-refresh"
                        size="small"
                        variant="text"
                        @click="generatePassword"
                        title="Generate random password"
                      />
                    </template>
                  </v-text-field>
                </div>
              </v-col>

              <!-- Confirm Password -->
              <v-col cols="12" md="6">
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
            <span v-if="form.sendEmail"> A welcome email will be sent with login instructions.</span>
          </v-alert>
        </v-form>
      </v-card-text>

      <!-- Actions -->
      <v-card-actions class="dialog-actions px-6 py-4">
        <div class="d-flex align-center justify-space-between w-100">
          <v-btn
            v-if="currentStep > 1"
            variant="outlined"
            prepend-icon="mdi-chevron-left"
            @click="handleBack"
            :disabled="creating"
          >
            Back
          </v-btn>
          <div v-else></div>

          <div class="d-flex gap-2">
            <v-btn
              variant="outlined"
              @click="handleCancel"
              :disabled="creating"
            >
              Cancel
            </v-btn>

            <v-btn
              color="primary"
              :loading="creating"
              @click="handleNext"
              :prepend-icon="currentStep === totalSteps ? 'mdi-check' : 'mdi-chevron-right'"
            >
              {{ currentStep === totalSteps ? 'Create User' : 'Next' }}
            </v-btn>
          </div>
        </div>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import { httpsCallable } from 'firebase/functions'
import { functions } from '../../firebase'
import { usePermissionsStore } from '../../stores/permissions'
import { useAudit } from '../../composables/useAudit'

const emit = defineEmits(['update:modelValue', 'user-created', 'showSnackbar'])
const props = defineProps({
  modelValue: {
    type: Boolean,
    default: false
  }
})

const permissionsStore = usePermissionsStore()
const { log } = useAudit()

// Dialog state
const dialogOpen = computed({
  get: () => props.modelValue,
  set: (value) => emit('update:modelValue', value)
})

// Form state
const createUserFormRef = ref(null)
const creating = ref(false)
const currentStep = ref(1)
const totalSteps = 2
const showPassword = ref(false)
const showConfirmPassword = ref(false)

// Form data - FIXED: Ensure all fields are properly initialized
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

// Step titles
const stepTitles = {
  1: 'Account Details',
  2: 'Profile Details'
}

const stepTitle = computed(() => stepTitles[currentStep.value])

// FIXED: Enhanced phone formatting with proper data handling
const formattedPhone = computed({
  get() {
    return formatPhoneNumber(form.value.phone)
  },
  set(value) {
    // Store raw numeric value for backend
    const numericOnly = String(value).replace(/\D/g, '')
    form.value.phone = numericOnly
    console.log('📱 Phone updated:', { formatted: value, stored: numericOnly })
  }
})

const availableRoles = computed(() => {
  return permissionsStore.allRoles.filter(role => {
    // Only show roles the current user can assign
    if (role.id === 'owner') return false // Owners can only be created by system
    return true
  })
})

// Region options - Louisiana Department of Health regions
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

// Validation rules - Brand compliant
const rules = {
  required: value => !!value || 'This field is required'
}

const displayNameRules = [
  rules.required,
  value => (value && value.length >= 2) || 'Display name must be at least 2 characters'
]

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
  value => !value || /^\(\d{3}\)\s\d{3}-\d{4}$/.test(formatPhoneNumber(value)) || 'Phone must be in format (XXX) XXX-XXXX'
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

// FIXED: Enhanced user creation with comprehensive logging and data validation
const createUser = async () => {
  if (!createUserFormRef.value) return
  
  const { valid } = await createUserFormRef.value.validate()
  if (!valid) {
    showSnackbar('Please fill in all required fields correctly.', 'error')
    return
  }

  creating.value = true
  
  try {
    // FIXED: Prepare data payload with comprehensive logging
    const userPayload = {
      email: form.value.email.toLowerCase().trim(),
      password: form.value.password,
      displayName: form.value.displayName.trim(),
      role: form.value.role,
      phone: form.value.phone, // Raw numeric value
      department: form.value.department,
      title: form.value.title,
      region: form.value.region,
      location: form.value.location,
      bio: form.value.bio,
      sendWelcomeEmail: form.value.sendEmail
    }

    console.log('🚀 Creating user with comprehensive payload:', JSON.stringify(userPayload, null, 2))

    // Call the cloud function to create user
    const createUserFunction = httpsCallable(functions, 'createUser')
    
    const result = await createUserFunction(userPayload)

    console.log('✅ User creation result:', JSON.stringify(result.data, null, 2))

    if (result.data.success) {
      // Log the creation event
      await log.userCreated({
        createdUserId: result.data.userId,
        createdUserEmail: form.value.email,
        assignedRole: form.value.role,
        method: 'admin_creation',
        profileFields: {
          phone: form.value.phone || 'none',
          department: form.value.department || 'none',
          title: form.value.title || 'none',
          region: form.value.region || 'none',
          location: form.value.location || 'none',
          bio: form.value.bio || 'none'
        }
      })

      // Enhanced success message with profile data confirmation
      let message = 'User created successfully!'
      if (result.data.profileFieldsSaved) {
        console.log('📊 Profile fields saved:', result.data.profileFieldsSaved)
        message += ` Profile data saved: ${Object.values(result.data.profileFieldsSaved).filter(v => v !== 'none').length} fields.`
      }
      
      showSnackbar(message)

      // Refresh the permissions store to reload user list
      console.log('🔄 Refreshing permissions store to reload user list...')
      await permissionsStore.loadAllData()

      // Emit user created event with comprehensive data
      emit('user-created', {
        userId: result.data.userId,
        email: result.data.email,
        displayName: form.value.displayName,
        role: form.value.role,
        profileData: {
          phone: form.value.phone,
          department: form.value.department,
          title: form.value.title,
          region: form.value.region,
          location: form.value.location,
          bio: form.value.bio
        },
        profileFieldsSaved: result.data.profileFieldsSaved
      })

      // Reset form and close dialog
      resetForm()
      dialogOpen.value = false

    } else {
      throw new Error(result.data.message || 'Failed to create user')
    }

  } catch (error) {
    console.error('❌ Error creating user:', error)
    
    let errorMessage = 'Failed to create user'
    
    if (error.code === 'functions/already-exists') {
      errorMessage = 'A user with this email already exists'
    } else if (error.code === 'functions/invalid-argument') {
      errorMessage = 'Please check your input and try again'
    } else if (error.code === 'functions/permission-denied') {
      errorMessage = 'You do not have permission to create users'
    } else if (error.message) {
      errorMessage = error.message
    }
    
    showSnackbar(errorMessage, 'error')
  } finally {
    creating.value = false
  }
}

// Reset form when dialog closes
watch(dialogOpen, (isOpen) => {
  if (!isOpen && !creating.value) {
    resetForm()
  }
})
</script>

<style scoped>
/* Louisiana Department of Health Brand Styling */

.create-user-dialog {
  overflow: hidden;
}

.dialog-header {
  /* Brand primary color - Louisiana Department of Health Blue */
  background: linear-gradient(135deg, #1976d2 0%, #1565c0 100%);
  color: white;
}

.header-content {
  padding: 1.5rem;
}

.dialog-content {
  max-height: 70vh;
  overflow-y: auto;
}

.dialog-actions {
  border-top: 1px solid rgba(var(--v-border-color), 0.12);
  background-color: rgb(var(--v-theme-surface));
}

.form-header {
  text-align: center;
}

.form-title {
  font-size: 1.25rem;
  font-weight: 600;
  color: rgb(var(--v-theme-on-surface));
  margin-bottom: 0.5rem;
}

.form-subtitle {
  color: rgba(var(--v-theme-on-surface), 0.7);
  font-size: 0.875rem;
}

.field-group {
  margin-bottom: 1rem;
}

.field-label {
  display: block;
  font-size: 0.875rem;
  font-weight: 500;
  color: rgb(var(--v-theme-on-surface));
  margin-bottom: 0.5rem;
}

/* Louisiana Department of Health form field styling */
.auth-field :deep(.v-field) {
  border-radius: 8px;
  /* Subtle Louisiana Department of Health accent */
  background-color: rgb(var(--v-theme-surface-variant));
}

.auth-field :deep(.v-field--focused) {
  /* Primary brand color on focus */
  background-color: rgba(25, 118, 210, 0.05);
}

.simple-select :deep(.v-field) {
  border-radius: 8px;
}

.simple-select :deep(.v-field__input) {
  min-height: 40px;
}

.v-alert {
  border-radius: 8px;
  /* Louisiana Department of Health info color */
  background-color: rgba(25, 118, 210, 0.1);
}

/* Button styling to match brand */
.v-btn--variant-elevated {
  box-shadow: 0 2px 4px rgba(25, 118, 210, 0.2);
}

.v-btn--variant-outlined {
  border: 1px solid rgba(25, 118, 210, 0.3);
}

/* Ensure consistent spacing and typography */
.v-text-field, .v-select, .v-textarea {
  font-family: 'Cambria', serif; /* Louisiana Department of Health body font */
}

.v-card-title, .form-title {
  font-family: 'Franklin Gothic', 'Arial Black', sans-serif; /* Louisiana Department of Health header font */
}
</style>