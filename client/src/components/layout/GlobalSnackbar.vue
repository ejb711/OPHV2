<!-- client/src/components/layout/GlobalSnackbar.vue -->
<template>
  <v-snackbar
    v-model="show"
    :color="color"
    :timeout="timeout"
    :location="location"
    multi-line
  >
    {{ message }}
    
    <template v-slot:actions>
      <v-btn
        variant="text"
        @click="show = false"
      >
        Close
      </v-btn>
    </template>
  </v-snackbar>
</template>

<script setup>
import { computed } from 'vue'

// Props
const props = defineProps({
  modelValue: Object
})

// Emits
const emit = defineEmits(['update:modelValue'])

// Computed properties for reactive snackbar state
const show = computed({
  get: () => props.modelValue.show,
  set: (value) => emit('update:modelValue', { ...props.modelValue, show: value })
})

const message = computed(() => props.modelValue.message || '')
const color = computed(() => props.modelValue.color || 'success')
const timeout = computed(() => props.modelValue.timeout || 4000)
const location = computed(() => props.modelValue.location || 'bottom')
</script>