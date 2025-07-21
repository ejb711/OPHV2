<!-- client/src/components/layout/UserMenu.vue -->
<template>
  <v-menu offset-y>
    <template v-slot:activator="{ props }">
      <v-btn
        icon
        v-bind="props"
        :loading="loading"
      >
        <v-avatar size="32">
          <v-icon v-if="!userAvatar">mdi-account-circle</v-icon>
          <v-img v-else :src="userAvatar" />
        </v-avatar>
      </v-btn>
    </template>
    
    <v-list density="compact" min-width="200">
      <v-list-item>
        <v-list-item-title class="font-weight-medium">
          {{ userName }}
        </v-list-item-title>
        <v-list-item-subtitle>
          {{ roleDisplay }}
        </v-list-item-subtitle>
      </v-list-item>
      
      <v-divider class="my-1" />
      
      <v-list-item
        to="/profile"
        prepend-icon="mdi-account"
      >
        <v-list-item-title>Profile</v-list-item-title>
      </v-list-item>
      
      <v-list-item
        v-if="canAccessAdmin"
        to="/admin"
        prepend-icon="mdi-shield-crown"
      >
        <v-list-item-title>Admin Panel</v-list-item-title>
      </v-list-item>
      
      <v-divider class="my-1" />
      
      <v-list-item
        @click="$emit('logout')"
        prepend-icon="mdi-logout"
      >
        <v-list-item-title>Logout</v-list-item-title>
      </v-list-item>
    </v-list>
  </v-menu>
</template>

<script setup>
import { computed } from 'vue'

// Props
const props = defineProps({
  user: Object,
  userName: String,
  userRole: String,
  userAvatar: String,
  canAccessAdmin: Boolean,
  loading: Boolean
})

// Emits
defineEmits(['logout'])

// Computed
const roleDisplay = computed(() => {
  const roleNames = {
    owner: 'System Owner',
    admin: 'Administrator',
    user: 'User',
    viewer: 'Viewer',
    pending: 'Pending Approval'
  }
  return roleNames[props.userRole] || 'Unknown Role'
})
</script>

<style scoped>
/* User avatar hover effect */
.v-avatar {
  transition: transform 0.2s ease;
}

.v-btn:hover .v-avatar {
  transform: scale(1.1);
}
</style>