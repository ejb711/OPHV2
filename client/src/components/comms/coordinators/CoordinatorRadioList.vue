<!-- client/src/components/comms/coordinators/CoordinatorRadioList.vue -->
<template>
  <div>
    <!-- Loading State -->
    <div v-if="loading" class="text-center py-4">
      <v-progress-circular indeterminate color="primary" size="24" />
      <p class="text-body-2 mt-2">Loading coordinators...</p>
    </div>

    <!-- Coordinator List -->
    <v-radio-group
      v-else
      v-model="selectedCoordinator"
      :rules="rules"
      :disabled="disabled"
    >
      <template v-slot:label>
        <span class="text-subtitle-2 font-weight-medium">
          Select Coordinator <span v-if="required" class="text-error">*</span>
        </span>
      </template>

      <!-- No coordinators message -->
      <div v-if="coordinators.length === 0" class="text-center py-4 text-grey">
        No coordinators available
      </div>

      <!-- Coordinator Radio Items -->
      <v-radio
        v-for="coordinator in sortedCoordinators"
        :key="coordinator.id"
        :value="coordinator.id"
        class="coordinator-radio mb-3"
      >
        <template v-slot:label>
          <div class="d-flex align-center flex-grow-1">
            <!-- Avatar -->
            <v-avatar size="36" color="primary" class="mr-3">
              <span class="text-subtitle-2">
                {{ getInitials(coordinator) }}
              </span>
            </v-avatar>

            <!-- Coordinator Info -->
            <div class="flex-grow-1">
              <div class="d-flex align-center">
                <span class="font-weight-medium">
                  {{ coordinator.displayName || coordinator.name || coordinator.email }}
                </span>

                <!-- Default badge -->
                <v-chip
                  v-if="isDefaultForRegion(coordinator)"
                  size="x-small"
                  color="primary"
                  variant="tonal"
                  class="ml-2"
                >
                  Default for this region
                </v-chip>

                <!-- Not in region warning -->
                <v-tooltip
                  v-if="region && !isInRegion(coordinator)"
                  location="top"
                >
                  <template v-slot:activator="{ props }">
                    <v-icon
                      v-bind="props"
                      size="small"
                      color="warning"
                      class="ml-2"
                    >
                      mdi-alert-circle-outline
                    </v-icon>
                  </template>
                  <span>Not assigned to selected region</span>
                </v-tooltip>
              </div>

              <!-- Email and regions -->
              <div class="text-caption text-grey-darken-1">
                {{ coordinator.email }}
                <span v-if="coordinator.regions && coordinator.regions.length > 0">
                  • Regions: {{ getRegionNames(coordinator.regions) }}
                </span>
              </div>
            </div>
          </div>
        </template>
      </v-radio>
    </v-radio-group>

    <!-- Helper text -->
    <p v-if="!loading && region" class="text-caption text-grey mt-2">
      <v-icon size="small">mdi-information</v-icon>
      The default coordinator for the selected region is pre-selected
    </p>
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted } from 'vue'
import { collection, query, getDocs, orderBy } from 'firebase/firestore'
import { db } from '@/firebase'
import { LOUISIANA_REGIONS } from '@/config/louisiana-regions'

// Props
const props = defineProps({
  modelValue: {
    type: String,
    default: ''
  },
  region: {
    type: String,
    default: ''
  },
  rules: {
    type: Array,
    default: () => []
  },
  disabled: {
    type: Boolean,
    default: false
  },
  required: {
    type: Boolean,
    default: false
  }
})

// Emits
const emit = defineEmits(['update:modelValue', 'coordinator-selected'])

// State
const loading = ref(false)
const coordinators = ref([])

// Computed
const selectedCoordinator = computed({
  get: () => props.modelValue,
  set: (value) => {
    emit('update:modelValue', value)
    const coordinator = coordinators.value.find(c => c.id === value)
    if (coordinator) {
      emit('coordinator-selected', coordinator)
    }
  }
})

// Sort coordinators: default for region first, then by region assignment, then alphabetically
const sortedCoordinators = computed(() => {
  if (!coordinators.value.length) return []

  return [...coordinators.value].sort((a, b) => {
    // Default for current region comes first
    if (props.region) {
      const aIsDefault = a.primaryRegion === props.region
      const bIsDefault = b.primaryRegion === props.region
      if (aIsDefault && !bIsDefault) return -1
      if (!aIsDefault && bIsDefault) return 1

      // Then those assigned to current region
      const aInRegion = a.regions?.includes(props.region)
      const bInRegion = b.regions?.includes(props.region)
      if (aInRegion && !bInRegion) return -1
      if (!aInRegion && bInRegion) return 1
    }

    // Finally alphabetically by name
    const aName = (a.displayName || a.name || a.email || '').toLowerCase()
    const bName = (b.displayName || b.name || b.email || '').toLowerCase()
    return aName.localeCompare(bName)
  })
})

// Methods
function getInitials(coordinator) {
  const name = coordinator.displayName || coordinator.name || coordinator.email || '?'
  return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
}

function isDefaultForRegion(coordinator) {
  return props.region && coordinator.primaryRegion === props.region
}

function isInRegion(coordinator) {
  return !props.region || (coordinator.regions && coordinator.regions.includes(props.region))
}

function getRegionNames(regionIds) {
  return regionIds
    .map(id => LOUISIANA_REGIONS[id]?.name || id)
    .join(', ')
}

async function fetchCoordinators() {
  loading.value = true
  try {
    const snapshot = await getDocs(collection(db, 'comms_coordinators'))
    coordinators.value = snapshot.docs.map(doc => {
      const data = doc.data()
      const displayName = data.displayName || data.name || data.userName || data.email

      return {
        id: doc.id,
        ...data,
        displayName: displayName
      }
    })

    // Auto-select default coordinator for region if none selected
    if (props.region && !props.modelValue) {
      const defaultCoord = coordinators.value.find(c => c.primaryRegion === props.region)
      if (defaultCoord) {
        selectedCoordinator.value = defaultCoord.id
      }
    }
  } catch (error) {
    coordinators.value = []
  } finally {
    loading.value = false
  }
}

// Watch for region changes
watch(() => props.region, async (newRegion, oldRegion) => {
  if (newRegion !== oldRegion && newRegion) {
    // Find and auto-select default coordinator for new region
    const defaultCoord = coordinators.value.find(c => c.primaryRegion === newRegion)
    if (defaultCoord) {
      selectedCoordinator.value = defaultCoord.id
    }
  }
})

// Lifecycle
onMounted(() => {
  fetchCoordinators()
})
</script>

<style scoped>
.coordinator-radio {
  border: 1px solid rgba(0, 0, 0, 0.12);
  border-radius: 8px;
  padding: 12px;
  transition: all 0.2s;
}

.coordinator-radio:hover {
  background-color: rgba(0, 0, 0, 0.02);
  border-color: rgba(0, 0, 0, 0.2);
}

.coordinator-radio :deep(.v-selection-control__input) {
  margin-right: 12px;
}

/* Highlight selected radio */
.coordinator-radio:has(.v-radio--active) {
  background-color: rgba(25, 118, 210, 0.04);
  border-color: rgb(25, 118, 210);
}

/* Fix radio button alignment */
:deep(.v-radio .v-selection-control__wrapper) {
  margin-top: 4px;
}

:deep(.v-radio .v-label) {
  width: 100%;
  opacity: 1 !important;
}
</style>