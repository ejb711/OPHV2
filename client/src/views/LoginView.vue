<script setup>
import { useRouter } from 'vue-router';
import { ref, onMounted } from "vue";
import { auth } from "../auth";
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  onAuthStateChanged,
  signOut,
} from "firebase/auth";

const mode = ref("login");           // "login" | "signup"
const email = ref("");
const password = ref("");
const user = ref(null);
const errorMsg = ref("");
const router = useRouter();

onMounted(() =>
  onAuthStateChanged(auth, (u) => { user.value = u; })
);

async function handleSubmit() {
  errorMsg.value = "";
  try {
    if (mode.value === "signup") {
      await createUserWithEmailAndPassword(auth, email.value, password.value);
    } else {
      await signInWithEmailAndPassword(auth, email.value, password.value);
    }
    email.value = password.value = "";
    router.push("/dash");
  } catch (err) {
    errorMsg.value = err.code.replace("auth/", "");
    errorMsg.value = err.code
      ? err.code.replace("auth/", "")
      : err.message || "unknown-error";
  }
}

function toggleMode() {
  mode.value = mode.value === "login" ? "signup" : "login";
}

function handleLogout() {
  signOut(auth);
}
</script>

<template>
  <main class="flex flex-col items-center justify-center h-screen gap-6">
    <h1 class="text-2xl font-bold">OPHV2</h1>

    <!-- Signed-in -->
    <div v-if="user" class="text-center">
      <p class="mb-4">Welcome, {{ user.email }}</p>
      <button @click="handleLogout" class="px-4 py-2 rounded bg-red-500 text-white">
        Sign Out
      </button>
    </div>

    <!-- Signed-out -->
    <form v-else @submit.prevent="handleSubmit" class="flex flex-col gap-3 w-64">
      <input
        v-model="email"
        type="email"
        required
        placeholder="Email"
        class="border p-2 rounded"
      />
      <input
        v-model="password"
        type="password"
        required
        placeholder="Password"
        class="border p-2 rounded"
      />

      <button class="px-4 py-2 rounded bg-blue-600 text-white">
        {{ mode === 'login' ? 'Log In' : 'Sign Up' }}
      </button>

      <p v-if="errorMsg" class="text-sm text-red-600">{{ errorMsg }}</p>

      <p class="text-xs text-center cursor-pointer text-gray-500" @click="toggleMode">
        {{ mode === 'login'
            ? 'Need an account? Sign up'
            : 'Have an account? Log in' }}
      </p>
    </form>
  </main>
</template>
