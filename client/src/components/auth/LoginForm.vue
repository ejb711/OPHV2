<template>
  <div class="sign-in-card">
    <h2 class="sign-in-title">Sign In</h2>
    <p class="sign-in-subtitle">Access your BRCO dashboard</p>
    
    <form @submit.prevent="handleSubmit" class="sign-in-form">
      <!-- Email Field -->
      <div class="field-group">
        <label class="field-label" for="email">Email Address</label>
        <v-text-field
          id="email"
          v-model="email"
          type="email"
          variant="solo-filled"
          placeholder="Enter your email address"
          class="auth-field"
          autocomplete="email"
          :disabled="loading"
          hide-details="auto"
        />
      </div>

      <!-- Password Field -->
      <div class="field-group">
        <label class="field-label" for="password">Password</label>
        <v-text-field
          id="password"
          v-model="password"
          :type="showPassword ? 'text' : 'password'"
          variant="solo-filled"
          placeholder="Enter your password"
          class="auth-field"
          autocomplete="current-password"
          :disabled="loading"
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

      <!-- Forgot Password Link -->
      <div class="forgot-password-wrapper">
        <v-btn
          variant="text"
          size="small"
          color="primary"
          @click="showForgotPassword"
          :disabled="loading"
          class="forgot-password-link"
        >
          Forgot your password?
        </v-btn>
      </div>

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

      <!-- Submit Button -->
      <v-btn
        type="submit"
        variant="flat"
        color="primary"
        size="large"
        block
        :loading="loading"
        class="sign-in-btn"
      >
        Sign In
      </v-btn>
    </form>

    <!-- Forgot Password Dialog -->
    <ForgotPasswordDialog 
      v-model="forgotPasswordDialog"
      :prefill-email="email"
    />
  </div>
</template>

<script setup>
import { ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import ForgotPasswordDialog from './ForgotPasswordDialog.vue'
import { useLogin } from '@/composables/useLogin'

// Composables
const router = useRouter()
const { login, loading, error: loginError } = useLogin()

// Local state
const email = ref('')
const password = ref('')
const showPassword = ref(false)
const errorMsg = ref('')
const forgotPasswordDialog = ref(false)

// Methods
async function handleSubmit() {
  console.log('[LoginForm] Submitting login form')
  
  // Clear any previous errors
  errorMsg.value = ''
  
  // Basic validation
  if (!email.value || !password.value) {
    errorMsg.value = 'Please fill in all fields'
    return
  }
  
  // Email validation
  const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  if (!emailPattern.test(email.value)) {
    errorMsg.value = 'Please enter a valid email address'
    return
  }
  
  // Attempt login
  const result = await login(email.value.trim(), password.value)
  
  if (result.success) {
    // Redirect based on role
    const targetRoute = result.role === 'pending' ? '/awaiting' : '/dash'
    console.log('[LoginForm] Login successful, redirecting to:', targetRoute)
    router.push(targetRoute)
  } else {
    // Show error message
    errorMsg.value = result.error || 'Login failed. Please try again.'
  }
}

function showForgotPassword() {
  forgotPasswordDialog.value = true
}

// Clear error when user starts typing
watch([email, password], () => {
  if (errorMsg.value) {
    errorMsg.value = ''
  }
})

// Watch for login errors
watch(loginError, (newError) => {
  if (newError) {
    errorMsg.value = newError.message || 'An error occurred during login'
  }
})
</script>

<style scoped>
/* Sign In Card */
.sign-in-card {
  background: white;
  border-radius: 16px;
  padding: 2.5rem 2rem;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
  opacity: 0;
  animation: fadeInUp 0.8s ease-out 0.6s forwards;
}

.sign-in-title {
  font-size: 1.875rem;
  font-weight: 600;
  color: #003057; /* LDH Dark Blue */
  margin-bottom: 0.5rem;
  letter-spacing: 0.02em;
}

.sign-in-subtitle {
  font-size: 0.9375rem;
  color: #666;
  margin-bottom: 2rem;
}

/* Form Styling */
.sign-in-form {
  text-align: left;
}

.field-group {
  margin-bottom: 1.25rem;
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

/* Forgot Password Link */
.forgot-password-wrapper {
  text-align: right;
  margin-top: -0.5rem;
  margin-bottom: 1.5rem;
}

.forgot-password-link {
  font-size: 0.875rem;
  text-transform: none;
  letter-spacing: normal;
}

/* Submit Button */
.sign-in-btn {
  margin-top: 0.5rem;
  font-weight: 600;
  letter-spacing: 0.02em;
  text-transform: none;
  font-size: 1rem;
  padding: 0.75rem;
  box-shadow: 0 2px 8px rgba(66, 109, 169, 0.3);
  transition: all 0.3s ease;
}

.sign-in-btn:hover {
  box-shadow: 0 4px 12px rgba(66, 109, 169, 0.4);
  transform: translateY(-1px);
}

/* Alert Styling */
:deep(.v-alert) {
  font-size: 0.875rem;
  border-radius: 8px;
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

/* Mobile Responsive */
@media (max-width: 600px) {
  .sign-in-card {
    padding: 2rem 1.5rem;
    margin: 0 0.5rem;
  }
  
  .sign-in-title {
    font-size: 1.5rem;
  }
}
</style>