<!-- Updated ProfileView.vue with new tab components -->
<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { useRouter } from 'vue-router'
import AppLayout from '../components/AppLayout.vue'
import PermissionGuard from '../components/PermissionGuard.vue'
import ProfileSettingsTab from '../components/profile/ProfileSettingsTab.vue'
import ProfileActivityTab from '../components/profile/ProfileActivityTab.vue'
import ProfileSecurityTab from '../components/profile/ProfileSecurityTab.vue'
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
const permissions = computed(() => authStore.effectivePermissions || [])

// Debug computed to see permission state
const debugInfo = computed(() => ({
  role: userRole.value,
  isOwner: authStore.isOwner,
  permissions: permissions.value,
  hasViewProfile: authStore.hasPermission('view_own_profile'),
  hasEditProfile: authStore.hasPermission('edit_own_profile'),
  hasViewActivity: authStore.hasPermission('view_own_activity'),
  hasManageSecurity: authStore.hasPermission('manage_own_security'),
  authReady: authStore.ready
}))

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
  
  // Special handling for owners - always show all tabs
  if (userRole.value === 'owner') {
    console.log('User is owner (role check), showing all tabs')
    return tabs
  }
  
  // For other users, filter by permissions
  const filteredTabs = tabs.filter(tab => {
    const hasPermission = authStore.hasPermission(tab.permission)
    console.log(`Tab ${tab.title}: permission ${tab.permission} = ${hasPermission}`)
    return hasPermission
  })
  
  // If no tabs after filtering, but user has a valid role, show at least the profile tab
  if (filteredTabs.length === 0 && userRole.value && userRole.value !== 'pending') {
    console.log('No tabs found, showing profile tab as fallback')
    return [tabs[0]] // Show at least the profile tab
  }
  
  return filteredTabs
})

// Watch for changes in permissions
watch(permissions, (newPerms) => {
  console.log('Permissions updated:', newPerms)
})

watch(debugInfo, (info) => {
  console.log('Debug info updated:', info)
}, { immediate: true })

/* ---------- methods ---------- */
const showSnackbar = (message, color = 'success') => {
  snackbar.value = {
    show: true,
    message,
    color
  }
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

const refreshPermissions = async () => {
  console.log('Manually refreshing permissions...')
  try {
    await authStore.refreshPermissions()
    showSnackbar('Permissions refreshed', 'success')
    console.log('After refresh:', debugInfo.value)
  } catch (error) {
    console.error('Error refreshing permissions:', error)
    showSnackbar('Failed to refresh permissions', 'error')
  }
}

/* ---------- lifecycle ---------- */
onMounted(async () => {
  loading.value = true
  console.log('ProfileView mounting...')
  
  try {
    // Ensure user data is loaded
    if (!currentUser.value) {
      console.log('No user found, redirecting to login')
      router.push('/login')
      return
    }
    
    // Ensure permissions are loaded
    if (!authStore.ready) {
      console.log('Waiting for auth to be ready...')
      await new Promise(resolve => {
        const interval = setInterval(() => {
          if (authStore.ready) {
            clearInterval(interval)
            resolve()
          }
        }, 100)
      })
    }
    
    console.log('Auth ready, checking permissions...')
    console.log('Available tabs:', availableTabs.value.length)
    console.log('Debug info:', debugInfo.value)
    
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

      <!-- Debug Panel (temporary for troubleshooting) -->
      <v-expansion-panels class="mb-4" v-if="false">
        <v-expansion-panel>
          <v-expansion-panel-title>
            Debug Information
          </v-expansion-panel-title>
          <v-expansion-panel-text>
            <pre>{{ JSON.stringify(debugInfo, null, 2) }}</pre>
            <p class="mt-2">Available tabs: {{ availableTabs.length }}</p>
            <v-btn 
              color="primary" 
              @click="refreshPermissions"
              class="mt-2"
              size="small"
            >
              Refresh Permissions
            </v-btn>
          </v-expansion-panel-text>
        </v-expansion-panel>
      </v-expansion-panels>

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

        <!-- No Tabs Available Message -->
        <v-alert
          v-else
          type="warning"
          variant="outlined"
          class="mb-6"
        >
          <v-alert-title>Limited Access</v-alert-title>
          Profile features are being set up. Please check back later or contact an administrator.
        </v-alert>

        <!-- Tab Content -->
        <v-card>
          <v-card-text>
            <!-- Profile Tab -->
            <div v-if="selectedTab === 'profile' && (authStore.isOwner || authStore.hasPermission('view_own_profile'))">
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
                            <p class="text-body-1">{{ formatDate(currentUser.metadata?.creationTime) }}</p>
                          </div>
                        </v-col>
                        <v-col cols="12" sm="6">
                          <div class="mb-3">
                            <label class="text-subtitle-2 font-weight-bold">Last Sign In</label>
                            <p class="text-body-1">{{ formatDate(currentUser.metadata?.lastSignInTime) }}</p>
                          </div>
                        </v-col>
                      </v-row>
                    </v-card-text>
                  </v-card>
                </v-col>
                <v-col cols="12" md="4">
                  <v-card variant="outlined">
                    <v-card-title class="text-h6 font-weight-bold">
                      Profile Photo
                    </v-card-title>
                    <v-card-text class="text-center">
                      <v-avatar size="120" color="primary" class="mb-4">
                        <v-img 
                          v-if="currentUser.photoURL" 
                          :src="currentUser.photoURL" 
                          :alt="currentUser.displayName || 'Profile Photo'"
                        />
                        <v-icon v-else size="60">mdi-account</v-icon>
                      </v-avatar>
                      <div>
                        <p class="text-body-2 text-medium-emphasis">
                          Photo upload coming soon
                        </p>
                      </div>
                    </v-card-text>
                  </v-card>
                </v-col>
              </v-row>
            </div>

            <!-- Settings Tab -->
            <PermissionGuard 
              v-else-if="selectedTab === 'settings'" 
              :permissions="['edit_own_profile']"
              :fallback-check="authStore.isOwner"
            >
              <ProfileSettingsTab />
            </PermissionGuard>

            <!-- Activity Tab -->
            <PermissionGuard 
              v-else-if="selectedTab === 'activity'" 
              :permissions="['view_own_activity']"
              :fallback-check="authStore.isOwner"
            >
              <ProfileActivityTab />
            </PermissionGuard>

            <!-- Security Tab -->
            <PermissionGuard 
              v-else-if="selectedTab === 'security'" 
              :permissions="['manage_own_security']"
              :fallback-check="authStore.isOwner"
            >
              <ProfileSecurityTab />
            </PermissionGuard>
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
      </div>
    </div>

    <!-- Snackbar for notifications -->
    <v-snackbar
      v-model="snackbar.show"
      :color="snackbar.color"
      :timeout="3000"
    >
      {{ snackbar.message }}
    </v-snackbar>
  </AppLayout>
</template>

<style scoped>
.profile-container {
  max-width: 1200px;
  margin: 0 auto;
}

.page-header h1 {
  font-family: 'ITC Franklin Gothic', Arial, sans-serif;
}

.v-card-title {
  font-family: 'ITC Franklin Gothic', Arial, sans-serif;
}

.v-card-text {
  font-family: 'Cambria', Georgia, serif;
}

label {
  color: rgba(0, 0, 0, 0.6);
}
</style>