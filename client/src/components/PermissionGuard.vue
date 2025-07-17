<!-- client/src/components/PermissionGuard.vue -->
<script setup>
import { computed } from 'vue'
import { usePermissions } from '../composables/usePermissions'

const props = defineProps({
  // Single permission required
  permission: {
    type: String,
    default: null
  },
  
  // Multiple permissions (any one required)
  anyPermissions: {
    type: Array,
    default: () => []
  },
  
  // Multiple permissions (all required)
  allPermissions: {
    type: Array,
    default: () => []
  },
  
  // Role required
  role: {
    type: String,
    default: null
  },
  
  // Multiple roles (any one required)
  anyRoles: {
    type: Array,
    default: () => []
  },
  
  // Invert the logic (show when permission is NOT present)
  not: {
    type: Boolean,
    default: false
  },
  
  // Show fallback content when permission check fails
  showFallback: {
    type: Boolean,
    default: false
  },
  
  // Fallback message
  fallbackMessage: {
    type: String,
    default: 'You do not have permission to view this content'
  }
})

const { 
  hasPermission, 
  hasAnyPermission, 
  hasAllPermissions,
  isOwner,
  isAdmin,
  isUser,
  isPending,
  getPermissionErrorMessage
} = usePermissions()

const hasAccess = computed(() => {
  let access = true

  // Check single permission
  if (props.permission) {
    access = hasPermission(props.permission)
  }
  
  // Check any permissions
  if (props.anyPermissions.length > 0) {
    access = access && hasAnyPermission(props.anyPermissions)
  }
  
  // Check all permissions
  if (props.allPermissions.length > 0) {
    access = access && hasAllPermissions(props.allPermissions)
  }
  
  // Check single role
  if (props.role) {
    switch (props.role) {
      case 'owner':
        access = access && isOwner.value
        break
      case 'admin':
        access = access && isAdmin.value
        break
      case 'user':
        access = access && isUser.value
        break
      case 'pending':
        access = access && isPending.value
        break
      default:
        access = false
    }
  }
  
  // Check any roles
  if (props.anyRoles.length > 0) {
    const roleCheck = props.anyRoles.some(role => {
      switch (role) {
        case 'owner': return isOwner.value
        case 'admin': return isAdmin.value
        case 'user': return isUser.value
        case 'pending': return isPending.value
        default: return false
      }
    })
    access = access && roleCheck
  }
  
  // Invert logic if requested
  return props.not ? !access : access
})

const errorMessage = computed(() => {
  if (props.fallbackMessage !== 'You do not have permission to view this content') {
    return props.fallbackMessage
  }
  
  if (props.permission) {
    return getPermissionErrorMessage(props.permission)
  }
  
  return 'You do not have permission to view this content'
})
</script>

<template>
  <div v-if="hasAccess">
    <slot />
  </div>
  
  <div v-else-if="showFallback">
    <slot name="fallback">
      <v-alert
        type="warning"
        variant="tonal"
        class="ma-2"
      >
        <v-icon>mdi-shield-alert</v-icon>
        {{ errorMessage }}
      </v-alert>
    </slot>
  </div>
</template>

<!-- Usage Examples:

Basic permission check:
<PermissionGuard permission="manage_users">
  <v-btn>Delete User</v-btn>
</PermissionGuard>

Multiple permissions (any):
<PermissionGuard :any-permissions="['edit_users', 'manage_users']">
  <UserEditForm />
</PermissionGuard>

Multiple permissions (all):
<PermissionGuard :all-permissions="['view_users', 'manage_system']">
  <AdminPanel />
</PermissionGuard>

Role check:
<PermissionGuard role="admin">
  <AdminDashboard />
</PermissionGuard>

Multiple roles:
<PermissionGuard :any-roles="['admin', 'owner']">
  <SystemSettings />
</PermissionGuard>

With fallback message:
<PermissionGuard 
  permission="view_analytics" 
  :show-fallback="true"
  fallback-message="Analytics access requires premium subscription"
>
  <AnalyticsChart />
</PermissionGuard>

Inverted logic (show when NOT having permission):
<PermissionGuard permission="manage_users" :not="true">
  <div>You are viewing in read-only mode</div>
</PermissionGuard>

-->