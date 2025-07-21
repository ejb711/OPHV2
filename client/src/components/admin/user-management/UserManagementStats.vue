<!-- client/src/components/admin/user-management/UserManagementStats.vue -->
<template>
  <v-row class="mb-6">
    <v-col cols="12" sm="6" md="3">
      <v-card>
        <v-card-text class="d-flex align-center">
          <div>
            <div class="text-h5 font-weight-bold">{{ totalUsers }}</div>
            <div class="text-body-2 text-medium-emphasis">Total Users</div>
          </div>
          <v-spacer />
          <v-icon size="40" color="primary">mdi-account-multiple</v-icon>
        </v-card-text>
      </v-card>
    </v-col>
    
    <v-col cols="12" sm="6" md="3">
      <v-card>
        <v-card-text class="d-flex align-center">
          <div>
            <div class="text-h5 font-weight-bold">{{ activeUsers }}</div>
            <div class="text-body-2 text-medium-emphasis">Active</div>
          </div>
          <v-spacer />
          <v-icon size="40" color="success">mdi-account-check</v-icon>
        </v-card-text>
      </v-card>
    </v-col>
    
    <v-col cols="12" sm="6" md="3">
      <v-card>
        <v-card-text class="d-flex align-center">
          <div>
            <div class="text-h5 font-weight-bold">{{ pendingUsers }}</div>
            <div class="text-body-2 text-medium-emphasis">Pending</div>
          </div>
          <v-spacer />
          <v-icon size="40" color="warning">mdi-account-clock</v-icon>
        </v-card-text>
      </v-card>
    </v-col>
    
    <v-col cols="12" sm="6" md="3">
      <v-card>
        <v-card-text class="d-flex align-center">
          <div>
            <div class="text-h5 font-weight-bold">{{ rolesCount }}</div>
            <div class="text-body-2 text-medium-emphasis">Roles</div>
          </div>
          <v-spacer />
          <v-icon size="40" color="info">mdi-shield-account</v-icon>
        </v-card-text>
      </v-card>
    </v-col>
  </v-row>
</template>

<script setup>
// Props
defineProps({
  totalUsers: {
    type: Number,
    required: true
  },
  activeUsers: {
    type: Number,
    required: true
  },
  pendingUsers: {
    type: Number,
    required: true
  },
  rolesCount: {
    type: Number,
    required: true
  }
})
</script>