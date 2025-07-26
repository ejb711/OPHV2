<!-- client/src/components/profile/security/PasswordManagement.vue -->
<template>
  <v-card variant="outlined">
    <v-card-title class="d-flex align-center gap-2">
      <v-icon color="primary">mdi-key-change</v-icon>
      Change Password
    </v-card-title>

    <v-card-text>
      <v-form ref="passwordFormRef" @submit.prevent="changePassword">
        <div class="field-group">
          <label class="field-label">Current Password</label>
          <v-text-field
            v-model="passwordForm.currentPassword"
            :type="showCurrentPassword ? 'text' : 'password'"
            variant="solo-filled"
            density="comfortable"
            flat
            required
            placeholder="Enter your current password"
            class="auth-field"
            :append-inner-icon="showCurrentPassword ? 'mdi-eye-off' : 'mdi-eye'"
            @click:append-inner="showCurrentPassword = !showCurrentPassword"
          />
        </div>

        <div class="field-group">
          <label class="field-label">New Password</label>
          <v-text-field
            v-model="passwordForm.newPassword"
            :type="showNewPassword ? 'text' : 'password'"
            variant="solo-filled"
            density="comfortable"
            flat
            required
            placeholder="Enter a new password"
            class="auth-field"
            :rules="passwordRules"
            :append-inner-icon="showNewPassword ? 'mdi-eye-off' : 'mdi-eye'"
            @click:append-inner="showNewPassword = !showNewPassword"
          />
        </div>

        <!-- Password Strength Indicator -->
        <div v-if="passwordForm.newPassword" class="mb-4">
          <div class="d-flex justify-space-between align-center mb-1">
            <span class="text-caption">Password Strength</span>
            <span class="text-caption font-weight-bold" :class="`text-${passwordStrength.color}`">
              {{ passwordStrength.text }}
            </span>
          </div>
          <v-progress-linear
            :model-value="passwordStrength.score"
            :color="passwordStrength.color"
            height="4"
            rounded
          />
        </div>

        <div class="field-group">
          <label class="field-label">Confirm New Password</label>
          <v-text-field
            v-model="passwordForm.confirmPassword"
            :type="showConfirmPassword ? 'text' : 'password'"
            variant="solo-filled"
            density="comfortable"
            flat
            required
            placeholder="Confirm your new password"
            class="auth-field"
            :rules="confirmPasswordRules"
            :append-inner-icon="showConfirmPassword ? 'mdi-eye-off' : 'mdi-eye'"
            @click:append-inner="showConfirmPassword = !showConfirmPassword"
          />
        </div>

        <div class="d-flex gap-3 mt-6">
          <v-btn
            type="submit"
            variant="flat"
            color="primary"
            :loading="loading"
            :disabled="!isPasswordFormValid"
          >
            <v-icon left>mdi-check</v-icon>
            Change Password
          </v-btn>

          <v-btn
            variant="outlined"
            color="primary"
            @click="sendPasswordReset"
            :loading="loading"
          >
            <v-icon left>mdi-email-send</v-icon>
            Send Reset Email
          </v-btn>
        </div>
      </v-form>
    </v-card-text>
  </v-card>
</template>

<script setup>
import { ref, computed } from 'vue'
import {
  updatePassword,
  reauthenticateWithCredential,
  EmailAuthProvider,
  sendPasswordResetEmail
} from 'firebase/auth'
import { auth } from '../../../firebase'
import { useAudit } from '../../../composables/useAudit'

const { logEvent } = useAudit()
const emit = defineEmits(['show-snackbar'])

// State
const loading = ref(false)
const passwordFormRef = ref(null)
const passwordForm = ref({
  currentPassword: '',
  newPassword: '',
  confirmPassword: ''
})
const showCurrentPassword = ref(false)
const showNewPassword = ref(false)
const showConfirmPassword = ref(false)

// Validation
const passwordRules = [
  value => !!value || 'Password is required',
  value => value.length >= 8 || 'Password must be at least 8 characters',
  value => /[A-Z]/.test(value) || 'Password must contain an uppercase letter',
  value => /[a-z]/.test(value) || 'Password must contain a lowercase letter',
  value => /\d/.test(value) || 'Password must contain a number',
  value => /[!@#$%^&*(),.?":{}|<>]/.test(value) || 'Password must contain a special character'
]

const confirmPasswordRules = [
  value => !!value || 'Confirmation is required',
  value => value === passwordForm.value.newPassword || 'Passwords must match'
]

const isPasswordFormValid = computed(() => {
  return passwordForm.value.currentPassword &&
         passwordForm.value.newPassword &&
         passwordForm.value.confirmPassword &&
         passwordForm.value.newPassword === passwordForm.value.confirmPassword &&
         passwordForm.value.newPassword.length >= 8
})

const passwordStrength = computed(() => {
  const pwd = passwordForm.value.newPassword
  if (!pwd) return { score: 0, text: '', color: 'grey' }

  let score = 0
  if (pwd.length >= 8) score += 20
  if (pwd.length >= 12) score += 20
  if (/[a-z]/.test(pwd)) score += 20
  if (/[A-Z]/.test(pwd)) score += 20
  if (/\d/.test(pwd)) score += 10
  if (/[!@#$%^&*(),.?":{}|<>]/.test(pwd)) score += 10

  if (score <= 40) return { score, text: 'Weak', color: 'error' }
  if (score <= 70) return { score, text: 'Fair', color: 'warning' }
  if (score <= 90) return { score, text: 'Good', color: 'info' }
  return { score: 100, text: 'Strong', color: 'success' }
})

// Methods
const changePassword = async () => {
  if (!passwordFormRef.value || !(await passwordFormRef.value.validate()).valid) return

  loading.value = true
  try {
    const user = auth.currentUser
    if (!user) throw new Error('No authenticated user')

    // Re-authenticate user
    const credential = EmailAuthProvider.credential(
      user.email,
      passwordForm.value.currentPassword
    )
    await reauthenticateWithCredential(user, credential)

    // Update password
    await updatePassword(user, passwordForm.value.newPassword)

    // Log the event
    await logEvent('password_changed', {
      email: user.email
    })

    // Reset form
    passwordForm.value = {
      currentPassword: '',
      newPassword: '',
      confirmPassword: ''
    }

    emit('show-snackbar', 'Password changed successfully', 'success')
  } catch (error) {
    if (error.code === 'auth/wrong-password') {
      emit('show-snackbar', 'Current password is incorrect', 'error')
    } else {
      emit('show-snackbar', 'Failed to change password', 'error')
    }
  } finally {
    loading.value = false
  }
}

const sendPasswordReset = async () => {
  loading.value = true
  try {
    const user = auth.currentUser
    if (!user?.email) throw new Error('No email address found')

    await sendPasswordResetEmail(auth, user.email)

    await logEvent('password_reset_requested', {
      email: user.email
    })

    emit('show-snackbar', 'Password reset email sent', 'success')
  } catch (error) {
    emit('show-snackbar', 'Failed to send password reset email', 'error')
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
/* Brand-compliant field styling */
.field-group {
  margin-bottom: 16px;
}

.field-label {
  display: block;
  font-size: 0.875rem;
  font-weight: 600;
  color: rgba(0, 0, 0, 0.87);
  margin-bottom: 4px;
}

.auth-field :deep(.v-field) {
  border-radius: 8px;
}

.auth-field :deep(.v-field__field) {
  font-family: inherit;
}

.auth-field :deep(.v-field--focused .v-field__outline) {
  --v-field-border-width: 2px;
}

/* Card styling */
:deep(.v-card) {
  border-radius: 8px;
}

:deep(.v-card-title) {
  font-size: 1.125rem;
  font-weight: 600;
  padding: 16px;
}

/* Progress styling */
:deep(.v-progress-linear) {
  border-radius: 4px;
}
</style>