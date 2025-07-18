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