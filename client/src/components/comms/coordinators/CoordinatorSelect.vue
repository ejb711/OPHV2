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
  >
    <template v-slot:prepend-inner>
      <v-icon>mdi-account-tie</v-icon>
    </template>
    
    <template v-slot:item="{ props, item }">
      <v-list-item v-bind="props">
        <template v-slot:prepend>
          <v-avatar size="32">
            <v-icon>mdi-account</v-icon>
          </v-avatar>
        </template>
        
        <v-list-item-subtitle>
          {{ item.raw.email }}
        </v-list-item-subtitle>
      </v-list-item>
    </template>
    
    <template v-slot:no-data>
      <v-list-item>
        <v-list-item-title>
          {{ noDataText }}
        </v-list-item-title>
      </v-list-item>
    </template>
  </v-select>
</template>

<script setup>
import { ref, computed, watch, onMounted } from 'vue'
import { collection, query, where, getDocs } from 'firebase/firestore'
import { db } from '@/firebase'

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
  }
})

// Emits
const emit = defineEmits(['update:modelValue'])

// State
const loading = ref(false)
const coordinators = ref([])

// Computed
const selectedCoordinator = computed({
  get: () => props.modelValue,
  set: (value) => emit('update:modelValue', value)
})

const coordinatorItems = computed(() => {
  if (!props.region) {
    // If no region selected, show all coordinators
    return coordinators.value.map(coord => ({
      id: coord.id,
      displayName: coord.name || coord.email,
      email: coord.email,
      regions: coord.regions
    }))
  }
  
  // Filter coordinators by selected region
  return coordinators.value
    .filter(coord => coord.regions.includes(props.region))
    .map(coord => ({
      id: coord.id,
      displayName: coord.name || coord.email,
      email: coord.email,
      regions: coord.regions
    }))
})

const noDataText = computed(() => {
  if (loading.value) return 'Loading coordinators...'
  if (!props.region) return 'Select a region first'
  if (coordinatorItems.value.length === 0) return 'No coordinators found for this region'
  return 'No data available'
})

// Methods
async function fetchCoordinators() {
  loading.value = true
  try {
    const q = query(collection(db, 'comms_coordinators'))
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

// Watch for region changes
watch(() => props.region, (newRegion, oldRegion) => {
  if (newRegion !== oldRegion) {
    // Check if current coordinator is still valid for new region
    const currentCoord = coordinators.value.find(c => c.id === selectedCoordinator.value)
    if (currentCoord && !currentCoord.regions.includes(newRegion)) {
      // Clear selection if coordinator doesn't cover the new region
      selectedCoordinator.value = ''
    }
  }
})

// Lifecycle
onMounted(() => {
  fetchCoordinators()
})
</script>

<style scoped>
/* No custom styles needed - using Vuetify defaults */
</style>