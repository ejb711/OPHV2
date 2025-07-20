<template>
  <div class="login-screen">
    <div class="login-container">
      <!-- LDH Logo Area (matching LoadingScreen) -->
      <div class="logo-section">
        <div class="logo-placeholder">
          <div class="logo-cross">
            <div class="cross-vertical"></div>
            <div class="cross-horizontal"></div>
          </div>
        </div>
        <div class="logo-text">
          <div class="department-text">LOUISIANA</div>
          <div class="health-text">DEPARTMENT OF HEALTH</div>
        </div>
      </div>

      <!-- Platform Title -->
      <div class="platform-header">
        <h1 class="platform-title">BRCO</h1>
        <p class="platform-subtitle">Public Health Platform</p>
      </div>

      <!-- Login Form -->
      <div class="auth-form">
        <div class="form-header">
          <h2 class="form-title">Sign In</h2>
          <p class="form-subtitle">Access your BRCO dashboard</p>
        </div>

        <form @submit.prevent="handleSubmit" class="auth-form-fields">
          <!-- Email Field -->
          <div class="field-group">
            <label class="field-label">Email Address</label>
            <v-text-field
              v-model="email"
              type="email"
              variant="solo-filled"
              density="comfortable"
              flat
              required
              placeholder="Enter your email"
              class="auth-field"
              :rules="[rules.required, rules.email]"
              hide-details="auto"
              :disabled="loading"
            />
          </div>

          <!-- Password Field -->
          <div class="field-group">
            <label class="field-label">Password</label>
            <v-text-field
              v-model="password"
              :type="showPassword ? 'text' : 'password'"
              variant="solo-filled"
              density="comfortable"
              flat
              required
              placeholder="Enter your password"
              class="auth-field"
              :rules="[rules.required, rules.minLength]"
              hide-details="auto"
              :disabled="loading"
            >
              <template #append-inner>
                <v-btn
                  :icon="showPassword ? 'mdi-eye-off' : 'mdi-eye'"
                  size="small"
                  variant="text"
                  @click="showPassword = !showPassword"
                  :title="showPassword ? 'Hide password' : 'Show password'"
                  :disabled="loading"
                />
              </template>
            </v-text-field>
          </div>

          <!-- Sign In Button -->
          <v-btn
            type="submit"
            color="primary"
            variant="elevated"
            size="large"
            block
            class="submit-btn"
            :loading="loading"
            :disabled="loading || !email || !password"
          >
            Sign In
          </v-btn>

          <!-- Error Alert -->
          <v-alert
            v-if="errorMsg"
            type="error"
            variant="tonal"
            density="compact"
            class="error-alert"
            closable
            @click:close="errorMsg = ''"
          >
            {{ errorMsg }}
          </v-alert>
        </form>
      </div>

      <!-- Subtle Wave Animation (matching LoadingScreen) -->
      <div class="wave-container">
        <div class="wave wave-1"></div>
        <div class="wave wave-2"></div>
        <div class="wave wave-3"></div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '../stores/auth'
import { useErrorHandler } from '../composables/useErrorHandler'

/* ----- Local State ------------------------------------------------------- */
const email = ref('')
const password = ref('')
const showPassword = ref(false)
const errorMsg = ref('')
const loading = ref(false)

/* ----- Composables ------------------------------------------------------- */
const router = useRouter()
const auth = useAuthStore()
const { handleError } = useErrorHandler()

/* ----- Form Validation Rules --------------------------------------------- */
const rules = {
  required: value => !!value || 'This field is required',
  email: value => {
    const pattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    return pattern.test(value) || 'Enter a valid email address'
  },
  minLength: value => value.length >= 6 || 'Password must be at least 6 characters'
}

/* ----- Methods ----------------------------------------------------------- */
async function handleSubmit() {
  // Clear any previous errors
  errorMsg.value = ''
  
  // Validate form
  if (!email.value || !password.value) {
    errorMsg.value = 'Please fill in all fields'
    return
  }

  if (!rules.email(email.value) === true) {
    errorMsg.value = 'Please enter a valid email address'
    return
  }

  loading.value = true
  
  try {
    // Call the auth store login method
    const result = await auth.login(email.value.trim(), password.value)
    
    // Check if login was successful
    if (!result.success) {
      // Create a proper error object for the error handler
      const error = new Error(result.error)
      error.code = result.errorCode || 'unknown'
      
      // Use the error handler to get user-friendly message
      const errorObj = handleError(error, { component: 'LoginView', action: 'login' })
      errorMsg.value = errorObj.message
      return
    }

    // Wait until the store has fetched role ≠ null
    await new Promise(resolve => {
      const stop = watch(
        () => auth.role,
        r => { 
          if (r !== null) { 
            stop()
            resolve() 
          } 
        },
        { immediate: true }
      )
    })

    // Successful login - redirect based on role
    router.push(auth.role === 'pending' ? '/awaiting' : '/')
    
  } catch (err) {
    console.error('Login error:', err)
    // Create a proper error object for the error handler
    const errorObj = handleError(err, { component: 'LoginView', action: 'login' })
    errorMsg.value = errorObj.message
  } finally {
    loading.value = false
  }
}

/* ----- Reactive Behavior ------------------------------------------------- */
// Clear error when user starts typing
watch([email, password], () => {
  if (errorMsg.value) {
    errorMsg.value = ''
  }
})
</script>

<style scoped>
/* Main Layout */
.login-screen {
  position: relative;
  min-height: 100vh;
  background: linear-gradient(135deg, 
    #003057 0%,     /* LDH Dark Blue */
    #426DA9 50%,    /* LDH Medium Blue */
    #63B1BC 80%,    /* LDH Light Blue/Teal */
    #8ba3c7 100%    /* Subtle Blue-Gray (toned down from gold) */
  );
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 2rem 1rem;
  overflow: hidden;
}

.login-container {
  position: relative;
  z-index: 10;
  width: 100%;
  max-width: 480px;
  text-align: center;
}

/* LDH Logo Section (matching LoadingScreen) */
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
  margin-right: 1rem;
  border-radius: 12px;
  background: rgba(255, 255, 255, 0.15);
  backdrop-filter: blur(10px);
  border: 2px solid rgba(255, 255, 255, 0.3);
  display: flex;
  align-items: center;
  justify-content: center;
}

.logo-cross {
  position: relative;
  width: 24px;
  height: 24px;
}

.cross-vertical {
  position: absolute;
  left: 50%;
  top: 50%;
  transform: translate(-50%, -50%);
  width: 4px;
  height: 20px;
  background: #63B1BC;
  border-radius: 2px;
}

.cross-horizontal {
  position: absolute;
  left: 50%;
  top: 50%;
  transform: translate(-50%, -50%);
  width: 20px;
  height: 4px;
  background: #B89D18;
  border-radius: 2px;
}

.logo-text {
  text-align: left;
  font-weight: 700;
  line-height: 1.2;
}

.department-text {
  font-size: 0.75rem;
  letter-spacing: 1px;
  color: #B89D18;
  margin-bottom: 0.25rem;
}

.health-text {
  font-size: 0.875rem;
  letter-spacing: 0.5px;
  color: white;
  font-weight: 900;
}

/* Platform Header */
.platform-header {
  margin-bottom: 2rem;
  opacity: 0;
  animation: fadeInUp 0.8s ease-out 0.4s forwards;
}

.platform-title {
  font-family: 'Arial Black', 'Helvetica Neue', Arial, sans-serif;
  font-size: 2.5rem;
  font-weight: 900;
  color: white;
  margin: 0 0 0.5rem 0;
  letter-spacing: 1.5px;
  text-shadow: 0 4px 8px rgba(0, 0, 0, 0.3);
}

.platform-subtitle {
  font-family: 'Georgia', 'Times New Roman', serif;
  font-size: 1rem;
  color: #63B1BC;
  margin: 0;
  font-style: italic;
}

/* Authentication Form */
.auth-form {
  opacity: 0;
  animation: fadeInUp 0.8s ease-out 0.6s forwards;
  background: rgba(255, 255, 255, 0.95);
  border-radius: 20px;
  padding: 2.5rem 2rem;
  backdrop-filter: blur(20px);
  border: 1px solid rgba(255, 255, 255, 0.3);
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.1);
}

.form-header {
  margin-bottom: 2rem;
  text-align: center;
}

.form-title {
  font-family: 'ITC Franklin Gothic', Arial, sans-serif;
  font-size: 1.75rem;
  font-weight: 600;
  color: #003057;
  margin: 0 0 0.5rem 0;
}

.form-subtitle {
  font-family: 'Cambria', Georgia, serif;
  font-size: 0.95rem;
  color: #426DA9;
  margin: 0;
  opacity: 0.8;
}

.auth-form-fields {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

/* Field Group with Separate Labels */
.field-group {
  position: relative;
  margin-bottom: 1.25rem;
}

.field-label {
  display: block;
  font-family: 'ITC Franklin Gothic', Arial, sans-serif;
  font-size: 0.875rem;
  font-weight: 600;
  color: #003057;
  margin-bottom: 0.5rem;
  letter-spacing: 0.25px;
}

/* Updated field styling for solo-filled variant */
.auth-field :deep(.v-field) {
  background: #f8f9fa;
  border: 2px solid transparent;
  transition: all 0.2s ease;
}

.auth-field :deep(.v-field:hover) {
  background: #f0f2f5;
  border-color: rgba(66, 109, 169, 0.2);
}

.auth-field :deep(.v-field--focused) {
  background: white;
  border-color: #426DA9;
  box-shadow: 0 0 0 4px rgba(66, 109, 169, 0.1);
}

.auth-field :deep(.v-field__input) {
  font-family: 'Cambria', Georgia, serif;
  font-size: 1rem;
  color: #003057;
  padding: 0.75rem 1rem !important;
  min-height: 48px !important;
}

.auth-field :deep(.v-field__input::placeholder) {
  color: #6c757d;
  opacity: 0.7;
}

/* Remove any label from the v-text-field since we're using external labels */
.auth-field :deep(.v-label) {
  display: none !important;
}

/* Error message styling */
.auth-field :deep(.v-messages) {
  font-family: 'Cambria', Georgia, serif;
  font-size: 0.75rem;
  margin-top: 0.25rem;
}

/* Update submit button spacing */
.submit-btn {
  font-family: 'ITC Franklin Gothic', Arial, sans-serif;
  font-weight: 600;
  text-transform: none;
  letter-spacing: 0.5px;
  margin-top: 2rem;
  height: 56px;
  border-radius: 12px;
}

.error-alert {
  margin-top: 1rem;
  border-radius: 12px;
}

/* Wave Animation (matching LoadingScreen) */
.wave-container {
  position: absolute;
  bottom: 0;
  left: 50%;
  transform: translateX(-50%);
  width: 120%;
  height: 60px;
  overflow: hidden;
  z-index: 1;
}

.wave {
  position: absolute;
  bottom: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: linear-gradient(90deg, 
    transparent 0%, 
    rgba(99, 177, 188, 0.1) 30%, 
    rgba(139, 163, 199, 0.08) 50%, 
    rgba(99, 177, 188, 0.1) 70%, 
    transparent 100%
  );
  border-radius: 50px 50px 0 0;
  animation: wave 3s ease-in-out infinite;
}

.wave-1 {
  animation-delay: 0s;
}

.wave-2 {
  animation-delay: 0.5s;
  opacity: 0.8;
}

.wave-3 {
  animation-delay: 1s;
  opacity: 0.6;
}

/* Animations */
@keyframes fadeInUp {
  from {
    opacity: 0;
    transform: translateY(30px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes wave {
  0%, 100% {
    transform: translateX(-50%);
  }
  50% {
    transform: translateX(-30%);
  }
}

/* Responsive Design */
@media (max-width: 640px) {
  .login-screen {
    padding: 1rem;
  }
  
  .auth-form {
    padding: 2rem 1.5rem;
    border-radius: 16px;
  }
  
  .platform-title {
    font-size: 2rem;
  }
  
  .logo-section {
    flex-direction: column;
    gap: 1rem;
  }
  
  .logo-placeholder {
    margin-right: 0;
  }
  
  .logo-text {
    text-align: center;
  }
}

@media (max-width: 480px) {
  .auth-form {
    padding: 1.5rem 1rem;
  }
  
  .platform-title {
    font-size: 1.75rem;
  }
  
  .form-title {
    font-size: 1.5rem;
  }
}

/* High contrast mode support */
@media (prefers-contrast: high) {
  .auth-field :deep(.v-field) {
    border: 2px solid #003057;
  }
  
  .auth-field :deep(.v-field--focused) {
    border-color: #426DA9;
    box-shadow: 0 0 0 2px #426DA9;
  }
}

/* Reduced motion support */
@media (prefers-reduced-motion: reduce) {
  .logo-section,
  .platform-header,
  .auth-form {
    animation: none;
    opacity: 1;
  }
  
  .wave {
    animation: none;
  }
}
</style>