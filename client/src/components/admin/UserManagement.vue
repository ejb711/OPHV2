<!-- client/src/components/admin/UserManagement.vue - Fixed Delete User Functionality -->
<template>
  <div>
    <!-- Header with search and filters -->
    <v-row class="mb-4" align="center">
      <v-col cols="12" md="4">
        <v-text-field
          v-model="search"
          label="Search users..."
          prepend-inner-icon="mdi-magnify"
          variant="outlined"
          density="compact"
          clearable
          hide-details
        ></v-text-field>
      </v-col>
      
      <v-col cols="12" md="3">
        <v-select
          v-model="selectedRole"
          :items="[{ title: 'All Roles', value: 'all' }, ...availableRoles.map(r => ({ title: r.name, value: r.id }))]"
          label="Filter by role"
          variant="outlined"
          density="compact"
          hide-details
        ></v-select>
      </v-col>
      
      <v-col cols="12" md="3">
        <v-select
          v-model="selectedStatus"
          :items="[
            { title: 'All Status', value: 'all' },
            { title: 'Active', value: 'active' },
            { title: 'Pending', value: 'pending' },
            { title: 'Suspended', value: 'suspended' }
          ]"
          label="Filter by status"
          variant="outlined"
          density="compact"
          hide-details
        ></v-select>
      </v-col>
      
      <v-col cols="12" md="2">
        <PermissionGuard permission="create_users">
          <v-btn
            color="primary"
            variant="flat"
            prepend-icon="mdi-plus"
            @click="$emit('create-user')"
            block
          >
            Add User
          </v-btn>
        </PermissionGuard>
      </v-col>
    </v-row>

    <!-- Bulk actions -->
    <v-row v-if="selectedUsers.length > 0" class="mb-4">
      <v-col>
        <v-card variant="outlined" color="info">
          <v-card-text class="py-2">
            <v-row align="center">
              <v-col>
                <span class="text-subtitle-2">
                  {{ selectedUsers.length }} users selected
                </span>
              </v-col>
              <v-col cols="auto">
                <PermissionGuard permission="edit_users">
                  <v-btn
                    variant="outlined"
                    size="small"
                    @click="openBulkDialog"
                    prepend-icon="mdi-cog"
                  >
                    Bulk Actions
                  </v-btn>
                </PermissionGuard>
              </v-col>
            </v-row>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>

    <!-- Users table -->
    <v-data-table
      v-model="selectedUsers"
      :headers="headers"
      :items="filteredUsers"
      :loading="loading"
      item-key="id"
      show-select
      :items-per-page="25"
      :sort-by="[{ key: 'createdAt', order: 'desc' }]"
    >
      <!-- Email column with avatar -->
      <template v-slot:item.email="{ item }">
        <div class="d-flex align-center">
          <v-avatar size="32" class="mr-3">
            <v-img 
              v-if="item.photoURL" 
              :src="item.photoURL"
              :alt="item.email"
            ></v-img>
            <v-icon v-else>mdi-account</v-icon>
          </v-avatar>
          <div>
            <div class="font-weight-medium">{{ item.email }}</div>
            <div v-if="item.displayName" class="text-caption text-medium-emphasis">
              {{ item.displayName }}
            </div>
          </div>
        </div>
      </template>

      <!-- Role column with chip -->
      <template v-slot:item.role="{ item }">
        <v-chip
          :color="getRoleColor(item.role)"
          size="small"
          variant="flat"
        >
          {{ getRoleName(item.role) }}
        </v-chip>
      </template>

      <!-- Status column with chip -->
      <template v-slot:item.status="{ item }">
        <v-chip
          :color="getStatusColor(item.status)"
          size="small"
          variant="flat"
        >
          {{ item.status || 'active' }}
        </v-chip>
      </template>

      <!-- Created date column -->
      <template v-slot:item.createdAt="{ item }">
        <span class="text-caption">
          {{ formatDate(item.createdAt) }}
        </span>
      </template>

      <!-- Last active column -->
      <template v-slot:item.lastActive="{ item }">
        <span class="text-caption">
          {{ item.lastActive ? formatDate(item.lastActive) : 'Never' }}
        </span>
      </template>

      <!-- Custom permissions count -->
      <template v-slot:item.customPermCount="{ item }">
        <v-chip
          v-if="item.customPermCount > 0"
          size="small"
          variant="outlined"
          color="info"
        >
          +{{ item.customPermCount }}
        </v-chip>
        <span v-else class="text-medium-emphasis">—</span>
      </template>

      <!-- Actions column -->
      <template v-slot:item.actions="{ item }">
        <div class="d-flex ga-1">
          <PermissionGuard permission="edit_users">
            <v-tooltip text="Edit User" location="top">
              <template v-slot:activator="{ props }">
                <v-btn
                  v-bind="props"
                  icon
                  size="small"
                  variant="flat"
                  color="primary"
                  @click="editUser(item)"
                  :disabled="!canEditUser(item)"
                  density="comfortable"
                >
                  <v-icon size="small">mdi-pencil</v-icon>
                </v-btn>
              </template>
            </v-tooltip>
          </PermissionGuard>

          <PermissionGuard permission="delete_users">
            <v-tooltip text="Delete User" location="top">
              <template v-slot:activator="{ props }">
                <v-btn
                  v-bind="props"
                  icon
                  size="small"
                  variant="flat"
                  color="error"
                  @click="confirmDeleteUser(item)"
                  :disabled="item.id === auth.currentUser.uid"
                  density="comfortable"
                >
                  <v-icon size="small">mdi-delete</v-icon>
                </v-btn>
              </template>
            </v-tooltip>
          </PermissionGuard>
        </div>
      </template>
    </v-data-table>

    <!-- Edit User Dialog -->
    <v-dialog v-model="showEditDialog" max-width="800" persistent>
      <v-card>
        <v-card-title class="text-h5">
          Edit User: {{ editingUser?.email }}
        </v-card-title>

        <v-card-text>
          <v-row>
            <v-col cols="12" md="6">
              <v-select
                v-model="editForm.role"
                :items="availableRoles.filter(r => authStore.canManageRole(r.id))"
                item-title="name"
                item-value="id"
                label="Role"
                variant="outlined"
                :disabled="!authStore.canManageRole(editingUser?.role)"
              ></v-select>
            </v-col>

            <v-col cols="12" md="6">
              <v-select
                v-model="editForm.status"
                :items="[
                  { title: 'Active', value: 'active' },
                  { title: 'Suspended', value: 'suspended' },
                  { title: 'Pending', value: 'pending' }
                ]"
                label="Status"
                variant="outlined"
              ></v-select>
            </v-col>

            <v-col cols="12">
              <v-textarea
                v-model="editForm.notes"
                label="Notes"
                variant="outlined"
                rows="3"
              ></v-textarea>
            </v-col>

            <v-col cols="12" v-if="allPermissions.length > 0">
              <v-expansion-panels variant="accordion">
                <v-expansion-panel title="Custom Permissions">
                  <v-expansion-panel-text>
                    <v-row>
                      <v-col cols="12" md="6">
                        <v-autocomplete
                          :items="allPermissions"
                          item-title="name"
                          item-value="id"
                          label="Add Custom Permission"
                          variant="outlined"
                          @update:model-value="addCustomPermission"
                          clearable
                        ></v-autocomplete>
                        
                        <div v-if="editForm.customPermissions.length > 0" class="mt-2">
                          <v-chip
                            v-for="permission in editForm.customPermissions"
                            :key="permission"
                            size="small"
                            closable
                            @click:close="removeCustomPermission(permission)"
                            class="mr-1 mb-1"
                          >
                            {{ getPermissionName(permission) }}
                          </v-chip>
                        </div>
                      </v-col>

                      <v-col cols="12" md="6">
                        <v-autocomplete
                          :items="allPermissions"
                          item-title="name"
                          item-value="id"
                          label="Deny Permission"
                          variant="outlined"
                          @update:model-value="addDeniedPermission"
                          clearable
                        ></v-autocomplete>
                        
                        <div v-if="editForm.deniedPermissions.length > 0" class="mt-2">
                          <v-chip
                            v-for="permission in editForm.deniedPermissions"
                            :key="permission"
                            size="small"
                            color="error"
                            closable
                            @click:close="removeDeniedPermission(permission)"
                            class="mr-1 mb-1"
                          >
                            {{ getPermissionName(permission) }}
                          </v-chip>
                        </div>
                      </v-col>
                    </v-row>
                  </v-expansion-panel-text>
                </v-expansion-panel>
              </v-expansion-panels>
            </v-col>
          </v-row>
        </v-card-text>

        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn
            variant="text"
            @click="showEditDialog = false"
          >
            Cancel
          </v-btn>
          <v-btn
            color="primary"
            variant="flat"
            @click="saveUser"
            :loading="saving"
          >
            Save Changes
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Bulk Operations Dialog -->
    <v-dialog v-model="showBulkDialog" max-width="600">
      <v-card>
        <v-card-title>
          Bulk Operations
          <v-chip size="small" class="ml-2">
            {{ selectedUsers.length }} users selected
          </v-chip>
        </v-card-title>

        <v-card-text>
          <v-select
            v-model="bulkOperation.action"
            :items="[
              { title: 'Change Role', value: 'changeRole' },
              { title: 'Add Permissions', value: 'addPermissions' },
              { title: 'Suspend Users', value: 'suspend' },
              { title: 'Activate Users', value: 'activate' }
            ]"
            label="Select operation"
            variant="outlined"
          ></v-select>

          <v-select
            v-if="bulkOperation.action === 'changeRole'"
            v-model="bulkOperation.role"
            :items="availableRoles.filter(r => authStore.canManageRole(r.id))"
            item-title="name"
            item-value="id"
            label="New Role"
            variant="outlined"
          ></v-select>

          <v-select
            v-if="bulkOperation.action === 'addPermissions'"
            v-model="bulkOperation.permissions"
            :items="allPermissions"
            item-title="name"
            item-value="id"
            label="Permissions to add"
            variant="outlined"
            multiple
            chips
            closable-chips
          ></v-select>
        </v-card-text>

        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn
            variant="text"
            @click="showBulkDialog = false"
          >
            Cancel
          </v-btn>
          <v-btn
            color="primary"
            variant="flat"
            @click="executeBulkOperation"
            :loading="saving"
          >
            Execute
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Delete Confirmation Dialog -->
    <v-dialog v-model="showDeleteDialog" max-width="500">
      <v-card>
        <v-card-title class="text-h5">Delete User?</v-card-title>
        <v-card-text>
          Are you sure you want to delete <strong>{{ userToDelete?.email }}</strong>? 
          This action cannot be undone.
          
          <v-alert type="warning" variant="tonal" class="mt-4">
            This will permanently delete the user account and all associated data.
          </v-alert>
          
          <v-text-field
            v-model="deleteReason"
            label="Reason for deletion (optional)"
            variant="outlined"
            class="mt-4"
          ></v-text-field>
        </v-card-text>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn variant="text" @click="showDeleteDialog = false">
            Cancel
          </v-btn>
          <v-btn
            color="error"
            variant="flat"
            @click="deleteUser"
            :loading="saving"
          >
            Delete User
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Snackbar for notifications -->
    <v-snackbar
      v-model="snackbar.show"
      :color="snackbar.color"
      :timeout="4000"
    >
      {{ snackbar.message }}
      <template v-slot:actions>
        <v-btn
          variant="text"
          @click="snackbar.show = false"
        >
          Close
        </v-btn>
      </template>
    </v-snackbar>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted, watch } from 'vue'
import { 
  collection, 
  doc, 
  updateDoc, 
  onSnapshot,
  query,
  orderBy,
  serverTimestamp,
  addDoc,
  where
} from 'firebase/firestore'
import { db, auth, functions } from '../../firebase'
import { httpsCallable } from 'firebase/functions'
import { useAuthStore } from '../../stores/auth'
import { usePermissionsStore } from '../../stores/permissions'
import PermissionGuard from '../PermissionGuard.vue'

// Fixed: Added 'create-user' to the defineEmits array
const emit = defineEmits(['activity', 'create-user'])

const authStore = useAuthStore()
const permissionsStore = usePermissionsStore()

/* ---------- state ---------- */
const users = ref([])
const loading = ref(true)
const saving = ref(false)
const search = ref('')
const selectedRole = ref('all')
const selectedStatus = ref('all')
const selectedUsers = ref([])
const showEditDialog = ref(false)
const showBulkDialog = ref(false)
const showDeleteDialog = ref(false)
const editingUser = ref(null)
const userToDelete = ref(null)
const deleteReason = ref('')
const snackbar = ref({
  show: false,
  message: '',
  color: 'success'
})

// Edit form state
const editForm = ref({
  role: '',
  customPermissions: [],
  deniedPermissions: [],
  status: 'active',
  notes: ''
})

// Bulk operation state
const bulkOperation = ref({
  action: '',
  role: '',
  permissions: []
})

// Real-time listener
let unsubscribe = null

/* ---------- computed ---------- */
const headers = computed(() => [
  { title: 'Email', key: 'email', sortable: true },
  { title: 'Role', key: 'role', sortable: true },
  { title: 'Status', key: 'status', sortable: true },
  { title: 'Created', key: 'createdAt', sortable: true },
  { title: 'Last Active', key: 'lastActive', sortable: true },
  { title: 'Custom Perms', key: 'customPermCount', sortable: false },
  { title: 'Actions', key: 'actions', sortable: false, align: 'end' }
])

const filteredUsers = computed(() => {
  let filtered = users.value

  // Search filter
  if (search.value) {
    const searchLower = search.value.toLowerCase()
    filtered = filtered.filter(user => 
      user.email.toLowerCase().includes(searchLower) ||
      user.role.toLowerCase().includes(searchLower)
    )
  }

  // Role filter
  if (selectedRole.value !== 'all') {
    filtered = filtered.filter(user => user.role === selectedRole.value)
  }

  // Status filter
  if (selectedStatus.value !== 'all') {
    filtered = filtered.filter(user => user.status === selectedStatus.value)
  }

  return filtered
})

const availableRoles = computed(() => permissionsStore.allRoles)
const allPermissions = computed(() => permissionsStore.allPermissions)

const canEditUser = computed(() => (user) => {
  return authStore.canManageRole(user.role) && authStore.hasPermission('edit_users')
})

/* ---------- lifecycle ---------- */
onMounted(() => {
  loadUsers()
})

onUnmounted(() => {
  if (unsubscribe) {
    unsubscribe()
  }
})

/* ---------- watchers ---------- */
watch(() => authStore.user, (newUser) => {
  if (newUser && !unsubscribe) {
    loadUsers()
  }
}, { immediate: true })

/* ---------- methods ---------- */
function showSnackbar(message, color = 'success') {
  snackbar.value = {
    show: true,
    message,
    color
  }
}

function formatDate(date) {
  if (!date) return 'N/A'
  const d = date.toDate ? date.toDate() : new Date(date)
  return d.toLocaleDateString() + ' ' + d.toLocaleTimeString([], { 
    hour: '2-digit', 
    minute: '2-digit' 
  })
}

function getRoleColor(role) {
  const colors = {
    owner: 'purple',
    admin: 'red',
    user: 'blue',
    viewer: 'green',
    pending: 'orange'
  }
  return colors[role] || 'grey'
}

function getRoleName(roleId) {
  const role = availableRoles.value.find(r => r.id === roleId)
  return role ? role.name : roleId
}

function getStatusColor(status) {
  const colors = {
    active: 'success',
    pending: 'warning',
    suspended: 'error'
  }
  return colors[status] || 'grey'
}

function getPermissionName(permissionId) {
  const permission = allPermissions.value.find(p => p.id === permissionId)
  return permission ? permission.name : permissionId
}

async function loadUsers() {
  if (!authStore.user) return
  
  loading.value = true
  try {
    // Create query that excludes deleted users
    const usersQuery = query(
      collection(db, 'users'),
      where('status', '!=', 'deleted'),  // Exclude deleted users
      orderBy('status'),  // Required for != query
      orderBy('createdAt', 'desc')
    )
    
    unsubscribe = onSnapshot(usersQuery, (snapshot) => {
      users.value = snapshot.docs.map(doc => {
        const data = doc.data()
        return {
          id: doc.id,
          ...data,
          customPermCount: (data.customPermissions || []).length,
          createdAt: data.createdAt?.toDate?.() || data.createdAt,
          lastActive: data.lastActive?.toDate?.() || data.lastActive
        }
      })
      
      // Ensure current user is listed correctly regardless of role
      const currentUserIndex = users.value.findIndex(u => u.id === auth.currentUser?.uid)
      if (currentUserIndex === -1 && auth.currentUser) {
        // Add current user if not found
        users.value.unshift({
          id: auth.currentUser.uid,
          email: auth.currentUser.email,
          role: authStore.role || 'pending',
          status: authStore.status || (authStore.role === 'pending' ? 'pending' : 'active'),
          customPermCount: (authStore.customPermissions || []).length,
          createdAt: new Date(),
          lastActive: new Date()
        })
      }
    })
    
  } catch (e) {
    console.error('Error loading users:', e)
    showSnackbar('Failed to load users', 'error')
  } finally {
    loading.value = false
  }
}

/* ---------- user management ---------- */
function editUser(user) {
  if (!canEditUser.value(user)) {
    showSnackbar('You do not have permission to edit this user', 'error')
    return
  }

  editingUser.value = user
  editForm.value = {
    role: user.role,
    customPermissions: [...(user.customPermissions || [])],
    deniedPermissions: [...(user.deniedPermissions || [])],
    status: user.status || 'active',
    notes: user.notes || ''
  }
  showEditDialog.value = true
}

async function saveUser() {
  if (!editingUser.value) return
  
  saving.value = true
  try {
    const updates = {
      role: editForm.value.role,
      customPermissions: editForm.value.customPermissions,
      deniedPermissions: editForm.value.deniedPermissions,
      status: editForm.value.status,
      notes: editForm.value.notes,
      updatedAt: serverTimestamp(),
      updatedBy: auth.currentUser.uid
    }

    await updateDoc(doc(db, 'users', editingUser.value.id), updates)

    // Log activity
    emit('activity', 'user_updated', {
      userId: editingUser.value.id,
      email: editingUser.value.email,
      changes: {
        role: { from: editingUser.value.role, to: editForm.value.role },
        status: { from: editingUser.value.status, to: editForm.value.status }
      }
    })

    showSnackbar('User updated successfully')
    showEditDialog.value = false
  } catch (e) {
    console.error('Error saving user:', e)
    showSnackbar('Failed to update user', 'error')
  } finally {
    saving.value = false
  }
}

function confirmDeleteUser(user) {
  if (!authStore.hasPermission('delete_users')) {
    showSnackbar('You do not have permission to delete users', 'error')
    return
  }

  if (user.id === auth.currentUser.uid) {
    showSnackbar('You cannot delete your own account', 'error')
    return
  }

  userToDelete.value = user
  deleteReason.value = ''
  showDeleteDialog.value = true
}

async function deleteUser() {
  if (!userToDelete.value) return

  saving.value = true
  try {
    // Use Cloud Function for secure deletion
    const deleteUserFunction = httpsCallable(functions, 'deleteUser')
    
    const result = await deleteUserFunction({
      userId: userToDelete.value.id,
      reason: deleteReason.value || 'Administrative action'
    })

    // Log activity
    emit('activity', 'user_deleted', {
      userId: userToDelete.value.id,
      email: userToDelete.value.email,
      reason: deleteReason.value || 'Administrative action'
    })

    showSnackbar('User deleted successfully')
    showDeleteDialog.value = false
    
    // Users will be automatically removed from the list via real-time listener
    
  } catch (e) {
    console.error('Error deleting user:', e)
    let errorMessage = 'Failed to delete user'
    
    // Handle specific Cloud Function errors
    if (e.code === 'functions/permission-denied') {
      errorMessage = 'You do not have permission to delete this user'
    } else if (e.code === 'functions/not-found') {
      errorMessage = 'User not found'
    } else if (e.code === 'functions/invalid-argument') {
      errorMessage = e.message || 'Invalid request'
    } else if (e.message) {
      errorMessage = e.message
    }
    
    showSnackbar(errorMessage, 'error')
  } finally {
    saving.value = false
  }
}

/* ---------- bulk operations ---------- */
function openBulkDialog() {
  if (selectedUsers.value.length === 0) {
    showSnackbar('Please select users first', 'warning')
    return
  }
  showBulkDialog.value = true
}

async function executeBulkOperation() {
  saving.value = true
  try {
    const updates = {}
    
    switch (bulkOperation.value.action) {
      case 'changeRole':
        updates.role = bulkOperation.value.role
        break
      case 'addPermissions':
        // Will be handled per user below
        break
      case 'suspend':
        updates.status = 'suspended'
        break
      case 'activate':
        updates.status = 'active'
        break
    }

    // Update each selected user
    for (const userId of selectedUsers.value) {
      const user = users.value.find(u => u.id === userId)
      if (!canEditUser.value(user)) continue

      const userUpdates = { ...updates, updatedAt: serverTimestamp() }
      
      if (bulkOperation.value.action === 'addPermissions') {
        const currentPerms = user.customPermissions || []
        userUpdates.customPermissions = [
          ...new Set([...currentPerms, ...bulkOperation.value.permissions])
        ]
      }

      await updateDoc(doc(db, 'users', userId), userUpdates)
    }

    emit('activity', 'bulk_operation', {
      action: bulkOperation.value.action,
      userCount: selectedUsers.value.length,
      details: bulkOperation.value
    })

    showSnackbar(`Bulk operation completed for ${selectedUsers.value.length} users`)
    showBulkDialog.value = false
    selectedUsers.value = []
  } catch (e) {
    console.error('Error in bulk operation:', e)
    showSnackbar('Bulk operation failed', 'error')
  } finally {
    saving.value = false
  }
}

/* ---------- permission management ---------- */
function addCustomPermission(permission) {
  if (permission && !editForm.value.customPermissions.includes(permission)) {
    editForm.value.customPermissions.push(permission)
  }
}

function removeCustomPermission(permission) {
  const index = editForm.value.customPermissions.indexOf(permission)
  if (index > -1) {
    editForm.value.customPermissions.splice(index, 1)
  }
}

function addDeniedPermission(permission) {
  if (permission && !editForm.value.deniedPermissions.includes(permission)) {
    editForm.value.deniedPermissions.push(permission)
  }
}

function removeDeniedPermission(permission) {
  const index = editForm.value.deniedPermissions.indexOf(permission)
  if (index > -1) {
    editForm.value.deniedPermissions.splice(index, 1)
  }
}
</script>

<style scoped>
.v-data-table {
  background: transparent;
}

.v-chip {
  font-weight: 500;
}
</style>