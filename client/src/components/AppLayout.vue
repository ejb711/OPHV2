<!-- client/src/components/AppLayout.vue - Fixed navigation state management -->
<template>
  <v-app>
    <!-- Top App Bar -->
    <v-app-bar 
      :elevation="2"
      :color="appBarColor"
      :density="mobile ? 'compact' : 'comfortable'"
    >
      <!-- Menu toggle for mobile or to hide/show drawer -->
      <v-app-bar-nav-icon
        v-if="showNavIcon"
        @click="toggleNavigation"
      />
      
      <!-- App Title/Logo -->
      <v-app-bar-title class="d-flex align-center">
        <v-btn
          variant="text"
          class="text-button font-weight-bold text-h6"
          :to="homeRoute"
          :disabled="loading"
        >
          {{ appTitle }}
        </v-btn>
      </v-app-bar-title>

      <v-spacer />
      
      <!-- Global Loading Indicator -->
      <v-progress-circular
        v-if="isGlobalLoading"
        indeterminate
        size="24"
        width="2"
        class="mr-3"
      />

      <!-- Page-specific actions slot -->
      <slot name="actions" />
      
      <!-- User Menu -->
      <v-menu v-if="authStore.user" offset-y>
        <template v-slot:activator="{ props }">
          <v-btn
            icon
            v-bind="props"
            :loading="loading"
          >
            <v-avatar size="32">
              <v-icon v-if="!userAvatar">mdi-account-circle</v-icon>
              <v-img v-else :src="userAvatar" />
            </v-avatar>
          </v-btn>
        </template>
        
        <v-list density="compact" min-width="200">
          <v-list-item>
            <v-list-item-title class="font-weight-medium">
              {{ userName }}
            </v-list-item-title>
            <v-list-item-subtitle>
              {{ userRoleDisplay }}
            </v-list-item-subtitle>
          </v-list-item>
          
          <v-divider class="my-1" />
          
          <v-list-item
            to="/profile"
            prepend-icon="mdi-account"
          >
            <v-list-item-title>Profile</v-list-item-title>
          </v-list-item>
          
          <v-list-item
            v-if="canAccessAdmin"
            to="/admin"
            prepend-icon="mdi-shield-crown"
          >
            <v-list-item-title>Admin Panel</v-list-item-title>
          </v-list-item>
          
          <v-divider class="my-1" />
          
          <v-list-item
            @click="handleLogout"
            prepend-icon="mdi-logout"
          >
            <v-list-item-title>Logout</v-list-item-title>
          </v-list-item>
        </v-list>
      </v-menu>
    </v-app-bar>

    <!-- Smart Navigation (Desktop) -->
    <SmartNavigation 
      v-if="showNavigation && !mobile"
      v-model:drawer="navigationDrawerVisible"
    />

    <!-- Main Content Area -->
    <v-main>
      <!-- Page Transition -->
      <v-fade-transition mode="out-in">
        <div :key="$route.path" class="page-content">
          <!-- Breadcrumbs -->
          <v-breadcrumbs
            v-if="showBreadcrumbs && breadcrumbs.length > 1"
            :items="breadcrumbs"
            class="px-4 py-2"
          />
          
          <!-- Loading Overlay -->
          <v-overlay
            :model-value="loading"
            persistent
            class="align-center justify-center"
          >
            <v-progress-circular
              indeterminate
              size="64"
              :color="loadingColor"
            />
            <div v-if="loadingMessage" class="mt-4 text-center">
              {{ loadingMessage }}
            </div>
          </v-overlay>
          
          <!-- Page Content -->
          <div class="pa-4">
            <slot />
          </div>
        </div>
      </v-fade-transition>
    </v-main>

    <!-- Smart Navigation (Mobile) -->
    <SmartNavigation 
      v-if="showNavigation && mobile"
      v-model:drawer="navigationDrawerVisible"
      :mobile="true"
    />
    
    <!-- Global Snackbar -->
    <v-snackbar
      v-model="snackbar.show"
      :color="snackbar.color"
      :timeout="snackbar.timeout"
      :location="snackbar.location"
      multi-line
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
  </v-app>
</template>

<script setup>
import { ref, computed, provide, watch, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useDisplay } from 'vuetify'
import { useAuthStore } from '../stores/auth'
import { usePermissions } from '../composables/usePermissions'
import { useGlobalLoading } from '../composables/useLoadingState'
import SmartNavigation from './SmartNavigation.vue'

// Props
const props = defineProps({
  title: {
    type: String,
    default: 'OPHV2'
  },
  showNavigation: {
    type: Boolean,
    default: true
  },
  showBreadcrumbs: {
    type: Boolean,
    default: true
  },
  loading: {
    type: Boolean,
    default: false
  },
  loadingMessage: {
    type: String,
    default: ''
  },
  loadingColor: {
    type: String,
    default: 'primary'
  }
})

// Composables
const router = useRouter()
const route = useRoute()
const authStore = useAuthStore()
const { mobile } = useDisplay()
const { canAccessAdmin } = usePermissions()
const { isGlobalLoading } = useGlobalLoading()

// State - Use localStorage to persist drawer state
const DRAWER_STATE_KEY = 'ophv2-navigation-drawer-state'
const storedDrawerState = localStorage.getItem(DRAWER_STATE_KEY)
const navigationDrawerVisible = ref(storedDrawerState !== null ? 
  storedDrawerState === 'true' : true)

const snackbar = ref({
  show: false,
  message: '',
  color: 'success',
  timeout: 4000,
  location: 'bottom'
})

// Initialize drawer state based on screen size
onMounted(() => {
  // On mobile, always start with drawer closed
  if (mobile.value) {
    navigationDrawerVisible.value = false
  }
})

// Toggle navigation function that preserves state
function toggleNavigation() {
  navigationDrawerVisible.value = !navigationDrawerVisible.value
  // Save state to localStorage
  localStorage.setItem(DRAWER_STATE_KEY, navigationDrawerVisible.value.toString())
}

// Computed
const appTitle = computed(() => props.title)

const homeRoute = computed(() => {
  if (!authStore.user) return '/'
  if (authStore.isPending) return '/awaiting'
  return '/dash'
})

const showNavIcon = computed(() => {
  return props.showNavigation && authStore.user && !authStore.isPending
})

const appBarColor = computed(() => {
  // Different colors for different user states
  if (!authStore.user) return 'surface'
  if (authStore.isPending) return 'orange-lighten-5'
  if (authStore.isOwner) return 'deep-purple-lighten-5'
  if (authStore.isAdmin) return 'red-lighten-5'
  return 'primary'
})

const userName = computed(() => {
  if (!authStore.user) return 'Guest'
  return authStore.user.displayName || authStore.user.email?.split('@')[0] || 'User'
})

const userRoleDisplay = computed(() => {
  const roleNames = {
    owner: 'System Owner',
    admin: 'Administrator',
    user: 'User',
    viewer: 'Viewer',
    pending: 'Pending Approval'
  }
  return roleNames[authStore.role] || 'Unknown Role'
})

const userAvatar = computed(() => {
  // Future: Return actual avatar URL from user profile
  return authStore.user?.photoURL || null
})

const breadcrumbs = computed(() => {
  const items = []
  
  // Always add home
  items.push({
    title: 'Home',
    to: homeRoute.value,
    disabled: false
  })
  
  // Add current route
  if (route.name && route.name !== 'Dashboard') {
    const routeNames = {
      Admin: 'Admin Panel',
      Profile: 'My Profile',
      Projects: 'Projects',
      Forums: 'Forums',
      Calendar: 'Calendar',
      Settings: 'Settings',
      Analytics: 'Analytics'
    }
    
    items.push({
      title: routeNames[route.name] || route.name,
      to: route.path,
      disabled: true
    })
  }
  
  return items
})

// Methods
async function handleLogout() {
  try {
    const result = await authStore.logout()
    
    // Check if logout was successful
    if (result && result.success === false) {
      showSnackbar('Error logging out: ' + (result.error || 'Unknown error'), 'error')
      return
    }
    
    // Successful logout
    router.push('/')
    showSnackbar('Logged out successfully')
  } catch (error) {
    console.error('Logout error:', error)
    showSnackbar('Error logging out', 'error')
  }
}

function showSnackbar(message, color = 'success', options = {}) {
  snackbar.value = {
    show: true,
    message,
    color,
    timeout: options.timeout || 4000,
    location: options.location || 'bottom'
  }
}

// Provide snackbar method to child components
provide('showSnackbar', showSnackbar)

// DON'T close navigation on route change - preserve user's choice
// Only close on mobile when navigating
watch(() => route.path, () => {
  // On mobile, close drawer when navigating
  if (mobile.value && navigationDrawerVisible.value) {
    navigationDrawerVisible.value = false
  }
  // On desktop, preserve the drawer state
})

// Watch for screen size changes
watch(mobile, (isMobile) => {
  if (isMobile) {
    // When switching to mobile, close the drawer
    navigationDrawerVisible.value = false
  } else {
    // When switching to desktop, open the drawer
    navigationDrawerVisible.value = true
  }
})
</script>

<style scoped>
/* Ensure content doesn't overlap with navigation */
.page-content {
  min-height: 100%;
}

/* App bar transitions */
.v-app-bar {
  transition: background-color 0.3s ease;
}

/* User avatar hover effect */
.v-avatar {
  transition: transform 0.2s ease;
}

.v-btn:hover .v-avatar {
  transform: scale(1.1);
}

/* Breadcrumb styling */
.v-breadcrumbs {
  padding: 0.5rem 1rem !important;
  background: rgba(0, 0, 0, 0.02);
}

/* Loading overlay styling */
.v-overlay__content {
  text-align: center;
}

/* Mobile adjustments */
@media (max-width: 600px) {
  .v-app-bar-title {
    font-size: 1.1rem !important;
  }
  
  .page-content {
    padding-bottom: 56px; /* Space for bottom navigation */
  }
}

/* Print styles */
@media print {
  .v-app-bar,
  .v-navigation-drawer,
  .v-bottom-navigation,
  .v-breadcrumbs {
    display: none !important;
  }
  
  .page-content {
    padding: 0 !important;
  }
}
</style>