<!-- client/src/views/DashboardView.vue - COMPLETE FIXED VERSION -->
<template>
  <AppLayout>
    <!-- Navigation buttons in app bar actions slot -->
    <template #actions>
      <!-- Admin Button - Only for Admins/Owners -->
      <v-btn
        v-if="auth.isAdmin"
        class="mr-2"
        color="secondary"
        variant="flat"
        size="small"
        @click="goToAdmin"
      >
        <v-icon start size="small">mdi-shield-account</v-icon>
        Admin
      </v-btn>

      <!-- Profile Button - Universal with high contrast -->
      <v-btn
        class="mr-2"
        color="white"
        variant="outlined"
        size="small"
        @click="goToProfile"
        style="color: white !important; border-color: rgba(255,255,255,0.7) !important;"
      >
        <v-icon start size="small" style="color: white !important;">mdi-account</v-icon>
        Profile
      </v-btn>

      <!-- Logout Button -->
      <v-btn
        color="warning"
        variant="flat"
        size="small"
        @click="handleLogout"
      >
        <v-icon start size="small">mdi-logout</v-icon>
        Log out
      </v-btn>
    </template>

    <!-- Main dashboard content -->
    <div class="dashboard-container">
      <!-- Welcome Header -->
      <div class="mb-6">
        <h1 class="text-h4 font-weight-bold mb-2">
          Welcome, {{ auth.user?.displayName || auth.user?.email || 'User' }}!
        </h1>
        <p class="text-subtitle-1 text-medium-emphasis">
          Here's what's happening in your workspace today.
        </p>
      </div>

      <!-- Quick Actions Section -->
      <v-row class="mb-6">
        <v-col cols="12">
          <v-card elevation="2">
            <v-card-title class="d-flex align-center">
              <v-icon class="me-2" color="primary">mdi-flash</v-icon>
              Quick Actions
            </v-card-title>
            
            <v-row class="pa-4">
              <!-- Profile Card -->
              <v-col cols="12" sm="6" md="3">
                <v-card
                  variant="outlined"
                  class="text-center pa-4"
                  hover
                  @click="goToProfile"
                  style="cursor: pointer;"
                >
                  <v-icon size="48" color="primary" class="mb-2">
                    mdi-account-circle
                  </v-icon>
                  <h3 class="text-h6 font-weight-bold">My Profile</h3>
                  <p class="text-body-2 text-medium-emphasis">
                    View and manage your profile information
                  </p>
                </v-card>
              </v-col>

              <!-- Admin Card (only for admins) -->
              <v-col v-if="auth.isAdmin" cols="12" sm="6" md="3">
                <v-card
                  variant="outlined"
                  class="text-center pa-4"
                  hover
                  @click="goToAdmin"
                  style="cursor: pointer;"
                >
                  <v-icon size="48" color="secondary" class="mb-2">
                    mdi-shield-account
                  </v-icon>
                  <h3 class="text-h6 font-weight-bold">Administration</h3>
                  <p class="text-body-2 text-medium-emphasis">
                    Manage users, roles, and system settings
                  </p>
                </v-card>
              </v-col>

              <!-- Projects Card - Coming Soon -->
              <v-col cols="12" sm="6" md="3">
                <v-card
                  variant="outlined"
                  class="text-center pa-4"
                  :disabled="true"
                >
                  <v-icon size="48" color="grey" class="mb-2">
                    mdi-folder
                  </v-icon>
                  <h3 class="text-h6 font-weight-bold">Projects</h3>
                  <p class="text-body-2 text-medium-emphasis">
                    Coming Soon
                  </p>
                </v-card>
              </v-col>

              <!-- Forums Card - Coming Soon -->
              <v-col cols="12" sm="6" md="3">
                <v-card
                  variant="outlined"
                  class="text-center pa-4"
                  :disabled="true"
                >
                  <v-icon size="48" color="grey" class="mb-2">
                    mdi-forum
                  </v-icon>
                  <h3 class="text-h6 font-weight-bold">Forums</h3>
                  <p class="text-body-2 text-medium-emphasis">
                    Coming Soon
                  </p>
                </v-card>
              </v-col>

              <!-- Calendar Card - Coming Soon -->
              <v-col cols="12" sm="6" md="3">
                <v-card
                  variant="outlined"
                  class="text-center pa-4"
                  :disabled="true"
                >
                  <v-icon size="48" color="grey" class="mb-2">
                    mdi-calendar
                  </v-icon>
                  <h3 class="text-h6 font-weight-bold">Calendar</h3>
                  <p class="text-body-2 text-medium-emphasis">
                    Coming Soon
                  </p>
                </v-card>
              </v-col>
            </v-row>
          </v-card>
        </v-col>
      </v-row>

      <!-- Status Cards Row -->
      <v-row>
        <!-- System Status -->
        <v-col cols="12" md="6">
          <v-card elevation="2">
            <v-card-title class="d-flex align-center">
              <v-icon class="me-2" color="success">mdi-check-circle</v-icon>
              System Status
            </v-card-title>
            <v-card-text>
              <v-row>
                <v-col cols="12">
                  <div class="d-flex justify-space-between align-center mb-2">
                    <span>Platform Health</span>
                    <v-chip color="success" size="small">Operational</v-chip>
                  </div>
                </v-col>
                <v-col cols="12">
                  <div class="d-flex justify-space-between align-center mb-2">
                    <span>Authentication</span>
                    <v-chip color="success" size="small">Active</v-chip>
                  </div>
                </v-col>
                <v-col cols="12">
                  <div class="d-flex justify-space-between align-center">
                    <span>Database</span>
                    <v-chip color="success" size="small">Connected</v-chip>
                  </div>
                </v-col>
              </v-row>
            </v-card-text>
          </v-card>
        </v-col>

        <!-- User Access Level -->
        <v-col cols="12" md="6">
          <v-card elevation="2">
            <v-card-title class="d-flex align-center">
              <v-icon class="me-2" color="info">mdi-account-group</v-icon>
              Your Access Level
            </v-card-title>
            <v-card-text>
              <div class="text-center">
                <v-chip
                  :color="getRoleColor(auth.role)"
                  size="large"
                  class="mb-2"
                >
                  <template v-slot:prepend>
                    <v-icon>{{ getRoleIcon(auth.role) }}</v-icon>
                  </template>
                  {{ auth.role?.toUpperCase() || 'UNKNOWN' }}
                </v-chip>
                <p class="text-body-2 text-medium-emphasis">
                  {{ auth.effectivePermissions?.length || 0 }} permissions active
                </p>
              </div>
            </v-card-text>
          </v-card>
        </v-col>
      </v-row>
    </div>
  </AppLayout>
</template>

<script setup>
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import AppLayout from '../components/AppLayout.vue'
import { useAuthStore } from '../stores/auth'

const router = useRouter()
const auth = useAuthStore()

/* Navigation functions */
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

/* Helper functions for role display */
function getRoleColor(role) {
  const colors = {
    owner: 'purple',
    admin: 'red',
    user: 'blue',
    viewer: 'green',
    pending: 'orange'
  }
  return colors[role] || 'grey'
}

function getRoleIcon(role) {
  const icons = {
    owner: 'mdi-crown',
    admin: 'mdi-shield-account',
    user: 'mdi-account',
    viewer: 'mdi-eye',
    pending: 'mdi-clock-outline'
  }
  return icons[role] || 'mdi-help'
}
</script>

<style scoped>
.dashboard-container {
  max-width: 1200px;
  margin: 0 auto;
}

/* Brand-compliant typography */
.text-h4, .text-h5, .text-h6 {
  font-family: 'ITC Franklin Gothic', 'Arial', sans-serif;
}

.text-body-1, .text-body-2, .text-subtitle-1 {
  font-family: 'Cambria', serif;
}

/* Card hover effects */
.v-card[hover]:hover {
  transform: translateY(-2px);
  transition: transform 0.2s ease;
}

/* Ensure button icons are always visible */
.v-btn .v-icon {
  opacity: 1 !important;
  color: inherit !important;
  font-size: 1.2rem !important;
}

/* Navigation button specific styling */
.v-app-bar .v-btn .v-icon {
  display: inline-flex !important;
  align-items: center !important;
  justify-content: center !important;
  visibility: visible !important;
}

/* Force icon visibility in navigation */
.v-app-bar .v-btn {
  text-transform: none !important;
}

.v-app-bar .v-btn .v-icon.mr-2 {
  margin-right: 8px !important;
}

/* Responsive design */
@media (max-width: 600px) {
  .dashboard-container {
    padding: 0 16px;
  }
  
  .v-col[class*="md-3"] {
    flex: 0 0 100%;
    max-width: 100%;
  }
}
</style>