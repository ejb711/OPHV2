<template>
  <div>
    <v-row>
      <v-col cols="12" sm="6">
        <div class="field-group">
          <label>Region <span v-if="editing" class="text-error">*</span></label>
          <!-- Show chip in view mode -->
          <v-chip
            v-if="!editing"
            :color="getRegionColor(localRegion)"
            variant="tonal"
            size="small"
          >
            {{ displayedRegion }}
          </v-chip>
          <!-- Show select in edit mode - ALWAYS ENABLED -->
          <v-select
            v-else
            v-model="localRegion"
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
            :region="localRegion"
            :auto-selected="autoSelected"
            :default-coordinator-id="defaultCoordinatorId"
            @non-default-selected="handleNonDefaultSelected"
            :hint="editing && !localRegion ? 'Please select a region first' : ''"
            :disabled="!localRegion"
          />
        </div>
      </v-col>
    </v-row>

    <!-- Non-default coordinator alert - moved outside of v-row for better display -->
    <v-row v-if="editing && showNonDefaultAlert" class="mt-0">
      <v-col cols="12">
        <v-alert
          type="info"
          variant="tonal"
          density="comfortable"
          closable
          class="mb-0"
          @click:close="showNonDefaultAlert = false"
        >
          <strong>Non-default coordinator selected</strong>
          <div class="mt-1">
            You've selected <strong>{{ nonDefaultCoordinatorName }}</strong> instead of the default coordinator for this region.
            This is allowed but may require additional coordination.
          </div>
        </v-alert>
      </v-col>
    </v-row>
  </div>
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
const localRegion = ref(props.region)
const localCoordinatorId = ref(props.coordinatorId)
const autoSelected = ref(false)
const showNonDefaultAlert = ref(false)
const nonDefaultCoordinatorName = ref('')

// Debug logging
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
  if (!localRegion.value) return ''
  const region = regionOptions.value.find(r => r.id === localRegion.value)
  return region?.name || localRegion.value
})

const displayedCoordinator = computed(() => {
  if (!localCoordinatorId.value) return 'Not assigned'

  // Use the composable's function to get the display name
  const displayName = getCoordinatorDisplayName(localCoordinatorId.value)
  return displayName
})

// Format coordinators for v-select with all coordinators visible
const coordinatorOptions = computed(() => {
  if (!allCoordinators.value.length) return []

  return formatCoordinatorsForSelect(localRegion.value)
})

const defaultCoordinatorId = computed(() => {
  const defaultCoord = getDefaultCoordinatorForRegion(localRegion.value)
  return defaultCoord?.id || ''
})

// Methods
async function autoSelectCoordinator() {
  if (!localRegion.value || allCoordinators.value.length === 0) {
    return
  }

  await nextTick()

  const defaultCoordinator = getDefaultCoordinatorForRegion(localRegion.value)
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

function handleNonDefaultSelected(selectedItem) {
  nonDefaultCoordinatorName.value = selectedItem.label
  showNonDefaultAlert.value = true
  autoSelected.value = false
}

// Watchers
watch(localRegion, async (newRegion, oldRegion) => {
  if (newRegion !== oldRegion) {
    emit('update:region', newRegion)

    if (!newRegion) {
      // Clear coordinator when region is cleared
      localCoordinatorId.value = ''
      autoSelected.value = false
      showNonDefaultAlert.value = false
      nonDefaultCoordinatorName.value = ''
      emit('update:coordinator', '')
      return
    }

    // Clear existing coordinator and state when region changes
    localCoordinatorId.value = ''
    autoSelected.value = false
    showNonDefaultAlert.value = false
    nonDefaultCoordinatorName.value = ''
    emit('update:coordinator', '')

    // Wait for the clear to propagate
    await nextTick()

    // Then auto-select the new region's default coordinator
    await autoSelectCoordinator()
  }
})

watch(localCoordinatorId, (newValue, oldValue) => {
  if (newValue !== oldValue) {
    emit('update:coordinator', newValue)
  }
})

watch(() => props.region, (newValue) => {
  if (newValue !== localRegion.value) {
    localRegion.value = newValue
  }
})

watch(() => props.coordinatorId, (newValue) => {
  if (newValue !== localCoordinatorId.value) {
    localCoordinatorId.value = newValue
  }
})

watch(() => props.editing, async (newVal) => {
  if (newVal && localRegion.value && !localCoordinatorId.value) {
    await autoSelectCoordinator()
  }
})

// Initialize local coordinator ID from props
onMounted(async () => {
  // Set initial local values from props
  localRegion.value = props.region || ''
  localCoordinatorId.value = props.coordinatorId || ''

  // Load all coordinators
  await loadAllCoordinators()

  // If editing mode and region is set but no coordinator, auto-select
  if (props.editing && localRegion.value && !props.coordinatorId) {
    await autoSelectCoordinator()
  }
})
</script>

<style scoped>
/* Ensure proper chip display in view mode */
.field-group .v-chip {
  cursor: default;
}

/* Alert styling - ensure proper display */
.v-alert {
  width: 100%;
  min-height: auto;
}

/* Ensure alert content is visible */
.v-alert strong {
  font-weight: 600;
}

/* Fix any potential z-index issues */
.v-row:has(.v-alert) {
  position: relative;
  z-index: 1;
}
</style>