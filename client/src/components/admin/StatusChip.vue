<!-- client/src/components/admin/StatusChip.vue -->
<template>
  <v-chip
    :color="chipColor"
    :size="size"
    :variant="variant"
    :class="{ 'cursor-pointer': clickable }"
    @click="clickable && $emit('click')"
  >
    <v-icon :size="iconSize" start>{{ statusIcon }}</v-icon>
    {{ statusText }}
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
    default: 'default'
  },
  variant: {
    type: String,
    default: 'tonal'
  },
  clickable: {
    type: Boolean,
    default: false
  }
})

// Emits
const emit = defineEmits(['click'])

// Computed
const statusConfig = computed(() => {
  const configs = {
    active: {
      color: 'success',
      icon: 'mdi-check-circle',
      text: 'Active'
    },
    suspended: {
      color: 'error',
      icon: 'mdi-cancel',
      text: 'Suspended'
    },
    pending: {
      color: 'warning',
      icon: 'mdi-clock-outline',
      text: 'Pending'
    },
    disabled: {
      color: 'grey',
      icon: 'mdi-block-helper',
      text: 'Disabled'
    }
  }
  
  return configs[props.status] || {
    color: 'grey',
    icon: 'mdi-help-circle',
    text: props.status
  }
})

const chipColor = computed(() => statusConfig.value.color)
const statusIcon = computed(() => statusConfig.value.icon)
const statusText = computed(() => statusConfig.value.text)

const iconSize = computed(() => {
  switch (props.size) {
    case 'x-small': return 14
    case 'small': return 16
    case 'large': return 20
    default: return 18
  }
})
</script>

<style scoped>
.cursor-pointer {
  cursor: pointer;
}

.cursor-pointer:hover {
  opacity: 0.8;
}
</style>