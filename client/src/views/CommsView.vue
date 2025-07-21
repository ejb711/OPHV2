<template>
  <AppLayout>
    <v-container fluid>
      <v-row>
        <v-col cols="12">
          <h1 class="text-h4 mb-6">Communications Dashboard</h1>
        </v-col>
      </v-row>
      
      <v-row>
        <v-col cols="12">
          <v-alert
            type="info"
            variant="tonal"
            prominent
          >
            <v-alert-title class="text-h6">
              Coming Soon!
            </v-alert-title>
            <div class="mt-2">
              The Communications Dashboard is currently under development. 
              This feature will allow you to manage communications projects across Louisiana's 9 health regions.
            </div>
          </v-alert>
        </v-col>
      </v-row>

      <!-- Placeholder content to verify routing works -->
      <v-row class="mt-6">
        <v-col cols="12" md="4">
          <v-card>
            <v-card-title>
              <v-icon left>mdi-folder-outline</v-icon>
              Projects
            </v-card-title>
            <v-card-text>
              Manage communications projects across all regions
            </v-card-text>
          </v-card>
        </v-col>
        
        <v-col cols="12" md="4">
          <v-card>
            <v-card-title>
              <v-icon left>mdi-account-group</v-icon>
              Coordinators
            </v-card-title>
            <v-card-text>
              Regional coordinators and assignments
            </v-card-text>
          </v-card>
        </v-col>
        
        <v-col cols="12" md="4">
          <v-card>
            <v-card-title>
              <v-icon left>mdi-file-chart</v-icon>
              Reports
            </v-card-title>
            <v-card-text>
              Analytics and export capabilities
            </v-card-text>
          </v-card>
        </v-col>
      </v-row>
    </v-container>
  </AppLayout>
</template>

<script setup>
import AppLayout from '@/components/AppLayout.vue'
import { usePermissions } from '@/composables/usePermissions'
import { onMounted } from 'vue'

const { canViewComms, canManageComms } = usePermissions()

onMounted(() => {
  console.log('Communications Dashboard loaded')
  console.log('User can view comms:', canViewComms.value)
  console.log('User can manage comms:', canManageComms.value)
})
</script>