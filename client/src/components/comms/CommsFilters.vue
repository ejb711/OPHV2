<!-- client/src/components/comms/CommsFilters.vue -->
<template>
  <v-card elevation="0" class="rounded-lg">
    <v-card-text class="pa-4">
      <v-row align="center">
        <!-- Search -->
        <v-col cols="12" md="4">
          <v-text-field
            v-model="localSearch"
            label="Search projects"
            prepend-inner-icon="mdi-magnify"
            density="comfortable"
            hide-details
            clearable
            variant="outlined"
            @update:model-value="debouncedUpdate"
          />
        </v-col>

        <!-- Region Filter -->
        <v-col cols="12" sm="6" md="2">
          <v-select
            v-model="localRegion"
            :items="regionOptions"
            label="Region"
            density="comfortable"
            hide-details
            clearable
            variant="outlined"
            @update:model-value="updateFilters"
          />
        </v-col>

        <!-- Status Filter -->
        <v-col cols="12" sm="6" md="2">
          <v-select
            v-model="localStatus"
            :items="statusOptions"
            label="Status"
            density="comfortable"
            hide-details
            clearable
            variant="outlined"
            @update:model-value="updateFilters"
          />
        </v-col>

        <!-- Priority Filter -->
        <v-col cols="12" sm="6" md="2">
          <v-select
            v-model="localPriority"
            :items="priorityOptions"
            label="Priority"
            density="comfortable"
            hide-details
            clearable
            variant="outlined"
            @update:model-value="updateFilters"
          />
        </v-col>

        <!-- Clear Filters -->
        <v-col cols="12" sm="6" md="2" class="text-right">
          <v-btn
            v-if="hasActiveFilters"
            variant="text"
            color="primary"
            @click="clearFilters"
          >
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

// Local state - Initialize from props
const localRegion = ref(props.filters.region)
const localStatus = ref(props.filters.status)
const localPriority = ref(props.filters.priority)
const localSearch = ref(props.filters.search)

// Debounce timer
let debounceTimer = null

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
    localRegion.value ||
    localStatus.value ||
    localPriority.value ||
    localSearch.value
  )
})

// Methods
function updateFilters() {
  emit('update:filters', {
    region: localRegion.value,
    status: localStatus.value,
    priority: localPriority.value,
    search: localSearch.value
  })
}

function debouncedUpdate() {
  clearTimeout(debounceTimer)
  debounceTimer = setTimeout(() => {
    updateFilters()
  }, 300)
}

function clearFilters() {
  localRegion.value = null
  localStatus.value = null
  localPriority.value = null
  localSearch.value = ''
  updateFilters()
}

// Watch for external changes to filters (but only update if actually different)
watch(() => props.filters.region, (newVal) => {
  if (newVal !== localRegion.value) {
    localRegion.value = newVal
  }
})

watch(() => props.filters.status, (newVal) => {
  if (newVal !== localStatus.value) {
    localStatus.value = newVal
  }
})

watch(() => props.filters.priority, (newVal) => {
  if (newVal !== localPriority.value) {
    localPriority.value = newVal
  }
})

watch(() => props.filters.search, (newVal) => {
  if (newVal !== localSearch.value) {
    localSearch.value = newVal
  }
})
</script>