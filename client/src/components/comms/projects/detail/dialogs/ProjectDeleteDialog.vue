<!-- client/src/components/comms/projects/detail/dialogs/ProjectDeleteDialog.vue -->
<template>
  <v-dialog
    :model-value="modelValue"
    max-width="400"
    @update:model-value="$emit('update:modelValue', $event)"
  >
    <v-card>
      <v-card-title class="text-error d-flex align-center">
        <v-icon class="mr-2">mdi-delete-alert</v-icon>
        Delete Project
      </v-card-title>
      
      <v-card-text>
        <p>Are you sure you want to delete this project?</p>
        
        <v-alert
          type="warning"
          variant="tonal"
          density="compact"
          class="mt-3"
        >
          <strong>{{ projectName }}</strong>
        </v-alert>
        
        <p class="mt-3 text-body-2">
          This project will be moved to the trash and can be restored within 90 days.
          After 90 days, it will be permanently deleted.
        </p>
        
        <div class="mt-4">
          <v-checkbox
            v-model="confirmed"
            label="I understand this action will delete the project"
            color="error"
            hide-details
          />
        </div>
      </v-card-text>
      
      <v-card-actions>
        <v-spacer />
        
        <v-btn
          variant="text"
          @click="cancel"
        >
          Cancel
        </v-btn>
        
        <v-btn
          color="error"
          variant="elevated"
          :loading="deleting"
          :disabled="!confirmed"
          @click="confirmDelete"
        >
          Delete Project
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
  },
  projectName: {
    type: String,
    default: ''
  },
  deleting: {
    type: Boolean,
    default: false
  }
})

// Emit
const emit = defineEmits(['update:modelValue', 'confirm'])

// State
const confirmed = ref(false)

// Methods
function cancel() {
  confirmed.value = false
  emit('update:modelValue', false)
}

function confirmDelete() {
  if (confirmed.value) {
    emit('confirm')
  }
}

// Reset confirmation when dialog closes
watch(() => props.modelValue, (val) => {
  if (!val) {
    confirmed.value = false
  }
})
</script>