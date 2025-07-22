<template>
  <v-chip
    v-if="regionConfig"
    :color="regionConfig.color"
    :size="size"
    :variant="variant"
    :prepend-icon="showIcon ? 'mdi-map-marker' : undefined"
    class="region-badge font-weight-medium"
  >
    {{ regionConfig.name }}
  </v-chip>
</template>

<script setup>
import { computed } from 'vue'
import { LOUISIANA_REGIONS } from '@/config/louisiana-regions'

// Props
const props = defineProps({
  region: {
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
    default: false
  },
  showFullName: {
    type: Boolean,
    default: false
  }
})

// Computed
const regionConfig = computed(() => {
  const region = LOUISIANA_REGIONS[props.region]
  if (!region) {
    return {
      name: 'Unknown Region',
      fullName: 'Unknown Region',
      color: 'grey'
    }
  }
  
  return {
    ...region,
    name: props.showFullName ? region.fullName : region.name
  }
})
</script>

<style scoped>
.region-badge {
  text-transform: none !important;
  letter-spacing: normal;
}

/* Louisiana Department of Health brand colors applied to regions */
.region-badge.v-chip--variant-tonal {
  font-weight: 500;
}

/* Ensure consistent icon sizing */
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