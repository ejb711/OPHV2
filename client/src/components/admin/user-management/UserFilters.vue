<!-- /workspaces/OPHV2/client/src/components/admin/user-management/UserFilters.vue -->

<template>
  <!-- FORCE UPDATE: <?= Date.now() ?> -->
  <!-- DIAGNOSTIC VERSION - BRIGHT COLORS TO CONFIRM COMPONENT IS UPDATING -->
  <div style="background-color: #ff0000; padding: 20px; margin: 20px 0; border: 5px solid #00ff00;">
    <h1 style="color: #ffffff; font-size: 30px; margin-bottom: 20px;">
      🚨 USERFILTERS DIAGNOSTIC VERSION - IF YOU SEE THIS, COMPONENT IS LOADING 🚨
    </h1>
    
    <v-row class="filter-row">
      <!-- Role Filter with BRIGHT YELLOW BACKGROUND -->
      <v-col cols="12" sm="6" md="3">
        <div class="field-group" style="background-color: #ffff00; padding: 10px; border: 3px solid #0000ff;">
          <label class="field-label" style="display: block; font-size: 18px; color: #000000; font-weight: bold; margin-bottom: 10px;">
            ROLE FILTER LABEL
          </label>
          <v-select
            v-model="selectedRole"
            :items="roleOptions"
            variant="outlined"
            placeholder="All roles"
            hide-details
            density="comfortable"
            style="background-color: white;"
            @update:modelValue="$emit('update:role', $event)"
          >
            <template v-slot:selection="{ item }">
              <div class="role-selection">
                <v-chip
                  v-if="item.value !== 'all'"
                  :color="getRoleColor(item.value)"
                  size="small"
                  variant="flat"
                >
                  {{ item.title }}
                </v-chip>
                <span v-else>{{ item.title }}</span>
              </div>
            </template>
            <template v-slot:item="{ item, props }">
              <v-list-item v-bind="props">
                <template v-slot:prepend v-if="item.value !== 'all'">
                  <v-chip
                    :color="getRoleColor(item.value)"
                    size="small"
                    variant="flat"
                    class="mr-2"
                  >
                    {{ item.title }}
                  </v-chip>
                </template>
              </v-list-item>
            </template>
          </v-select>
        </div>
      </v-col>

      <!-- Search Filter with BRIGHT GREEN BACKGROUND -->
      <v-col cols="12" sm="6" md="3">
        <div class="field-group" style="background-color: #00ff00; padding: 10px; border: 3px solid #ff00ff;">
          <label class="field-label" style="display: block; font-size: 18px; color: #000000; font-weight: bold; margin-bottom: 10px;">
            SEARCH LABEL
          </label>
          <v-text-field
            v-model="searchQuery"
            placeholder="Name or email..."
            variant="outlined"
            hide-details
            density="comfortable"
            clearable
            style="background-color: white;"
            @update:modelValue="handleSearchUpdate"
          >
            <template #prepend-inner>
              <v-icon size="small">mdi-magnify</v-icon>
            </template>
          </v-text-field>
        </div>
      </v-col>

      <!-- Status Filter with BRIGHT BLUE BACKGROUND -->
      <v-col cols="12" sm="6" md="3">
        <div class="field-group" style="background-color: #00ffff; padding: 10px; border: 3px solid #ff0000;">
          <label class="field-label" style="display: block; font-size: 18px; color: #000000; font-weight: bold; margin-bottom: 10px;">
            STATUS LABEL
          </label>
          <v-select
            v-model="selectedStatus"
            :items="statusOptions"
            variant="outlined"
            placeholder="All statuses"
            hide-details
            density="comfortable"
            style="background-color: white;"
            @update:modelValue="$emit('update:status', $event)"
          >
            <template v-slot:selection="{ item }">
              <v-chip
                v-if="item.value !== 'all'"
                :color="getStatusColor(item.value)"
                size="small"
                variant="flat"
              >
                {{ item.title }}
              </v-chip>
              <span v-else>{{ item.title }}</span>
            </template>
          </v-select>
        </div>
      </v-col>

      <!-- Clear Filters Button -->
      <v-col cols="12" sm="6" md="3" class="d-flex align-end">
        <v-btn
          v-if="hasActiveFilters"
          @click="clearFilters"
          variant="outlined"
          color="primary"
          block
        >
          <v-icon left>mdi-filter-remove</v-icon>
          Clear Filters
        </v-btn>
      </v-col>
    </v-row>
    
    <!-- DIAGNOSTIC INFO -->
    <div style="background-color: #ffffff; padding: 10px; margin-top: 20px; border: 2px solid #000000;">
      <h3 style="color: #ff0000;">Diagnostic Info:</h3>
      <p><strong>Component Mounted:</strong> YES</p>
      <p><strong>Selected Role:</strong> {{ selectedRole }}</p>
      <p><strong>Search Query:</strong> {{ searchQuery || '(empty)' }}</p>
      <p><strong>Selected Status:</strong> {{ selectedStatus }}</p>
      <p><strong>Timestamp:</strong> {{ new Date().toLocaleTimeString() }}</p>
    </div>
  </div>
</template>

<script>
export default {
  name: 'UserFilters',
  
  props: {
    role: {
      type: String,
      default: 'all'
    },
    search: {
      type: String,
      default: ''
    },
    status: {
      type: String,
      default: 'all'
    }
  },
  
  emits: ['update:role', 'update:search', 'update:status', 'clear'],
  
  data() {
    return {
      selectedRole: this.role,
      searchQuery: this.search,
      selectedStatus: this.status,
      searchTimeout: null
    }
  },
  
  computed: {
    roleOptions() {
      return [
        { value: 'all', title: 'All Roles' },
        { value: 'owner', title: 'Owner' },
        { value: 'admin', title: 'Admin' },
        { value: 'user', title: 'User' },
        { value: 'viewer', title: 'Viewer' },
        { value: 'pending', title: 'Pending' }
      ]
    },
    
    statusOptions() {
      return [
        { value: 'all', title: 'All Statuses' },
        { value: 'active', title: 'Active' },
        { value: 'inactive', title: 'Inactive' },
        { value: 'suspended', title: 'Suspended' }
      ]
    },
    
    hasActiveFilters() {
      return this.selectedRole !== 'all' || 
             this.searchQuery !== '' || 
             this.selectedStatus !== 'all'
    }
  },
  
  watch: {
    role(newVal) {
      this.selectedRole = newVal
    },
    search(newVal) {
      this.searchQuery = newVal
    },
    status(newVal) {
      this.selectedStatus = newVal
    }
  },
  
  mounted() {
    console.log('🚨 USERFILTERS DIAGNOSTIC VERSION MOUNTED 🚨');
    console.log('If you see the red banner, the component is loading correctly.');
    console.log('If you do NOT see the red banner, the component file is not being used.');
    console.log('Current filter values:', {
      role: this.selectedRole,
      search: this.searchQuery,
      status: this.selectedStatus
    });
    
    // Alert to make it impossible to miss
    alert('UserFilters Diagnostic Version is loaded! You should see a RED banner with labels.');
  },
  
  methods: {
    getRoleColor(role) {
      const colors = {
        owner: 'purple',
        admin: 'blue',
        user: 'green',
        viewer: 'orange',
        pending: 'grey'
      }
      return colors[role] || 'grey'
    },
    
    getStatusColor(status) {
      const colors = {
        active: 'success',
        inactive: 'warning',
        suspended: 'error'
      }
      return colors[status] || 'grey'
    },
    
    handleSearchUpdate(value) {
      clearTimeout(this.searchTimeout)
      this.searchTimeout = setTimeout(() => {
        this.$emit('update:search', value)
      }, 300)
    },
    
    clearFilters() {
      this.selectedRole = 'all'
      this.searchQuery = ''
      this.selectedStatus = 'all'
      this.$emit('clear')
    }
  }
}
</script>

<style scoped>
/* These styles should make it impossible to miss if the component is loading */
.filter-row {
  margin-bottom: 24px;
  background-color: rgba(255, 0, 0, 0.1) !important;
  padding: 10px !important;
  border: 2px dashed red !important;
}

.field-group {
  width: 100%;
}

.field-label {
  display: block !important;
  font-size: 0.875rem !important;
  font-weight: 600 !important;
  color: #003057 !important;
  margin-bottom: 8px !important;
  font-family: 'Cambria', Georgia, serif !important;
  /* Debug styles */
  text-decoration: underline !important;
  text-transform: uppercase !important;
}

.role-selection {
  display: flex;
  align-items: center;
  width: 100%;
}

/* Force hide Vuetify labels */
:deep(.v-select .v-field__label),
:deep(.v-select .v-label) {
  display: none !important;
}

:deep(.v-select .v-field__input .v-select__selection-text) {
  display: none !important;
}
</style>