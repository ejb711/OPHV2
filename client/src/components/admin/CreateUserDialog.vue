<!-- client/src/views/ProfileView.vue -->
<template>
  <AppLayout>
    <div class="profile-container">
      <!-- Page Header -->
      <div class="page-header mb-6">
        <h1 class="text-h4 font-weight-bold mb-2">Profile</h1>
        <p class="text-body-1 text-medium-emphasis">
          Manage your personal information and account security
        </p>
      </div>

      <!-- Loading State -->
      <div v-if="loading" class="text-center py-8">
        <v-progress-circular
          indeterminate
          size="64"
          color="primary"
        />
        <p class="mt-4 text-body-1">Loading profile...</p>
      </div>

      <!-- Profile Content -->
      <div v-else-if="currentUser">
        <!-- Tab Navigation -->
        <v-card v-if="availableTabs.length > 0" class="mb-6">
          <v-tabs
            v-model="selectedTab"
            bg-color="transparent"
            color="primary"
            grow
          >
            <v-tab
              v-for="tab in availableTabs"
              :key="tab.value"
              :value="tab.value"
            >
              <v-icon left>{{ tab.icon }}</v-icon>
              {{ tab.title }}
            </v-tab>
          </v-tabs>
        </v-card>

        <!-- Tab Content -->
        <v-card elevation="2">
          <v-card-text class="pa-6">
            <!-- Profile Tab -->
            <div v-if="selectedTab === 'profile'">
              <div class="d-flex justify-space-between align-start mb-6">
                <div>
                  <h2 class="text-h5 font-weight-bold mb-2">Personal Information</h2>
                  <p class="text-body-1 text-medium-emphasis">
                    Update your profile details and contact information
                  </p>
                </div>
                <v-chip 
                  :color="getRoleColor(userRole)" 
                  variant="elevated"
                  class="text-capitalize"
                >
                  {{ userRole }}
                </v-chip>
              </div>

              <v-form @submit.prevent="saveProfile">
                <v-row>
                  <!-- Basic Information Section -->
                  <v-col cols="12">
                    <h3 class="text-h6 font-weight-bold mb-4">
                      <v-icon left>mdi-account</v-icon>
                      Basic Information
                    </h3>
                  </v-col>
                  
                  <v-col cols="12" md="6">
                    <div class="field-group">
                      <label class="field-label">Display Name</label>
                      <v-text-field
                        v-model="form.displayName"
                        variant="solo-filled"
                        density="comfortable"
                        flat
                        required
                        placeholder="Enter your display name"
                        class="auth-field"
                        @input="markFormDirty"
                      />
                    </div>
                  </v-col>
                  
                  <v-col cols="12" md="6">
                    <div class="field-group">
                      <label class="field-label">Email Address</label>
                      <v-text-field
                        v-model="form.email"
                        type="email"
                        variant="solo-filled"
                        density="comfortable"
                        flat
                        required
                        placeholder="Enter your email"
                        class="auth-field"
                        :rules="emailRules"
                        @input="markFormDirty"
                      />
                    </div>
                  </v-col>
                  
                  <v-col cols="12" md="6">
                    <div class="field-group">
                      <label class="field-label">Phone Number</label>
                      <v-text-field
                        v-model="formattedPhone"
                        variant="solo-filled"
                        density="comfortable"
                        flat
                        placeholder="(XXX) XXX-XXXX"
                        class="auth-field"
                        :rules="phoneRules"
                        maxlength="14"
                      />
                    </div>
                  </v-col>
                  
                  <v-col cols="12" md="6">
                    <div class="field-group">
                      <label class="field-label">Job Title</label>
                      <v-text-field
                        v-model="form.title"
                        variant="solo-filled"
                        density="comfortable"
                        flat
                        placeholder="Enter your job title"
                        class="auth-field"
                        @input="markFormDirty"
                      />
                    </div>
                  </v-col>
                  
                  <v-col cols="12" md="6">
                    <div class="field-group">
                      <label class="field-label">Department</label>
                      <v-text-field
                        v-model="form.department"
                        variant="solo-filled"
                        density="comfortable"
                        flat
                        placeholder="Enter your department"
                        class="auth-field"
                        @input="markFormDirty"
                      />
                    </div>
                  </v-col>

                  <!-- NEW: Region Field -->
                  <v-col cols="12" md="6">
                    <div class="field-group">
                      <label class="field-label">Region</label>
                      <v-select
                        v-model="form.region"
                        :items="regionOptions"
                        variant="outlined"
                        density="comfortable"
                        placeholder="Select your region"
                        @update:model-value="markFormDirty"
                      />
                    </div>
                  </v-col>
                  
                  <v-col cols="12" md="6">
                    <div class="field-group">
                      <label class="field-label">Location</label>
                      <v-text-field
                        v-model="form.location"
                        variant="solo-filled"
                        density="comfortable"
                        flat
                        placeholder="City, State"
                        class="auth-field"
                        @input="markFormDirty"
                      />
                    </div>
                  </v-col>
                  
                  <v-col cols="12">
                    <div class="field-group">
                      <label class="field-label">Bio</label>
                      <v-textarea
                        v-model="form.bio"
                        variant="solo-filled"
                        density="comfortable"
                        flat
                        placeholder="Tell us about yourself..."
                        class="auth-field"
                        rows="3"
                        @input="markFormDirty"
                      />
                    </div>
                  </v-col>

                  <!-- Profile Photo Section -->
                  <v-col cols="12">
                    <h3 class="text-h6 font-weight-bold mb-4 mt-4">
                      <v-icon left>mdi-camera</v-icon>
                      Profile Photo
                    </h3>
                    <div class="d-flex align-center">
                      <v-avatar size="80" class="mr-4">
                        <v-img
                          v-if="currentUser.photoURL"
                          :src="currentUser.photoURL"
                          alt="Profile Photo"
                        />
                        <v-icon v-else size="40" color="grey">
                          mdi-account-circle
                        </v-icon>
                      </v-avatar>
                      <div>
                        <v-btn variant="outlined" size="small" class="mr-2">
                          Upload Photo
                        </v-btn>
                        <v-btn 
                          v-if="currentUser.photoURL" 
                          variant="outlined" 
                          size="small" 
                          color="error"
                        >
                          Remove
                        </v-btn>
                        <p class="text-caption text-medium-emphasis mt-2">
                          JPG, PNG or GIF. Max 2MB.
                        </p>
                      </div>
                    </div>
                  </v-col>

                  <!-- Save Button -->
                  <v-col cols="12" class="pt-6">
                    <div class="d-flex justify-end">
                      <v-btn
                        color="primary"
                        size="large"
                        :loading="saving"
                        :disabled="!isFormDirty"
                        @click="saveProfile"
                        class="submit-btn"
                      >
                        Save Changes
                      </v-btn>
                    </div>
                  </v-col>
                </v-row>
              </v-form>
            </div>

            <!-- Security Tab -->
            <div v-else-if="selectedTab === 'security'">
              <ProfileSecurityTab />
            </div>
          </v-card-text>
        </v-card>
      </div>

      <!-- No User State -->
      <div v-else class="text-center py-8">
        <v-icon size="64" color="grey">mdi-account-alert</v-icon>
        <h2 class="text-h5 mt-4">No User Found</h2>
        <p class="text-body-1 text-medium-emphasis">
          Please log in to view your profile.
        </p>
      </div>
    </div>

    <!-- Snackbar for notifications -->
    <v-snackbar
      v-model="snackbar.show"
      :color="snackbar.color"
      :timeout="4000"
      location="top"
    >
      {{ snackbar.message }}
      <template v-slot:actions>
        <v-btn variant="text" @click="snackbar.show = false">
          Close
        </v-btn>
      </template>
    </v-snackbar>
  </AppLayout>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { useRouter } from 'vue-router'
import { updateDoc, doc, serverTimestamp } from 'firebase/firestore'
import { updateProfile, updateEmail, sendEmailVerification } from 'firebase/auth'
import AppLayout from '../components/AppLayout.vue'
import PermissionGuard from '../components/PermissionGuard.vue'
import ProfileSecurityTab from '../components/profile/ProfileSecurityTab.vue'
import { useAuthStore } from '../stores/auth'
import { useAudit } from '../composables/useAudit'
import { db, auth } from '../firebase'

const router = useRouter()
const authStore = useAuthStore()
const { logEvent } = useAudit()

/* ---------- state ---------- */
const loading = ref(true)
const saving = ref(false)
const error = ref('')
const selectedTab = ref('profile')

// Profile form state
const form = ref({
  displayName: '',
  email: '',
  phone: '',
  department: '',
  title: '',
  region: '', // NEW: Region field
  location: '',
  bio: ''
})

const isFormDirty = ref(false)

// Snackbar for notifications
const snackbar = ref({
  show: false,
  message: '',
  color: 'success'
})

/* ---------- computed ---------- */
const currentUser = computed(() => authStore.user)
const userRole = computed(() => authStore.role)

// Available tabs based on permissions - only profile and security now
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

// Computed property for phone with automatic formatting
const formattedPhone = computed({
  get() {
    return form.value.phone
  },
  set(value) {
    const formatted = formatPhoneNumber(value)
    form.value.phone = formatted
    markFormDirty()
  }
})

// Region options (matching create user dialog)
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

// Email validation rules
const emailRules = [
  value => !value || /.+@.+\..+/.test(value) || 'Email must be valid'
]

// Phone validation rules
const phoneRules = [
  value => !value || /^\(\d{3}\)\s\d{3}-\d{4}$/.test(value) || 'Phone must be in format (XXX) XXX-XXXX'
]

/* ---------- methods ---------- */
const showSnackbar = (message, color = 'success') => {
  snackbar.value = { show: true, message, color }
}

const formatDate = (dateString) => {
  if (!dateString) return 'N/A'
  return new Date(dateString).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  })
}

const getRoleColor = (role) => {
  const colors = {
    owner: 'purple',
    admin: 'blue',
    user: 'green',
    viewer: 'orange',
    pending: 'grey'
  }
  return colors[role] || 'grey'
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
        form.value.region = userDoc.region || '' // NEW: Load region field
        form.value.location = userDoc.location || ''
        form.value.bio = userDoc.bio || ''
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
      region: form.value.region, // NEW: Save region field
      location: form.value.location,
      bio: form.value.bio,
      updatedAt: serverTimestamp()
    })

    // Log the activity
    await logEvent('profile_updated', {
      userId: user.uid,
      changes: {
        displayName: form.value.displayName,
        department: form.value.department,
        title: form.value.title,
        region: form.value.region // NEW: Include region in audit log
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

onMounted(async () => {
  try {
    loading.value = true
    
    // Wait for auth to be ready
    if (!authStore.ready) {
      await authStore.initializeAuth()
    }
    
    // Check if user is authenticated
    if (!currentUser.value) {
      router.push('/login')
      return
    }

    await loadUserData()

  } catch (err) {
    console.error('Error initializing profile:', err)
    error.value = 'Failed to load profile'
  } finally {
    loading.value = false
  }
})
</script>

<style scoped>
.profile-container {
  max-width: 1000px;
  margin: 0 auto;
  padding: 24px;
}

.page-header {
  text-align: center;
}

/* Login page matching field styles */
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

/* Outlined select styling */
.v-select.v-select--variant-outlined :deep(.v-field) {
  background: #f8f9fa;
  border: 1px solid #e0e0e0;
  transition: all 0.2s ease;
}

.v-select.v-select--variant-outlined :deep(.v-field:hover) {
  background: #f0f2f5;
  border-color: rgba(66, 109, 169, 0.4);
}

.v-select.v-select--variant-outlined :deep(.v-field--focused) {
  background: white;
  border-color: #426DA9;
  box-shadow: 0 0 0 2px rgba(66, 109, 169, 0.1);
}

.v-select :deep(.v-field__input) {
  font-family: 'Cambria', Georgia, serif;
  font-size: 1rem;
  color: #003057;
  padding: 0.75rem 1rem !important;
  min-height: 48px !important;
}

/* Submit button styling */
.submit-btn {
  font-family: 'ITC Franklin Gothic', Arial, sans-serif;
  font-weight: 600;
  text-transform: none;
  letter-spacing: 0.5px;
  height: 48px;
  border-radius: 8px;
}

.v-card-title {
  font-family: 'ITC Franklin Gothic', Arial, sans-serif;
}

.v-card-text {
  font-family: 'Cambria', Georgia, serif;
}

.text-h4 {
  font-family: 'ITC Franklin Gothic', Arial, sans-serif;
}

.text-h5, .text-h6 {
  font-family: 'ITC Franklin Gothic', Arial, sans-serif;
  font-weight: 600;
}

/* Responsive adjustments */
@media (max-width: 600px) {
  .profile-container {
    padding: 16px;
  }
  
  .d-flex.justify-space-between {
    flex-direction: column;
    align-items: flex-start !important;
  }
  
  .d-flex.justify-space-between .v-chip {
    margin-top: 16px;
    align-self: flex-end;
  }
}
</style>