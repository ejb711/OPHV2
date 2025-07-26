<!-- client/src/components/admin/UserManagement.vue - COMPLETE VERSION WITH CLICKABLE EMAIL LINKS -->
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
      <!-- Email column with avatar and clickable link -->
      <template #[`item.email`]="{ item }">
        <div class="d-flex align-center">
          <v-avatar size="32" class="mr-3">
            <v-img v-if="item.photoURL" :src="item.photoURL" />
            <span v-else class="text-caption">{{ item.email.charAt(0).toUpperCase() }}</span>
          </v-avatar>

          <!-- Clickable email link for users that can be edited -->
          <PermissionGuard permission="edit_users">
            <template #default="{ hasPermission }">
              <div v-if="hasPermission && canEditUser(item)">
                <v-btn
                  variant="text"
                  color="primary"
                  class="text-none pa-0"
                  style="text-decoration: none; justify-content: flex-start;"
                  @click="navigateToUserEdit(item)"
                >
                  {{ item.email }}
                </v-btn>
                <div class="text-caption text-medium-emphasis">
                  {{ item.displayName || 'No display name' }}
                </div>
              </div>
              <div v-else>
                <div class="font-weight-medium">{{ item.email }}</div>
                <div class="text-caption text-medium-emphasis">
                  {{ item.displayName || 'No display name' }}
                </div>
              </div>
            </template>
          </PermissionGuard>
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
          <!-- Edit Profile Button -->
          <PermissionGuard permission="edit_users">
            <v-tooltip text="Edit Profile">
              <template #activator="{ props }">
                <v-btn
                  v-bind="props"
                  icon="mdi-account-edit"
                  size="small"
                  variant="text"
                  color="primary"
                  @click="navigateToUserEdit(item)"
                  :disabled="!canEditUser(item)"
                />
              </template>
            </v-tooltip>
          </PermissionGuard>

          <!-- Edit User Button (role/permissions) -->
          <PermissionGuard permission="edit_users">
            <v-tooltip text="Edit User Settings">
              <template #activator="{ props }">
                <v-btn
                  v-bind="props"
                  icon="mdi-pencil"
                  size="small"
                  variant="text"
                  color="secondary"
                  @click="editUser(item)"
                  :disabled="!canEditUser(item)"
                />
              </template>
            </v-tooltip>
          </PermissionGuard>

          <!-- Delete User Button -->
          <PermissionGuard permission="delete_users">
            <v-tooltip text="Delete User">
              <template #activator="{ props }">
                <v-btn
                  v-bind="props"
                  icon="mdi-delete"
                  size="small"
                  variant="text"
                  color="error"
                  @click="confirmDeleteUser(item)"
                  :disabled="item.id === auth.currentUser?.uid || item.role === 'owner'"
                />
              </template>
            </v-tooltip>
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
                  v-model="editForm.customPermissions"
                  :items="availablePermissions"
                  item-title="name"
                  item-value="id"
                  label="Additional Permissions"
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
          <v-btn text @click="showEditDialog = false">Cancel</v-btn>
          <v-btn color="primary" @click="saveUser">Save</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Delete Confirmation Dialog -->
    <v-dialog v-model="showDeleteDialog" max-width="400">
      <v-card>
        <v-card-title class="text-h5">Confirm Delete</v-card-title>
        <v-card-text>
          Are you sure you want to delete user <strong>{{ userToDelete?.email }}</strong>?
          This action cannot be undone.
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn text @click="showDeleteDialog = false">Cancel</v-btn>
          <v-btn color="error" @click="deleteUser">Delete</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Bulk Actions Dialog -->
    <v-dialog v-model="showBulkDialog" max-width="500">
      <v-card>
        <v-card-title>Bulk Actions</v-card-title>
        <v-card-text>
          <v-select
            v-model="bulkAction"
            :items="bulkActionOptions"
            label="Select Action"
            variant="outlined"
          />

          <v-select
            v-if="bulkAction === 'change_role'"
            v-model="bulkRole"
            :items="availableRoles"
            item-title="name"
            item-value="id"
            label="New Role"
            variant="outlined"
          />
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn text @click="showBulkDialog = false">Cancel</v-btn>
          <v-btn color="primary" @click="executeBulkAction">Execute</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Success/Error Snackbar -->
    <v-snackbar
      v-model="snackbar.show"
      :color="snackbar.color"
      timeout="4000"
      location="top"
    >
      {{ snackbar.message }}
      <template #actions>
        <v-btn
          color="white"
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
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { collection, query, onSnapshot, updateDoc, doc, deleteDoc, orderBy } from 'firebase/firestore'
import { httpsCallable } from 'firebase/functions'
import { db, functions } from '@/firebase'
import { useAuthStore } from '@/stores/auth'
import { usePermissionsStore } from '@/stores/permissions'
import { useAudit } from '@/composables/useAudit'
import PermissionGuard from '@/components/PermissionGuard.vue'

const router = useRouter()
const auth = useAuthStore()
const permissionsStore = usePermissionsStore()
const { logActivity } = useAudit()

// State
const loading = ref(true)
const users = ref([])
const searchText = ref('')
const roleFilter = ref('')
const statusFilter = ref('')
const selectedUsers = ref([])

// Dialog states
const showEditDialog = ref(false)
const showDeleteDialog = ref(false)
const showBulkDialog = ref(false)

// Form states
const editForm = ref({
  id: '',
  email: '',
  role: '',
  customPermissions: [],
  deniedPermissions: []
})

const userToDelete = ref(null)
const bulkAction = ref('')
const bulkRole = ref('')

const snackbar = ref({
  show: false,
  message: '',
  color: 'success'
})

// Firebase listeners
let unsubscribeUsers = null

// Computed
const filteredUsers = computed(() => {
  let filtered = users.value

  // Search filter
  if (searchText.value) {
    const search = searchText.value.toLowerCase()
    filtered = filtered.filter(user =>
      user.email.toLowerCase().includes(search) ||
      (user.displayName && user.displayName.toLowerCase().includes(search))
    )
  }

  // Role filter
  if (roleFilter.value) {
    filtered = filtered.filter(user => user.role === roleFilter.value)
  }

  // Status filter
  if (statusFilter.value) {
    filtered = filtered.filter(user => (user.status || 'active') === statusFilter.value)
  }

  return filtered.map(user => ({
    ...user,
    customPermCount: (user.customPermissions || []).length
  }))
})

const availableRoles = computed(() => permissionsStore.roles)
const availablePermissions = computed(() => permissionsStore.permissions)

const roleFilterOptions = computed(() => {
  const roles = [...new Set(users.value.map(user => user.role))]
  return roles.map(role => ({
    title: getRoleName(role),
    value: role
  }))
})

const statusFilterOptions = [
  { title: 'Active', value: 'active' },
  { title: 'Pending', value: 'pending' },
  { title: 'Inactive', value: 'inactive' },
  { title: 'Suspended', value: 'suspended' }
]

const bulkActionOptions = [
  { title: 'Change Role', value: 'change_role' },
  { title: 'Activate Users', value: 'activate' },
  { title: 'Deactivate Users', value: 'deactivate' }
]

// Table headers
const headers = [
  { title: 'User', key: 'email', sortable: true, width: '30%' },
  { title: 'Role', key: 'role', sortable: true },
  { title: 'Status', key: 'status', sortable: true },
  { title: 'Custom Perms', key: 'customPermCount', sortable: true },
  { title: 'Created', key: 'createdAt', sortable: true },
  { title: 'Last Active', key: 'lastActive', sortable: true },
  { title: 'Actions', key: 'actions', sortable: false, width: '150px' }
]

// Methods
function getRoleColor(role) {
  const colors = {
    owner: 'purple',
    admin: 'primary',
    user: 'success',
    viewer: 'info',
    pending: 'warning'
  }
  return colors[role] || 'grey'
}

function getRoleName(role) {
  const roleMap = {
    owner: 'Owner',
    admin: 'Administrator',
    user: 'User',
    viewer: 'Viewer',
    pending: 'Pending'
  }
  return roleMap[role] || role
}

function getStatusColor(status) {
  const colors = {
    active: 'success',
    pending: 'warning',
    inactive: 'grey',
    suspended: 'error'
  }
  return colors[status] || 'grey'
}

function formatDate(date) {
  if (!date) return 'Never'

  let dateObj
  if (date.toDate) {
    dateObj = date.toDate()
  } else if (date instanceof Date) {
    dateObj = date
  } else {
    dateObj = new Date(date)
  }

  return dateObj.toLocaleDateString()
}

function canEditUser(user) {
  // Cannot edit yourself
  if (user.id === auth.user?.uid) return false

  // Only owners can edit other owners
  if (user.role === 'owner' && auth.role !== 'owner') return false

  return true
}

function navigateToUserEdit(user) {
  if (canEditUser(user)) {
    router.push(`/admin/users/${user.id}/edit`)
  }
}

function editUser(user) {
  editForm.value = {
    id: user.id,
    email: user.email,
    role: user.role,
    customPermissions: user.customPermissions || [],
    deniedPermissions: user.deniedPermissions || []
  }
  showEditDialog.value = true
}

function confirmDeleteUser(user) {
  userToDelete.value = user
  showDeleteDialog.value = true
}

async function saveUser() {
  try {
    const userRef = doc(db, 'users', editForm.value.id)

    await updateDoc(userRef, {
      role: editForm.value.role,
      customPermissions: editForm.value.customPermissions,
      deniedPermissions: editForm.value.deniedPermissions,
      updatedAt: new Date(),
      updatedBy: auth.user.uid
    })

    await logActivity('user_updated', {
      targetUserId: editForm.value.id,
      targetUserEmail: editForm.value.email,
      changes: {
        role: editForm.value.role,
        customPermissions: editForm.value.customPermissions,
        deniedPermissions: editForm.value.deniedPermissions
      }
    })

    showEditDialog.value = false
    snackbar.value = {
      show: true,
      message: 'User updated successfully',
      color: 'success'
    }

  } catch (error) {
    snackbar.value = {
      show: true,
      message: 'Failed to update user',
      color: 'error'
    }
  }
}

async function deleteUser() {
  try {
    const deleteUserFunction = httpsCallable(functions, 'deleteUser')
    await deleteUserFunction({ userId: userToDelete.value.id })

    await logActivity('user_deleted', {
      targetUserId: userToDelete.value.id,
      targetUserEmail: userToDelete.value.email
    })

    showDeleteDialog.value = false
    userToDelete.value = null

    snackbar.value = {
      show: true,
      message: 'User deleted successfully',
      color: 'success'
    }

  } catch (error) {
    snackbar.value = {
      show: true,
      message: 'Failed to delete user',
      color: 'error'
    }
  }
}

function openBulkDialog() {
  showBulkDialog.value = true
}

async function executeBulkAction() {
  try {
    for (const userId of selectedUsers.value) {
      const user = users.value.find(u => u.id === userId)
      if (!user || !canEditUser(user)) continue

      const userRef = doc(db, 'users', userId)

      switch (bulkAction.value) {
        case 'change_role':
          await updateDoc(userRef, {
            role: bulkRole.value,
            updatedAt: new Date(),
            updatedBy: auth.user.uid
          })
          break
        case 'activate':
          await updateDoc(userRef, {
            status: 'active',
            updatedAt: new Date(),
            updatedBy: auth.user.uid
          })
          break
        case 'deactivate':
          await updateDoc(userRef, {
            status: 'inactive',
            updatedAt: new Date(),
            updatedBy: auth.user.uid
          })
          break
      }
    }

    await logActivity('bulk_user_action', {
      action: bulkAction.value,
      userCount: selectedUsers.value.length,
      userIds: selectedUsers.value
    })

    selectedUsers.value = []
    showBulkDialog.value = false
    bulkAction.value = ''
    bulkRole.value = ''

    snackbar.value = {
      show: true,
      message: 'Bulk action completed successfully',
      color: 'success'
    }

  } catch (error) {
    snackbar.value = {
      show: true,
      message: 'Failed to execute bulk action',
      color: 'error'
    }
  }
}

async function loadUsers() {
  try {
    loading.value = true

    const usersQuery = query(
      collection(db, 'users'),
      orderBy('createdAt', 'desc')
    )

    unsubscribeUsers = onSnapshot(usersQuery, (snapshot) => {
      users.value = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }))
      loading.value = false
    }, (error) => {
      loading.value = false
    })

  } catch (error) {
    loading.value = false
  }
}

// Lifecycle
onMounted(async () => {
  await loadUsers()
})

onUnmounted(() => {
  if (unsubscribeUsers) {
    unsubscribeUsers()
  }
})

// Define emits
defineEmits(['activity', 'create-user'])
</script>

<style scoped>
.clickable-email {
  cursor: pointer;
  color: rgb(var(--v-theme-primary));
  text-decoration: underline;
}

.clickable-email:hover {
  text-decoration: none;
}
</style>