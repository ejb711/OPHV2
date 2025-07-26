<!-- client/src/components/admin/PermissionMatrix.vue -->
<script setup>
import { ref, computed, onMounted, onUnmounted, watch } from 'vue'
import { collection, onSnapshot, doc, addDoc, serverTimestamp, getDocs, query, where, deleteDoc } from 'firebase/firestore'
import { db } from '../../firebase'
import { useAuthStore } from '../../stores/auth'
import { usePermissionsStore } from '../../stores/permissions'
import PermissionGuard from '../PermissionGuard.vue'

const emit = defineEmits(['activity'])

const authStore = useAuthStore()
const permissionsStore = usePermissionsStore()

/* ---------- state ---------- */
const loading = ref(true)
const saving = ref(false)
const search = ref('')
const showSystemRoles = ref(true)
const showCustomRoles = ref(true)
const expandedCategories = ref([]) // Which permission categories are expanded
const selectedRoles = ref([]) // For bulk operations
const hoveredCell = ref(null) // For hover effects
const hoveredCategory = ref(null) // For category hover
const collapsedCategories = ref([]) // Track which categories are collapsed

// Toggle category collapse state
const toggleCategoryCollapse = (category) => {
  const index = collapsedCategories.value.indexOf(category)
  if (index > -1) {
    collapsedCategories.value.splice(index, 1)
  } else {
    collapsedCategories.value.push(category)
  }
}

// Check if category is collapsed
const isCategoryCollapsed = (category) => {
  return collapsedCategories.value.includes(category)
}

// Toggle all categories expanded/collapsed
const toggleAllCategories = () => {
  if (collapsedCategories.value.length === permissionCategories.value.length) {
    // All collapsed, so expand all
    collapsedCategories.value = []
  } else {
    // Some or none collapsed, so collapse all
    collapsedCategories.value = [...permissionCategories.value]
  }
}

// Get visible permissions for a category (empty if collapsed)
const getVisiblePermissions = (category) => {
  if (isCategoryCollapsed(category)) return []
  return permissionsStore.permissionsByCategory[category] || []
}

// Dialogs
const showCreatePermissionDialog = ref(false)
const showCreateCategoryDialog = ref(false)
const showManageCategoriesDialog = ref(false)
const showDeletePermissionDialog = ref(false)
const permissionToDelete = ref(null)

// Check if permission is a system permission
const isSystemPermission = (permissionId) => {
  const systemPermissions = [
    'access_admin', 'manage_users', 'view_users', 'manage_roles',
    'manage_permissions', 'manage_settings', 'view_audit_logs',
    'view_calendar', 'create_events', 'edit_events', 'delete_events',
    'view_forums', 'create_posts', 'edit_posts', 'delete_posts', 'moderate_posts',
    'view_projects', 'create_projects', 'edit_projects', 'delete_projects', 'manage_projects',
    'view_analytics', 'edit_analytics'
  ]
  return systemPermissions.includes(permissionId)
}

// Delete permission
async function deletePermission(permission) {
  if (!permission) return

  // Don't allow deleting system permissions
  if (isSystemPermission(permission.id)) {
    showSnackbar('Cannot delete system permissions', 'error')
    return
  }

  permissionToDelete.value = permission
  showDeletePermissionDialog.value = true
}

async function confirmDeletePermission() {
  if (!permissionToDelete.value) return

  saving.value = true

  try {
    // Find all documents with this permission ID (there should only be one)
    const permissionQuery = query(collection(db, 'permissions'), where('id', '==', permissionToDelete.value.id))
    const permissionDocs = await getDocs(permissionQuery)

    if (permissionDocs.empty) {
      showSnackbar('Permission not found', 'error')
      saving.value = false
      return
    }

    // Delete the permission document
    for (const doc of permissionDocs.docs) {
      await deleteDoc(doc.ref)
    }

    // Remove from all roles that have this permission
    for (const role of permissionsStore.allRoles) {
      if (role.permissions?.includes(permissionToDelete.value.id)) {
        const newPermissions = role.permissions.filter(p => p !== permissionToDelete.value.id)
        await permissionsStore.updateRolePermissions(role.id, newPermissions)
      }
    }

    // Log activity before clearing the reference
    emit('activity', {
      type: 'permission_deleted',
      permissionId: permissionToDelete.value.id,
      permissionName: permissionToDelete.value.name
    })

    showSnackbar('Permission deleted successfully', 'success')
    showDeletePermissionDialog.value = false
    permissionToDelete.value = null

    // Reload data
    await permissionsStore.loadAllData()
  } catch (error) {
    showSnackbar('Failed to delete permission', 'error')
  }

  saving.value = false
}

// Forms for creating permissions
const newPermissionForm = ref({
  id: '',
  name: '',
  description: '',
  category: ''
})

const newCategoryForm = ref({
  id: '',
  name: ''
})

// Permission statistics
const permissionStats = computed(() => {
  const total = permissionsStore.allPermissions.length
  const system = permissionsStore.allPermissions.filter(p => isSystemPermission(p.id)).length
  const custom = total - system
  return { total, system, custom }
})

// Matrix view options
const viewMode = ref('compact') // 'compact' or 'detailed'
const showDescriptions = ref(false)
const showInheritedIndicator = ref(true)

// Snackbar for notifications
const snackbar = ref({
  show: false,
  message: '',
  color: 'success'
})

// Real-time listeners
let unsubscribeRoles = null
let unsubscribePermissions = null

/* ---------- computed ---------- */
// Filtered roles based on search and filters
const filteredRoles = computed(() => {
  let roles = permissionsStore.allRoles

  // Filter by system/custom
  if (!showSystemRoles.value) {
    roles = roles.filter(r => canEditRole(r))
  }
  if (!showCustomRoles.value) {
    roles = roles.filter(r => !canEditRole(r))
  }

  // Search filter
  if (search.value) {
    const searchLower = search.value.toLowerCase()
    roles = roles.filter(role =>
      role.name.toLowerCase().includes(searchLower) ||
      role.description?.toLowerCase().includes(searchLower)
    )
  }

  // Sort by hierarchy (highest first)
  return roles.sort((a, b) => (b.hierarchy || 0) - (a.hierarchy || 0))
})

// Permission categories to display
const permissionCategories = computed(() => {
  const categories = Object.keys(permissionsStore.permissionsByCategory)
  return categories.filter(cat =>
    permissionsStore.permissionsByCategory[cat]?.length > 0
  )
})

// Check if a role is a system role
const isSystemRole = (role) => {
  const systemRoleIds = ['owner', 'admin', 'user', 'viewer', 'pending']
  return systemRoleIds.includes(role.id)
}

// Dialog states
const showSystemRoleWarning = ref(false)
const pendingPermissionChange = ref(null)

// Check if a role has a specific permission
const roleHasPermission = (roleId, permissionId) => {
  const role = permissionsStore.allRoles.find(r => r.id === roleId)
  return role?.permissions?.includes(permissionId) || false
}

// Check if permission is inherited (for custom roles inheriting from base roles)
const isInheritedPermission = (roleId, permissionId) => {
  // This is a placeholder - you might implement inheritance logic later
  return false
}

// Count permissions for a role in a category
const getRoleCategoryCount = (roleId, category) => {
  const role = permissionsStore.allRoles.find(r => r.id === roleId)
  if (!role) return 0

  const categoryPerms = permissionsStore.permissionsByCategory[category] || []
  return categoryPerms.filter(p => role.permissions?.includes(p.id)).length
}

// Check if all permissions in a category are selected for a role
const roleHasAllInCategory = (roleId, category) => {
  const role = permissionsStore.allRoles.find(r => r.id === roleId)
  if (!role) return false

  const categoryPerms = permissionsStore.permissionsByCategory[category] || []
  return categoryPerms.every(p => role.permissions?.includes(p.id))
}

// Check if role has some but not all permissions in a category
const roleHasSomeInCategory = (roleId, category) => {
  const count = getRoleCategoryCount(roleId, category)
  const total = (permissionsStore.permissionsByCategory[category] || []).length
  return count > 0 && count < total
}

/* ---------- lifecycle ---------- */
onMounted(async () => {
  loading.value = true

  // Load initial data
  await permissionsStore.loadAllData()

  // DEBUG: Check role data
  permissionsStore.allRoles.forEach(role => {
    })

  // Set up real-time listeners for roles
  unsubscribeRoles = onSnapshot(
    collection(db, 'roles'),
    (snapshot) => {
      const roles = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }))
      permissionsStore.allRoles = roles
    },
    (error) => {
      showSnackbar('Error loading roles', 'error')
    }
  )

  // Set up real-time listeners for permissions
  unsubscribePermissions = onSnapshot(
    collection(db, 'permissions'),
    (snapshot) => {
      const permissions = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }))
      permissionsStore.allPermissions = permissions
    },
    (error) => {
      showSnackbar('Error loading permissions', 'error')
    }
  )

  // Expand first category by default
  if (permissionCategories.value.length > 0) {
    expandedCategories.value = [permissionCategories.value[0]]
  }

  loading.value = false
})

onUnmounted(() => {
  if (unsubscribeRoles) unsubscribeRoles()
  if (unsubscribePermissions) unsubscribePermissions()
})

/* ---------- methods ---------- */
// Toggle a single permission for a role
async function togglePermission(roleId, permissionId, skipWarning = false) {
  const role = permissionsStore.allRoles.find(r => r.id === roleId)
  if (!role) return

  // Show warning for system roles
  if (isSystemRole(role) && !skipWarning) {
    pendingPermissionChange.value = { roleId, permissionId }
    showSystemRoleWarning.value = true
    return
  }

  saving.value = true
  const currentPermissions = role.permissions || []
  let newPermissions

  if (currentPermissions.includes(permissionId)) {
    // Remove permission
    newPermissions = currentPermissions.filter(p => p !== permissionId)
  } else {
    // Add permission
    newPermissions = [...currentPermissions, permissionId]
  }

  const result = await permissionsStore.updateRolePermissions(roleId, newPermissions)

  if (result.success) {
    emit('activity', {
      type: 'permission_toggle',
      roleId,
      permissionId,
      action: currentPermissions.includes(permissionId) ? 'removed' : 'added'
    })
    showSnackbar('Permission updated', 'success')
  } else {
    showSnackbar(result.error || 'Failed to update permission', 'error')
  }

  saving.value = false
}

// Confirm system role edit
function confirmSystemRoleEdit() {
  if (pendingPermissionChange.value) {
    const { roleId, permissionId } = pendingPermissionChange.value
    showSystemRoleWarning.value = false
    togglePermission(roleId, permissionId, true)
    pendingPermissionChange.value = null
  }
}

// Toggle all permissions in a category for a role
async function toggleCategoryForRole(roleId, category) {
  const role = permissionsStore.allRoles.find(r => r.id === roleId)
  if (!role) return

  // Show warning for system roles
  if (isSystemRole(role)) {
    showSnackbar('Editing system role - use with caution!', 'warning')
  }

  saving.value = true
  const categoryPerms = permissionsStore.permissionsByCategory[category] || []
  const categoryPermIds = categoryPerms.map(p => p.id)
  const currentPermissions = role.permissions || []

  let newPermissions
  if (roleHasAllInCategory(roleId, category)) {
    // Remove all category permissions
    newPermissions = currentPermissions.filter(p => !categoryPermIds.includes(p))
  } else {
    // Add all category permissions
    const toAdd = categoryPermIds.filter(p => !currentPermissions.includes(p))
    newPermissions = [...currentPermissions, ...toAdd]
  }

  const result = await permissionsStore.updateRolePermissions(roleId, newPermissions)

  if (result.success) {
    emit('activity', {
      type: 'category_toggle',
      roleId,
      category,
      action: roleHasAllInCategory(roleId, category) ? 'removed_all' : 'added_all'
    })
    showSnackbar(`Updated all ${category.replace(/_/g, ' ')} permissions`, 'success')
  } else {
    showSnackbar(result.error || 'Failed to update permissions', 'error')
  }

  saving.value = false
}

// Bulk grant permission to selected roles
async function bulkGrantPermission(permissionId) {
  if (selectedRoles.value.length === 0) {
    showSnackbar('No roles selected', 'warning')
    return
  }

  saving.value = true
  let successCount = 0

  for (const roleId of selectedRoles.value) {
    const role = permissionsStore.allRoles.find(r => r.id === roleId)
    if (!role) continue

    // Show warning for system roles
    if (isSystemRole(role)) {
      showSnackbar('Including system roles in bulk operation', 'warning')
    }

    const currentPermissions = role.permissions || []
    if (!currentPermissions.includes(permissionId)) {
      const newPermissions = [...currentPermissions, permissionId]
      const result = await permissionsStore.updateRolePermissions(roleId, newPermissions)
      if (result.success) successCount++
    }
  }

  emit('activity', {
    type: 'bulk_grant',
    permissionId,
    roleCount: successCount
  })

  showSnackbar(`Granted permission to ${successCount} roles`, 'success')
  saving.value = false
}

// Bulk revoke permission from selected roles
async function bulkRevokePermission(permissionId) {
  if (selectedRoles.value.length === 0) {
    showSnackbar('No roles selected', 'warning')
    return
  }

  saving.value = true
  let successCount = 0

  for (const roleId of selectedRoles.value) {
    const role = permissionsStore.allRoles.find(r => r.id === roleId)
    if (!role) continue

    // Show warning for system roles
    if (isSystemRole(role)) {
      showSnackbar('Including system roles in bulk operation', 'warning')
    }

    const currentPermissions = role.permissions || []
    if (currentPermissions.includes(permissionId)) {
      const newPermissions = currentPermissions.filter(p => p !== permissionId)
      const result = await permissionsStore.updateRolePermissions(roleId, newPermissions)
      if (result.success) successCount++
    }
  }

  emit('activity', {
    type: 'bulk_revoke',
    permissionId,
    roleCount: successCount
  })

  showSnackbar(`Revoked permission from ${successCount} roles`, 'success')
  saving.value = false
}

// Export matrix data
function exportMatrix(format = 'csv') {
  const data = []

  // Headers
  const headers = ['Role']
  permissionCategories.value.forEach(category => {
    const perms = permissionsStore.permissionsByCategory[category] || []
    perms.forEach(p => headers.push(p.name))
  })
  data.push(headers)

  // Rows
  filteredRoles.value.forEach(role => {
    const row = [role.name]
    permissionCategories.value.forEach(category => {
      const perms = permissionsStore.permissionsByCategory[category] || []
      perms.forEach(p => {
        row.push(roleHasPermission(role.id, p.id) ? 'Yes' : 'No')
      })
    })
    data.push(row)
  })

  if (format === 'csv') {
    const csv = data.map(row => row.join(',')).join('\n')
    downloadFile(csv, 'permission-matrix.csv', 'text/csv')
  } else if (format === 'json') {
    const json = {
      exportDate: new Date().toISOString(),
      matrix: filteredRoles.value.map(role => ({
        roleId: role.id,
        roleName: role.name,
        permissions: role.permissions || []
      }))
    }
    downloadFile(JSON.stringify(json, null, 2), 'permission-matrix.json', 'application/json')
  }
}

// Helper to download file
function downloadFile(content, filename, type) {
  const blob = new Blob([content], { type })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  link.click()
  URL.revokeObjectURL(url)
}

// Create new permission
async function createPermission() {
  // Mark all fields as touched
  permissionFormTouched.value.name = true
  permissionFormTouched.value.id = true
  permissionFormTouched.value.category = true

  if (!newPermissionForm.value.id || !newPermissionForm.value.name || !newPermissionForm.value.category) {
    showSnackbar('Please fill in all required fields', 'warning')
    return
  }

  saving.value = true

  try {
    // Check if permission ID already exists
    const exists = permissionsStore.allPermissions.some(p => p.id === newPermissionForm.value.id)
    if (exists) {
      showSnackbar('A permission with this ID already exists', 'error')
      saving.value = false
      return
    }

    // Add to Firestore
    await addDoc(collection(db, 'permissions'), {
      id: newPermissionForm.value.id,
      name: newPermissionForm.value.name,
      description: newPermissionForm.value.description,
      category: newPermissionForm.value.category,
      createdAt: serverTimestamp(),
      createdBy: authStore.user.uid
    })

    showSnackbar('Permission created successfully', 'success')
    showCreatePermissionDialog.value = false

    // Log activity
    emit('activity', {
      type: 'permission_created',
      permissionId: newPermissionForm.value.id
    })

    // Reset form
    newPermissionForm.value = {
      id: '',
      name: '',
      description: '',
      category: ''
    }
    permissionFormTouched.value = {
      name: false,
      id: false,
      category: false
    }
  } catch (error) {
    showSnackbar('Failed to create permission', 'error')
  }

  saving.value = false
}

// Generate permission ID from name
function generatePermissionId() {
  if (newPermissionForm.value.name && newPermissionForm.value.name.trim()) {
    newPermissionForm.value.id = newPermissionForm.value.name
      .toLowerCase()
      .replace(/\s+/g, '_')
      .replace(/[^a-z0-9_]/g, '')
  }
}

// Watch for dialog open/close to reset forms
watch(showCreateCategoryDialog, (newVal) => {
  if (newVal) {
    // Reset form when opening
    newCategoryForm.value = { id: '', name: '' }
    categoryFormTouched.value = { name: false, id: false }
  }
})

watch(showCreatePermissionDialog, (newVal) => {
  if (newVal && !newPermissionForm.value.category) {
    // Reset form when opening (unless category is pre-selected)
    newPermissionForm.value = {
      id: '',
      name: '',
      description: '',
      category: newPermissionForm.value.category || ''
    }
    permissionFormTouched.value = {
      name: false,
      id: false,
      category: false
    }
  }
})

// Get unique categories (including custom ones)
const allCategories = computed(() => {
  const categories = new Set(Object.keys(permissionsStore.permissionsByCategory))
  permissionsStore.allPermissions.forEach(p => {
    if (p.category) categories.add(p.category)
  })
  return Array.from(categories).sort()
})

// Form validation state
const categoryFormTouched = ref({
  name: false,
  id: false
})

const permissionFormTouched = ref({
  name: false,
  id: false,
  category: false
})

// Create new category
async function createCategory() {
  // Mark all fields as touched
  categoryFormTouched.value.name = true
  categoryFormTouched.value.id = true

  if (!newCategoryForm.value.id || !newCategoryForm.value.name) {
    showSnackbar('Please fill in all required fields', 'warning')
    return
  }

  // Format category ID
  const categoryId = newCategoryForm.value.id
    .toLowerCase()
    .replace(/\s+/g, '_')
    .replace(/[^a-z0-9_]/g, '')

  // Check if category already exists
  if (allCategories.value.includes(categoryId)) {
    showSnackbar('A category with this ID already exists', 'error')
    return
  }

  showSnackbar(`Category "${newCategoryForm.value.name}" created. Add permissions to populate it.`, 'success')
  showCreateCategoryDialog.value = false

  // Reset form and touched state
  newCategoryForm.value = {
    id: '',
    name: ''
  }
  categoryFormTouched.value = {
    name: false,
    id: false
  }

  // Open create permission dialog with new category pre-selected
  newPermissionForm.value.category = categoryId
  showCreatePermissionDialog.value = true
}

// Generate category ID from name
function generateCategoryId() {
  if (newCategoryForm.value.name && newCategoryForm.value.name.trim()) {
    newCategoryForm.value.id = newCategoryForm.value.name
      .toLowerCase()
      .replace(/\s+/g, '_')
      .replace(/[^a-z0-9_]/g, '')
  }
}

// Helper functions
function showSnackbar(message, color = 'success') {
  snackbar.value = { show: true, message, color }
}

function getCategoryIcon(category) {
  const icons = {
    user_management: 'mdi-account-group',
    content_management: 'mdi-folder-edit',
    communication: 'mdi-forum',
    system_management: 'mdi-cog',
    analytics: 'mdi-chart-box'
  }
  return icons[category] || 'mdi-key'
}

function formatCategoryName(category) {
  // Handle both string and object inputs
  if (typeof category === 'object' && category !== null) {
    return category.title || category.value || 'Unknown'
  }
  if (typeof category !== 'string') {
    return String(category)
  }
  return category.replace(/_/g, ' ').toUpperCase()
}

function getRoleColor(role) {
  if (isSystemRole(role)) {
    const colors = {
      owner: 'purple',
      admin: 'blue',
      user: 'green',
      viewer: 'orange',
      pending: 'grey'
    }
    return colors[role.id] || 'primary'
  }
  return 'primary'
}
</script>

<template>
  <div>
    <!-- Toolbar -->
    <v-toolbar flat color="transparent" class="mb-4">
      <v-text-field
        v-model="search"
        prepend-inner-icon="mdi-magnify"
        label="Search roles..."
        variant="outlined"
        density="compact"
        hide-details
        clearable
        class="mr-4"
        style="max-width: 300px"
      ></v-text-field>

      <v-btn-toggle
        v-model="viewMode"
        mandatory
        density="compact"
        class="mr-4"
      >
        <v-btn value="compact" size="small">
          <v-icon size="small">mdi-view-grid</v-icon>
          Compact
        </v-btn>
        <v-btn value="detailed" size="small">
          <v-icon size="small">mdi-view-list</v-icon>
          Detailed
        </v-btn>
      </v-btn-toggle>

      <!-- Expand/Collapse All (for compact view) -->
      <v-btn
        v-if="viewMode === 'compact'"
        size="small"
        variant="text"
        @click="toggleAllCategories"
        class="mr-4"
      >
        <v-icon size="small">
          {{ collapsedCategories.length === permissionCategories.length ? 'mdi-unfold-more-horizontal' : 'mdi-unfold-less-horizontal' }}
        </v-icon>
        {{ collapsedCategories.length === permissionCategories.length ? 'Expand All' : 'Collapse All' }}
      </v-btn>

      <v-spacer></v-spacer>

      <!-- Create Permission Button -->
      <PermissionGuard permissions="manage_permissions">
        <v-menu>
          <template v-slot:activator="{ props }">
            <v-btn
              prepend-icon="mdi-plus"
              variant="outlined"
              size="small"
              class="mr-2"
              v-bind="props"
            >
              New
              <v-icon end size="small">mdi-menu-down</v-icon>
            </v-btn>
          </template>
          <v-list density="compact">
            <v-list-item @click="showCreatePermissionDialog = true">
              <template v-slot:prepend>
                <v-icon size="small">mdi-key-plus</v-icon>
              </template>
              <v-list-item-title>New Permission</v-list-item-title>
            </v-list-item>
            <v-list-item @click="() => {
              newCategoryForm.value = { id: '', name: '' };
              categoryFormTouched.value = { name: false, id: false };
              showCreateCategoryDialog = true
            }">
              <template v-slot:prepend>
                <v-icon size="small">mdi-folder-plus</v-icon>
              </template>
              <v-list-item-title>New Category</v-list-item-title>
            </v-list-item>
          </v-list>
        </v-menu>
      </PermissionGuard>

      <!-- View Options -->
      <v-menu>
        <template v-slot:activator="{ props }">
          <v-btn
            icon
            v-bind="props"
            size="small"
            class="mr-2"
          >
            <v-icon>mdi-tune</v-icon>
          </v-btn>
        </template>
        <v-list density="compact">
          <v-list-item>
            <v-checkbox
              v-model="showSystemRoles"
              label="Show system roles"
              hide-details
              density="compact"
            ></v-checkbox>
          </v-list-item>
          <v-list-item>
            <v-checkbox
              v-model="showCustomRoles"
              label="Show custom roles"
              hide-details
              density="compact"
            ></v-checkbox>
          </v-list-item>
          <v-list-item>
            <v-checkbox
              v-model="showDescriptions"
              label="Show descriptions"
              hide-details
              density="compact"
            ></v-checkbox>
          </v-list-item>
          <v-list-item>
            <v-checkbox
              v-model="showInheritedIndicator"
              label="Show inherited indicators"
              hide-details
              density="compact"
            ></v-checkbox>
          </v-list-item>
        </v-list>
      </v-menu>

      <!-- Export Menu -->
      <v-menu>
        <template v-slot:activator="{ props }">
          <v-btn
            prepend-icon="mdi-download"
            v-bind="props"
            variant="outlined"
            size="small"
          >
            Export
          </v-btn>
        </template>
        <v-list density="compact">
          <v-list-item @click="exportMatrix('csv')">
            <v-list-item-title>
              <v-icon size="small" class="mr-2">mdi-file-delimited</v-icon>
              Export as CSV
            </v-list-item-title>
          </v-list-item>
          <v-list-item @click="exportMatrix('json')">
            <v-list-item-title>
              <v-icon size="small" class="mr-2">mdi-code-json</v-icon>
              Export as JSON
            </v-list-item-title>
          </v-list-item>
        </v-list>
      </v-menu>
    </v-toolbar>

    <!-- Loading State -->
    <v-progress-linear
      v-if="loading"
      indeterminate
      color="primary"
    ></v-progress-linear>

    <!-- Matrix Content -->
    <v-card v-else variant="outlined">
      <!-- Permission Stats Bar -->
      <v-toolbar density="compact" color="grey-lighten-4">
        <v-toolbar-title class="text-caption">
          <v-chip size="x-small" class="mr-2">
            <v-icon start size="x-small">mdi-key</v-icon>
            {{ permissionStats.total }} Total
          </v-chip>
          <v-chip size="x-small" class="mr-2">
            <v-icon start size="x-small">mdi-shield</v-icon>
            {{ permissionStats.system }} System
          </v-chip>
          <v-chip size="x-small" color="info">
            <v-icon start size="x-small">mdi-pencil</v-icon>
            {{ permissionStats.custom }} Custom
          </v-chip>
        </v-toolbar-title>
      </v-toolbar>

      <!-- Selected Roles Toolbar -->
      <v-toolbar
        v-if="selectedRoles.length > 0"
        color="primary"
        dark
        density="compact"
      >
        <v-toolbar-title class="text-subtitle-2">
          {{ selectedRoles.length }} role(s) selected
        </v-toolbar-title>
        <v-spacer></v-spacer>
        <v-btn
          size="small"
          variant="text"
          @click="selectedRoles = []"
        >
          Clear Selection
        </v-btn>
      </v-toolbar>

      <!-- Matrix Grid -->
      <div class="permission-matrix-container">
        <div v-if="viewMode === 'compact'" class="matrix-compact">
          <table class="permission-matrix-table">
            <!-- Table Header -->
            <thead>
              <tr>
                <th class="role-header sticky-column">
                  <v-checkbox
                    v-model="selectedRoles"
                    :value="filteredRoles.map(r => r.id)"
                    hide-details
                    density="compact"
                    :indeterminate="selectedRoles.length > 0 && selectedRoles.length < filteredRoles.length"
                  ></v-checkbox>
                  Roles
                </th>

                <!-- Permission Category Headers -->
                <th
                  v-for="category in permissionCategories"
                  :key="`cat-${category}`"
                  :colspan="isCategoryCollapsed(category) ? 1 : (permissionsStore.permissionsByCategory[category] || []).length"
                  class="category-header"
                  @click="toggleCategoryCollapse(category)"
                  style="cursor: pointer;"
                >
                  <div class="d-flex align-center justify-center">
                    <v-icon size="small" class="mr-1">
                      {{ isCategoryCollapsed(category) ? 'mdi-chevron-right' : 'mdi-chevron-down' }}
                    </v-icon>
                    <v-icon size="small" class="mr-1">{{ getCategoryIcon(category) }}</v-icon>
                    {{ formatCategoryName(category) }}
                    <v-chip size="x-small" class="ml-2" variant="tonal">
                      {{ (permissionsStore.permissionsByCategory[category] || []).length }}
                    </v-chip>
                  </div>
                </th>
              </tr>

              <!-- Individual Permission Headers -->
              <tr>
                <th class="sticky-column"></th>
                <template v-for="category in permissionCategories" :key="`perms-${category}`">
                  <th
                    v-if="isCategoryCollapsed(category)"
                    class="permission-header collapsed-category"
                    @mouseenter="hoveredCategory = category"
                    @mouseleave="hoveredCategory = null"
                  >
                    <div class="collapsed-header">
                      <v-icon size="small" :title="`${(permissionsStore.permissionsByCategory[category] || []).length} permissions`">
                        mdi-dots-horizontal
                      </v-icon>

                      <!-- Hover Popup -->
                      <div
                        v-if="hoveredCategory === category"
                        class="permission-hover-popup"
                      >
                        <div class="popup-header">
                          {{ formatCategoryName(category) }}
                        </div>
                        <div class="popup-permissions">
                          <div
                            v-for="perm in (permissionsStore.permissionsByCategory[category] || [])"
                            :key="perm.id"
                            class="popup-permission"
                          >
                            {{ perm.name }}
                          </div>
                        </div>
                      </div>
                    </div>
                  </th>
                  <th
                    v-else
                    v-for="permission in (permissionsStore.permissionsByCategory[category] || [])"
                    :key="permission.id"
                    class="permission-header"
                    :title="permission.description"
                  >
                    <div class="permission-name d-flex align-center">
                      <span>{{ permission.name }}</span>
                      <v-icon
                        v-if="!isSystemPermission(permission.id)"
                        size="x-small"
                        color="info"
                        class="ml-1"
                        title="Custom permission (can be deleted)"
                      >
                        mdi-pencil
                      </v-icon>
                    </div>
                  </th>
                </template>
              </tr>
            </thead>

            <!-- Table Body -->
            <tbody>
              <tr v-for="role in filteredRoles" :key="role.id">
                <!-- Role Name Cell -->
                <td class="role-cell sticky-column">
                  <div class="d-flex align-center">
                    <v-checkbox
                      v-model="selectedRoles"
                      :value="role.id"
                      hide-details
                      density="compact"
                      class="mr-2"
                    ></v-checkbox>

                    <v-chip
                      :color="getRoleColor(role)"
                      :variant="isSystemRole(role) ? 'flat' : 'outlined'"
                      size="small"
                      class="mr-2"
                    >
                      {{ role.name }}
                    </v-chip>

                    <v-icon v-if="isSystemRole(role)" size="x-small" class="text-medium-emphasis" title="System Role">
                      mdi-shield-check
                    </v-icon>
                  </div>
                </td>

                <!-- Permission Cells -->
                <template v-for="category in permissionCategories" :key="`${role.id}-${category}`">
                  <td
                    v-if="isCategoryCollapsed(category)"
                    class="permission-cell collapsed text-center"
                    :title="`${getRoleCategoryCount(role.id, category)}/${(permissionsStore.permissionsByCategory[category] || []).length} permissions`"
                    @click="toggleCategoryForRole(role.id, category)"
                    style="cursor: pointer;"
                  >
                    <v-chip
                      size="x-small"
                      :color="roleHasAllInCategory(role.id, category) ? 'success' :
                              roleHasSomeInCategory(role.id, category) ? 'warning' :
                              'default'"
                      variant="tonal"
                    >
                      {{ getRoleCategoryCount(role.id, category) }}/{{ (permissionsStore.permissionsByCategory[category] || []).length }}
                    </v-chip>
                  </td>
                  <template v-else>
                    <td
                      v-for="permission in (permissionsStore.permissionsByCategory[category] || [])"
                      :key="`${role.id}-${permission.id}`"
                      class="permission-cell"
                      :class="{
                        'hovered': hoveredCell === `${role.id}-${permission.id}`,
                        'system-role': isSystemRole(role)
                      }"
                      @mouseenter="hoveredCell = `${role.id}-${permission.id}`"
                      @mouseleave="hoveredCell = null"
                    >
                      <v-checkbox
                        :model-value="roleHasPermission(role.id, permission.id)"
                        @update:model-value="togglePermission(role.id, permission.id)"
                        :disabled="saving"
                        hide-details
                        density="compact"
                        color="primary"
                      >
                        <template v-slot:label v-if="isInheritedPermission(role.id, permission.id) && showInheritedIndicator">
                          <v-icon size="x-small" color="info">mdi-link-variant</v-icon>
                        </template>
                      </v-checkbox>
                    </td>
                  </template>
                </template>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- Detailed View -->
        <div v-else class="matrix-detailed">
          <v-expansion-panels
            v-model="expandedCategories"
            multiple
            variant="accordion"
          >
            <v-expansion-panel
              v-for="category in permissionCategories"
              :key="category"
              :value="category"
            >
              <v-expansion-panel-title>
                <div class="d-flex align-center">
                  <v-icon size="small" class="mr-2">{{ getCategoryIcon(category) }}</v-icon>
                  <span class="text-h6">{{ formatCategoryName(category) }}</span>
                  <v-spacer></v-spacer>

                  <!-- Category Summary -->
                  <div class="text-caption text-medium-emphasis mr-4">
                    {{ (permissionsStore.permissionsByCategory[category] || []).length }} permissions
                  </div>
                </div>
              </v-expansion-panel-title>

              <v-expansion-panel-text>
                <v-table density="compact">
                  <thead>
                    <tr>
                      <th style="width: 40%">Permission</th>
                      <th v-for="role in filteredRoles" :key="role.id" class="text-center">
                        <v-chip
                          :color="getRoleColor(role)"
                          :variant="isSystemRole(role) ? 'flat' : 'outlined'"
                          size="small"
                        >
                          {{ role.name }}
                        </v-chip>

                        <!-- Category Toggle -->
                        <div class="mt-2">
                          <v-btn
                            size="x-small"
                            variant="text"
                            :disabled="saving"
                            @click="toggleCategoryForRole(role.id, category)"
                          >
                            <v-icon size="x-small">
                              {{ roleHasAllInCategory(role.id, category) ? 'mdi-checkbox-marked' :
                                 roleHasSomeInCategory(role.id, category) ? 'mdi-checkbox-intermediate' :
                                 'mdi-checkbox-blank-outline' }}
                            </v-icon>
                            All
                          </v-btn>
                        </div>

                        <!-- Permission Count -->
                        <div class="text-caption text-medium-emphasis">
                          {{ getRoleCategoryCount(role.id, category) }}/{{ (permissionsStore.permissionsByCategory[category] || []).length }}
                        </div>
                      </th>
                    </tr>
                  </thead>

                  <tbody>
                    <tr v-for="permission in (permissionsStore.permissionsByCategory[category] || [])" :key="permission.id">
                      <td>
                        <div class="d-flex align-center justify-space-between">
                          <div class="flex-grow-1">
                            <div class="font-weight-medium">{{ permission.name }}</div>
                            <div v-if="showDescriptions" class="text-caption text-medium-emphasis">
                              {{ permission.description }}
                            </div>
                          </div>
                          <PermissionGuard permissions="manage_permissions">
                            <v-btn
                              icon
                              size="x-small"
                              variant="text"
                              color="error"
                              @click="deletePermission(permission)"
                              :disabled="isSystemPermission(permission.id)"
                              :title="isSystemPermission(permission.id) ? 'Cannot delete system permission' : 'Delete permission'"
                            >
                              <v-icon size="x-small">mdi-delete</v-icon>
                            </v-btn>
                          </PermissionGuard>
                        </div>
                      </td>

                      <td v-for="role in filteredRoles" :key="`${role.id}-${permission.id}`" class="text-center">
                        <v-tooltip
                          v-if="isSystemRole(role)"
                          bottom
                        >
                          <template v-slot:activator="{ props }">
                            <div v-bind="props">
                              <v-checkbox
                                :model-value="roleHasPermission(role.id, permission.id)"
                                @update:model-value="togglePermission(role.id, permission.id)"
                                :disabled="saving"
                                hide-details
                                density="compact"
                                color="warning"
                              ></v-checkbox>
                            </div>
                          </template>
                          <span class="text-caption">System role - modify with caution</span>
                        </v-tooltip>
                        <v-checkbox
                          v-else
                          :model-value="roleHasPermission(role.id, permission.id)"
                          @update:model-value="togglePermission(role.id, permission.id)"
                          :disabled="saving"
                          hide-details
                          density="compact"
                          color="primary"
                        ></v-checkbox>
                      </td>
                    </tr>

                    <tr v-if="selectedRoles.length > 0" class="bulk-actions-row">
                      <td colspan="100%">
                        <div class="text-center">
                          <span class="text-caption font-weight-medium mr-4">Bulk Actions for Selected Roles:</span>
                          <template v-for="permission in (permissionsStore.permissionsByCategory[category] || [])" :key="`bulk-${permission.id}`">
                            <v-btn
                              size="x-small"
                              variant="text"
                              color="success"
                              @click="bulkGrantPermission(permission.id)"
                              :disabled="saving"
                              class="mr-1"
                            >
                              Grant {{ permission.name }}
                            </v-btn>
                          </template>
                        </div>
                      </td>
                    </tr>
                  </tbody>
                </v-table>
              </v-expansion-panel-text>
            </v-expansion-panel>
          </v-expansion-panels>
        </div>
      </div>
    </v-card>

    <!-- Snackbar for notifications -->
    <v-snackbar
      v-model="snackbar.show"
      :color="snackbar.color"
      :timeout="3000"
      bottom
      right
    >
      {{ snackbar.message }}
      <template v-slot:actions>
        <v-btn
          variant="text"
          @click="snackbar.show = false"
          size="small"
        >
          Close
        </v-btn>
      </template>
    </v-snackbar>

    <!-- Create Permission Dialog -->
    <v-dialog v-model="showCreatePermissionDialog" max-width="600" persistent>
      <v-card>
        <v-card-title class="text-h5 font-weight-bold">
          Create New Permission
        </v-card-title>

        <v-card-text class="pt-4">
          <v-alert
            type="warning"
            variant="tonal"
            class="mb-4"
            density="compact"
          >
            <v-alert-title class="text-body-2">Important</v-alert-title>
            New permissions must be added to role definitions and implemented in your application code to be functional.
          </v-alert>

          <v-expansion-panels class="mb-4">
            <v-expansion-panel>
              <v-expansion-panel-title class="text-caption">
                View System Permissions (cannot be deleted)
              </v-expansion-panel-title>
              <v-expansion-panel-text>
                <div class="text-caption">
                  <strong>Admin:</strong> access_admin, manage_users, view_users, manage_roles, manage_permissions, manage_settings, view_audit_logs<br>
                  <strong>Calendar:</strong> view_calendar, create_events, edit_events, delete_events<br>
                  <strong>Forums:</strong> view_forums, create_posts, edit_posts, delete_posts, moderate_posts<br>
                  <strong>Projects:</strong> view_projects, create_projects, edit_projects, delete_projects, manage_projects<br>
                  <strong>Analytics:</strong> view_analytics, edit_analytics
                </div>
              </v-expansion-panel-text>
            </v-expansion-panel>
          </v-expansion-panels>

          <v-text-field
            v-model="newPermissionForm.name"
            label="Permission Name"
            hint="e.g., Edit Reports"
            persistent-hint
            variant="outlined"
            density="compact"
            required
            @input="generatePermissionId"
            @blur="permissionFormTouched.name = true"
            :error-messages="permissionFormTouched.name && !newPermissionForm.name ? 'Name is required' : ''"
            class="mb-4"
          ></v-text-field>

          <v-text-field
            v-model="newPermissionForm.id"
            label="Permission ID"
            hint="e.g., edit_reports"
            persistent-hint
            variant="outlined"
            density="compact"
            required
            @blur="permissionFormTouched.id = true"
            :error-messages="
              permissionFormTouched.id && !newPermissionForm.id ? 'ID is required' :
              permissionFormTouched.id && newPermissionForm.id && !/^[a-z0-9_]+$/.test(newPermissionForm.id) ? 'ID must be lowercase letters, numbers, and underscores only' :
              ''
            "
            class="mb-4"
          ></v-text-field>

          <v-combobox
            v-model="newPermissionForm.category"
            :items="allCategories"
            :item-title="formatCategoryName"
            :item-value="item => item"
            label="Category"
            hint="Select existing or type new category"
            persistent-hint
            variant="outlined"
            density="compact"
            required
            @blur="permissionFormTouched.category = true"
            :error-messages="permissionFormTouched.category && !newPermissionForm.category ? 'Category is required' : ''"
            class="mb-4"
            @update:model-value="(value) => {
              // Format new categories
              if (value && !allCategories.value.includes(value)) {
                newPermissionForm.category = value.toLowerCase().replace(/\s+/g, '_').replace(/[^a-z0-9_]/g, '')
              }
            }"
          >
            <template v-slot:no-data>
              <v-list-item>
                <v-list-item-title>
                  Press enter to create new category
                </v-list-item-title>
              </v-list-item>
            </template>
          </v-combobox>

          <v-textarea
            v-model="newPermissionForm.description"
            label="Description"
            hint="Describe what this permission allows..."
            persistent-hint
            variant="outlined"
            density="compact"
            rows="2"
            no-resize
          ></v-textarea>
        </v-card-text>

        <v-divider></v-divider>

        <v-card-actions class="pa-4">
          <v-spacer></v-spacer>
          <v-btn
            variant="text"
            @click="() => {
              showCreatePermissionDialog = false
              newPermissionForm.value = {
                id: '',
                name: '',
                description: '',
                category: ''
              }
              permissionFormTouched.value = {
                name: false,
                id: false,
                category: false
              }
            }"
            :disabled="saving"
          >
            Cancel
          </v-btn>
          <v-btn
            color="primary"
            variant="elevated"
            @click="createPermission"
            :loading="saving"
            :disabled="!newPermissionForm.id || !newPermissionForm.name || !newPermissionForm.category"
          >
            Create Permission
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Create Category Dialog -->
    <v-dialog v-model="showCreateCategoryDialog" max-width="500" persistent>
      <v-card>
        <v-card-title class="text-h5 font-weight-bold">
          Create New Category
        </v-card-title>

        <v-card-text class="pt-4">
          <v-alert
            type="info"
            variant="tonal"
            class="mb-4"
            density="compact"
          >
            Categories organize permissions into logical groups. After creating a category, add permissions to it.
          </v-alert>

          <v-text-field
            v-model="newCategoryForm.name"
            label="Category Name"
            hint="e.g., Financial Management"
            persistent-hint
            variant="outlined"
            density="compact"
            required
            @input="generateCategoryId"
            @blur="categoryFormTouched.name = true"
            :error-messages="categoryFormTouched.name && !newCategoryForm.name ? 'Name is required' : ''"
            class="mb-4"
          ></v-text-field>

          <v-text-field
            v-model="newCategoryForm.id"
            label="Category ID"
            hint="e.g., financial_management"
            persistent-hint
            variant="outlined"
            density="compact"
            required
            @blur="categoryFormTouched.id = true"
            :error-messages="
              categoryFormTouched.id && !newCategoryForm.id ? 'ID is required' :
              categoryFormTouched.id && newCategoryForm.id && !/^[a-z0-9_]+$/.test(newCategoryForm.id) ? 'ID must be lowercase letters, numbers, and underscores only' :
              ''
            "
          ></v-text-field>
        </v-card-text>

        <v-divider></v-divider>

        <v-card-actions class="pa-4">
          <v-spacer></v-spacer>
          <v-btn
            variant="text"
            @click="() => {
              showCreateCategoryDialog = false
              newCategoryForm.value = { id: '', name: '' }
              categoryFormTouched.value = { name: false, id: false }
            }"
          >
            Cancel
          </v-btn>
          <v-btn
            color="primary"
            variant="elevated"
            @click="createCategory"
            :disabled="!newCategoryForm.id || !newCategoryForm.name"
          >
            Create Category
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- System Role Warning Dialog -->
    <v-dialog v-model="showSystemRoleWarning" max-width="500">
      <v-card>
        <v-card-title class="text-h6">
          <v-icon color="warning" class="mr-2">mdi-alert</v-icon>
          Modify System Role?
        </v-card-title>

        <v-card-text>
          <v-alert type="warning" variant="tonal" density="compact">
            You are about to modify a system role. This could affect core application functionality.
          </v-alert>

          <p class="mt-4">
            System roles have predefined permissions that ensure proper application operation.
            Modifying these permissions may cause unexpected behavior or security issues.
          </p>

          <p class="font-weight-medium mt-3">
            Are you sure you want to continue?
          </p>
        </v-card-text>

        <v-divider></v-divider>

        <v-card-actions class="pa-4">
          <v-spacer></v-spacer>
          <v-btn
            variant="text"
            @click="showSystemRoleWarning = false"
          >
            Cancel
          </v-btn>
          <v-btn
            color="warning"
            variant="elevated"
            @click="confirmSystemRoleEdit"
          >
            Continue
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Delete Permission Dialog -->
    <v-dialog v-model="showDeletePermissionDialog" max-width="500">
      <v-card>
        <v-card-title class="text-h6">
          <v-icon color="error" class="mr-2">mdi-delete-alert</v-icon>
          Delete Permission?
        </v-card-title>

        <v-card-text>
          <p>
            Are you sure you want to delete the permission
            <strong>"{{ permissionToDelete?.name }}"</strong>?
          </p>

          <v-alert type="warning" variant="tonal" density="compact" class="mt-3">
            This will remove the permission from all roles that currently have it assigned.
          </v-alert>

          <p class="text-caption text-medium-emphasis mt-3">
            This action cannot be undone.
          </p>
        </v-card-text>

        <v-divider></v-divider>

        <v-card-actions class="pa-4">
          <v-spacer></v-spacer>
          <v-btn
            variant="text"
            @click="showDeletePermissionDialog = false"
            :disabled="saving"
          >
            Cancel
          </v-btn>
          <v-btn
            color="error"
            variant="elevated"
            @click="confirmDeletePermission"
            :loading="saving"
          >
            Delete Permission
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </div>
</template>

<style scoped>
.permission-matrix-container {
  overflow: auto;
  max-height: calc(100vh - 300px);
  position: relative;
}

/* Compact Matrix Table Styles */
.permission-matrix-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 0.875rem;
}

.permission-matrix-table th,
.permission-matrix-table td {
  border: 1px solid rgba(0, 0, 0, 0.12);
  padding: 4px 8px;
  text-align: center;
}

/* Sticky Role Column */
.sticky-column {
  position: sticky;
  left: 0;
  background: white;
  z-index: 10;
  box-shadow: 2px 0 4px rgba(0, 0, 0, 0.1);
}

/* Headers */
.role-header {
  text-align: left !important;
  font-weight: 600;
  background: #f5f5f5;
  min-width: 200px;
}

.category-header {
  background: #e3f2fd;
  font-weight: 600;
  border-left: 2px solid #1976d2;
  user-select: none;
  transition: background-color 0.2s;
}

.category-header:hover {
  background: #bbdefb;
}

.permission-header.collapsed-category {
  background: #e3f2fd;
  cursor: pointer;
  position: relative;
}

.collapsed-header {
  position: relative;
}

.permission-hover-popup {
  position: absolute;
  top: 100%;
  left: 50%;
  transform: translateX(-50%);
  background: white;
  border: 1px solid rgba(0, 0, 0, 0.12);
  border-radius: 4px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
  z-index: 1000;
  min-width: 200px;
  max-width: 300px;
  margin-top: 4px;
}

.permission-hover-popup::before {
  content: '';
  position: absolute;
  top: -6px;
  left: 50%;
  transform: translateX(-50%);
  width: 0;
  height: 0;
  border-left: 6px solid transparent;
  border-right: 6px solid transparent;
  border-bottom: 6px solid white;
}

.popup-header {
  padding: 8px 12px;
  background: #f5f5f5;
  font-weight: 600;
  border-bottom: 1px solid rgba(0, 0, 0, 0.12);
  font-size: 0.875rem;
}

.popup-permissions {
  padding: 8px 0;
  max-height: 300px;
  overflow-y: auto;
}

.popup-permission {
  padding: 4px 12px;
  font-size: 0.75rem;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.popup-permission:hover {
  background: #f5f5f5;
}

.permission-cell.collapsed {
  background: #f5f5f5;
  cursor: pointer;
}

.permission-header {
  background: #f5f5f5;
  font-weight: 500;
  position: relative;
  max-width: 120px;
}

.permission-name {
  writing-mode: vertical-rl;
  text-orientation: mixed;
  max-height: 120px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  display: flex;
  align-items: center;
  justify-content: center;
}

.permission-name span {
  writing-mode: vertical-rl;
  text-orientation: mixed;
}

.permission-name .v-icon {
  writing-mode: initial;
  margin-top: 4px;
}

/* Cells */
.role-cell {
  text-align: left !important;
  background: white;
}

.permission-cell {
  background: white;
  transition: background-color 0.2s;
}

.permission-cell:hover:not(.read-only) {
  background: #f5f5f5;
}

.permission-cell.hovered {
  background: #e3f2fd !important;
}

.permission-cell.system-role {
  background: #fff3e0;
}

/* Detailed View Styles */
.matrix-detailed .v-expansion-panel-title {
  font-weight: 500;
}

.bulk-actions-row {
  background: #fffde7;
  border-top: 2px solid #f57f17;
}

/* Dark theme adjustments */
.v-theme--dark {
  .sticky-column {
    background: #121212;
  }

  .role-header,
  .permission-header {
    background: #1e1e1e;
  }

  .category-header {
    background: #1e3a5f;
  }

  .role-cell,
  .permission-cell {
    background: #121212;
  }

  .permission-cell:hover:not(.read-only) {
    background: #2e2e2e;
  }

  .permission-cell.hovered {
    background: #1e3a5f !important;
  }

  .permission-cell.system-role {
    background: #3e2723;
  }

  .bulk-actions-row {
    background: #3e2723;
  }

  .permission-hover-popup {
    background: #1e1e1e;
    border-color: rgba(255, 255, 255, 0.12);
  }

  .permission-hover-popup::before {
    border-bottom-color: #1e1e1e;
  }

  .popup-header {
    background: #2e2e2e;
    border-bottom-color: rgba(255, 255, 255, 0.12);
  }

  .popup-permission:hover {
    background: #2e2e2e;
  }
}

/* Responsive adjustments */
@media (max-width: 960px) {
  .permission-name {
    writing-mode: horizontal-tb;
    text-orientation: unset;
    max-height: unset;
    font-size: 0.75rem;
    flex-direction: row;
  }

  .permission-name span {
    writing-mode: horizontal-tb;
    text-orientation: unset;
  }

  .permission-name .v-icon {
    margin-top: 0;
    margin-left: 4px;
  }

  .permission-header {
    max-width: unset;
  }
}

/* Loading state */
.permission-matrix-table.loading {
  opacity: 0.6;
  pointer-events: none;
}

/* Tooltips */
.permission-header[title] {
  cursor: help;
}

/* Print styles */
@media print {
  .permission-matrix-container {
    max-height: unset;
    overflow: visible;
  }

  .sticky-column {
    position: static;
  }

  .v-toolbar,
  .v-btn,
  .v-checkbox__input {
    display: none !important;
  }

  .permission-cell {
    content: attr(data-checked);
  }
}
</style>