<!-- client/src/views/DashboardView.vue - ENHANCED with Profile + Your Admin Fix -->
<script setup>
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import AppLayout from '../components/AppLayout.vue'
import { useAuthStore } from '../stores/auth'

const router = useRouter()
const auth = useAuthStore()

/* helper so we both sign-out and go back to the login page */
async function handleLogout() {
  await auth.logout()
  router.push('/')
}

/* 🔧 USING YOUR FIX: Use auth store's isAdmin computed (includes owner + admin) */
// No local isAdmin computed needed - using auth.isAdmin directly

/* navigation helpers */
function goToProfile() {
  router.push('/profile')
}

function goToAdmin() {
  router.push('/admin')
}
</script>

<template>
  <AppLayout>
    <!-- top-right actions slot -->
    <template #actions>
      <!-- 🔧 YOUR FIX: Use auth.isAdmin instead of local isAdmin -->
      <v-btn
        v-if="auth.isAdmin"
        class="mr-3"
        color="secondary"
        variant="flat"
        @click="goToAdmin"
      >
        <v-icon left>mdi-shield-account</v-icon>
        Admin
      </v-btn>

      <!-- 🆕 NEW: Profile Button -->
      <v-btn
        class="mr-3"
        color="primary"
        variant="outlined"
        @click="goToProfile"
      >
        <v-icon left>mdi-account</v-icon>
        Profile
      </v-btn>

      <!-- Logout Button -->
      <v-btn
        color="accent"
        variant="flat"
        @click="handleLogout"
      >
        <v-icon left>mdi-logout</v-icon>
        Log out
      </v-btn>
    </template>

    <!-- main dashboard content -->
    <div class="dashboard-container">
      <!-- Welcome Section -->
      <div class="text-center mb-8">
        <h1 class="text-h4 font-weight-bold mb-2">Welcome to OPHV2</h1>
        <p class="text-h6 text-medium-emphasis">
          Hello, {{ auth.user?.email }}
        </p>
        <v-chip 
          :color="getRoleColor(auth.role)" 
          size="large"
          class="mt-2"
        >
          <v-icon left>{{ getRoleIcon(auth.role) }}</v-icon>
          {{ auth.role }}
        </v-chip>
      </div>

      <!-- 🎯 YOUR DEBUG: Show role and admin status (enhanced) -->
      <v-card v-if="auth.role" class="mb-6 pa-4" variant="outlined">
        <h3 class="text-h6 font-weight-bold mb-3">
          <v-icon left>mdi-bug</v-icon>
          Debug Info
        </h3>
        <v-row>
          <v-col cols="12" md="6">
            <p><strong>Role:</strong> {{ auth.role }}</p>
            <p><strong>Is Admin:</strong> {{ auth.isAdmin }}</p>
            <p><strong>Is Owner:</strong> {{ auth.isOwner }}</p>
          </v-col>
          <v-col cols="12" md="6">
            <p><strong>Effective Permissions:</strong> {{ auth.effectivePermissions.length }}</p>
            <p><strong>Ready:</strong> {{ auth.ready }}</p>
            <p><strong>User ID:</strong> {{ auth.user?.uid?.substring(0, 8) }}...</p>
          </v-col>
        </v-row>
      </v-card>

      <!-- Quick Actions -->
      <v-row justify="center">
        <v-col cols="12" md="8" lg="6">
          <v-card class="pa-4">
            <v-card-title class="text-h5 font-weight-bold text-center mb-4">
              Quick Actions
            </v-card-title>
            
            <v-row>
              <!-- Profile Card -->
              <v-col cols="12" sm="6">
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

              <!-- Admin Card (only for admins using your fixed logic) -->
              <v-col v-if="auth.isAdmin" cols="12" sm="6">
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

              <!-- Coming Soon Cards -->
              <v-col cols="12" :sm="auth.isAdmin ? 12 : 6">
                <v-row>
                  <v-col cols="4">
                    <v-card
                      variant="outlined"
                      class="text-center pa-3"
                      disabled
                    >
                      <v-icon size="36" color="grey" class="mb-2">
                        mdi-folder-multiple
                      </v-icon>
                      <h4 class="text-subtitle-1">Projects</h4>
                      <p class="text-caption text-medium-emphasis">
                        Coming Soon
                      </p>
                    </v-card>
                  </v-col>
                  <v-col cols="4">
                    <v-card
                      variant="outlined"
                      class="text-center pa-3"
                      disabled
                    >
                      <v-icon size="36" color="grey" class="mb-2">
                        mdi-forum
                      </v-icon>
                      <h4 class="text-subtitle-1">Forums</h4>
                      <p class="text-caption text-medium-emphasis">
                        Coming Soon
                      </p>
                    </v-card>
                  </v-col>
                  <v-col cols="4">
                    <v-card
                      variant="outlined"
                      class="text-center pa-3"
                      disabled
                    >
                      <v-icon size="36" color="grey" class="mb-2">
                        mdi-calendar
                      </v-icon>
                      <h4 class="text-subtitle-1">Calendar</h4>
                      <p class="text-caption text-medium-emphasis">
                        Coming Soon
                      </p>
                    </v-card>
                  </v-col>
                </v-row>
              </v-col>
            </v-row>
          </v-card>
        </v-col>
      </v-row>

      <!-- System Status (for admins using your fixed logic) -->
      <v-row v-if="auth.isAdmin" justify="center" class="mt-6">
        <v-col cols="12" md="8" lg="6">
          <v-card variant="outlined">
            <v-card-title class="text-h6 font-weight-bold">
              <v-icon left>mdi-chart-line</v-icon>
              System Overview
            </v-card-title>
            <v-card-text>
              <v-row>
                <v-col cols="6">
                  <div class="text-center">
                    <div class="text-h4 font-weight-bold text-primary">
                      {{ auth.role === 'owner' ? '∞' : '?' }}
                    </div>
                    <div class="text-body-2 text-medium-emphasis">
                      Active Users
                    </div>
                  </div>
                </v-col>
                <v-col cols="6">
                  <div class="text-center">
                    <div class="text-h4 font-weight-bold text-success">
                      ✓
                    </div>
                    <div class="text-body-2 text-medium-emphasis">
                      System Status
                    </div>
                  </div>
                </v-col>
              </v-row>
            </v-card-text>
          </v-card>
        </v-col>
      </v-row>
    </div>
  </AppLayout>
</template>

<script>
// Helper methods for the component
export default {
  methods: {
    getRoleColor(role) {
      const colors = {
        owner: 'purple',
        admin: 'red',
        user: 'blue',
        viewer: 'green',
        pending: 'orange'
      }
      return colors[role] || 'grey'
    },
    
    getRoleIcon(role) {
      const icons = {
        owner: 'mdi-crown',
        admin: 'mdi-shield-account',
        user: 'mdi-account',
        viewer: 'mdi-eye',
        pending: 'mdi-clock-outline'
      }
      return icons[role] || 'mdi-help'
    }
  }
}
</script>

<style scoped>
.dashboard-container {
  max-width: 1200px;
  margin: 0 auto;
}

/* Brand-compliant typography */
.text-h4, .text-h5, .text-h6 {
  font-family: 'Franklin Gothic', 'Arial', sans-serif;
}

.text-body-1, .text-body-2, .text-subtitle-1 {
  font-family: 'Cambria', serif;
}

/* Card hover effects */
.v-card[hover]:hover {
  transform: translateY(-2px);
  transition: transform 0.2s ease;
}

/* Responsive design */
@media (max-width: 600px) {
  .dashboard-container {
    padding: 0 16px;
  }
}
</style>