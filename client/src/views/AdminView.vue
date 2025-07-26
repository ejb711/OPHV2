<!-- client/src/views/AdminView.vue -->
<template>
  <AppLayout>
    <div class="admin-panel">
      <!-- Loading State -->
      <template v-if="loading">
        <div class="text-center py-8">
          <v-progress-circular indeterminate size="64" color="primary" />
          <h2 class="text-h5 mt-4">Loading Admin Panel...</h2>
          <p class="text-body-1 text-medium-emphasis">Initializing administrative tools</p>
        </div>
      </template>

      <!-- Error State -->
      <template v-else-if="error">
        <v-alert type="error" variant="tonal" class="mb-4">
          <v-alert-title>Admin Panel Error</v-alert-title>
          {{ error }}
        </v-alert>
      </template>

      <!-- Admin Panel Content -->
      <template v-else>
        <!-- Header -->
        <div class="d-flex align-center justify-space-between mb-6">
          <div>
            <h1 class="text-h4 font-weight-bold text-primary">Admin Panel</h1>
            <p class="text-body-1 text-medium-emphasis mt-1">
              Manage users, roles, permissions, and system settings
            </p>
          </div>

          <!-- Quick Stats -->
          <v-row class="flex-grow-0" dense>
            <v-col>
              <v-card variant="outlined" class="text-center pa-2" min-width="100">
                <div class="text-h6 font-weight-bold text-primary">{{ stats.totalUsers }}</div>
                <div class="text-caption">Users</div>
              </v-card>
            </v-col>
            <v-col>
              <v-card variant="outlined" class="text-center pa-2" min-width="100">
                <div class="text-h6 font-weight-bold text-warning">{{ stats.pendingUsers }}</div>
                <div class="text-caption">Pending</div>
              </v-card>
            </v-col>
            <v-col>
              <v-card variant="outlined" class="text-center pa-2" min-width="100">
                <div class="text-h6 font-weight-bold text-success">{{ stats.activeUsers }}</div>
                <div class="text-caption">Active</div>
              </v-card>
            </v-col>
          </v-row>
        </div>

        <!-- Tab Navigation -->
        <v-card variant="outlined">
          <v-tabs v-model="selectedTab" color="primary" grow>
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
    <CreateUserDialog
      v-model="showCreateUserDialog"
      @user-created="handleUserCreated"
      @show-snackbar="showSnackbar"
    />

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
import { db } from '../firebase'
import { collection, onSnapshot } from 'firebase/firestore'
import AppLayout from '../components/AppLayout.vue'
import UserManagement from '../components/admin/UserManagement.vue'
import RoleManagement from '../components/admin/roles/RoleManagement.vue'
import PermissionMatrix from '../components/admin/PermissionMatrix.vue'
import SystemLogs from '../components/admin/SystemLogs.vue'
import RetentionMonitor from '../components/admin/RetentionMonitor.vue'
import CreateUserDialog from '../components/admin/CreateUserDialog.vue'
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

const snackbar = ref({
  show: false,
  message: '',
  color: 'success'
})

// Firestore listeners
let unsubscribers = []

/* ---------- computed ---------- */
const availableTabs = computed(() => [
  {
    value: 'users',
    title: 'User Management',
    icon: 'mdi-account-group',
    permission: 'view_users'
  },
  {
    value: 'roles',
    title: 'Role Management',
    icon: 'mdi-shield-account',
    permission: 'view_roles'
  },
  {
    value: 'permissions',
    title: 'Permission Matrix',
    icon: 'mdi-matrix',
    permission: 'view_permission_matrix'
  },
  {
    value: 'logs',
    title: 'System Logs',
    icon: 'mdi-file-document-outline',
    permission: 'view_audit_logs'
  },
  {
    value: 'retention',
    title: 'Data Retention',
    icon: 'mdi-database-clock',
    permission: 'manage_audit_retention'
  }
].filter(tab => authStore.hasPermission(tab.permission)))

/* ---------- lifecycle ---------- */
onMounted(async () => {
  try {
    loading.value = true

    // Wait for auth to be ready
    if (!authStore.ready) {
      await authStore.initializeAuth()
    }

    // Check admin access
    if (!authStore.hasPermission('view_admin_panel')) {
      router.push('/dashboard')
      return
    }

    // Load permissions and roles data
    await permissionsStore.loadAllData()

    // Setup real-time listeners for stats
    setupStatsListeners()

    // Load initial stats
    await loadStats()

  } catch (err) {
    error.value = 'Failed to initialize admin panel. Please refresh and try again.'
  } finally {
    loading.value = false
  }
})

onUnmounted(() => {
  // Clean up listeners
  unsubscribers.forEach(unsubscribe => unsubscribe())
})

/* ---------- methods ---------- */
async function setupStatsListeners() {
  try {
    // Users collection listener
    const usersUnsubscribe = onSnapshot(
      collection(db, 'users'),
      (snapshot) => {
        stats.value.totalUsers = snapshot.size
        stats.value.pendingUsers = snapshot.docs.filter(doc =>
          doc.data().role === 'pending'
        ).length
        stats.value.activeUsers = snapshot.docs.filter(doc =>
          doc.data().role !== 'pending'
        ).length
      },
      (error) => {
        }
    )

    // Roles collection listener
    const rolesUnsubscribe = onSnapshot(
      collection(db, 'roles'),
      (snapshot) => {
        stats.value.totalRoles = snapshot.size
      },
      (error) => {
        }
    )

    // Permissions collection listener
    const permissionsUnsubscribe = onSnapshot(
      collection(db, 'permissions'),
      (snapshot) => {
        stats.value.totalPermissions = snapshot.size
      },
      (error) => {
        }
    )

    unsubscribers = [usersUnsubscribe, rolesUnsubscribe, permissionsUnsubscribe]

  } catch (error) {
    }
}

async function loadStats() {
  try {
    // Initial stats are loaded via listeners
    // This method can be used for one-time stats calculations if needed
    stats.value.recentActivity = 0 // This could be calculated from audit logs
  } catch (error) {
    }
}

/* ---------- event handlers ---------- */
function handleCreateUser() {
  showCreateUserDialog.value = true
}

function handleUserCreated(userData) {
  // User was successfully created
  // Update recent activity counter
  stats.value.recentActivity += 1

  // You could trigger a refresh of user data here if needed
  // or the real-time listeners will handle it automatically
}

async function handleActivity(action, details) {
  try {
    // Use logEvent for custom actions passed from child components
    await logEvent(action, details)

    // Update recent activity counter
    stats.value.recentActivity += 1
  } catch (e) {
    }
}

/* ---------- utilities ---------- */
function showSnackbar(message, color = 'success') {
  snackbar.value = { show: true, message, color }
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