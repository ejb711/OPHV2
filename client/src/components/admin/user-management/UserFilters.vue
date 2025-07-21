<!-- client/src/components/admin/user-management/UserFilters.vue -->
<template>
  <v-card variant="outlined" class="mb-4">
    <v-card-text>
      <v-row align="center">
        <!-- Search Field -->
        <v-col cols="12" md="4">
          <v-text-field
            :model-value="search"
            @update:model-value="$emit('update:search', $event)"
            prepend-inner-icon="mdi-magnify"
            label="Search users..."
            variant="outlined"
            density="comfortable"
            clearable
            hide-details
          />
        </v-col>

        <!-- Role Filter -->
        <v-col cols="12" sm="6" md="3">
          <v-select
            :model-value="roleFilter"
            @update:model-value="$emit('update:roleFilter', $event)"
            :items="roleFilterItems"
            label="Filter by Role"
            variant="outlined"
            density="comfortable"
            hide-details
          />
        </v-col>

        <!-- Status Filter -->
        <v-col cols="12" sm="6" md="3">
          <v-select
            :model-value="statusFilter"
            @update:model-value="$emit('update:statusFilter', $event)"
            :items="statusFilterItems"
            label="Filter by Status"
            variant="outlined"
            density="comfortable"
            hide-details
          />
        </v-col>

        <!-- Refresh Button -->
        <v-col cols="12" md="2" class="text-right">
          <v-btn
            variant="outlined"
            prepend-icon="mdi-refresh"
            @click="$emit('refresh')"
          >
            Refresh
          </v-btn>
        </v-col>
      </v-row>
    </v-card-text>
  </v-card>
</template>

<script setup>
import { computed } from 'vue'

// Props
const props = defineProps({
  search: {
    type: String,
    default: ''
  },
  roleFilter: {
    type: String,
    default: 'all'
  },
  statusFilter: {
    type: String,
    default: 'all'
  },
  roles: {
    type: Array,
    default: () => []
  }
})

// Emits
const emit = defineEmits([
  'update:search',
  'update:roleFilter', 
  'update:statusFilter',
  'refresh'
])

// Computed
const roleFilterItems = computed(() => {
  const items = [{ value: 'all', title: 'All Roles' }]
  props.roles.forEach(role => {
    items.push({
      value: role.id,
      title: role.name
    })
  })
  return items
})

const statusFilterItems = [
  { value: 'all', title: 'All Status' },
  { value: 'active', title: 'Active' },
  { value: 'suspended', title: 'Suspended' },
  { value: 'pending', title: 'Pending' }
]
</script>