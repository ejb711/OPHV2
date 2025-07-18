<script setup>
import { useRouter }   from 'vue-router'
import { useAuthStore } from '../stores/auth'
const router = useRouter()
const auth   = useAuthStore()

function handleLogout () {
  auth.logout().then(() => router.push('/'))
}
</script>

<template>
  <main class="d-flex flex-column align-center justify-center fill-height text-center ga-4">
    <h1 class="text-h5">Account awaiting approval</h1>
    <p>You're signed in as <strong>{{ auth.user?.email }}</strong></p>
    <p>An admin must approve your account before you can access BRCO.</p>

    <!-- new button -->
    <v-btn color="accent" class="mt-4" @click="handleLogout">
      Return to Login
    </v-btn>
  </main>
</template>