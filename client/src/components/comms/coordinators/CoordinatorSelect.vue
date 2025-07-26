<template>
  <v-select
    v-model="selectedCoordinator"
    :items="coordinatorItems"
    :label="label"
    :rules="rules"
    :disabled="disabled"
    :loading="loading"
    :clearable="clearable"
    :required="required"
    density="default"
    variant="outlined"
    item-value="id"
    item-title="displayName"
    no-data-text="No coordinators available"
    hide-details="auto"
    :persistent-placeholder="false"
  >
    <!-- Custom selection template -->
    <template v-slot:selection="{ item }">
      <span v-if="loading">Loading...</span>
      <span v-else>{{ getSelectionDisplay(item) }}</span>
    </template>

    <template v-slot:item="{ item, props: itemProps }">
      <v-list-item
        v-bind="itemProps"
        class="coordinator-item"
      >
        <template v-slot:prepend>
          <v-avatar size="32" color="primary">
            <span class="text-subtitle-2">
              {{ (item.raw.displayName || item.raw.email || '?').charAt(0).toUpperCase() }}
            </span>
          </v-avatar>
        </template>

        <template v-slot:subtitle>
          <div class="d-flex align-center gap-2 mt-1">
            <span class="text-body-2">{{ item.raw.email }}</span>

            <!-- Default coordinator indicator -->
            <v-chip
              v-if="item.raw.isPrimary"
              size="x-small"
              color="primary"
              variant="tonal"
            >
              Default
            </v-chip>

            <!-- Warning for non-region coordinators -->
            <v-tooltip
              v-if="!item.raw.isForCurrentRegion && props.region"
              location="top"
            >
              <template v-slot:activator="{ props: tooltipProps }">
                <v-icon
                  v-bind="tooltipProps"
                  size="small"
                  color="warning"
                >
                  mdi-alert-circle-outline
                </v-icon>
              </template>
              <span>Not assigned to selected region</span>
            </v-tooltip>
          </div>

          <!-- Region coverage -->
          <div v-if="item.raw.regions.length > 0" class="text-caption mt-1">
            <span class="text-grey-darken-1">Regions: </span>
            <span class="text-grey-darken-2">{{ item.raw.regionNames }}</span>
          </div>
        </template>

        <!-- Additional regions indicator -->
        <template v-slot:append v-if="item.raw.additionalRegions">
          <v-tooltip location="top">
            <template v-slot:activator="{ props: tooltipProps }">
              <v-chip
                v-bind="tooltipProps"
                size="x-small"
                variant="outlined"
                color="info"
              >
                +{{ item.raw.additionalRegions.split(', ').length }}
              </v-chip>
            </template>
            <span>Also covers: {{ item.raw.additionalRegions }}</span>
          </v-tooltip>
        </template>
      </v-list-item>
    </template>

    <template v-slot:no-data>
      <v-list-item>
        <v-list-item-title class="text-center text-body-2 text-grey-darken-1">
          {{ noDataText }}
        </v-list-item-title>
      </v-list-item>
    </template>

    <!-- Auto-selection indicator at bottom of dropdown -->
    <template v-slot:append-item v-if="coordinatorItems.length > 0 && autoSelected && selectedCoordinator">
      <v-divider class="mt-2"></v-divider>
      <v-list-item class="text-caption text-center py-2" style="min-height: 36px;">
        <v-list-item-title class="text-primary text-body-2">
          <v-icon size="14" class="mr-1">mdi-auto-fix</v-icon>
          Auto-selected default coordinator for this region
        </v-list-item-title>
      </v-list-item>
    </template>

    <!-- Non-default selection warning -->
    <template v-slot:append-item v-if="showNonDefaultWarning">
      <v-divider v-if="!autoSelected" class="mt-2"></v-divider>
      <v-list-item class="text-caption text-center py-2" style="min-height: 36px;">
        <v-list-item-title class="text-warning text-body-2">
          <v-icon size="14" class="mr-1" color="warning">mdi-alert</v-icon>
          Non-default coordinator selected for this region
        </v-list-item-title>
      </v-list-item>
    </template>
  </v-select>
</template>

<script setup>
import { ref, computed, watch, onMounted, nextTick } from 'vue'
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
  label: {
    type: String,
    default: undefined
  },
  rules: {
    type: Array,
    default: () => []
  },
  disabled: {
    type: Boolean,
    default: false
  },
  clearable: {
    type: Boolean,
    default: false
  },
  autoSelect: {
    type: Boolean,
    default: true
  },
  required: {
    type: Boolean,
    default: false
  }
})

// Emits
const emit = defineEmits(['update:modelValue', 'coordinator-auto-selected', 'non-default-selected', 'default-selected'])

// State
const loading = ref(false)
const coordinators = ref([])
const autoSelected = ref(false)

// Computed
const selectedCoordinator = computed({
  get: () => props.modelValue,
  set: (value) => {
    const previousValue = props.modelValue

    // Check if user is selecting a coordinator
    if (value && props.region) {
      const selectedCoord = coordinators.value.find(c => c.id === value)
      const defaultCoord = getDefaultCoordinatorForRegion(props.region)

      if (selectedCoord && defaultCoord) {
        if (selectedCoord.id !== defaultCoord.id) {
          // User selected a non-default coordinator
          autoSelected.value = false
          emit('non-default-selected', selectedCoord.displayName || selectedCoord.name || selectedCoord.email)
        } else if (previousValue !== value) {
          // User selected the default coordinator
          autoSelected.value = false
          emit('default-selected', {
            coordinatorId: value,
            coordinator: selectedCoord,
            region: props.region,
            isDefault: true
          })
        }
      }
    }

    emit('update:modelValue', value)
  }
})

const coordinatorItems = computed(() => {
  const items = coordinators.value.map(coord => {
    const isForCurrentRegion = props.region && coord.regions && coord.regions.includes(props.region)
    const isPrimary = props.region && coord.primaryRegion === props.region

    // Get region names
    const regionNames = (coord.regions || [])
      .map(regionId => {
        const region = LOUISIANA_REGIONS[regionId]
        return region ? region.name : regionId
      })
      .join(', ')

    // Get additional regions (regions other than the selected one)
    const otherRegions = props.region
      ? coord.regions
          .filter(regionId => regionId !== props.region)
          .map(regionId => {
            const region = LOUISIANA_REGIONS[regionId]
            return region ? region.name : regionId
          })
          .join(', ')
      : ''

    // Ensure we use displayName as the primary display field
    const displayName = coord.displayName || coord.name || coord.userName || coord.email

    const item = {
      id: coord.id,
      displayName: displayName,
      email: coord.email || coord.userEmail,
      regions: coord.regions || [],
      primaryRegion: coord.primaryRegion,
      regionNames,
      additionalRegions: otherRegions,
      isForCurrentRegion,
      isPrimary,
      raw: {
        ...coord,
        displayName: displayName // Ensure raw always has displayName
      }
    }

    return item
  })

  // Sort: primary first, then by region assignment, then alphabetically
  const sorted = items.sort((a, b) => {
    if (a.isPrimary && !b.isPrimary) return -1
    if (!a.isPrimary && b.isPrimary) return 1
    if (a.isForCurrentRegion && !b.isForCurrentRegion) return -1
    if (!a.isForCurrentRegion && b.isForCurrentRegion) return 1
    return a.displayName.localeCompare(b.displayName)
  })

  return sorted
})

const noDataText = computed(() => {
  if (loading.value) return 'Loading coordinators...'
  if (!props.region) return 'Please select a region first'
  return 'No coordinators available'
})

const showNonDefaultWarning = computed(() => {
  if (!selectedCoordinator.value || !props.region || autoSelected.value) return false

  const selected = coordinators.value.find(c => c.id === selectedCoordinator.value)
  const defaultCoord = getDefaultCoordinatorForRegion(props.region)

  return selected && defaultCoord && selected.id !== defaultCoord.id
})

// Methods
function getSelectionDisplay(item) {
  // If we have a proper item object from v-select
  if (item && item.raw && item.raw.displayName) {
    return item.raw.displayName
  }

  // If we have an item with title
  if (item && item.title) {
    return item.title
  }

  // If no item but we have a selected value, look it up
  if (selectedCoordinator.value && coordinators.value.length > 0) {
    const found = coordinators.value.find(c => c.id === selectedCoordinator.value)
    if (found) {
      return found.name || found.displayName || found.email
    }
  }

  // Final fallback - return the ID if we have one
  return selectedCoordinator.value || ''
}

function getCoordinatorDisplayName(coordinatorId) {
  if (!coordinatorId) return ''
  const coordinator = coordinators.value.find(c => c.id === coordinatorId)
  if (!coordinator) {
    return coordinatorId
  }
  const displayName = coordinator.displayName || coordinator.name || coordinator.userName || coordinator.email || coordinatorId
  return displayName
}

function getDefaultCoordinatorForRegion(regionId) {
  if (!regionId) return null

  // Find primary coordinator for the region
  const primaryCoord = coordinators.value.find(c => c.primaryRegion === regionId)
  if (primaryCoord) return primaryCoord

  // If no primary, find first coordinator assigned to the region
  return coordinators.value.find(c => c.regions && c.regions.includes(regionId))
}

async function fetchCoordinators() {
  loading.value = true
  try {
    const coordinatorsQuery = query(
      collection(db, 'comms_coordinators'),
      orderBy('displayName')
    )

    const snapshot = await getDocs(coordinatorsQuery)
    coordinators.value = snapshot.docs.map(doc => {
      const data = doc.data()
      // Ensure we have a displayName field
      const displayName = data.displayName || data.name || data.userName || data.email || doc.id

      return {
        id: doc.id,
        ...data,
        displayName: displayName, // Always ensure displayName exists
        name: data.name || displayName,
        email: data.email || data.userEmail
      }
    })
  } catch (error) {
    // Try without orderBy if index doesn't exist
    try {
      const snapshot = await getDocs(collection(db, 'comms_coordinators'))
      `)

      coordinators.value = snapshot.docs
        .map(doc => {
          const data = doc.data()
          const displayName = data.displayName || data.name || data.userName || data.email || doc.id

          return {
            id: doc.id,
            ...data,
            displayName: displayName,
            name: data.name || displayName,
            email: data.email || data.userEmail
          }
        })
        .sort((a, b) => a.displayName.localeCompare(b.displayName))
    } catch (fallbackError) {
      coordinators.value = []
    }
  } finally {
    loading.value = false
  }
}

async function autoSelectCoordinator() {
  if (!props.autoSelect || !props.region || coordinatorItems.value.length === 0) {
    return
  }

  await nextTick() // Wait for coordinatorItems to update

  // Auto-select the default coordinator for the region
  const defaultCoordinator = getDefaultCoordinatorForRegion(props.region)
  if (defaultCoordinator && selectedCoordinator.value !== defaultCoordinator.id) {
    emit('update:modelValue', defaultCoordinator.id)
    autoSelected.value = true

    // Emit event to notify parent component
    emit('coordinator-auto-selected', {
      coordinatorId: defaultCoordinator.id,
      coordinator: defaultCoordinator,
      region: props.region
    })
  }
}

// Watch for region changes
watch(() => props.region, async (newRegion, oldRegion) => {
  if (newRegion !== oldRegion) {
    if (!newRegion) {
      // Region cleared - clear coordinator selection
      emit('update:modelValue', '')
      autoSelected.value = false
      return
    }

    // Region changed - clear current selection and auto-select new default
    emit('update:modelValue', '')
    autoSelected.value = false

    // Wait for the clear to process, then auto-select
    await nextTick()
    await autoSelectCoordinator()
  }
}, { immediate: false })

// Watch for coordinators data changes (initial load)
watch(coordinators, () => {
  if (props.region && !selectedCoordinator.value) {
    autoSelectCoordinator()
  }
}, { immediate: false })

// Force refresh coordinators
async function refreshCoordinators() {
  coordinators.value = []
  await fetchCoordinators()
}

// Lifecycle
onMounted(async () => {
  await fetchCoordinators()

  // Wait for coordinators to be processed
  await nextTick()

  // Auto-select coordinator if region is already set and no coordinator selected
  if (props.region && !selectedCoordinator.value) {
    await autoSelectCoordinator()
  }
})

// Re-fetch coordinators when component becomes visible (in case they were updated)
watch(() => props.modelValue, async (newValue) => {
  if (newValue !== undefined) {
    await refreshCoordinators()
  }
}, { immediate: false })
</script>

<style scoped>
.coordinator-item {
  min-height: 64px !important;
  padding: 8px 16px !important;
}

/* Ensure proper spacing for the select field */
:deep(.v-field__details) {
  padding-top: 4px !important;
  min-height: auto !important;
}

/* Fix text overlap in selection */
:deep(.v-field__input) {
  min-height: 56px;
  display: flex;
  align-items: center;
}

:deep(.v-select__selection) {
  margin: 0 !important;
}

/* Ensure consistent spacing */
.v-list-item-subtitle {
  margin-top: 4px !important;
  opacity: 0.7;
  font-size: 0.875rem;
}

/* Primary coordinator badge */
.v-chip.v-chip--size-x-small {
  height: 20px;
  font-size: 0.75rem;
}

/* Style the auto-selected indicator */
.v-list-item .text-primary {
  font-size: 0.8rem;
  opacity: 0.8;
}

/* Style the warning indicator */
.v-list-item .text-warning {
  font-size: 0.8rem;
  opacity: 0.9;
}

/* Improve tooltip styling */
.v-tooltip > .v-overlay__content {
  background-color: rgba(0, 0, 0, 0.9) !important;
  font-size: 0.75rem;
}
</style>