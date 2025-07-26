<template>
  <div class="password-reset-screen">
    <div class="reset-container">
      <!-- LDH Logo Section (matching LoginView) -->
      <div class="logo-section">
        <div class="logo-placeholder">
          <div class="logo-cross">
            <div class="cross-vertical"></div>
            <div class="cross-horizontal"></div>
          </div>
        </div>
        <div class="logo-text">
          <div class="dept-text">LOUISIANA</div>
          <div class="health-text">DEPARTMENT OF HEALTH</div>
        </div>
      </div>

      <!-- Platform Header -->
      <div class="platform-header">
        <h1 class="platform-title">BRCO</h1>
        <p class="platform-subtitle">Public Health Platform</p>
      </div>

      <!-- Reset Password Card -->
      <div class="reset-card">
        <!-- Loading State -->
        <div v-if="verifying" class="text-center py-8">
          <v-progress-circular
            indeterminate
            color="primary"
            size="64"
          />
          <p class="mt-4 text-body-1">Verifying reset link...</p>
        </div>

        <!-- Error State -->
        <v-alert
          v-else-if="verificationError"
          type="error"
          variant="elevated"
          prominent
        >
          <v-alert-title>Invalid Reset Link</v-alert-title>
          {{ verificationError }}
          <template v-slot:actions>
            <v-btn
              variant="text"
              @click="goToLogin"
            >
              Back to Login
            </v-btn>
          </template>
        </v-alert>

        <!-- Reset Form -->
        <div v-else-if="email">
          <h2 class="reset-title">Reset Your Password</h2>
          <p class="reset-subtitle">
            Create a new password for <strong>{{ email }}</strong>
          </p>

          <v-form ref="resetForm" @submit.prevent="handlePasswordReset">
            <!-- New Password Field -->
            <div class="field-group">
              <label class="field-label" for="password">New Password</label>
              <v-text-field
                id="password"
                v-model="password"
                :type="showPassword ? 'text' : 'password'"
                variant="solo-filled"
                placeholder="Enter new password"
                class="auth-field"
                :disabled="loading"
                :rules="passwordRules"
                hide-details="auto"
              >
                <template #append-inner>
                  <v-btn
                    :icon="showPassword ? 'mdi-eye-off' : 'mdi-eye'"
                    size="small"
                    variant="text"
                    @click="showPassword = !showPassword"
                    :title="showPassword ? 'Hide password' : 'Show password'"
                  />
                </template>
              </v-text-field>
            </div>

            <!-- Confirm Password Field -->
            <div class="field-group">
              <label class="field-label" for="confirmPassword">Confirm Password</label>
              <v-text-field
                id="confirmPassword"
                v-model="confirmPassword"
                :type="showConfirmPassword ? 'text' : 'password'"
                variant="solo-filled"
                placeholder="Confirm new password"
                class="auth-field"
                :disabled="loading"
                :rules="confirmPasswordRules"
                hide-details="auto"
              >
                <template #append-inner>
                  <v-btn
                    :icon="showConfirmPassword ? 'mdi-eye-off' : 'mdi-eye'"
                    size="small"
                    variant="text"
                    @click="showConfirmPassword = !showConfirmPassword"
                    :title="showConfirmPassword ? 'Hide password' : 'Show password'"
                  />
                </template>
              </v-text-field>
            </div>

            <!-- Password Requirements -->
            <v-card
              variant="outlined"
              class="mb-4 pa-3"
            >
              <div class="text-caption font-weight-medium mb-2">
                Password Requirements:
              </div>
              <div class="password-requirements">
                <div
                  v-for="req in passwordRequirements"
                  :key="req.text"
                  class="requirement"
                  :class="{ 'met': req.test(password) }"
                >
                  <v-icon
                    :icon="req.test(password) ? 'mdi-check-circle' : 'mdi-circle-outline'"
                    :color="req.test(password) ? 'success' : 'grey'"
                    size="small"
                  />
                  {{ req.text }}
                </div>
              </div>
            </v-card>

            <!-- Error Message -->
            <v-alert
              v-if="errorMsg"
              type="error"
              variant="tonal"
              density="compact"
              class="mb-4"
              closable
              @click:close="errorMsg = ''"
            >
              {{ errorMsg }}
            </v-alert>

            <!-- Success Message -->
            <v-alert
              v-if="success"
              type="success"
              variant="tonal"
              density="compact"
              class="mb-4"
            >
              Password reset successfully! Redirecting to login...
            </v-alert>

            <!-- Submit Button -->
            <v-btn
              type="submit"
              variant="flat"
              color="primary"
              size="large"
              block
              :loading="loading"
              :disabled="!password || !confirmPassword || success"
              class="reset-btn"
            >
              Reset Password
            </v-btn>

            <!-- Back to Login Link -->
            <div class="text-center mt-4">
              <v-btn
                variant="text"
                size="small"
                @click="goToLogin"
                :disabled="loading"
              >
                Back to Login
              </v-btn>
            </div>
          </v-form>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { confirmPasswordReset, verifyPasswordResetCode } from 'firebase/auth'
import { auth } from '@/firebase'
import { useErrorHandler } from '@/composables/useErrorHandler'
import { useAudit } from '@/composables/useAudit'

// Composables
const route = useRoute()
const router = useRouter()
const { handleError } = useErrorHandler()
const { logEvent } = useAudit()

// State
const verifying = ref(true)
const verificationError = ref('')
const email = ref('')
const password = ref('')
const confirmPassword = ref('')
const showPassword = ref(false)
const showConfirmPassword = ref(false)
const loading = ref(false)
const errorMsg = ref('')
const success = ref(false)
const resetForm = ref(null)

// Get action code from URL
const actionCode = computed(() => route.query.oobCode || '')

// Password requirements
const passwordRequirements = [
  { text: 'At least 8 characters', test: (p) => p.length >= 8 },
  { text: 'One uppercase letter', test: (p) => /[A-Z]/.test(p) },
  { text: 'One lowercase letter', test: (p) => /[a-z]/.test(p) },
  { text: 'One number', test: (p) => /\d/.test(p) },
  { text: 'One special character', test: (p) => /[!@#$%^&*(),.?":{}|<>]/.test(p) }
]

// Validation rules
const passwordRules = [
  v => !!v || 'Password is required',
  v => v.length >= 8 || 'Password must be at least 8 characters',
  v => /[A-Z]/.test(v) || 'Password must contain an uppercase letter',
  v => /[a-z]/.test(v) || 'Password must contain a lowercase letter',
  v => /\d/.test(v) || 'Password must contain a number',
  v => /[!@#$%^&*(),.?":{}|<>]/.test(v) || 'Password must contain a special character'
]

const confirmPasswordRules = [
  v => !!v || 'Please confirm your password',
  v => v === password.value || 'Passwords do not match'
]

// Methods
async function verifyResetCode() {
  if (!actionCode.value) {
    verificationError.value = 'No reset code provided. Please use the link from your email.'
    verifying.value = false
    return
  }

  try {
    // Verify the password reset code is valid
    const userEmail = await verifyPasswordResetCode(auth, actionCode.value)
    email.value = userEmail
    } catch (error) {
    if (error.code === 'auth/expired-action-code') {
      verificationError.value = 'This password reset link has expired. Please request a new one.'
    } else if (error.code === 'auth/invalid-action-code') {
      verificationError.value = 'This password reset link is invalid. Please request a new one.'
    } else {
      const errorObj = handleError(error, {
        component: 'PasswordResetView',
        action: 'verify_code'
      })
      verificationError.value = errorObj.message
    }
  } finally {
    verifying.value = false
  }
}

async function handlePasswordReset() {
  // Clear previous errors
  errorMsg.value = ''

  // Validate form
  const { valid } = await resetForm.value.validate()
  if (!valid) return

  // Double-check passwords match
  if (password.value !== confirmPassword.value) {
    errorMsg.value = 'Passwords do not match'
    return
  }

  loading.value = true

  try {
    // Confirm the password reset
    await confirmPasswordReset(auth, actionCode.value, password.value)

    success.value = true

    // Log the event
    await logEvent('password_reset_completed', {
      email: email.value,
      source: 'custom_reset_page'
    })

    // Redirect to login after 2 seconds
    setTimeout(() => {
      router.push('/login')
    }, 2000)

  } catch (error) {
    if (error.code === 'auth/expired-action-code') {
      errorMsg.value = 'This reset link has expired. Please request a new one.'
    } else if (error.code === 'auth/invalid-action-code') {
      errorMsg.value = 'This reset link is invalid. Please request a new one.'
    } else if (error.code === 'auth/weak-password') {
      errorMsg.value = 'Password is too weak. Please choose a stronger password.'
    } else {
      const errorObj = handleError(error, {
        component: 'PasswordResetView',
        action: 'reset_password'
      })
      errorMsg.value = errorObj.message
    }
  } finally {
    loading.value = false
  }
}

function goToLogin() {
  router.push('/login')
}

// Verify reset code on mount
onMounted(() => {
  verifyResetCode()
})
</script>

<style scoped>
/* Main Layout - Matching LoginView */
.password-reset-screen {
  position: relative;
  min-height: 100vh;
  background: linear-gradient(135deg,
    #003057 0%,     /* LDH Dark Blue */
    #426DA9 50%,    /* LDH Medium Blue */
    #63B1BC 80%,    /* LDH Light Blue/Teal */
    #8ba3c7 100%    /* Subtle Blue-Gray */
  );
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 2rem 1rem;
  overflow: hidden;
}

.reset-container {
  position: relative;
  z-index: 10;
  width: 100%;
  max-width: 480px;
  text-align: center;
}

/* LDH Logo Section - Matching LoginView */
.logo-section {
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 2rem;
  opacity: 0;
  animation: fadeInUp 0.8s ease-out 0.2s forwards;
}

.logo-placeholder {
  position: relative;
  width: 48px;
  height: 48px;
  margin-right: 16px;
}

.logo-cross {
  position: relative;
  width: 100%;
  height: 100%;
}

.cross-vertical {
  position: absolute;
  left: 50%;
  top: 0;
  width: 16px;
  height: 100%;
  background: #63B1BC; /* Teal */
  transform: translateX(-50%);
  opacity: 0;
  animation: fadeIn 0.6s ease-out 0.4s forwards;
}

.cross-horizontal {
  position: absolute;
  top: 50%;
  left: 0;
  width: 100%;
  height: 16px;
  background: #B89D18; /* Gold */
  transform: translateY(-50%);
  opacity: 0;
  animation: fadeIn 0.6s ease-out 0.6s forwards;
}

.logo-text {
  text-align: left;
}

.dept-text {
  font-size: 0.875rem;
  font-weight: 400;
  letter-spacing: 0.05em;
  color: #B89D18; /* Gold */
  margin-bottom: 2px;
  opacity: 0;
  animation: fadeIn 0.6s ease-out 0.8s forwards;
}

.health-text {
  font-size: 1.125rem;
  font-weight: 700;
  letter-spacing: 0.02em;
  color: white;
  opacity: 0;
  animation: fadeIn 0.6s ease-out 1s forwards;
}

/* Platform Header */
.platform-header {
  margin-bottom: 2rem;
  opacity: 0;
  animation: fadeInUp 0.8s ease-out 0.4s forwards;
}

.platform-title {
  font-size: 2.5rem;
  font-weight: 700;
  color: white;
  letter-spacing: 0.02em;
  margin-bottom: 0.5rem;
  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
}

.platform-subtitle {
  font-size: 1rem;
  color: rgba(255, 255, 255, 0.9);
  font-weight: 300;
  letter-spacing: 0.05em;
}

/* Reset Card */
.reset-card {
  background: white;
  border-radius: 16px;
  padding: 2.5rem 2rem;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
  opacity: 0;
  animation: fadeInUp 0.8s ease-out 0.6s forwards;
}

.reset-title {
  font-size: 1.875rem;
  font-weight: 600;
  color: #003057;
  margin-bottom: 0.5rem;
  letter-spacing: 0.02em;
}

.reset-subtitle {
  font-size: 0.9375rem;
  color: #666;
  margin-bottom: 2rem;
}

/* Form Styling */
.field-group {
  margin-bottom: 1.25rem;
  text-align: left;
}

.field-label {
  display: block;
  font-size: 0.875rem;
  font-weight: 600;
  color: #003057;
  margin-bottom: 0.5rem;
}

.auth-field {
  width: 100%;
}

.auth-field :deep(.v-field) {
  background: #f5f7fa;
  border-radius: 8px;
  transition: all 0.3s ease;
}

.auth-field :deep(.v-field:hover) {
  background: #eef2f6;
}

.auth-field :deep(.v-field--focused) {
  background: white;
  box-shadow: 0 0 0 2px #426DA9;
}

.auth-field :deep(.v-field__input) {
  padding: 0.75rem 1rem;
  min-height: 48px;
}

/* Password Requirements */
.password-requirements {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.requirement {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.875rem;
  color: #666;
  transition: color 0.2s ease;
}

.requirement.met {
  color: #4caf50;
}

/* Submit Button */
.reset-btn {
  margin-top: 0.5rem;
  font-weight: 600;
  letter-spacing: 0.02em;
  text-transform: none;
  font-size: 1rem;
  padding: 0.75rem;
  box-shadow: 0 2px 8px rgba(66, 109, 169, 0.3);
  transition: all 0.3s ease;
}

.reset-btn:hover {
  box-shadow: 0 4px 12px rgba(66, 109, 169, 0.4);
  transform: translateY(-1px);
}

/* Animations */
@keyframes fadeInUp {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes fadeIn {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}

/* Mobile Responsive */
@media (max-width: 600px) {
  .reset-container {
    max-width: 100%;
  }

  .reset-card {
    padding: 2rem 1.5rem;
    margin: 0 0.5rem;
  }

  .platform-title {
    font-size: 2rem;
  }

  .reset-title {
    font-size: 1.5rem;
  }
}
</style>