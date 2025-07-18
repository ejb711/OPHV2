<!-- client/src/views/ProfileView.vue -->
<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import AppLayout from '../components/AppLayout.vue'
import PermissionGuard from '../components/PermissionGuard.vue'
import { useAuthStore } from '../stores/auth'
import { usePermissionsStore } from '../stores/permissions'

const router = useRouter()
const authStore = useAuthStore()
const permissionsStore = usePermissionsStore()

/* ---------- state ---------- */
const loading = ref(true)
const error = ref('')
const selectedTab = ref('profile')

// Snackbar for notifications
const snackbar = ref({
  show: false,
  message: '',
  color: 'success'
})

/* ---------- computed ---------- */
const currentUser = computed(() => authStore.user)
const userRole = computed(() => authStore.role)
const permissions = computed(() => authStore.permissions || [])

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
      value: 'settings', 
      title: 'Settings', 
      icon: 'mdi-cog',
      permission: 'edit_own_profile' 
    },
    { 
      value: 'activity', 
      title: 'Activity', 
      icon: 'mdi-history',
      permission: 'view_own_activity' 
    },
    { 
      value: 'security', 
      title: 'Security', 
      icon: 'mdi-shield-account',
      permission: 'manage_own_security' 
    }
  ]
  
  // Filter tabs based on user permissions
  return tabs.filter(tab => {
    return permissions.value.includes(tab.permission)
  })
})

/* ---------- methods ---------- */
const showSnackbar = (message, color = 'success') => {
  snackbar.value = {
    show: true,
    message,
    color
  }
}

/* ---------- lifecycle ---------- */
onMounted(async () => {
  loading.value = true
  try {
    // Ensure user data is loaded
    if (!currentUser.value) {
      router.push('/login')
      return
    }
    
    // Ensure permissions are loaded
    if (!authStore.ready) {
      await authStore.waitForAuth()
    }
    
    loading.value = false
  } catch (error) {
    console.error('Error loading profile:', error)
    showSnackbar('Failed to load profile data', 'error')
    loading.value = false
  }
})
</script>

<template>
  <AppLayout>
    <!-- Page Actions -->
    <template #actions>
      <v-btn
        color="primary"
        variant="flat"
        @click="router.push('/dash')"
      >
        <v-icon left>mdi-arrow-left</v-icon>
        Dashboard
      </v-btn>
    </template>

    <!-- Main Content -->
    <div class="profile-container">
      <!-- Page Header -->
      <div class="page-header mb-6">
        <h1 class="text-h4 font-weight-bold mb-2">
          My Profile
        </h1>
        <p class="text-subtitle-1 text-medium-emphasis">
          Manage your personal information, settings, and account security
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
        <v-card class="mb-6">
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
        <v-card>
          <v-card-text>
            <!-- Profile Tab -->
            <div v-if="selectedTab === 'profile'">
              <PermissionGuard permission="view_own_profile">
                <h2 class="text-h5 font-weight-bold mb-4">Profile Information</h2>
                
                <!-- Basic User Info -->
                <v-row>
                  <v-col cols="12" md="8">
                    <v-card variant="outlined" class="mb-4">
                      <v-card-title class="text-h6 font-weight-bold">
                        Account Details
                      </v-card-title>
                      <v-card-text>
                        <v-row>
                          <v-col cols="12" sm="6">
                            <div class="mb-3">
                              <label class="text-subtitle-2 font-weight-bold">Email</label>
                              <p class="text-body-1">{{ currentUser.email }}</p>
                            </div>
                          </v-col>
                          <v-col cols="12" sm="6">
                            <div class="mb-3">
                              <label class="text-subtitle-2 font-weight-bold">Role</label>
                              <v-chip 
                                :color="getRoleColor(userRole)" 
                                size="small"
                                class="ml-0"
                              >
                                {{ userRole }}
                              </v-chip>
                            </div>
                          </v-col>
                          <v-col cols="12" sm="6">
                            <div class="mb-3">
                              <label class="text-subtitle-2 font-weight-bold">Account Created</label>
                              <p class="text-body-1">
                                {{ formatDate(currentUser.metadata?.creationTime) }}
                              </p>
                            </div>
                          </v-col>
                          <v-col cols="12" sm="6">
                            <div class="mb-3">
                              <label class="text-subtitle-2 font-weight-bold">Last Sign In</label>
                              <p class="text-body-1">
                                {{ formatDate(currentUser.metadata?.lastSignInTime) }}
                              </p>
                            </div>
                          </v-col>
                        </v-row>
                      </v-card-text>
                    </v-card>
                  </v-col>
                  
                  <!-- Profile Photo Section -->
                  <v-col cols="12" md="4">
                    <v-card variant="outlined" class="text-center">
                      <v-card-title class="text-h6 font-weight-bold">
                        Profile Photo
                      </v-card-title>
                      <v-card-text>
                        <v-avatar
                          size="120"
                          class="mb-4"
                        >
                          <v-img
                            v-if="currentUser.photoURL"
                            :src="currentUser.photoURL"
                            :alt="currentUser.email"
                          />
                          <v-icon v-else size="60">mdi-account</v-icon>
                        </v-avatar>
                        
                        <PermissionGuard permission="upload_avatar">
                          <v-btn
                            color="primary"
                            variant="outlined"
                            block
                            disabled
                          >
                            <v-icon left>mdi-camera</v-icon>
                            Change Photo
                          </v-btn>
                          <p class="text-caption mt-2 text-medium-emphasis">
                            Photo upload coming soon
                          </p>
                        </PermissionGuard>
                      </v-card-text>
                    </v-card>
                  </v-col>
                </v-row>
              </PermissionGuard>
            </div>

            <!-- Settings Tab -->
            <div v-else-if="selectedTab === 'settings'">
              <PermissionGuard permission="edit_own_profile">
                <h2 class="text-h5 font-weight-bold mb-4">Profile Settings</h2>
                <p class="text-body-1 text-medium-emphasis">
                  Profile editing functionality coming soon...
                </p>
              </PermissionGuard>
            </div>

            <!-- Activity Tab -->
            <div v-else-if="selectedTab === 'activity'">
              <PermissionGuard permission="view_own_activity">
                <h2 class="text-h5 font-weight-bold mb-4">Activity History</h2>
                <p class="text-body-1 text-medium-emphasis">
                  Activity tracking functionality coming soon...
                </p>
              </PermissionGuard>
            </div>

            <!-- Security Tab -->
            <div v-else-if="selectedTab === 'security'">
              <PermissionGuard permission="manage_own_security">
                <h2 class="text-h5 font-weight-bold mb-4">Security Settings</h2>
                <p class="text-body-1 text-medium-emphasis">
                  Security management functionality coming soon...
                </p>
              </PermissionGuard>
            </div>
          </v-card-text>
        </v-card>
      </div>

      <!-- Error State -->
      <div v-else class="text-center py-8">
        <v-icon size="64" color="error">mdi-alert-circle</v-icon>
        <h3 class="text-h5 mt-4">Unable to Load Profile</h3>
        <p class="text-body-1 text-medium-emphasis">
          Please try refreshing the page or contact support if the problem persists.
        </p>
        <v-btn
          color="primary"
          variant="flat"
          class="mt-4"
          @click="router.push('/dashboard')"
        >
          Return to Dashboard
        </v-btn>
      </div>
    </div>

    <!-- Snackbar for notifications -->
    <v-snackbar
      v-model="snackbar.show"
      :color="snackbar.color"
      timeout="5000"
    >
      {{ snackbar.message }}
      <template #actions>
        <v-btn
          variant="text"
          @click="snackbar.show = false"
        >
          Close
        </v-btn>
      </template>
    </v-snackbar>
  </AppLayout>
</template>

<script>
// Helper methods for component
export default {
  methods: {
    getRoleColor(role) {
      const colors = {
        owner: 'purple',
        admin: 'red',
        user: 'blue',
        viewer: 'green',
        pending: 'orange'
      }
      return colors[role] || 'grey'
    },
    
    formatDate(dateString) {
      if (!dateString) return 'Not available'
      
      try {
        const date = new Date(dateString)
        return date.toLocaleDateString('en-US', {
          year: 'numeric',
          month: 'long',
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit'
        })
      } catch (error) {
        return 'Invalid date'
      }
    }
  }
}
</script>

<style scoped>
.profile-container {
  max-width: 1200px;
  margin: 0 auto;
}

.page-header {
  text-align: center;
}

/* Brand-compliant typography */
.text-h4 {
  font-family: 'Franklin Gothic', 'Arial', sans-serif;
  font-weight: 600;
}

.text-h5, .text-h6 {
  font-family: 'Franklin Gothic', 'Arial', sans-serif;
  font-weight: 500;
}

.text-body-1, .text-subtitle-1, .text-subtitle-2 {
  font-family: 'Cambria', serif;
}

/* Card styling */
.v-card {
  border-radius: 8px;
}

.v-card-title {
  padding-bottom: 8px;
}

/* Avatar styling */
.v-avatar {
  border: 3px solid rgba(var(--v-theme-primary), 0.1);
}
</style>