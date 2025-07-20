<!-- client/src/views/AdminView.vue - Complete Fixed Admin Panel -->
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
        @click:close="error = ''"
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
              <SystemLogs @activity="handleActivity" />
            </v-tabs-window-item>

            <!-- Data Retention Tab -->
            <v-tabs-window-item value="retention">
              <RetentionMonitor @activity="handleActivity" />
            </v-tabs-window-item>
          </v-tabs-window>
        </v-card>
      </template>
    </div>

    <!-- Create User Dialog -->
    <v-dialog v-model="showCreateUserDialog" max-width="600">
      <v-card>
        <v-card-title class="text-h5">
          <v-icon start>mdi-account-plus</v-icon>
          Create New User
        </v-card-title>
        
        <v-card-text>
          <v-form ref="createUserFormRef" @submit.prevent="createUser">
            <v-text-field
              v-model="createUserForm.email"
              label="Email Address"
              type="email"
              :rules="[rules.required, rules.email]"
              required
              class="mb-4"
            ></v-text-field>

            <div class="d-flex align-center mb-4">
              <v-text-field
                v-model="createUserForm.password"
                label="Temporary Password"
                type="password"
                :rules="[rules.required, rules.minLength]"
                required
                class="flex-grow-1 mr-2"
                hint="User will be prompted to change password on first login"
              ></v-text-field>
              <v-btn
                @click="generatePassword"
                variant="outlined"
                icon="mdi-dice-6"
                size="small"
              ></v-btn>
            </div>

            <v-select
              v-model="createUserForm.role"
              label="Role"
              :items="availableRoles"
              item-title="name"
              item-value="id"
              :rules="[rules.required]"
              required
              class="mb-4"
            ></v-select>

            <v-checkbox
              v-model="createUserForm.sendEmail"
              label="Send welcome email with login instructions"
              class="mb-4"
            ></v-checkbox>

            <v-alert type="info" variant="outlined" class="mb-4">
              <v-alert-title>Account Creation</v-alert-title>
              The user will be able to sign in immediately with the provided credentials.
              They should change their password on first login for security.
            </v-alert>
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
      location="top"
    >
      {{ snackbar.message }}
      <template v-slot:actions>
        <v-btn variant="text" @click="snackbar.show = false">
          Close
        </v-btn>
      </template>
    </v-snackbar>
  </AppLayout>
</template>

<script setup>
import { ref, onMounted, computed, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { db, auth, functions } from '../firebase'
import { collection, onSnapshot } from 'firebase/firestore'
import { httpsCallable } from 'firebase/functions'
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
const { logEvent } = useAudit()

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

const createUserFormRef = ref(null)

const snackbar = ref({
  show: false,
  message: '',
  color: 'success'
})

// Form validation rules
const rules = {
  required: value => !!value || 'This field is required',
  email: value => {
    const pattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    return pattern.test(value) || 'Must be a valid email address'
  },
  minLength: value => value?.length >= 6 || 'Password must be at least 6 characters'
}

// Unsubscribe functions for listeners
let unsubscribeUsers = null
let unsubscribeLogs = null

/* ---------- computed ---------- */
const availableTabs = computed(() => [
  { value: 'users', title: 'User Management', icon: 'mdi-account-group' },
  { value: 'roles', title: 'Role Management', icon: 'mdi-shield-account' },
  { value: 'permissions', title: 'Permission Matrix', icon: 'mdi-view-grid' },
  { value: 'logs', title: 'System Logs', icon: 'mdi-file-document-outline' },
  { value: 'retention', title: 'Data Retention', icon: 'mdi-database-clock' }
])

const availableRoles = computed(() => {
  const roles = permissionsStore.allRoles.filter(role => {
    // Only show roles that the current user can assign
    if (authStore.role === 'owner') return true
    if (authStore.role === 'admin') return role.id !== 'owner'
    return false
  })
  return roles
})

/* ---------- lifecycle ---------- */
onMounted(async () => {
  try {
    // Check admin permissions
    if (!authStore.hasPermission('access_admin')) {
      error.value = 'You do not have permission to access the admin panel'
      router.push('/dash')
      return
    }

    // Load permissions and roles using the correct method
    await permissionsStore.loadAllData()
    
    // Load statistics
    await loadStatistics()

  } catch (e) {
    console.error('Error loading admin panel:', e)
    error.value = 'Failed to load admin panel: ' + e.message
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
  // Reset form validation
  if (createUserFormRef.value) {
    createUserFormRef.value.resetValidation()
  }
}

async function createUser() {
  // Validate form first
  if (createUserFormRef.value) {
    const { valid } = await createUserFormRef.value.validate()
    if (!valid) return
  }

  if (!createUserForm.value.email || !createUserForm.value.password) {
    showSnackbar('Email and password are required', 'error')
    return
  }

  creatingUser.value = true
  try {
    // Use the Cloud Function to create the user (FIXED)
    const createUserFunction = httpsCallable(functions, 'createUser')
    
    const result = await createUserFunction({
      email: createUserForm.value.email,
      password: createUserForm.value.password,
      role: createUserForm.value.role,
      sendWelcomeEmail: createUserForm.value.sendEmail
    })

    console.log('User created successfully:', result.data)

    // Log the activity
    await logEvent('user_created_by_admin', {
      targetEmail: createUserForm.value.email,
      assignedRole: createUserForm.value.role,
      createdBy: auth.currentUser.email
    })

    showSnackbar(`User ${createUserForm.value.email} created successfully`, 'success')
    showCreateUserDialog.value = false

    // Update recent activity counter
    stats.value.recentActivity += 1

  } catch (error) {
    console.error('Error creating user:', error)
    let errorMessage = 'Failed to create user'
    
    // Handle specific Cloud Function errors
    if (error.code === 'functions/permission-denied') {
      errorMessage = 'You do not have permission to create users'
    } else if (error.code === 'functions/invalid-argument') {
      errorMessage = error.message || 'Invalid user data provided'
    } else if (error.code === 'functions/already-exists') {
      errorMessage = 'A user with this email already exists'
    } else if (error.message) {
      errorMessage = error.message
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

<style scoped>
.admin-panel {
  max-width: 1200px;
  margin: 0 auto;
  padding: 24px;
}

.v-card {
  transition: transform 0.2s ease-in-out;
}

.v-card:hover {
  transform: translateY(-2px);
}

.text-h4 {
  font-family: 'ITC Franklin Gothic', sans-serif;
}

.text-h5, .text-h6 {
  font-family: 'ITC Franklin Gothic', sans-serif;
  font-weight: 600;
}
</style>