<!-- client/src/components/comms/projects/detail/ProjectDetailHeader.vue -->
<template>
  <v-card-title class="d-flex align-center pa-4 border-b">
    <!-- Title and Status -->
    <div class="flex-grow-1">
      <div class="d-flex align-center gap-2">
        <h3 class="text-h6">{{ project.title }}</h3>
        <StatusBadge :status="calculatedStatus || 'not_started'" size="small" />
        <RegionBadge 
          :region="project.region" 
          size="x-small"
        />
        <v-chip
          v-if="project.deleted"
          color="error"
          size="small"
          variant="tonal"
          prepend-icon="mdi-delete"
        >
          Deleted
        </v-chip>
      </div>
      
      <!-- Subtitle info -->
      <div class="text-caption text-grey-darken-1 mt-1">
        Created {{ formatDate(project.createdAt) }}
        <template v-if="project.createdBy">
          by {{ project.createdBy.displayName || project.createdBy.email }}
        </template>
      </div>
    </div>
    
    <!-- Actions -->
    <div class="d-flex align-center gap-1">
      <!-- Edit Mode Actions -->
      <template v-if="editing">
        <v-btn
          color="primary"
          variant="flat"
          size="small"
          :loading="saving"
          :disabled="!hasChanges"
          @click="$emit('save')"
        >
          Save Changes
        </v-btn>
        <v-btn
          variant="text"
          size="small"
          @click="$emit('cancel')"
        >
          Cancel
        </v-btn>
      </template>
      
      <!-- View Mode Actions -->
      <template v-else>
        <v-btn
          v-if="canEdit && !project.deleted"
          color="primary"
          variant="tonal"
          size="small"
          prepend-icon="mdi-pencil"
          @click="$emit('edit')"
        >
          Edit
        </v-btn>
        
        <v-btn
          v-if="canEdit && !project.deleted"
          color="error"
          variant="text"
          size="small"
          icon="mdi-delete"
          @click="$emit('delete')"
        />
      </template>
      
      <!-- Close button -->
      <v-btn
        icon="mdi-close"
        variant="text"
        size="small"
        @click="$emit('close')"
      />
    </div>
  </v-card-title>
</template>

<script setup>
import { computed, toRef } from 'vue'
import { useProjectStatus } from '@/composables/comms/useProjectStatus'
import StatusBadge from '@/components/comms/shared/StatusBadge.vue'
import RegionBadge from '@/components/comms/shared/RegionBadge.vue'

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

// Use project status composable
const projectRef = toRef(props, 'project')
const { calculatedStatus } = useProjectStatus(projectRef)

// Methods
function formatDate(timestamp) {
  if (!timestamp) return 'Unknown'
  
  try {
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp)
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    }).format(date)
  } catch (error) {
    return 'Unknown'
  }
}
</script>