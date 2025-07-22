<!-- client/src/components/GlobalSnackbar.vue -->
<template>
  <v-snackbar
    v-model="snackbar.show"
    :color="snackbar.color"
    :timeout="snackbar.timeout"
    :location="snackbar.location"
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
</template>

<script setup>
import { useSnackbar } from '@/composables/useSnackbar'

// Get the global snackbar state
const { snackbar } = useSnackbar()
</script>