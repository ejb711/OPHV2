<!-- client/src/components/admin/RoleChip.vue -->
<template>
  <v-chip
    :color="roleColor"
    :size="size"
    :variant="variant"
    :prepend-icon="roleIcon"
  >
    {{ roleText }}
  </v-chip>
</template>

<script setup>
import { computed } from 'vue'

// Props
const props = defineProps({
  role: {
    type: String,
    required: true
  },
  size: {
    type: String,
    default: 'default'
  },
  variant: {
    type: String,
    default: 'tonal'
  }
})

// Computed
const roleConfig = computed(() => {
  const configs = {
    owner: {
      color: 'purple',
      icon: 'mdi-crown',
      text: 'Owner'
    },
    admin: {
      color: 'red',
      icon: 'mdi-shield-account',
      text: 'Admin'
    },
    user: {
      color: 'blue',
      icon: 'mdi-account',
      text: 'User'
    },
    viewer: {
      color: 'green',
      icon: 'mdi-eye',
      text: 'Viewer'
    },
    pending: {
      color: 'orange',
      icon: 'mdi-account-clock',
      text: 'Pending'
    }
  }
  
  return configs[props.role] || {
    color: 'grey',
    icon: 'mdi-help-circle',
    text: props.role
  }
})

const roleColor = computed(() => roleConfig.value.color)
const roleIcon = computed(() => roleConfig.value.icon)
const roleText = computed(() => roleConfig.value.text)
</script>
