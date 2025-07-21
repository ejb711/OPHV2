// client/src/composables/useAppLayout.js
import { ref, watch, onMounted } from 'vue'
import { useDisplay } from 'vuetify'

// Local storage key for drawer state
const DRAWER_STATE_KEY = 'ophv2-navigation-drawer-state'

export function useAppLayout() {
  const { mobile } = useDisplay()
  
  // Navigation drawer state management
  const storedDrawerState = localStorage.getItem(DRAWER_STATE_KEY)
  const navigationDrawerVisible = ref(storedDrawerState !== null ? storedDrawerState === 'true' : true)

  // Snackbar state
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

  // Show snackbar notification
  function showSnackbar(message, color = 'success', options = {}) {
    snackbar.value = {
      show: true,
      message,
      color,
      timeout: options.timeout || 4000,
      location: options.location || 'bottom'
    }
  }

  // Handle responsive drawer behavior
  function handleRouteChange() {
    // On mobile, close drawer when navigating
    if (mobile.value && navigationDrawerVisible.value) {
      navigationDrawerVisible.value = false
    }
    // On desktop, preserve the drawer state
  }

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

  return {
    navigationDrawerVisible,
    snackbar,
    toggleNavigation,
    showSnackbar,
    handleRouteChange
  }
}