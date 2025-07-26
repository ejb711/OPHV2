<!-- client/src/views/ProfileView.vue - Complete Implementation with Brand Styling -->
<template>
  <AppLayout>
    <v-container fluid class="pa-6">
      <!-- Page Header -->
      <div class="d-flex align-center justify-space-between mb-6">
        <div>
          <h1 class="text-h4 font-weight-bold text-primary">My Profile</h1>
          <p class="text-body-1 text-medium-emphasis mt-1">
            Manage your account information and preferences
          </p>
        </div>

        <!-- Profile Avatar with Louisiana Department of Health Colors -->
        <v-avatar size="64" color="primary">
          <v-icon size="32">mdi-account-circle</v-icon>
        </v-avatar>
      </div>

      <!-- Profile Tabs -->
      <v-card elevation="2" rounded="lg">
        <v-tabs
          v-model="activeTab"
          bg-color="transparent"
          color="primary"
          density="comfortable"
          class="px-4"
        >
          <v-tab
            v-for="tab in availableTabs"
            :key="tab.value"
            :value="tab.value"
            class="px-6"
          >
            <v-icon start>{{ tab.icon }}</v-icon>
            {{ tab.title }}
          </v-tab>
        </v-tabs>

        <v-divider />

        <v-tabs-window v-model="activeTab">
          <!-- Personal Information Tab -->
          <v-tabs-window-item value="profile">
            <v-card-text class="pa-6">
              <v-form ref="profileForm" @submit.prevent="saveProfile">
                <div class="mb-6">
                  <h2 class="text-h6 font-weight-bold mb-2">
                    <v-icon class="me-2" color="primary">mdi-account</v-icon>
                    Basic Information
                  </h2>
                  <p class="text-body-2 text-medium-emphasis mb-4">
                    Update your personal details and contact information
                  </p>

                  <v-row dense>
                    <!-- Display Name -->
                    <v-col cols="12" md="6">
                      <div class="field-group">
                        <label class="field-label">Display Name</label>
                        <v-text-field
                          v-model="form.displayName"
                          variant="solo-filled"
                          density="comfortable"
                          flat
                          placeholder="Enter your display name"
                          class="auth-field"
                          @input="markFormDirty"
                        />
                      </div>
                    </v-col>

                    <!-- Email -->
                    <v-col cols="12" md="6">
                      <div class="field-group">
                        <label class="field-label">Email Address</label>
                        <v-text-field
                          v-model="form.email"
                          variant="solo-filled"
                          density="comfortable"
                          flat
                          type="email"
                          placeholder="your.email@ldh.la.gov"
                          class="auth-field"
                          :rules="emailRules"
                          @input="markFormDirty"
                        >
                          <template v-slot:append-inner>
                            <v-tooltip v-if="user?.emailVerified" location="top">
                              <template v-slot:activator="{ props }">
                                <v-icon v-bind="props" color="success" size="small">
                                  mdi-check-circle
                                </v-icon>
                              </template>
                              <span>Email verified</span>
                            </v-tooltip>
                            <v-tooltip v-else location="top">
                              <template v-slot:activator="{ props }">
                                <v-icon v-bind="props" color="warning" size="small">
                                  mdi-alert-circle
                                </v-icon>
                              </template>
                              <span>Email not verified</span>
                            </v-tooltip>
                          </template>
                        </v-text-field>
                      </div>
                    </v-col>

                    <!-- Phone -->
                    <v-col cols="12" md="6">
                      <div class="field-group">
                        <label class="field-label">Phone Number</label>
                        <v-text-field
                          v-model="formattedPhone"
                          variant="solo-filled"
                          density="comfortable"
                          flat
                          placeholder="(555) 123-4567"
                          class="auth-field"
                          :rules="phoneRules"
                        />
                      </div>
                    </v-col>

                    <!-- Department -->
                    <v-col cols="12" md="6">
                      <div class="field-group">
                        <label class="field-label">Department</label>
                        <v-text-field
                          v-model="form.department"
                          variant="solo-filled"
                          density="comfortable"
                          flat
                          placeholder="e.g., Office of Public Health"
                          class="auth-field"
                          @input="markFormDirty"
                        />
                      </div>
                    </v-col>

                    <!-- Title -->
                    <v-col cols="12" md="6">
                      <div class="field-group">
                        <label class="field-label">Job Title</label>
                        <v-text-field
                          v-model="form.title"
                          variant="solo-filled"
                          density="comfortable"
                          flat
                          placeholder="e.g., Program Manager"
                          class="auth-field"
                          @input="markFormDirty"
                        />
                      </div>
                    </v-col>

                    <!-- Region -->
                    <v-col cols="12" md="6">
                      <div class="field-group">
                        <label class="field-label">Region</label>
                        <v-select
                          v-model="form.region"
                          :items="regionOptions"
                          variant="solo-filled"
                          density="comfortable"
                          flat
                          placeholder="Select your region"
                          class="auth-field"
                          @update:modelValue="markFormDirty"
                        />
                      </div>
                    </v-col>

                    <!-- Location -->
                    <v-col cols="12">
                      <div class="field-group">
                        <label class="field-label">Office Location</label>
                        <v-text-field
                          v-model="form.location"
                          variant="solo-filled"
                          density="comfortable"
                          flat
                          placeholder="e.g., Baton Rouge Main Office"
                          class="auth-field"
                          @input="markFormDirty"
                        />
                      </div>
                    </v-col>

                    <!-- Bio -->
                    <v-col cols="12">
                      <div class="field-group">
                        <label class="field-label">Bio</label>
                        <v-textarea
                          v-model="form.bio"
                          variant="solo-filled"
                          density="comfortable"
                          flat
                          rows="3"
                          placeholder="Tell us a bit about yourself..."
                          class="auth-field"
                          counter="500"
                          @input="markFormDirty"
                        />
                      </div>
                    </v-col>
                  </v-row>
                </div>

                <!-- Form Actions -->
                <div class="d-flex justify-end gap-3 mt-6">
                  <v-btn
                    variant="text"
                    color="primary"
                    @click="resetForm"
                    :disabled="!isFormDirty || saving"
                  >
                    Cancel
                  </v-btn>
                  <v-btn
                    type="submit"
                    variant="flat"
                    color="primary"
                    :loading="saving"
                    :disabled="!isFormDirty"
                    class="brand-primary"
                  >
                    Save Changes
                  </v-btn>
                </div>
              </v-form>
            </v-card-text>
          </v-tabs-window-item>

          <!-- Security Tab -->
          <v-tabs-window-item value="security">
            <ProfileSecurityTab />
          </v-tabs-window-item>
        </v-tabs-window>
      </v-card>

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
    </v-container>
  </AppLayout>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { updateProfile, updateEmail, sendEmailVerification } from 'firebase/auth'
import { doc, updateDoc, serverTimestamp, getDoc } from 'firebase/firestore'
import { auth, db } from '../firebase'
import { useAuthStore } from '../stores/auth'
import { useAudit } from '../composables/useAudit'
import AppLayout from '../components/AppLayout.vue'
import ProfileSecurityTab from '../components/profile/ProfileSecurityTab.vue'

const authStore = useAuthStore()
const { logEvent } = useAudit()

// State
const activeTab = ref('profile')
const loading = ref(false)
const saving = ref(false)
const isFormDirty = ref(false)

// Form data
const form = ref({
  displayName: '',
  email: '',
  phone: '',
  department: '',
  title: '',
  region: '',
  location: '',
  bio: ''
})

// Store original form data for comparison
const originalForm = ref({})

// Snackbar
const snackbar = ref({
  show: false,
  message: '',
  color: 'success'
})

// Computed properties
const user = computed(() => authStore.user)
const userRole = computed(() => authStore.userRole)
const userDocument = computed(() => authStore.userDocument)

// Available tabs based on permissions
const availableTabs = computed(() => {
  const tabs = [
    {
      value: 'profile',
      title: 'Profile',
      icon: 'mdi-account',
      permission: 'view_own_profile'
    },
    {
      value: 'security',
      title: 'Security',
      icon: 'mdi-shield-account',
      permission: 'manage_own_security'
    }
  ]

  // Special handling for owners - always show all tabs
  if (userRole.value === 'owner') {
    return tabs
  }

  // For other users, filter by permissions
  const filteredTabs = tabs.filter(tab => {
    return authStore.hasPermission(tab.permission)
  })

  // If no tabs after filtering, but user has a valid role, show at least the profile tab
  if (filteredTabs.length === 0 && userRole.value && userRole.value !== 'pending') {
    return [tabs[0]] // Show at least the profile tab
  }

  return filteredTabs
})

// Phone formatting
const formattedPhone = computed({
  get() {
    return formatPhoneNumber(form.value.phone)
  },
  set(value) {
    const numericOnly = String(value).replace(/\D/g, '')
    form.value.phone = numericOnly
    markFormDirty()
  }
})

// Region options - Louisiana Department of Health regions
const regionOptions = [
  { title: 'Region 1', value: '1' },
  { title: 'Region 2', value: '2' },
  { title: 'Region 3', value: '3' },
  { title: 'Region 4', value: '4' },
  { title: 'Region 5', value: '5' },
  { title: 'Region 6', value: '6' },
  { title: 'Region 7', value: '7' },
  { title: 'Region 8', value: '8' },
  { title: 'Region 9', value: '9' },
  { title: 'Central Office', value: 'central' }
]

// Validation rules
const emailRules = [
  value => !value || /.+@.+\..+/.test(value) || 'Email must be valid'
]

const phoneRules = [
  value => !value || /^\(\d{3}\) \d{3}-\d{4}$/.test(formatPhoneNumber(value)) || 'Phone must be in format (555) 123-4567'
]

// Methods
const markFormDirty = () => {
  isFormDirty.value = true
}

const showSnackbar = (message, color = 'success') => {
  snackbar.value = {
    show: true,
    message,
    color
  }
}

const formatPhoneNumber = (value) => {
  if (!value) return ''
  const phone = String(value).replace(/\D/g, '')
  if (phone.length === 0) return ''
  if (phone.length <= 3) return `(${phone}`
  if (phone.length <= 6) return `(${phone.slice(0, 3)}) ${phone.slice(3)}`
  return `(${phone.slice(0, 3)}) ${phone.slice(3, 6)}-${phone.slice(6, 10)}`
}

const loadUserData = async () => {
  loading.value = true
  try {
    const currentUser = user.value
    if (!currentUser) {
      return
    }

    // Get fresh user document from Firestore
    const userDocRef = doc(db, 'users', currentUser.uid)
    const userDocSnap = await getDoc(userDocRef)
    const freshUserDoc = userDocSnap.exists() ? userDocSnap.data() : null

    if (freshUserDoc) {
      // Populate form with fresh data from Firestore
      form.value = {
        displayName: freshUserDoc.displayName || currentUser.displayName || '',
        email: freshUserDoc.email || currentUser.email || '',
        phone: freshUserDoc.phone || '',
        department: freshUserDoc.department || '',
        title: freshUserDoc.title || '',
        region: freshUserDoc.region || '',
        location: freshUserDoc.location || '',
        bio: freshUserDoc.bio || ''
      }
    } else {
      // Fallback to Firebase Auth data if no Firestore document
      form.value = {
        displayName: currentUser.displayName || '',
        email: currentUser.email || '',
        phone: '',
        department: '',
        title: '',
        region: '',
        location: '',
        bio: ''
      }
    }

    // Store original form data for comparison
    originalForm.value = { ...form.value }
    isFormDirty.value = false

  } catch (error) {
    showSnackbar('Failed to load profile data', 'error')
  } finally {
    loading.value = false
  }
}

const resetForm = () => {
  form.value = { ...originalForm.value }
  isFormDirty.value = false
}

const saveProfile = async () => {
  if (!user.value) {
    showSnackbar('No user logged in', 'error')
    return
  }

  saving.value = true
  try {
    const currentUser = user.value

    // Update Firebase Auth profile if displayName changed
    if (form.value.displayName !== currentUser.displayName) {
      await updateProfile(currentUser, {
        displayName: form.value.displayName
      })
    }

    // Handle email change
    if (form.value.email !== currentUser.email) {
      await updateEmail(currentUser, form.value.email)
      await sendEmailVerification(currentUser)
      showSnackbar('Email updated. Please check your new email for verification.', 'info')
    }

    // Update Firestore document
    const userDocRef = doc(db, 'users', currentUser.uid)
    await updateDoc(userDocRef, {
      ...form.value,
      updatedAt: serverTimestamp()
    })

    // Log the update
    await logEvent('profile_updated', {
      userId: currentUser.uid,
      updatedFields: Object.keys(form.value).filter(key =>
        form.value[key] !== originalForm.value[key]
      )
    })

    // Update the auth store to reflect changes
    await authStore.fetchUserData()

    // Reset form dirty state
    originalForm.value = { ...form.value }
    isFormDirty.value = false

    showSnackbar('Profile updated successfully')

  } catch (error) {
    if (error.code === 'auth/requires-recent-login') {
      showSnackbar('Please log in again to update your email', 'error')
    } else if (error.code === 'auth/email-already-in-use') {
      showSnackbar('This email is already in use', 'error')
    } else {
      showSnackbar('Failed to update profile', 'error')
    }
  } finally {
    saving.value = false
  }
}

// Watch for user changes
watch(user, (newUser) => {
  if (newUser) {
    loadUserData()
  }
})

// Load data on mount
onMounted(() => {
  if (user.value) {
    loadUserData()
  }
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
.brand-primary {
  background-color: #1976d2 !important;
}

.brand-info-card {
  background-color: #f5f5f5;
  border: 1px solid #e0e0e0;
}

.brand-info-card:hover {
  border-color: #1976d2;
  transition: border-color 0.2s ease;
}

/* Tab styling */
:deep(.v-tabs) {
  min-height: 48px;
}

:deep(.v-tab) {
  font-weight: 500;
  letter-spacing: 0.0125em;
}

:deep(.v-tab--selected) {
  font-weight: 600;
}

/* Form section styling */
.text-h6 {
  letter-spacing: 0.0125em;
}

/* Snackbar styling */
:deep(.v-snackbar__wrapper) {
  min-width: 344px;
}
</style>