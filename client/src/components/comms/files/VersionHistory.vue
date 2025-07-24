<!-- client/src/components/comms/files/VersionHistory.vue -->
<template>
  <v-dialog
    v-model="dialog"
    max-width="600"
    scrollable
  >
    <v-card>
      <v-card-title class="d-flex align-center">
        <v-icon class="mr-2">mdi-history</v-icon>
        Version History: {{ fileName }}
        <v-spacer />
        <v-btn
          icon
          variant="text"
          @click="close"
        >
          <v-icon>mdi-close</v-icon>
        </v-btn>
      </v-card-title>
      
      <v-divider />
      
      <v-card-text class="pa-0">
        <v-list v-if="versions.length > 0">
          <template v-for="(version, index) in versions" :key="version.id">
            <v-list-item>
              <template v-slot:prepend>
                <v-avatar color="primary" variant="tonal">
                  <span class="text-h6">v{{ version.version || 1 }}</span>
                </v-avatar>
              </template>
              
              <v-list-item-title>
                Version {{ version.version || 1 }}
                <v-chip
                  v-if="index === 0"
                  size="x-small"
                  color="success"
                  class="ml-2"
                >
                  Latest
                </v-chip>
              </v-list-item-title>
              
              <v-list-item-subtitle>
                {{ formatFileSize(version.size) }} • 
                {{ formatDate(version.createdAt) }}
                <span v-if="version.createdByEmail" class="ml-2">
                  by {{ version.createdByEmail }}
                </span>
              </v-list-item-subtitle>
              
              <template v-if="version.description">
                <v-list-item-subtitle class="mt-1">
                  {{ version.description }}
                </v-list-item-subtitle>
              </template>
              
              <template v-slot:append>
                <div class="d-flex align-center">
                  <!-- View button -->
                  <v-btn
                    icon
                    size="small"
                    variant="text"
                    :href="version.downloadURL"
                    target="_blank"
                  >
                    <v-icon>mdi-download</v-icon>
                    <v-tooltip activator="parent" location="top">
                      Download version
                    </v-tooltip>
                  </v-btn>
                  
                  <!-- Restore button -->
                  <v-btn
                    v-if="canRestore && index > 0"
                    icon
                    size="small"
                    variant="text"
                    @click="restoreVersion(version)"
                  >
                    <v-icon>mdi-restore</v-icon>
                    <v-tooltip activator="parent" location="top">
                      Restore this version
                    </v-tooltip>
                  </v-btn>
                  
                  <!-- Delete button -->
                  <v-btn
                    v-if="canDelete && versions.length > 1"
                    icon
                    size="small"
                    variant="text"
                    color="error"
                    @click="deleteVersion(version)"
                  >
                    <v-icon>mdi-delete</v-icon>
                    <v-tooltip activator="parent" location="top">
                      Delete version
                    </v-tooltip>
                  </v-btn>
                </div>
              </template>
            </v-list-item>
            
            <v-divider v-if="index < versions.length - 1" />
          </template>
        </v-list>
        
        <div v-else class="text-center py-8">
          <v-icon size="48" color="grey">mdi-history</v-icon>
          <p class="text-grey mt-2">No version history available</p>
        </div>
      </v-card-text>
    </v-card>
    
    <!-- Restore Confirmation -->
    <v-dialog v-model="restoreDialog" max-width="400">
      <v-card>
        <v-card-title>Restore Version</v-card-title>
        
        <v-card-text>
          Are you sure you want to restore version {{ restoringVersion?.version || 1 }}?
          <br><br>
          This will create a new version (v{{ latestVersion + 1 }}) with the content from this version.
        </v-card-text>
        
        <v-card-actions>
          <v-spacer />
          <v-btn variant="text" @click="restoreDialog = false">Cancel</v-btn>
          <v-btn 
            color="primary" 
            variant="elevated"
            :loading="restoring"
            @click="confirmRestore"
          >
            Restore
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
    
    <!-- Delete Confirmation -->
    <v-dialog v-model="deleteDialog" max-width="400">
      <v-card>
        <v-card-title class="text-error">Delete Version</v-card-title>
        
        <v-card-text>
          Are you sure you want to permanently delete version {{ deletingVersion?.version || 1 }}?
          This action cannot be undone.
        </v-card-text>
        
        <v-card-actions>
          <v-spacer />
          <v-btn variant="text" @click="deleteDialog = false">Cancel</v-btn>
          <v-btn 
            color="error" 
            variant="elevated"
            :loading="deleting"
            @click="confirmDelete"
          >
            Delete
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </v-dialog>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import { formatFileSize, formatDate } from '@/utils/fileUtils'

// Props & Emits
const props = defineProps({
  modelValue: {
    type: Boolean,
    default: false
  },
  fileName: {
    type: String,
    default: ''
  },
  versions: {
    type: Array,
    default: () => []
  },
  canRestore: {
    type: Boolean,
    default: false
  },
  canDelete: {
    type: Boolean,
    default: false
  }
})

const emit = defineEmits(['update:modelValue', 'restore', 'delete'])

// State
const dialog = ref(false)
const restoreDialog = ref(false)
const restoringVersion = ref(null)
const restoring = ref(false)
const deleteDialog = ref(false)
const deletingVersion = ref(null)
const deleting = ref(false)

// Computed
const latestVersion = computed(() => {
  return Math.max(...props.versions.map(v => v.version || 1), 0)
})

// Watch for external changes
watch(() => props.modelValue, (val) => {
  dialog.value = val
})

watch(dialog, (val) => {
  emit('update:modelValue', val)
})

// Methods
function close() {
  dialog.value = false
}

function restoreVersion(version) {
  restoringVersion.value = version
  restoreDialog.value = true
}

async function confirmRestore() {
  if (!restoringVersion.value) return
  
  restoring.value = true
  
  try {
    await emit('restore', restoringVersion.value)
    restoreDialog.value = false
    restoringVersion.value = null
  } finally {
    restoring.value = false
  }
}

function deleteVersion(version) {
  deletingVersion.value = version
  deleteDialog.value = true
}

async function confirmDelete() {
  if (!deletingVersion.value) return
  
  deleting.value = true
  
  try {
    await emit('delete', deletingVersion.value.id)
    deleteDialog.value = false
    deletingVersion.value = null
  } finally {
    deleting.value = false
  }
}
</script>