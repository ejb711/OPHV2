<!-- client/src/components/admin/roles/RoleEditDialog.vue -->
<script setup>
import { ref, computed, watch } from 'vue'
import PermissionSelector from './PermissionSelector.vue'
import { getHierarchyItems } from '@/composables/useRoleManagement'

const props = defineProps({
  modelValue: {
    type: Boolean,
    default: false
  },
  role: {
    type: Object,
    default: null
  },
  permissionsByCategory: {
    type: Object,
    required: true
  },
  categories: {
    type: Array,
    required: true
  },
  loading: {
    type: Boolean,
    default: false
  }
})

const emit = defineEmits(['update:modelValue', 'update'])

// Local state
const form = ref({
  name: '',
  description: '',
  permissions: [],
  hierarchy: 30
})

// Computed
const dialog = computed({
  get: () => props.modelValue,
  set: (value) => emit('update:modelValue', value)
})

const hierarchyItems = computed(() => {
  if (!props.role) return []
  return getHierarchyItems(props.role.isSystemRole, props.role.hierarchy)
})

const isValid = computed(() => {
  return form.value.name?.trim().length > 0
})

const isOwnerRole = computed(() => {
  return props.role?.id === 'owner'
})

// Methods
const submit = () => {
  if (!isValid.value) return
  emit('update', { ...form.value })
}

// Watch for dialog open/close and role changes
watch([() => props.modelValue, () => props.role], ([newDialog, newRole]) => {
  if (newDialog && newRole) {
    // Initialize form with role data
    form.value = {
      name: newRole.name || '',
      description: newRole.description || '',
      permissions: [...(newRole.permissions || [])],
      hierarchy: newRole.hierarchy || 30
    }
  }
})
</script>

<template>
  <v-dialog v-model="dialog" max-width="800" persistent scrollable>
    <v-card v-if="role">
      <v-card-title class="text-h5">
        Edit Role: {{ role.name }}
      </v-card-title>

      <v-card-text>
        <v-row>
          <v-col cols="12" md="6">
            <v-text-field
              v-model="form.name"
              label="Role Name"
              variant="outlined"
              required
              :rules="[v => !!v || 'Name is required']"
              :disabled="role.isSystemRole"
            ></v-text-field>
          </v-col>

          <v-col cols="12" md="6">
            <v-select
              v-model="form.hierarchy"
              :items="hierarchyItems"
              label="Hierarchy Level"
              variant="outlined"
              :disabled="role.isSystemRole"
              hint="Higher numbers have more authority"
              persistent-hint
            ></v-select>
          </v-col>

          <v-col cols="12">
            <v-textarea
              v-model="form.description"
              label="Description"
              variant="outlined"
              rows="2"
              :disabled="role.isSystemRole"
            ></v-textarea>
          </v-col>
        </v-row>

        <v-divider class="my-4"></v-divider>

        <div class="text-h6 mb-3">Permissions</div>

        <v-alert
          v-if="isOwnerRole"
          type="info"
          variant="tonal"
          class="mb-4"
        >
          Owner role has all permissions by default and cannot be modified.
        </v-alert>

        <PermissionSelector
          v-if="!isOwnerRole"
          v-model="form.permissions"
          :permissions-by-category="permissionsByCategory"
          :categories="categories"
          :readonly="isOwnerRole"
        />
      </v-card-text>

      <v-card-actions>
        <v-spacer></v-spacer>
        <v-btn
          variant="text"
          @click="dialog = false"
          :disabled="loading"
        >
          Cancel
        </v-btn>
        <v-btn
          color="primary"
          variant="elevated"
          @click="submit"
          :loading="loading"
          :disabled="!isValid"
        >
          Update Role
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>