<!-- client/src/views/AwaitingApproval.vue -->
<template>
  <main class="d-flex flex-column align-center justify-center fill-height text-center ga-4">
    <v-card max-width="500" class="mx-auto">
      <v-card-text class="pa-8">
        <v-icon 
          icon="mdi-clock-alert-outline" 
          size="64" 
          color="orange"
          class="mb-4"
        />
        
        <h1 class="text-h5 mb-4">Account Awaiting Approval</h1>
        
        <p class="text-body-1 mb-2">
          You're signed in as <strong>{{ auth.user?.email }}</strong>
        </p>
        
        <p class="text-body-2 text-medium-emphasis mb-6">
          An administrator must approve your account before you can access OPHV2. 
          You will receive an email notification once your account has been approved.
        </p>

        <v-divider class="mb-6" />

        <p class="text-caption text-medium-emphasis mb-4">
          If you believe this is an error or need immediate access, 
          please contact your system administrator.
        </p>

        <!-- Logout button -->
        <v-btn 
          color="primary" 
          variant="outlined"
          @click="handleLogout"
          prepend-icon="mdi-logout"
        >
          Return to Login
        </v-btn>
      </v-card-text>
    </v-card>
  </main>
</template>

<script setup>
import { useRouter } from 'vue-router'
import { useAuthStore } from '../stores/auth'

const router = useRouter()
const auth = useAuthStore()

async function handleLogout() {
  try {
    await auth.logout()
    router.push('/')
  } catch (error) {
    console.error('Logout error:', error)
    // Still try to navigate to login even if logout fails
    router.push('/')
  }
}
</script>

<style scoped>
/* Ensure full height layout */
main {
  min-height: 100vh;
  background: linear-gradient(135deg, #f5f5f5 0%, #e0e0e0 100%);
}

/* Brand-compliant typography */
h1 {
  font-family: 'ITC Franklin Gothic', 'Arial', sans-serif;
  font-weight: 600;
}

p {
  font-family: 'Cambria', serif;
}

/* Card styling */
.v-card {
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
}
</style>