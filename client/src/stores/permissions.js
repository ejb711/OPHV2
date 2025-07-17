// client/src/stores/permissions.js - Permission management store
import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { 
  collection, 
  getDocs, 
  doc, 
  updateDoc, 
  addDoc,
  deleteDoc,
  serverTimestamp 
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

      // Load roles
      const rolesSnap = await getDocs(collection(db, 'roles'))
      allRoles.value = rolesSnap.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }))

      // Load users
      const usersSnap = await getDocs(collection(db, 'users'))
      allUsers.value = usersSnap.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }))

    } catch (err) {
      console.error('Error loading permission data:', err)
      error.value = err.message
    } finally {
      loading.value = false
    }
  }

  /* ---------- role management ---------- */
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
      console.error('Error updating role permissions:', err)
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
      allRoles.value.push({
        id: docRef.id,
        ...roleData,
        isSystemRole: false
      })
      
      return { success: true, id: docRef.id }
    } catch (err) {
      console.error('Error creating role:', err)
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
      console.error('Error deleting role:', err)
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

      // Log the role change
      await addDoc(collection(db, 'roleChanges'), {
        userId,
        newRole,
        changedAt: serverTimestamp(),
        changedBy: 'current-user-id' // You'll need to pass this from auth store
      })
      
      // Update local state
      const userIndex = allUsers.value.findIndex(u => u.id === userId)
      if (userIndex !== -1) {
        allUsers.value[userIndex].role = newRole
      }
      
      return { success: true }
    } catch (err) {
      console.error('Error updating user role:', err)
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
      const userIndex = allUsers.value.findIndex(u => u.id === userId)
      if (userIndex !== -1) {
        allUsers.value[userIndex].customPermissions = customPermissions || []
        allUsers.value[userIndex].deniedPermissions = deniedPermissions || []
      }
      
      return { success: true }
    } catch (err) {
      console.error('Error updating user permissions:', err)
      return { success: false, error: err.message }
    }
  }

  /* ---------- permission utilities ---------- */
  function getRolePermissions(roleId) {
    const role = allRoles.value.find(r => r.id === roleId)
    return role?.permissions || []
  }

  function getUserEffectivePermissions(user) {
    const rolePermissions = getRolePermissions(user.role)
    const customPermissions = user.customPermissions || []
    const deniedPermissions = user.deniedPermissions || []
    
    const effective = new Set([...rolePermissions, ...customPermissions])
    deniedPermissions.forEach(p => effective.delete(p))
    
    return Array.from(effective)
  }

  function getPermissionsByCategory(category) {
    return allPermissions.value.filter(p => p.category === category)
  }

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

    // Actions
    loadAllData,
    updateRolePermissions,
    createRole,
    deleteRole,
    updateUserRole,
    updateUserCustomPermissions,

    // Utilities
    getRolePermissions,
    getUserEffectivePermissions,
    getPermissionsByCategory
  }
})