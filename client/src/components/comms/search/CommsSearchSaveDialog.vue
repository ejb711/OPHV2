<!-- client/src/components/comms/search/CommsSearchSaveDialog.vue -->
<template>
  <v-dialog
    :model-value="modelValue"
    max-width="500"
    @update:model-value="$emit('update:modelValue', $event)"
  >
    <v-card>
      <v-card-title>Save Filter Set</v-card-title>
      <v-card-text>
        <v-text-field
          v-model="filterName"
          label="Filter Name"
          variant="outlined"
          density="comfortable"
          placeholder="e.g., Q4 Marketing Projects"
          class="mb-3"
        />
        <v-textarea
          v-model="filterDescription"
          label="Description (optional)"
          variant="outlined"
          density="comfortable"
          rows="2"
        />
      </v-card-text>
      <v-card-actions>
        <v-spacer />
        <v-btn
          variant="text"
          @click="handleCancel"
        >
          Cancel
        </v-btn>
        <v-btn
          color="primary"
          variant="flat"
          :disabled="!filterName"
          @click="handleSave"
        >
          Save
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script setup>
import { ref, watch } from 'vue'

// Props
const props = defineProps({
  modelValue: {
    type: Boolean,
    default: false
  }
})

// Emits
const emit = defineEmits(['update:modelValue', 'save'])

// Local state
const filterName = ref('')
const filterDescription = ref('')

// Methods
function handleSave() {
  if (!filterName.value) return
  
  emit('save', filterName.value, filterDescription.value)
  
  // Reset form
  filterName.value = ''
  filterDescription.value = ''
}

function handleCancel() {
  // Reset form
  filterName.value = ''
  filterDescription.value = ''
  emit('update:modelValue', false)
}

// Reset form when dialog closes
watch(() => props.modelValue, (newVal) => {
  if (!newVal) {
    filterName.value = ''
    filterDescription.value = ''
  }
})
</script>