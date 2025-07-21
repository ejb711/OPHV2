<!-- client/src/components/admin/roles/RoleCard.vue -->
<script setup>
import { computed } from 'vue'
import PermissionGuard from '@/components/PermissionGuard.vue'

const props = defineProps({
  role: {
    type: Object,
    required: true
  },
  userCount: {
    type: Number,
    default: 0
  },
  canDelete: {
    type: Boolean,
    default: false
  }
})

const emit = defineEmits(['edit', 'clone', 'delete'])

// Computed properties
const roleColor = computed(() => {
  const colorMap = {
    'owner': 'deep-purple',
    'admin': 'indigo',
    'user': 'blue',
    'viewer': 'teal',
    'pending': 'orange'
  }
  return colorMap[props.role.id] || 'surface'
})

const roleIcon = computed(() => {
  return props.role.isSystemRole ? 'mdi-shield-lock' : 'mdi-shield-account'
})

const permissionPreview = computed(() => {
  return (props.role.permissions || []).slice(0, 4)
})

const additionalPermissions = computed(() => {
  const total = props.role.permissions?.length || 0
  return total > 4 ? total - 4 : 0
})
</script>

<template>
  <v-card
    :color="role.isSystemRole ? roleColor : 'surface'"
    :variant="role.isSystemRole ? 'tonal' : 'elevated'"
    class="h-100"
  >
    <v-card-title class="d-flex align-center">
      <v-icon size="small" class="mr-2">
        {{ roleIcon }}
      </v-icon>
      {{ role.name }}
      <v-spacer></v-spacer>
      <v-chip size="small" variant="elevated">
        {{ userCount }} users
      </v-chip>
    </v-card-title>

    <v-card-subtitle v-if="role.description">
      {{ role.description }}
    </v-card-subtitle>

    <v-card-text>
      <div class="text-body-2 mb-2">
        <strong>Hierarchy Level:</strong> {{ role.hierarchy || 0 }}
      </div>
      
      <div class="text-body-2 mb-2">
        <strong>Permissions:</strong> {{ role.permissions?.length || 0 }}
      </div>

      <!-- Permission Preview -->
      <v-chip-group v-if="permissionPreview.length > 0">
        <v-chip
          v-for="perm in permissionPreview"
          :key="perm"
          size="x-small"
          label
        >
          {{ perm }}
        </v-chip>
        <v-chip
          v-if="additionalPermissions > 0"
          size="x-small"
          variant="tonal"
        >
          +{{ additionalPermissions }} more
        </v-chip>
      </v-chip-group>
    </v-card-text>

    <v-card-actions>
      <PermissionGuard permissions="manage_roles">
        <v-btn
          variant="text"
          size="small"
          @click="$emit('edit', role)"
          :disabled="role.id === 'owner'"
        >
          <v-icon size="small" class="mr-1">mdi-pencil</v-icon>
          Edit
        </v-btn>

        <v-btn
          variant="text"
          size="small"
          @click="$emit('clone', role)"
        >
          <v-icon size="small" class="mr-1">mdi-content-copy</v-icon>
          Clone
        </v-btn>

        <v-btn
          v-if="!role.isSystemRole"
          variant="text"
          size="small"
          color="error"
          @click="$emit('delete', role)"
          :disabled="!canDelete"
        >
          <v-icon size="small" class="mr-1">mdi-delete</v-icon>
          Delete
        </v-btn>
      </PermissionGuard>
    </v-card-actions>
  </v-card>
</template>