<!-- client/src/views/ProfileView.vue - FIXED with Complete Brand Styling -->
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
                          variant="outlined"
                          density="comfortable"
                          placeholder="Enter your full name"
                          @input="markFormDirty"
                          :loading="loading"
                          class="brand-field"
                        />
                      </div>
                    </v-col>

                    <!-- Email -->
                    <v-col cols="12" md="6">
                      <div class="field-group">
                        <label class="field-label">Email Address</label>
                        <v-text-field
                          v-model="form.email"
                          variant="outlined"
                          density="comfortable"
                          placeholder="Enter your email"
                          :rules="emailRules"
                          @input="markFormDirty"
                          :loading="loading"
                          class="brand-field"
                        />
                      </div>
                    </v-col>

                    <!-- Phone -->
                    <v-col cols="12" md="6">
                      <div class="field-group">
                        <label class="field-label">Phone Number</label>
                        <v-text-field
                          v-model="formattedPhone"
                          variant="outlined"
                          density="comfortable"
                          placeholder="(XXX) XXX-XXXX"
                          :rules="phoneRules"
                          maxlength="14"
                          @input="markFormDirty"
                          :loading="loading"
                          class="brand-field"
                        />
                      </div>
                    </v-col>

                    <!-- Job Title -->
                    <v-col cols="12" md="6">
                      <div class="field-group">
                        <label class="field-label">Job Title</label>
                        <v-text-field
                          v-model="form.title"
                          variant="outlined"
                          density="comfortable"
                          placeholder="Enter your job title"
                          @input="markFormDirty"
                          :loading="loading"
                          class="brand-field"
                        />
                      </div>
                    </v-col>

                    <!-- Department -->
                    <v-col cols="12" md="6">
                      <div class="field-group">
                        <label class="field-label">Department</label>
                        <v-text-field
                          v-model="form.department"
                          variant="outlined"
                          density="comfortable"
                          placeholder="Enter your department"
                          @input="markFormDirty"
                          :loading="loading"
                          class="brand-field"
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
                          variant="outlined"
                          density="comfortable"
                          placeholder="Select your region"
                          @update:model-value="markFormDirty"
                          :loading="loading"
                          class="brand-field"
                        />
                      </div>
                    </v-col>

                    <!-- Location -->
                    <v-col cols="12">
                      <div class="field-group">
                        <label class="field-label">Location</label>
                        <v-text-field
                          v-model="form.location"
                          variant="outlined"
                          density="comfortable"
                          placeholder="City, State"
                          @input="markFormDirty"
                          :loading="loading"
                          class="brand-field"
                        />
                      </div>
                    </v-col>
                  </v-row>
                </div>

                <!-- Additional Information -->
                <div class="mb-6">
                  <h2 class="text-h6 font-weight-bold mb-2">
                    <v-icon class="me-2" color="primary">mdi-information</v-icon>
                    Additional Information
                  </h2>

                  <v-row>
                    <!-- Bio -->
                    <v-col cols="12">
                      <div class="field-group">
                        <label class="field-label">Bio / Notes</label>
                        <v-textarea
                          v-model="form.bio"
                          variant="outlined"
                          density="comfortable"
                          placeholder="Additional notes about yourself..."
                          rows="3"
                          @input="markFormDirty"
                          :loading="loading"
                          class="brand-field"
                        />
                      </div>
                    </v-col>
                  </v-row>
                </div>

                <!-- Save Button -->
                <div class="d-flex justify-end gap-3">
                  <v-btn
                    v-if="isFormDirty"
                    variant="outlined"
                    @click="resetForm"
                    :disabled="saving"
                    class="brand-btn-outline"
                  >
                    Cancel
                  </v-btn>
                  
                  <v-btn
                    type="submit"
                    color="primary"
                    :loading="saving"
                    :disabled="!isFormDirty"
                    prepend-icon="mdi-content-save"
                    class="brand-btn-primary"
                  >
                    Save Changes
                  </v-btn>
                </div>
              </v-form>
            </v-card-text>
          </v-tabs-window-item>

          <!-- Security Tab -->
          <v-tabs-window-item value="security">
            <v-card-text class="pa-6">
              <div class="mb-6">
                <h2 class="text-h6 font-weight-bold mb-2">
                  <v-icon class="me-2" color="primary">mdi-shield-account</v-icon>
                  Security Settings
                </h2>
                <p class="text-body-2 text-medium-emphasis mb-4">
                  Manage your account security and privacy settings
                </p>

                <!-- Account Information -->
                <v-row>
                  <v-col cols="12" md="6">
                    <v-card variant="outlined" class="pa-4 brand-info-card">
                      <h3 class="text-subtitle-1 font-weight-bold mb-2">Account Status</h3>
                      <div class="d-flex align-center gap-2 mb-2">
                        <v-chip 
                          :color="getRoleColor(userRole)" 
                          size="small" 
                          variant="flat"
                        >
                          {{ userRole?.toUpperCase() || 'Unknown' }}
                        </v-chip>
                        <v-chip color="success" size="small" variant="outlined">
                          Active
                        </v-chip>
                      </div>
                      <p class="text-body-2 text-medium-emphasis">
                        Account created: {{ formatDate(userDocument?.createdAt) }}
                      </p>
                    </v-card>
                  </v-col>

                  <v-col cols="12" md="6">
                    <v-card variant="outlined" class="pa-4 brand-info-card">
                      <h3 class="text-subtitle-1 font-weight-bold mb-2">Email Verification</h3>
                      <div class="d-flex align-center gap-2 mb-2">
                        <v-icon 
                          :color="user?.emailVerified ? 'success' : 'warning'"
                          size="small"
                        >
                          {{ user?.emailVerified ? 'mdi-email-check' : 'mdi-email-alert' }}
                        </v-icon>
                        <span class="text-body-2">
                          {{ user?.emailVerified ? 'Verified' : 'Not Verified' }}
                        </span>
                      </div>
                      <v-btn 
                        v-if="!user?.emailVerified"
                        size="small" 
                        variant="outlined" 
                        color="primary"
                        @click="sendVerificationEmail"
                        class="brand-btn-outline"
                      >
                        Send Verification Email
                      </v-btn>
                    </v-card>
                  </v-col>
                </v-row>
              </div>
            </v-card-text>
          </v-tabs-window-item>
        </v-tabs-window>
      </v-card>

      <!-- Loading Overlay -->
      <v-overlay v-model="loading" class="d-flex align-center justify-center">
        <v-progress-circular
          indeterminate
          size="64"
          color="primary"
        />
      </v-overlay>

      <!-- Snackbar for notifications -->
      <v-snackbar
        v-model="snackbar.show"
        :color="snackbar.color"
        timeout="4000"
        location="top right"
      >
        {{ snackbar.message }}
        <template #actions>
          <v-btn
            color="white"
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
import { updateDoc, doc, serverTimestamp, getDoc } from 'firebase/firestore'
import { updateProfile, updateEmail, sendEmailVerification } from 'firebase/auth'
import { db, auth } from '../firebase'
import { useAuthStore } from '../stores/auth'
import { useAudit } from '../composables/useAudit'
import AppLayout from '../components/AppLayout.vue'

const authStore = useAuthStore()
const { logEvent } = useAudit()

// Reactive state
const loading = ref(false)
const saving = ref(false)
const activeTab = ref('profile')
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

// FIXED: Enhanced phone formatting with proper data handling
const formattedPhone = computed({
  get() {
    return formatPhoneNumber(form.value.phone)
  },
  set(value) {
    const numericOnly = String(value).replace(/\D/g, '')
    form.value.phone = numericOnly
    markFormDirty()
    console.log('📱 Phone updated in profile:', { formatted: value, stored: numericOnly })
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
  value => !value || /^\(\d{3}\)\s\d{3}-\d{4}$/.test(formatPhoneNumber(value)) || 'Phone must be in format (XXX) XXX-XXXX'
]

// Methods
const showSnackbar = (message, color = 'success') => {
  snackbar.value = { show: true, message, color }
}

const formatDate = (dateString) => {
  if (!dateString) return 'N/A'
  
  let date
  if (dateString.toDate) {
    date = dateString.toDate() // Firestore timestamp
  } else {
    date = new Date(dateString)
  }
  
  return date.toLocaleDateString('en-US', {
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

const markFormDirty = () => {
  isFormDirty.value = true
}

// FIXED: Enhanced data loading with comprehensive error handling and fresh data fetch
const loadUserData = async () => {
  loading.value = true
  try {
    const currentUser = user.value
    if (!currentUser) {
      console.warn('No user found when trying to load profile data')
      return
    }

    console.log('🔄 Loading user profile data for:', currentUser.uid)

    // FIXED: Always fetch fresh data from Firestore
    const userDocRef = doc(db, 'users', currentUser.uid)
    const userDocSnap = await getDoc(userDocRef)
    
    let freshUserDoc = null
    if (userDocSnap.exists()) {
      freshUserDoc = userDocSnap.data()
      console.log('📄 Fresh user document from Firestore:', JSON.stringify(freshUserDoc, null, 2))
    } else {
      console.warn('⚠️ No Firestore user document found')
    }
    
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
      
      console.log('✅ Form populated with fresh data:', JSON.stringify(form.value, null, 2))
    } else {
      // Fallback to Firebase Auth data if no Firestore document
      console.warn('⚠️ No Firestore user document found, using Firebase Auth data')
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
    console.error('❌ Error loading user data:', error)
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
    
    console.log('💾 Saving profile data:', JSON.stringify(form.value, null, 2))

    // Update Firebase Auth profile if displayName changed
    if (form.value.displayName !== currentUser.displayName) {
      await updateProfile(currentUser, {
        displayName: form.value.displayName
      })
      console.log('✅ Firebase Auth displayName updated')
    }

    // Handle email change
    if (form.value.email !== currentUser.email) {
      await updateEmail(currentUser, form.value.email)
      await sendEmailVerification(currentUser)
      showSnackbar('Email updated. Please check your new email for verification.', 'info')
    }

    // FIXED: Update Firestore user document with all profile fields
    const updateData = {
      displayName: form.value.displayName,
      phone: form.value.phone, // Store raw numeric value
      department: form.value.department,
      title: form.value.title,
      region: form.value.region,
      location: form.value.location,
      bio: form.value.bio,
      updatedAt: serverTimestamp()
    }
    
    console.log('📊 Updating Firestore with:', JSON.stringify(updateData, null, 2))

    await updateDoc(doc(db, 'users', currentUser.uid), updateData)
    
    console.log('✅ Firestore user document updated successfully')

    // Log the activity
    await logEvent('profile_updated', {
      userId: currentUser.uid,
      changes: {
        displayName: form.value.displayName,
        department: form.value.department,
        title: form.value.title,
        region: form.value.region
      }
    })

    // Refresh auth store to reflect changes
    await authStore.refreshCurrentUser()
    
    // Update original form data
    originalForm.value = { ...form.value }
    isFormDirty.value = false
    
    showSnackbar('Profile updated successfully')

  } catch (error) {
    console.error('❌ Error saving profile:', error)
    if (error.code === 'auth/requires-recent-login') {
      showSnackbar('Please log in again to change your email', 'warning')
    } else {
      showSnackbar('Failed to update profile', 'error')
    }
  } finally {
    saving.value = false
  }
}

const sendVerificationEmail = async () => {
  try {
    await sendEmailVerification(auth.currentUser)
    showSnackbar('Verification email sent', 'success')
  } catch (error) {
    console.error('Error sending verification email:', error)
    showSnackbar('Failed to send verification email', 'error')
  }
}

// FIXED: Watch for user changes and reload data immediately
watch(
  () => authStore.user,
  (newUser) => {
    if (newUser) {
      console.log('👤 User changed, reloading profile data')
      loadUserData()
    }
  },
  { immediate: true }
)

// FIXED: Watch for userDocument changes and update form if not editing
watch(
  () => authStore.userDocument,
  (newUserDoc) => {
    if (newUserDoc && !loading.value && !isFormDirty.value) {
      console.log('📄 User document changed, updating form if not dirty')
      
      form.value = {
        displayName: newUserDoc.displayName || user.value?.displayName || '',
        email: newUserDoc.email || user.value?.email || '',
        phone: newUserDoc.phone || '',
        department: newUserDoc.department || '',
        title: newUserDoc.title || '',
        region: newUserDoc.region || '',
        location: newUserDoc.location || '',
        bio: newUserDoc.bio || ''
      }
      
      originalForm.value = { ...form.value }
      
      console.log('🔄 Form updated from document change:', JSON.stringify(form.value, null, 2))
    }
  },
  { deep: true }
)

// Load user data on component mount
onMounted(() => {
  if (user.value) {
    console.log('🚀 Component mounted, loading profile data')
    loadUserData()
  }
})
</script>

<style scoped>
/* Louisiana Department of Health Brand Styling */

.field-group {
  margin-bottom: 1rem;
}

.field-label {
  display: block;
  font-size: 0.875rem;
  font-weight: 500;
  color: rgb(var(--v-theme-on-surface));
  margin-bottom: 0.5rem;
  font-family: 'Franklin Gothic', 'Arial Black', sans-serif; /* Louisiana Department of Health header font */
}

/* Louisiana Department of Health brand field styling */
.brand-field :deep(.v-field) {
  border-radius: 8px;
  font-family: 'Cambria', serif; /* Louisiana Department of Health body font */
}

.brand-field :deep(.v-field--focused) {
  background-color: rgba(25, 118, 210, 0.05); /* Louisiana Department of Health primary color */
}

.brand-field :deep(.v-field__input) {
  font-family: 'Cambria', serif;
}

/* Button styling with Louisiana Department of Health colors */
.brand-btn-primary {
  background-color: #1976d2; /* Louisiana Department of Health primary blue */
  color: white;
  font-weight: 600;
  box-shadow: 0 2px 4px rgba(25, 118, 210, 0.3);
}

.brand-btn-outline {
  border: 2px solid #1976d2;
  color: #1976d2;
  font-weight: 600;
}

.brand-btn-outline:hover {
  background-color: rgba(25, 118, 210, 0.1);
}

/* Info card styling */
.brand-info-card {
  border: 1px solid rgba(25, 118, 210, 0.2);
  background-color: rgba(25, 118, 210, 0.05);
}

.brand-info-card :deep(.v-card-text) {
  font-family: 'Cambria', serif;
}

/* Card styling */
.v-card {
  transition: all 0.3s ease;
  border: 1px solid rgba(25, 118, 210, 0.1);
}

.v-tabs-window-item {
  transition: all 0.3s ease;
}

/* Tab styling */
.v-tabs :deep(.v-tab) {
  font-family: 'Franklin Gothic', 'Arial Black', sans-serif;
  font-weight: 600;
}

.v-tabs :deep(.v-tab--selected) {
  color: #1976d2;
}

/* Header styling */
h1, h2, h3 {
  font-family: 'Franklin Gothic', 'Arial Black', sans-serif;
}

/* Body text styling */
p, .text-body-1, .text-body-2 {
  font-family: 'Cambria', serif;
}

/* Primary color theming */
.text-primary {
  color: #1976d2 !important;
}

/* Snackbar styling */
.v-snackbar :deep(.v-snackbar__wrapper) {
  font-family: 'Cambria', serif;
}

/* Loading overlay */
.v-overlay :deep(.v-progress-circular) {
  color: #1976d2;
}
</style>