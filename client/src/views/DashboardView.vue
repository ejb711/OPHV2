<script setup>
import { computed }      from 'vue'
import { useRouter }     from 'vue-router'
import { useAuthStore }  from '../stores/auth'
import AppLayout         from '../components/AppLayout.vue'

const router = useRouter()
const auth   = useAuthStore()

// 1️⃣ helper so the button both logs out AND routes home
function handleLogout () {
  auth.logout().then(() => router.push('/'))
}

// 2️⃣ computed so Vue updates as soon as auth.user becomes non-null
const userEmail = computed(() => auth.user?.email)
</script>

<template>
  <AppLayout>
    <!-- button lives in the app-bar actions slot -->
    <template #actions>
      <v-btn color="accent" variant="flat" @click="handleLogout">
        Log Out
      </v-btn>
    </template>

    <h1 class="text-h5 mb-4">Dashboard</h1>

    <!-- show a tiny spinner until Firebase hydrates -->
    <p v-if="!userEmail">Loading…</p>
    <p v-else>Welcome, {{ userEmail }}</p>
  </AppLayout>
</template>
