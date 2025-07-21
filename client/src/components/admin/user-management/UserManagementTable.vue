<!-- client/src/components/admin/user-management/UserManagementTable.vue -->
<template>
  <v-card>
    <v-data-table
      :headers="headers"
      :items="users"
      :search="search"
      :loading="loading"
      items-per-page="10"
      class="elevation-1"
    >
      <!-- User Column -->
      <template #item.user="{ item }">
        <div class="d-flex align-center py-2">
          <v-avatar size="36" class="mr-3">
            <v-icon v-if="!item.photoURL">mdi-account</v-icon>
            <v-img v-else :src="item.photoURL" />
          </v-avatar>
          <div>
            <div class="font-weight-medium">
              {{ item.displayName || 'No Name' }}
            </div>
            <div class="text-body-2 text-medium-emphasis">
              {{ item.email }}
            </div>
          </div>
        </div>
      </template>

      <!-- Role Column -->
      <template #item.role="{ item }">
        <v-menu>
          <template #activator="{ props }">
            <v-chip
              v-bind="props"
              :color="getRoleColor(item.role)"
              text-color="white"
              small
              :append-icon="canEditUser(item) ? 'mdi-menu-down' : undefined"
            >
              {{ item.role }}
            </v-chip>
          </template>
          
          <v-list v-if="canEditUser(item)">
            <v-list-item
              v-for="role in availableRoles"
              :key="role.id"
              @click="$emit('update-role', item, role.id)"
              :disabled="item.role === role.id"
            >
              <v-list-item-title>{{ role.name }}</v-list-item-title>
            </v-list-item>
          </v-list>
        </v-menu>
      </template>

      <!-- Status Column -->
      <template #item.status="{ item }">
        <v-chip
          :color="item.status === 'active' ? 'success' : 'error'"
          text-color="white"
          small
          @click="canEditUser(item) && $emit('toggle-status', item)"
          :style="canEditUser(item) ? 'cursor: pointer' : ''"
        >
          {{ item.status || 'active' }}
        </v-chip>
      </template>

      <!-- Created Column -->
      <template #item.createdAt="{ item }">
        {{ formatDate(item.createdAt) }}
      </template>

      <!-- Actions Column -->
      <template #item.actions="{ item }">
        <!-- Edit Profile -->
        <v-tooltip text="Edit Profile" location="top">
          <template #activator="{ props }">
            <v-btn
              v-bind="props"
              icon="mdi-account-edit"
              size="small"
              variant="text"
              @click="$emit('edit-profile', item)"
            >
              <v-icon>mdi-account-edit</v-icon>
            </v-btn>
          </template>
        </v-tooltip>

        <!-- Edit Permissions -->
        <v-tooltip text="Edit Permissions" location="top">
          <template #activator="{ props }">
            <v-btn
              v-bind="props"
              icon="mdi-shield-edit"
              size="small"
              variant="text"
              @click="$emit('edit', item)"
              :disabled="!canEditUser(item)"
            >
              <v-icon>mdi-shield-edit</v-icon>
            </v-btn>
          </template>
        </v-tooltip>

        <!-- Reset Password -->
        <v-tooltip text="Reset Password" location="top">
          <template #activator="{ props }">
            <v-btn
              v-bind="props"
              icon="mdi-lock-reset"
              size="small"
              variant="text"
              @click="$emit('reset-password', item)"
            >
              <v-icon>mdi-lock-reset</v-icon>
            </v-btn>
          </template>
        </v-tooltip>

        <!-- Delete User -->
        <v-tooltip text="Delete User" location="top">
          <template #activator="{ props }">
            <v-btn
              v-bind="props"
              icon="mdi-delete"
              size="small"
              variant="text"
              color="error"
              @click="$emit('delete', item)"
              :disabled="!canDeleteUser(item)"
            >
              <v-icon>mdi-delete</v-icon>
            </v-btn>
          </template>
        </v-tooltip>
      </template>
    </v-data-table>
  </v-card>
</template>

<script setup>
import { computed } from 'vue'
import { useAuthStore } from '@/stores/auth'
import { usePermissionsStore } from '@/stores/permissions'

// Props
defineProps({
  users: {
    type: Array,
    required: true
  },
  search: {
    type: String,
    default: ''
  },
  loading: {
    type: Boolean,
    default: false
  }
})

// Emits
defineEmits([
  'edit',
  'delete',
  'edit-profile',
  'reset-password',
  'update-role',
  'toggle-status'
])

// Stores
const authStore = useAuthStore()
const permissionsStore = usePermissionsStore()

// Table headers
const headers = [
  { title: 'User', key: 'user', width: '30%' },
  { title: 'Role', key: 'role' },
  { title: 'Status', key: 'status' },
  { title: 'Created', key: 'createdAt' },
  { title: 'Actions', key: 'actions', sortable: false, width: '180px' }
]

// Computed
const availableRoles = computed(() => permissionsStore.roles)

// Methods
const getRoleColor = (role) => {
  const colors = {
    owner: 'purple',
    admin: 'primary',
    user: 'success',
    viewer: 'info',
    pending: 'warning'
  }
  return colors[role] || 'grey'
}

const formatDate = (date) => {
  if (!date) return 'N/A'
  
  const dateObj = date.toDate ? date.toDate() : new Date(date)
  return dateObj.toLocaleDateString()
}

const canEditUser = (user) => {
  // Cannot edit yourself
  if (user.id === authStore.currentUser?.uid) return false
  
  // Only owners can edit other owners
  if (user.role === 'owner' && authStore.role !== 'owner') return false
  
  return true
}

const canDeleteUser = (user) => {
  // Cannot delete yourself
  if (user.id === authStore.currentUser?.uid) return false
  
  // Only owners can delete other owners
  if (user.role === 'owner' && authStore.role !== 'owner') return false
  
  return true
}
</script>

<style scoped>
:deep(.v-data-table) {
  font-size: 14px;
}

:deep(.v-data-table-header) {
  background-color: rgb(var(--v-theme-surface));
  font-weight: 600;
}

:deep(.v-chip) {
  font-weight: 500;
}
</style>