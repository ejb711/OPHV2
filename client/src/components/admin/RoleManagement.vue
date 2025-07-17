<!-- client/src/components/admin/RoleManagement.vue -->
<script setup>
import { ref, computed, onMounted } from 'vue'
import { usePermissionsStore } from '../../stores/permissions'

const emit = defineEmits(['activity'])

const permissionsStore = usePermissionsStore()
const loading = ref(false)

const roles = computed(() => permissionsStore.allRoles)
const permissions = computed(() => permissionsStore.allPermissions)

onMounted(async () => {
  loading.value = true
  await permissionsStore.loadAllData()
  loading.value = false
})
</script>

<template>
  <div class="pa-4">
    <v-alert type="info" variant="tonal" class="mb-4">
      <v-alert-title>Role Management Coming Soon</v-alert-title>
      This section will allow you to:
      <ul class="mt-2">
        <li>Create custom roles with specific permissions</li>
        <li>Edit existing role permissions</li>
        <li>Clone roles for easy setup</li>
        <li>View role hierarchy and dependencies</li>
      </ul>
    </v-alert>

    <!-- Current Roles Preview -->
    <v-row>
      <v-col v-for="role in roles" :key="role.id" cols="12" md="6" lg="4">
        <v-card>
          <v-card-title>
            <v-icon size="small" class="mr-2">mdi-shield-account</v-icon>
            {{ role.name }}
          </v-card-title>
          <v-card-subtitle>
            {{ role.description }}
          </v-card-subtitle>
          <v-card-text>
            <div class="text-caption text-medium-emphasis mb-2">
              Permissions: {{ role.permissions?.length || 0 }}
            </div>
            <v-chip-group>
              <v-chip
                v-for="(perm, idx) in (role.permissions || []).slice(0, 3)"
                :key="perm"
                size="x-small"
                label
              >
                {{ perm }}
              </v-chip>
              <v-chip
                v-if="(role.permissions || []).length > 3"
                size="x-small"
                variant="tonal"
              >
                +{{ role.permissions.length - 3 }} more
              </v-chip>
            </v-chip-group>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>
  </div>
</template>