// client/src/directives/permission.js - Vue directive for permission-based rendering
import { useAuthStore } from '../stores/auth'

/**
 * Vue directive for permission-based element visibility
 * 
 * Usage:
 * v-permission="'manage_users'" - Show if user has permission
 * v-permission:not="'manage_users'" - Show if user does NOT have permission
 * v-permission:any="['edit_users', 'manage_users']" - Show if user has ANY permission
 * v-permission:all="['view_users', 'export_data']" - Show if user has ALL permissions
 * v-permission:role="'admin'" - Show if user has specific role
 * v-permission:disable="'delete_users'" - Disable instead of hide
 */

// Cache for permission checks to improve performance
const permissionCache = new Map()
const CACHE_TTL = 30000 // 30 seconds

function getCachedResult(key) {
  const cached = permissionCache.get(key)
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return cached.result
  }
  return null
}

function setCachedResult(key, result) {
  permissionCache.set(key, {
    result,
    timestamp: Date.now()
  })
}

// Clear cache when auth state changes
let authStore = null
let unsubscribe = null

function setupAuthWatcher() {
  if (!authStore) {
    authStore = useAuthStore()
    unsubscribe = authStore.$subscribe(() => {
      permissionCache.clear()
    })
  }
}

// Cleanup function
export function cleanupPermissionDirective() {
  if (unsubscribe) {
    unsubscribe()
    unsubscribe = null
  }
  permissionCache.clear()
}

// Main directive logic
function checkPermission(el, binding) {
  setupAuthWatcher()
  
  const { arg, value, modifiers } = binding
  
  // Generate cache key
  const cacheKey = `${arg || 'default'}-${JSON.stringify(value)}-${JSON.stringify(modifiers)}`
  
  // Check cache first
  let hasPermission = getCachedResult(cacheKey)
  
  if (hasPermission === null) {
    // Perform permission check
    switch (arg) {
      case 'not':
        hasPermission = !authStore.hasPermission(value)
        break
        
      case 'any':
        hasPermission = Array.isArray(value) ? authStore.hasAnyPermission(value) : false
        break
        
      case 'all':
        hasPermission = Array.isArray(value) ? authStore.hasAllPermissions(value) : false
        break
        
      case 'role':
        hasPermission = authStore.role === value || (value !== 'owner' && authStore.role === 'owner')
        break
        
      case 'disable':
        // Special case - disable instead of hide
        hasPermission = authStore.hasPermission(value)
        if (!hasPermission) {
          el.setAttribute('disabled', 'true')
          el.classList.add('v-btn--disabled', 'permission-disabled')
          el.style.pointerEvents = 'none'
          el.style.opacity = '0.6'
        } else {
          el.removeAttribute('disabled')
          el.classList.remove('v-btn--disabled', 'permission-disabled')
          el.style.pointerEvents = ''
          el.style.opacity = ''
        }
        return
        
      default:
        // Default behavior - check single permission
        hasPermission = authStore.hasPermission(value)
    }
    
    // Cache the result
    setCachedResult(cacheKey, hasPermission)
  }
  
  // Apply visibility
  if (!hasPermission) {
    // Store original display value
    if (!el._originalDisplay) {
      el._originalDisplay = el.style.display || ''
    }
    el.style.display = 'none'
  } else {
    // Restore original display value
    if (el._originalDisplay !== undefined) {
      el.style.display = el._originalDisplay
    }
  }
}

// Directive definition
export const vPermission = {
  mounted(el, binding) {
    checkPermission(el, binding)
  },
  
  updated(el, binding) {
    checkPermission(el, binding)
  },
  
  unmounted(el) {
    // Cleanup
    delete el._originalDisplay
  }
}

// Helper function to check permissions programmatically
export function hasPermission(permission, options = {}) {
  setupAuthWatcher()
  
  const { not = false, any = false, all = false } = options
  
  if (not) {
    return !authStore.hasPermission(permission)
  }
  
  if (any && Array.isArray(permission)) {
    return authStore.hasAnyPermission(permission)
  }
  
  if (all && Array.isArray(permission)) {
    return authStore.hasAllPermissions(permission)
  }
  
  return authStore.hasPermission(permission)
}

// Role check helper
export function hasRole(role) {
  setupAuthWatcher()
  return authStore.role === role || (role !== 'owner' && authStore.role === 'owner')
}

// Create a plugin for easy installation
export default {
  install(app) {
    app.directive('permission', vPermission)
    app.config.globalProperties.$hasPermission = hasPermission
    app.config.globalProperties.$hasRole = hasRole
  }
}
