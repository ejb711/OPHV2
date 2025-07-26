<template>
  <v-dialog
    :model-value="modelValue"
    @update:model-value="$emit('update:modelValue', $event)"
    max-width="480"
    persistent
  >
    <v-card>
      <v-card-title class="text-h5 pa-5">
        Reset Your Password
      </v-card-title>

      <v-card-text class="px-5 pb-2">
        <p class="text-body-1 mb-4">
          Enter your email address and we'll send you a link to reset your password.
        </p>

        <v-text-field
          v-model="resetEmail"
          label="Email Address"
          type="email"
          variant="outlined"
          placeholder="Enter your email address"
          :disabled="resetLoading"
          :error-messages="resetEmailError"
          @update:model-value="resetEmailError = ''"
          hide-details="auto"
          class="mb-2"
        />

        <!-- Success Message -->
        <v-alert
          v-if="resetSuccess"
          type="success"
          variant="tonal"
          density="compact"
          class="mt-4"
        >
          Password reset email sent! Check your inbox.
        </v-alert>

        <!-- Error Message -->
        <v-alert
          v-if="resetError"
          type="error"
          variant="tonal"
          density="compact"
          class="mt-4"
        >
          {{ resetError }}
        </v-alert>
      </v-card-text>

      <v-card-actions class="pa-5 pt-0">
        <v-spacer />
        <v-btn
          variant="text"
          @click="closeDialog"
          :disabled="resetLoading"
        >
          Cancel
        </v-btn>
        <v-btn
          variant="flat"
          color="primary"
          @click="handlePasswordReset"
          :loading="resetLoading"
          :disabled="!resetEmail || resetSuccess"
        >
          Send Reset Email
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script setup>
import { ref, watch } from 'vue'
import { sendPasswordResetEmail } from 'firebase/auth'
import { auth } from '@/firebase'
import { useAudit } from '@/composables/useAudit'
import { useErrorHandler } from '@/composables/useErrorHandler'

// Props & Emits
const props = defineProps({
  modelValue: {
    type: Boolean,
    default: false
  },
  prefillEmail: {
    type: String,
    default: ''
  }
})

const emit = defineEmits(['update:modelValue'])

// Composables
const { logEvent } = useAudit()
const { handleError } = useErrorHandler()

// State
const resetEmail = ref('')
const resetEmailError = ref('')
const resetLoading = ref(false)
const resetSuccess = ref(false)
const resetError = ref('')

// Methods
async function handlePasswordReset() {
  // Clear previous messages
  resetEmailError.value = ''
  resetError.value = ''
  resetSuccess.value = false

  // Validate email
  const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  if (!emailPattern.test(resetEmail.value)) {
    resetEmailError.value = 'Please enter a valid email address'
    return
  }

  resetLoading.value = true

  try {
    // Send password reset email
    await sendPasswordResetEmail(auth, resetEmail.value.trim())

    resetSuccess.value = true

    // Log the event
    await logEvent('password_reset_requested', {
      email: resetEmail.value.trim(),
      source: 'login_page'
    })

    // Auto-close dialog after 3 seconds
    setTimeout(() => {
      if (resetSuccess.value) {
        closeDialog()
      }
    }, 3000)

  } catch (err) {
    // Handle specific Firebase errors
    if (err.code === 'auth/user-not-found') {
      resetError.value = 'No account found with this email address'
    } else if (err.code === 'auth/invalid-email') {
      resetEmailError.value = 'Please enter a valid email address'
    } else {
      const errorObj = handleError(err, {
        component: 'ForgotPasswordDialog',
        action: 'password_reset'
      })
      resetError.value = errorObj.message
    }
  } finally {
    resetLoading.value = false
  }
}

function closeDialog() {
  emit('update:modelValue', false)
  // Reset dialog state after animation
  setTimeout(() => {
    resetEmail.value = ''
    resetEmailError.value = ''
    resetSuccess.value = false
    resetError.value = ''
  }, 300)
}

// Watchers
// Pre-fill email when dialog opens
watch(() => props.modelValue, (newVal) => {
  if (newVal && props.prefillEmail) {
    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (emailPattern.test(props.prefillEmail)) {
      resetEmail.value = props.prefillEmail
    }
  }
})
</script>

<style scoped>
/* Dialog Styling */
:deep(.v-card) {
  border-radius: 16px;
}

:deep(.v-card-title) {
  font-weight: 600;
  color: #003057;
}

:deep(.v-card-text) {
  color: #333;
}

:deep(.v-text-field .v-field) {
  border-radius: 8px;
}

/* Alert Styling */
:deep(.v-alert) {
  font-size: 0.875rem;
  border-radius: 8px;
}
</style>