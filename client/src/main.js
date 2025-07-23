// client/src/main.js - Enhanced with proper initialization order
import { createApp, watch } from 'vue'
import { createPinia } from 'pinia'
import App from './App.vue'
import { router } from './router'
import { vuetify } from './plugins/vuetify'
import permissionDirective from './directives/permission'
import '@mdi/font/css/materialdesignicons.css'

// Import global styles
import './assets/main.css'

// Firebase and auth (these don't use Pinia)
import { auth } from './firebase'
import { onAuthStateChanged } from 'firebase/auth'

/* ────────────────────────────────────────────────
   Initialize App and Pinia First
   ─────────────────────────────────────────────── */
// Create instances
const app = createApp(App)
const pinia = createPinia()

// CRITICAL: Install Pinia FIRST before any code that uses stores
app.use(pinia)

// Install other plugins
app.use(router)
   .use(vuetify)
   .use(permissionDirective)

// NOW we can safely import and use modules that depend on Pinia stores
import { useAuthStore } from './stores/auth'

/* ────────────────────────────────────────────────
   Setup error handling (delayed to avoid Pinia issues)
   ─────────────────────────────────────────────── */
let errorHandlerSetup = false

function setupErrorHandling() {
  if (errorHandlerSetup) return
  
  // Import and setup error handler only when needed
  import('./composables/useErrorHandler').then(({ useErrorHandler }) => {
    const { handleError } = useErrorHandler()
    
    // Global error handling
    app.config.errorHandler = (err, instance, info) => {
      console.error('Global error:', err, info)
      handleError(err, {
        component: instance?.$options.name || 'Unknown',
        info
      })
    }
    
    // Global properties
    app.config.globalProperties.$handleError = handleError
  })
  
  errorHandlerSetup = true
}

/* ────────────────────────────────────────────────
   Development helpers
   ─────────────────────────────────────────────── */
if (import.meta.env.DEV) {
  app.config.globalProperties.$log = console.log
  app.config.globalProperties.$auth = useAuthStore()
  
  // Expose to window for debugging
  window.__ophv2 = {
    app,
    router,
    pinia,
    auth: useAuthStore()
  }
}

/* ────────────────────────────────────────────────
   Enhanced auth state management
   ─────────────────────────────────────────────── */
let booted = false
let authUnsubscribe = null

// Setup auth state listener
authUnsubscribe = onAuthStateChanged(auth, (user) => {
  if (!booted) {
    booted = true
    
    // Setup error handling after auth is ready
    setupErrorHandling()
    
    // Mount app after first auth callback
    router.isReady().then(() => {
      const authStore = useAuthStore()
      
      // Watch for role changes and handle navigation
      const stopWatcher = watch(
        () => authStore.role,
        (newRole, oldRole) => {
          const currentRoute = router.currentRoute.value
          
          // Handle role-based redirects
          handleRoleBasedRedirect(newRole, oldRole, currentRoute)
        },
        { immediate: true }
      )
      
      // Watch for auth readiness
      watch(
        () => authStore.ready,
        (ready) => {
          if (ready) {
            console.log('[main] Auth ready, user:', authStore.user?.email || 'none')
          }
        }
      )
      
      // Mount the app
      app.mount('#app')
      
      // Cleanup function for HMR
      if (import.meta.hot) {
        import.meta.hot.dispose(() => {
          stopWatcher()
          if (authUnsubscribe) authUnsubscribe()
        })
      }
    })
  }
})

/* ────────────────────────────────────────────────
   Role-based navigation handler
   ─────────────────────────────────────────────── */
function handleRoleBasedRedirect(role, previousRole, currentRoute) {
  // Skip if no role change or during initial load
  if (!role || role === previousRole) return
  
  // Pending users must go to awaiting page
  if (role === 'pending' && currentRoute.name !== 'Awaiting') {
    router.replace('/awaiting')
    return
  }
  
  // Approved users leaving awaiting page
  if (role !== 'pending' && currentRoute.name === 'Awaiting') {
    // Redirect based on role
    if (role === 'admin' || role === 'owner') {
      router.replace('/admin')
    } else {
      router.replace('/dash')
    }
    return
  }
  
  // Handle users losing admin access
  if (previousRole === 'admin' && role !== 'admin' && currentRoute.name === 'Admin') {
    router.replace('/dash')
    return
  }
}

/* ────────────────────────────────────────────────
   Performance monitoring (production only)
   ─────────────────────────────────────────────── */
if (import.meta.env.PROD) {
  // Log app startup time
  window.addEventListener('load', () => {
    if (performance.timing) {
      const loadTime = performance.timing.loadEventEnd - performance.timing.navigationStart
      console.log(`[perf] App loaded in ${loadTime}ms`)
    }
  })
  
  // Monitor long tasks
  if ('PerformanceObserver' in window) {
    const observer = new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        if (entry.duration > 50) {
          console.warn('[perf] Long task detected:', entry)
        }
      }
    })
    
    try {
      observer.observe({ entryTypes: ['longtask'] })
    } catch (e) {
      // Some browsers don't support longtask
    }
  }
}

/* ────────────────────────────────────────────────
   Service Worker (future PWA support)
   ─────────────────────────────────────────────── */
if ('serviceWorker' in navigator && import.meta.env.PROD) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js')
      .then(registration => {
        console.log('[sw] Service Worker registered:', registration)
      })
      .catch(error => {
        console.log('[sw] Service Worker registration failed:', error)
      })
  })
}