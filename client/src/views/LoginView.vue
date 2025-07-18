<script setup>
import { ref, watch } from 'vue'          // ← watch is now imported
import { useRouter }   from 'vue-router'
import { useAuthStore } from '../stores/auth'

/* ----- local state ------------------------------------------------------- */
const mode      = ref('login')            // 'login' | 'signup'
const email     = ref('')
const password  = ref('')
const errorMsg  = ref('')

/* ----- composables ------------------------------------------------------- */
const router = useRouter()
const auth   = useAuthStore()

/* ----- helpers ----------------------------------------------------------- */
function toggleMode () {
  mode.value = mode.value === 'login' ? 'signup' : 'login'
}

/* ----- submit ------------------------------------------------------------ */
async function handleSubmit () {
  errorMsg.value = ''
  try {
    if (mode.value === 'signup') {
      await auth.signup(email.value, password.value)
    } else {
      await auth.login(email.value, password.value)
    }

    /* wait until the store has fetched role ≠ null */
    await new Promise(resolve => {
      const stop = watch(
        () => auth.role,
        r => { if (r !== null) { stop(); resolve() } }
      )
    })

    router.push(auth.role === 'pending' ? '/awaiting' : '/dash')
  } catch (err) {
    errorMsg.value = err.code?.replace('auth/', '') || err.message
  }
}
</script>

<template>
  <main class="d-flex flex-column align-center justify-center fill-height ga-4">
    <h1 class="text-h4 font-weight-bold">BRCO: Public Health Platform</h1>

    <!-- signed-in (only visible if you browse back here) -->
    <div v-if="auth.user && auth.role !== 'pending'">
      <p class="mb-3">Welcome, {{ auth.user.email }}</p>
      <v-btn color="accent" @click="auth.logout()">Sign&nbsp;Out</v-btn>
    </div>

    <!-- sign-in / sign-up -->
    <v-card v-else width="400" elevation="4" class="pa-4">
      <v-text-field v-model="email"     label="Email"    type="email"    outlined required />
      <v-text-field v-model="password"  label="Password" type="password" outlined required />

      <v-btn
        :color="mode === 'login' ? 'primary' : 'secondary'"
        class="mt-4"
        block
        @click="handleSubmit"
      >
        {{ mode === 'login' ? 'Log In' : 'Sign Up' }}
      </v-btn>

      <v-alert
        v-if="errorMsg"
        type="error"
        variant="tonal"
        class="mt-3"
        dense
      >
        {{ errorMsg }}
      </v-alert>

      <div
        class="mt-2 text-caption text-end cursor-pointer"
        @click="toggleMode"
      >
        {{ mode === 'login'
            ? 'Need an account? Sign up'
            : 'Have an account? Log in' }}
      </div>
    </v-card>
  </main>
</template>
