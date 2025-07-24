<template>
  <v-autocomplete
    v-model="localValue"
    :items="items"
    item-title="label"
    item-value="value"
    variant="outlined"
    :loading="loading"
    density="comfortable"
    clearable
    no-data-text="No coordinators available"
    :hint="hint"
    :disabled="disabled"
    persistent-hint
    auto-select-first
  >
    <!-- Custom item template to show coordinator details -->
    <template v-slot:item="{ item, props: itemProps }">
      <v-list-item v-bind="itemProps" :title="item.raw.label">
        <template v-slot:prepend>
          <v-avatar size="32" color="primary">
            <span class="text-subtitle-2">
              {{ (item.raw.displayName || item.raw.label || item.raw.email || '?').charAt(0).toUpperCase() }}
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
          <div v-if="item.raw.regionNames" class="text-caption mt-1">
            <span class="text-grey-darken-1">Regions: </span>
            <span class="text-grey-darken-2">{{ item.raw.regionNames }}</span>
          </div>
        </template>
      </v-list-item>
    </template>
    
    <!-- Custom append inner slot for auto-assigned indicator -->
    <template v-slot:append-inner v-if="autoSelected && localValue">
      <span class="text-caption text-grey ml-2">(Auto-assigned)</span>
    </template>
  </v-autocomplete>
</template>

<script setup>
import { ref, watch } from 'vue'

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
  },
  hint: {
    type: String,
    default: ''
  },
  disabled: {
    type: Boolean,
    default: false
  }
})

// Emits
const emit = defineEmits(['update:modelValue', 'non-default-selected'])

// Local state
const localValue = ref(props.modelValue)

// Watch for prop changes
watch(() => props.modelValue, (newValue) => {
  localValue.value = newValue
})

// Watch for local value changes
watch(localValue, (newValue, oldValue) => {
  if (newValue !== oldValue) {
    emit('update:modelValue', newValue)
    
    // Check if non-default was selected
    if (newValue && props.region && props.defaultCoordinatorId && newValue !== props.defaultCoordinatorId) {
      const selectedItem = props.items.find(item => item.value === newValue)
      if (selectedItem) {
        emit('non-default-selected', selectedItem)
      }
    }
  }
})
</script>

<style scoped>
/* Ensure proper spacing in the dropdown */
.v-list-item {
  min-height: 64px;
}

/* Style the avatar */
.v-avatar {
  font-weight: 500;
}

/* Improve readability of email addresses */
.text-body-2 {
  font-family: monospace;
  font-size: 0.875rem !important;
}

/* Region text styling */
.text-caption {
  line-height: 1.5;
}
</style>