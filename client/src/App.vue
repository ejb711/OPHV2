<script setup>
import { useAuthStore } from './stores/auth'
const auth = useAuthStore()
import { ref } from 'vue'
const hideSplash = ref(false)
import { watch } from 'vue'

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

<style>
.fade-leave-active{transition:opacity 5s ease}
.fade-leave-from  {opacity:1}
.fade-leave-to    {opacity:0}
</style>
