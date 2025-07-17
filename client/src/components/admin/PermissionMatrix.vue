<!-- client/src/components/admin/PermissionMatrix.vue -->
<script setup>
import { ref, computed, onMounted } from 'vue'
import { usePermissionsStore } from '../../stores/permissions'

const emit = defineEmits(['activity'])

const permissionsStore = usePermissionsStore()
const loading = ref(false)

const permissions = computed(() => permissionsStore.permissionsByCategory)
const roles = computed(() => permissionsStore.allRoles)

onMounted(async () => {
  loading.value = true
  await permissionsStore.loadAllData()
  loading.value = false
})
</script>

<template>
  <div class="pa-4">
    <v-alert type="info" variant="tonal" class="mb-4">
      <v-alert-title>Permission Matrix Coming Soon</v-alert-title>
      This section will provide:
      <ul class="mt-2">
        <li>Visual matrix of all permissions by role</li>
        <li>Permission dependencies and relationships</li>
        <li>Quick permission assignment interface</li>
        <li>Permission usage analytics</li>
      </ul>
    </v-alert>

    <!-- Permission Categories Preview -->
    <v-expansion-panels>
      <v-expansion-panel
        v-for="(perms, category) in permissions"
        :key="category"
      >
        <v-expansion-panel-title>
          <v-icon size="small" class="mr-2">mdi-key-variant</v-icon>
          {{ category.replace('_', ' ').toUpperCase() }}
          <v-spacer></v-spacer>
          <v-chip size="x-small">
            {{ perms.length }} permissions
          </v-chip>
        </v-expansion-panel-title>
        <v-expansion-panel-text>
          <v-list density="compact">
            <v-list-item
              v-for="perm in perms"
              :key="perm.id"
            >
              <v-list-item-title>
                {{ perm.name }}
              </v-list-item-title>
              <v-list-item-subtitle>
                {{ perm.description }}
              </v-list-item-subtitle>
              <template v-slot:append>
                <v-chip size="x-small" variant="tonal">
                  {{ perm.id }}
                </v-chip>
              </template>
            </v-list-item>
          </v-list>
        </v-expansion-panel-text>
      </v-expansion-panel>
    </v-expansion-panels>
  </div>
</template>