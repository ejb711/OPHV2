<!-- client/src/components/admin/UserActions.vue -->
<template>
  <div class="d-flex align-center justify-end">
    <!-- Edit Profile Button -->
    <v-tooltip text="Edit Profile" location="top">
      <template v-slot:activator="{ props: tooltipProps }">
        <v-btn
          v-bind="tooltipProps"
          :icon="true"
          size="small"
          variant="text"
          color="primary"
          @click="$emit('edit', user)"
          :disabled="!canEdit"
        >
          <v-icon size="20">mdi-pencil</v-icon>
        </v-btn>
      </template>
    </v-tooltip>

    <!-- Password Reset Button -->
    <v-tooltip text="Reset Password" location="top">
      <template v-slot:activator="{ props: tooltipProps }">
        <v-btn
          v-bind="tooltipProps"
          :icon="true"
          size="small"
          variant="text"
          color="warning"
          @click="$emit('reset-password', user)"
          :disabled="!canEdit"
        >
          <v-icon size="20">mdi-key-change</v-icon>
        </v-btn>
      </template>
    </v-tooltip>

    <!-- Delete Button -->
    <PermissionGuard permission="delete_users">
      <v-tooltip text="Delete User" location="top">
        <template v-slot:activator="{ props: tooltipProps }">
          <v-btn
            v-bind="tooltipProps"
            :icon="true"
            size="small"
            variant="text"
            color="error"
            @click="$emit('delete', user)"
            :disabled="!canDelete"
          >
            <v-icon size="20">mdi-delete</v-icon>
          </v-btn>
        </template>
      </v-tooltip>
    </PermissionGuard>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useAuthStore } from '@/stores/auth'
import PermissionGuard from '@/components/PermissionGuard.vue'

// Props
const props = defineProps({
  user: {
    type: Object,
    required: true
  }
})

// Emits
const emit = defineEmits(['edit', 'reset-password', 'delete'])

// Store
const authStore = useAuthStore()

// Computed
const canEdit = computed(() => {
  // Cannot edit owners unless you are an owner
  if (props.user.role === 'owner' && authStore.role !== 'owner') {
    return false
  }
  return authStore.hasPermission('edit_users')
})

const canDelete = computed(() => {
  // Cannot delete yourself
  if (props.user.uid === authStore.user?.uid) {
    return false
  }
  // Cannot delete owners unless you are an owner
  if (props.user.role === 'owner' && authStore.role !== 'owner') {
    return false
  }
  return authStore.hasPermission('delete_users')
})
</script>