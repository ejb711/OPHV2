<!-- PasswordResetDialog.vue -->
<template>
  <v-dialog
    v-model="dialogVisible"
    max-width="500"
    persistent
  >
    <v-card>
      <!-- Header -->
      <v-card-title class="text-h5 font-weight-bold">
        <v-icon left color="primary">mdi-key-change</v-icon>
        Reset User Password
      </v-card-title>
      
      <!-- User Info -->
      <v-card-subtitle class="mt-2">
        <div class="text-body-1">
          <strong>User:</strong> {{ user?.displayName || 'Unknown User' }}
        </div>
        <div class="text-body-2 text-medium-emphasis">
          {{ user?.email || '' }}
        </div>
      </v-card-subtitle>

      <v-divider />

      <!-- Form -->
      <v-card-text>
        <v-form ref="form" v-model="formValid">
          <!-- Password Field -->
          <div class="mb-4">
            <label class="text-subtitle-2 font-weight-medium mb-2 d-block">
              New Password
              <span class="text-error">*</span>
            </label>
            <v-text-field
              v-model="password"
              :type="showPassword ? 'text' : 'password'"
              variant="outlined"
              density="comfortable"
              placeholder="Enter new password"
              :rules="passwordRules"
              :append-inner-icon="showPassword ? 'mdi-eye-off' : 'mdi-eye'"
              @click:append-inner="showPassword = !showPassword"
              @input="checkPasswordStrength"
            />
            
            <!-- Password Strength Indicator -->
            <div v-if="password" class="mt-2">
              <v-progress-linear
                :model-value="passwordStrength.score"
                :color="passwordStrength.color"
                height="6"
                rounded
              />
              <div class="text-caption mt-1" :class="`text-${passwordStrength.color}`">
                Password Strength: {{ passwordStrength.text }}
              </div>
            </div>
          </div>

          <!-- Confirm Password Field -->
          <div class="mb-4">
            <label class="text-subtitle-2 font-weight-medium mb-2 d-block">
              Confirm Password
              <span class="text-error">*</span>
            </label>
            <v-text-field
              v-model="confirmPassword"
              :type="showConfirmPassword ? 'text' : 'password'"
              variant="outlined"
              density="comfortable"
              placeholder="Confirm new password"
              :rules="confirmPasswordRules"
              :append-inner-icon="showConfirmPassword ? 'mdi-eye-off' : 'mdi-eye'"
              @click:append-inner="showConfirmPassword = !showConfirmPassword"
            />
          </div>

          <!-- Options -->
          <v-checkbox
            v-model="requirePasswordChange"
            density="comfortable"
            hide-details
          >
            <template #label>
              <span class="text-body-2">
                Require user to change password on next login
              </span>
            </template>
          </v-checkbox>

          <!-- Warning Message -->
          <v-alert
            type="warning"
            variant="tonal"
            density="compact"
            class="mt-4"
          >
            <v-alert-title class="text-body-2">Important</v-alert-title>
            <div class="text-caption">
              The user will be immediately logged out of all sessions and will need to use this new password to log in.
            </div>
          </v-alert>
        </v-form>
      </v-card-text>

      <!-- Actions -->
      <v-card-actions>
        <v-spacer />
        <v-btn
          variant="text"
          @click="handleCancel"
          :disabled="resetting"
        >
          Cancel
        </v-btn>
        <v-btn
          color="primary"
          variant="flat"
          @click="handleResetPassword"
          :loading="resetting"
          :disabled="!formValid || resetting"
        >
          <v-icon left>mdi-key-change</v-icon>
          Reset Password
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import { functions } from '@/firebase'
import { httpsCallable } from 'firebase/functions'
import { useAudit } from '@/composables/useAudit'

// Props
const props = defineProps({
  modelValue: {
    type: Boolean,
    required: true
  },
  user: {
    type: Object,
    default: null
  }
})

// Emits
const emit = defineEmits(['update:modelValue', 'password-reset'])

// Composables
const { logEvent } = useAudit()

// State
const form = ref(null)
const formValid = ref(false)
const resetting = ref(false)
const password = ref('')
const confirmPassword = ref('')
const showPassword = ref(false)
const showConfirmPassword = ref(false)
const requirePasswordChange = ref(true)

// Password strength calculation
const passwordStrength = computed(() => {
  if (!password.value) return { score: 0, text: '', color: 'grey' }

  let score = 0
  const checks = [
    password.value.length >= 8,
    /[A-Z]/.test(password.value),
    /[a-z]/.test(password.value),
    /\d/.test(password.value),
    /[!@#$%^&*(),.?":{}|<>]/.test(password.value),
    password.value.length >= 12
  ]

  score = checks.filter(Boolean).length

  if (score <= 2) return { score: score * 20, text: 'Weak', color: 'error' }
  if (score <= 4) return { score: score * 20, text: 'Fair', color: 'warning' }
  if (score <= 5) return { score: score * 20, text: 'Good', color: 'success' }
  return { score: 100, text: 'Strong', color: 'success' }
})

// Validation rules
const passwordRules = [
  v => !!v || 'Password is required',
  v => v.length >= 6 || 'Password must be at least 6 characters',
]

const confirmPasswordRules = [
  v => !!v || 'Please confirm the password',
  v => v === password.value || 'Passwords do not match'
]

// Computed
const dialogVisible = computed({
  get: () => props.modelValue,
  set: (value) => emit('update:modelValue', value)
})

// Methods
const checkPasswordStrength = () => {
  // Trigger reactivity for password strength
}

const handleCancel = () => {
  resetForm()
  dialogVisible.value = false
}

const resetForm = () => {
  password.value = ''
  confirmPassword.value = ''
  showPassword.value = false
  showConfirmPassword.value = false
  requirePasswordChange.value = true
  form.value?.resetValidation()
}

const handleResetPassword = async () => {
  if (!formValid.value || !props.user) return

  resetting.value = true
  try {
    // Call the Cloud Function
    const resetUserPassword = httpsCallable(functions, 'resetUserPassword')
    const result = await resetUserPassword({
      userId: props.user.uid,
      newPassword: password.value,
      requirePasswordChange: requirePasswordChange.value
    })

    if (result.data.success) {
      // Log the activity
      await logEvent('admin_password_reset', {
        targetUserId: props.user.uid,
        targetUserEmail: props.user.email,
        requirePasswordChange: requirePasswordChange.value,
        resetBy: 'admin_panel'
      })

      // Emit success event
      emit('password-reset', {
        userId: props.user.uid,
        requirePasswordChange: requirePasswordChange.value
      })

      // Close dialog
      resetForm()
      dialogVisible.value = false
    }
  } catch (error) {
    console.error('Error resetting password:', error)
    throw error // Let parent handle the error display
  } finally {
    resetting.value = false
  }
}

// Watch for dialog open to reset form
watch(dialogVisible, (newVal) => {
  if (newVal) {
    resetForm()
  }
})
</script>

<style scoped>
.v-card-title {
  background-color: #f5f5f5;
}
</style>