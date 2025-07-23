<!-- client/src/components/comms/projects/detail/ProjectHeader.vue -->
<template>
  <v-card-title class="d-flex align-center pa-4 border-b">
    <div class="d-flex align-center flex-grow-1">
      <StatusBadge :status="project.status" class="mr-3" />
      <span class="text-h6">{{ project.title }}</span>
    </div>
    
    <v-spacer />
    
    <!-- Action Buttons -->
    <div class="d-flex align-center gap-2">
      <!-- Edit/Save/Cancel Buttons -->
      <template v-if="canEdit">
        <v-btn
          v-if="!editing"
          color="primary"
          variant="text"
          size="small"
          @click="$emit('edit')"
        >
          <v-icon start>mdi-pencil</v-icon>
          Edit
        </v-btn>
        
        <template v-else>
          <v-btn
            color="success"
            variant="text"
            size="small"
            :loading="saving"
            :disabled="!hasChanges"
            @click="$emit('save')"
          >
            <v-icon start>mdi-check</v-icon>
            Save
          </v-btn>
          
          <v-btn
            color="grey"
            variant="text"
            size="small"
            :disabled="saving"
            @click="$emit('cancel')"
          >
            <v-icon start>mdi-close</v-icon>
            Cancel
          </v-btn>
        </template>
      </template>
      
      <!-- Delete Button -->
      <v-btn
        v-if="canEdit && !editing"
        color="error"
        variant="text"
        size="small"
        @click="$emit('delete')"
      >
        <v-icon start>mdi-delete</v-icon>
        Delete
      </v-btn>
      
      <!-- Close Button -->
      <v-btn
        icon
        variant="text"
        size="small"
        @click="$emit('close')"
      >
        <v-icon>mdi-close</v-icon>
      </v-btn>
    </div>
  </v-card-title>
</template>

<script setup>
import StatusBadge from '../../shared/StatusBadge.vue'

// Props
const props = defineProps({
  project: {
    type: Object,
    required: true
  },
  canEdit: {
    type: Boolean,
    default: false
  },
  editing: {
    type: Boolean,
    default: false
  },
  saving: {
    type: Boolean,
    default: false
  },
  hasChanges: {
    type: Boolean,
    default: false
  }
})

// Emit
defineEmits(['close', 'edit', 'save', 'cancel', 'delete'])
</script>

<style scoped>
.gap-2 > * + * {
  margin-left: 8px;
}

.border-b {
  border-bottom: 1px solid rgba(0, 0, 0, 0.12);
}
</style>