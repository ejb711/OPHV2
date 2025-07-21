<!-- client/src/components/profile/ProfileSecurityTab.vue - Modularized Version -->
<template>
  <v-card-text class="pa-6">
    <div class="mb-6">
      <h2 class="text-h6 font-weight-bold mb-2">
        <v-icon class="me-2" color="primary">mdi-shield-account</v-icon>
        Security Settings
      </h2>
      <p class="text-body-2 text-medium-emphasis mb-4">
        Manage your account security and privacy settings
      </p>

      <!-- Account Information Cards -->
      <AccountInfoCards @show-snackbar="showSnackbar" />
    </div>

    <v-row>
      <!-- Password Management & Security Preferences Column -->
      <v-col cols="12" lg="6">
        <PasswordManagement @show-snackbar="showSnackbar" />
        
        <SecurityPreferences
          :security-settings="securitySettings"
          :session-timeout-options="sessionTimeoutOptions"
          :loading="loading"
          @update-settings="updateSecuritySettings"
          @revoke-sessions="revokeAllSessions"
          @download-data="downloadAccountData"
        />
      </v-col>

      <!-- Activity Monitoring Column -->
      <v-col cols="12" lg="6">
        <RecentActivity 
          :recent-events="recentEvents"
          :loading-events="loadingEvents"
        />
        
        <LoginHistory 
          :login-history="loginHistory"
        />
      </v-col>
    </v-row>

    <!-- Snackbar for notifications -->
    <v-snackbar
      v-model="snackbar.show"
      :color="snackbar.color"
      :timeout="4000"
      location="bottom"
    >
      {{ snackbar.message }}
      <template v-slot:actions>
        <v-btn
          variant="text"
          @click="snackbar.show = false"
        >
          Close
        </v-btn>
      </template>
    </v-snackbar>
  </v-card-text>
</template>

<script setup>
import { onMounted } from 'vue'
import { useSecuritySettings } from '../../composables/useSecuritySettings'

// Import modular components
import AccountInfoCards from './security/AccountInfoCards.vue'
import PasswordManagement from './security/PasswordManagement.vue'
import SecurityPreferences from './security/SecurityPreferences.vue'
import RecentActivity from './security/RecentActivity.vue'
import LoginHistory from './security/LoginHistory.vue'

// Use the security settings composable
const {
  // State
  securitySettings,
  sessionTimeoutOptions,
  loading,
  loadingEvents,
  recentEvents,
  loginHistory,
  snackbar,
  
  // Methods
  showSnackbar,
  loadSecuritySettings,
  updateSecuritySettings,
  loadSecurityEvents,
  revokeAllSessions,
  downloadAccountData
} = useSecuritySettings()

// Load data on mount
onMounted(() => {
  loadSecuritySettings()
  loadSecurityEvents()
})
</script>

<style scoped>
/* Main container styling - minimal styles as most are in sub-components */
:deep(.v-card-text) {
  font-family: 'Cambria', Georgia, serif;
}
</style>