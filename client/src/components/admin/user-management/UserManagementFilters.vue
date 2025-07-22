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
          <div class="field-group">
            <label class="field-label">Filter by Role</label>
            <v-select
              :model-value="roleFilter"
              @update:model-value="$emit('update:roleFilter', $event)"
              :items="roleOptions"
              placeholder="All roles"
              variant="outlined"
              density="compact"
              clearable
              hide-details
              class="matching-height"
            />
          </div>
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

<style scoped>
/* External label styling */
.field-group {
  width: 100%;
}

.field-label {
  display: block;
  font-size: 0.875rem;
  font-weight: 600;
  color: #003057;
  margin-bottom: 8px;
  font-family: 'Cambria', Georgia, serif;
}

/* Hide v-select built-in labels */
:deep(.v-select .v-field__label),
:deep(.v-select .v-label) {
  display: none !important;
}

/* Hide selection text overlay */
:deep(.v-select .v-field__input .v-select__selection-text) {
  display: none !important;
}

/* Ensure matching heights for both fields */
:deep(.v-text-field .v-field),
:deep(.v-select .v-field) {
  min-height: 40px !important;
}

:deep(.v-text-field .v-field__input),
:deep(.v-select .v-field__input) {
  min-height: 40px !important;
  padding-top: 10px !important;
  padding-bottom: 10px !important;
}

/* Ensure the select matches the text field exactly */
.matching-height :deep(.v-field) {
  height: 40px !important;
}

.matching-height :deep(.v-field__input) {
  display: flex;
  align-items: center;
}

/* Align the dropdown arrow */
:deep(.v-select .v-field__append-inner) {
  padding-top: 0 !important;
  align-items: center !important;
}

/* Make sure the label doesn't affect field height */
.field-label {
  line-height: 1.2;
}

/* Responsive adjustment */
@media (max-width: 960px) {
  .v-col {
    margin-bottom: 16px;
  }
}
</style>