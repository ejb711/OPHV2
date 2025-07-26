<!-- client/src/views/UserProfileEditView.vue -->
<template>
  <AppLayout>
    <div class="user-profile-edit-container">
      <!-- Page Header with Back Navigation -->
      <div class="page-header mb-6">
        <div class="d-flex align-center mb-4">
          <v-btn
            icon="mdi-arrow-left"
            variant="text"
            @click="goBack"
            class="mr-3"
          />
          <div>
            <h1 class="text-h4 font-weight-bold mb-1">
              {{ isLoading ? 'Loading...' : `Edit ${editUser?.displayName || editUser?.email}` }}
            </h1>
            <p class="text-body-1 text-medium-emphasis">
              Manage user personal information and account details
            </p>
          </div>
        </div>

        <!-- User Role Badge -->
        <div v-if="editUser" class="d-flex align-center justify-space-between">
          <v-chip
            :color="getRoleColor(editUser.role)"
            variant="elevated"
            class="text-capitalize"
          >
            <v-icon start>mdi-shield-account</v-icon>
            {{ editUser.role }}
          </v-chip>

          <!-- Last Login Info -->
          <div v-if="editUser.lastActive" class="text-caption text-medium-emphasis">
            Last active: {{ formatDate(editUser.lastActive) }}
          </div>
        </div>
      </div>

      <!-- Loading State -->
      <div v-if="isLoading" class="text-center py-8">
        <v-progress-circular
          indeterminate
          size="64"
          color="primary"
        />
        <p class="mt-4 text-body-1">Loading user profile...</p>
      </div>

      <!-- Error State -->
      <v-alert v-else-if="error" type="error" variant="tonal" class="mb-6">
        <v-alert-title>Error Loading User</v-alert-title>
        {{ error }}
        <template #append>
          <v-btn
            color="error"
            variant="text"
            @click="loadUserData"
          >
            Retry
          </v-btn>
        </template>
      </v-alert>

      <!-- Edit Form -->
      <div v-else-if="editUser">
        <v-card elevation="2">
          <v-card-text class="pa-6">
            <div class="d-flex justify-space-between align-start mb-6">
              <div>
                <h2 class="text-h5 font-weight-bold mb-2">Personal Information</h2>
                <p class="text-body-1 text-medium-emphasis">
                  Update user profile details and contact information
                </p>
              </div>

              <!-- Save Button -->
              <v-btn
                color="primary"
                variant="flat"
                :loading="isSaving"
                :disabled="!isFormDirty"
                @click="saveProfile"
                prepend-icon="mdi-content-save"
              >
                {{ isSaving ? 'Saving...' : 'Save Changes' }}
              </v-btn>
            </div>

            <v-form ref="formRef" @submit.prevent="saveProfile">
              <v-row>
                <!-- Basic Information Section -->
                <v-col cols="12">
                  <h3 class="text-h6 font-weight-bold mb-4">
                    <v-icon start>mdi-account</v-icon>
                    Basic Information
                  </h3>
                </v-col>

                <v-col cols="12" md="6">
                  <div class="field-group">
                    <label class="field-label">Display Name</label>
                    <v-text-field
                      v-model="form.displayName"
                      variant="outlined"
                      density="comfortable"
                      required
                      placeholder="Enter display name"
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
                      variant="outlined"
                      density="comfortable"
                      required
                      placeholder="Enter email address"
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
                      variant="outlined"
                      density="comfortable"
                      placeholder="(XXX) XXX-XXXX"
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
                      variant="outlined"
                      density="comfortable"
                      placeholder="Enter job title"
                      @input="markFormDirty"
                    />
                  </div>
                </v-col>

                <v-col cols="12" md="6">
                  <div class="field-group">
                    <label class="field-label">Department</label>
                    <v-text-field
                      v-model="form.department"
                      variant="outlined"
                      density="comfortable"
                      placeholder="Enter department"
                      @input="markFormDirty"
                    />
                  </div>
                </v-col>

                <v-col cols="12" md="6">
                  <div class="field-group">
                    <label class="field-label">Region</label>
                    <v-select
                      v-model="form.region"
                      :items="regionOptions"
                      variant="outlined"
                      density="comfortable"
                      placeholder="Select region"
                      @update:model-value="markFormDirty"
                    />
                  </div>
                </v-col>

                <v-col cols="12" md="6">
                  <div class="field-group">
                    <label class="field-label">Location</label>
                    <v-text-field
                      v-model="form.location"
                      variant="outlined"
                      density="comfortable"
                      placeholder="Enter location"
                      @input="markFormDirty"
                    />
                  </div>
                </v-col>

                <!-- Additional Information Section -->
                <v-col cols="12" class="mt-4">
                  <h3 class="text-h6 font-weight-bold mb-4">
                    <v-icon start>mdi-information</v-icon>
                    Additional Information
                  </h3>
                </v-col>

                <v-col cols="12">
                  <div class="field-group">
                    <label class="field-label">Bio / Notes</label>
                    <v-textarea
                      v-model="form.bio"
                      variant="outlined"
                      density="comfortable"
                      placeholder="Additional notes about this user..."
                      rows="3"
                      @input="markFormDirty"
                    />
                  </div>
                </v-col>

                <!-- Account Status Section -->
                <v-col cols="12" class="mt-4">
                  <h3 class="text-h6 font-weight-bold mb-4">
                    <v-icon start>mdi-account-cog</v-icon>
                    Account Information
                  </h3>
                </v-col>

                <v-col cols="12" md="6">
                  <div class="field-group">
                    <label class="field-label">Account Created</label>
                    <v-text-field
                      :model-value="formatDate(editUser.createdAt)"
                      variant="outlined"
                      density="comfortable"
                      readonly
                      prepend-inner-icon="mdi-calendar"
                    />
                  </div>
                </v-col>

                <v-col cols="12" md="6">
                  <div class="field-group">
                    <label class="field-label">Account Status</label>
                    <v-text-field
                      :model-value="(editUser.status || 'active').charAt(0).toUpperCase() + (editUser.status || 'active').slice(1)"
                      variant="outlined"
                      density="comfortable"
                      readonly
                      :prepend-inner-icon="getStatusIcon(editUser.status)"
                    />
                  </div>
                </v-col>

                <!-- Action Buttons -->
                <v-col cols="12" class="pt-6">
                  <div class="d-flex gap-3 justify-end">
                    <v-btn
                      variant="outlined"
                      @click="resetForm"
                      :disabled="!isFormDirty"
                    >
                      Reset Changes
                    </v-btn>

                    <v-btn
                      color="primary"
                      variant="flat"
                      :loading="isSaving"
                      :disabled="!isFormDirty"
                      @click="saveProfile"
                      prepend-icon="mdi-content-save"
                    >
                      {{ isSaving ? 'Saving...' : 'Save Changes' }}
                    </v-btn>
                  </div>
                </v-col>
              </v-row>
            </v-form>
          </v-card-text>
        </v-card>
      </div>

      <!-- User Not Found -->
      <v-alert v-else type="warning" variant="tonal" class="mb-6">
        <v-alert-title>User Not Found</v-alert-title>
        The requested user could not be found or you don't have permission to edit them.
        <template #append>
          <v-btn
            color="warning"
            variant="text"
            @click="goBack"
          >
            Go Back
          </v-btn>
        </template>
      </v-alert>

      <!-- Success Snackbar -->
      <v-snackbar
        v-model="snackbar.show"
        :color="snackbar.color"
        timeout="4000"
        location="top"
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
    </div>
  </AppLayout>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { doc, getDoc, updateDoc } from 'firebase/firestore'
import { db } from '@/firebase'
import { useAuthStore } from '@/stores/auth'
import { useAudit } from '@/composables/useAudit'
import AppLayout from '@/components/AppLayout.vue'

const route = useRoute()
const router = useRouter()
const authStore = useAuthStore()
const { logActivity } = useAudit()

// State
const isLoading = ref(true)
const isSaving = ref(false)
const isFormDirty = ref(false)
const error = ref('')
const editUser = ref(null)
const formRef = ref(null)

const snackbar = ref({
  show: false,
  message: '',
  color: 'success'
})

// Form data
const form = ref({
  displayName: '',
  email: '',
  phone: '',
  title: '',
  department: '',
  region: '',
  location: '',
  bio: ''
})

// Original form data for reset functionality
const originalForm = ref({})

// Region options
const regionOptions = [
  'Region 1 - New Orleans',
  'Region 2 - Thibodaux',
  'Region 3 - Houma',
  'Region 4 - Lafayette',
  'Region 5 - Lake Charles',
  'Region 6 - Alexandria',
  'Region 7 - Shreveport',
  'Region 8 - Monroe',
  'Region 9 - Baton Rouge'
]

// Validation rules
const emailRules = [
  v => !!v || 'Email is required',
  v => /.+@.+\..+/.test(v) || 'Email must be valid'
]

const phoneRules = [
  v => !v || v.length >= 10 || 'Phone number must be at least 10 digits'
]

// Computed
const formattedPhone = computed({
  get() {
    return formatPhoneNumber(form.value.phone)
  },
  set(value) {
    form.value.phone = value.replace(/\D/g, '')
    markFormDirty()
  }
})

// Methods
function markFormDirty() {
  isFormDirty.value = true
}

function formatPhoneNumber(phone) {
  if (!phone) return ''
  const digits = phone.replace(/\D/g, '')
  if (digits.length >= 10) {
    return `(${digits.slice(0,3)}) ${digits.slice(3,6)}-${digits.slice(6,10)}`
  }
  return digits
}

function formatDate(date) {
  if (!date) return 'Unknown'

  let dateObj
  if (date.toDate) {
    dateObj = date.toDate()
  } else if (date instanceof Date) {
    dateObj = date
  } else {
    dateObj = new Date(date)
  }

  return dateObj.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  })
}

function getRoleColor(role) {
  const colors = {
    owner: 'purple',
    admin: 'primary',
    user: 'success',
    viewer: 'info',
    pending: 'warning'
  }
  return colors[role] || 'grey'
}

function getStatusIcon(status) {
  const icons = {
    active: 'mdi-check-circle',
    pending: 'mdi-clock',
    inactive: 'mdi-pause-circle',
    suspended: 'mdi-cancel'
  }
  return icons[status || 'active'] || 'mdi-help-circle'
}

async function loadUserData() {
  try {
    isLoading.value = true
    error.value = ''

    const userId = route.params.userId
    if (!userId) {
      error.value = 'No user ID provided'
      return
    }

    // Check permissions
    if (!authStore.hasPermission('edit_users')) {
      error.value = 'You do not have permission to edit users'
      return
    }

    const userDoc = await getDoc(doc(db, 'users', userId))
    if (!userDoc.exists()) {
      error.value = 'User not found'
      return
    }

    const userData = { id: userDoc.id, ...userDoc.data() }
    editUser.value = userData

    // Populate form
    form.value = {
      displayName: userData.displayName || '',
      email: userData.email || '',
      phone: userData.phone || '',
      title: userData.title || '',
      department: userData.department || '',
      region: userData.region || '',
      location: userData.location || '',
      bio: userData.bio || ''
    }

    // Store original form data
    originalForm.value = { ...form.value }
    isFormDirty.value = false

  } catch (err) {
    error.value = 'Failed to load user data. Please try again.'
  } finally {
    isLoading.value = false
  }
}

async function saveProfile() {
  try {
    isSaving.value = true

    // Validate form
    if (!formRef.value) return
    const { valid } = await formRef.value.validate()
    if (!valid) return

    const userId = route.params.userId
    const userRef = doc(db, 'users', userId)

    // Update user document
    await updateDoc(userRef, {
      displayName: form.value.displayName,
      email: form.value.email,
      phone: form.value.phone,
      title: form.value.title,
      department: form.value.department,
      region: form.value.region,
      location: form.value.location,
      bio: form.value.bio,
      updatedAt: new Date(),
      updatedBy: authStore.user.uid
    })

    // Log audit activity
    await logActivity('user_profile_updated', {
      targetUserId: userId,
      targetUserEmail: editUser.value.email,
      changes: getChangedFields(),
      adminId: authStore.user.uid,
      adminEmail: authStore.user.email
    })

    // Update local data
    editUser.value = { ...editUser.value, ...form.value }
    originalForm.value = { ...form.value }
    isFormDirty.value = false

    snackbar.value = {
      show: true,
      message: 'User profile updated successfully',
      color: 'success'
    }

  } catch (err) {
    snackbar.value = {
      show: true,
      message: 'Failed to save profile. Please try again.',
      color: 'error'
    }
  } finally {
    isSaving.value = false
  }
}

function getChangedFields() {
  const changes = {}
  for (const key in form.value) {
    if (form.value[key] !== originalForm.value[key]) {
      changes[key] = {
        from: originalForm.value[key],
        to: form.value[key]
      }
    }
  }
  return changes
}

function resetForm() {
  form.value = { ...originalForm.value }
  isFormDirty.value = false
}

function goBack() {
  if (isFormDirty.value) {
    if (confirm('You have unsaved changes. Are you sure you want to leave?')) {
      router.push('/admin')
    }
  } else {
    router.push('/admin')
  }
}

// Lifecycle
onMounted(() => {
  loadUserData()
})

// Watch for unsaved changes before leaving
watch(() => route.path, (newPath, oldPath) => {
  if (newPath !== oldPath && isFormDirty.value) {
    if (!confirm('You have unsaved changes. Are you sure you want to leave?')) {
      // Prevent navigation
      router.push(oldPath)
    }
  }
})
</script>

<style scoped>
.user-profile-edit-container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 16px;
}

.field-group {
  margin-bottom: 8px;
}

.field-label {
  display: block;
  font-weight: 500;
  margin-bottom: 4px;
  color: rgb(var(--v-theme-on-surface));
  font-size: 0.875rem;
}

.page-header {
  border-bottom: 1px solid rgb(var(--v-theme-outline));
  padding-bottom: 24px;
}
</style>