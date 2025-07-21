<!-- client/src/views/DashboardView.vue - Clean version without duplicate menu -->
<template>
  <AppLayout>
    <div class="dashboard-container pa-4">
      <!-- Welcome Header with Role Badge -->
      <v-row class="mb-6">
        <v-col cols="12">
          <div class="d-flex align-center justify-space-between flex-wrap">
            <h1 class="text-h3 font-weight-bold">
              Welcome back, {{ auth.user?.displayName || auth.user?.email?.split('@')[0] || 'User' }}!
            </h1>
            <v-chip 
              color="primary" 
              variant="flat"
              size="small"
              prepend-icon="mdi-shield-check"
            >
              {{ getRoleDisplay(auth.role) }}
            </v-chip>
          </div>
        </v-col>
      </v-row>

      <!-- Main Content Grid -->
      <v-row>
        <!-- My Profile Card -->
        <v-col cols="12" md="6">
          <v-card 
            elevation="2" 
            class="h-100 d-flex flex-column"
            hover
            @click="goToProfile"
          >
            <v-card-title class="d-flex align-center">
              <v-icon class="me-2" color="primary">mdi-account-circle</v-icon>
              My Profile
            </v-card-title>
            <v-card-text class="flex-grow-1">
              <p class="text-body-1 mb-3">
                Manage your personal information, security settings, and preferences.
              </p>
            </v-card-text>
            <v-card-actions>
              <v-btn 
                color="primary" 
                variant="text" 
                append-icon="mdi-arrow-right"
              >
                View Profile
              </v-btn>
            </v-card-actions>
          </v-card>
        </v-col>

        <!-- Admin Panel Card (conditional) -->
        <v-col v-if="auth.isAdmin" cols="12" md="6">
          <v-card 
            elevation="2" 
            class="h-100 d-flex flex-column"
            hover
            @click="goToAdmin"
          >
            <v-card-title class="d-flex align-center">
              <v-icon class="me-2" color="error">mdi-shield-crown</v-icon>
              Admin Panel
            </v-card-title>
            <v-card-text class="flex-grow-1">
              <p class="text-body-1 mb-3">
                Access administrative tools, manage users, and configure system settings.
              </p>
            </v-card-text>
            <v-card-actions>
              <v-btn 
                color="error" 
                variant="text" 
                append-icon="mdi-arrow-right"
              >
                Open Admin Panel
              </v-btn>
            </v-card-actions>
          </v-card>
        </v-col>

        <!-- System Status Card (Admin/Owner only) -->
        <v-col v-if="auth.isAdmin || auth.isOwner" cols="12" md="6">
          <v-card elevation="2" class="h-100">
            <v-card-title class="d-flex align-center">
              <v-icon class="me-2" color="success">mdi-check-circle</v-icon>
              System Status
            </v-card-title>
            <v-card-text>
              <v-list density="compact" class="pa-0">
                <v-list-item
                  v-for="(status, system) in systemStatus"
                  :key="system"
                  class="px-0"
                >
                  <template v-slot:prepend>
                    <v-icon 
                      :color="status ? 'success' : 'error'" 
                      size="small"
                    >
                      {{ status ? 'mdi-check-circle' : 'mdi-alert-circle' }}
                    </v-icon>
                  </template>
                  <v-list-item-title>
                    {{ getSystemName(system) }}
                  </v-list-item-title>
                  <template v-slot:append>
                    <span :class="status ? 'text-success' : 'text-error'">
                      {{ status ? 'Operational' : 'Issues' }}
                    </span>
                  </template>
                </v-list-item>
              </v-list>
            </v-card-text>
          </v-card>
        </v-col>

        <!-- Recent Updates -->
        <v-col cols="12" :md="auth.isAdmin || auth.isOwner ? 6 : 12">
          <v-card elevation="1" class="h-100">
            <v-card-title class="d-flex align-center">
              <v-icon class="me-2" color="info">mdi-information-outline</v-icon>
              Recent Updates
            </v-card-title>
            <v-card-text>
              <v-alert 
                type="info" 
                variant="tonal"
                class="mb-0"
              >
                <strong>Welcome to OPHV2!</strong> This platform is continuously evolving. 
                Stay tuned for upcoming features and enhancements.
              </v-alert>
            </v-card-text>
          </v-card>
        </v-col>
      </v-row>
    </div>
  </AppLayout>
</template>

<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import AppLayout from '../components/AppLayout.vue'
import { useAuthStore } from '../stores/auth'

const router = useRouter()
const auth = useAuthStore()

// System status (in a real app, this would come from an API or store)
const systemStatus = ref({
  platform: true,
  database: true,
  authentication: true,
  functions: true
})

// Helper functions
const getRoleDisplay = (role) => {
  const roleMap = {
    owner: 'System Owner',
    admin: 'Administrator',
    user: 'User',
    viewer: 'Viewer',
    pending: 'Pending Approval'
  }
  return roleMap[role] || role
}

const getSystemName = (system) => {
  const systemMap = {
    platform: 'Platform',
    database: 'Database',
    authentication: 'Authentication',
    functions: 'Cloud Functions'
  }
  return systemMap[system] || system
}

// Navigation functions
async function handleLogout() {
  await auth.logout()
  router.push('/')
}

function goToProfile() {
  router.push('/profile')
}

function goToAdmin() {
  router.push('/admin')
}
</script>

<style scoped>
.dashboard-container {
  max-width: 1400px;
  margin: 0 auto;
}

/* Brand-compliant typography */
.text-h3, .text-h4, .text-h5, .text-h6 {
  font-family: 'ITC Franklin Gothic', Arial, sans-serif;
  font-weight: 600;
}

.text-body-1, .text-body-2, .text-subtitle-1 {
  font-family: 'Cambria', Georgia, serif;
}

/* Card styling */
.v-card {
  transition: all 0.3s ease;
}

.v-card[hover]:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 16px rgba(0, 0, 0, 0.15);
  cursor: pointer;
}

/* Ensure equal height cards */
.v-row > .v-col {
  display: flex;
}

.v-row > .v-col > .v-card {
  flex: 1;
  display: flex;
  flex-direction: column;
}

/* Custom list styling */
.v-list-item {
  min-height: 40px;
}

/* Responsive adjustments */
@media (max-width: 960px) {
  .d-flex.align-center.justify-space-between {
    flex-direction: column;
    align-items: flex-start !important;
    gap: 12px;
  }
  
  .text-h3 {
    font-size: 1.875rem !important;
  }
}

@media (max-width: 600px) {
  .dashboard-container {
    padding: 12px !important;
  }
  
  .text-h3 {
    font-size: 1.5rem !important;
  }
}
</style>