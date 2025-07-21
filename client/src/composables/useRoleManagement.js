// client/src/composables/useRoleManagement.js
import { ref, computed } from 'vue'
import { usePermissionsStore } from '@/stores/permissions'

export function useRoleManagement() {
  const permissionsStore = usePermissionsStore()
  
  // State
  const loading = ref(false)
  const saving = ref(false)
  const search = ref('')
  const selectedCategory = ref('all')
  
  // Snackbar state
  const snackbar = ref({
    show: false,
    message: '',
    color: 'success'
  })
  
  // Computed properties
  const roles = computed(() => {
    let filtered = permissionsStore.allRoles

    // Search filter
    if (search.value) {
      const searchLower = search.value.toLowerCase()
      filtered = filtered.filter(role =>
        role.name.toLowerCase().includes(searchLower) ||
        role.description?.toLowerCase().includes(searchLower)
      )
    }

    // Sort by hierarchy
    return filtered.sort((a, b) => (b.hierarchy || 0) - (a.hierarchy || 0))
  })
  
  const permissions = computed(() => permissionsStore.allPermissions)
  const permissionsByCategory = computed(() => permissionsStore.permissionsByCategory)
  
  const permissionCategories = computed(() => {
    const categories = Object.keys(permissionsByCategory.value).filter(cat => 
      cat && permissionsByCategory.value[cat] && permissionsByCategory.value[cat].length > 0
    )
    if (selectedCategory.value === 'all') return categories
    return categories.filter(cat => cat === selectedCategory.value)
  })
  
  const usersPerRole = computed(() => {
    const counts = {}
    permissionsStore.allUsers.forEach(user => {
      counts[user.role] = (counts[user.role] || 0) + 1
    })
    return counts
  })
  
  // Methods
  const canDeleteRole = (role) => {
    // Cannot delete system roles
    if (role.isSystemRole) return false
    // Cannot delete if users have this role
    if (usersPerRole.value[role.id] > 0) return false
    return true
  }
  
  const showSnackbar = (message, color = 'success') => {
    snackbar.value = {
      show: true,
      message,
      color
    }
  }
  
  const togglePermission = (permissions, permissionId) => {
    const index = permissions.indexOf(permissionId)
    if (index > -1) {
      permissions.splice(index, 1)
    } else {
      permissions.push(permissionId)
    }
  }
  
  const toggleAllInCategory = (permissions, category) => {
    const categoryPerms = permissionsByCategory.value[category].map(p => p.id)
    const hasAll = categoryPerms.every(p => permissions.includes(p))
    
    if (hasAll) {
      // Remove all
      return permissions.filter(p => !categoryPerms.includes(p))
    } else {
      // Add all missing
      const toAdd = categoryPerms.filter(p => !permissions.includes(p))
      return [...permissions, ...toAdd]
    }
  }
  
  // Role operations
  async function createRole(roleData) {
    saving.value = true
    
    // Ensure permissions is an array
    if (!Array.isArray(roleData.permissions)) {
      roleData.permissions = []
    }
    
    const result = await permissionsStore.createRole(roleData)
    
    if (result.success) {
      showSnackbar('Role created successfully')
    } else {
      showSnackbar(result.error || 'Failed to create role', 'error')
    }
    
    saving.value = false
    return result
  }
  
  async function updateRole(roleId, roleData) {
    saving.value = true
    
    // Ensure permissions is an array
    if (!Array.isArray(roleData.permissions)) {
      roleData.permissions = []
    }
    
    const result = await permissionsStore.updateRole(roleId, roleData)
    
    if (result.success) {
      showSnackbar('Role updated successfully')
    } else {
      showSnackbar(result.error || 'Failed to update role', 'error')
    }
    
    saving.value = false
    return result
  }
  
  async function deleteRole(roleId) {
    saving.value = true
    
    const result = await permissionsStore.deleteRole(roleId)
    
    if (result.success) {
      showSnackbar('Role deleted successfully')
    } else {
      showSnackbar(result.error || 'Failed to delete role', 'error')
    }
    
    saving.value = false
    return result
  }
  
  return {
    // State
    loading,
    saving,
    search,
    selectedCategory,
    snackbar,
    
    // Computed
    roles,
    permissions,
    permissionsByCategory,
    permissionCategories,
    usersPerRole,
    
    // Methods
    canDeleteRole,
    showSnackbar,
    togglePermission,
    toggleAllInCategory,
    createRole,
    updateRole,
    deleteRole
  }
}

// Helper functions for UI
export function getRoleColor(roleId) {
  const colorMap = {
    'owner': 'deep-purple',
    'admin': 'indigo',
    'user': 'blue',
    'viewer': 'teal',
    'pending': 'orange'
  }
  return colorMap[roleId] || 'surface'
}

export function getCategoryIcon(category) {
  const iconMap = {
    'user_management': 'mdi-account-group',
    'content_management': 'mdi-file-document-multiple',
    'community': 'mdi-forum',
    'scheduling': 'mdi-calendar',
    'profile': 'mdi-account-circle',
    'system': 'mdi-cog'
  }
  return iconMap[category] || 'mdi-folder'
}

// Hierarchy items for dropdowns
export function getHierarchyItems(isSystemRole = false, currentHierarchy = null) {
  // For system roles, don't allow changing to reserved levels
  const systemLevels = [100, 90, 50, 20, 10]
  
  // Common custom role levels
  const customLevels = [
    { title: 'Level 80 (Very High)', value: 80 },
    { title: 'Level 70 (High)', value: 70 },
    { title: 'Level 60 (Elevated)', value: 60 },
    { title: 'Level 40 (Medium)', value: 40 },
    { title: 'Level 30 (Standard)', value: 30 },
    { title: 'Level 15 (Low)', value: 15 },
    { title: 'Level 5 (Very Low)', value: 5 }
  ]
  
  // For editing system roles, show their current level as disabled
  if (isSystemRole && currentHierarchy) {
    return [{
      title: `Level ${currentHierarchy} (System Role - Cannot Change)`,
      value: currentHierarchy,
      disabled: true
    }]
  }
  
  // For custom roles, filter out system-reserved levels
  return customLevels
}