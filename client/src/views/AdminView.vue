<!-- client/src/views/AdminView.vue - Enhanced Admin Panel with Fixed Audit Logging and Create User Handler -->
<script setup>
import { ref, onMounted, computed, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { db, auth } from '../firebase'
import { collection, onSnapshot, addDoc, serverTimestamp } from 'firebase/firestore'
import { createUserWithEmailAndPassword } from 'firebase/auth'
import AppLayout from '../components/AppLayout.vue'
import UserManagement from '../components/admin/UserManagement.vue'
import RoleManagement from '../components/admin/RoleManagement.vue'
import PermissionMatrix from '../components/admin/PermissionMatrix.vue'
import SystemLogs from '../components/admin/SystemLogs.vue'
import RetentionMonitor from '../components/admin/RetentionMonitor.vue'
import { useAuthStore } from '../stores/auth'
import { usePermissionsStore } from '../stores/permissions'
import { useAudit } from '../composables/useAudit'

const router = useRouter()
const authStore = useAuthStore()
const permissionsStore = usePermissionsStore()
const { log, logEvent } = useAudit()

/* ---------- state ---------- */
const selectedTab = ref('users')
const loading = ref(true)
const error = ref('')
const stats = ref({
  totalUsers: 0,
  pendingUsers: 0,
  activeUsers: 0,
  totalRoles: 0,
  totalPermissions: 0,
  recentActivity: 0
})

// Create user dialog state
const showCreateUserDialog = ref(false)
const creatingUser = ref(false)
const createUserForm = ref({
  email: '',
  password: '',
  role: 'user',
  sendEmail: true
})

const snackbar = ref({
  show: false,
  message: '',
  color: 'success'
})

// Unsubscribe functions for listeners
let unsubscribeUsers = null
let unsubscribeLogs = null

/* ---------- computed ---------- */
const tabs = computed(() => [
  { 
    value: 'users', 
    title: 'User Management', 
    icon: 'mdi-account-group',
    permission: 'manage_users',
    description: 'Manage user accounts, roles, and permissions'
  },
  { 
    value: 'roles', 
    title: 'Role Management', 
    icon: 'mdi-shield-account',
    permission: 'manage_roles',
    description: 'Create and modify user roles'
  },
  { 
    value: 'permissions', 
    title: 'Permission Matrix', 
    icon: 'mdi-key-variant',
    permission: 'manage_permissions',
    description: 'View and manage permission assignments'
  },
  { 
    value: 'logs', 
    title: 'System Logs', 
    icon: 'mdi-history',
    permission: 'view_audit_logs',
    description: 'View system activity and audit logs'
  },
  { 
    value: 'retention', 
    title: 'Data Retention', 
    icon: 'mdi-database-clock',
    permission: 'manage_system',
    description: 'Monitor and manage data retention policies'
  }
])

const availableTabs = computed(() => 
  tabs.value.filter(tab => authStore.hasPermission(tab.permission))
)

const availableRoles = computed(() => 
  permissionsStore.allRoles.filter(role => authStore.canManageRole(role.id))
)

/* ---------- lifecycle ---------- */
onMounted(async () => {
  try {
    // Log admin access using the correct pattern
    await log.adminPanelAccessed({
      timestamp: new Date().toISOString(),
      userAgent: navigator.userAgent
    })

    await loadStatistics()
    
    // Auto-select first available tab if current selection isn't accessible
    if (!availableTabs.value.find(tab => tab.value === selectedTab.value)) {
      selectedTab.value = availableTabs.value[0]?.value || 'users'
    }
  } catch (e) {
    console.error('Error initializing admin panel:', e)
    error.value = 'Failed to load admin panel'
  } finally {
    loading.value = false
  }
})

onUnmounted(() => {
  if (unsubscribeUsers) unsubscribeUsers()
  if (unsubscribeLogs) unsubscribeLogs()
})

/* ---------- data loading ---------- */
async function loadStatistics() {
  try {
    // Set up real-time listeners for statistics
    unsubscribeUsers = onSnapshot(collection(db, 'users'), (snapshot) => {
      const users = snapshot.docs.map(doc => doc.data())
      stats.value.totalUsers = users.length
      stats.value.pendingUsers = users.filter(u => u.role === 'pending').length
      stats.value.activeUsers = users.filter(u => u.status === 'active').length
    })

    // Load other statistics
    stats.value.totalRoles = permissionsStore.allRoles.length
    stats.value.totalPermissions = permissionsStore.allPermissions.length

  } catch (e) {
    console.error('Error loading statistics:', e)
  }
}

/* ---------- create user functionality ---------- */
function handleCreateUser() {
  console.log('Create user clicked')
  resetCreateUserForm()
  showCreateUserDialog.value = true
}

function resetCreateUserForm() {
  createUserForm.value = {
    email: '',
    password: '',
    role: 'user',
    sendEmail: true
  }
}

async function createUser() {
  if (!createUserForm.value.email || !createUserForm.value.password) {
    showSnackbar('Email and password are required', 'error')
    return
  }

  creatingUser.value = true
  try {
    // Create the user document in Firestore first
    const userData = {
      email: createUserForm.value.email,
      role: createUserForm.value.role,
      status: 'active',
      customPermissions: [],
      deniedPermissions: [],
      createdAt: serverTimestamp(),
      createdBy: auth.currentUser.uid,
      notes: `Created by admin: ${auth.currentUser.email}`
    }

    // Add user document to Firestore
    const userDocRef = await addDoc(collection(db, 'users'), userData)
    console.log('User document created:', userDocRef.id)

    // Log the activity using the correct pattern
    await log.userCreated({
      userId: userDocRef.id,
      email: createUserForm.value.email,
      role: createUserForm.value.role,
      createdBy: auth.currentUser.email
    })

    showSnackbar(`User ${createUserForm.value.email} created successfully`, 'success')
    showCreateUserDialog.value = false

  } catch (error) {
    console.error('Error creating user:', error)
    let errorMessage = 'Failed to create user'
    
    if (error.code === 'auth/email-already-in-use') {
      errorMessage = 'Email address is already in use'
    } else if (error.code === 'auth/weak-password') {
      errorMessage = 'Password is too weak'
    } else if (error.code === 'auth/invalid-email') {
      errorMessage = 'Invalid email address'
    }
    
    showSnackbar(errorMessage, 'error')
  } finally {
    creatingUser.value = false
  }
}

/* ---------- activity logging ---------- */
async function handleActivity(action, details) {
  try {
    // Use logEvent for custom actions passed from child components
    await logEvent(action, details)
    
    // Update recent activity counter
    stats.value.recentActivity += 1
  } catch (e) {
    console.error('Error logging activity:', e)
  }
}

/* ---------- utilities ---------- */
function showSnackbar(message, color = 'success') {
  snackbar.value = { show: true, message, color }
}

function generatePassword() {
  const length = 12
  const charset = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*'
  let password = ''
  for (let i = 0; i < length; i++) {
    password += charset.charAt(Math.floor(Math.random() * charset.length))
  }
  createUserForm.value.password = password
}
</script>

<template>
  <AppLayout>
    <template #header>
      <div class="d-flex align-center">
        <v-icon size="large" class="mr-3">mdi-shield-crown</v-icon>
        <div>
          <h1 class="text-h4 font-weight-bold">Admin Panel</h1>
          <p class="text-subtitle-1 text-medium-emphasis mb-0">
            System administration and user management
          </p>
        </div>
      </div>
    </template>

    <div class="pa-6">
      <!-- Error State -->
      <v-alert
        v-if="error"
        type="error"
        variant="tonal"
        class="mb-6"
        closable
      >
        {{ error }}
      </v-alert>

      <!-- Loading State -->
      <div v-if="loading" class="text-center py-12">
        <v-progress-circular
          size="64"
          color="primary"
          indeterminate
        ></v-progress-circular>
        <p class="text-h6 mt-4">Loading admin panel...</p>
      </div>

      <!-- Main Content -->
      <template v-else>
        <!-- Statistics Cards -->
        <v-row class="mb-6">
          <v-col cols="12" sm="6" md="3">
            <v-card>
              <v-card-text class="text-center">
                <v-icon size="36" color="primary" class="mb-2">mdi-account-group</v-icon>
                <div class="text-h4 font-weight-bold">{{ stats.totalUsers }}</div>
                <div class="text-subtitle-2 text-medium-emphasis">Total Users</div>
              </v-card-text>
            </v-card>
          </v-col>
          <v-col cols="12" sm="6" md="3">
            <v-card>
              <v-card-text class="text-center">
                <v-icon size="36" color="warning" class="mb-2">mdi-clock-outline</v-icon>
                <div class="text-h4 font-weight-bold">{{ stats.pendingUsers }}</div>
                <div class="text-subtitle-2 text-medium-emphasis">Pending Approval</div>
              </v-card-text>
            </v-card>
          </v-col>
          <v-col cols="12" sm="6" md="3">
            <v-card>
              <v-card-text class="text-center">
                <v-icon size="36" color="success" class="mb-2">mdi-check-circle</v-icon>
                <div class="text-h4 font-weight-bold">{{ stats.activeUsers }}</div>
                <div class="text-subtitle-2 text-medium-emphasis">Active Users</div>
              </v-card-text>
            </v-card>
          </v-col>
          <v-col cols="12" sm="6" md="3">
            <v-card>
              <v-card-text class="text-center">
                <v-icon size="36" color="info" class="mb-2">mdi-shield-account</v-icon>
                <div class="text-h4 font-weight-bold">{{ stats.totalRoles }}</div>
                <div class="text-subtitle-2 text-medium-emphasis">System Roles</div>
              </v-card-text>
            </v-card>
          </v-col>
        </v-row>

        <!-- Admin Tabs -->
        <v-card>
          <v-tabs
            v-model="selectedTab"
            bg-color="surface"
            color="primary"
            grow
          >
            <v-tab
              v-for="tab in availableTabs"
              :key="tab.value"
              :value="tab.value"
              class="text-none"
            >
              <v-icon :icon="tab.icon" start></v-icon>
              {{ tab.title }}
            </v-tab>
          </v-tabs>

          <v-card-text class="pa-0">
            <v-tabs-window v-model="selectedTab">
              <!-- User Management Tab -->
              <v-tabs-window-item value="users">
                <UserManagement 
                  @activity="handleActivity"
                  @create-user="handleCreateUser"
                />
              </v-tabs-window-item>

              <!-- Role Management Tab -->
              <v-tabs-window-item value="roles">
                <RoleManagement @activity="handleActivity" />
              </v-tabs-window-item>

              <!-- Permission Matrix Tab -->
              <v-tabs-window-item value="permissions">
                <PermissionMatrix @activity="handleActivity" />
              </v-tabs-window-item>

              <!-- System Logs Tab -->
              <v-tabs-window-item value="logs">
                <SystemLogs />
              </v-tabs-window-item>

              <!-- Data Retention Tab -->
              <v-tabs-window-item value="retention">
                <RetentionMonitor @activity="handleActivity" />
              </v-tabs-window-item>
            </v-tabs-window>
          </v-card-text>
        </v-card>
      </template>
    </div>

    <!-- Create User Dialog -->
    <v-dialog v-model="showCreateUserDialog" max-width="600" persistent>
      <v-card>
        <v-card-title class="text-h5">
          <v-icon class="mr-2">mdi-account-plus</v-icon>
          Create New User
        </v-card-title>

        <v-card-text>
          <v-alert 
            type="info" 
            variant="tonal" 
            class="mb-4"
            density="compact"
          >
            <v-alert-title class="text-body-2">Note</v-alert-title>
            This creates a user record in the system. The user will need to set up their authentication separately.
          </v-alert>

          <v-form>
            <v-text-field
              v-model="createUserForm.email"
              label="Email Address"
              type="email"
              variant="outlined"
              required
              :rules="[v => !!v || 'Email is required', v => /.+@.+\..+/.test(v) || 'Email must be valid']"
              class="mb-4"
            ></v-text-field>

            <v-text-field
              v-model="createUserForm.password"
              label="Temporary Password"
              type="password"
              variant="outlined"
              required
              :rules="[v => !!v || 'Password is required', v => v.length >= 6 || 'Password must be at least 6 characters']"
              class="mb-2"
            >
              <template #append-inner>
                <v-btn
                  icon="mdi-refresh"
                  variant="text"
                  size="small"
                  @click="generatePassword"
                  title="Generate Password"
                ></v-btn>
              </template>
            </v-text-field>
            
            <div class="text-caption text-medium-emphasis mb-4">
              User should change this password on first login
            </div>

            <v-select
              v-model="createUserForm.role"
              :items="availableRoles"
              item-title="name"
              item-value="id"
              label="Initial Role"
              variant="outlined"
              required
              class="mb-4"
            ></v-select>

            <v-checkbox
              v-model="createUserForm.sendEmail"
              label="Send welcome email to user"
              density="compact"
              disabled
              hint="Email functionality coming soon"
              persistent-hint
            ></v-checkbox>
          </v-form>
        </v-card-text>

        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn
            variant="text"
            @click="showCreateUserDialog = false"
            :disabled="creatingUser"
          >
            Cancel
          </v-btn>
          <v-btn
            color="primary"
            variant="flat"
            @click="createUser"
            :loading="creatingUser"
          >
            Create User
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Snackbar for notifications -->
    <v-snackbar
      v-model="snackbar.show"
      :color="snackbar.color"
      :timeout="4000"
      location="bottom right"
    >
      {{ snackbar.message }}
      <template v-slot:actions>
        <v-btn
          variant="text"
          @click="snackbar.show = false"
          size="small"
        >
          Close
        </v-btn>
      </template>
    </v-snackbar>
  </AppLayout>
</template>

<style scoped>
:deep(.v-tabs) {
  font-family: 'ITC Franklin Gothic', Arial, sans-serif;
}

:deep(.v-card-title) {
  font-family: 'ITC Franklin Gothic', Arial, sans-serif;
  font-weight: 700;
}
</style>