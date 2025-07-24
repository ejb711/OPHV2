<!-- client/src/components/comms/projects/detail/tabs/info/ProjectRegionCoordinator.vue -->
<template>
  <v-row>
    <!-- Region Field -->
    <v-col cols="12" md="6">
      <div class="field-group">
        <label class="field-label">
          Region
          <span v-if="editing" class="text-error">*</span>
        </label>
        <!-- Show text field in view mode -->
        <v-text-field
          v-if="!editing"
          :model-value="displayedRegion"
          readonly
          variant="plain"
          density="comfortable"
        />
        <!-- Show select in edit mode -->
        <v-select
          v-else
          :model-value="region"
          :items="regionOptions"
          item-title="name"
          item-value="id"
          variant="outlined"
          :rules="[rules.required]"
          density="comfortable"
          @update:model-value="$emit('update:region', $event)"
        >
          <template v-slot:item="{ props, item }">
            <v-list-item v-bind="props">
              <template v-slot:prepend>
                <v-avatar
                  :color="getRegionColor(item.raw.id)"
                  size="small"
                >
                  <span class="text-caption">{{ item.raw.id }}</span>
                </v-avatar>
              </template>
            </v-list-item>
          </template>
        </v-select>
      </div>
    </v-col>
    
    <!-- Coordinator Field -->
    <v-col cols="12" md="6">
      <div class="field-group">
        <label class="field-label">Coordinator</label>
        <!-- Show text field in view mode -->
        <v-text-field
          v-if="!editing"
          :model-value="displayedCoordinator"
          readonly
          variant="plain"
          density="comfortable"
        />
        <!-- Show select in edit mode -->
        <v-select
          v-else
          :model-value="coordinatorId"
          :items="coordinatorOptions"
          item-title="label"
          item-value="value"
          variant="outlined"
          :loading="loadingCoordinators"
          density="comfortable"
          clearable
          @update:model-value="$emit('update:coordinator', $event)"
        />
      </div>
    </v-col>
  </v-row>
</template>

<script setup>
import { ref, computed, watch, onMounted } from 'vue'
import { LOUISIANA_REGIONS } from '@/config/louisiana-regions'
import { useCommsProjects } from '@/composables/comms/useCommsProjects'

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
    required: true
  }
})

// Emits
const emit = defineEmits(['update:region', 'update:coordinator'])

// Composables
const { coordinatorRegions } = useCommsProjects()

// State
const loadingCoordinators = ref(false)
const coordinatorOptions = ref([])

// Region options with proper formatting
const regionOptions = computed(() => {
  return Object.entries(LOUISIANA_REGIONS).map(([id, region]) => ({
    id,
    name: region.name,
    parishes: region.parishes
  }))
})

// Computed display values
const displayedRegion = computed(() => {
  if (!props.region) return ''
  const region = regionOptions.value.find(r => r.id === props.region)
  return region?.name || props.region
})

const displayedCoordinator = computed(() => {
  if (!props.coordinatorId) return 'Not assigned'
  const coordinator = coordinatorOptions.value.find(c => c.value === props.coordinatorId)
  return coordinator?.label || 'Loading...'
})

// Methods
async function loadCoordinators(regionId) {
  if (!regionId) return
  
  loadingCoordinators.value = true
  try {
    const coordinators = await coordinatorRegions(regionId)
    coordinatorOptions.value = coordinators.map(coord => ({
      label: coord.displayName || coord.email,
      value: coord.id,
      email: coord.email
    }))
  } catch (error) {
    console.error('Failed to load coordinators:', error)
    coordinatorOptions.value = []
  } finally {
    loadingCoordinators.value = false
  }
}

function getRegionColor(regionId) {
  const colors = {
    '1': '#1976D2',
    '2': '#388E3C',
    '3': '#7B1FA2',
    '4': '#F57C00',
    '5': '#D32F2F',
    '6': '#00796B',
    '7': '#5D4037',
    '8': '#616161',
    '9': '#303F9F'
  }
  return colors[regionId] || '#757575'
}

// Watchers
watch(() => props.region, (newRegion) => {
  if (newRegion) {
    loadCoordinators(newRegion)
  }
})

watch(() => props.editing, (newVal) => {
  if (newVal && props.region) {
    loadCoordinators(props.region)
  }
})

// Lifecycle
onMounted(() => {
  // Load coordinators for display even when not editing
  if (props.region) {
    loadCoordinators(props.region)
  }
})
</script>

<style scoped>
/* Ensure proper chip display in view mode */
.field-group .v-chip {
  cursor: default;
}
</style>