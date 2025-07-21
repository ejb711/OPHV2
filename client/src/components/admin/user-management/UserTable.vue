<!-- client/src/components/admin/user-management/UserTable.vue -->
<template>
  <v-card variant="outlined">
    <v-data-table
      :headers="headers"
      :items="users"
      :loading="loading"
      :items-per-page="itemsPerPage"
      class="elevation-0"
    >
      <!-- User column with email and name -->
      <template v-slot:[`item.user`]="{ item }">
        <div class="py-2">
          <div class="text-body-2 font-weight-medium">
            {{ item.displayName || 'No Name' }}
          </div>
          <div class="text-caption text-primary user-email">
            {{ item.email }}
          </div>
        </div>
      </template>

      <!-- Role column with editable select -->
      <template v-slot:[`item.role`]="{ item }">
        <RoleChip
          v-if="!canEditRole(item)"
          :role="item.role"
          size="small"
        />
        <v-select
          v-else
          :model-value="item.role"
          :items="getAvailableRoles(item)"
          item-title="name"
          item-value="id"
          variant="solo"
          density="compact"
          hide-details
          @update:model-value="$emit('update-role', item, $event)"
        >
          <template v-slot:selection="{ item: role }">
            <RoleChip :role="role.value" size="small" />
          </template>
          <template v-slot:item="{ item: role, props: itemProps }">
            <v-list-item v-bind="itemProps">
              <template v-slot:prepend>
                <RoleChip :role="role.value" size="small" />
              </template>
            </v-list-item>
          </template>
        </v-select>
      </template>

      <!-- Status column -->
      <template v-slot:[`item.status`]="{ item }">
        <StatusChip
          :status="item.status || 'active'"
          size="small"
          :clickable="canToggleStatus(item)"
          @click="canToggleStatus(item) && $emit('toggle-status', item)"
        />
      </template>

      <!-- Custom Permissions column -->
      <template v-slot:[`item.customPerms`]="{ item }">
        <div class="text-center">
          <v-chip
            v-if="item.customPermissions?.length"
            size="small"
            color="info"
            variant="tonal"
          >
            +{{ item.customPermissions.length }}
          </v-chip>
          <span v-else class="text-disabled">—</span>
        </div>
      </template>

      <!-- Created date column -->
      <template v-slot:[`item.created`]="{ item }">
        <span class="text-caption">
          {{ formatDate(item.createdAt) }}
        </span>
      </template>

      <!-- Last active column -->
      <template v-slot:[`item.lastActive`]="{ item }">
        <span class="text-caption">
          {{ formatDate(item.lastActiveAt) || 'Never' }}
        </span>
      </template>

      <!-- Actions column -->
      <template v-slot:[`item.actions`]="{ item }">
        <UserActions
          :user="item"
          @edit="$emit('edit', item)"
          @reset-password="$emit('reset-password', item)"
          @delete="$emit('delete', item)"
        />
      </template>

      <!-- Loading slot -->
      <template v-slot:loading>
        <v-skeleton-loader type="table-row@5" />
      </template>

      <!-- No data slot -->
      <template v-slot:no-data>
        <div class="text-center py-8">
          <v-icon size="48" color="grey">mdi-account-group-outline</v-icon>
          <p class="text-h6 mt-2">No users found</p>
          <p class="text-body-2 text-medium-emphasis">
            {{ search ? 'Try adjusting your search or filters' : 'No users in the system yet' }}
          </p>
        </div>
      </template>
    </v-data-table>
  </v-card>
</template>

<script setup>
import { computed } from 'vue'
import { useAuthStore } from '@/stores/auth'
import { usePermissionsStore } from '@/stores/permissions'
import RoleChip from '../RoleChip.vue'
import StatusChip from '../StatusChip.vue'
import UserActions from '../UserActions.vue'

// Props
const props = defineProps({
  users: {
    type: Array,
    required: true
  },
  loading: {
    type: Boolean,
    default: false
  },
  itemsPerPage: {
    type: Number,
    default: 10
  },
  search: {
    type: String,
    default: ''
  }
})

// Emits
const emit = defineEmits([
  'edit',
  'delete',
  'reset-password',
  'update-role',
  'toggle-status'
])

// Stores
const authStore = useAuthStore()
const permissionsStore = usePermissionsStore()

// Table headers
const headers = [
  { title: 'User', key: 'user', sortable: true },
  { title: 'Role', key: 'role', sortable: true },
  { title: 'Status', key: 'status', sortable: true },
  { title: 'Custom Perms', key: 'customPerms', sortable: false },
  { title: 'Created', key: 'created', sortable: true },
  { title: 'Last Active', key: 'lastActive', sortable: true },
  { title: 'Actions', key: 'actions', sortable: false, align: 'end' }
]

// Methods
const canEditRole = (user) => {
  // Can't edit your own role
  if (user.uid === authStore.user?.uid) return false
  
  // Can't edit owner unless you are owner
  if (user.role === 'owner' && authStore.role !== 'owner') return false
  
  return authStore.hasPermission('manage_roles')
}

const canToggleStatus = (user) => {
  // Can't toggle your own status
  if (user.uid === authStore.user?.uid) return false
  
  // Can't toggle owner unless you are owner
  if (user.role === 'owner' && authStore.role !== 'owner') return false
  
  return authStore.hasPermission('manage_users')
}

const getAvailableRoles = (user) => {
  const roles = permissionsStore.roles
  
  if (authStore.role === 'owner') {
    return roles
  }
  
  // Non-owners cannot assign owner role
  return roles.filter(role => role.id !== 'owner')
}

const formatDate = (timestamp) => {
  if (!timestamp) return null
  
  const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp)
  const now = new Date()
  const diffInHours = (now - date) / (1000 * 60 * 60)
  
  if (diffInHours < 1) {
    return 'Just now'
  } else if (diffInHours < 24) {
    return `${Math.floor(diffInHours)}h ago`
  } else if (diffInHours < 168) { // 7 days
    return `${Math.floor(diffInHours / 24)}d ago`
  } else {
    return date.toLocaleDateString()
  }
}
</script>

<style scoped>
.user-email {
  cursor: pointer;
  text-decoration: none;
}

.user-email:hover {
  text-decoration: underline;
}

:deep(.v-data-table) {
  font-size: 0.875rem;
}

:deep(.v-select__selection) {
  margin: 0 !important;
}
</style>