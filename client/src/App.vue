<!-- client/src/App.vue -->
<script setup>
import { useAuthStore } from './stores/auth'
import { ref, watch, onMounted } from 'vue'
import { useActivityTracker } from './composables/useActivityTracker'
import LoadingScreen from './components/LoadingScreen.vue'

const auth = useAuthStore()
const hideSplash = ref(false)
let timerStarted = false // Prevent multiple timers

useActivityTracker()

// Watch for auth state changes - only start timer once
watch(
  () => auth.ready,
  (ready) => {
    if (ready && !timerStarted) {
      timerStarted = true
      console.log('[App.vue] Auth is ready, showing app in 5 seconds...')
      // Display the beautiful loading screen for 5 seconds
      setTimeout(() => {
        console.log('[App.vue] Hiding splash screen')
        hideSplash.value = true
      }, 2750) 
    }
  },
  { immediate: true }
)

// Fallback: If auth doesn't become ready within 10 seconds, show app anyway
onMounted(() => {
  setTimeout(() => {
    if (!hideSplash.value && !timerStarted) {
      console.log('[App.vue] Fallback: Force showing app after 10 seconds')
      hideSplash.value = true
    }
  }, 10000)
})
</script>

<template>
  <!-- Branded Loading Screen -->
  <transition name="fade-out" mode="out-in">
    <LoadingScreen v-if="!hideSplash" />
  </transition>

  <!-- Main Application -->
  <transition name="fade-in" mode="out-in">
    <div v-show="hideSplash" class="app-container">
      <RouterView />
    </div>
  </transition>
</template>

<style scoped>
.app-container {
  min-height: 100vh;
  width: 100%;
}

/* Smooth transition animations */
.fade-out-enter-active,
.fade-out-leave-active {
  transition: all 0.5s ease-in-out;
}

.fade-out-enter-from {
  opacity: 0;
  transform: scale(1.05);
}

.fade-out-leave-to {
  opacity: 0;
  transform: scale(0.95);
}

.fade-in-enter-active {
  transition: all 0.4s ease-out;
}

.fade-in-enter-from {
  opacity: 0;
  transform: translateY(20px);
}
</style>