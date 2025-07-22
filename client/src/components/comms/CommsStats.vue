<template>
  <v-row>
    <!-- Total Projects -->
    <v-col cols="12" sm="6" md="3">
      <v-card>
        <v-card-text class="d-flex align-center">
          <div class="flex-grow-1">
            <div class="text-caption text-medium-emphasis">
              Total Projects
            </div>
            <div class="text-h5 font-weight-bold mt-1">
              {{ stats.totalProjects }}
            </div>
            <div class="text-caption text-success mt-1">
              <v-icon size="x-small">mdi-trending-up</v-icon>
              +{{ stats.projectsThisMonth }} this month
            </div>
          </div>
          <v-avatar
            color="primary"
            size="48"
            variant="tonal"
          >
            <v-icon>mdi-folder-outline</v-icon>
          </v-avatar>
        </v-card-text>
      </v-card>
    </v-col>

    <!-- Active Projects -->
    <v-col cols="12" sm="6" md="3">
      <v-card>
        <v-card-text class="d-flex align-center">
          <div class="flex-grow-1">
            <div class="text-caption text-medium-emphasis">
              Active Projects
            </div>
            <div class="text-h5 font-weight-bold mt-1">
              {{ stats.activeProjects }}
            </div>
            <div class="text-caption text-warning mt-1">
              {{ stats.pendingApproval }} pending approval
            </div>
          </div>
          <v-avatar
            color="success"
            size="48"
            variant="tonal"
          >
            <v-icon>mdi-progress-clock</v-icon>
          </v-avatar>
        </v-card-text>
      </v-card>
    </v-col>

    <!-- Regions Covered -->
    <v-col cols="12" sm="6" md="3">
      <v-card>
        <v-card-text class="d-flex align-center">
          <div class="flex-grow-1">
            <div class="text-caption text-medium-emphasis">
              Regions Active
            </div>
            <div class="text-h5 font-weight-bold mt-1">
              {{ stats.regionsActive }}/9
            </div>
            <div class="text-caption text-info mt-1">
              {{ stats.regionsPercentage }}% coverage
            </div>
          </div>
          <v-avatar
            color="info"
            size="48"
            variant="tonal"
          >
            <v-icon>mdi-map-marker-radius</v-icon>
          </v-avatar>
        </v-card-text>
      </v-card>
    </v-col>

    <!-- Coordinators -->
    <v-col cols="12" sm="6" md="3">
      <v-card>
        <v-card-text class="d-flex align-center">
          <div class="flex-grow-1">
            <div class="text-caption text-medium-emphasis">
              Coordinators
            </div>
            <div class="text-h5 font-weight-bold mt-1">
              {{ stats.totalCoordinators }}
            </div>
            <div class="text-caption text-secondary mt-1">
              {{ stats.avgProjectsPerCoordinator }} avg projects
            </div>
          </div>
          <v-avatar
            color="secondary"
            size="48"
            variant="tonal"
          >
            <v-icon>mdi-account-group-outline</v-icon>
          </v-avatar>
        </v-card-text>
      </v-card>
    </v-col>
  </v-row>
</template>

<script setup>
import { ref } from 'vue'

// Placeholder statistics - will be replaced with real data in Phase 10
const stats = ref({
  totalProjects: 0,
  projectsThisMonth: 0,
  activeProjects: 0,
  pendingApproval: 0,
  regionsActive: 0,
  regionsPercentage: 0,
  totalCoordinators: 0,
  avgProjectsPerCoordinator: 0
})
</script>