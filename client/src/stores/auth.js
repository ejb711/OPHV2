// client/src/stores/auth.js - Enhanced with permissions
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

  /* ---------- computed ---------- */
  const effectivePermissions = computed(() => {
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

  /* ---------- permission helpers ---------- */
  function hasPermission(permission) {
    if (role.value === 'owner') return true // owners have all permissions
    return effectivePermissions.value.includes(permission)
  }

  function hasAnyPermission(permissions) {
    return permissions.some(permission => hasPermission(permission))
  }

  function hasAllPermissions(permissions) {
    return permissions.every(permission => hasPermission(permission))
  }

  function canManageRole(targetRole) {
    if (role.value === 'owner') return true
    if (role.value === 'admin' && !['owner', 'admin'].includes(targetRole)) return true
    return false
  }

  /* ---------- auth state handler ---------- */
  onAuthStateChanged(auth, async (u) => {
    console.log('[auth] state changed:', u?.uid ?? 'signed-out')
    user.value = u
    role.value = null
    userPermissions.value = []
    rolePermissions.value = []
    customPermissions.value = []
    deniedPermissions.value = []
    ready.value = false

    if (!u) {
      ready.value = true
      return
    }

    try {
      // Fetch user profile
      const userSnap = await getDoc(doc(db, 'users', u.uid))
      const userData = userSnap.data()
      
      if (!userData) {
        role.value = 'pending'
        ready.value = true
        return
      }

      role.value = userData.role ?? 'pending'
      customPermissions.value = userData.customPermissions ?? []
      deniedPermissions.value = userData.deniedPermissions ?? []

      // Fetch role permissions if not pending
      if (role.value !== 'pending') {
        const roleSnap = await getDoc(doc(db, 'roles', role.value))
        if (roleSnap.exists()) {
          rolePermissions.value = roleSnap.data().permissions ?? []
        }
      }

      ready.value = true
      console.log('[auth] role & permissions loaded →', {
        role: role.value,
        rolePermissions: rolePermissions.value.length,
        customPermissions: customPermissions.value.length,
        effectivePermissions: effectivePermissions.value.length
      })
    } catch (error) {
      console.error('Error loading user permissions:', error)
      role.value = 'pending'
      ready.value = true
    }
  })

  /* ---------- actions ---------- */
  const login = (e, p) => signInWithEmailAndPassword(auth, e, p)
  const signup = (e, p) => createUserWithEmailAndPassword(auth, e, p)
  const logout = () => signOut(auth)

  async function refreshPermissions() {
    if (!user.value) return
    
    // Force refresh of auth token to get latest custom claims
    await auth.currentUser.getIdToken(true)
    
    // Re-fetch user data and permissions
    const userSnap = await getDoc(doc(db, 'users', user.value.uid))
    const userData = userSnap.data()
    
    if (userData) {
      role.value = userData.role
      customPermissions.value = userData.customPermissions ?? []
      deniedPermissions.value = userData.deniedPermissions ?? []

      if (role.value !== 'pending') {
        const roleSnap = await getDoc(doc(db, 'roles', role.value))
        if (roleSnap.exists()) {
          rolePermissions.value = roleSnap.data().permissions ?? []
        }
      }
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
    
    // Computed
    effectivePermissions,
    isOwner,
    isAdmin,
    isUser,
    isPending,
    
    // Methods
    hasPermission,
    hasAnyPermission,
    hasAllPermissions,
    canManageRole,
    login,
    signup,
    logout,
    refreshPermissions
  }
})