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
        <CommsStats :stats="projectStats" />
      </v-col>
    </v-row>

    <!-- Filters and Search -->
    <v-row class="mt-4">
      <v-col cols="12">
        <CommsFilters 
          v-model:filters="filters"
          @update:filters="handleFilterUpdate"
        />
      </v-col>
    </v-row>

    <!-- Main Content Area - Project List -->
    <v-row class="mt-6">
      <v-col cols="12">
        <ProjectList 
          :filters="filters"
          @select-project="handleProjectSelect"
          @update:stats="handleStatsUpdate"
        />
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
            <v-row>
              <v-col 
                v-for="(region, key) in louisianaRegions" 
                :key="key"
                cols="12" 
                sm="6" 
                md="4"
              >
                <div class="d-flex align-center gap-2">
                  <v-chip 
                    :color="region.color" 
                    size="small"
                    variant="flat"
                  >
                    {{ region.name }}
                  </v-chip>
                  <span class="text-caption text-medium-emphasis">
                    {{ region.parishes.length }} parishes
                  </span>
                </div>
              </v-col>
            </v-row>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>
  </v-container>
</template>

<script setup>
import { ref, computed } from 'vue'
import { usePermissions } from '@/composables/usePermissions'
import { LOUISIANA_REGIONS } from '@/config/louisiana-regions'
import CommsStats from './CommsStats.vue'
import CommsFilters from './CommsFilters.vue'
import ProjectList from './projects/ProjectList.vue'

// Composables
const { canCreateCommsProjects } = usePermissions()

// State
const filters = ref({
  region: null,
  status: null,
  priority: null,
  search: ''
})

const projectStats = ref({
  total: 0,
  byStatus: {},
  byPriority: {},
  byRegion: {}
})

// Computed
const canCreateProjects = computed(() => canCreateCommsProjects.value)
const louisianaRegions = computed(() => LOUISIANA_REGIONS)

// Methods
function handleFilterUpdate(newFilters) {
  filters.value = { ...newFilters }
}

function handleProjectSelect(project) {
  // TODO: Navigate to project detail view (Phase 6)
  console.log('Selected project:', project)
}

function handleStatsUpdate(stats) {
  projectStats.value = stats
}
</script>

<style scoped>
/* Custom styles following Louisiana Department of Health brand */
.text-primary {
  color: rgb(0, 45, 98) !important; /* LDH Navy Blue */
}
</style>