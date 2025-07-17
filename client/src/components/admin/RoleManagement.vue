<!-- client/src/components/admin/RoleManagement.vue -->
<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { collection, doc, onSnapshot, query, orderBy } from 'firebase/firestore'
import { db } from '../../firebase'
import { useAuthStore } from '../../stores/auth'
import { usePermissionsStore } from '../../stores/permissions'
import PermissionGuard from '../PermissionGuard.vue'

const emit = defineEmits(['activity'])

const authStore = useAuthStore()
const permissionsStore = usePermissionsStore()

/* ---------- state ---------- */
const loading = ref(true)
const saving = ref(false)
const search = ref('')
const selectedCategory = ref('all')
const expandedPanels = ref([])

// Dialogs
const showCreateDialog = ref(false)
const showEditDialog = ref(false)
const showDeleteDialog = ref(false)
const showCloneDialog = ref(false)

// Current role being edited/deleted
const currentRole = ref(null)

// Forms
const createForm = ref({
  name: '',
  description: '',
  permissions: [], // Always initialize as empty array
  hierarchy: 2
})

const editForm = ref({
  name: '',
  description: '',
  permissions: [], // Always initialize as empty array
  hierarchy: 2
})

// Snackbar for notifications
const snackbar = ref({
  show: false,
  message: '',
  color: 'success'
})

// Real-time listener
let unsubscribe = null

/* ---------- computed ---------- */
const roles = computed(() => {
  let filtered = permissionsStore.allRoles

  // Search filter
  if (search.value) {
    const searchLower = search.value.toLowerCase()
    filtered = filtered.filter(role =>
      role.name.toLowerCase().includes(searchLower) ||
      role.description?.toLowerCase().includes(searchLower)
    )
  }

  // Sort by hierarchy
  return filtered.sort((a, b) => (b.hierarchy || 0) - (a.hierarchy || 0))
})

const permissions = computed(() => permissionsStore.allPermissions)
const permissionsByCategory = computed(() => permissionsStore.permissionsByCategory)

const permissionCategories = computed(() => {
  const categories = Object.keys(permissionsByCategory.value).filter(cat => 
    cat && permissionsByCategory.value[cat] && permissionsByCategory.value[cat].length > 0
  )
  if (selectedCategory.value === 'all') return categories
  return categories.filter(cat => cat === selectedCategory.value)
})

const usersPerRole = computed(() => {
  const counts = {}
  permissionsStore.allUsers.forEach(user => {
    counts[user.role] = (counts[user.role] || 0) + 1
  })
  return counts
})

const canDeleteRole = (role) => {
  // Cannot delete system roles
  if (role.isSystemRole) return false
  // Cannot delete if users have this role
  if (usersPerRole.value[role.id] > 0) return false
  return true
}

/* ---------- lifecycle ---------- */
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
      console.error('Error listening to roles:', error)
      showSnackbar('Error loading roles', 'error')
    })
  } catch (error) {
    console.error('Error loading data:', error)
    showSnackbar('Error loading role data', 'error')
  } finally {
    loading.value = false
  }
})

onUnmounted(() => {
  if (unsubscribe) unsubscribe()
})

/* ---------- methods ---------- */
function startCreateRole() {
  createForm.value = {
    name: '',
    description: '',
    permissions: [], // Ensure it's an array
    hierarchy: 2
  }
  expandedPanels.value = [] // Reset expanded panels
  showCreateDialog.value = true
}

function startEditRole(role) {
  currentRole.value = role
  editForm.value = {
    name: role.name,
    description: role.description || '',
    permissions: Array.isArray(role.permissions) ? [...role.permissions] : [], // Ensure it's an array
    hierarchy: role.hierarchy || 2
  }
  expandedPanels.value = [] // Reset expanded panels
  showEditDialog.value = true
}

function startCloneRole(role) {
  createForm.value = {
    name: `${role.name} (Copy)`,
    description: role.description || '',
    permissions: Array.isArray(role.permissions) ? [...role.permissions] : [], // Ensure it's an array
    hierarchy: role.hierarchy || 2
  }
  expandedPanels.value = [] // Reset expanded panels
  showCreateDialog.value = true
}

function confirmDeleteRole(role) {
  if (!canDeleteRole(role)) {
    showSnackbar('Cannot delete this role', 'error')
    return
  }
  currentRole.value = role
  showDeleteDialog.value = true
}

async function createRole() {
  saving.value = true
  
  // Ensure permissions is an array
  if (!Array.isArray(createForm.value.permissions)) {
    createForm.value.permissions = []
  }
  
  const result = await permissionsStore.createRole(createForm.value)
  
  if (result.success) {
    showSnackbar('Role created successfully')
    showCreateDialog.value = false
    
    // Log activity with cleaned details
    emit('activity', {
      type: 'role_created',
      message: `Created role: ${createForm.value.name}`,
      details: { 
        roleId: result.id || 'unknown', 
        name: createForm.value.name || 'unknown',
        permissions: createForm.value.permissions?.length || 0
      }
    })
  } else {
    showSnackbar(result.error || 'Failed to create role', 'error')
  }
  
  saving.value = false
}

async function updateRole() {
  saving.value = true
  
  // Ensure permissions is an array
  if (!Array.isArray(editForm.value.permissions)) {
    editForm.value.permissions = []
  }
  
  const result = await permissionsStore.updateRolePermissions(
    currentRole.value.id,
    editForm.value.permissions
  )
  
  if (result.success) {
    showSnackbar('Role updated successfully')
    showEditDialog.value = false
    
    // Log activity with cleaned details
    emit('activity', {
      type: 'role_updated',
      message: `Updated role: ${currentRole.value.name}`,
      details: { 
        roleId: currentRole.value.id || 'unknown',
        name: currentRole.value.name || 'unknown',
        permissionCount: editForm.value.permissions?.length || 0
      }
    })
  } else {
    showSnackbar(result.error || 'Failed to update role', 'error')
  }
  
  saving.value = false
}

async function deleteRole() {
  saving.value = true
  
  const result = await permissionsStore.deleteRole(currentRole.value.id)
  
  if (result.success) {
    showSnackbar('Role deleted successfully')
    showDeleteDialog.value = false
    
    // Log activity
    emit('activity', {
      type: 'role_deleted',
      message: `Deleted role: ${currentRole.value.name}`,
      details: { 
        roleId: currentRole.value.id || 'unknown',
        name: currentRole.value.name || 'unknown'
      }
    })
  } else {
    showSnackbar(result.error || 'Failed to delete role', 'error')
  }
  
  saving.value = false
}

function togglePermission(permissionId, formPermissions) {
  // Ensure formPermissions is an array
  if (!Array.isArray(formPermissions)) {
    console.error('formPermissions is not an array:', formPermissions)
    return
  }
  
  const index = formPermissions.indexOf(permissionId)
  if (index > -1) {
    formPermissions.splice(index, 1)
  } else {
    formPermissions.push(permissionId)
  }
}

function toggleAllInCategory(category, formPermissions) {
  // Ensure formPermissions is an array
  if (!Array.isArray(formPermissions)) {
    console.error('formPermissions is not an array:', formPermissions)
    return
  }
  
  if (!permissionsByCategory.value[category]) return
  
  const categoryPerms = permissionsByCategory.value[category].map(p => p.id)
  const hasAll = categoryPerms.every(p => formPermissions.includes(p))
  
  if (hasAll) {
    // Remove all
    categoryPerms.forEach(p => {
      const index = formPermissions.indexOf(p)
      if (index > -1) formPermissions.splice(index, 1)
    })
  } else {
    // Add all missing
    const toAdd = categoryPerms.filter(p => !formPermissions.includes(p))
    formPermissions.push(...toAdd)
  }
}

function showSnackbar(message, color = 'success') {
  snackbar.value = { show: true, message, color }
}

function formatPermissionName(permission) {
  return permission.name.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())
}

function getCategoryIcon(category) {
  const icons = {
    user_management: 'mdi-account-group',
    content_management: 'mdi-folder-edit',
    communication: 'mdi-forum',
    system_management: 'mdi-cog',
    analytics: 'mdi-chart-box'
  }
  return icons[category] || 'mdi-key'
}

function getRoleColor(role) {
  const colors = {
    owner: 'purple',
    admin: 'blue',
    user: 'green',
    viewer: 'orange',
    pending: 'grey'
  }
  return colors[role.id] || 'primary'
}
</script>

<template>
  <div>
    <!-- Header Toolbar -->
    <v-toolbar flat color="transparent">
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
        <v-card
          :color="role.isSystemRole ? getRoleColor(role) : 'surface'"
          :variant="role.isSystemRole ? 'tonal' : 'elevated'"
          class="h-100"
        >
          <v-card-title class="d-flex align-center">
            <v-icon size="small" class="mr-2">
              {{ role.isSystemRole ? 'mdi-shield-lock' : 'mdi-shield-account' }}
            </v-icon>
            {{ role.name }}
            <v-spacer></v-spacer>
            <v-chip size="small" variant="elevated">
              {{ usersPerRole[role.id] || 0 }} users
            </v-chip>
          </v-card-title>

          <v-card-subtitle v-if="role.description">
            {{ role.description }}
          </v-card-subtitle>

          <v-card-text>
            <div class="text-body-2 mb-2">
              <strong>Hierarchy Level:</strong> {{ role.hierarchy || 0 }}
            </div>
            
            <div class="text-body-2 mb-2">
              <strong>Permissions:</strong> {{ role.permissions?.length || 0 }}
            </div>

            <!-- Permission Preview -->
            <v-chip-group>
              <v-chip
                v-for="(perm, idx) in (role.permissions || []).slice(0, 4)"
                :key="perm"
                size="x-small"
                label
              >
                {{ perm }}
              </v-chip>
              <v-chip
                v-if="(role.permissions || []).length > 4"
                size="x-small"
                variant="tonal"
              >
                +{{ role.permissions.length - 4 }} more
              </v-chip>
            </v-chip-group>
          </v-card-text>

          <v-card-actions>
            <PermissionGuard permissions="manage_roles">
              <v-btn
                variant="text"
                size="small"
                @click="startEditRole(role)"
                :disabled="role.id === 'owner'"
              >
                <v-icon size="small" class="mr-1">mdi-pencil</v-icon>
                Edit
              </v-btn>

              <v-btn
                variant="text"
                size="small"
                @click="startCloneRole(role)"
              >
                <v-icon size="small" class="mr-1">mdi-content-copy</v-icon>
                Clone
              </v-btn>

              <v-btn
                v-if="!role.isSystemRole"
                variant="text"
                size="small"
                color="error"
                @click="confirmDeleteRole(role)"
                :disabled="!canDeleteRole(role)"
              >
                <v-icon size="small" class="mr-1">mdi-delete</v-icon>
                Delete
              </v-btn>
            </PermissionGuard>
          </v-card-actions>
        </v-card>
      </v-col>
    </v-row>

    <!-- Create/Clone Role Dialog -->
    <v-dialog v-model="showCreateDialog" max-width="800" persistent>
      <v-card>
        <v-card-title class="text-h5">
          {{ createForm.name.includes('(Copy)') ? 'Clone Role' : 'Create New Role' }}
        </v-card-title>

        <v-card-text>
          <v-row>
            <v-col cols="12" md="6">
              <v-text-field
                v-model="createForm.name"
                label="Role Name"
                variant="outlined"
                required
                :rules="[v => !!v || 'Name is required']"
              ></v-text-field>
            </v-col>

            <v-col cols="12" md="6">
              <v-select
                v-model="createForm.hierarchy"
                :items="[
                  { title: 'Level 3 (High)', value: 3 },
                  { title: 'Level 2 (Medium)', value: 2 },
                  { title: 'Level 1 (Low)', value: 1 }
                ]"
                label="Hierarchy Level"
                variant="outlined"
              ></v-select>
            </v-col>

            <v-col cols="12">
              <v-textarea
                v-model="createForm.description"
                label="Description"
                variant="outlined"
                rows="2"
              ></v-textarea>
            </v-col>
          </v-row>

          <v-divider class="my-4"></v-divider>

          <div class="text-h6 mb-3">Permissions</div>

          <v-expansion-panels v-model="expandedPanels" multiple>
            <v-expansion-panel
              v-for="category in permissionCategories"
              :key="category"
            >
              <v-expansion-panel-title>
                <div class="d-flex align-center">
                  <v-icon size="small" class="mr-2">
                    {{ getCategoryIcon(category) }}
                  </v-icon>
                  {{ category.replace(/_/g, ' ').toUpperCase() }}
                  <v-spacer></v-spacer>
                  <v-chip size="x-small" class="mr-2">
                    {{ permissionsByCategory[category]?.filter(p => 
                      createForm.permissions.includes(p.id)
                    ).length || 0 }} / {{ permissionsByCategory[category]?.length || 0 }}
                  </v-chip>
                </div>
              </v-expansion-panel-title>

              <v-expansion-panel-text>
                <v-list density="compact">
                  <v-list-item>
                    <v-checkbox
                      :model-value="permissionsByCategory[category] && permissionsByCategory[category].every(p => 
                        createForm.permissions.includes(p.id)
                      )"
                      @change="toggleAllInCategory(category, createForm.permissions)"
                      label="Select All"
                      density="compact"
                      hide-details
                    ></v-checkbox>
                  </v-list-item>

                  <v-divider class="my-2"></v-divider>

                  <v-list-item
                    v-for="permission in (permissionsByCategory[category] || [])"
                    :key="permission.id"
                  >
                    <v-checkbox
                      :model-value="createForm.permissions.includes(permission.id)"
                      @change="togglePermission(permission.id, createForm.permissions)"
                      density="compact"
                      hide-details
                    >
                      <template v-slot:label>
                        <div>
                          <div class="font-weight-medium">{{ permission.name }}</div>
                          <div class="text-caption text-medium-emphasis">
                            {{ permission.description }}
                          </div>
                        </div>
                      </template>
                    </v-checkbox>
                  </v-list-item>
                </v-list>
              </v-expansion-panel-text>
            </v-expansion-panel>
          </v-expansion-panels>
        </v-card-text>

        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn
            variant="text"
            @click="showCreateDialog = false"
            :disabled="saving"
          >
            Cancel
          </v-btn>
          <v-btn
            color="primary"
            variant="flat"
            @click="createRole"
            :loading="saving"
            :disabled="!createForm.name"
          >
            Create Role
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Edit Role Dialog -->
    <v-dialog v-model="showEditDialog" max-width="800" persistent>
      <v-card>
        <v-card-title class="text-h5">
          Edit Role: {{ currentRole?.name }}
        </v-card-title>

        <v-card-text>
          <v-alert
            v-if="currentRole?.isSystemRole"
            type="info"
            variant="tonal"
            class="mb-4"
          >
            <strong>System Role:</strong> Only permissions can be modified for system roles.
          </v-alert>

          <div class="text-h6 mb-3">Permissions</div>

          <v-expansion-panels v-model="expandedPanels" multiple>
            <v-expansion-panel
              v-for="category in permissionCategories"
              :key="category"
            >
              <v-expansion-panel-title>
                <div class="d-flex align-center">
                  <v-icon size="small" class="mr-2">
                    {{ getCategoryIcon(category) }}
                  </v-icon>
                  {{ category.replace(/_/g, ' ').toUpperCase() }}
                  <v-spacer></v-spacer>
                  <v-chip size="x-small" class="mr-2">
                    {{ permissionsByCategory[category]?.filter(p => 
                      editForm.permissions.includes(p.id)
                    ).length || 0 }} / {{ permissionsByCategory[category]?.length || 0 }}
                  </v-chip>
                </div>
              </v-expansion-panel-title>

              <v-expansion-panel-text>
                <v-list density="compact">
                  <v-list-item>
                    <v-checkbox
                      :model-value="permissionsByCategory[category] && permissionsByCategory[category].every(p => 
                        editForm.permissions.includes(p.id)
                      )"
                      @change="toggleAllInCategory(category, editForm.permissions)"
                      label="Select All"
                      density="compact"
                      hide-details
                    ></v-checkbox>
                  </v-list-item>

                  <v-divider class="my-2"></v-divider>

                  <v-list-item
                    v-for="permission in (permissionsByCategory[category] || [])"
                    :key="permission.id"
                  >
                    <v-checkbox
                      :model-value="editForm.permissions.includes(permission.id)"
                      @change="togglePermission(permission.id, editForm.permissions)"
                      density="compact"
                      hide-details
                    >
                      <template v-slot:label>
                        <div>
                          <div class="font-weight-medium">{{ permission.name }}</div>
                          <div class="text-caption text-medium-emphasis">
                            {{ permission.description }}
                          </div>
                        </div>
                      </template>
                    </v-checkbox>
                  </v-list-item>
                </v-list>
              </v-expansion-panel-text>
            </v-expansion-panel>
          </v-expansion-panels>
        </v-card-text>

        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn
            variant="text"
            @click="showEditDialog = false"
            :disabled="saving"
          >
            Cancel
          </v-btn>
          <v-btn
            color="primary"
            variant="flat"
            @click="updateRole"
            :loading="saving"
          >
            Update Role
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Delete Role Confirmation -->
    <v-dialog v-model="showDeleteDialog" max-width="500">
      <v-card>
        <v-card-title class="text-h5">
          Delete Role?
        </v-card-title>
        
        <v-card-text>
          Are you sure you want to delete the role "{{ currentRole?.name }}"? 
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
            @click="deleteRole"
            :loading="saving"
          >
            Delete
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

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

<style scoped>
/* Add any custom styles if needed */
</style>