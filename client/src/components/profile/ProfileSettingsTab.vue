<!-- ProfileSettingsTab.vue - Complete Fixed Version -->
<script setup>
import { ref, computed, onMounted } from 'vue'
import { updateDoc, doc, serverTimestamp } from 'firebase/firestore'
import { updateProfile, updateEmail, sendEmailVerification } from 'firebase/auth'
import { db, auth } from '../../firebase'
import { useAuthStore } from '../../stores/auth'
import { useAudit } from '../../composables/useAudit'

const authStore = useAuthStore()
const { logEvent } = useAudit()

// Form state
const loading = ref(false)
const saving = ref(false)
const form = ref({
  displayName: '',
  email: '',
  phone: '',
  department: '',
  title: '',
  location: '',
  bio: '',
  notifications: {
    email: true,
    browser: true,
    mobile: false
  },
  privacy: {
    showEmail: false,
    showPhone: false,
    allowDirectMessages: true
  }
})

// Validation
const emailValid = ref(true)
const phoneValid = ref(true)

// Snackbar
const snackbar = ref({
  show: false,
  message: '',
  color: 'success'
})

// Computed
const currentUser = computed(() => authStore.user)
const isFormDirty = ref(false)

// Computed property for phone with automatic formatting
const formattedPhone = computed({
  get() {
    return form.value.phone
  },
  set(value) {
    console.log('Phone setter called with:', value, typeof value)
    const formatted = formatPhoneNumber(value)
    console.log('Setting formatted phone:', formatted)
    form.value.phone = formatted
    markFormDirty()
  }
})

// Email validation rules
const emailRules = [
  value => !!value || 'Email is required',
  value => /.+@.+\..+/.test(value) || 'Email must be valid',
  value => value.endsWith('@la.gov') || 'Must use Louisiana government email'
]

// Phone validation rules
const phoneRules = [
  value => !value || /^\(\d{3}\)\s\d{3}-\d{4}$/.test(value) || 'Phone must be in format (XXX) XXX-XXXX'
]

// Methods
const showSnackbar = (message, color = 'success') => {
  snackbar.value = { show: true, message, color }
}

const loadUserData = async () => {
  loading.value = true
  try {
    const user = currentUser.value
    if (user) {
      // Load from Firebase Auth
      form.value.displayName = user.displayName || ''
      form.value.email = user.email || ''
      
      // Load from Firestore user document
      const userDoc = await authStore.getUserDocument()
      if (userDoc) {
        form.value.phone = userDoc.phone || ''
        form.value.department = userDoc.department || ''
        form.value.title = userDoc.title || ''
        form.value.location = userDoc.location || ''
        form.value.bio = userDoc.bio || ''
        form.value.notifications = {
          email: userDoc.notifications?.email ?? true,
          browser: userDoc.notifications?.browser ?? true,
          mobile: userDoc.notifications?.mobile ?? false
        }
        form.value.privacy = {
          showEmail: userDoc.privacy?.showEmail ?? false,
          showPhone: userDoc.privacy?.showPhone ?? false,
          allowDirectMessages: userDoc.privacy?.allowDirectMessages ?? true
        }
      }
    }
  } catch (error) {
    console.error('Error loading user data:', error)
    showSnackbar('Failed to load profile data', 'error')
  } finally {
    loading.value = false
  }
}

const saveProfile = async () => {
  saving.value = true
  try {
    const user = auth.currentUser
    if (!user) throw new Error('No user logged in')

    // Update Firebase Auth profile
    if (form.value.displayName !== user.displayName) {
      await updateProfile(user, {
        displayName: form.value.displayName
      })
    }

    // Handle email change
    if (form.value.email !== user.email) {
      await updateEmail(user, form.value.email)
      await sendEmailVerification(user)
      showSnackbar('Email updated. Please check your new email for verification.', 'info')
    }

    // Update Firestore user document
    await updateDoc(doc(db, 'users', user.uid), {
      displayName: form.value.displayName,
      phone: form.value.phone,
      department: form.value.department,
      title: form.value.title,
      location: form.value.location,
      bio: form.value.bio,
      notifications: form.value.notifications,
      privacy: form.value.privacy,
      updatedAt: serverTimestamp()
    })

    // Log the activity
    await logEvent('profile_updated', {
      userId: user.uid,
      changes: {
        displayName: form.value.displayName,
        department: form.value.department,
        title: form.value.title
      }
    })

    // Refresh auth store
    await authStore.refreshCurrentUser()
    
    isFormDirty.value = false
    showSnackbar('Profile updated successfully')

  } catch (error) {
    console.error('Error saving profile:', error)
    if (error.code === 'auth/requires-recent-login') {
      showSnackbar('Please log in again to change your email', 'warning')
    } else {
      showSnackbar('Failed to update profile', 'error')
    }
  } finally {
    saving.value = false
  }
}

// Phone formatting function
const formatPhoneNumber = (value) => {
  if (!value) return ''
  
  // Convert to string and remove all non-numeric characters
  const numericOnly = String(value).replace(/\D/g, '')
  
  // Apply progressive formatting
  if (numericOnly.length === 0) return ''
  if (numericOnly.length <= 3) return numericOnly
  if (numericOnly.length <= 6) {
    return `(${numericOnly.slice(0, 3)}) ${numericOnly.slice(3)}`
  }
  if (numericOnly.length <= 10) {
    return `(${numericOnly.slice(0, 3)}) ${numericOnly.slice(3, 6)}-${numericOnly.slice(6)}`
  }
  // Limit to 10 digits
  return `(${numericOnly.slice(0, 3)}) ${numericOnly.slice(3, 6)}-${numericOnly.slice(6, 10)}`
}

// Watch for form changes
const markFormDirty = () => {
  isFormDirty.value = true
}

onMounted(() => {
  loadUserData()
})
</script>

<template>
  <div class="profile-settings">
    <!-- Loading State -->
    <div v-if="loading" class="text-center py-8">
      <v-progress-circular indeterminate size="64" color="primary" />
      <p class="mt-4 text-body-1">Loading settings...</p>
    </div>

    <!-- Settings Form -->
    <div v-else>
      <h2 class="text-h5 font-weight-bold mb-4">Profile Settings</h2>
      <p class="text-body-1 text-medium-emphasis mb-6">
        Update your personal information and preferences
      </p>

      <v-form @submit.prevent="saveProfile">
        <!-- Basic Information -->
        <v-card variant="outlined" class="mb-6">
          <v-card-title class="text-h6 font-weight-bold">
            <v-icon left>mdi-account</v-icon>
            Basic Information
          </v-card-title>
          <v-card-text>
            <v-row>
              <v-col cols="12" md="6">
                <v-text-field
                  v-model="form.displayName"
                  label="Display Name"
                  variant="outlined"
                  required
                  @input="markFormDirty"
                />
              </v-col>
              <v-col cols="12" md="6">
                <v-text-field
                  v-model="form.email"
                  label="Email Address"
                  variant="outlined"
                  type="email"
                  :rules="emailRules"
                  required
                  @input="markFormDirty"
                />
              </v-col>
              <v-col cols="12" md="6">
                <!-- PHONE NUMBER FIELD - USING COMPUTED WITH SETTER -->
                <v-text-field
                  v-model="formattedPhone"
                  label="Phone Number"
                  variant="outlined"
                  placeholder="(XXX) XXX-XXXX"
                  :rules="phoneRules"
                  maxlength="14"
                />
              </v-col>
              <v-col cols="12" md="6">
                <v-text-field
                  v-model="form.title"
                  label="Job Title"
                  variant="outlined"
                  @input="markFormDirty"
                />
              </v-col>
              <v-col cols="12" md="6">
                <v-text-field
                  v-model="form.department"
                  label="Department"
                  variant="outlined"
                  @input="markFormDirty"
                />
              </v-col>
              <v-col cols="12" md="6">
                <v-text-field
                  v-model="form.location"
                  label="Location"
                  variant="outlined"
                  placeholder="City, State"
                  @input="markFormDirty"
                />
              </v-col>
              <v-col cols="12">
                <v-textarea
                  v-model="form.bio"
                  label="Bio"
                  variant="outlined"
                  placeholder="Tell us about yourself..."
                  rows="3"
                  @input="markFormDirty"
                />
              </v-col>
            </v-row>
          </v-card-text>
        </v-card>

        <!-- Notification Preferences -->
        <v-card variant="outlined" class="mb-6">
          <v-card-title class="text-h6 font-weight-bold">
            <v-icon left>mdi-bell</v-icon>
            Notification Preferences
          </v-card-title>
          <v-card-text>
            <v-row>
              <v-col cols="12">
                <v-switch
                  v-model="form.notifications.email"
                  label="Email Notifications"
                  color="primary"
                  inset
                  @change="markFormDirty"
                />
                <p class="text-caption text-medium-emphasis ml-8">
                  Receive notifications via email about important updates
                </p>
              </v-col>
              <v-col cols="12">
                <v-switch
                  v-model="form.notifications.browser"
                  label="Browser Notifications"
                  color="primary"
                  inset
                  @change="markFormDirty"
                />
                <p class="text-caption text-medium-emphasis ml-8">
                  Show push notifications in your browser
                </p>
              </v-col>
              <v-col cols="12">
                <v-switch
                  v-model="form.notifications.mobile"
                  label="Mobile Notifications"
                  color="primary"
                  inset
                  @change="markFormDirty"
                />
                <p class="text-caption text-medium-emphasis ml-8">
                  Send notifications to your mobile device (coming soon)
                </p>
              </v-col>
            </v-row>
          </v-card-text>
        </v-card>

        <!-- Privacy Settings -->
        <v-card variant="outlined" class="mb-6">
          <v-card-title class="text-h6 font-weight-bold">
            <v-icon left>mdi-shield-account</v-icon>
            Privacy Settings
          </v-card-title>
          <v-card-text>
            <v-row>
              <v-col cols="12">
                <v-switch
                  v-model="form.privacy.showEmail"
                  label="Show Email in Profile"
                  color="primary"
                  inset
                  @change="markFormDirty"
                />
                <p class="text-caption text-medium-emphasis ml-8">
                  Allow other users to see your email address in your public profile
                </p>
              </v-col>
              <v-col cols="12">
                <v-switch
                  v-model="form.privacy.showPhone"
                  label="Show Phone in Profile"
                  color="primary"
                  inset
                  @change="markFormDirty"
                />
                <p class="text-caption text-medium-emphasis ml-8">
                  Allow other users to see your phone number in your public profile
                </p>
              </v-col>
              <v-col cols="12">
                <v-switch
                  v-model="form.privacy.allowDirectMessages"
                  label="Allow Direct Messages"
                  color="primary"
                  inset
                  @change="markFormDirty"
                />
                <p class="text-caption text-medium-emphasis ml-8">
                  Allow other users to send you direct messages (coming soon)
                </p>
              </v-col>
            </v-row>
          </v-card-text>
        </v-card>

        <!-- Action Buttons -->
        <div class="d-flex justify-end gap-3">
          <v-btn
            variant="outlined"
            @click="loadUserData"
            :disabled="saving"
          >
            Reset
          </v-btn>
          <v-btn
            color="primary"
            type="submit"
            :loading="saving"
            :disabled="!isFormDirty"
          >
            Save Changes
          </v-btn>
        </div>
      </v-form>
    </div>

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
/* LDH Brand Standards Typography */
.profile-settings h2 {
  font-family: 'ITC Franklin Gothic', Arial, sans-serif;
  font-weight: 600;
}

.v-card-title {
  font-family: 'ITC Franklin Gothic', Arial, sans-serif;
  font-weight: 500;
}

.v-card-text {
  font-family: 'Cambria', Georgia, serif;
}

/* Button spacing utility */
.gap-3 {
  gap: 0.75rem;
}
</style>