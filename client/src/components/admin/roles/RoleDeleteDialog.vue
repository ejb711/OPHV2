<!-- client/src/components/admin/roles/RoleDeleteDialog.vue -->
<script setup>
import { computed } from 'vue'

const props = defineProps({
  modelValue: {
    type: Boolean,
    default: false
  },
  role: {
    type: Object,
    default: null
  },
  loading: {
    type: Boolean,
    default: false
  }
})

const emit = defineEmits(['update:modelValue', 'confirm'])

const dialog = computed({
  get: () => props.modelValue,
  set: (value) => emit('update:modelValue', value)
})
</script>

<template>
  <v-dialog v-model="dialog" max-width="500">
    <v-card v-if="role">
      <v-card-title class="text-h5">
        Delete Role?
      </v-card-title>

      <v-card-text>
        <p>
          Are you sure you want to delete the role <strong>{{ role.name }}</strong>?
        </p>
        <p class="text-warning mt-2">
          This action cannot be undone.
        </p>
        
        <v-alert
          v-if="role.isSystemRole"
          type="error"
          variant="tonal"
          class="mt-3"
        >
          System roles cannot be deleted.
        </v-alert>
      </v-card-text>

      <v-card-actions>
        <v-spacer></v-spacer>
        <v-btn
          variant="text"
          @click="dialog = false"
          :disabled="loading"
        >
          Cancel
        </v-btn>
        <v-btn
          color="error"
          variant="elevated"
          @click="$emit('confirm')"
          :loading="loading"
          :disabled="role.isSystemRole"
        >
          Delete Role
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>