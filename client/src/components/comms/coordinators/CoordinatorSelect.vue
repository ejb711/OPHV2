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
  >
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
    default: 'Coordinator'
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
          emit('non-default-selected', {
            coordinatorId: value,
            coordinator: selectedCoord,
            defaultCoordinator: defaultCoord,
            region: props.region
          })
        } else if (previousValue !== value) {
          // User selected the default coordinator (clear any non-default notification)
          autoSelected.value = false
          emit('default-selected', {
            coordinatorId: value,
            coordinator: selectedCoord,
            region: props.region
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
    
    return {
      id: coord.id,
      displayName: coord.name || coord.email,
      email: coord.email,
      regions: coord.regions || [],
      regionNames: regionNames,
      isPrimary: isPrimary,
      isForCurrentRegion: isForCurrentRegion,
      additionalRegions: otherRegions,
      sortOrder: getSortOrder(coord, props.region)
    }
  })
  
  // Sort coordinators
  return items.sort((a, b) => {
    // First sort by sort order (primary for region, then assigned to region, then others)
    if (a.sortOrder !== b.sortOrder) {
      return a.sortOrder - b.sortOrder
    }
    // Then sort by name
    return (a.displayName || a.email).localeCompare(b.displayName || b.email)
  })
})

const noDataText = computed(() => {
  if (loading.value) return 'Loading coordinators...'
  if (!props.region) return 'Please select a region first'
  return 'No coordinators available'
})

const showNonDefaultWarning = computed(() => {
  if (!props.region || !selectedCoordinator.value) return false
  
  const selectedCoord = coordinators.value.find(c => c.id === selectedCoordinator.value)
  const defaultCoord = getDefaultCoordinatorForRegion(props.region)
  
  return selectedCoord && defaultCoord && selectedCoord.id !== defaultCoord.id && !autoSelected.value
})

// Methods
function getSortOrder(coordinator, selectedRegion) {
  if (!selectedRegion) return 3
  
  // Primary coordinator for selected region
  if (coordinator.primaryRegion === selectedRegion) return 1
  
  // Assigned to selected region (but not primary)
  if (coordinator.regions && coordinator.regions.includes(selectedRegion)) return 2
  
  // Not assigned to selected region
  return 3
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
      orderBy('name')
    )
    
    const snapshot = await getDocs(coordinatorsQuery)
    coordinators.value = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }))
  } catch (error) {
    console.error('Error fetching coordinators:', error)
    coordinators.value = []
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
    console.log(`Auto-selecting coordinator: ${defaultCoordinator.name || defaultCoordinator.email} for region ${props.region}`)
    
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
</script>

<style scoped>
.coordinator-item {
  min-height: 64px !important;
  padding: 8px 16px !important;
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