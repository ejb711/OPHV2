// client/src/stores/auth.js - Complete Enhanced Version with Login Error Handling
import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import {
  getAuth, onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
} from 'firebase/auth'
import { doc, getDoc, collection, getDocs } from 'firebase/firestore'
import { firebaseApp } from '../firebase'
import { db } from '../firebase'

const auth = getAuth(firebaseApp)

export const useAuthStore = defineStore('auth', () => {
  /* ---------- state ---------- */
  const user = ref(null)
  const role = ref(null)
  const userPermissions = ref([])
  const rolePermissions = ref([])
  const customPermissions = ref([])
  const deniedPermissions = ref([])
  const ready = ref(false)
  const error = ref(null)
  
  // Permission cache with TTL
  const permissionCache = ref(new Map())
  const CACHE_TTL = 5 * 60 * 1000 // 5 minutes

  /* ---------- computed ---------- */
  const effectivePermissions = computed(() => {
    // Owners have all permissions
    if (role.value === 'owner') {
      return ['*'] // Special wildcard permission
    }
    
    // Start with role permissions
    let permissions = new Set(rolePermissions.value)
    
    // Add custom permissions
    customPermissions.value.forEach(p => permissions.add(p))
    
    // Remove denied permissions
    deniedPermissions.value.forEach(p => permissions.delete(p))
    
    return Array.from(permissions)
  })

  const isOwner = computed(() => role.value === 'owner')
  const isAdmin = computed(() => role.value === 'admin' || role.value === 'owner')
  const isUser = computed(() => ['user', 'admin', 'owner'].includes(role.value))
  const isPending = computed(() => role.value === 'pending')
  const isAuthenticated = computed(() => !!user.value && ready.value)

  /* ---------- permission helpers ---------- */
  function hasPermission(permission) {
    if (!ready.value) return false
    if (role.value === 'owner') return true
    
    // Check cache first
    const cached = getCachedPermission(permission)
    if (cached !== null) return cached
    
    // Check effective permissions
    const hasIt = effectivePermissions.value.includes(permission)
    setCachedPermission(permission, hasIt)
    return hasIt
  }

  function hasAnyPermission(permissions) {
    if (!Array.isArray(permissions) || permissions.length === 0) return false
    return permissions.some(permission => hasPermission(permission))
  }

  function hasAllPermissions(permissions) {
    if (!Array.isArray(permissions) || permissions.length === 0) return true
    return permissions.every(permission => hasPermission(permission))
  }

  function canManageRole(targetRole) {
    if (role.value === 'owner') return true
    if (role.value === 'admin' && !['owner', 'admin'].includes(targetRole)) return true
    return false
  }
  
  /* ---------- cache management ---------- */
  function getCachedPermission(permission) {
    const cached = permissionCache.value.get(permission)
    if (!cached) return null
    
    if (Date.now() - cached.timestamp > CACHE_TTL) {
      permissionCache.value.delete(permission)
      return null
    }
    
    return cached.value
  }
  
  function setCachedPermission(permission, value) {
    permissionCache.value.set(permission, {
      value,
      timestamp: Date.now()
    })
  }
  
  function clearPermissionCache() {
    permissionCache.value.clear()
  }

  /* ---------- auth state handler ---------- */
  onAuthStateChanged(auth, async (u) => {
    console.log('[auth] State changed:', u?.uid ?? 'signed-out')
    
    // Reset state
    user.value = u
    role.value = null
    userPermissions.value = []
    rolePermissions.value = []
    customPermissions.value = []
    deniedPermissions.value = []
    error.value = null
    ready.value = false
    clearPermissionCache()

    if (!u) {
      ready.value = true
      return
    }

    try {
      // Fetch user profile with retry
      const userData = await fetchUserData(u.uid)
      
      if (!userData) {
        role.value = 'pending'
        ready.value = true
        return
      }

      // Set user data
      role.value = userData.role ?? 'pending'
      customPermissions.value = userData.customPermissions ?? []
      deniedPermissions.value = userData.deniedPermissions ?? []

      // Fetch role permissions if not pending
      if (role.value !== 'pending') {
        await fetchRolePermissions(role.value)
      }
      
      console.log('[auth] Permissions loaded:', {
        role: role.value,
        rolePermissions: rolePermissions.value.length,
        customPermissions: customPermissions.value.length,
        deniedPermissions: deniedPermissions.value.length,
        effective: effectivePermissions.value.length
      })
      
    } catch (err) {
      console.error('[auth] Error loading user data:', err)
      error.value = err.message
      role.value = 'pending' // Safe fallback
    } finally {
      ready.value = true
    }
  })
  
  /* ---------- data fetching helpers ---------- */
  async function fetchUserData(uid, retries = 3) {
    for (let i = 0; i < retries; i++) {
      try {
        const userSnap = await getDoc(doc(db, 'users', uid))
        if (userSnap.exists()) {
          return userSnap.data()
        }
        return null
      } catch (err) {
        if (i === retries - 1) throw err
        await new Promise(resolve => setTimeout(resolve, 1000 * (i + 1)))
      }
    }
  }
  
  async function fetchRolePermissions(roleId) {
    try {
      const roleSnap = await getDoc(doc(db, 'roles', roleId))
      if (roleSnap.exists()) {
        const roleData = roleSnap.data()
        rolePermissions.value = roleData.permissions ?? []
        
        // For owners, fetch all available permissions
        if (roleId === 'owner' && roleData.permissions?.includes('*')) {
          const allPerms = await fetchAllPermissions()
          rolePermissions.value = allPerms
        }
      }
    } catch (err) {
      console.warn('[auth] Error fetching role permissions:', err)
      // Don't throw - continue with empty permissions
    }
  }
  
  async function fetchAllPermissions() {
    try {
      const permsSnap = await getDocs(collection(db, 'permissions'))
      return permsSnap.docs.map(doc => doc.id)
    } catch (err) {
      console.warn('[auth] Error fetching all permissions:', err)
      return []
    }
  }

  /* ---------- auth actions ---------- */
  async function login(email, password) {
    try {
      const cred = await signInWithEmailAndPassword(auth, email, password)
      // onAuthStateChanged will handle the rest
      return { success: true, user: cred.user }
    } catch (err) {
      console.error('[auth] Login error:', err)
      
      // Return structured error with Firebase error code for proper error handling
      return { 
        success: false, 
        error: err.message,
        errorCode: err.code // This is crucial for proper error handling in LoginView
      }
    }
  }

  async function signup(email, password) {
    try {
      const cred = await createUserWithEmailAndPassword(auth, email, password)
      // User document will be created by Cloud Function
      return { success: true, user: cred.user }
    } catch (err) {
      console.error('[auth] Signup error:', err)
      
      // Return structured error with Firebase error code
      return { 
        success: false, 
        error: err.message,
        errorCode: err.code
      }
    }
  }

  async function logout() {
    try {
      await signOut(auth)
      // State will be reset by onAuthStateChanged
      return { success: true }
    } catch (err) {
      console.error('[auth] Logout error:', err)
      return { 
        success: false, 
        error: err.message,
        errorCode: err.code
      }
    }
  }

  /* ---------- manual refresh ---------- */
  async function refreshPermissions() {
    if (!user.value) return
    
    clearPermissionCache()
    ready.value = false
    
    try {
      const userData = await fetchUserData(user.value.uid)
      if (userData) {
        role.value = userData.role ?? 'pending'
        customPermissions.value = userData.customPermissions ?? []
        deniedPermissions.value = userData.deniedPermissions ?? []
        
        if (role.value !== 'pending') {
          await fetchRolePermissions(role.value)
        }
      }
    } catch (err) {
      console.error('[auth] Error refreshing permissions:', err)
      error.value = err.message
    } finally {
      ready.value = true
    }
  }

  async function getUserDocument() {
    if (!user.value) return null
    
    try {
      const userDoc = await getDoc(doc(db, 'users', user.value.uid))
      return userDoc.exists() ? userDoc.data() : null
    } catch (error) {
      console.error('[auth] Error fetching user document:', error)
      return null
    }
  }

  async function refreshCurrentUser() {
    if (!user.value) return
    
    try {
      await auth.currentUser.reload()
      // The onAuthStateChanged listener will automatically update
    } catch (error) {
      console.error('[auth] Error refreshing current user:', error)
    }
  }
  
  return {
    // State
    user,
    role,
    userPermissions,
    rolePermissions,
    customPermissions,
    deniedPermissions,
    ready,
    error,
    
    // Computed
    effectivePermissions,
    isOwner,
    isAdmin,
    isUser,
    isPending,
    isAuthenticated,
    
    // Methods
    hasPermission,
    hasAnyPermission,
    hasAllPermissions,
    canManageRole,
    login,
    signup,
    logout,
    refreshPermissions,
    getUserDocument,
    refreshCurrentUser,
    clearPermissionCache
  }
})