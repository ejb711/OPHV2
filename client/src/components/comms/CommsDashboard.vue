<template>
  <v-container fluid class="pa-4">
    <!-- Dashboard Header -->
    <v-row>
      <v-col cols="12">
        <div class="d-flex align-center justify-space-between mb-6">
          <div>
            <h1 class="text-h4 font-weight-bold text-primary">
              Communications Dashboard
            </h1>
            <p class="text-body-1 text-medium-emphasis mt-1">
              Manage communications projects across Louisiana's 9 health regions
            </p>
          </div>
          
          <!-- Quick Actions -->
          <div v-if="canCreateProjects" class="d-flex gap-2">
            <v-btn
              color="primary"
              prepend-icon="mdi-plus"
              variant="flat"
              disabled
            >
              New Project
            </v-btn>
            <v-btn
              variant="outlined"
              prepend-icon="mdi-download"
              disabled
            >
              Export
            </v-btn>
          </div>
        </div>
      </v-col>
    </v-row>

    <!-- Statistics Overview -->
    <v-row>
      <v-col cols="12">
        <CommsStats />
      </v-col>
    </v-row>

    <!-- Filters and Search -->
    <v-row class="mt-4">
      <v-col cols="12">
        <CommsFilters />
      </v-col>
    </v-row>

    <!-- Main Content Area -->
    <v-row class="mt-6">
      <v-col cols="12">
        <v-card>
          <v-card-text class="text-center py-12">
            <v-icon
              size="64"
              color="grey-lighten-1"
              class="mb-4"
            >
              mdi-folder-open-outline
            </v-icon>
            <h3 class="text-h6 text-medium-emphasis">
              Projects will appear here
            </h3>
            <p class="text-body-2 text-disabled mt-2">
              Once projects are created, they'll be displayed in this area
            </p>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>

    <!-- Louisiana Regions Reference -->
    <v-row class="mt-6">
      <v-col cols="12">
        <v-card variant="outlined">
          <v-card-title class="text-h6">
            <v-icon start>mdi-map-marker-multiple</v-icon>
            Louisiana Health Regions
          </v-card-title>
          <v-card-text>
            <v-chip-group>
              <v-chip
                v-for="region in regions"
                :key="region.id"
                :color="region.color"
                variant="flat"
                size="small"
                class="text-white"
              >
                {{ region.shortName }}
              </v-chip>
            </v-chip-group>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>
  </v-container>
</template>

<script setup>
import CommsStats from './CommsStats.vue'
import CommsFilters from './CommsFilters.vue'
import { usePermissions } from '@/composables/usePermissions'
import { LOUISIANA_REGIONS } from '@/config/louisiana-regions'
import { computed } from 'vue'

const { hasPermission } = usePermissions()

// Check permissions
const canCreateProjects = computed(() => hasPermission('create_comms_projects'))

// Convert regions object to array for display
const regions = computed(() => 
  Object.values(LOUISIANA_REGIONS).sort((a, b) => a.id.localeCompare(b.id))
)
</script>

<style scoped>
.gap-2 > * + * {
  margin-left: 8px;
}
</style>