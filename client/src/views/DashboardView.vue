<!-- client/src/views/DashboardView.vue - Cleaned up version -->
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

      <!-- Actions Section (renamed from Quick Actions) -->
      <v-row class="mb-6">
        <v-col cols="12">
          <v-card elevation="2">
            <v-card-title class="d-flex align-center">
              <v-icon class="me-2" color="primary">mdi-rocket-launch</v-icon>
              Get Started
            </v-card-title>
            
            <v-row class="pa-4">
              <!-- Profile Card -->
              <v-col cols="12" sm="6" :md="auth.isAdmin ? 6 : 12">
                <v-card
                  variant="outlined"
                  class="text-center pa-4"
                  hover
                  @click="goToProfile"
                  style="cursor: pointer; height: 100%;"
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
              <v-col v-if="auth.isAdmin" cols="12" sm="6" md="6">
                <v-card
                  variant="outlined"
                  class="text-center pa-4"
                  hover
                  @click="goToAdmin"
                  style="cursor: pointer; height: 100%;"
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
            </v-row>
          </v-card>
        </v-col>
      </v-row>

      <!-- Recent Activity or Announcements (Future Enhancement) -->
      <v-row>
        <v-col cols="12">
          <v-card elevation="1">
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
                <strong>Welcome to OPHV2!</strong> This platform is currently in development. 
                More features will be added soon. If you have any questions or need assistance, 
                please contact your system administrator.
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