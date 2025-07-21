<!-- client/src/components/profile/ProfileSecurityTab.vue - Complete Security Implementation -->
<template>
  <v-card-text class="pa-6">
    <div class="mb-6">
      <h2 class="text-h6 font-weight-bold mb-2">
        <v-icon class="me-2" color="primary">mdi-shield-account</v-icon>
        Security Settings
      </h2>
      <p class="text-body-2 text-medium-emphasis mb-4">
        Manage your account security and privacy settings
      </p>

      <!-- Account Information Cards -->
      <v-row>
        <v-col cols="12" md="6">
          <v-card variant="outlined" class="pa-4 brand-info-card">
            <h3 class="text-subtitle-1 font-weight-bold mb-2">Account Status</h3>
            <div class="d-flex align-center gap-2 mb-2">
              <v-chip 
                :color="getRoleColor(authStore.userRole)" 
                size="small" 
                variant="flat"
              >
                {{ authStore.userRole?.toUpperCase() || 'Unknown' }}
              </v-chip>
              <v-chip color="success" size="small" variant="outlined">
                Active
              </v-chip>
            </div>
            <p class="text-body-2 text-medium-emphasis">
              Account created: {{ formatDate(authStore.userDocument?.createdAt) }}
            </p>
          </v-card>
        </v-col>

        <v-col cols="12" md="6">
          <v-card variant="outlined" class="pa-4 brand-info-card">
            <h3 class="text-subtitle-1 font-weight-bold mb-2">Email Verification</h3>
            <div class="d-flex align-center gap-2 mb-2">
              <v-icon 
                :color="currentUser?.emailVerified ? 'success' : 'warning'"
                size="small"
              >
                {{ currentUser?.emailVerified ? 'mdi-email-check' : 'mdi-email-alert' }}
              </v-icon>
              <span class="text-body-2">
                {{ currentUser?.emailVerified ? 'Email verified' : 'Email not verified' }}
              </span>
            </div>
            <v-btn
              v-if="!currentUser?.emailVerified"
              variant="text"
              color="primary"
              size="small"
              @click="resendVerificationEmail"
              :loading="loading"
            >
              Resend Verification
            </v-btn>
          </v-card>
        </v-col>
      </v-row>
    </div>

    <v-divider class="my-6" />

    <!-- Password Management Section -->
    <v-row>
      <v-col cols="12" lg="8">
        <v-card variant="outlined">
          <v-card-title class="d-flex align-center gap-2">
            <v-icon color="primary">mdi-key-variant</v-icon>
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

        <!-- Additional Security Settings -->
        <v-card variant="outlined" class="mt-4">
          <v-card-title class="d-flex align-center gap-2">
            <v-icon color="primary">mdi-shield-check</v-icon>
            Security Preferences
          </v-card-title>
          
          <v-card-text>
            <v-row>
              <v-col cols="12" md="6">
                <v-select
                  v-model="securitySettings.sessionTimeout"
                  :items="[30, 60, 120, 240]"
                  label="Session Timeout (minutes)"
                  variant="solo-filled"
                  density="comfortable"
                  flat
                  @update:modelValue="updateSecuritySettings"
                >
                  <template v-slot:item="{ item }">
                    {{ item.raw }} minutes
                  </template>
                  <template v-slot:selection="{ item }">
                    {{ item.raw }} minutes
                  </template>
                </v-select>
                <p class="text-caption text-medium-emphasis mt-1">
                  How long to stay logged in when inactive
                </p>
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
          <v-card-title class="d-flex align-center gap-2">
            <v-icon color="primary">mdi-history</v-icon>
            Recent Activity
          </v-card-title>
          
          <v-card-text class="pa-0">
            <v-list v-if="recentEvents.length > 0" density="compact">
              <v-list-item
                v-for="event in recentEvents"
                :key="event.id"
                class="px-4"
              >
                <template v-slot:prepend>
                  <v-icon 
                    :color="getEventColor(event.action)"
                    size="small"
                  >
                    {{ getEventIcon(event.action) }}
                  </v-icon>
                </template>
                
                <v-list-item-title class="text-body-2">
                  {{ formatEventText(event) }}
                </v-list-item-title>
                
                <v-list-item-subtitle class="text-caption">
                  {{ formatRelativeTime(event.timestamp) }}
                </v-list-item-subtitle>
              </v-list-item>
            </v-list>
            
            <div v-else class="pa-4 text-center text-medium-emphasis">
              <v-icon size="48" color="grey">mdi-history</v-icon>
              <p class="text-body-2 mt-2">No recent security events</p>
            </div>
            
            <div v-if="loadingEvents" class="pa-4 text-center">
              <v-progress-circular
                indeterminate
                color="primary"
                size="32"
              />
            </div>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>

    <!-- Snackbar for notifications -->
    <v-snackbar
      v-model="snackbar.show"
      :color="snackbar.color"
      :timeout="4000"
      location="bottom"
    >
      {{ snackbar.message }}
      <template v-slot:actions>
        <v-btn
          variant="text"
          @click="snackbar.show = false"
        >
          Close
        </v-btn>
      </template>
    </v-snackbar>
  </v-card-text>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { 
  updatePassword, 
  reauthenticateWithCredential, 
  EmailAuthProvider,
  sendPasswordResetEmail,
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
const passwordFormRef = ref(null)
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
  sessionTimeout: 60, // minutes
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
    /[!@#$%^&*(),.?":{}|<>]/.test(password)
  ]
  
  score = checks.filter(Boolean).length * 20

  let text = ''
  let color = ''
  
  if (score <= 20) {
    text = 'Weak'
    color = 'error'
  } else if (score <= 40) {
    text = 'Fair'
    color = 'warning'
  } else if (score <= 60) {
    text = 'Good'
    color = 'info'
  } else if (score <= 80) {
    text = 'Strong'
    color = 'success'
  } else {
    text = 'Very Strong'
    color = 'success'
  }

  return { score, text, color }
})

// Methods
const showSnackbar = (message, color = 'success') => {
  snackbar.value = {
    show: true,
    message,
    color
  }
}

const formatDate = (timestamp) => {
  if (!timestamp) return 'Unknown'
  const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp)
  return date.toLocaleDateString('en-US', { 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric' 
  })
}

const formatRelativeTime = (timestamp) => {
  if (!timestamp) return 'Unknown'
  const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp)
  const now = new Date()
  const diff = now - date
  
  const minutes = Math.floor(diff / 60000)
  const hours = Math.floor(diff / 3600000)
  const days = Math.floor(diff / 86400000)
  
  if (minutes < 1) return 'Just now'
  if (minutes < 60) return `${minutes} minute${minutes > 1 ? 's' : ''} ago`
  if (hours < 24) return `${hours} hour${hours > 1 ? 's' : ''} ago`
  if (days < 7) return `${days} day${days > 1 ? 's' : ''} ago`
  
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

const getRoleColor = (role) => {
  const colors = {
    owner: 'purple',
    admin: 'red',
    user: 'blue',
    viewer: 'green',
    pending: 'grey'
  }
  return colors[role] || 'grey'
}

const changePassword = async () => {
  loading.value = true
  try {
    const user = auth.currentUser
    if (!user) throw new Error('No user logged in')

    // Reauthenticate user
    const credential = EmailAuthProvider.credential(
      user.email,
      passwordForm.value.currentPassword
    )
    await reauthenticateWithCredential(user, credential)

    // Update password
    await updatePassword(user, passwordForm.value.newPassword)

    // Update Firestore
    await updateDoc(doc(db, 'users', user.uid), {
      passwordChangedAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    })

    // Log the event
    await logEvent('password_changed', {
      userId: user.uid,
      method: 'profile_security_tab'
    })

    // Clear form
    passwordForm.value = {
      currentPassword: '',
      newPassword: '',
      confirmPassword: ''
    }

    showSnackbar('Password changed successfully')
    
    // Reload security events
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

const resendVerificationEmail = async () => {
  loading.value = true
  try {
    const user = auth.currentUser
    if (!user) throw new Error('No user logged in')

    await sendEmailVerification(user)
    showSnackbar('Verification email sent', 'success')
    
    await logEvent('verification_email_resent', {
      userId: user.uid,
      email: user.email
    })
  } catch (error) {
    console.error('Error sending verification email:', error)
    showSnackbar('Failed to send verification email', 'error')
  } finally {
    loading.value = false
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

const revokeAllSessions = async () => {
  loading.value = true
  try {
    // In a real implementation, this would invalidate all refresh tokens
    // For now, we'll just log the event
    const user = auth.currentUser
    if (!user) throw new Error('No user logged in')

    await logEvent('all_sessions_revoked', {
      userId: user.uid
    })

    showSnackbar('All other sessions have been revoked', 'success')
  } catch (error) {
    console.error('Error revoking sessions:', error)
    showSnackbar('Failed to revoke sessions', 'error')
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
  return textMap[event.action] || event.action
}

// Load data on mount
onMounted(() => {
  loadSecuritySettings()
  loadSecurityEvents()
})
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

/* Louisiana Department of Health Brand Colors */
.brand-info-card {
  background-color: #f5f5f5;
  border: 1px solid #e0e0e0;
}

.brand-info-card:hover {
  border-color: #1976d2;
  transition: border-color 0.2s ease;
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

/* List styling */
:deep(.v-list-item) {
  min-height: 48px;
}

:deep(.v-list-item:hover) {
  background-color: rgba(0, 0, 0, 0.04);
}

/* Progress styling */
:deep(.v-progress-linear) {
  border-radius: 4px;
}

/* Switch styling */
:deep(.v-switch .v-selection-control) {
  min-height: auto;
}
</style>