<!-- File: client/src/components/DebugPermissions.vue -->
<template>
  <v-card class="ma-4" color="info" variant="tonal">
    <v-card-title class="d-flex align-center">
      <v-icon class="mr-2">mdi-bug</v-icon>
      🔍 Permission Debug Info
      <v-spacer />
      <v-btn 
        icon="mdi-refresh" 
        size="small" 
        @click="refreshData"
        :loading="refreshing"
      />
    </v-card-title>
    <v-card-text>
      <v-row>
        <v-col cols="12" md="6">
          <div class="mb-4">
            <h4 class="text-h6 mb-2">Basic Info</h4>
            <div><strong>Your Role:</strong> {{ auth.role || 'Not loaded' }}</div>
            <div><strong>Is Owner:</strong> {{ auth.isOwner }}</div>
            <div><strong>Is Admin:</strong> {{ auth.isAdmin }}</div>
            <div><strong>Auth Ready:</strong> {{ auth.ready }}</div>
            <div><strong>User ID:</strong> {{ auth.user?.uid?.substring(0, 12) }}...</div>
          </div>
          
          <div class="mb-4">
            <h4 class="text-h6 mb-2">Permission Counts</h4>
            <div><strong>Role Permissions:</strong> {{ auth.rolePermissions.length }}</div>
            <div><strong>Custom Permissions:</strong> {{ auth.customPermissions.length }}</div>
            <div><strong>Denied Permissions:</strong> {{ auth.deniedPermissions.length }}</div>
            <div><strong>Effective Permissions:</strong> {{ auth.effectivePermissions.length }}</div>
          </div>
        </v-col>
        
        <v-col cols="12" md="6">
          <div class="mb-4">
            <h4 class="text-h6 mb-2">Key Permission Checks</h4>
            <v-chip 
              :color="auth.hasPermission('manage_users') ? 'green' : 'red'" 
              size="small" 
              class="ma-1"
            >
              manage_users: {{ auth.hasPermission('manage_users') }}
            </v-chip>
            <v-chip 
              :color="auth.hasPermission('manage_roles') ? 'green' : 'red'" 
              size="small" 
              class="ma-1"
            >
              manage_roles: {{ auth.hasPermission('manage_roles') }}
            </v-chip>
            <v-chip 
              :color="auth.hasPermission('manage_permissions') ? 'green' : 'red'" 
              size="small" 
              class="ma-1"
            >
              manage_permissions: {{ auth.hasPermission('manage_permissions') }}
            </v-chip>
            <v-chip 
              :color="auth.hasPermission('view_users') ? 'green' : 'red'" 
              size="small" 
              class="ma-1"
            >
              view_users: {{ auth.hasPermission('view_users') }}
            </v-chip>
          </div>
        </v-col>
      </v-row>
      
      <!-- Detailed Permission Lists -->
      <v-expansion-panels class="mt-4">
        <v-expansion-panel title="Role Permissions Details">
          <v-expansion-panel-text>
            <div v-if="auth.rolePermissions.length === 0" class="text-grey">
              ⚠️ No role permissions loaded
            </div>
            <v-chip 
              v-for="perm in auth.rolePermissions" 
              :key="perm" 
              class="ma-1" 
              size="small"
              color="blue"
            >
              {{ perm }}
            </v-chip>
          </v-expansion-panel-text>
        </v-expansion-panel>
        
        <v-expansion-panel title="Custom Permissions">
          <v-expansion-panel-text>
            <div v-if="auth.customPermissions.length === 0" class="text-grey">
              No custom permissions
            </div>
            <v-chip 
              v-for="perm in auth.customPermissions" 
              :key="perm" 
              class="ma-1" 
              size="small" 
              color="green"
            >
              {{ perm }}
            </v-chip>
          </v-expansion-panel-text>
        </v-expansion-panel>
        
        <v-expansion-panel title="All Effective Permissions">
          <v-expansion-panel-text>
            <div v-if="auth.effectivePermissions.length === 0" class="text-grey">
              ⚠️ No effective permissions - using fallback!
            </div>
            <v-chip 
              v-for="perm in auth.effectivePermissions" 
              :key="perm" 
              class="ma-1" 
              size="small" 
              color="purple"
            >
              {{ perm }}
            </v-chip>
          </v-expansion-panel-text>
        </v-expansion-panel>
      </v-expansion-panels>
      
      <!-- Warning if no permissions -->
      <v-alert 
        v-if="auth.effectivePermissions.length === 0 && auth.role === 'admin'" 
        type="warning" 
        class="mt-4"
      >
        <v-icon>mdi-alert</v-icon>
        <strong>Permission Issue Detected!</strong><br>
        You're an admin but have 0 effective permissions. Use the Permission Fixer below to resolve this.
      </v-alert>
    </v-card-text>
  </v-card>
</template>

<script setup>
import { ref } from 'vue'
import { useAuthStore } from '../stores/auth'

const auth = useAuthStore()
const refreshing = ref(false)

async function refreshData() {
  refreshing.value = true
  await auth.refreshPermissions()
  refreshing.value = false
}
</script>