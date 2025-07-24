<template>
  <v-row>
    <v-col cols="12" sm="6">
      <div class="field-group">
        <label>Region <span v-if="editing" class="text-error">*</span></label>
        <!-- Show chip in view mode -->
        <v-chip
          v-if="!editing"
          :color="getRegionColor(region)"
          variant="tonal"
          size="small"
        >
          {{ displayedRegion }}
        </v-chip>
        <!-- Show select in edit mode - ALWAYS ENABLED -->
        <v-select
          v-else
          :model-value="region"
          :items="regionOptions"
          item-title="name"
          item-value="id"
          variant="outlined"
          density="comfortable"
          :rules="rules.region || [v => !!v || 'Region is required']"
          clearable
          :disabled="false"
          :hint="localCoordinatorId ? 'Changing the region will automatically assign the default coordinator for the new region' : 'Select a region to auto-assign a coordinator'"
          persistent-hint
          @update:model-value="handleRegionChange"
        />
      </div>
    </v-col>
    
    <v-col cols="12" sm="6">
      <div class="field-group">
        <label>Coordinator 
          <span v-if="editing && autoSelected" class="text-caption text-grey">(Auto-assigned)</span>
        </label>
        <!-- Show text in view mode -->
        <v-text-field
          v-if="!editing"
          :model-value="displayedCoordinator"
          readonly
          variant="plain"
          density="comfortable"
        />
        <!-- Use modular coordinator select in edit mode -->
        <CoordinatorSelectField
          v-else
          v-model="localCoordinatorId"
          :items="coordinatorOptions"
          :loading="loadingCoordinators"
          :region="region"
          :auto-selected="autoSelected"
          :default-coordinator-id="defaultCoordinatorId"
          @non-default-selected="handleNonDefaultSelected"
          :hint="editing && !region ? 'Please select a region first' : ''"
          :disabled="!region"
        />
      </div>
    </v-col>
  </v-row>
  
  <!-- Non-default coordinator alert -->
  <v-alert
    v-if="editing && showNonDefaultAlert"
    type="info"
    variant="tonal"
    density="compact"
    class="mt-3"
    closable
    @click:close="showNonDefaultAlert = false"
  >
    <template v-slot:title>
      Non-default coordinator selected
    </template>
    <template v-slot:text>
      You've selected {{ nonDefaultCoordinatorName }} instead of the default coordinator for this region. 
      This is allowed but may require additional coordination.
    </template>
  </v-alert>
</template>

<script setup>
import { ref, computed, watch, onMounted, nextTick } from 'vue'
import { LOUISIANA_REGIONS } from '@/config/louisiana-regions'
import { useCoordinatorSelection } from '@/composables/comms/useCoordinatorSelection.js'
import CoordinatorSelectField from '@/components/comms/coordinators/CoordinatorSelectField.vue'
import { getRegionColor, formatRegionOptions } from '@/utils/regionUtils.js'

// Props
const props = defineProps({
  region: {
    type: String,
    default: ''
  },
  coordinatorId: {
    type: String,
    default: ''
  },
  editing: {
    type: Boolean,
    default: false
  },
  rules: {
    type: Object,
    required: true,
    default: () => ({
      region: [v => !!v || 'Region is required']
    })
  }
})

// Emits
const emit = defineEmits(['update:region', 'update:coordinator'])

// Composables
const {
  allCoordinators,
  loadingCoordinators,
  loadAllCoordinators,
  getDefaultCoordinatorForRegion,
  formatCoordinatorsForSelect,
  getCoordinatorDisplayName
} = useCoordinatorSelection()

// State
const localCoordinatorId = ref(props.coordinatorId)
const autoSelected = ref(false)
const showNonDefaultAlert = ref(false)
const nonDefaultCoordinatorName = ref('')

// Region options with proper formatting
const regionOptions = computed(() => {
  const options = formatRegionOptions(LOUISIANA_REGIONS)
  // Sort regions by ID for consistent ordering
  return options.sort((a, b) => parseInt(a.id) - parseInt(b.id))
})

// Computed
const hasLoadedCoordinators = computed(() => {
  return !loadingCoordinators.value && allCoordinators.value.length > 0
})

const displayedRegion = computed(() => {
  if (!props.region) return ''
  const region = regionOptions.value.find(r => r.id === props.region)
  return region?.name || props.region
})

const displayedCoordinator = computed(() => {
  if (!props.coordinatorId) return 'Not assigned'
  
  // If coordinators are still loading, show loading state
  if (loadingCoordinators.value) return 'Loading...'
  
  // Find the coordinator in our loaded list
  const coordinator = allCoordinators.value.find(c => c.id === props.coordinatorId)
  return coordinator ? (coordinator.displayName || coordinator.name || coordinator.email) : 'Unknown coordinator'
})

// Format coordinators for v-select with all coordinators visible
const coordinatorOptions = computed(() => {
  if (!allCoordinators.value.length) return []
  
  return formatCoordinatorsForSelect(props.region)
})

const defaultCoordinatorId = computed(() => {
  const defaultCoord = getDefaultCoordinatorForRegion(props.region)
  return defaultCoord?.id || ''
})

// Methods
async function autoSelectCoordinator() {
  if (!props.region || allCoordinators.value.length === 0) {
    return
  }

  await nextTick()

  const defaultCoordinator = getDefaultCoordinatorForRegion(props.region)
  if (defaultCoordinator) {
    localCoordinatorId.value = defaultCoordinator.id
    autoSelected.value = true
    showNonDefaultAlert.value = false
    nonDefaultCoordinatorName.value = ''
    emit('update:coordinator', defaultCoordinator.id)
  } else {
    // No default coordinator for this region
    localCoordinatorId.value = ''
    emit('update:coordinator', '')
  }
}

function handleRegionChange(newRegion) {
  emit('update:region', newRegion)
  
  if (!newRegion) {
    localCoordinatorId.value = ''
    autoSelected.value = false
    showNonDefaultAlert.value = false
    nonDefaultCoordinatorName.value = ''
    return
  }
  
  autoSelected.value = false
  autoSelectCoordinator()
}

function handleNonDefaultSelected(selectedItem) {
  nonDefaultCoordinatorName.value = selectedItem.label
  showNonDefaultAlert.value = true
  autoSelected.value = false
}

// Watchers
watch(localCoordinatorId, (newValue, oldValue) => {
  if (newValue !== oldValue) {
    emit('update:coordinator', newValue)
  }
})

watch(() => props.coordinatorId, (newValue) => {
  if (newValue !== localCoordinatorId.value) {
    localCoordinatorId.value = newValue
  }
})

watch(() => props.region, async (newRegion, oldRegion) => {
  if (newRegion !== oldRegion && props.editing) {
    await autoSelectCoordinator()
  }
})

watch(() => props.editing, async (newVal) => {
  if (newVal && props.region && !localCoordinatorId.value) {
    await autoSelectCoordinator()
  }
})

// Initialize local coordinator ID from props
onMounted(async () => {
  // Set initial local coordinator value
  localCoordinatorId.value = props.coordinatorId || ''
  
  // Load all coordinators
  await loadAllCoordinators()
  
  // If editing mode and region is set but no coordinator, auto-select
  if (props.editing && props.region && !props.coordinatorId) {
    await autoSelectCoordinator()
  }
})
</script>

<style scoped>
/* Ensure proper chip display in view mode */
.field-group .v-chip {
  cursor: default;
}

/* Alert styling */
.v-alert {
  margin-top: 16px;
}
</style>