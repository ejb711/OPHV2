<!-- src/views/DashboardView.vue - FIXED Admin Button for Owner -->
<script setup>
import { computed }      from 'vue'
import { useRouter }     from 'vue-router'
import AppLayout         from '../components/AppLayout.vue'
import { useAuthStore }  from '../stores/auth'

const router = useRouter()
const auth   = useAuthStore()

/* helper so we both sign-out and go back to the login page */
async function handleLogout () {
  await auth.logout()
  router.push('/')
}

/* 🔧 FIX: Use auth store's isAdmin computed (includes owner + admin) */
// Remove the local computed and use auth.isAdmin directly
</script>

<template>
  <AppLayout>
    <!--  top-right actions slot  -->
    <template #actions>
      <!-- 🔧 FIX: Use auth.isAdmin instead of local isAdmin -->
      <v-btn
        v-if="auth.isAdmin"
        class="mr-3"
        color="secondary"
        variant="flat"
        @click="router.push('/admin')"
      >
        Admin
      </v-btn>

      <v-btn
        color="accent"
        variant="flat"
        @click="handleLogout"
      >
        Log out
      </v-btn>
    </template>

    <!--  main dashboard content  -->
    <h1 class="text-h4 mb-4">Dashboard</h1>
    <p>Welcome, {{ auth.user?.email }}</p>
    
    <!-- 🎯 DEBUG: Show role and admin status -->
    <v-card class="mt-4 pa-4" v-if="auth.role">
      <h3>Debug Info:</h3>
      <p><strong>Role:</strong> {{ auth.role }}</p>
      <p><strong>Is Admin:</strong> {{ auth.isAdmin }}</p>
      <p><strong>Is Owner:</strong> {{ auth.isOwner }}</p>
      <p><strong>Effective Permissions:</strong> {{ auth.effectivePermissions.length }}</p>
    </v-card>
  </AppLayout>
</template>