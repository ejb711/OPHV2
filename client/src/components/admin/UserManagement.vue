<!-- client/src/components/admin/UserManagement.vue -->
<template>
  <div class="user-management">
    <!-- Action Bar -->
    <v-toolbar flat class="mb-4">
      <v-toolbar-title class="text-h5 font-weight-bold">
        <v-icon class="mr-2">mdi-account-group</v-icon>
        User Management
      </v-toolbar-title>
      
      <v-spacer />
      
      <PermissionGuard permission="create_users">
        <v-btn
          color="primary"
          prepend-icon="mdi-account-plus"
          @click="showCreateDialog = true"
        >
          Add User
        </v-btn>
      </PermissionGuard>
    </v-toolbar>

    <!-- Filters and Search -->
    <v-card class="mb-4" variant="outlined">
      <v-card-text>
        <v-row>
          <v-col cols="12" md="4">
            <v-text-field
              v-model="search"
              prepend-inner-icon="mdi-magnify"
              label="Search users..."
              variant="outlined"
              density="compact"
              hide-details
              clearable
            />
          </v-col>
          
          <v-col cols="12" md="3">
            <v-select
              v-model="filterRole"
              :items="roleFilterOptions"
              item-title="name"
              item-value="id"
              label="Filter by Role"
              variant="outlined"
              density="compact"
              hide-details
              clearable
            />
          </v-col>
          
          <v-col cols="12" md="3">
            <v-select
              v-model="filterStatus"
              :items="statusFilterOptions"
              item-title="name"
              item-value="id"
              label="Filter by Status"
              variant="outlined"
              density="compact"
              hide-details
              clearable
            />
          </v-col>
          
          <v-col cols="12" md="2">
            <v-btn
              variant="outlined"
              block
              @click="refresh"
              :loading="loading"
            >
              <v-icon>mdi-refresh</v-icon>
              Refresh
            </v-btn>
          </v-col>
        </v-row>
      </v-card-text>
    </v-card>

    <!-- User Table -->
    <UserTable
      :users="filteredUsers"
      :loading="loading"
      :search="search"
      @edit="handleEditUser"
      @delete="handleDeleteUser"
      @reset-password="handleResetPassword"
      @update-role="handleUpdateRole"
      @toggle-status="handleToggleStatus"
    />

    <!-- Create User Dialog -->
    <CreateUserDialog
      v-model="showCreateDialog"
      @user-created="handleUserCreated"
    />

    <!-- Edit User Dialog -->
    <v-dialog v-model="showEditDialog" max-width="600" persistent>
      <v-card>
        <v-card-title class="text-h5">
          Edit User: {{ editingUser?.email }}
        </v-card-title>
        
        <v-card-text>
          <v-form ref="editFormRef" v-model="editFormValid">
            <v-row>
              <v-col cols="12">
                <v-select
                  v-model="editForm.role"
                  :items="getAvailableRoles(editingUser)"
                  item-title="name"
                  item-value="id"
                  label="Role"
                  variant="outlined"
                  :rules="[v => !!v || 'Role is required']"
                >
                  <template v-slot:selection="{ item }">
                    <RoleChip :role="item.value" size="small" />
                  </template>
                  <template v-slot:item="{ item, props }">
                    <v-list-item v-bind="props">
                      <template v-slot:prepend>
                        <RoleChip :role="item.value" size="small" />
                      </template>
                    </v-list-item>
                  </template>
                </v-select>
              </v-col>
              
              <v-col cols="12">
                <v-select
                  v-model="editForm.customPermissions"
                  :items="availablePermissions"
                  item-title="name"
                  item-value="id"
                  label="Custom Permissions"
                  variant="outlined"
                  multiple
                  chips
                  closable-chips
                />
              </v-col>
              
              <v-col cols="12">
                <v-select
                  v-model="editForm.deniedPermissions"
                  :items="availablePermissions"
                  item-title="name"
                  item-value="id"
                  label="Denied Permissions"
                  variant="outlined"
                  multiple
                  chips
                  closable-chips
                />
              </v-col>
            </v-row>
          </v-form>
        </v-card-text>
        
        <v-card-actions>
          <v-spacer />
          <v-btn
            variant="text"
            @click="cancelEdit"
            :disabled="saving"
          >
            Cancel
          </v-btn>
          <v-btn
            color="primary"
            variant="flat"
            @click="saveUserEdit"
            :loading="saving"
            :disabled="!editFormValid"
          >
            Save Changes
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Delete Confirmation Dialog -->
    <v-dialog v-model="showDeleteDialog" max-width="500">
      <v-card>
        <v-card-title class="text-h5">
          Delete User?
        </v-card-title>
        
        <v-card-text>
          Are you sure you want to delete the user "{{ userToDelete?.email }}"? 
          This action cannot be undone.
        </v-card-text>
        
        <v-card-actions>
          <v-spacer />
          <v-btn
            variant="text"
            @click="showDeleteDialog = false"
            :disabled="saving"
          >
            Cancel
          </v-btn>
          <v-btn
            color="error"
            variant="flat"
            @click="confirmDelete"
            :loading="saving"
          >
            Delete User
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { usePermissionsStore } from '@/stores/permissions'
import { useAudit } from '@/composables/useAudit'
import UserTable from './user-management/UserTable.vue'
import CreateUserDialog from './CreateUserDialog.vue'
import RoleChip from './RoleChip.vue'
import PermissionGuard from '@/components/PermissionGuard.vue'

// Composables
const router = useRouter()
const authStore = useAuthStore()
const permissionsStore = usePermissionsStore()
const { logActivity } = useAudit()

// Reactive state
const loading = ref(false)
const search = ref('')
const filterRole = ref(null)
const filterStatus = ref(null)

// Dialog states
const showCreateDialog = ref(false)
const showEditDialog = ref(false)
const showDeleteDialog = ref(false)

// Edit form
const editingUser = ref(null)
const editForm = ref({
  role: '',
  customPermissions: [],
  deniedPermissions: []
})
const editFormValid = ref(false)
const editFormRef = ref(null)
const userToDelete = ref(null)
const saving = ref(false)

// Computed properties
const filteredUsers = computed(() => {
  let users = permissionsStore.allUsers || []
  
  // Apply role filter
  if (filterRole.value) {
    users = users.filter(user => user.role === filterRole.value)
  }
  
  // Apply status filter
  if (filterStatus.value) {
    users = users.filter(user => (user.status || 'active') === filterStatus.value)
  }
  
  return users
})

const roleFilterOptions = computed(() => {
  const roles = permissionsStore.allRoles || []
  return [
    { id: '', name: 'All Roles' },
    ...roles.map(role => ({ id: role.id, name: role.name }))
  ]
})

const statusFilterOptions = computed(() => [
  { id: '', name: 'All Status' },
  { id: 'active', name: 'Active' },
  { id: 'pending', name: 'Pending' },
  { id: 'inactive', name: 'Inactive' },
  { id: 'suspended', name: 'Suspended' }
])

const availablePermissions = computed(() => {
  return permissionsStore.allPermissions || []
})

// Methods
const getAvailableRoles = (user) => {
  const roles = permissionsStore.allRoles || []
  
  if (authStore.role === 'owner') {
    return roles
  }
  
  // Non-owners cannot assign owner role
  return roles.filter(role => role.id !== 'owner')
}

const refresh = async () => {
  loading.value = true
  try {
    await permissionsStore.loadAllData()
  } catch (error) {
    console.error('Error refreshing data:', error)
  } finally {
    loading.value = false
  }
}

const handleEditUser = (user) => {
  // Navigate to profile edit view for full profile editing
  router.push(`/admin/users/${user.id}/edit`)
}

const handleUpdateRole = async (user, newRole) => {
  if (user.role === newRole) return
  
  try {
    saving.value = true
    const result = await permissionsStore.updateUserRole(user.id, newRole)
    
    if (result.success) {
      // Update local state
      const userIndex = permissionsStore.allUsers.findIndex(u => u.id === user.id)
      if (userIndex !== -1) {
        permissionsStore.allUsers[userIndex].role = newRole
      }
      
      // Log activity
      await logEvent('role_changed', {
        targetUserId: user.id,
        targetUserEmail: user.email,
        oldRole: user.role,
        newRole: newRole
      })
      
      showSnackbar(`Updated ${user.email} role to ${newRole}`, 'success')
    } else {
      throw new Error(result.error || 'Failed to update role')
    }
  } catch (error) {
    console.error('Error updating user role:', error)
    showSnackbar(error.message || 'Failed to update user role', 'error')
  } finally {
    saving.value = false
  }
}

const handleToggleStatus = async (user) => {
  const newStatus = user.status === 'active' ? 'inactive' : 'active'
  
  try {
    saving.value = true
    // Implement status toggle logic here
    showSnackbar(`User ${user.email} ${newStatus}`, 'success')
  } catch (error) {
    console.error('Error toggling user status:', error)
    showSnackbar('Failed to toggle user status', 'error')
  } finally {
    saving.value = false
  }
}

const handleDeleteUser = (user) => {
  userToDelete.value = user
  showDeleteDialog.value = true
}

const confirmDelete = async () => {
  if (!userToDelete.value) return
  
  try {
    saving.value = true
    // Implement user deletion logic here
    await logEvent('user_deleted', {
      targetUserId: userToDelete.value.id,
      targetUserEmail: userToDelete.value.email
    })
    
    showSnackbar(`User ${userToDelete.value.email} deleted`, 'success')
    showDeleteDialog.value = false
    userToDelete.value = null
    await refresh()
  } catch (error) {
    console.error('Error deleting user:', error)
    showSnackbar('Failed to delete user', 'error')
  } finally {
    saving.value = false
  }
}

const handleResetPassword = async (user) => {
  try {
    // Implement password reset logic here
    showSnackbar(`Password reset email sent to ${user.email}`, 'success')
  } catch (error) {
    console.error('Error resetting password:', error)
    showSnackbar('Failed to send password reset email', 'error')
  }
}

const handleUserCreated = async () => {
  showCreateDialog.value = false
  await refresh()
  showSnackbar('User created successfully', 'success')
}

const cancelEdit = () => {
  showEditDialog.value = false
  editingUser.value = null
  editForm.value = {
    role: '',
    customPermissions: [],
    deniedPermissions: []
  }
}

const saveUserEdit = async () => {
  if (!editFormRef.value.validate() || !editingUser.value) return
  
  try {
    saving.value = true
    
    // Update role if changed
    if (editForm.value.role !== editingUser.value.role) {
      await handleUpdateRole(editingUser.value, editForm.value.role)
    }
    
    // Update custom permissions
    const result = await permissionsStore.updateUserCustomPermissions(
      editingUser.value.id,
      editForm.value.customPermissions,
      editForm.value.deniedPermissions
    )
    
    if (result.success) {
      await logEvent('user_updated', {
        targetUserId: editingUser.value.id,
        targetUserEmail: editingUser.value.email,
        customPermissions: editForm.value.customPermissions,
        deniedPermissions: editForm.value.deniedPermissions
      })
      
      showSnackbar('User updated successfully', 'success')
      cancelEdit()
      await refresh()
    } else {
      throw new Error(result.error || 'Failed to update user')
    }
  } catch (error) {
    console.error('Error updating user:', error)
    showSnackbar(error.message || 'Failed to update user', 'error')
  } finally {
    saving.value = false
  }
}

// Utility function for notifications
const showSnackbar = (message, type = 'info') => {
  // Emit to parent or use a global notification system
  console.log(`[${type}] ${message}`)
}

// Lifecycle
onMounted(async () => {
  loading.value = true
  try {
    await permissionsStore.loadAllData()
  } catch (error) {
    console.error('Error loading initial data:', error)
    showSnackbar('Error loading user data', 'error')
  } finally {
    loading.value = false
  }
})
</script>

<style scoped>
.user-management {
  padding: 16px;
}

:deep(.v-toolbar-title) {
  color: rgb(var(--v-theme-primary));
}
</style>