<!-- client/src/components/admin/roles/PermissionSelector.vue -->
<script setup>
import { ref, computed } from 'vue'
import { getCategoryIcon } from '@/composables/useRoleManagement'

const props = defineProps({
  modelValue: {
    type: Array,
    default: () => []
  },
  permissionsByCategory: {
    type: Object,
    required: true
  },
  categories: {
    type: Array,
    required: true
  },
  readonly: {
    type: Boolean,
    default: false
  }
})

const emit = defineEmits(['update:modelValue'])

// Local state
const expandedPanels = ref([])

// Methods
const togglePermission = (permissionId) => {
  if (props.readonly) return
  
  const newPermissions = [...props.modelValue]
  const index = newPermissions.indexOf(permissionId)
  
  if (index > -1) {
    newPermissions.splice(index, 1)
  } else {
    newPermissions.push(permissionId)
  }
  
  emit('update:modelValue', newPermissions)
}

const toggleAllInCategory = (category) => {
  if (props.readonly) return
  
  const categoryPerms = props.permissionsByCategory[category].map(p => p.id)
  const hasAll = categoryPerms.every(p => props.modelValue.includes(p))
  
  if (hasAll) {
    // Remove all
    emit('update:modelValue', props.modelValue.filter(p => !categoryPerms.includes(p)))
  } else {
    // Add all missing
    const toAdd = categoryPerms.filter(p => !props.modelValue.includes(p))
    emit('update:modelValue', [...props.modelValue, ...toAdd])
  }
}

const isSelected = (permissionId) => {
  return props.modelValue.includes(permissionId)
}

const isCategorySelected = (category) => {
  const categoryPerms = props.permissionsByCategory[category] || []
  return categoryPerms.length > 0 && categoryPerms.every(p => props.modelValue.includes(p.id))
}

const isCategoryIndeterminate = (category) => {
  const categoryPerms = props.permissionsByCategory[category] || []
  const selectedCount = categoryPerms.filter(p => props.modelValue.includes(p.id)).length
  return selectedCount > 0 && selectedCount < categoryPerms.length
}

const getCategoryCount = (category) => {
  const categoryPerms = props.permissionsByCategory[category] || []
  return categoryPerms.filter(p => props.modelValue.includes(p.id)).length
}
</script>

<template>
  <v-expansion-panels 
    v-model="expandedPanels" 
    multiple
    variant="accordion"
  >
    <v-expansion-panel
      v-for="category in categories"
      :key="category"
    >
      <v-expansion-panel-title>
        <div class="d-flex align-center">
          <v-icon size="small" class="mr-2">
            {{ getCategoryIcon(category) }}
          </v-icon>
          {{ category.replace(/_/g, ' ').toUpperCase() }}
          <v-spacer></v-spacer>
          <v-chip size="x-small" class="mr-2">
            {{ getCategoryCount(category) }} / {{ permissionsByCategory[category]?.length || 0 }}
          </v-chip>
        </div>
      </v-expansion-panel-title>

      <v-expansion-panel-text>
        <v-checkbox
          v-if="!readonly"
          label="Select All"
          :model-value="isCategorySelected(category)"
          :indeterminate="isCategoryIndeterminate(category)"
          @update:model-value="toggleAllInCategory(category)"
          density="compact"
          class="mb-2"
        ></v-checkbox>

        <v-divider v-if="!readonly" class="mb-2"></v-divider>

        <v-row dense>
          <v-col
            v-for="perm in permissionsByCategory[category]"
            :key="perm.id"
            cols="12"
            md="6"
          >
            <v-checkbox
              :model-value="isSelected(perm.id)"
              @update:model-value="togglePermission(perm.id)"
              density="compact"
              hide-details
              :readonly="readonly"
            >
              <template v-slot:label>
                <div>
                  <div>{{ perm.name }}</div>
                  <div class="text-caption text-grey">{{ perm.description }}</div>
                </div>
              </template>
            </v-checkbox>
          </v-col>
        </v-row>
      </v-expansion-panel-text>
    </v-expansion-panel>
  </v-expansion-panels>
</template>