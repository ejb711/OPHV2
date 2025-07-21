<!-- client/src/components/layout/AppBar.vue -->
<template>
  <v-app-bar 
    :elevation="2"
    color="surface"
    :density="mobile ? 'compact' : 'comfortable'"
  >
    <!-- Menu toggle for mobile or to hide/show drawer -->
    <v-app-bar-nav-icon
      v-if="showNavIcon"
      @click="$emit('toggle-navigation')"
    />
    
    <!-- App Title/Logo -->
    <v-app-bar-title class="d-flex align-center">
      <v-btn
        variant="text"
        class="text-button font-weight-bold text-h6"
        :to="homeRoute"
        :disabled="loading"
      >
        {{ title }}
      </v-btn>
    </v-app-bar-title>

    <v-spacer />
    
    <!-- Global Loading Indicator -->
    <v-progress-circular
      v-if="globalLoading"
      indeterminate
      size="24"
      width="2"
      class="mr-3"
    />

    <!-- Page-specific actions slot -->
    <slot name="actions" />
    
    <!-- User Menu -->
    <UserMenu 
      v-if="user"
      :user="user"
      :user-name="userName"
      :user-role="userRole"
      :user-avatar="userAvatar"
      :can-access-admin="canAccessAdmin"
      :loading="loading"
      @logout="$emit('logout')"
    />
  </v-app-bar>
</template>

<script setup>
import { computed } from 'vue'
import { useDisplay } from 'vuetify'
import UserMenu from './UserMenu.vue'

// Props
const props = defineProps({
  title: {
    type: String,
    default: 'OPHV2'
  },
  user: Object,
  userRole: String,
  showNavIcon: Boolean,
  loading: Boolean,
  globalLoading: Boolean,
  canAccessAdmin: Boolean
})

// Emits
defineEmits(['toggle-navigation', 'logout'])

// Composables
const { mobile } = useDisplay()

// Computed
const homeRoute = computed(() => {
  if (!props.user) return '/'
  if (props.userRole === 'pending') return '/awaiting'
  return '/dash'
})

const userName = computed(() => {
  if (!props.user) return 'Guest'
  return props.user.displayName || props.user.email?.split('@')[0] || 'User'
})

const userAvatar = computed(() => {
  return props.user?.photoURL || null
})
</script>

<style scoped>
/* App bar styling - clean and consistent */
.v-app-bar {
  background-color: #ffffff !important;
  border-bottom: 1px solid rgba(0, 0, 0, 0.12) !important;
}
</style>