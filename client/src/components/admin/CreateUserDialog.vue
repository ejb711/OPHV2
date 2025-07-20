<!-- client/src/components/admin/CreateUserDialog.vue - COMPLETE Professional Louisiana DOH Styling -->
<template>
  <v-dialog
    v-model="dialogOpen"
    :max-width="$vuetify.display.smAndDown ? '100%' : '650'"
    persistent
    scrollable
    :fullscreen="$vuetify.display.smAndDown"
    transition="dialog-bottom-transition"
  >
    <v-card class="create-user-card elevation-12">
      <!-- Professional Government Header -->
      <div class="dialog-header">
        <v-toolbar color="transparent" flat>
          <v-icon color="white" size="32" class="mr-3">mdi-account-plus-outline</v-icon>
          <div>
            <v-toolbar-title class="text-h5 font-weight-bold text-white">
              Create New User
            </v-toolbar-title>
            <div class="text-caption text-white-darken-1 mt-n1">
              Step {{ currentStep }} of {{ totalSteps }}: {{ stepTitle }}
            </div>
          </div>
          <v-spacer />
          <v-btn
            icon
            variant="text"
            color="white"
            @click="handleCancel"
            class="ma-0"
          >
            <v-icon>mdi-close</v-icon>
          </v-btn>
        </v-toolbar>
        
        <!-- Progress Bar -->
        <v-progress-linear
          :model-value="(currentStep / totalSteps) * 100"
          color="white"
          bg-color="white"
          bg-opacity="0.3"
          height="3"
          class="ma-0"
        />
      </div>

      <!-- Form Content with Government Styling -->
      <v-card-text class="dialog-body pa-0">
        <v-container fluid class="pa-6">
          <v-form ref="createUserFormRef" @submit.prevent="handleNext">
            <!-- Step 1: Account Information -->
            <v-window v-model="currentStep" class="mt-2">
              <v-window-item :value="1">
                <div class="step-content">
                  <!-- Section Header -->
                  <div class="section-header mb-6 text-center">
                    <v-icon color="primary" size="48" class="mb-3">mdi-account-key</v-icon>
                    <h3 class="text-h6 font-weight-bold text-grey-darken-3">Account Details</h3>
                    <p class="text-body-2 text-grey-darken-1 mt-1">Essential information for account creation</p>
                  </div>

                  <!-- Form Fields -->
                  <v-row>
                    <!-- Email Address -->
                    <v-col cols="12">
                      <div class="gov-field-group">
                        <label class="gov-field-label required">
                          Email Address
                        </label>
                        <v-text-field
                          v-model="form.email"
                          type="email"
                          variant="outlined"
                          density="comfortable"
                          placeholder="user@example.com"
                          prepend-inner-icon="mdi-email-outline"
                          :rules="emailRules"
                          :error="false"
                          hide-details="auto"
                          class="gov-input"
                        />
                      </div>
                    </v-col>

                    <!-- Display Name -->
                    <v-col cols="12">
                      <div class="gov-field-group">
                        <label class="gov-field-label required">
                          Display Name
                        </label>
                        <v-text-field
                          v-model="form.displayName"
                          variant="outlined"
                          density="comfortable"
                          placeholder="Enter full name"
                          prepend-inner-icon="mdi-account-outline"
                          :rules="displayNameRules"
                          hide-details="auto"
                          class="gov-input"
                        />
                      </div>
                    </v-col>

                    <!-- Password Row -->
                    <v-col cols="12" md="6">
                      <div class="gov-field-group">
                        <label class="gov-field-label required">
                          Password
                        </label>
                        <v-text-field
                          v-model="form.password"
                          :type="showPassword ? 'text' : 'password'"
                          variant="outlined"
                          density="comfortable"
                          placeholder="Enter password"
                          prepend-inner-icon="mdi-lock-outline"
                          :rules="passwordRules"
                          hide-details="auto"
                          class="gov-input"
                        >
                          <template #append-inner>
                            <v-btn
                              :icon="showPassword ? 'mdi-eye-off' : 'mdi-eye'"
                              size="x-small"
                              variant="text"
                              @click="showPassword = !showPassword"
                            />
                            <v-tooltip text="Generate Password" location="top">
                              <template #activator="{ props }">
                                <v-btn
                                  v-bind="props"
                                  icon="mdi-refresh"
                                  size="x-small"
                                  variant="text"
                                  color="primary"
                                  @click="generatePassword"
                                />
                              </template>
                            </v-tooltip>
                          </template>
                        </v-text-field>
                      </div>
                    </v-col>

                    <!-- Confirm Password -->
                    <v-col cols="12" md="6">
                      <div class="gov-field-group">
                        <label class="gov-field-label required">
                          Confirm Password
                        </label>
                        <v-text-field
                          v-model="form.confirmPassword"
                          :type="showConfirmPassword ? 'text' : 'password'"
                          variant="outlined"
                          density="comfortable"
                          placeholder="Confirm password"
                          prepend-inner-icon="mdi-lock-check-outline"
                          :rules="confirmPasswordRules"
                          hide-details="auto"
                          class="gov-input"
                        >
                          <template #append-inner>
                            <v-btn
                              :icon="showConfirmPassword ? 'mdi-eye-off' : 'mdi-eye'"
                              size="x-small"
                              variant="text"
                              @click="showConfirmPassword = !showConfirmPassword"
                            />
                          </template>
                        </v-text-field>
                      </div>
                    </v-col>

                    <!-- Role Selection -->
                    <v-col cols="12">
                      <div class="gov-field-group">
                        <label class="gov-field-label required">
                          User Role
                        </label>
                        <v-select
                          v-model="form.role"
                          :items="availableRoles"
                          item-title="name"
                          item-value="id"
                          variant="outlined"
                          density="comfortable"
                          placeholder="Select user role"
                          prepend-inner-icon="mdi-shield-account-outline"
                          :rules="roleRules"
                          hide-details="auto"
                          class="gov-input"
                        >
                          <template #selection="{ item }">
                            <v-chip
                              :color="getRoleColor(item.value)"
                              size="small"
                              label
                              class="font-weight-medium"
                            >
                              {{ item.title }}
                            </v-chip>
                          </template>
                          <template #item="{ item, props }">
                            <v-list-item v-bind="props" class="py-2">
                              <template #prepend>
                                <v-chip
                                  :color="getRoleColor(item.value)"
                                  size="small"
                                  label
                                  class="mr-3"
                                >
                                  {{ item.title }}
                                </v-chip>
                              </template>
                            </v-list-item>
                          </template>
                        </v-select>
                      </div>
                    </v-col>
                  </v-row>
                </div>
              </v-window-item>

              <!-- Step 2: Profile Information -->
              <v-window-item :value="2">
                <div class="step-content">
                  <!-- Section Header -->
                  <div class="section-header mb-6 text-center">
                    <v-icon color="primary" size="48" class="mb-3">mdi-account-details</v-icon>
                    <h3 class="text-h6 font-weight-bold text-grey-darken-3">Profile Information</h3>
                    <p class="text-body-2 text-grey-darken-1 mt-1">Additional details to complete the user profile</p>
                  </div>

                  <v-row>
                    <!-- Phone Number -->
                    <v-col cols="12" md="6">
                      <div class="gov-field-group">
                        <label class="gov-field-label">
                          Phone Number
                        </label>
                        <v-text-field
                          v-model="formattedPhone"
                          variant="outlined"
                          density="comfortable"
                          placeholder="(555) 123-4567"
                          prepend-inner-icon="mdi-phone-outline"
                          :rules="phoneRules"
                          hide-details="auto"
                          class="gov-input"
                        />
                      </div>
                    </v-col>

                    <!-- Region -->
                    <v-col cols="12" md="6">
                      <div class="gov-field-group">
                        <label class="gov-field-label">
                          Region
                        </label>
                        <v-select
                          v-model="form.region"
                          :items="regionOptions"
                          variant="outlined"
                          density="comfortable"
                          placeholder="Select region"
                          prepend-inner-icon="mdi-map-marker-outline"
                          hide-details="auto"
                          class="gov-input"
                        />
                      </div>
                    </v-col>

                    <!-- Department -->
                    <v-col cols="12" md="6">
                      <div class="gov-field-group">
                        <label class="gov-field-label">
                          Department
                        </label>
                        <v-text-field
                          v-model="form.department"
                          variant="outlined"
                          density="comfortable"
                          placeholder="e.g., Public Health"
                          prepend-inner-icon="mdi-office-building-outline"
                          hide-details="auto"
                          class="gov-input"
                        />
                      </div>
                    </v-col>

                    <!-- Job Title -->
                    <v-col cols="12" md="6">
                      <div class="gov-field-group">
                        <label class="gov-field-label">
                          Job Title
                        </label>
                        <v-text-field
                          v-model="form.title"
                          variant="outlined"
                          density="comfortable"
                          placeholder="e.g., Health Specialist"
                          prepend-inner-icon="mdi-briefcase-outline"
                          hide-details="auto"
                          class="gov-input"
                        />
                      </div>
                    </v-col>

                    <!-- Location -->
                    <v-col cols="12">
                      <div class="gov-field-group">
                        <label class="gov-field-label">
                          Location
                        </label>
                        <v-text-field
                          v-model="form.location"
                          variant="outlined"
                          density="comfortable"
                          placeholder="City, State"
                          prepend-inner-icon="mdi-map-outline"
                          hide-details="auto"
                          class="gov-input"
                        />
                      </div>
                    </v-col>

                    <!-- Bio -->
                    <v-col cols="12">
                      <div class="gov-field-group">
                        <label class="gov-field-label">
                          Bio
                        </label>
                        <v-textarea
                          v-model="form.bio"
                          variant="outlined"
                          density="comfortable"
                          placeholder="Brief description about the user..."
                          prepend-inner-icon="mdi-text"
                          rows="3"
                          hide-details="auto"
                          class="gov-input"
                        />
                      </div>
                    </v-col>

                    <!-- Send Welcome Email -->
                    <v-col cols="12">
                      <v-card variant="tonal" color="primary" class="pa-4">
                        <v-checkbox
                          v-model="form.sendEmail"
                          color="primary"
                          hide-details
                        >
                          <template #label>
                            <div>
                              <div class="font-weight-medium">Send Welcome Email</div>
                              <div class="text-caption text-grey-darken-1">
                                User will receive login instructions via email
                              </div>
                            </div>
                          </template>
                        </v-checkbox>
                      </v-card>
                    </v-col>
                  </v-row>
                </div>
              </v-window-item>
            </v-window>
          </v-form>
        </v-container>
      </v-card-text>

      <!-- Professional Footer Actions -->
      <v-divider />
      <v-card-actions class="dialog-footer pa-6">
        <v-btn
          variant="text"
          color="grey-darken-2"
          @click="handleCancel"
          :disabled="creating"
          class="px-4"
        >
          Cancel
        </v-btn>
        
        <v-spacer />

        <v-btn
          v-if="currentStep > 1"
          variant="outlined"
          color="primary"
          @click="handleBack"
          :disabled="creating"
          class="mr-2"
        >
          <v-icon start>mdi-chevron-left</v-icon>
          Back
        </v-btn>

        <v-btn
          color="primary"
          variant="flat"
          @click="handleNext"
          :loading="creating"
          :disabled="creating"
          min-width="120"
          elevation="2"
          class="text-none font-weight-medium"
        >
          <v-icon start>
            {{ currentStep === totalSteps ? 'mdi-check-circle' : 'mdi-chevron-right' }}
          </v-icon>
          {{ currentStep === totalSteps ? 'Create User' : 'Next' }}
        </v-btn>
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

// Step titles
const stepTitles = {
  1: 'Account Details',
  2: 'Profile Details'
}

const stepTitle = computed(() => stepTitles[currentStep.value])

// Phone formatting
const formattedPhone = computed({
  get() {
    return formatPhoneNumber(form.value.phone)
  },
  set(value) {
    const numericOnly = String(value).replace(/\D/g, '')
    form.value.phone = numericOnly
  }
})

const availableRoles = computed(() => {
  return permissionsStore.allRoles.filter(role => {
    if (role.id === 'owner') return false
    return true
  })
})

// Region options
const regionOptions = [
  { title: 'Region 1 - Orleans', value: '1' },
  { title: 'Region 2 - Baton Rouge', value: '2' },
  { title: 'Region 3 - Houma', value: '3' },
  { title: 'Region 4 - Lafayette', value: '4' },
  { title: 'Region 5 - Lake Charles', value: '5' },
  { title: 'Region 6 - Alexandria', value: '6' },
  { title: 'Region 7 - Shreveport', value: '7' },
  { title: 'Region 8 - Monroe', value: '8' },
  { title: 'Region 9 - Hammond', value: '9' },
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

const emailRules = [
  rules.required,
  value => /.+@.+\..+/.test(value) || 'Email must be valid'
]

const passwordRules = [
  rules.required,
  value => (value && value.length >= 8) || 'Password must be at least 8 characters',
  value => /[A-Z]/.test(value) || 'Must contain an uppercase letter',
  value => /[a-z]/.test(value) || 'Must contain a lowercase letter',
  value => /[0-9]/.test(value) || 'Must contain a number'
]

const confirmPasswordRules = [
  rules.required,
  value => value === form.value.password || 'Passwords must match'
]

const phoneRules = [
  value => !value || /^\(\d{3}\)\s\d{3}-\d{4}$/.test(formatPhoneNumber(value)) || 'Use format: (XXX) XXX-XXXX'
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
  
  // Ensure at least one of each required character type
  password += 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'[Math.floor(Math.random() * 26)]
  password += 'abcdefghijklmnopqrstuvwxyz'[Math.floor(Math.random() * 26)]
  password += '0123456789'[Math.floor(Math.random() * 10)]
  password += '!@#$%^&*'[Math.floor(Math.random() * 8)]
  
  // Fill the rest randomly
  for (let i = 4; i < length; i++) {
    password += charset.charAt(Math.floor(Math.random() * charset.length))
  }
  
  // Shuffle the password
  password = password.split('').sort(() => Math.random() - 0.5).join('')
  
  form.value.password = password
  form.value.confirmPassword = password
  showPassword.value = true
  showConfirmPassword.value = true
}

const getRoleColor = (roleId) => {
  const colors = {
    'owner': 'deep-purple',
    'admin': 'blue-darken-2', 
    'user': 'green-darken-1',
    'viewer': 'cyan-darken-1',
    'pending': 'orange-darken-1'
  }
  return colors[roleId] || 'grey'
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
    const userPayload = {
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
    }

    const createUserFunction = httpsCallable(functions, 'createUser')
    const result = await createUserFunction(userPayload)

    if (result.data.success) {
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

      let message = 'User created successfully!'
      if (result.data.profileFieldsSaved) {
        message += ` Profile data saved: ${Object.values(result.data.profileFieldsSaved).filter(v => v !== 'none').length} fields.`
      }
      
      showSnackbar(message)
      await permissionsStore.loadAllData()

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

      resetForm()
      dialogOpen.value = false

    } else {
      throw new Error(result.data.message || 'Failed to create user')
    }

  } catch (error) {
    console.error('Error creating user:', error)
    
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
/* Louisiana Department of Health Professional Government Styling */

.create-user-card {
  border-radius: 8px;
  overflow: hidden;
}

/* Professional Government Header */
.dialog-header {
  background: linear-gradient(135deg, #003d7a 0%, #0056b3 100%);
  color: white;
  position: relative;
}

.dialog-header .v-toolbar {
  background: transparent !important;
}

/* Content Styling */
.dialog-body {
  background-color: #f8f9fa;
  min-height: 400px;
}

.dialog-footer {
  background-color: #ffffff;
  border-top: 1px solid #e0e0e0;
}

/* Section Headers */
.section-header {
  padding: 1rem 0;
}

.section-header h3 {
  letter-spacing: -0.02em;
}

/* Step Content Container */
.step-content {
  max-width: 720px;
  margin: 0 auto;
}

/* Government Form Field Styling */
.gov-field-group {
  margin-bottom: 1.5rem;
}

.gov-field-label {
  display: block;
  font-size: 0.875rem;
  font-weight: 600;
  color: #212529;
  margin-bottom: 0.5rem;
  letter-spacing: 0.01em;
}

.gov-field-label.required::after {
  content: ' *';
  color: #dc3545;
}

/* Professional Input Styling */
.gov-input :deep(.v-field) {
  background-color: #ffffff;
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
}

.gov-input :deep(.v-field__outline) {
  --v-field-border-color: #ced4da;
  --v-field-border-width: 1px;
}

.gov-input:hover :deep(.v-field__outline) {
  --v-field-border-color: #6c757d;
}

.gov-input :deep(.v-field--focused .v-field__outline) {
  --v-field-border-color: #0056b3;
  --v-field-border-width: 2px;
}

.gov-input :deep(.v-field__input) {
  font-size: 0.9375rem;
  padding: 0.5rem 0;
  min-height: 44px;
}

.gov-input :deep(.v-field__prepend-inner) {
  padding-right: 0.75rem;
  color: #6c757d;
}

.gov-input :deep(.v-field--error .v-field__outline) {
  --v-field-border-color: #dc3545;
}

/* Select Field Styling */
.gov-input :deep(.v-select__selection) {
  margin: 0;
}

/* Textarea Styling */
.gov-input :deep(textarea) {
  line-height: 1.5;
}

/* Button Styling in Fields */
.gov-input :deep(.v-btn--icon) {
  opacity: 0.6;
  transition: opacity 0.2s;
}

.gov-input :deep(.v-btn--icon:hover) {
  opacity: 1;
}

/* Role Chip Styling */
.v-chip {
  font-weight: 500;
  text-transform: uppercase;
  font-size: 0.75rem;
  letter-spacing: 0.05em;
}

/* Progress Linear Custom */
.v-progress-linear {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
}

/* Responsive Design */
@media (max-width: 600px) {
  .dialog-body .v-container {
    padding: 1rem !important;
  }
  
  .dialog-footer {
    padding: 1rem !important;
  }
  
  .gov-field-group {
    margin-bottom: 1rem;
  }
  
  .section-header {
    margin-bottom: 1.5rem !important;
  }
}

/* Animation for step transitions */
.v-window-item {
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

/* Professional Focus States */
.gov-input:focus-within {
  position: relative;
}

.gov-input:focus-within::after {
  content: '';
  position: absolute;
  inset: -4px;
  border: 3px solid rgba(0, 86, 179, 0.1);
  border-radius: 6px;
  pointer-events: none;
}

/* Enhanced Button Styling */
.v-btn {
  letter-spacing: 0.02em;
  font-weight: 500;
}

.v-btn--flat {
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.v-btn--flat:hover {
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.15);
}

/* Card Shadow for Professional Depth */
.create-user-card {
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
}

/* Smooth scrolling */
.dialog-body {
  scroll-behavior: smooth;
}

/* Loading State */
.v-btn--loading {
  opacity: 0.8;
}

/* Validation Messages */
.v-messages__message {
  font-size: 0.75rem;
  margin-top: 0.25rem;
}
</style>