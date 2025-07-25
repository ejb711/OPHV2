<!-- client/src/components/comms/dashboard/CommsRegionalDistribution.vue -->
<!-- Regional distribution display component (~80 lines) -->
<!-- Props: regional-distribution -->
<!-- Purpose: Display project counts by region -->
<template>
  <v-card>
    <v-card-title>
      <v-icon class="mr-2">mdi-map-marker-multiple</v-icon>
      Regional Distribution
    </v-card-title>
    <v-card-text>
      <v-list>
        <v-list-item
          v-for="region in regionalDistribution"
          :key="region.regionId"
          :title="region.regionName"
          :subtitle="`${region.count || 0} projects (${regionPercentage(region)}%)`"
        >
          <template v-slot:prepend>
            <v-avatar 
              :color="getRegionColor(region.regionId)" 
              size="32"
            >
              <span class="text-caption font-weight-bold">
                {{ region.regionId }}
              </span>
            </v-avatar>
          </template>
          <template v-slot:append>
            <v-progress-linear
              :model-value="regionPercentage(region)"
              :color="getRegionColor(region.regionId)"
              height="6"
              class="ml-4"
              style="min-width: 100px"
            />
          </template>
        </v-list-item>
      </v-list>
    </v-card-text>
  </v-card>
</template>

<script setup>
import { computed } from 'vue'
import { REGION_COLORS } from '@/config/louisiana-regions'

// Props
const props = defineProps({
  regionalDistribution: {
    type: Array,
    default: () => []
  }
})

// Computed
const totalProjects = computed(() => 
  props.regionalDistribution.reduce((sum, r) => sum + (r.count || 0), 0)
)

// Methods
function regionPercentage(region) {
  if (!totalProjects.value) return 0
  return Math.round(((region.count || 0) / totalProjects.value) * 100)
}

function getRegionColor(regionId) {
  return REGION_COLORS[regionId] || 'grey'
}
</script>