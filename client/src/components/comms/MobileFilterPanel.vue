<!-- Mobile Filter Panel for Communications Dashboard -->
<template>
  <v-navigation-drawer
    v-model="drawer"
    location="right"
    temporary
    :width="320"
    class="mobile-filter-panel"
  >
    <!-- Header -->
    <div class="filter-header pa-4 d-flex align-center justify-space-between">
      <h3 class="text-h6">Filters & Search</h3>
      <v-btn
        icon="mdi-close"
        variant="text"
        @click="drawer = false"
      />
    </div>

    <v-divider />

    <!-- Filter Content -->
    <div class="filter-content">
      <!-- Search Section -->
      <div class="filter-section">
        <h4 class="filter-section-title px-4 pt-4 pb-2 text-subtitle-2 text-medium-emphasis">
          SEARCH
        </h4>
        <div class="px-4 pb-4">
          <v-text-field
            v-model="localFilters.search"
            placeholder="Search projects..."
            prepend-inner-icon="mdi-magnify"
            variant="outlined"
            density="comfortable"
            clearable
            hide-details
            @update:model-value="debouncedUpdate"
          />
        </div>
      </div>

      <v-divider />

      <!-- Quick Filters -->
      <div class="filter-section">
        <h4 class="filter-section-title px-4 pt-4 pb-2 text-subtitle-2 text-medium-emphasis">
          QUICK FILTERS
        </h4>
        <v-list density="compact" class="pa-0">
          <v-list-item
            prepend-icon="mdi-clock-alert"
            @click="applyQuickFilter('overdue')"
          >
            <v-list-item-title>Overdue Projects</v-list-item-title>
          </v-list-item>
          <v-list-item
            prepend-icon="mdi-account-question"
            @click="applyQuickFilter('unassigned')"
          >
            <v-list-item-title>Unassigned</v-list-item-title>
          </v-list-item>
          <v-list-item
            prepend-icon="mdi-alert-circle"
            @click="applyQuickFilter('highPriority')"
          >
            <v-list-item-title>High Priority</v-list-item-title>
          </v-list-item>
        </v-list>
      </div>

      <v-divider />

      <!-- Advanced Filters -->
      <div class="filter-section">
        <h4 class="filter-section-title px-4 pt-4 pb-2 text-subtitle-2 text-medium-emphasis">
          ADVANCED FILTERS
        </h4>
        
        <!-- Region Filter -->
        <div class="px-4 pb-3">
          <v-select
            v-model="localFilters.region"
            :items="regionOptions"
            label="Region"
            variant="outlined"
            density="comfortable"
            clearable
            hide-details
          />
        </div>

        <!-- Status Filter -->
        <div class="px-4 pb-3">
          <v-select
            v-model="localFilters.status"
            :items="statusOptions"
            label="Status"
            variant="outlined"
            density="comfortable"
            clearable
            hide-details
          />
        </div>

        <!-- Priority Filter -->
        <div class="px-4 pb-3">
          <v-select
            v-model="localFilters.priority"
            :items="priorityOptions"
            label="Priority"
            variant="outlined"
            density="comfortable"
            clearable
            hide-details
          />
        </div>

        <!-- Coordinator Filter -->
        <div class="px-4 pb-4">
          <v-select
            v-model="localFilters.coordinator"
            :items="coordinatorOptions"
            label="Coordinator"
            variant="outlined"
            density="comfortable"
            clearable
            hide-details
          />
        </div>
      </div>

      <v-divider />

      <!-- Sort Options -->
      <div class="filter-section">
        <h4 class="filter-section-title px-4 pt-4 pb-2 text-subtitle-2 text-medium-emphasis">
          SORT BY
        </h4>
        <v-radio-group
          v-model="localFilters.sortBy"
          hide-details
          class="px-4"
        >
          <v-radio label="Last Updated" value="updatedAt" />
          <v-radio label="Created Date" value="createdAt" />
          <v-radio label="Deadline" value="deadline" />
          <v-radio label="Priority" value="priority" />
          <v-radio label="Title" value="title" />
        </v-radio-group>

        <div class="px-4 pb-4 pt-2">
          <v-switch
            v-model="localFilters.sortDesc"
            label="Descending order"
            density="compact"
            hide-details
          />
        </div>
      </div>

      <!-- Display Options -->
      <div class="filter-section">
        <h4 class="filter-section-title px-4 pt-4 pb-2 text-subtitle-2 text-medium-emphasis">
          DISPLAY
        </h4>
        <div class="px-4 pb-4">
          <v-btn-toggle
            v-model="viewMode"
            mandatory
            variant="outlined"
            density="comfortable"
            class="w-100"
          >
            <v-btn value="card" class="flex-grow-1">
              <v-icon start>mdi-card-text</v-icon>
              Cards
            </v-btn>
            <v-btn value="compact" class="flex-grow-1">
              <v-icon start>mdi-view-list</v-icon>
              Compact
            </v-btn>
          </v-btn-toggle>
        </div>
      </div>
    </div>

    <!-- Footer Actions -->
    <template v-slot:append>
      <div class="pa-4 d-flex ga-2">
        <v-btn
          variant="outlined"
          block
          @click="clearAll"
          :disabled="!hasActiveFilters"
        >
          Clear All
        </v-btn>
        <v-btn
          variant="flat"
          color="primary"
          block
          @click="applyFilters"
        >
          Apply Filters
        </v-btn>
      </div>
    </template>
  </v-navigation-drawer>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import { debounce } from 'lodash-es'
import { REGIONS } from '@/config/louisiana-regions'
import { useCommsCoordinators } from '@/composables/comms/useCommsCoordinators'

// Props
const props = defineProps({
  modelValue: {
    type: Boolean,
    default: false
  },
  filters: {
    type: Object,
    required: true
  },
  viewMode: {
    type: String,
    default: 'card'
  }
})

// Emits
const emit = defineEmits(['update:modelValue', 'update:filters', 'update:viewMode'])

// Local state
const drawer = computed({
  get: () => props.modelValue,
  set: (value) => emit('update:modelValue', value)
})

const localFilters = ref({ ...props.filters })
const viewMode = computed({
  get: () => props.viewMode,
  set: (value) => emit('update:viewMode', value)
})

// Composables
const { coordinators } = useCommsCoordinators()

// Filter options
const regionOptions = computed(() => 
  Object.entries(REGIONS).map(([key, region]) => ({
    title: `${key} - ${region.name}`,
    value: key
  }))
)

const statusOptions = [
  { title: 'Not Started', value: 'not_started' },
  { title: 'In Progress', value: 'in_progress' },
  { title: 'Review', value: 'review' },
  { title: 'Completed', value: 'completed' },
  { title: 'On Hold', value: 'on_hold' },
  { title: 'Cancelled', value: 'cancelled' },
  { title: 'Pending Approval', value: 'pending_approval' }
]

const priorityOptions = [
  { title: 'Urgent', value: 'urgent' },
  { title: 'High', value: 'high' },
  { title: 'Medium', value: 'medium' },
  { title: 'Low', value: 'low' }
]

const coordinatorOptions = computed(() =>
  coordinators.value.map(coord => ({
    title: coord.displayName || coord.email,
    value: coord.uid
  }))
)

// Computed
const hasActiveFilters = computed(() => {
  return !!(
    localFilters.value.search ||
    localFilters.value.region ||
    localFilters.value.status ||
    localFilters.value.priority ||
    localFilters.value.coordinator
  )
})

// Methods
const debouncedUpdate = debounce(() => {
  applyFilters()
}, 300)

function applyFilters() {
  emit('update:filters', { ...localFilters.value })
}

function clearAll() {
  localFilters.value = {
    search: '',
    region: null,
    status: null,
    priority: null,
    coordinator: null,
    sortBy: 'updatedAt',
    sortDesc: true
  }
  applyFilters()
}

function applyQuickFilter(type) {
  switch(type) {
    case 'overdue':
      // This will be handled by the parent component
      emit('update:filters', { 
        ...localFilters.value, 
        quickFilter: 'overdue' 
      })
      break
    case 'unassigned':
      localFilters.value.coordinator = 'unassigned'
      break
    case 'highPriority':
      localFilters.value.priority = 'high'
      break
  }
  applyFilters()
  drawer.value = false
}

// Watch for external filter changes
watch(() => props.filters, (newFilters) => {
  localFilters.value = { ...newFilters }
}, { deep: true })
</script>

<style scoped>
.mobile-filter-panel {
  z-index: 2000;
}

.filter-header {
  background-color: #f5f5f5;
  border-bottom: 1px solid rgba(0, 0, 0, 0.12);
}

.filter-content {
  flex: 1;
  overflow-y: auto;
}

.filter-section-title {
  font-weight: 600;
  letter-spacing: 0.05em;
}

.filter-section:last-child {
  padding-bottom: 80px; /* Space for footer */
}

/* Touch-friendly sizing */
.v-list-item {
  min-height: 48px;
}

.v-field {
  min-height: 48px;
}

/* Scrollbar styling */
.filter-content::-webkit-scrollbar {
  width: 6px;
}

.filter-content::-webkit-scrollbar-track {
  background: #f5f5f5;
}

.filter-content::-webkit-scrollbar-thumb {
  background: #c0c0c0;
  border-radius: 3px;
}

.filter-content::-webkit-scrollbar-thumb:hover {
  background: #a0a0a0;
}
</style>