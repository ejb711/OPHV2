// client/src/stores/auth/index.js - Main auth store definition (150 lines)
import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { auth } from '@/firebase'
import { onAuthStateChanged } from 'firebase/auth'

// Import modular functions
import { createPermissionHandlers } from './permissions'
import { createAuthActions } from './actions'
import { createUserManagement } from './user-management'

export const useAuthStore = defineStore('auth', () => {
  // ========== Core State ==========
  const user = ref(null)
  const role = ref(null)
  const userDocument = ref(null)
  const ready = ref(false)
  const error = ref(null)
  
  // Permission state
  const rolePermissions = ref(new Set())
  const customPermissions = ref([])
  const deniedPermissions = ref([])
  
  // ========== Computed Properties ==========
  const effectivePermissions = computed(() => {
    const permissions = new Set([
      ...rolePermissions.value,
      ...customPermissions.value
    ])
    
    // Remove explicitly denied permissions
    for (const denied of deniedPermissions.value) {
      permissions.delete(denied)
    }
    
    return permissions
  })
  
  // Role checks
  const isOwner = computed(() => role.value === 'owner')
  const isAdmin = computed(() => role.value === 'admin' || role.value === 'owner')
  const isUser = computed(() => ['user', 'admin', 'owner'].includes(role.value))
  const isPending = computed(() => role.value === 'pending')
  const isAuthenticated = computed(() => !!user.value)
  
  // Backward compatibility
  const userRole = computed(() => role.value)
  
  // ========== Create Module Handlers ==========
  
  // Permission handling
  const {
    hasPermission,
    hasAnyPermission,
    hasAllPermissions,
    canManageRole,
    fetchRolePermissions,
    clearPermissionCache
  } = createPermissionHandlers({
    role,
    isOwner,
    effectivePermissions,
    rolePermissions
  })
  
  // Authentication actions
  const {
    login,
    signup,
    logout: logoutAction
  } = createAuthActions({ auth, error })
  
  // User management
  const {
    fetchUserPermissions,
    getUserDocument,
    refreshCurrentUser,
    cleanupListeners
  } = createUserManagement({
    user,
    role,
    userDocument,
    rolePermissions,
    customPermissions,
    deniedPermissions,
    error,
    fetchRolePermissions,
    clearPermissionCache
  })
  
  // ========== Enhanced Logout ==========
  async function logout() {
    try {
      // Clean up listeners first
      cleanupListeners()
      
      // Perform logout
      await logoutAction()
      
      // Clear all state
      user.value = null
      role.value = null
      userDocument.value = null
      rolePermissions.value.clear()
      customPermissions.value = []
      deniedPermissions.value = []
      clearPermissionCache()
      ready.value = false
      error.value = null
    } catch (err) {
      error.value = err.message
      throw err
    }
  }
  
  // ========== Auth State Listener ==========
  let authUnsubscribe = null
  
  function initAuthListener() {
    if (authUnsubscribe) {
      console.warn('[auth] Auth listener already initialized')
      return
    }
    
    authUnsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      console.log('[auth] Auth state changed:', firebaseUser?.email || 'null')
      
      user.value = firebaseUser
      
      if (firebaseUser) {
        // User is signed in
        await fetchUserPermissions(firebaseUser.uid)
      } else {
        // User is signed out
        role.value = null
        userDocument.value = null
        rolePermissions.value.clear()
        customPermissions.value = []
        deniedPermissions.value = []
        clearPermissionCache()
        cleanupListeners()
      }
      
      ready.value = true
    })
  }
  
  // Initialize on store creation
  initAuthListener()
  
  // ========== Public API ==========
  return {
    // State
    user,
    role,
    userRole,
    userDocument,
    ready,
    error,
    
    // Computed
    effectivePermissions,
    isOwner,
    isAdmin,
    isUser,
    isPending,
    isAuthenticated,
    
    // Permission methods
    hasPermission,
    hasAnyPermission,
    hasAllPermissions,
    canManageRole,
    
    // Auth methods
    login,
    signup,
    logout,
    
    // User methods
    refreshPermissions: () => fetchUserPermissions(user.value?.uid),
    getUserDocument,
    refreshCurrentUser,
    clearPermissionCache
  }
})