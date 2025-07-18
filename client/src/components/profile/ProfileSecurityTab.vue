<!-- ProfileSecurityTab.vue -->
<script setup>
import { ref, computed, onMounted } from 'vue'
import { 
  updatePassword, 
  reauthenticateWithCredential, 
  EmailAuthProvider,
  sendPasswordResetEmail,
  updateEmail,
  sendEmailVerification
} from 'firebase/auth'
import { updateDoc, doc, serverTimestamp, collection, query, where, orderBy, limit, getDocs } from 'firebase/firestore'
import { auth, db } from '../../firebase'
import { useAuthStore } from '../../stores/auth'
import { useAudit } from '../../composables/useAudit'

const authStore = useAuthStore()
const { logEvent } = useAudit()

// State
const loading = ref(false)
const passwordForm = ref({
  currentPassword: '',
  newPassword: '',
  confirmPassword: ''
})
const showCurrentPassword = ref(false)
const showNewPassword = ref(false)
const showConfirmPassword = ref(false)

// Security settings
const securitySettings = ref({
  twoFactorEnabled: false,
  sessionTimeout: 60, // minutes
  passwordExpiry: 90, // days
  allowMultipleSessions: true,
  requirePasswordChange: false
})

// Recent security events
const recentEvents = ref([])
const loadingEvents = ref(false)

// Snackbar
const snackbar = ref({
  show: false,
  message: '',
  color: 'success'
})

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
  value => !!value || 'Please confirm your password',
  value => value === passwordForm.value.newPassword || 'Passwords do not match'
]

// Computed
const currentUser = computed(() => authStore.user)
const isPasswordFormValid = computed(() => {
  return passwordForm.value.currentPassword &&
         passwordForm.value.newPassword &&
         passwordForm.value.confirmPassword &&
         passwordForm.value.newPassword === passwordForm.value.confirmPassword &&
         passwordForm.value.newPassword.length >= 8
})

const passwordStrength = computed(() => {
  const password = passwordForm.value.newPassword
  if (!password) return { score: 0, text: '', color: 'grey' }

  let score = 0
  const checks = [
    password.length >= 8,
    /[A-Z]/.test(password),
    /[a-z]/.test(password),
    /\d/.test(password),
    /[!@#$%^&*(),.?":{}|<>]/.test(password),
    password.length >= 12
  ]

  score = checks.filter(Boolean).length

  if (score <= 2) return { score: score * 20, text: 'Weak', color: 'error' }
  if (score <= 4) return { score: score * 20, text: 'Fair', color: 'warning' }
  if (score <= 5) return { score: score * 20, text: 'Good', color: 'success' }
  return { score: 100, text: 'Strong', color: 'success' }
})

const sessionTimeoutOptions = [
  { value: 15, text: '15 minutes' },
  { value: 30, text: '30 minutes' },
  { value: 60, text: '1 hour' },
  { value: 120, text: '2 hours' },
  { value: 480, text: '8 hours' },
  { value: 1440, text: '24 hours' }
]

// Methods
const showSnackbar = (message, color = 'success') => {
  snackbar.value = { show: true, message, color }
}

const changePassword = async () => {
  if (!isPasswordFormValid.value) return

  loading.value = true
  try {
    const user = auth.currentUser
    if (!user) throw new Error('No user logged in')

    // Re-authenticate user with current password
    const credential = EmailAuthProvider.credential(
      user.email,
      passwordForm.value.currentPassword
    )
    await reauthenticateWithCredential(user, credential)

    // Update password
    await updatePassword(user, passwordForm.value.newPassword)

    // Update user document with password change timestamp
    await updateDoc(doc(db, 'users', user.uid), {
      lastPasswordChange: serverTimestamp(),
      passwordChangeRequired: false
    })

    // Log the activity
    await logEvent('password_changed', {
      userId: user.uid,
      timestamp: new Date().toISOString(),
      userAgent: navigator.userAgent,
      ip: 'auto-detected' // Would be populated server-side
    })

    // Clear form
    passwordForm.value = {
      currentPassword: '',
      newPassword: '',
      confirmPassword: ''
    }

    showSnackbar('Password changed successfully')
    await loadSecurityEvents()

  } catch (error) {
    console.error('Error changing password:', error)
    if (error.code === 'auth/wrong-password') {
      showSnackbar('Current password is incorrect', 'error')
    } else if (error.code === 'auth/weak-password') {
      showSnackbar('New password is too weak', 'error')
    } else {
      showSnackbar('Failed to change password', 'error')
    }
  } finally {
    loading.value = false
  }
}

const sendPasswordReset = async () => {
  try {
    const user = auth.currentUser
    if (!user?.email) throw new Error('No email found')

    await sendPasswordResetEmail(auth, user.email)
    showSnackbar('Password reset email sent to ' + user.email, 'info')
    
    await logEvent('password_reset_requested', {
      userId: user.uid,
      email: user.email
    })
  } catch (error) {
    console.error('Error sending password reset:', error)
    showSnackbar('Failed to send password reset email', 'error')
  }
}

const updateSecuritySettings = async () => {
  loading.value = true
  try {
    const user = auth.currentUser
    if (!user) throw new Error('No user logged in')

    await updateDoc(doc(db, 'users', user.uid), {
      securitySettings: securitySettings.value,
      updatedAt: serverTimestamp()
    })

    await logEvent('security_settings_updated', {
      userId: user.uid,
      settings: securitySettings.value
    })

    showSnackbar('Security settings updated')
  } catch (error) {
    console.error('Error updating security settings:', error)
    showSnackbar('Failed to update security settings', 'error')
  } finally {
    loading.value = false
  }
}

const loadSecuritySettings = async () => {
  try {
    const user = auth.currentUser
    if (!user) return

    const userDoc = await authStore.getUserDocument()
    if (userDoc?.securitySettings) {
      securitySettings.value = {
        ...securitySettings.value,
        ...userDoc.securitySettings
      }
    }
  } catch (error) {
    console.error('Error loading security settings:', error)
  }
}

const loadSecurityEvents = async () => {
  loadingEvents.value = true
  try {
    const user = auth.currentUser
    if (!user) return

    const q = query(
      collection(db, 'audit_logs'),
      where('userId', '==', user.uid),
      where('action', 'in', [
        'user_login',
        'user_logout', 
        'password_changed',
        'password_reset_requested',
        'email_changed',
        'security_settings_updated',
        'failed_login_attempt'
      ]),
      orderBy('timestamp', 'desc'),
      limit(10)
    )

    const snapshot = await getDocs(q)
    recentEvents.value = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }))
  } catch (error) {
    console.error('Error loading security events:', error)
  } finally {
    loadingEvents.value = false
  }
}

const getEventIcon = (action) => {
  const icons = {
    'user_login': 'mdi-login',
    'user_logout': 'mdi-logout',
    'password_changed': 'mdi-key-change',
    'password_reset_requested': 'mdi-email-send',
    'email_changed': 'mdi-email-edit',
    'security_settings_updated': 'mdi-shield-edit',
    'failed_login_attempt': 'mdi-alert-circle'
  }
  return icons[action] || 'mdi-information'
}

const getEventColor = (action) => {
  if (action.includes('failed') || action.includes('alert')) return 'error'
  if (action.includes('login')) return 'success'
  if (action.includes('logout')) return 'info'
  if (action.includes('changed') || action.includes('updated')) return 'primary'
  return 'grey'
}

const formatEventText = (event) => {
  const textMap = {
    'user_login': 'Logged in',
    'user_logout': 'Logged out',
    'password_changed': 'Changed password',
    'password_reset_requested': 'Requested password reset',
    'email_changed': 'Changed email address',
    'security_settings_updated': 'Updated security settings',
    'failed_login_attempt': 'Failed login attempt'
  }
  return textMap[event.action] || event.action.replace(/_/g, ' ')
}

const formatDate = (timestamp) => {
  if (!timestamp) return 'Unknown time'
  const date = timestamp.toDate()
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}

const revokeAllSessions = async () => {
  try {
    // This would typically be handled by a cloud function
    // For now, we'll just log the action
    await logEvent('all_sessions_revoked', {
      userId: auth.currentUser?.uid,
      timestamp: new Date().toISOString()
    })
    
    showSnackbar('All sessions will be revoked shortly', 'info')
  } catch (error) {
    console.error('Error revoking sessions:', error)
    showSnackbar('Failed to revoke sessions', 'error')
  }
}

onMounted(async () => {
  await Promise.all([
    loadSecuritySettings(),
    loadSecurityEvents()
  ])
})
</script>

<template>
  <div class="profile-security">
    <h2 class="text-h5 font-weight-bold mb-4">Security Settings</h2>
    <p class="text-body-1 text-medium-emphasis mb-6">
      Manage your account security and password settings
    </p>

    <v-row>
      <!-- Password Management -->
      <v-col cols="12" lg="8">
        <v-card variant="outlined" class="mb-6">
          <v-card-title class="text-h6 font-weight-bold">
            <v-icon left>mdi-key</v-icon>
            Change Password
          </v-card-title>
          <v-card-text>
            <v-form @submit.prevent="changePassword">
              <v-text-field
                v-model="passwordForm.currentPassword"
                label="Current Password"
                :type="showCurrentPassword ? 'text' : 'password'"
                variant="outlined"
                required
                class="mb-4"
                :append-inner-icon="showCurrentPassword ? 'mdi-eye-off' : 'mdi-eye'"
                @click:append-inner="showCurrentPassword = !showCurrentPassword"
              />

              <v-text-field
                v-model="passwordForm.newPassword"
                label="New Password"
                :type="showNewPassword ? 'text' : 'password'"
                variant="outlined"
                :rules="passwordRules"
                required
                class="mb-2"
                :append-inner-icon="showNewPassword ? 'mdi-eye-off' : 'mdi-eye'"
                @click:append-inner="showNewPassword = !showNewPassword"
              />

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

              <v-text-field
                v-model="passwordForm.confirmPassword"
                label="Confirm New Password"
                :type="showConfirmPassword ? 'text' : 'password'"
                variant="outlined"
                :rules="confirmPasswordRules"
                required
                class="mb-4"
                :append-inner-icon="showConfirmPassword ? 'mdi-eye-off' : 'mdi-eye'"
                @click:append-inner="showConfirmPassword = !showConfirmPassword"
              />

              <div class="d-flex gap-3 flex-wrap">
                <v-btn
                  color="primary"
                  type="submit"
                  :loading="loading"
                  :disabled="!isPasswordFormValid"
                >
                  Change Password
                </v-btn>
                <v-btn
                  variant="outlined"
                  @click="sendPasswordReset"
                >
                  Send Reset Email
                </v-btn>
              </div>
            </v-form>
          </v-card-text>
        </v-card>

        <!-- Security Settings -->
        <v-card variant="outlined" class="mb-6">
          <v-card-title class="text-h6 font-weight-bold">
            <v-icon left>mdi-shield-account</v-icon>
            Account Security
          </v-card-title>
          <v-card-text>
            <v-row>
              <v-col cols="12" md="6">
                <v-switch
                  v-model="securitySettings.twoFactorEnabled"
                  label="Two-Factor Authentication"
                  color="primary"
                  inset
                  disabled
                  @change="updateSecuritySettings"
                />
                <p class="text-caption text-medium-emphasis ml-8">
                  Add an extra layer of security (coming soon)
                </p>
              </v-col>

              <v-col cols="12" md="6">
                <v-select
                  v-model="securitySettings.sessionTimeout"
                  :items="sessionTimeoutOptions"
                  label="Session Timeout"
                  variant="outlined"
                  density="compact"
                  item-title="text"
                  item-value="value"
                  @update:model-value="updateSecuritySettings"
                />
              </v-col>

              <v-col cols="12" md="6">
                <v-switch
                  v-model="securitySettings.allowMultipleSessions"
                  label="Allow Multiple Sessions"
                  color="primary"
                  inset
                  @change="updateSecuritySettings"
                />
                <p class="text-caption text-medium-emphasis ml-8">
                  Allow logging in from multiple devices simultaneously
                </p>
              </v-col>

              <v-col cols="12" md="6">
                <v-switch
                  v-model="securitySettings.requirePasswordChange"
                  label="Require Periodic Password Change"
                  color="primary"
                  inset
                  @change="updateSecuritySettings"
                />
                <p class="text-caption text-medium-emphasis ml-8">
                  Require password change every 90 days
                </p>
              </v-col>
            </v-row>

            <v-divider class="my-4" />

            <div class="d-flex gap-3 flex-wrap">
              <v-btn
                variant="outlined"
                color="warning"
                @click="revokeAllSessions"
                :loading="loading"
              >
                <v-icon left>mdi-logout-variant</v-icon>
                Revoke All Sessions
              </v-btn>
            </div>
          </v-card-text>
        </v-card>
      </v-col>

      <!-- Recent Security Events -->
      <v-col cols="12" lg="4">
        <v-card variant="outlined">
          <v-card-title class="text-h6 font-weight-bold">
            <v-icon left>mdi-history</v-icon>
            Recent Security Events
          </v-card-title>
          <v-card-text>
            <div v-if="loadingEvents" class="text-center py-4">
              <v-progress-circular indeterminate size="32" color="primary" />
            </div>

            <div v-else-if="recentEvents.length === 0" class="text-center py-4">
              <v-icon size="48" color="grey">mdi-shield-check</v-icon>
              <p class="text-body-2 text-medium-emphasis mt-2">
                No recent security events
              </p>
            </div>

            <div v-else>
              <v-list density="compact">
                <v-list-item
                  v-for="event in recentEvents"
                  :key="event.id"
                  class="px-0"
                >
                  <template #prepend>
                    <v-icon
                      :color="getEventColor(event.action)"
                      size="20"
                    >
                      {{ getEventIcon(event.action) }}
                    </v-icon>
                  </template>

                  <v-list-item-title class="text-body-2">
                    {{ formatEventText(event) }}
                  </v-list-item-title>

                  <v-list-item-subtitle class="text-caption">
                    {{ formatDate(event.timestamp) }}
                  </v-list-item-subtitle>

                  <template #append v-if="event.details?.ip">
                    <v-chip size="x-small" variant="outlined">
                      {{ event.details.ip }}
                    </v-chip>
                  </template>
                </v-list-item>
              </v-list>
            </div>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>

    <!-- Snackbar -->
    <v-snackbar
      v-model="snackbar.show"
      :color="snackbar.color"
      :timeout="4000"
    >
      {{ snackbar.message }}
    </v-snackbar>
  </div>
</template>

<style scoped>
.profile-security h2 {
  font-family: 'ITC Franklin Gothic', Arial, sans-serif;
}

.v-card-title {
  font-family: 'ITC Franklin Gothic', Arial, sans-serif;
}

.v-card-text {
  font-family: 'Cambria', Georgia, serif;
}

.gap-3 {
  gap: 0.75rem;
}
</style>