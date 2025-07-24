<template>
  <v-select
    v-model="localValue"
    :items="items"
    item-title="label"
    item-value="value"
    variant="outlined"
    :loading="loading"
    density="comfortable"
    clearable
    no-data-text="No coordinators available"
  >
    <!-- Custom item template to show coordinator details -->
    <template v-slot:item="{ item, props: itemProps }">
      <v-list-item v-bind="itemProps">
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
              v-if="!item.raw.isForCurrentRegion && region"
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
          <div v-if="item.raw.regions && item.raw.regions.length > 0" class="text-caption mt-1">
            <span class="text-grey-darken-1">Regions: </span>
            <span class="text-grey-darken-2">{{ item.raw.regionNames }}</span>
          </div>
        </template>
      </v-list-item>
    </template>
    
    <!-- Auto-selection indicator -->
    <template v-slot:append-item v-if="items.length > 0 && autoSelected && localValue">
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
import { ref, computed, watch } from 'vue'

// Props
const props = defineProps({
  modelValue: {
    type: String,
    default: ''
  },
  items: {
    type: Array,
    default: () => []
  },
  loading: {
    type: Boolean,
    default: false
  },
  region: {
    type: String,
    default: ''
  },
  autoSelected: {
    type: Boolean,
    default: false
  },
  defaultCoordinatorId: {
    type: String,
    default: ''
  }
})

// Emits
const emit = defineEmits(['update:modelValue', 'non-default-selected'])

// Local state
const localValue = ref(props.modelValue)

// Computed
const showNonDefaultWarning = computed(() => {
  if (!localValue.value || !props.region || props.autoSelected) return false
  return props.defaultCoordinatorId && localValue.value !== props.defaultCoordinatorId
})

// Watch for value changes
watch(localValue, (newValue) => {
  emit('update:modelValue', newValue)
  
  // Check if non-default was selected
  if (newValue && props.defaultCoordinatorId && newValue !== props.defaultCoordinatorId) {
    const selected = props.items.find(item => item.value === newValue)
    if (selected) {
      emit('non-default-selected', selected)
    }
  }
})

// Watch for external value changes
watch(() => props.modelValue, (newValue) => {
  if (newValue !== localValue.value) {
    localValue.value = newValue
  }
})
</script>

<style scoped>
/* List item styling */
.v-list-item {
  min-height: 64px !important;
}

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
</style>