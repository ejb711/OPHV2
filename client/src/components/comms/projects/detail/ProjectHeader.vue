<!-- client/src/components/comms/projects/detail/ProjectHeader.vue -->
<template>
  <div>
    <v-card-title class="d-flex align-center pa-4">
      <div class="flex-grow-1">
        <div class="d-flex align-center ga-2">
          <h3 class="text-h5">{{ project.title }}</h3>
          <StatusBadge :status="project.status" />
          <v-chip 
            v-if="project.priority === 'high'" 
            color="error" 
            size="small"
            variant="tonal"
          >
            High Priority
          </v-chip>
        </div>
        
        <div class="text-caption text-grey mt-1">
          Created {{ formatDate(project.createdAt) }} 
          by {{ project.createdByEmail }}
        </div>
      </div>
      
      <div class="d-flex align-center ga-2">
        <!-- Edit/Save/Cancel buttons -->
        <template v-if="canEdit">
          <v-btn
            v-if="!editing"
            variant="tonal"
            prepend-icon="mdi-pencil"
            @click="$emit('edit')"
          >
            Edit
          </v-btn>
          
          <template v-else>
            <v-btn
              variant="text"
              @click="$emit('cancel')"
            >
              Cancel
            </v-btn>
            <v-btn
              color="primary"
              variant="elevated"
              prepend-icon="mdi-content-save"
              :loading="saving"
              @click="$emit('save')"
            >
              Save
            </v-btn>
          </template>
        </template>
        
        <!-- More actions -->
        <v-menu v-if="canEdit && !editing">
          <template v-slot:activator="{ props }">
            <v-btn
              icon
              variant="text"
              v-bind="props"
            >
              <v-icon>mdi-dots-vertical</v-icon>
            </v-btn>
          </template>
          
          <v-list density="compact">
            <v-list-item @click="$emit('delete')">
              <template v-slot:prepend>
                <v-icon color="error">mdi-delete</v-icon>
              </template>
              <v-list-item-title class="text-error">
                Delete Project
              </v-list-item-title>
            </v-list-item>
          </v-list>
        </v-menu>
        
        <!-- Close button -->
        <v-btn
          icon
          variant="text"
          @click="$emit('close')"
        >
          <v-icon>mdi-close</v-icon>
        </v-btn>
      </div>
    </v-card-title>
    
    <v-divider />
  </div>
</template>

<script setup>
import { formatDistanceToNow } from 'date-fns'
import StatusBadge from '../../shared/StatusBadge.vue'

// Props
defineProps({
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
  }
})

// Emits
defineEmits(['close', 'edit', 'save', 'cancel', 'delete'])

// Methods
function formatDate(timestamp) {
  if (!timestamp) return 'Unknown date'
  
  try {
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp)
    return formatDistanceToNow(date, { addSuffix: true })
  } catch (error) {
    return 'Unknown date'
  }
}
</script>