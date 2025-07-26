// Handle user created event
const handleUserCreated = async (userData) => {
  await handleUserCreated(userData)
}<!-- client/src/components/admin/UserManagement.vue -->
<template>
  <div class="user-management">
    <!-- Header Section -->
    <div class="mb-6">
      <h2 class="text-h4 font-weight-bold text-primary">
        <v-icon large left class="mr-2">mdi-account-group</v-icon>
        User Management
      </h2>
      <p class="text-subtitle-1 text-medium-emphasis mt-1">
        Manage user accounts, roles, and permissions
      </p>
    </div>

    <!-- Stats Cards -->
    <UserManagementStats
      :total-users="totalUsers"
      :active-users="activeUsers"
      :pending-users="pendingUsers"
      :roles-count="availableRoles.length"
    />

    <!-- Filters and Actions -->
    <UserManagementFilters
      v-model:search="search"
      v-model:role-filter="roleFilter"
      :role-options="roleFilterOptions"
      :loading="loading"
      @add-user="handleAddUser"
      @refresh="refresh"
    />

    <!-- Users Table -->
    <UserManagementTable
      :users="filteredUsers"
      :search="search"
      :loading="loading"
      @edit="handleEditUser"
      @delete="confirmDeleteUser"
      @edit-profile="handleEditProfile"
      @reset-password="handleResetPassword"
      @update-role="handleUpdateRole"
      @toggle-status="handleToggleStatus"
    />

    <!-- Create User Dialog -->
    <CreateUserDialog
      v-if="showCreateDialog"
      v-model="showCreateDialog"
      @user-created="handleUserCreated"
      @show-snackbar="handleShowSnackbar"
    />

    <!-- Edit User Dialog -->
    <UserEditDialog
      v-if="showEditDialog"
      v-model="showEditDialog"
      :user="editingUser"
      :roles="availableRoles"
      :permissions="availablePermissions"
      :saving="saving"
      @save="saveUserEdit"
      @cancel="cancelEdit"
    />

    <!-- Delete User Dialog -->
    <v-dialog v-model="showDeleteDialog" max-width="500">
      <v-card>
        <v-card-title class="text-h5">
          Confirm Delete
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
            :disabled="deleting"
          >
            Cancel
          </v-btn>
          <v-btn
            color="error"
            variant="flat"
            @click="deleteUser"
            :loading="deleting"
          >
            Delete User
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Password Reset Dialog -->
    <v-dialog v-model="showPasswordResetDialog" max-width="500">
      <v-card>
        <v-card-title class="text-h5">
          Reset Password
        </v-card-title>

        <v-card-text>
          <p>Send a password reset email to <strong>{{ passwordResetUser?.email }}</strong>?</p>
          <p class="text-body-2 mt-2 text-medium-emphasis">
            The user will receive an email with instructions to reset their password.
          </p>
        </v-card-text>

        <v-card-actions>
          <v-spacer />
          <v-btn
            variant="text"
            @click="showPasswordResetDialog = false"
          >
            Cancel
          </v-btn>
          <v-btn
            color="primary"
            variant="flat"
            @click="sendPasswordReset"
            :loading="resettingPassword"
          >
            Send Reset Email
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import UserManagementStats from './user-management/UserManagementStats.vue'
import UserManagementFilters from './user-management/UserManagementFilters.vue'
import UserManagementTable from './user-management/UserManagementTable.vue'
import UserEditDialog from './user-management/UserEditDialog.vue'
import CreateUserDialog from './CreateUserDialog.vue'
import { useUserManagement } from '@/composables/useUserManagement'

// Router
const router = useRouter()

// Use the composable for all business logic
const {
  // Data
  loading,
  search,
  roleFilter,
  showCreateDialog,
  showEditDialog,
  showDeleteDialog,
  showPasswordResetDialog,
  editingUser,
  userToDelete,
  passwordResetUser,
  saving,
  deleting,
  resettingPassword,
  availableRoles,
  availablePermissions,
  filteredUsers,
  // Computed
  roleFilterOptions,
  totalUsers,
  activeUsers,
  pendingUsers,
  // Methods
  refresh,
  handleEditUser,
  confirmDeleteUser,
  deleteUser,
  cancelEdit,
  saveUserEdit,
  handleUserCreated,
  handleUpdateRole,
  handleToggleStatus,
  sendPasswordReset,
  showSnackbar
} = useUserManagement()

// Event emitter
const emit = defineEmits(['activity'])

// Route to user profile edit
const handleEditProfile = (user) => {
  router.push(`/admin/users/${user.id}/edit`)
}

// Handle password reset
const handleResetPassword = (user) => {
  passwordResetUser.value = user
  showPasswordResetDialog.value = true
}

// Forward snackbar messages to parent
showSnackbar.value = (message, type = 'success') => {
  emit('activity', { type, message })
}

// Handle add user button click
const handleAddUser = () => {
  showCreateDialog.value = true
  }

// Handle snackbar from CreateUserDialog
const handleShowSnackbar = (message) => {
  emit('activity', { type: 'success', message })
}
</script>

<style scoped>
.user-management {
  padding: 16px;
}
</style>