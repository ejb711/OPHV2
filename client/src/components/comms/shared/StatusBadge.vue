<template>
  <v-chip
    :color="statusConfig.color"
    :size="size"
    :variant="variant"
    :prepend-icon="showIcon ? statusConfig.icon : undefined"
    class="status-badge font-weight-medium"
  >
    {{ statusConfig.label }}
  </v-chip>
</template>

<script setup>
import { computed } from 'vue'

// Props
const props = defineProps({
  status: {
    type: String,
    required: true
  },
  size: {
    type: String,
    default: 'default',
    validator: (value) => ['x-small', 'small', 'default', 'large', 'x-large'].includes(value)
  },
  variant: {
    type: String,
    default: 'tonal',
    validator: (value) => ['tonal', 'flat', 'elevated', 'outlined', 'text', 'plain'].includes(value)
  },
  showIcon: {
    type: Boolean,
    default: true
  }
})

// Status configurations
const statusConfigurations = {
  // Project lifecycle statuses
  'not_started': {
    label: 'Not Started',
    color: 'grey',
    icon: 'mdi-clock-outline'
  },
  'planning': {
    label: 'Planning',
    color: 'blue',
    icon: 'mdi-pencil-ruler'
  },
  'in_progress': {
    label: 'In Progress',
    color: 'amber',
    icon: 'mdi-progress-clock'
  },
  'review': {
    label: 'Under Review',
    color: 'orange',
    icon: 'mdi-eye-check'
  },
  'pending_approval': {
    label: 'Pending Approval',
    color: 'deep-orange',
    icon: 'mdi-clock-alert'
  },
  'approved': {
    label: 'Approved',
    color: 'green',
    icon: 'mdi-check-circle'
  },
  'completed': {
    label: 'Completed',
    color: 'teal',
    icon: 'mdi-check-all'
  },
  'on_hold': {
    label: 'On Hold',
    color: 'red',
    icon: 'mdi-pause-circle'
  },
  'cancelled': {
    label: 'Cancelled',
    color: 'grey-darken-2',
    icon: 'mdi-close-circle'
  },
  
  // Stage statuses (for individual project stages)
  'stage_not_started': {
    label: 'Not Started',
    color: 'grey-lighten-1',
    icon: 'mdi-circle-outline'
  },
  'stage_in_progress': {
    label: 'In Progress',
    color: 'blue',
    icon: 'mdi-circle-slice-4'
  },
  'stage_completed': {
    label: 'Completed',
    color: 'green',
    icon: 'mdi-check-circle'
  },
  
  // Fallback
  'unknown': {
    label: 'Unknown',
    color: 'grey',
    icon: 'mdi-help-circle'
  }
}

// Computed
const statusConfig = computed(() => {
  const config = statusConfigurations[props.status] || statusConfigurations['unknown']
  
  // Handle custom label formatting if needed
  if (props.status && !statusConfigurations[props.status]) {
    // Convert snake_case to Title Case
    const customLabel = props.status
      .split('_')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ')
    
    return {
      ...config,
      label: customLabel
    }
  }
  
  return config
})
</script>

<style scoped>
.status-badge {
  text-transform: none !important;
  letter-spacing: normal;
}

/* Ensure consistent sizing */
.v-chip--size-x-small .v-icon {
  font-size: 14px !important;
}

.v-chip--size-small .v-icon {
  font-size: 16px !important;
}

.v-chip--size-default .v-icon {
  font-size: 18px !important;
}
</style>