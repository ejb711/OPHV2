<!-- client/src/components/comms/coordinators/CoordinatorSelect.vue -->
<template>
  <v-select
    v-model="selectedCoordinator"
    :items="coordinatorItems"
    :label="label"
    :rules="rules"
    :loading="loading"
    :disabled="disabled || loading"
    variant="outlined"
    density="comfortable"
    item-title="displayName"
    item-value="id"
    :placeholder="placeholderText"
    clearable
    hide-details="auto"
  >
    <template v-slot:prepend-inner>
      <v-icon color="primary">mdi-account-tie</v-icon>
    </template>
    
    <template v-slot:item="{ props, item }">
      <v-list-item v-bind="props" class="coordinator-item">
        <template v-slot:prepend>
          <v-avatar size="32" color="primary" variant="tonal">
            <v-icon size="18">mdi-account</v-icon>
          </v-avatar>
        </template>
        
        <v-list-item-title class="font-weight-medium">
          {{ item.raw.displayName }}
          <v-chip
            v-if="item.raw.isPrimary"
            size="x-small"
            color="primary"
            variant="tonal"
            class="ml-2"
          >
            Primary
          </v-chip>
        </v-list-item-title>
        
        <v-list-item-subtitle class="text-body-2">
          {{ item.raw.email }}
        </v-list-item-subtitle>
        
        <!-- Show additional regions if coordinator covers multiple -->
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
  autoSelect: {
    type: Boolean,
    default: true
  }
})

// Emits
const emit = defineEmits(['update:modelValue', 'coordinator-auto-selected'])

// State
const loading = ref(false)
const coordinators = ref([])
const autoSelected = ref(false)

// Computed
const selectedCoordinator = computed({
  get: () => props.modelValue,
  set: (value) => {
    // Only clear auto-selected flag if user manually changed selection
    if (value !== props.modelValue) {
      autoSelected.value = false
    }
    emit('update:modelValue', value)
  }
})

const coordinatorItems = computed(() => {
  if (!props.region) {
    // If no region selected, show all coordinators
    return coordinators.value.map(coord => ({
      id: coord.id,
      displayName: coord.name || coord.email,
      email: coord.email,
      regions: coord.regions || [],
      isPrimary: false
    }))
  }
  
  // Filter coordinators by selected region and sort by priority
  const regionCoordinators = coordinators.value
    .filter(coord => coord.regions && coord.regions.includes(props.region))
    .sort((a, b) => {
      // Sort by: primary region first, then by name
      const aIsPrimary = a.primaryRegion === props.region
      const bIsPrimary = b.primaryRegion === props.region
      
      if (aIsPrimary && !bIsPrimary) return -1
      if (!aIsPrimary && bIsPrimary) return 1
      
      return (a.name || a.email).localeCompare(b.name || b.email)
    })
    .map(coord => {
      const otherRegions = coord.regions
        .filter(regionId => regionId !== props.region)
        .map(regionId => {
          const region = LOUISIANA_REGIONS[regionId]
          return region ? region.shortName : regionId
        })
        .join(', ')
        
      return {
        id: coord.id,
        displayName: coord.name || coord.email,
        email: coord.email,
        regions: coord.regions || [],
        isPrimary: coord.primaryRegion === props.region,
        additionalRegions: otherRegions || null
      }
    })
    
  return regionCoordinators
})

const placeholderText = computed(() => {
  if (loading.value) return 'Loading coordinators...'
  if (!props.region) return 'Select a region first'
  if (coordinatorItems.value.length === 0) return 'No coordinators available'
  return 'Select coordinator'
})

const noDataText = computed(() => {
  if (loading.value) return 'Loading coordinators...'
  if (!props.region) return 'Please select a region first to see available coordinators'
  if (coordinatorItems.value.length === 0) return 'No coordinators found for this region'
  return 'No coordinators available'
})

// Methods
async function fetchCoordinators() {
  loading.value = true
  try {
    const q = query(
      collection(db, 'comms_coordinators'),
      orderBy('name', 'asc')
    )
    const snapshot = await getDocs(q)
    
    coordinators.value = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }))
    
    console.log('Loaded coordinators:', coordinators.value.length)
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

  // Don't auto-select if user already has a valid selection for this region
  const currentSelection = coordinators.value.find(c => c.id === selectedCoordinator.value)
  if (currentSelection && currentSelection.regions.includes(props.region)) {
    console.log('Current coordinator is valid for this region, keeping selection')
    return
  }

  await nextTick() // Wait for coordinatorItems to update

  // Auto-select the first coordinator (primary region coordinators are sorted first)
  const defaultCoordinator = coordinatorItems.value[0]
  if (defaultCoordinator) {
    console.log(`Auto-selecting coordinator: ${defaultCoordinator.displayName} for region ${props.region}`)
    
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

    // Check if current coordinator is still valid for new region
    const currentCoord = coordinators.value.find(c => c.id === selectedCoordinator.value)
    if (currentCoord && currentCoord.regions.includes(newRegion)) {
      // Current coordinator is still valid, keep them
      console.log('Current coordinator is still valid for new region')
      return
    }

    // Clear invalid selection and auto-select a new coordinator for the region
    if (currentCoord && !currentCoord.regions.includes(newRegion)) {
      emit('update:modelValue', '')
    }
    
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
  
  // Auto-select coordinator if region is already set
  if (props.region) {
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

/* Improve tooltip styling */
.v-tooltip > .v-overlay__content {
  background-color: rgba(0, 0, 0, 0.9) !important;
  font-size: 0.75rem;
}
</style>