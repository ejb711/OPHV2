<!-- src/components/AppLayout.vue -->
<script setup>
import { useRouter } from 'vue-router'

const router = useRouter()
</script>

<template>
  <v-app>
    <!-- ── Top navigation bar ──────────────────────────────────── -->
    <v-app-bar dense color="primary">
      <!-- Home goes to /dash if signed-in, otherwise / -->
      <v-btn
        text
        class="text-button font-weight-bold"
        @click="router.push('/dash')"
      >
        BRCO
      </v-btn>

      <v-spacer />

      <!-- page-specific buttons (e.g.  Admin / Log-out) -->
      <slot name="actions" />
    </v-app-bar>

    <!-- ── Page content ─────────────────────────────────────────── -->
    <v-main class="pa-4">
      <slot />
    </v-main>
  </v-app>
</template>
