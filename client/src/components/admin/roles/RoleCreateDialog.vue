<!-- client/src/components/admin/roles/RoleCreateDialog.vue -->
<script setup>
import { ref, computed, watch } from 'vue'
import PermissionSelector from './PermissionSelector.vue'
import { getHierarchyItems } from '@/composables/useRoleManagement'

const props = defineProps({
  modelValue: {
    type: Boolean,
    default: false
  },
  permissionsByCategory: {
    type: Object,
    required: true
  },
  categories: {
    type: Array,
    required: true
  },
  initialData: {
    type: Object,
    default: null
  },
  loading: {
    type: Boolean,
    default: false
  }
})

const emit = defineEmits(['update:modelValue', 'create'])

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

const isCloning = computed(() => {
  return props.initialData?.name?.includes('(Copy)')
})

const dialogTitle = computed(() => {
  return isCloning.value ? 'Clone Role' : 'Create New Role'
})

const hierarchyItems = computed(() => {
  return getHierarchyItems(false)
})

const isValid = computed(() => {
  return form.value.name?.trim().length > 0
})

// Methods
const submit = () => {
  if (!isValid.value) return
  emit('create', { ...form.value })
}

const reset = () => {
  form.value = {
    name: '',
    description: '',
    permissions: [],
    hierarchy: 30
  }
}

// Watch for dialog open/close
watch(dialog, (newVal) => {
  if (newVal && props.initialData) {
    // Initialize form with clone data
    form.value = {
      name: props.initialData.name || '',
      description: props.initialData.description || '',
      permissions: [...(props.initialData.permissions || [])],
      hierarchy: props.initialData.hierarchy || 30
    }
  } else if (!newVal) {
    // Reset form when closing
    reset()
  }
})
</script>

<template>
  <v-dialog v-model="dialog" max-width="800" persistent scrollable>
    <v-card>
      <v-card-title class="text-h5">
        {{ dialogTitle }}
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
            ></v-text-field>
          </v-col>

          <v-col cols="12" md="6">
            <v-select
              v-model="form.hierarchy"
              :items="hierarchyItems"
              label="Hierarchy Level"
              variant="outlined"
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
            ></v-textarea>
          </v-col>
        </v-row>

        <v-divider class="my-4"></v-divider>

        <div class="text-h6 mb-3">Permissions</div>

        <PermissionSelector
          v-model="form.permissions"
          :permissions-by-category="permissionsByCategory"
          :categories="categories"
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
          {{ isCloning ? 'Clone Role' : 'Create Role' }}
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>