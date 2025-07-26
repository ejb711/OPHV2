<!-- client/src/components/admin/roles/RoleManagement.vue -->
<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import { collection, onSnapshot, query, orderBy } from 'firebase/firestore'
import { db } from '@/firebase'
import { usePermissionsStore } from '@/stores/permissions'
import { useRoleManagement } from '@/composables/useRoleManagement'
import { useAudit } from '@/composables/useAudit'
import PermissionGuard from '@/components/PermissionGuard.vue'
import RoleCard from './RoleCard.vue'
import RoleCreateDialog from './RoleCreateDialog.vue'
import RoleEditDialog from './RoleEditDialog.vue'
import RoleDeleteDialog from './RoleDeleteDialog.vue'

const emit = defineEmits(['activity'])

// Composables
const permissionsStore = usePermissionsStore()
const { logEvent } = useAudit()
const {
  loading,
  saving,
  search,
  selectedCategory,
  snackbar,
  roles,
  permissionsByCategory,
  permissionCategories,
  usersPerRole,
  canDeleteRole,
  createRole,
  updateRole,
  deleteRole
} = useRoleManagement()

// Local state
const showCreateDialog = ref(false)
const showEditDialog = ref(false)
const showDeleteDialog = ref(false)
const currentRole = ref(null)
const createFormData = ref(null)

// Real-time listener
let unsubscribe = null

// Lifecycle
onMounted(async () => {
  loading.value = true

  try {
    // Load initial data
    await permissionsStore.loadAllData()

    // Set up real-time listener for roles
    const rolesQuery = query(collection(db, 'roles'), orderBy('hierarchy', 'desc'))
    unsubscribe = onSnapshot(rolesQuery, (snapshot) => {
      // Update store with real-time data
      permissionsStore.allRoles = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }))
    }, (error) => {
      snackbar.value = {
        show: true,
        message: 'Error loading roles',
        color: 'error'
      }
    })
  } catch (error) {
    snackbar.value = {
      show: true,
      message: 'Error loading role data',
      color: 'error'
    }
  } finally {
    loading.value = false
  }
})

onUnmounted(() => {
  if (unsubscribe) unsubscribe()
})

// Methods
const startCreateRole = () => {
  createFormData.value = null
  showCreateDialog.value = true
}

const startEditRole = (role) => {
  currentRole.value = role
  showEditDialog.value = true
}

const startCloneRole = (role) => {
  createFormData.value = {
    name: `${role.name} (Copy)`,
    description: role.description || '',
    permissions: [...(role.permissions || [])],
    hierarchy: 30 // Default hierarchy for cloned custom roles
  }
  showCreateDialog.value = true
}

const confirmDeleteRole = (role) => {
  if (!canDeleteRole(role)) {
    snackbar.value = {
      show: true,
      message: 'Cannot delete this role',
      color: 'error'
    }
    return
  }
  currentRole.value = role
  showDeleteDialog.value = true
}

const handleCreate = async (roleData) => {
  const result = await createRole(roleData)

  if (result.success) {
    showCreateDialog.value = false

    // Log activity
    await logEvent('role_created', {
      roleId: result.id,
      roleName: roleData.name,
      permissions: roleData.permissions?.length || 0,
      hierarchy: roleData.hierarchy
    })

    emit('activity', {
      type: 'role_created',
      message: `Created role: ${roleData.name}`,
      details: {
        roleId: result.id,
        name: roleData.name,
        permissions: roleData.permissions?.length || 0,
        hierarchy: roleData.hierarchy
      }
    })
  }
}

const handleUpdate = async (roleData) => {
  const result = await updateRole(currentRole.value.id, roleData)

  if (result.success) {
    showEditDialog.value = false

    // Log activity
    await logEvent('role_updated', {
      roleId: currentRole.value.id,
      roleName: roleData.name,
      permissions: roleData.permissions?.length || 0,
      hierarchy: roleData.hierarchy
    })

    emit('activity', {
      type: 'role_updated',
      message: `Updated role: ${currentRole.value.name}`,
      details: {
        roleId: currentRole.value.id,
        name: roleData.name,
        permissions: roleData.permissions?.length || 0,
        hierarchy: roleData.hierarchy
      }
    })
  }
}

const handleDelete = async () => {
  const result = await deleteRole(currentRole.value.id)

  if (result.success) {
    showDeleteDialog.value = false

    // Log activity
    await logEvent('role_deleted', {
      roleId: currentRole.value.id,
      roleName: currentRole.value.name
    })

    emit('activity', {
      type: 'role_deleted',
      message: `Deleted role: ${currentRole.value.name}`,
      details: { roleId: currentRole.value.id }
    })
  }
}
</script>

<template>
  <div>
    <!-- Header -->
    <v-toolbar flat color="surface">
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

      <v-select
        v-model="selectedCategory"
        :items="[
          { title: 'All Categories', value: 'all' },
          { title: 'User Management', value: 'user_management' },
          { title: 'Content Management', value: 'content_management' },
          { title: 'Communication', value: 'communication' },
          { title: 'System Management', value: 'system_management' },
          { title: 'Analytics', value: 'analytics' }
        ]"
        label="Filter by category"
        variant="outlined"
        density="compact"
        hide-details
        style="max-width: 250px"
        class="mr-4"
      ></v-select>

      <v-spacer></v-spacer>

      <PermissionGuard permissions="manage_roles">
        <v-btn
          color="primary"
          prepend-icon="mdi-plus"
          @click="startCreateRole"
        >
          Create Role
        </v-btn>
      </PermissionGuard>
    </v-toolbar>

    <!-- Loading State -->
    <v-progress-linear
      v-if="loading"
      indeterminate
      color="primary"
      class="mt-2"
    ></v-progress-linear>

    <!-- Roles Grid -->
    <v-row v-else class="mt-4">
      <v-col
        v-for="role in roles"
        :key="role.id"
        cols="12"
        md="6"
        lg="4"
      >
        <RoleCard
          :role="role"
          :user-count="usersPerRole[role.id] || 0"
          :can-delete="canDeleteRole(role)"
          @edit="startEditRole"
          @clone="startCloneRole"
          @delete="confirmDeleteRole"
        />
      </v-col>
    </v-row>

    <!-- Dialogs -->
    <RoleCreateDialog
      v-model="showCreateDialog"
      :permissions-by-category="permissionsByCategory"
      :categories="permissionCategories"
      :initial-data="createFormData"
      :loading="saving"
      @create="handleCreate"
    />

    <RoleEditDialog
      v-model="showEditDialog"
      :role="currentRole"
      :permissions-by-category="permissionsByCategory"
      :categories="permissionCategories"
      :loading="saving"
      @update="handleUpdate"
    />

    <RoleDeleteDialog
      v-model="showDeleteDialog"
      :role="currentRole"
      :loading="saving"
      @confirm="handleDelete"
    />

    <!-- Snackbar for notifications -->
    <v-snackbar
      v-model="snackbar.show"
      :color="snackbar.color"
      :timeout="3000"
    >
      {{ snackbar.message }}
    </v-snackbar>
  </div>
</template>