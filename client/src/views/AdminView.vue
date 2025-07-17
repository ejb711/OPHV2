<!-- client/src/views/AdminView.vue - Enhanced with debug components -->
<script setup>
import { ref, onMounted, computed } from 'vue'
import { useRouter } from 'vue-router'
import { db, auth } from '../firebase'
import { collection, getDocs, updateDoc, doc } from 'firebase/firestore'
import AppLayout from '../components/AppLayout.vue'
import DebugPermissions from '../components/DebugPermissions.vue'
import PermissionFixer from '../components/PermissionFixer.vue'
import { useAuthStore } from '../stores/auth'

const router = useRouter()
const authStore = useAuthStore()

/* ---------- state ---------- */
const pendingUsers = ref([])
const allUsers = ref([])
const loading = ref(true)
const error = ref('')
const selectedTab = ref('users')
const editingUser = ref(null)
const editDialog = ref(false)
const userSearch = ref('')

/* ---------- computed ---------- */
const userStats = computed(() => {
  const stats = {
    total: allUsers.value.length,
    pending: allUsers.value.filter(u => u.role === 'pending').length,
    active: allUsers.value.filter(u => u.role !== 'pending').length,
    admins: allUsers.value.filter(u => ['admin', 'owner'].includes(u.role)).length,
    users: allUsers.value.filter(u => u.role === 'user').length,
    viewers: allUsers.value.filter(u => u.role === 'viewer').length
  }
  return stats
})

const isOwner = computed(() => authStore.role === 'owner')
const isAdmin = computed(() => ['admin', 'owner'].includes(authStore.role))
const hasDebugIssues = computed(() => authStore.role === 'admin' && authStore.effectivePermissions.length === 0)

/* ---------- lifecycle ---------- */
onMounted(async () => {
  await loadData()
})

/* ---------- data loading ---------- */
async function loadData() {
  try {
    loading.value = true
    
    // Wait for fresh token with custom claims
    await auth.currentUser.getIdToken(true)
    
    // Load all users
    const usersSnap = await getDocs(collection(db, 'users'))
    allUsers.value = usersSnap.docs.map(d => ({ id: d.id, ...d.data() }))
    
    // Filter pending users
    pendingUsers.value = allUsers.value.filter(u => u.role === 'pending')
    
  } catch (err) {
    console.error('Error loading admin data:', err)
    error.value = err.message
  } finally {
    loading.value = false
  }
}

/* ---------- user management ---------- */
async function approveUser(userId, newRole = 'user') {
  try {
    await updateDoc(doc(db, 'users', userId), {
      role: newRole,
      approvedBy: authStore.user.uid,
      approvedAt: new Date(),
      updatedAt: new Date()
    })
    
    // Update local state
    const userIndex = allUsers.value.findIndex(u => u.id === userId)
    if (userIndex !== -1) {
      allUsers.value[userIndex].role = newRole
      allUsers.value[userIndex].approvedBy = authStore.user.uid
      allUsers.value[userIndex].approvedAt = new Date()
    }
    
    // Remove from pending list
    pendingUsers.value = pendingUsers.value.filter(u => u.id !== userId)
    
  } catch (err) {
    console.error('Error approving user:', err)
    error.value = err.message
  }
}

async function updateUserRole(userId, newRole) {
  try {
    await updateDoc(doc(db, 'users', userId), {
      role: newRole,
      updatedBy: authStore.user.uid,
      updatedAt: new Date()
    })
    
    // Update local state
    const userIndex = allUsers.value.findIndex(u => u.id === userId)
    if (userIndex !== -1) {
      allUsers.value[userIndex].role = newRole
      allUsers.value[userIndex].updatedBy = authStore.user.uid
      allUsers.value[userIndex].updatedAt = new Date()
    }
    
    await loadData() // Refresh data
    
  } catch (err) {
    console.error('Error updating user role:', err)
    error.value = err.message
  }
}

function editUser(user) {
  editingUser.value = { ...user }
  editDialog.value = true
}

async function saveUserEdit() {
  try {
    await updateDoc(doc(db, 'users', editingUser.value.id), {
      role: editingUser.value.role,
      customPermissions: editingUser.value.customPermissions || [],
      deniedPermissions: editingUser.value.deniedPermissions || [],
      updatedBy: authStore.user.uid,
      updatedAt: new Date()
    })
    
    editDialog.value = false
    editingUser.value = null
    await loadData()
    
  } catch (err) {
    console.error('Error saving user edit:', err)
    error.value = err.message
  }
}

function getRoleColor(role) {
  switch (role) {
    case 'owner': return 'purple'
    case 'admin': return 'red'
    case 'user': return 'blue'
    case 'viewer': return 'green'
    case 'pending': return 'grey'
    default: return 'grey'
  }
}

function getRoleDisplayName(role) {
  return role.charAt(0).toUpperCase() + role.slice(1)
}
</script>

<template>
  <AppLayout>
    <v-container fluid>
      <!-- Header with stats -->
      <div class="d-flex justify-space-between align-center mb-6">
        <div>
          <h1 class="text-h4 font-weight-bold mb-2">System Administration</h1>
          <p class="text-subtitle-1 text-grey-darken-1">
            Manage users, roles, and system permissions
          </p>
        </div>
        <v-btn
          @click="loadData"
          :loading="loading"
          variant="outlined"
          prepend-icon="mdi-refresh"
        >
          Refresh
        </v-btn>
      </div>

      <!-- Debug Components (when needed) -->
      <div v-if="hasDebugIssues" class="mb-6">
        <v-alert type="warning" variant="tonal" class="mb-4">
          <v-icon>mdi-alert</v-icon>
          <strong>Permission Issue Detected!</strong><br>
          Your admin account has 0 effective permissions. Use the tools below to fix this.
        </v-alert>
        
        <DebugPermissions />
        <PermissionFixer />
      </div>

      <!-- Statistics Cards -->
      <v-row class="mb-6">
        <v-col cols="12" sm="6" md="3">
          <v-card class="statistics-card">
            <v-card-text class="text-center">
              <div class="text-h3 font-weight-bold">{{ userStats.total }}</div>
              <div class="text-subtitle-1">Total Users</div>
            </v-card-text>
          </v-card>
        </v-col>
        <v-col cols="12" sm="6" md="3">
          <v-card class="statistics-card">
            <v-card-text class="text-center">
              <div class="text-h3 font-weight-bold">{{ userStats.pending }}</div>
              <div class="text-subtitle-1">Pending Approval</div>
            </v-card-text>
          </v-card>
        </v-col>
        <v-col cols="12" sm="6" md="3">
          <v-card class="statistics-card">
            <v-card-text class="text-center">
              <div class="text-h3 font-weight-bold">{{ userStats.active }}</div>
              <div class="text-subtitle-1">Active Users</div>
            </v-card-text>
          </v-card>
        </v-col>
        <v-col cols="12" sm="6" md="3">
          <v-card class="statistics-card">
            <v-card-text class="text-center">
              <div class="text-h3 font-weight-bold">{{ userStats.admins }}</div>
              <div class="text-subtitle-1">Administrators</div>
            </v-card-text>
          </v-card>
        </v-col>
      </v-row>

      <!-- Error Display -->
      <v-alert v-if="error" type="error" class="mb-4" dismissible @click:close="error = ''">
        {{ error }}
      </v-alert>

      <!-- Main Content Tabs -->
      <v-card>
        <v-tabs v-model="selectedTab" bg-color="primary">
          <v-tab value="users">
            <v-icon class="mr-2">mdi-account-group</v-icon>
            User Management
          </v-tab>
          <v-tab value="pending">
            <v-icon class="mr-2">mdi-account-clock</v-icon>
            Pending Approval ({{ userStats.pending }})
          </v-tab>
          <v-tab value="system" v-if="isOwner">
            <v-icon class="mr-2">mdi-cog</v-icon>
            System Tools
          </v-tab>
        </v-tabs>

        <v-card-text>
          <v-window v-model="selectedTab">
            <!-- User Management Tab -->
            <v-window-item value="users">
              <div class="d-flex justify-space-between align-center mb-4">
                <h3 class="text-h6">All Users ({{ userStats.total }})</h3>
                <v-text-field
                  v-model="userSearch"
                  prepend-inner-icon="mdi-magnify"
                  label="Search users..."
                  variant="outlined"
                  density="compact"
                  style="max-width: 300px;"
                />
              </div>

              <v-data-table
                :items="allUsers"
                :loading="loading"
                :headers="[
                  { title: 'Email', key: 'email' },
                  { title: 'Role', key: 'role' },
                  { title: 'Created', key: 'createdAt' },
                  { title: 'Last Active', key: 'lastActive' },
                  { title: 'Actions', key: 'actions', sortable: false }
                ]"
                class="elevation-1"
              >
                <template #item.role="{ item }">
                  <v-chip :color="getRoleColor(item.role)" size="small" variant="elevated">
                    {{ getRoleDisplayName(item.role) }}
                  </v-chip>
                </template>

                <template #item.createdAt="{ item }">
                  {{ item.createdAt ? new Date(item.createdAt.seconds * 1000).toLocaleDateString() : 'Unknown' }}
                </template>

                <template #item.lastActive="{ item }">
                  {{ item.lastActive ? new Date(item.lastActive.seconds * 1000).toLocaleDateString() : 'Never' }}
                </template>

                <template #item.actions="{ item }">
                  <v-btn
                    @click="editUser(item)"
                    icon="mdi-pencil"
                    size="small"
                    variant="text"
                    color="primary"
                  />
                  <v-btn
                    v-if="item.role !== 'owner' && authStore.canManageRole(item.role)"
                    icon="mdi-account-cog"
                    size="small"
                    variant="text"
                    color="orange"
                  />
                </template>
              </v-data-table>
            </v-window-item>

            <!-- Pending Approval Tab -->
            <v-window-item value="pending">
              <div class="mb-4">
                <h3 class="text-h6">Users Awaiting Approval ({{ userStats.pending }})</h3>
                <p class="text-body-2 text-grey-darken-1">
                  Review and approve new user accounts
                </p>
              </div>

              <div v-if="pendingUsers.length === 0" class="text-center py-8">
                <v-icon size="64" color="grey">mdi-account-check</v-icon>
                <h3 class="text-h6 mt-4">No Pending Users</h3>
                <p class="text-body-2">All users have been approved!</p>
              </div>

              <v-row v-else>
                <v-col v-for="user in pendingUsers" :key="user.id" cols="12" md="6" lg="4">
                  <v-card variant="outlined">
                    <v-card-title class="d-flex align-center">
                      <v-avatar class="mr-3" color="grey">
                        <v-icon>mdi-account</v-icon>
                      </v-avatar>
                      <div class="text-truncate">
                        {{ user.email }}
                      </div>
                    </v-card-title>
                    
                    <v-card-text>
                      <div class="mb-2">
                        <strong>Joined:</strong> 
                        {{ user.createdAt ? new Date(user.createdAt.seconds * 1000).toLocaleDateString() : 'Unknown' }}
                      </div>
                      <div class="mb-2">
                        <strong>Display Name:</strong> {{ user.displayName || 'Not provided' }}
                      </div>
                    </v-card-text>
                    
                    <v-card-actions>
                      <v-btn
                        @click="approveUser(user.id, 'user')"
                        color="success"
                        variant="elevated"
                        size="small"
                        prepend-icon="mdi-check"
                      >
                        Approve as User
                      </v-btn>
                      <v-menu>
                        <template #activator="{ props }">
                          <v-btn
                            v-bind="props"
                            color="primary"
                            variant="outlined"
                            size="small"
                            append-icon="mdi-chevron-down"
                          >
                            Other Role
                          </v-btn>
                        </template>
                        <v-list>
                          <v-list-item @click="approveUser(user.id, 'admin')" v-if="isOwner">
                            <v-list-item-title>Approve as Admin</v-list-item-title>
                          </v-list-item>
                          <v-list-item @click="approveUser(user.id, 'viewer')">
                            <v-list-item-title>Approve as Viewer</v-list-item-title>
                          </v-list-item>
                        </v-list>
                      </v-menu>
                    </v-card-actions>
                  </v-card>
                </v-col>
              </v-row>
            </v-window-item>

            <!-- System Tools Tab (Owner only) -->
            <v-window-item value="system" v-if="isOwner">
              <div class="mb-4">
                <h3 class="text-h6">System Administration Tools</h3>
                <p class="text-body-2 text-grey-darken-1">
                  Advanced system management and debugging tools
                </p>
              </div>

              <DebugPermissions />
              <PermissionFixer />
              
              <!-- Additional System Tools -->
              <v-card class="mt-4" variant="outlined">
                <v-card-title>
                  <v-icon class="mr-2">mdi-database</v-icon>
                  Database Management
                </v-card-title>
                <v-card-text>
                  <v-row>
                    <v-col cols="12" md="6">
                      <v-btn
                        block
                        variant="outlined"
                        color="info"
                        prepend-icon="mdi-export"
                      >
                        Export User Data
                      </v-btn>
                    </v-col>
                    <v-col cols="12" md="6">
                      <v-btn
                        block
                        variant="outlined"
                        color="warning"
                        prepend-icon="mdi-backup-restore"
                      >
                        Backup System
                      </v-btn>
                    </v-col>
                  </v-row>
                </v-card-text>
              </v-card>
            </v-window-item>
          </v-window>
        </v-card-text>
      </v-card>

      <!-- User Edit Dialog -->
      <v-dialog v-model="editDialog" max-width="600">
        <v-card v-if="editingUser">
          <v-card-title>
            <span class="text-h5">Edit User: {{ editingUser.email }}</span>
          </v-card-title>
          
          <v-card-text>
            <v-select
              v-model="editingUser.role"
              :items="['viewer', 'user', 'admin'].filter(role => authStore.canManageRole(role))"
              label="Role"
              variant="outlined"
            />
            
            <!-- Custom permissions would go here -->
          </v-card-text>
          
          <v-card-actions>
            <v-spacer />
            <v-btn @click="editDialog = false">Cancel</v-btn>
            <v-btn @click="saveUserEdit" color="primary">Save Changes</v-btn>
          </v-card-actions>
        </v-card>
      </v-dialog>
    </v-container>
  </AppLayout>
</template>

<style scoped>
.statistics-card {
  background: linear-gradient(135deg, #1976d2 0%, #0d47a1 100%) !important;
  color: white !important;
}

.statistics-card .v-card-text {
  color: white !important;
}
</style>