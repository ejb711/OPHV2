<!-- src/views/DashboardView.vue -->
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

/* show button only when current user is an admin */
const isAdmin = computed(() => auth.role === 'admin')
</script>

<template>
  <AppLayout>
    <!--  top-right actions slot  -->
    <template #actions>
      <v-btn
        v-if="isAdmin"
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
  </AppLayout>
</template>
