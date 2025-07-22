<!-- client/src/components/comms/projects/ProjectActions.vue -->
<template>
  <div class="d-flex align-center gap-2">
    <!-- Edit Button -->
    <v-btn
      v-if="canEdit && !hideEdit"
      color="primary"
      variant="tonal"
      size="small"
      prepend-icon="mdi-pencil"
      @click="$emit('edit')"
    >
      Edit
    </v-btn>

    <!-- Delete Menu -->
    <v-menu v-if="canDelete && !hideDelete" location="bottom">
      <template v-slot:activator="{ props }">
        <v-btn
          v-bind="props"
          color="error"
          variant="tonal"
          size="small"
          prepend-icon="mdi-delete"
        >
          Delete
        </v-btn>
      </template>

      <v-card min-width="300">
        <v-card-title class="text-h6">Delete Project?</v-card-title>
        <v-card-text>
          <p class="mb-4">Choose delete option:</p>
          
          <v-list density="compact">
            <v-list-item
              prepend-icon="mdi-delete-clock"
              @click="handleSoftDelete"
            >
              <v-list-item-title>Soft Delete</v-list-item-title>
              <v-list-item-subtitle>
                Move to trash (can be restored within 90 days)
              </v-list-item-subtitle>
            </v-list-item>
            
            <v-list-item
              v-if="canHardDelete"
              prepend-icon="mdi-delete-forever"
              @click="handleHardDelete"
              class="text-error"
            >
              <v-list-item-title>Permanently Delete</v-list-item-title>
              <v-list-item-subtitle>
                Cannot be undone - all data will be lost
              </v-list-item-subtitle>
            </v-list-item>
          </v-list>
        </v-card-text>
      </v-card>
    </v-menu>

    <!-- Additional Actions Menu -->
    <v-menu v-if="showMore" location="bottom">
      <template v-slot:activator="{ props }">
        <v-btn
          v-bind="props"
          icon="mdi-dots-vertical"
          variant="text"
          size="small"
        />
      </template>

      <v-list density="compact">
        <v-list-item
          v-if="canDuplicate"
          prepend-icon="mdi-content-copy"
          @click="$emit('duplicate')"
        >
          <v-list-item-title>Duplicate Project</v-list-item-title>
        </v-list-item>
        
        <v-list-item
          v-if="canExport"
          prepend-icon="mdi-download"
          @click="$emit('export')"
        >
          <v-list-item-title>Export Project</v-list-item-title>
        </v-list-item>
        
        <v-list-item
          v-if="canArchive"
          prepend-icon="mdi-archive"
          @click="$emit('archive')"
        >
          <v-list-item-title>Archive Project</v-list-item-title>
        </v-list-item>
      </v-list>
    </v-menu>

    <!-- Delete Confirmation Dialog -->
    <v-dialog v-model="confirmDialog" max-width="400">
      <v-card>
        <v-card-title class="text-h6">
          {{ confirmHard ? 'Permanently Delete' : 'Delete' }} Project?
        </v-card-title>
        <v-card-text>
          <v-alert
            :type="confirmHard ? 'error' : 'warning'"
            variant="tonal"
            class="mb-4"
          >
            <div v-if="confirmHard">
              This action cannot be undone. All project data, files, and messages will be permanently deleted.
            </div>
            <div v-else>
              This project will be moved to trash and automatically deleted after 90 days.
            </div>
          </v-alert>
          
          <p>
            Are you sure you want to {{ confirmHard ? 'permanently delete' : 'delete' }} 
            <strong>"{{ project.title }}"</strong>?
          </p>
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn
            variant="text"
            @click="confirmDialog = false"
          >
            Cancel
          </v-btn>
          <v-btn
            :color="confirmHard ? 'error' : 'warning'"
            variant="elevated"
            @click="confirmDelete"
          >
            {{ confirmHard ? 'Permanently Delete' : 'Delete' }}
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useCommsProjects } from '@/composables/comms/useCommsProjects'
import { usePermissions } from '@/composables/usePermissions'

// Props
const props = defineProps({
  project: {
    type: Object,
    required: true
  },
  hideEdit: {
    type: Boolean,
    default: false
  },
  hideDelete: {
    type: Boolean,
    default: false
  },
  showMore: {
    type: Boolean,
    default: true
  }
})

// Emits
const emit = defineEmits([
  'edit',
  'delete',
  'duplicate',
  'export',
  'archive'
])

// Composables
const { canEditProject, canDeleteProject } = useCommsProjects()
const { hasPermission, canManageComms } = usePermissions()

// State
const confirmDialog = ref(false)
const confirmHard = ref(false)

// Computed
const canEdit = computed(() => canEditProject(props.project))
const canDelete = computed(() => canDeleteProject(props.project))
const canHardDelete = computed(() => canManageComms.value)
const canDuplicate = computed(() => hasPermission('create_comms_projects'))
const canExport = computed(() => hasPermission('export_comms_projects'))
const canArchive = computed(() => canEditProject(props.project))

// Methods
function handleSoftDelete() {
  confirmHard.value = false
  confirmDialog.value = true
}

function handleHardDelete() {
  confirmHard.value = true
  confirmDialog.value = true
}

function confirmDelete() {
  emit('delete', confirmHard.value)
  confirmDialog.value = false
}
</script>