<!-- client/src/components/admin/UserManagement.vue -->
<script setup>
import { ref, computed, onMounted, onUnmounted, watch } from 'vue'
import { 
  collection, 
  doc, 
  updateDoc, 
  deleteDoc, 
  onSnapshot,
  query,
  orderBy,
  serverTimestamp,
  addDoc
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
  if (authStore.isOwner) return true
  if (authStore.isAdmin && !authStore.isOwner) {
    // Admin can't edit owners
    return user.role !== 'owner'
  }
  return false
})

/* ---------- color mappings ---------- */
const roleColors = {
  owner: 'deep-purple',
  admin: 'red',
  user: 'primary',
  viewer: 'blue',
  pending: 'orange'
}

const statusColors = {
  active: 'success',
  suspended: 'error',
  pending: 'warning'
}

/* ---------- lifecycle ---------- */
onMounted(async () => {
  await loadUsers()
})

onUnmounted(() => {
  if (unsubscribe) unsubscribe()
})

/* ---------- data loading ---------- */
async function loadUsers() {
  loading.value = true
  try {
    const usersRef = collection(db, 'users')
    const q = query(usersRef, orderBy('createdAt', 'desc'))
    
    unsubscribe = onSnapshot(q, (snapshot) => {
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
  showDeleteDialog.value = true
}

async function deleteUser() {
  if (!userToDelete.value) return

  saving.value = true
  try {
    // In production, you'd want to use a Cloud Function to properly delete the user
    // For now, we'll just mark them as deleted
    await updateDoc(doc(db, 'users', userToDelete.value.id), {
      status: 'deleted',
      deletedAt: serverTimestamp(),
      deletedBy: auth.currentUser.uid
    })

    emit('activity', 'user_deleted', {
      userId: userToDelete.value.id,
      email: userToDelete.value.email
    })

    showSnackbar('User deleted successfully')
    showDeleteDialog.value = false
  } catch (e) {
    console.error('Error deleting user:', e)
    showSnackbar('Failed to delete user', 'error')
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
  if (!editForm.value.customPermissions.includes(permission)) {
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
  if (!editForm.value.deniedPermissions.includes(permission)) {
    editForm.value.deniedPermissions.push(permission)
    // Remove from custom if present
    removeCustomPermission(permission)
  }
}

function removeDeniedPermission(permission) {
  const index = editForm.value.deniedPermissions.indexOf(permission)
  if (index > -1) {
    editForm.value.deniedPermissions.splice(index, 1)
  }
}

/* ---------- utilities ---------- */
function showSnackbar(message, color = 'success') {
  snackbar.value = { show: true, message, color }
}

function formatDate(date) {
  if (!date) return 'Never'
  return new Date(date).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}

function getRoleColor(role) {
  return roleColors[role] || 'grey'
}

function getStatusColor(status) {
  return statusColors[status] || 'grey'
}
</script>

<template>
  <div class="pa-4">
    <!-- Toolbar -->
    <v-toolbar flat class="mb-4">
      <v-text-field
        v-model="search"
        prepend-inner-icon="mdi-magnify"
        label="Search users..."
        variant="outlined"
        density="compact"
        hide-details
        class="mr-4"
        style="max-width: 300px"
      ></v-text-field>

      <v-select
        v-model="selectedRole"
        :items="[
          { title: 'All Roles', value: 'all' },
          ...availableRoles.map(r => ({ title: r.name, value: r.id }))
        ]"
        label="Filter by role"
        variant="outlined"
        density="compact"
        hide-details
        class="mr-4"
        style="max-width: 200px"
      ></v-select>

      <v-select
        v-model="selectedStatus"
        :items="[
          { title: 'All Status', value: 'all' },
          { title: 'Active', value: 'active' },
          { title: 'Suspended', value: 'suspended' },
          { title: 'Pending', value: 'pending' }
        ]"
        label="Filter by status"
        variant="outlined"
        density="compact"
        hide-details
        style="max-width: 200px"
      ></v-select>

      <v-spacer></v-spacer>

      <PermissionGuard permissions="manage_users">
        <v-btn
          color="primary"
          variant="outlined"
          prepend-icon="mdi-account-multiple-check"
          @click="openBulkDialog"
          :disabled="selectedUsers.length === 0"
          class="mr-2"
        >
          Bulk Actions ({{ selectedUsers.length }})
        </v-btn>
      </PermissionGuard>

      <PermissionGuard permissions="create_users">
        <v-btn
          color="primary"
          prepend-icon="mdi-plus"
          @click="$emit('create-user')"
        >
          Add User
        </v-btn>
      </PermissionGuard>
    </v-toolbar>

    <!-- Data Table -->
    <v-data-table
      v-model="selectedUsers"
      :headers="headers"
      :items="filteredUsers"
      :loading="loading"
      item-value="id"
      show-select
      class="elevation-1"
    >
      <!-- Email with avatar -->
      <template v-slot:item.email="{ item }">
        <div class="d-flex align-center py-2">
          <v-avatar size="32" class="mr-3">
            <v-icon>mdi-account-circle</v-icon>
          </v-avatar>
          <div>
            <div class="font-weight-medium">{{ item.email }}</div>
            <div v-if="item.notes" class="text-caption text-medium-emphasis">
              {{ item.notes }}
            </div>
          </div>
        </div>
      </template>

      <!-- Role chip -->
      <template v-slot:item.role="{ item }">
        <v-chip
          :color="getRoleColor(item.role)"
          size="small"
          label
        >
          {{ item.role }}
        </v-chip>
      </template>

      <!-- Status chip -->
      <template v-slot:item.status="{ item }">
        <v-chip
          :color="getStatusColor(item.status)"
          size="small"
          label
        >
          {{ item.status }}
        </v-chip>
      </template>

      <!-- Dates -->
      <template v-slot:item.createdAt="{ item }">
        <span class="text-caption">{{ formatDate(item.createdAt) }}</span>
      </template>

      <template v-slot:item.lastActive="{ item }">
        <span class="text-caption">{{ formatDate(item.lastActive) }}</span>
      </template>

      <!-- Custom permissions count -->
      <template v-slot:item.customPermCount="{ item }">
        <v-chip
          v-if="item.customPermCount > 0"
          size="x-small"
          color="info"
          variant="tonal"
        >
          +{{ item.customPermCount }}
        </v-chip>
        <span v-else class="text-medium-emphasis">-</span>
      </template>

      <!-- Actions -->
      <template v-slot:item.actions="{ item }">
        <div class="d-flex justify-end ga-1">
          <PermissionGuard permissions="edit_users">
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

          <PermissionGuard permissions="delete_users">
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
                placeholder="Optional notes about this user..."
              ></v-textarea>
            </v-col>

            <v-col cols="12">
              <v-divider class="my-4"></v-divider>
              <div class="text-h6 font-weight-medium mb-3 text-primary">Custom Permissions</div>
              
              <v-select
                :items="allPermissions.filter(p => !editForm.customPermissions.includes(p.id))"
                item-title="name"
                item-value="id"
                label="Add permission"
                variant="outlined"
                @update:model-value="addCustomPermission"
                clearable
              ></v-select>

              <div class="mt-2">
                <v-chip
                  v-for="permission in editForm.customPermissions"
                  :key="permission"
                  size="small"
                  closable
                  color="success"
                  class="mr-2 mb-2"
                  @click:close="removeCustomPermission(permission)"
                >
                  {{ allPermissions.find(p => p.id === permission)?.name || permission }}
                </v-chip>
              </div>
            </v-col>

            <v-col cols="12">
              <v-divider class="my-4"></v-divider>
              <div class="text-h6 font-weight-medium mb-3 text-primary">Denied Permissions</div>
              
              <v-select
                :items="allPermissions.filter(p => !editForm.deniedPermissions.includes(p.id))"
                item-title="name"
                item-value="id"
                label="Deny permission"
                variant="outlined"
                @update:model-value="addDeniedPermission"
                clearable
              ></v-select>

              <div class="mt-2">
                <v-chip
                  v-for="permission in editForm.deniedPermissions"
                  :key="permission"
                  size="small"
                  closable
                  color="error"
                  class="mr-2 mb-2"
                  @click:close="removeDeniedPermission(permission)"
                >
                  {{ allPermissions.find(p => p.id === permission)?.name || permission }}
                </v-chip>
              </div>
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
        </v-card-text>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn
            variant="text"
            @click="showDeleteDialog = false"
          >
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

    <!-- Snackbar -->
    <v-snackbar
      v-model="snackbar.show"
      :color="snackbar.color"
      :timeout="3000"
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

<style scoped>
:deep(.v-data-table) {
  font-family: 'Cambria', Georgia, serif;
}

:deep(.v-data-table th) {
  font-family: 'ITC Franklin Gothic', Arial, sans-serif;
  font-weight: 600;
}
</style>