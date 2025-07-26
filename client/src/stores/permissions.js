// client/src/stores/permissions.js - Enhanced Permission management store
import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import {
  collection,
  getDocs,
  doc,
  updateDoc,
  addDoc,
  deleteDoc,
  serverTimestamp,
  onSnapshot,
  query,
  orderBy
} from 'firebase/firestore'
import { db } from '../firebase'

export const usePermissionsStore = defineStore('permissions', () => {
  /* ---------- state ---------- */
  const allPermissions = ref([])
  const allRoles = ref([])
  const allUsers = ref([])
  const loading = ref(false)
  const error = ref('')

  /* ---------- computed ---------- */
  const permissionsByCategory = computed(() => {
    const categorized = {}
    allPermissions.value.forEach(permission => {
      const category = permission.category || 'general'
      if (!categorized[category]) categorized[category] = []
      categorized[category].push(permission)
    })
    return categorized
  })

  const roleHierarchy = computed(() => {
    return allRoles.value.sort((a, b) => (b.hierarchy || 0) - (a.hierarchy || 0))
  })

  // Backwards compatibility alias
  const roles = computed(() => allRoles.value)

  /* ---------- data loading ---------- */
  async function loadAllData() {
    loading.value = true
    error.value = ''

    try {
      // Load permissions
      const permissionsSnap = await getDocs(collection(db, 'permissions'))
      allPermissions.value = permissionsSnap.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }))
      // Load roles with proper ordering
      const rolesQuery = query(collection(db, 'roles'), orderBy('hierarchy', 'desc'))
      const rolesSnap = await getDocs(rolesQuery)
      allRoles.value = rolesSnap.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }))
      ))

      // Load users
      const usersSnap = await getDocs(collection(db, 'users'))
      allUsers.value = usersSnap.docs.map(doc => ({
        id: doc.id,
        uid: doc.id, // Ensure both id and uid are available
        ...doc.data()
      }))
      // Initialize default roles if none exist
      if (allRoles.value.length === 0) {
        await initializeDefaultRoles()
      }

    } catch (err) {
      error.value = err.message
    } finally {
      loading.value = false
    }
  }

  /* ---------- role management ---------- */
  async function initializeDefaultRoles() {
    const defaultRoles = [
      {
        id: 'owner',
        name: 'Owner',
        hierarchy: 100,
        permissions: ['*'], // All permissions
        isSystemRole: true,
        description: 'Full system access'
      },
      {
        id: 'admin',
        name: 'Administrator',
        hierarchy: 90,
        permissions: [
          'view_admin_panel',
          'manage_users',
          'manage_roles',
          'view_audit_logs',
          'create_users',
          'edit_users',
          'delete_users'
        ],
        isSystemRole: true,
        description: 'Administrative access'
      },
      {
        id: 'user',
        name: 'User',
        hierarchy: 50,
        permissions: [
          'view_dashboard',
          'edit_own_profile'
        ],
        isSystemRole: true,
        description: 'Standard user access'
      },
      {
        id: 'viewer',
        name: 'Viewer',
        hierarchy: 20,
        permissions: [
          'view_dashboard'
        ],
        isSystemRole: true,
        description: 'Read-only access'
      },
      {
        id: 'pending',
        name: 'Pending Approval',
        hierarchy: 10,
        permissions: [],
        isSystemRole: true,
        description: 'Awaiting approval'
      }
    ]

    try {
      for (const role of defaultRoles) {
        await addDoc(collection(db, 'roles'), {
          name: role.name,
          hierarchy: role.hierarchy,
          permissions: role.permissions,
          isSystemRole: role.isSystemRole,
          description: role.description,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp()
        })
      }

      // Reload roles after initialization
      const rolesQuery = query(collection(db, 'roles'), orderBy('hierarchy', 'desc'))
      const rolesSnap = await getDocs(rolesQuery)
      allRoles.value = rolesSnap.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }))

      } catch (error) {
      }
  }

  async function updateRolePermissions(roleId, permissions) {
    try {
      await updateDoc(doc(db, 'roles', roleId), {
        permissions,
        updatedAt: serverTimestamp()
      })

      // Update local state
      const roleIndex = allRoles.value.findIndex(r => r.id === roleId)
      if (roleIndex !== -1) {
        allRoles.value[roleIndex].permissions = permissions
      }

      return { success: true }
    } catch (err) {
      return { success: false, error: err.message }
    }
  }

  async function createRole(roleData) {
    try {
      // Validate role data
      if (!roleData.name) {
        throw new Error('Role name is required')
      }

      // Check if role name already exists
      const existingRole = allRoles.value.find(
        r => r.name.toLowerCase() === roleData.name.toLowerCase()
      )
      if (existingRole) {
        throw new Error('A role with this name already exists')
      }

      const docRef = await addDoc(collection(db, 'roles'), {
        name: roleData.name,
        description: roleData.description || '',
        permissions: roleData.permissions || [],
        hierarchy: roleData.hierarchy || 2,
        isSystemRole: false,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      })

      // Add to local state
      const newRole = {
        id: docRef.id,
        ...roleData,
        isSystemRole: false
      }
      allRoles.value.push(newRole)

      return { success: true, id: docRef.id }
    } catch (err) {
      return { success: false, error: err.message }
    }
  }

  async function updateRole(roleId, roleData) {
    try {
      const role = allRoles.value.find(r => r.id === roleId)
      if (role?.isSystemRole && roleData.name !== role.name) {
        throw new Error('Cannot modify system role names')
      }

      await updateDoc(doc(db, 'roles', roleId), {
        name: roleData.name,
        description: roleData.description,
        permissions: roleData.permissions,
        hierarchy: roleData.hierarchy,
        updatedAt: serverTimestamp()
      })

      // Update local state
      const roleIndex = allRoles.value.findIndex(r => r.id === roleId)
      if (roleIndex !== -1) {
        allRoles.value[roleIndex] = {
          ...allRoles.value[roleIndex],
          ...roleData,
          updatedAt: new Date()
        }
      }

      return { success: true }
    } catch (err) {
      return { success: false, error: err.message }
    }
  }

  async function deleteRole(roleId) {
    try {
      const role = allRoles.value.find(r => r.id === roleId)
      if (role?.isSystemRole) {
        throw new Error('Cannot delete system roles')
      }

      // Check if any users have this role
      const usersWithRole = allUsers.value.filter(u => u.role === roleId)
      if (usersWithRole.length > 0) {
        throw new Error(`Cannot delete role: ${usersWithRole.length} users still have this role`)
      }

      await deleteDoc(doc(db, 'roles', roleId))

      // Remove from local state
      allRoles.value = allRoles.value.filter(r => r.id !== roleId)

      return { success: true }
    } catch (err) {
      return { success: false, error: err.message }
    }
  }

  /* ---------- user management ---------- */
  async function updateUserRole(userId, newRole) {
    try {
      await updateDoc(doc(db, 'users', userId), {
        role: newRole,
        updatedAt: serverTimestamp()
      })

      // Update local state
      const userIndex = allUsers.value.findIndex(u => u.id === userId || u.uid === userId)
      if (userIndex !== -1) {
        allUsers.value[userIndex].role = newRole
      }

      return { success: true }
    } catch (err) {
      return { success: false, error: err.message }
    }
  }

  async function updateUserCustomPermissions(userId, customPermissions, deniedPermissions) {
    try {
      await updateDoc(doc(db, 'users', userId), {
        customPermissions: customPermissions || [],
        deniedPermissions: deniedPermissions || [],
        updatedAt: serverTimestamp()
      })

      // Update local state
      const userIndex = allUsers.value.findIndex(u => u.id === userId || u.uid === userId)
      if (userIndex !== -1) {
        allUsers.value[userIndex].customPermissions = customPermissions || []
        allUsers.value[userIndex].deniedPermissions = deniedPermissions || []
      }

      return { success: true }
    } catch (err) {
      return { success: false, error: err.message }
    }
  }

  /* ---------- real-time listeners ---------- */
  function setupRealtimeListeners() {
    // Listen to roles changes
    const rolesQuery = query(collection(db, 'roles'), orderBy('hierarchy', 'desc'))
    const unsubscribeRoles = onSnapshot(rolesQuery, (snapshot) => {
      allRoles.value = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }))
      }, (error) => {
      })

    // Listen to users changes
    const unsubscribeUsers = onSnapshot(collection(db, 'users'), (snapshot) => {
      allUsers.value = snapshot.docs.map(doc => ({
        id: doc.id,
        uid: doc.id,
        ...doc.data()
      }))
      }, (error) => {
      })

    // Return cleanup function
    return () => {
      unsubscribeRoles()
      unsubscribeUsers()
    }
  }

  /* ---------- getters for compatibility ---------- */
  function getRoleById(roleId) {
    return allRoles.value.find(role => role.id === roleId)
  }

  function getUserById(userId) {
    return allUsers.value.find(user => user.id === userId || user.uid === userId)
  }

  function getPermissionById(permissionId) {
    return allPermissions.value.find(permission => permission.id === permissionId)
  }

  /* ---------- return public interface ---------- */
  return {
    // State
    allPermissions,
    allRoles,
    allUsers,
    loading,
    error,

    // Computed
    permissionsByCategory,
    roleHierarchy,
    roles, // Backwards compatibility alias

    // Methods
    loadAllData,
    setupRealtimeListeners,

    // Role management
    createRole,
    updateRole,
    updateRolePermissions,
    deleteRole,

    // User management
    updateUserRole,
    updateUserCustomPermissions,

    // Getters
    getRoleById,
    getUserById,
    getPermissionById
  }
})