<!-- client/src/views/AdminView.vue - Enhanced Admin Panel with Tabs -->
<script setup>
import { ref, onMounted, computed, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { db, auth } from '../firebase'
import { collection, onSnapshot, doc, updateDoc, addDoc, serverTimestamp } from 'firebase/firestore'
import AppLayout from '../components/AppLayout.vue'
import UserManagement from '../components/admin/UserManagement.vue'
import RoleManagement from '../components/admin/RoleManagement.vue'
import PermissionMatrix from '../components/admin/PermissionMatrix.vue'
import SystemLogs from '../components/admin/SystemLogs.vue'
import { useAuthStore } from '../stores/auth'
import { usePermissionsStore } from '../stores/permissions'

const router = useRouter()
const authStore = useAuthStore()
const permissionsStore = usePermissionsStore()

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
    description: 'View system activity and audit trails'
  }
])

const availableTabs = computed(() => 
  tabs.value.filter(tab => authStore.hasPermission(tab.permission))
)

const currentTabInfo = computed(() => 
  tabs.value.find(tab => tab.value === selectedTab.value)
)

/* ---------- lifecycle ---------- */
onMounted(async () => {
  await loadDashboardStats()
  setupRealtimeListeners()
})

onUnmounted(() => {
  // Clean up listeners
  if (unsubscribeUsers) unsubscribeUsers()
  if (unsubscribeLogs) unsubscribeLogs()
})

/* ---------- data loading ---------- */
async function loadDashboardStats() {
  try {
    loading.value = true
    
    // Load permissions store data
    await permissionsStore.loadAllData()
    
    // Calculate stats
    stats.value = {
      totalUsers: permissionsStore.allUsers.length,
      pendingUsers: permissionsStore.allUsers.filter(u => u.role === 'pending').length,
      activeUsers: permissionsStore.allUsers.filter(u => u.role !== 'pending').length,
      totalRoles: permissionsStore.allRoles.length,
      totalPermissions: permissionsStore.allPermissions.length,
      recentActivity: 0 // Will be updated by log listener
    }
    
  } catch (e) {
    console.error('Error loading dashboard stats:', e)
    error.value = 'Failed to load dashboard statistics'
  } finally {
    loading.value = false
  }
}

function setupRealtimeListeners() {
  // Listen to user changes
  unsubscribeUsers = onSnapshot(
    collection(db, 'users'),
    (snapshot) => {
      stats.value.totalUsers = snapshot.size
      stats.value.pendingUsers = snapshot.docs.filter(
        doc => doc.data().role === 'pending'
      ).length
      stats.value.activeUsers = snapshot.size - stats.value.pendingUsers
    }
  )
  
  // Listen to recent audit logs (last 24 hours)
  const yesterday = new Date()
  yesterday.setDate(yesterday.getDate() - 1)
  
  unsubscribeLogs = onSnapshot(
    collection(db, 'audit_logs'),
    (snapshot) => {
      stats.value.recentActivity = snapshot.docs.filter(doc => {
        const data = doc.data()
        return data.timestamp?.toDate() > yesterday
      }).length
    }
  )
}

/* ---------- audit logging ---------- */
async function logActivity(action, details) {
  try {
    await addDoc(collection(db, 'audit_logs'), {
      action,
      details,
      userId: auth.currentUser.uid,
      userEmail: auth.currentUser.email,
      timestamp: serverTimestamp()
    })
  } catch (e) {
    console.error('Error logging activity:', e)
  }
}

/* ---------- navigation ---------- */
function handleTabChange(value) {
  selectedTab.value = value
  logActivity('admin_tab_viewed', { tab: value })
}
</script>

<template>
  <AppLayout>
    <v-container fluid class="pa-4">
      <!-- Header -->
      <v-row>
        <v-col>
          <h1 class="text-h4 font-weight-bold mb-2">Admin Panel</h1>
          <p class="text-body-1 text-medium-emphasis">
            Manage users, roles, permissions, and monitor system activity
          </p>
        </v-col>
      </v-row>

      <!-- Statistics Cards -->
      <v-row v-if="!loading" class="mb-6">
        <v-col cols="12" sm="6" md="3">
          <v-card elevation="2">
            <v-card-text class="text-center">
              <v-icon size="40" color="primary" class="mb-2">
                mdi-account-group
              </v-icon>
              <div class="text-h4 font-weight-bold">{{ stats.totalUsers }}</div>
              <div class="text-caption text-medium-emphasis">Total Users</div>
              <v-chip 
                v-if="stats.pendingUsers > 0" 
                size="small" 
                color="warning" 
                class="mt-2"
              >
                {{ stats.pendingUsers }} pending
              </v-chip>
            </v-card-text>
          </v-card>
        </v-col>
        
        <v-col cols="12" sm="6" md="3">
          <v-card elevation="2">
            <v-card-text class="text-center">
              <v-icon size="40" color="success" class="mb-2">
                mdi-account-check
              </v-icon>
              <div class="text-h4 font-weight-bold">{{ stats.activeUsers }}</div>
              <div class="text-caption text-medium-emphasis">Active Users</div>
            </v-card-text>
          </v-card>
        </v-col>
        
        <v-col cols="12" sm="6" md="3">
          <v-card elevation="2">
            <v-card-text class="text-center">
              <v-icon size="40" color="info" class="mb-2">
                mdi-shield-account
              </v-icon>
              <div class="text-h4 font-weight-bold">{{ stats.totalRoles }}</div>
              <div class="text-caption text-medium-emphasis">Roles</div>
            </v-card-text>
          </v-card>
        </v-col>
        
        <v-col cols="12" sm="6" md="3">
          <v-card elevation="2">
            <v-card-text class="text-center">
              <v-icon size="40" color="secondary" class="mb-2">
                mdi-history
              </v-icon>
              <div class="text-h4 font-weight-bold">{{ stats.recentActivity }}</div>
              <div class="text-caption text-medium-emphasis">Recent Actions (24h)</div>
            </v-card-text>
          </v-card>
        </v-col>
      </v-row>

      <!-- Loading State -->
      <v-row v-if="loading">
        <v-col class="text-center py-12">
          <v-progress-circular
            indeterminate
            color="primary"
            size="64"
          ></v-progress-circular>
          <p class="mt-4 text-body-1">Loading admin panel...</p>
        </v-col>
      </v-row>

      <!-- Error State -->
      <v-alert
        v-if="error"
        type="error"
        closable
        @click:close="error = ''"
        class="mb-4"
      >
        {{ error }}
      </v-alert>

      <!-- Tab Navigation -->
      <v-tabs
        v-if="!loading"
        v-model="selectedTab"
        @update:model-value="handleTabChange"
        color="primary"
        class="mb-6"
      >
        <v-tab
          v-for="tab in availableTabs"
          :key="tab.value"
          :value="tab.value"
          :prepend-icon="tab.icon"
        >
          {{ tab.title }}
        </v-tab>
      </v-tabs>

      <!-- Tab Content -->
      <v-card v-if="!loading && currentTabInfo" elevation="2">
        <v-card-title class="d-flex align-center">
          <v-icon :icon="currentTabInfo.icon" class="mr-2"></v-icon>
          {{ currentTabInfo.title }}
        </v-card-title>
        <v-card-subtitle>
          {{ currentTabInfo.description }}
        </v-card-subtitle>
        
        <v-divider></v-divider>
        
        <v-card-text class="pa-0">
          <!-- User Management Tab -->
          <UserManagement 
            v-if="selectedTab === 'users'"
            @activity="logActivity"
          />
          
          <!-- Role Management Tab -->
          <RoleManagement 
            v-else-if="selectedTab === 'roles'"
            @activity="logActivity"
          />
          
          <!-- Permission Matrix Tab -->
          <PermissionMatrix 
            v-else-if="selectedTab === 'permissions'"
            @activity="logActivity"
          />
          
          <!-- System Logs Tab -->
          <SystemLogs 
            v-else-if="selectedTab === 'logs'"
          />
        </v-card-text>
      </v-card>
    </v-container>
  </AppLayout>
</template>

<style scoped>
.v-tabs {
  border-radius: 4px;
  background-color: rgba(0, 0, 0, 0.02);
}

.v-card-title {
  font-family: 'ITC Franklin Gothic', Arial, sans-serif;
  font-weight: 600;
}

.v-card-text {
  font-family: 'Cambria', Georgia, serif;
}
</style>