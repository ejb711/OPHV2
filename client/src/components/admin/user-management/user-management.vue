<!-- client/src/components/admin/UserManagement.vue -->
<!-- Modularized version - Container component (~250 lines) -->
<template>
  <div class="user-management">
    <!-- Header -->
    <div class="d-flex align-center justify-space-between mb-4">
      <h2 class="text-h5 font-weight-bold">
        <v-icon left>mdi-account-group</v-icon>
        User Management
      </h2>
      <v-btn
        color="primary"
        prepend-icon="mdi-account-plus"
        @click="createDialog = true"
      >
        Add User
      </v-btn>
    </div>

    <!-- Filters Component -->
    <UserFilters
      v-model:search="search"
      v-model:role-filter="roleFilter"
      v-model:status-filter="statusFilter"
      :roles="roles"
      @refresh="loadUsers"
    />

    <!-- User Table Component -->
    <UserTable
      :users="filteredUsers"
      :loading="loading"
      :items-per-page="itemsPerPage"
      @edit="handleEdit"
      @delete="confirmDelete"
      @reset-password="openPasswordReset"
      @update-role="updateUserRole"
      @toggle-status="toggleUserStatus"
    />

    <!-- Create User Dialog -->
    <CreateUserDialog
      v-model="createDialog"
      :roles="availableRoles"
      @user-created="handleUserCreated"
    />

    <!-- Delete Confirmation Dialog -->
    <DeleteUserDialog
      v-model="deleteDialog"
      :user="userToDelete"
      :deleting="deleting"
      @confirm="handleDelete"
      @cancel="deleteDialog = false"
    />

    <!-- Password Reset Dialog -->
    <PasswordResetDialog
      v-model="passwordResetDialog"
      :user="passwordResetUser"
      @password-reset="handlePasswordReset"
    />

    <!-- Snackbar for notifications -->
    <v-snackbar
      v-model="snackbar.show"
      :color="snackbar.color"
      :timeout="4000"
      location="bottom"
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
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { collection, onSnapshot, doc, updateDoc } from 'firebase/firestore'
import { httpsCallable } from 'firebase/functions'
import { db, functions } from '@/firebase'
import { useAuthStore } from '@/stores/auth'
import { usePermissionsStore } from '@/stores/permissions'
import { useAudit } from '@/composables/useAudit'

// Import modular components
import UserFilters from './user-management/UserFilters.vue'
import UserTable from './user-management/UserTable.vue'
import DeleteUserDialog from './user-management/DeleteUserDialog.vue'
import CreateUserDialog from './CreateUserDialog.vue'
import PasswordResetDialog from './PasswordResetDialog.vue'

// Composables
const router = useRouter()
const authStore = useAuthStore()
const permissionsStore = usePermissionsStore()
const { logEvent } = useAudit()

// State
const users = ref([])
const roles = ref([])
const loading = ref(true)
const itemsPerPage = ref(10)

// Search and filters
const search = ref('')
const roleFilter = ref('all')
const statusFilter = ref('all')

// Dialogs
const createDialog = ref(false)
const deleteDialog = ref(false)
const passwordResetDialog = ref(false)
const userToDelete = ref(null)
const passwordResetUser = ref(null)
const deleting = ref(false)

// Snackbar
const snackbar = ref({
  show: false,
  message: '',
  color: 'success'
})

// Firestore unsubscribe functions
let unsubscribeUsers = null
let unsubscribeRoles = null

// Computed
const availableRoles = computed(() => {
  if (authStore.role === 'owner') {
    return roles.value
  }
  // Non-owners cannot assign owner role
  return roles.value.filter(role => role.id !== 'owner')
})

const filteredUsers = computed(() => {
  let filtered = users.value

  // Search filter
  if (search.value) {
    const searchLower = search.value.toLowerCase()
    filtered = filtered.filter(user =>
      user.email?.toLowerCase().includes(searchLower) ||
      user.displayName?.toLowerCase().includes(searchLower) ||
      user.department?.toLowerCase().includes(searchLower)
    )
  }

  // Role filter
  if (roleFilter.value !== 'all') {
    filtered = filtered.filter(user => user.role === roleFilter.value)
  }

  // Status filter
  if (statusFilter.value !== 'all') {
    filtered = filtered.filter(user => user.status === statusFilter.value)
  }

  return filtered
})

// Methods
const loadUsers = () => {
  loading.value = true

  // Subscribe to users collection
  unsubscribeUsers = onSnapshot(
    collection(db, 'users'),
    (snapshot) => {
      users.value = snapshot.docs.map(doc => ({
        uid: doc.id,
        ...doc.data()
      }))
      loading.value = false
    },
    (error) => {
      loading.value = false
      showSnackbar('Failed to load users', 'error')
    }
  )

  // Subscribe to roles collection
  unsubscribeRoles = onSnapshot(
    collection(db, 'roles'),
    (snapshot) => {
      roles.value = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })).sort((a, b) => b.hierarchy - a.hierarchy)
    }
  )
}

const handleEdit = (user) => {
  router.push(`/admin/users/${user.uid}/edit`)
}

const confirmDelete = (user) => {
  userToDelete.value = user
  deleteDialog.value = true
}

const handleDelete = async () => {
  if (!userToDelete.value) return

  deleting.value = true
  try {
    const deleteUser = httpsCallable(functions, 'deleteUser')
    await deleteUser({
      userId: userToDelete.value.uid,
      reason: 'Deleted by admin'
    })

    showSnackbar(`User ${userToDelete.value.email} deleted successfully`)
    deleteDialog.value = false
    userToDelete.value = null
  } catch (error) {
    showSnackbar(error.message || 'Failed to delete user', 'error')
  } finally {
    deleting.value = false
  }
}

const openPasswordReset = (user) => {
  passwordResetUser.value = user
  passwordResetDialog.value = true
}

const handlePasswordReset = async (data) => {
  try {
    showSnackbar(`Password reset successfully for ${passwordResetUser.value.email}`)
  } catch (error) {
    showSnackbar('Failed to reset password: ' + error.message, 'error')
  }
}

const handleUserCreated = (user) => {
  showSnackbar(`User ${user.email} created successfully`)
  createDialog.value = false
}

const updateUserRole = async (user, newRole) => {
  try {
    await updateDoc(doc(db, 'users', user.uid), {
      role: newRole,
      updatedAt: new Date()
    })

    await logEvent('user_role_updated', {
      targetUserId: user.uid,
      oldRole: user.role,
      newRole: newRole
    })

    showSnackbar(`Updated role for ${user.email}`)
  } catch (error) {
    showSnackbar('Failed to update role', 'error')
  }
}

const toggleUserStatus = async (user) => {
  const newStatus = user.status === 'active' ? 'suspended' : 'active'
  try {
    await updateDoc(doc(db, 'users', user.uid), {
      status: newStatus,
      updatedAt: new Date()
    })

    await logEvent('user_status_updated', {
      targetUserId: user.uid,
      oldStatus: user.status,
      newStatus: newStatus
    })

    showSnackbar(`User ${user.email} ${newStatus}`)
  } catch (error) {
    showSnackbar('Failed to update status', 'error')
  }
}

const showSnackbar = (message, color = 'success') => {
  snackbar.value = {
    show: true,
    message,
    color
  }
}

// Lifecycle
onMounted(() => {
  loadUsers()
})

onUnmounted(() => {
  unsubscribeUsers?.()
  unsubscribeRoles?.()
})

// Emit activity event
const emit = defineEmits(['activity'])
onMounted(() => {
  emit('activity', 'Viewed user management')
})
</script>

<style scoped>
.user-management {
  height: 100%;
  display: flex;
  flex-direction: column;
}
</style>