<!-- client/src/components/AppLayout.vue - Modularized Version (under 200 lines) -->
<template>
  <v-app>
    <!-- Top App Bar Component -->
    <AppBar
      :title="title"
      :user="authStore.user"
      :user-role="authStore.role"
      :show-nav-icon="showNavIcon"
      :loading="loading"
      :global-loading="isGlobalLoading"
      :can-access-admin="canAccessAdmin"
      @toggle-navigation="toggleNavigation"
      @logout="handleLogout"
    >
      <template #actions>
        <slot name="actions" />
      </template>
    </AppBar>

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
          <!-- Loading Overlay Component -->
          <LoadingOverlay 
            :loading="loading"
            :message="loadingMessage"
            :color="loadingColor"
          />
          
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
    
    <!-- Global Snackbar Component -->
    <GlobalSnackbar v-model="snackbar" />
  </v-app>
</template>

<script setup>
import { computed, provide, watch } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useDisplay } from 'vuetify'
import { useAuthStore } from '../stores/auth'
import { usePermissions } from '../composables/usePermissions'
import { useGlobalLoading } from '../composables/useLoadingState'
import { useAppLayout } from '../composables/useAppLayout'

// Import modular components
import AppBar from './layout/AppBar.vue'
import GlobalSnackbar from './layout/GlobalSnackbar.vue'
import LoadingOverlay from './layout/LoadingOverlay.vue'
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
    default: false
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
const { 
  navigationDrawerVisible, 
  snackbar, 
  toggleNavigation, 
  showSnackbar, 
  handleRouteChange 
} = useAppLayout()

// Computed
const showNavIcon = computed(() => {
  return props.showNavigation && authStore.user && !authStore.isPending
})

// Methods
async function handleLogout() {
  try {
    const result = await authStore.logout()
    
    if (result && result.success === false) {
      showSnackbar('Error logging out: ' + (result.error || 'Unknown error'), 'error')
      return
    }
    
    router.push('/')
    showSnackbar('Logged out successfully')
  } catch (error) {
    console.error('Logout error:', error)
    showSnackbar('Error logging out', 'error')
  }
}

// Provide snackbar method to child components
provide('showSnackbar', showSnackbar)

// Handle route changes
watch(() => route.path, handleRouteChange)
</script>

<style scoped>
/* Ensure content doesn't overlap with navigation */
.page-content {
  min-height: 100%;
}

/* Mobile adjustments */
@media (max-width: 600px) {
  .page-content {
    padding-bottom: 56px; /* Space for bottom navigation */
  }
}

/* Print styles */
@media print {
  .v-app-bar,
  .v-navigation-drawer,
  .v-bottom-navigation {
    display: none !important;
  }
  
  .page-content {
    padding: 0 !important;
  }
}
</style>