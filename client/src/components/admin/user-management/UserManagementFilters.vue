<!-- client/src/components/admin/user-management/UserManagementFilters.vue -->
<template>
  <v-card class="mb-4">
    <v-card-text>
      <v-row align="center">
        <v-col cols="12" md="6">
          <v-text-field
            :model-value="search"
            @update:model-value="$emit('update:search', $event)"
            prepend-inner-icon="mdi-magnify"
            label="Search users..."
            variant="outlined"
            density="compact"
            clearable
            hide-details
          />
        </v-col>
        
        <v-col cols="12" md="3">
          <v-select
            :model-value="roleFilter"
            @update:model-value="$emit('update:roleFilter', $event)"
            :items="roleOptions"
            label="Filter by Role"
            variant="outlined"
            density="compact"
            clearable
            hide-details
          />
        </v-col>
        
        <v-col cols="12" md="3" class="text-right">
          <v-btn
            color="primary"
            prepend-icon="mdi-account-plus"
            @click="$emit('add-user')"
          >
            Add User
          </v-btn>
          
          <v-btn
            icon="mdi-refresh"
            variant="text"
            class="ml-2"
            @click="$emit('refresh')"
            :loading="loading"
          >
            <v-icon>mdi-refresh</v-icon>
          </v-btn>
        </v-col>
      </v-row>
    </v-card-text>
  </v-card>
</template>

<script setup>
// Props
defineProps({
  search: {
    type: String,
    default: ''
  },
  roleFilter: {
    type: String,
    default: null
  },
  roleOptions: {
    type: Array,
    required: true
  },
  loading: {
    type: Boolean,
    default: false
  }
})

// Emits
defineEmits([
  'update:search',
  'update:roleFilter',
  'add-user',
  'refresh'
])
</script>