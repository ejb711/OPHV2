<template>
  <v-card>
    <v-card-text>
      <v-row align="center">
        <!-- Search -->
        <v-col cols="12" md="4">
          <v-text-field
            v-model="searchQuery"
            placeholder="Search projects..."
            prepend-inner-icon="mdi-magnify"
            variant="outlined"
            density="compact"
            clearable
            hide-details
            disabled
          />
        </v-col>

        <!-- Region Filter -->
        <v-col cols="12" sm="6" md="2">
          <v-select
            v-model="selectedRegion"
            :items="regionOptions"
            label="Region"
            variant="outlined"
            density="compact"
            hide-details
            clearable
            disabled
          />
        </v-col>

        <!-- Status Filter -->
        <v-col cols="12" sm="6" md="2">
          <v-select
            v-model="selectedStatus"
            :items="statusOptions"
            label="Status"
            variant="outlined"
            density="compact"
            hide-details
            clearable
            disabled
          />
        </v-col>

        <!-- Stage Filter -->
        <v-col cols="12" sm="6" md="2">
          <v-select
            v-model="selectedStage"
            :items="stageOptions"
            label="Stage"
            variant="outlined"
            density="compact"
            hide-details
            clearable
            disabled
          />
        </v-col>

        <!-- View Toggle -->
        <v-col cols="12" sm="6" md="2">
          <v-btn-toggle
            v-model="viewMode"
            mandatory
            density="compact"
            variant="outlined"
            divided
            disabled
          >
            <v-btn value="grid" icon="mdi-view-grid" />
            <v-btn value="list" icon="mdi-view-list" />
          </v-btn-toggle>
        </v-col>
      </v-row>

      <!-- Active Filters Display -->
      <v-row v-if="hasActiveFilters" class="mt-3">
        <v-col cols="12">
          <div class="d-flex align-center gap-2">
            <span class="text-caption text-medium-emphasis">Active filters:</span>
            <v-chip
              size="small"
              closable
              disabled
            >
              Placeholder
            </v-chip>
            <v-btn
              variant="text"
              size="small"
              color="primary"
              disabled
            >
              Clear all
            </v-btn>
          </div>
        </v-col>
      </v-row>
    </v-card-text>
  </v-card>
</template>

<script setup>
import { ref, computed } from 'vue'
import { LOUISIANA_REGIONS } from '@/config/louisiana-regions'

// Filter states
const searchQuery = ref('')
const selectedRegion = ref(null)
const selectedStatus = ref(null)
const selectedStage = ref(null)
const viewMode = ref('grid')

// Filter options
const regionOptions = computed(() => 
  Object.values(LOUISIANA_REGIONS).map(region => ({
    title: region.shortName,
    value: region.id
  }))
)

const statusOptions = [
  { title: 'Active', value: 'active' },
  { title: 'Archived', value: 'archived' },
  { title: 'On Hold', value: 'on_hold' }
]

const stageOptions = [
  { title: 'Not Started', value: 'not_started' },
  { title: 'In Progress', value: 'in_progress' },
  { title: 'Final Draft', value: 'final_draft' },
  { title: 'Pending Approval', value: 'pending_approval' },
  { title: 'Approved', value: 'approved' }
]

// Check if any filters are active
const hasActiveFilters = computed(() => 
  searchQuery.value || selectedRegion.value || selectedStatus.value || selectedStage.value
)
</script>

<style scoped>
.gap-2 > * + * {
  margin-left: 8px;
}
</style>