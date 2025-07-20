<!-- client/src/components/admin/UserManagement.vue - COMPLETE VERSION -->
<template>
  <div>
    <!-- Header with Add User Button -->
    <v-row class="mb-4" align="center">
      <v-col cols="12" md="6">
        <div class="d-flex align-center">
          <v-icon class="mr-2" color="primary">mdi-account-group</v-icon>
          <h2 class="text-h5">User Management</h2>
        </div>
      </v-col>
      <v-col cols="12" md="6" class="text-right">
        <PermissionGuard permission="create_users">
          <v-btn
            color="primary"
            variant="flat"
            size="large"
            @click="$emit('create-user')"
            prepend-icon="mdi-account-plus"
          >
            Add User
          </v-btn>
        </PermissionGuard>
      </v-col>
    </v-row>

    <!-- Search and filters -->
    <v-row class="mb-4" align="center">
      <v-col cols="12" md="6">
        <v-text-field
          v-model="searchText"
          prepend-inner-icon="mdi-magnify"
          label="Search users..."
          variant="outlined"
          density="compact"
          clearable
          hide-details
        />
      </v-col>
      <v-col cols="12" md="3">
        <v-select
          v-model="roleFilter"
          :items="roleFilterOptions"
          label="Filter by Role"
          variant="outlined"
          density="compact"
          clearable
          hide-details
        />
      </v-col>
      <v-col cols="12" md="3">
        <v-select
          v-model="statusFilter"
          :items="statusFilterOptions"
          label="Filter by Status"
          variant="outlined"
          density="compact"
          clearable
          hide-details
        />
      </v-col>
    </v-row>

    <!-- User data table -->
    <v-data-table
      v-model="selectedUsers"
      :headers="headers"
      :items="filteredUsers"
      :loading="loading"
      item-value="id"
      show-select
      class="elevation-1"
      :items-per-page="25"
      :sort-by="[{ key: 'createdAt', order: 'desc' }]"
    >
      <!-- Email column with avatar -->
      <template #[`item.email`]="{ item }">
        <div class="d-flex align-center">
          <v-avatar size="32" class="mr-3">
            <v-img v-if="item.photoURL" :src="item.photoURL" />
            <span v-else class="text-caption">{{ item.email.charAt(0).toUpperCase() }}</span>
          </v-avatar>
          {{ item.email }}
        </div>
      </template>

      <!-- Role column with colored chips -->
      <template #[`item.role`]="{ item }">
        <v-chip
          :color="getRoleColor(item.role)"
          size="small"
          variant="flat"
        >
          {{ getRoleName(item.role) }}
        </v-chip>
      </template>

      <!-- Status column with colored chips -->
      <template #[`item.status`]="{ item }">
        <v-chip
          :color="getStatusColor(item.status || 'active')"
          size="small"
          variant="flat"
        >
          {{ (item.status || 'active').charAt(0).toUpperCase() + (item.status || 'active').slice(1) }}
        </v-chip>
      </template>

      <!-- Custom permissions count -->
      <template #[`item.customPermCount`]="{ item }">
        <v-chip
          v-if="item.customPermCount > 0"
          color="info"
          size="small"
          variant="outlined"
        >
          {{ item.customPermCount }}
        </v-chip>
        <span v-else class="text-grey">0</span>
      </template>

      <!-- Created date -->
      <template #[`item.createdAt`]="{ item }">
        <span class="text-caption">{{ formatDate(item.createdAt) }}</span>
      </template>

      <!-- Last active -->
      <template #[`item.lastActive`]="{ item }">
        <span class="text-caption">{{ formatDate(item.lastActive) }}</span>
      </template>

      <!-- Actions column -->
      <template #[`item.actions`]="{ item }">
        <div class="d-flex gap-1">
          <PermissionGuard permission="edit_users">
            <v-btn
              icon="mdi-pencil"
              size="small"
              variant="text"
              color="primary"
              @click="editUser(item)"
              :disabled="!canEditUser(item)"
            />
          </PermissionGuard>
          
          <PermissionGuard permission="delete_users">
            <v-btn
              icon="mdi-delete"
              size="small"
              variant="text"
              color="error"
              @click="confirmDeleteUser(item)"
              :disabled="item.id === auth.currentUser?.uid || item.role === 'owner'"
            />
          </PermissionGuard>
        </div>
      </template>
    </v-data-table>

    <!-- Bulk actions -->
    <v-row v-if="selectedUsers.length > 0" class="mt-4">
      <v-col>
        <v-card>
          <v-card-text>
            <div class="d-flex align-center justify-space-between">
              <span>{{ selectedUsers.length }} user(s) selected</span>
              <div class="d-flex gap-2">
                <v-btn
                  color="primary"
                  variant="outlined"
                  size="small"
                  @click="openBulkDialog"
                >
                  Bulk Actions
                </v-btn>
                <v-btn
                  variant="text"
                  size="small"
                  @click="selectedUsers = []"
                >
                  Clear Selection
                </v-btn>
              </div>
            </div>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>

    <!-- Edit User Dialog -->
    <v-dialog v-model="showEditDialog" max-width="600">
      <v-card>
        <v-card-title>
          <span class="text-h5">Edit User</span>
        </v-card-title>
        <v-card-text>
          <v-form ref="editFormRef">
            <v-row>
              <v-col cols="12">
                <v-select
                  v-model="editForm.role"
                  :items="availableRoles"
                  item-title="name"
                  item-value="id"
                  label="Role"
                  variant="outlined"
                  :rules="[v => !!v || 'Role is required']"
                />
              </v-col>
              <v-col cols="12">
                <v-select
                  v-model="editForm.status"
                  :items="['active', 'pending', 'suspended']"
                  label="Status"
                  variant="outlined"
                />
              </v-col>
              <v-col cols="12">
                <v-autocomplete
                  v-model="editForm.customPermissions"
                  :items="allPermissions"
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
                <v-autocomplete
                  v-model="editForm.deniedPermissions"
                  :items="allPermissions"
                  item-title="name"
                  item-value="id"
                  label="Denied Permissions"
                  variant="outlined"
                  multiple
                  chips
                  closable-chips
                />
              </v-col>
              <v-col cols="12">
                <v-textarea
                  v-model="editForm.notes"
                  label="Notes"
                  variant="outlined"
                  rows="3"
                />
              </v-col>
            </v-row>
          </v-form>
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn text @click="showEditDialog = false">Cancel</v-btn>
          <v-btn
            color="primary"
            :loading="saving"
            @click="saveUser"
          >
            Save
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Delete Confirmation Dialog -->
    <v-dialog v-model="showDeleteDialog" max-width="400">
      <v-card>
        <v-card-title class="text-h5">Confirm Deletion</v-card-title>
        <v-card-text>
          Are you sure you want to delete user <strong>{{ userToDelete?.email }}</strong>?
          This action cannot be undone.
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn text @click="showDeleteDialog = false">Cancel</v-btn>
          <v-btn
            color="error"
            :loading="saving"
            @click="deleteUser"
          >
            Delete
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Bulk Operations Dialog -->
    <v-dialog v-model="showBulkDialog" max-width="500">
      <v-card>
        <v-card-title>Bulk Operations</v-card-title>
        <v-card-text>
          <v-select
            v-model="bulkOperation.action"
            :items="bulkActionOptions"
            label="Action"
            variant="outlined"
          />
          
          <v-select
            v-if="bulkOperation.action === 'changeRole'"
            v-model="bulkOperation.role"
            :items="availableRoles"
            item-title="name"
            item-value="id"
            label="New Role"
            variant="outlined"
          />
          
          <v-autocomplete
            v-if="bulkOperation.action === 'addPermissions'"
            v-model="bulkOperation.permissions"
            :items="allPermissions"
            item-title="name"
            item-value="id"
            label="Permissions to Add"
            variant="outlined"
            multiple
            chips
          />
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn text @click="showBulkDialog = false">Cancel</v-btn>
          <v-btn
            color="primary"
            :loading="saving"
            @click="executeBulkOperation"
          >
            Execute
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Snackbar for notifications -->
    <v-snackbar
      v-model="snackbar.show"
      :color="snackbar.color"
      :timeout="4000"
      location="top"
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
  query, 
  orderBy, 
  onSnapshot, 
  doc, 
  updateDoc, 
  serverTimestamp,
  deleteDoc,
  where,
  or
} from 'firebase/firestore'
import { httpsCallable } from 'firebase/functions'
import { db, auth, functions } from '@/firebase'
import { useAuthStore } from '@/stores/auth'
import { usePermissionsStore } from '@/stores/permissions'
import PermissionGuard from '@/components/PermissionGuard.vue'

const emit = defineEmits(['activity', 'create-user'])

/* ---------- stores ---------- */
const authStore = useAuthStore()
const permissionsStore = usePermissionsStore()

/* ---------- reactive data ---------- */
const loading = ref(false)
const saving = ref(false)
const users = ref([])
const selectedUsers = ref([])
const searchText = ref('')
const roleFilter = ref(null)
const statusFilter = ref(null)

// Snackbar
const snackbar = ref({
  show: false,
  message: '',
  color: 'success'
})

// Edit user dialog
const showEditDialog = ref(false)
const editingUser = ref(null)
const editForm = ref({
  role: '',
  customPermissions: [],
  deniedPermissions: [],
  status: 'active',
  notes: ''
})

// Delete user dialog
const showDeleteDialog = ref(false)
const userToDelete = ref(null)

// Bulk operations
const showBulkDialog = ref(false)
const bulkOperation = ref({
  action: '',
  role: '',
  permissions: []
})

/* ---------- firestore listener ---------- */
let unsubscribe = null

/* ---------- computed properties ---------- */
const availableRoles = computed(() => permissionsStore.allRoles)
const allPermissions = computed(() => permissionsStore.allPermissions)

const roleFilterOptions = computed(() => [
  { title: 'All Roles', value: null },
  ...availableRoles.value.map(role => ({ title: role.name, value: role.id }))
])

const statusFilterOptions = computed(() => [
  { title: 'All Statuses', value: null },
  { title: 'Active', value: 'active' },
  { title: 'Pending', value: 'pending' },
  { title: 'Suspended', value: 'suspended' }
])

const filteredUsers = computed(() => {
  let filtered = users.value

  // Apply search filter
  if (searchText.value) {
    const search = searchText.value.toLowerCase()
    filtered = filtered.filter(user => 
      user.email.toLowerCase().includes(search)
    )
  }

  // Apply role filter
  if (roleFilter.value) {
    filtered = filtered.filter(user => user.role === roleFilter.value)
  }

  // Apply status filter
  if (statusFilter.value) {
    filtered = filtered.filter(user => (user.status || 'active') === statusFilter.value)
  }

  return filtered
})

const headers = computed(() => [
  { title: 'Email', key: 'email', sortable: true },
  { title: 'Role', key: 'role', sortable: true },
  { title: 'Status', key: 'status', sortable: true },
  { title: 'Custom Perms', key: 'customPermCount', sortable: true },
  { title: 'Created', key: 'createdAt', sortable: true },
  { title: 'Last Active', key: 'lastActive', sortable: true },
  { title: 'Actions', key: 'actions', sortable: false, width: '100px' }
])

const bulkActionOptions = computed(() => [
  { title: 'Change Role', value: 'changeRole' },
  { title: 'Add Permissions', value: 'addPermissions' },
  { title: 'Suspend Users', value: 'suspend' },
  { title: 'Activate Users', value: 'activate' }
])

/* ---------- permission checks ---------- */
const canEditUser = computed(() => (user) => {
  return authStore.hasPermission('edit_users') && user.id !== auth.currentUser?.uid
})

const canDeleteUser = computed(() => (user) => {
  return authStore.hasPermission('delete_users') && 
         user.id !== auth.currentUser?.uid &&
         user.role !== 'owner'
})

/* ---------- lifecycle ---------- */
onMounted(async () => {
  await loadUsers()
})

onUnmounted(() => {
  if (unsubscribe) unsubscribe()
})

/* ---------- utility functions ---------- */
function showSnackbar(message, color = 'success') {
  snackbar.value = {
    show: true,
    message,
    color
  }
}

function formatDate(date) {
  if (!date) return 'Never'
  const d = date instanceof Date ? date : 
           typeof date.toDate === 'function' ? date.toDate() : new Date(date)
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

/* ---------- FIXED: Load users function ---------- */
async function loadUsers() {
  if (!authStore.user) return
  
  loading.value = true
  try {
    // FIXED: Simple query that includes all users, then filter out deleted ones
    const usersQuery = query(
      collection(db, 'users'),
      orderBy('createdAt', 'desc')
    )
    
    unsubscribe = onSnapshot(usersQuery, (snapshot) => {
      users.value = snapshot.docs
        .map(doc => {
          const data = doc.data()
          return {
            id: doc.id,
            ...data,
            // Default status to 'active' if not set
            status: data.status || 'active',
            customPermCount: (data.customPermissions || []).length,
            createdAt: data.createdAt?.toDate?.() || data.createdAt,
            lastActive: data.lastActive?.toDate?.() || data.lastActive
          }
        })
        // Filter out deleted users on the client side
        .filter(user => user.status !== 'deleted')
      
      console.log(`Loaded ${users.value.length} users`)
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
    editingUser.value = null
  } catch (e) {
    console.error('Error updating user:', e)
    showSnackbar('Failed to update user', 'error')
  } finally {
    saving.value = false
  }
}

function confirmDeleteUser(user) {
  if (!canDeleteUser.value(user)) {
    showSnackbar('You do not have permission to delete this user', 'error')
    return
  }
  
  userToDelete.value = user
  showDeleteDialog.value = true
}

async function deleteUser() {
  if (!userToDelete.value) return
  
  saving.value = true
  try {
    // Use Cloud Function for proper user deletion
    const deleteUserFunction = httpsCallable(functions, 'deleteUser')
    await deleteUserFunction({ userId: userToDelete.value.id })

    emit('activity', 'user_deleted', {
      userId: userToDelete.value.id,
      email: userToDelete.value.email
    })

    showSnackbar('User deleted successfully')
    showDeleteDialog.value = false
    userToDelete.value = null
  } catch (e) {
    console.error('Error deleting user:', e)
    
    let errorMessage = 'Failed to delete user'
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
        userUpdates.customPermissions = [...new Set([...currentPerms, ...bulkOperation.value.permissions])]
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
    bulkOperation.value = { action: '', role: '', permissions: [] }
  } catch (e) {
    console.error('Error executing bulk operation:', e)
    showSnackbar('Failed to execute bulk operation', 'error')
  } finally {
    saving.value = false
  }
}
</script>

<style scoped>
.v-data-table {
  border-radius: 8px;
}
</style>