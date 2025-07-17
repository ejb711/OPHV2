<script setup>
import { useAuthStore } from './stores/auth'
const auth = useAuthStore()
import { ref } from 'vue'
const hideSplash = ref(false)
import { watch } from 'vue'
import { useActivityTracker } from './composables/useActivityTracker'

useActivityTracker()

watch(
  () => auth.ready,
  (r) => { if (r) setTimeout(() => (hideSplash.value = true), 400) } // 400 ms
)
</script>

<template>
  <transition name="fade">
    <div v-if="!hideSplash" class="splash">Loading…</div>
  </transition>

  <div v-show="hideSplash">
    <RouterView />
  </div>
</template>

<!-- client/src/App.vue - Add this style section to your App.vue -->
<style>
/* Global styles for OPHV2 */

/* Fix for invisible Vuetify buttons */
.v-btn--variant-text {
  opacity: 0.7 !important;
}

.v-btn--variant-text:hover {
  opacity: 1 !important;
}

/* Ensure icon buttons are always visible */
.v-btn--icon {
  opacity: 0.8 !important;
}

.v-btn--icon:hover {
  opacity: 1 !important;
  background-color: rgba(0, 0, 0, 0.04);
}

/* Data table action buttons specific fix */
.v-data-table .v-btn--variant-text {
  opacity: 0.8 !important;
}

.v-data-table .v-btn--variant-text:hover {
  opacity: 1 !important;
}

/* Fix for disabled buttons */
.v-btn--disabled {
  opacity: 0.3 !important;
}

/* Louisiana Department of Health Typography */
h1, h2, h3, h4, h5, h6, .v-card-title {
  font-family: 'Franklin Gothic Medium', 'Arial Narrow', Arial, sans-serif !important;
}

.text-h1, .text-h2, .text-h3, .text-h4, .text-h5, .text-h6 {
  font-family: 'Franklin Gothic Medium', 'Arial Narrow', Arial, sans-serif !important;
  font-weight: 600 !important;
}

body, .v-application, .text-body-1, .text-body-2, .v-card-text {
  font-family: Cambria, Georgia, serif !important;
}

/* Vuetify theme adjustments */
.v-application {
  background: #f5f5f5;
}

.v-card {
  box-shadow: 0 2px 4px rgba(0,0,0,0.1) !important;
}

.v-toolbar {
  box-shadow: none !important;
  border-bottom: 1px solid rgba(0,0,0,0.12);
}
</style>
