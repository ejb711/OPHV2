<!-- client/src/components/layout/LoadingOverlay.vue -->
<template>
  <v-overlay
    :model-value="loading"
    persistent
    class="align-center justify-center"
  >
    <v-progress-circular
      indeterminate
      size="64"
      :color="color"
    />
    <div v-if="message" class="mt-4 text-center">
      {{ message }}
    </div>
  </v-overlay>
</template>

<script setup>
// Props
defineProps({
  loading: Boolean,
  message: String,
  color: {
    type: String,
    default: 'primary'
  }
})
</script>

<style scoped>
/* Loading overlay styling */
.v-overlay__content {
  text-align: center;
}
</style>