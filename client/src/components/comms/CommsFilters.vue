<template>
  <v-card>
    <v-card-text>
      <v-row align="center">
        <!-- Search -->
        <v-col cols="12" md="4">
          <v-text-field
            v-model="localFilters.search"
            prepend-inner-icon="mdi-magnify"
            label="Search projects..."
            variant="outlined"
            density="compact"
            clearable
            hide-details
            @update:model-value="updateFilters"
          />
        </v-col>

        <!-- Region Filter -->
        <v-col cols="12" sm="6" md="2">
          <v-select
            v-model="localFilters.region"
            :items="regionOptions"
            label="Region"
            variant="outlined"
            density="compact"
            clearable
            hide-details
            @update:model-value="updateFilters"
          />
        </v-col>

        <!-- Status Filter -->
        <v-col cols="12" sm="6" md="2">
          <v-select
            v-model="localFilters.status"
            :items="statusOptions"
            label="Status"
            variant="outlined"
            density="compact"
            clearable
            hide-details
            @update:model-value="updateFilters"
          />
        </v-col>

        <!-- Priority Filter -->
        <v-col cols="12" sm="6" md="2">
          <v-select
            v-model="localFilters.priority"
            :items="priorityOptions"
            label="Priority"
            variant="outlined"
            density="compact"
            clearable
            hide-details
            @update:model-value="updateFilters"
          />
        </v-col>

        <!-- Clear Filters -->
        <v-col cols="12" sm="6" md="2">
          <v-btn
            variant="text"
            color="primary"
            @click="clearFilters"
            :disabled="!hasActiveFilters"
          >
            <v-icon start>mdi-filter-remove</v-icon>
            Clear Filters
          </v-btn>
        </v-col>
      </v-row>
    </v-card-text>
  </v-card>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import { LOUISIANA_REGIONS } from '@/config/louisiana-regions'

// Props
const props = defineProps({
  filters: {
    type: Object,
    default: () => ({
      region: null,
      status: null,
      priority: null,
      search: ''
    })
  }
})

// Emits
const emit = defineEmits(['update:filters'])

// State
const localFilters = ref({ ...props.filters })

// Filter options
const regionOptions = computed(() => {
  return Object.entries(LOUISIANA_REGIONS).map(([key, region]) => ({
    title: region.name,
    value: key
  }))
})

const statusOptions = [
  { title: 'Not Started', value: 'not_started' },
  { title: 'Planning', value: 'planning' },
  { title: 'In Progress', value: 'in_progress' },
  { title: 'Under Review', value: 'review' },
  { title: 'Pending Approval', value: 'pending_approval' },
  { title: 'Approved', value: 'approved' },
  { title: 'Completed', value: 'completed' },
  { title: 'On Hold', value: 'on_hold' },
  { title: 'Cancelled', value: 'cancelled' }
]

const priorityOptions = [
  { title: 'Low', value: 'low' },
  { title: 'Medium', value: 'medium' },
  { title: 'High', value: 'high' },
  { title: 'Urgent', value: 'urgent' }
]

// Computed
const hasActiveFilters = computed(() => {
  return !!(
    localFilters.value.region ||
    localFilters.value.status ||
    localFilters.value.priority ||
    localFilters.value.search
  )
})

// Methods
function updateFilters() {
  emit('update:filters', { ...localFilters.value })
}

function clearFilters() {
  localFilters.value = {
    region: null,
    status: null,
    priority: null,
    search: ''
  }
  updateFilters()
}

// Watch for external filter changes
watch(() => props.filters, (newFilters) => {
  localFilters.value = { ...newFilters }
}, { deep: true })
</script>