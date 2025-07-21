<!-- client/src/views/DashboardView.vue -->
<template>
  <AppLayout title="Dashboard" :show-navigation="true">
    <div class="dashboard-container">
      <!-- Welcome Section -->
      <v-card class="mb-6" elevation="0" border>
        <v-card-text class="pa-6">
          <h1 class="text-h4 font-weight-bold mb-2">
            Welcome back, {{ userName }}!
          </h1>
          <p class="text-subtitle-1 text-medium-emphasis">
            You are logged in as <strong>{{ userRole }}</strong>
          </p>
        </v-card-text>
      </v-card>

      <!-- Main Content Grid -->
      <v-row>
        <!-- Profile Card -->
        <v-col cols="12" md="6">
          <v-card 
            class="h-100" 
            hover
            @click="goToProfile"
          >
            <v-card-title class="d-flex align-center">
              <v-icon color="primary" class="mr-2">mdi-account-circle</v-icon>
              My Profile
            </v-card-title>
            <v-card-text>
              <p class="text-body-2 mb-4">
                Manage your personal information, security settings, and preferences.
              </p>
              <v-btn
                color="primary"
                variant="text"
                append-icon="mdi-arrow-right"
              >
                View Profile
              </v-btn>
            </v-card-text>
          </v-card>
        </v-col>

        <!-- Admin Panel Card (conditional) -->
        <v-col v-if="auth.isAdmin" cols="12" md="6">
          <v-card 
            class="h-100" 
            hover
            @click="goToAdmin"
          >
            <v-card-title class="d-flex align-center">
              <v-icon color="error" class="mr-2">mdi-shield-crown</v-icon>
              Admin Panel
            </v-card-title>
            <v-card-text>
              <p class="text-body-2 mb-4">
                Access administrative tools, manage users, and configure system settings.
              </p>
              <v-btn
                color="error"
                variant="text"
                append-icon="mdi-arrow-right"
              >
                Open Admin Panel
              </v-btn>
            </v-card-text>
          </v-card>
        </v-col>

        <!-- Quick Actions Card -->
        <v-col cols="12" md="6">
          <v-card class="h-100">
            <v-card-title class="d-flex align-center">
              <v-icon color="secondary" class="mr-2">mdi-lightning-bolt</v-icon>
              Quick Actions
            </v-card-title>
            <v-card-text>
              <v-list density="compact">
                <v-list-item
                  prepend-icon="mdi-account-edit"
                  @click="goToProfile"
                >
                  <v-list-item-title>Update Profile</v-list-item-title>
                </v-list-item>
                
                <v-list-item
                  prepend-icon="mdi-shield-lock"
                  @click="goToProfile"
                >
                  <v-list-item-title>Security Settings</v-list-item-title>
                </v-list-item>
                
                <v-list-item
                  prepend-icon="mdi-logout"
                  @click="handleLogout"
                >
                  <v-list-item-title>Sign Out</v-list-item-title>
                </v-list-item>
              </v-list>
            </v-card-text>
          </v-card>
        </v-col>

        <!-- System Status Card -->
        <v-col cols="12" md="6">
          <v-card class="h-100">
            <v-card-title class="d-flex align-center">
              <v-icon color="success" class="mr-2">mdi-check-circle</v-icon>
              System Status
            </v-card-title>
            <v-card-text>
              <v-list density="compact">
                <v-list-item>
                  <template v-slot:prepend>
                    <v-icon color="success" size="small">mdi-circle</v-icon>
                  </template>
                  <v-list-item-title>All Systems Operational</v-list-item-title>
                </v-list-item>
                
                <v-list-item>
                  <template v-slot:prepend>
                    <v-icon color="success" size="small">mdi-database-check</v-icon>
                  </template>
                  <v-list-item-title>Database Connected</v-list-item-title>
                </v-list-item>
                
                <v-list-item>
                  <template v-slot:prepend>
                    <v-icon color="success" size="small">mdi-shield-check</v-icon>
                  </template>
                  <v-list-item-title>Security Active</v-list-item-title>
                </v-list-item>
              </v-list>
            </v-card-text>
          </v-card>
        </v-col>

        <!-- Coming Soon Card -->
        <v-col cols="12">
          <v-card>
            <v-card-title>
              <v-icon color="info" class="mr-2">mdi-rocket-launch</v-icon>
              Coming Soon
            </v-card-title>
            <v-card-text>
              <v-alert
                type="info"
                variant="tonal"
                class="mb-0"
              >
                <div class="font-weight-medium mb-2">New Features in Development</div>
                <ul class="ml-4">
                  <li>Project Management System</li>
                  <li>Discussion Forums</li>
                  <li>Event Calendar</li>
                  <li>Analytics Dashboard</li>
                </ul>
                <div class="mt-3">
                More features will be added soon. If you have any questions or need assistance, 
                please contact your system administrator.
              </div>
              </v-alert>
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

// Computed properties
const userName = computed(() => {
  if (!auth.user) return 'User'
  return auth.user.displayName || auth.user.email?.split('@')[0] || 'User'
})

const userRole = computed(() => {
  const roleNames = {
    owner: 'System Owner',
    admin: 'Administrator',
    user: 'User',
    viewer: 'Viewer',
    pending: 'Pending Approval'
  }
  return roleNames[auth.role] || 'Unknown Role'
})

/* Navigation functions */
async function handleLogout() {
  try {
    await auth.logout()
    router.push('/')
  } catch (error) {
    console.error('Logout error:', error)
    // Error is handled in the store, just log it here
  }
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

/* Equal height cards */
.v-row > .v-col {
  display: flex;
}

.v-row > .v-col > .v-card {
  flex: 1;
}

/* Responsive design */
@media (max-width: 600px) {
  .dashboard-container {
    padding: 0 16px;
  }
  
  .v-col[class*="md-6"] {
    flex: 0 0 100%;
    max-width: 100%;
  }
}
</style>