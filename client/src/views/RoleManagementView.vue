<!-- client/src/views/RoleManagementView.vue -->
<script setup>
import { ref, onMounted, computed } from 'vue'
import { useRouter } from 'vue-router'
import AppLayout from '../components/AppLayout.vue'
import PermissionGuard from '../components/PermissionGuard.vue'
import { useAuthStore } from '../stores/auth'
import { usePermissionsStore } from '../stores/permissions'
import { usePermissions } from '../composables/usePermissions'

const router = useRouter()
const auth = useAuthStore()
const permissionsStore = usePermissionsStore()
const { canManageUsers, canManageRoles, canManagePermissions } = usePermissions()

/* ---------- state ---------- */
const activeTab = ref('users')
const loading = ref(true)
const selectedUser = ref(null)
const selectedRole = ref(null)
const userDialog = ref(false)
const roleDialog = ref(false)
const confirmDialog = ref(false)
const confirmAction = ref(null)

/* ---------- computed ---------- */
const availableTabs = computed(() => {
  const tabs = []
  if (canManageUsers.value) tabs.push({ value: 'users', title: 'Users', icon: 'mdi-account-group' })
  if (canManageRoles.value) tabs.push({ value: 'roles', title: 'Roles', icon: 'mdi-shield-account' })
  if (canManagePermissions.value) tabs.push({ value: 'permissions', title: 'Permissions', icon: 'mdi-key' })
  return tabs
})

const filteredUsers = computed(() => {
  return permissionsStore.allUsers.filter(user => {
    // Don't show other owners unless current user is owner
    if (user.role === 'owner' && !auth.isOwner) return false
    return true
  })
})

const nonSystemRoles = computed(() => {
  return permissionsStore.allRoles.filter(role => !role.isSystemRole || auth.isOwner)
})

/* ---------- lifecycle ---------- */
onMounted(async () => {
  await permissionsStore.loadAllData()
  loading.value = false
})

/* ---------- user management ---------- */
const userForm = ref({
  role: 'user',
  customPermissions: [],
  deniedPermissions: []
})

function openUserDialog(user = null) {
  selectedUser.value = user
  if (user) {
    userForm.value = {
      role: user.role,
      customPermissions: [...(user.customPermissions || [])],
      deniedPermissions: [...(user.deniedPermissions || [])]
    }
  } else {
    userForm.value = {
      role: 'user',
      customPermissions: [],
      deniedPermissions: []
    }
  }
  userDialog.value = true
}

async function saveUser() {
  if (!selectedUser.value) return

  const result = await permissionsStore.updateUserRole(
    selectedUser.value.id, 
    userForm.value.role
  )
  
  if (result.success) {
    await permissionsStore.updateUserCustomPermissions(
      selectedUser.value.id,
      userForm.value.customPermissions,
      userForm.value.deniedPermissions
    )
    userDialog.value = false
    await auth.refreshPermissions() // Refresh current user's permissions if they were modified
  }
}

function getUserEffectivePermissions(user) {
  return permissionsStore.getUserEffectivePermissions(user)
}

/* ---------- role management ---------- */
const roleForm = ref({
  id: '',
  name: '',
  hierarchy: 1,
  permissions: []
})

function openRoleDialog(role = null) {
  selectedRole.value = role
  if (role) {
    roleForm.value = {
      id: role.id,
      name: role.name,
      hierarchy: role.hierarchy,
      permissions: [...role.permissions]
    }
  } else {
    roleForm.value = {
      id: '',
      name: '',
      hierarchy: 1,
      permissions: []
    }
  }
  roleDialog.value = true
}

async function saveRole() {
  if (selectedRole.value) {
    // Update existing role
    const result = await permissionsStore.updateRolePermissions(
      selectedRole.value.id,
      roleForm.value.permissions
    )
    if (result.success) {
      roleDialog.value = false
    }
  } else {
    // Create new role
    const result = await permissionsStore.createRole({
      name: roleForm.value.name,
      hierarchy: roleForm.value.hierarchy,
      permissions: roleForm.value.permissions
    })
    if (result.success) {
      roleDialog.value = false
    }
  }
}

function confirmDeleteRole(role) {
  confirmAction.value = () => permissionsStore.deleteRole(role.id)
  confirmDialog.value = true
}

/* ---------- permission helpers ---------- */
function togglePermission(permissionId, array) {
  const index = array.indexOf(permissionId)
  if (index === -1) {
    array.push(permissionId)
  } else {
    array.splice(index, 1)
  }
}

function getRoleBadgeColor(role) {
  switch (role) {
    case 'owner': return 'purple'
    case 'admin': return 'red'
    case 'user': return 'blue'
    case 'viewer': return 'green'
    case 'pending': return 'orange'
    default: return 'grey'
  }
}

function getPermissionCategoryColor(category) {
  switch (category) {
    case 'user_management': return 'red'
    case 'content_management': return 'blue'
    case 'system_management': return 'purple'
    case 'feature_access': return 'green'
    default: return 'grey'
  }
}
</script>

<template>
  <AppLayout>
    <template #actions>
      <v-btn color="accent" variant="flat" @click="router.push('/dash')">
        Back to Dashboard
      </v-btn>
    </template>

    <div class="d-flex justify-space-between align-center mb-6">
      <h1 class="text-h4">Role & Permission Management</h1>
    </div>

    <v-card v-if="loading">
      <v-card-text class="text-center pa-8">
        <v-progress-circular indeterminate size="50" />
        <div class="mt-4">Loading management data...</div>
      </v-card-text>
    </v-card>

    <v-card v-else>
      <v-tabs v-model="activeTab" bg-color="primary">
        <v-tab 
          v-for="tab in availableTabs" 
          :key="tab.value" 
          :value="tab.value"
        >
          <v-icon start>{{ tab.icon }}</v-icon>
          {{ tab.title }}
        </v-tab>
      </v-tabs>

      <v-card-text>
        <!-- USERS TAB -->
        <v-window-item v-if="activeTab === 'users'" value="users">
          <PermissionGuard permission="manage_users">
            <div class="d-flex justify-space-between align-center mb-4">
              <h3 class="text-h6">User Management</h3>
            </div>

            <v-data-table
              :items="filteredUsers"
              :headers="[
                { title: 'Email', key: 'email' },
                { title: 'Role', key: 'role' },
                { title: 'Custom Permissions', key: 'customPermissions' },
                { title: 'Last Active', key: 'lastActive' },
                { title: 'Actions', key: 'actions', sortable: false }
              ]"
              item-value="id"
            >
              <template #item.role="{ item }">
                <v-chip :color="getRoleBadgeColor(item.role)" size="small">
                  {{ item.role }}
                </v-chip>
              </template>

              <template #item.customPermissions="{ item }">
                <v-chip-group v-if="item.customPermissions?.length">
                  <v-chip
                    v-for="permission in item.customPermissions.slice(0, 2)"
                    :key="permission"
                    size="x-small"
                    color="blue"
                  >
                    {{ permission }}
                  </v-chip>
                  <v-chip
                    v-if="item.customPermissions.length > 2"
                    size="x-small"
                    color="grey"
                  >
                    +{{ item.customPermissions.length - 2 }}
                  </v-chip>
                </v-chip-group>
                <span v-else class="text-grey">None</span>
              </template>

              <template #item.lastActive="{ item }">
                {{ item.lastActive ? new Date(item.lastActive.toDate()).toLocaleDateString() : 'Never' }}
              </template>

              <template #item.actions="{ item }">
                <v-btn
                  v-if="auth.canManageRole(item.role)"
                  icon="mdi-pencil"
                  size="small"
                  variant="text"
                  @click="openUserDialog(item)"
                />
              </template>
            </v-data-table>
          </PermissionGuard>
        </v-window-item>

        <!-- ROLES TAB -->
        <v-window-item v-if="activeTab === 'roles'" value="roles">
          <PermissionGuard permission="manage_roles">
            <div class="d-flex justify-space-between align-center mb-4">
              <h3 class="text-h6">Role Management</h3>
              <v-btn color="primary" @click="openRoleDialog()">
                <v-icon start>mdi-plus</v-icon>
                Create Role
              </v-btn>
            </div>

            <v-row>
              <v-col v-for="role in nonSystemRoles" :key="role.id" cols="12" md="6">
                <v-card>
                  <v-card-title class="d-flex justify-space-between">
                    <span>{{ role.name }}</span>
                    <v-chip :color="getRoleBadgeColor(role.id)" size="small">
                      {{ role.id }}
                    </v-chip>
                  </v-card-title>
                  
                  <v-card-text>
                    <div class="mb-2">
                      <strong>Hierarchy:</strong> {{ role.hierarchy }}
                    </div>
                    <div class="mb-2">
                      <strong>Permissions:</strong> {{ role.permissions?.length || 0 }}
                    </div>
                    
                    <v-chip-group v-if="role.permissions?.length">
                      <v-chip
                        v-for="permission in role.permissions.slice(0, 3)"
                        :key="permission"
                        size="small"
                        color="blue"
                      >
                        {{ permission }}
                      </v-chip>
                      <v-chip
                        v-if="role.permissions.length > 3"
                        size="small"
                        color="grey"
                      >
                        +{{ role.permissions.length - 3 }}
                      </v-chip>
                    </v-chip-group>
                  </v-card-text>
                  
                  <v-card-actions>
                    <v-btn
                      variant="text"
                      color="primary"
                      @click="openRoleDialog(role)"
                    >
                      Edit Permissions
                    </v-btn>
                    <v-btn
                      v-if="!role.isSystemRole"
                      variant="text"
                      color="error"
                      @click="confirmDeleteRole(role)"
                    >
                      Delete
                    </v-btn>
                  </v-card-actions>
                </v-card>
              </v-col>
            </v-row>
          </PermissionGuard>
        </v-window-item>

        <!-- PERMISSIONS TAB -->
        <v-window-item v-if="activeTab === 'permissions'" value="permissions">
          <PermissionGuard permission="manage_permissions">
            <h3 class="text-h6 mb-4">System Permissions</h3>
            
            <div v-for="(permissions, category) in permissionsStore.permissionsByCategory" :key="category">
              <h4 class="text-subtitle-1 mb-2 text-capitalize">
                <v-chip :color="getPermissionCategoryColor(category)" size="small" class="mr-2">
                  {{ category.replace('_', ' ') }}
                </v-chip>
              </h4>
              
              <v-row class="mb-4">
                <v-col v-for="permission in permissions" :key="permission.id" cols="12" md="6">
                  <v-card variant="outlined">
                    <v-card-text>
                      <div class="font-weight-bold">{{ permission.name }}</div>
                      <div class="text-caption text-grey">{{ permission.description }}</div>
                      <v-chip class="mt-2" size="x-small" color="grey">
                        {{ permission.id }}
                      </v-chip>
                    </v-card-text>
                  </v-card>
                </v-col>
              </v-row>
            </div>
          </PermissionGuard>
        </v-window-item>
      </v-card-text>
    </v-card>

    <!-- USER EDIT DIALOG -->
    <v-dialog v-model="userDialog" max-width="600px">
      <v-card>
        <v-card-title>
          Edit User: {{ selectedUser?.email }}
        </v-card-title>
        
        <v-card-text>
          <v-select
            v-model="userForm.role"
            :items="permissionsStore.allRoles.filter(r => auth.canManageRole(r.id))"
            item-title="name"
            item-value="id"
            label="Role"
            class="mb-4"
          />
          
          <h4 class="mb-2">Custom Permissions</h4>
          <div v-for="(permissions, category) in permissionsStore.permissionsByCategory" :key="category" class="mb-4">
            <v-label class="text-subtitle-2 mb-2">{{ category.replace('_', ' ') }}</v-label>
            <div class="d-flex flex-wrap ga-1">
              <v-chip
                v-for="permission in permissions"
                :key="permission.id"
                :color="userForm.customPermissions.includes(permission.id) ? 'green' : 'default'"
                size="small"
                clickable
                @click="togglePermission(permission.id, userForm.customPermissions)"
              >
                {{ permission.name }}
              </v-chip>
            </div>
          </div>
          
          <h4 class="mb-2">Denied Permissions</h4>
          <div v-for="(permissions, category) in permissionsStore.permissionsByCategory" :key="category" class="mb-4">
            <v-label class="text-subtitle-2 mb-2">{{ category.replace('_', ' ') }}</v-label>
            <div class="d-flex flex-wrap ga-1">
              <v-chip
                v-for="permission in permissions"
                :key="permission.id"
                :color="userForm.deniedPermissions.includes(permission.id) ? 'red' : 'default'"
                size="small"
                clickable
                @click="togglePermission(permission.id, userForm.deniedPermissions)"
              >
                {{ permission.name }}
              </v-chip>
            </div>
          </div>
        </v-card-text>
        
        <v-card-actions>
          <v-spacer />
          <v-btn @click="userDialog = false">Cancel</v-btn>
          <v-btn color="primary" @click="saveUser">Save</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- ROLE EDIT DIALOG -->
    <v-dialog v-model="roleDialog" max-width="800px">
      <v-card>
        <v-card-title>
          {{ selectedRole ? 'Edit Role' : 'Create Role' }}
        </v-card-title>
        
        <v-card-text>
          <v-text-field
            v-model="roleForm.name"
            label="Role Name"
            :disabled="selectedRole?.isSystemRole"
            class="mb-4"
          />
          
          <v-text-field
            v-model.number="roleForm.hierarchy"
            label="Hierarchy Level"
            type="number"
            hint="Higher numbers have more authority"
            class="mb-4"
          />
          
          <h4 class="mb-2">Role Permissions</h4>
          <div v-for="(permissions, category) in permissionsStore.permissionsByCategory" :key="category" class="mb-4">
            <v-label class="text-subtitle-2 mb-2">{{ category.replace('_', ' ') }}</v-label>
            <div class="d-flex flex-wrap ga-1">
              <v-chip
                v-for="permission in permissions"
                :key="permission.id"
                :color="roleForm.permissions.includes(permission.id) ? 'blue' : 'default'"
                size="small"
                clickable
                @click="togglePermission(permission.id, roleForm.permissions)"
              >
                {{ permission.name }}
              </v-chip>
            </div>
          </div>
        </v-card-text>
        
        <v-card-actions>
          <v-spacer />
          <v-btn @click="roleDialog = false">Cancel</v-btn>
          <v-btn color="primary" @click="saveRole">Save</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- CONFIRM DIALOG -->
    <v-dialog v-model="confirmDialog" max-width="400px">
      <v-card>
        <v-card-title>Confirm Action</v-card-title>
        <v-card-text>
          Are you sure you want to perform this action? This cannot be undone.
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn @click="confirmDialog = false">Cancel</v-btn>
          <v-btn 
            color="error" 
            @click="confirmAction?.(); confirmDialog = false"
          >
            Confirm
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </AppLayout>
</template>