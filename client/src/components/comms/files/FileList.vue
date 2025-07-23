<!-- client/src/components/comms/files/FileList.vue -->
<template>
  <v-card>
    <v-card-title class="d-flex align-center">
      <v-icon class="mr-2">mdi-file-multiple</v-icon>
      Project Files
      <v-spacer />
      <v-chip v-if="files.length > 0" size="small" variant="tonal">
        {{ files.length }} {{ files.length === 1 ? 'file' : 'files' }}
      </v-chip>
    </v-card-title>
    
    <v-card-text v-if="loading" class="text-center py-8">
      <v-progress-circular indeterminate color="primary" />
      <p class="mt-2">Loading files...</p>
    </v-card-text>
    
    <v-card-text v-else-if="files.length === 0" class="text-center py-8">
      <v-icon size="48" color="grey">mdi-file-outline</v-icon>
      <p class="text-grey mt-2">No files uploaded yet</p>
    </v-card-text>
    
    <v-list v-else>
      <template v-for="(file, index) in sortedFiles" :key="file.id">
        <v-list-item
          :class="{ 'bg-grey-lighten-5': file.type === 'external_link' }"
        >
          <template v-slot:prepend>
            <v-avatar :color="file.type === 'external_link' ? 'blue' : 'primary'" variant="tonal">
              <v-icon>{{ getFileIcon(file) }}</v-icon>
            </v-avatar>
          </template>
          
          <v-list-item-title>
            {{ file.displayName || file.name }}
            <v-chip 
              v-if="file.version && file.version > 1" 
              size="x-small" 
              color="orange"
              class="ml-2"
            >
              v{{ file.version }}
            </v-chip>
          </v-list-item-title>
          
          <v-list-item-subtitle>
            <span v-if="file.type === 'external_link'">
              External Link
            </span>
            <span v-else>
              {{ formatFileSize(file.size) }} • 
              {{ formatDate(file.createdAt) }}
            </span>
            <span v-if="file.createdByEmail" class="ml-2">
              by {{ file.createdByEmail }}
            </span>
          </v-list-item-subtitle>
          
          <template v-if="file.description">
            <v-list-item-subtitle class="mt-1">
              {{ file.description }}
            </v-list-item-subtitle>
          </template>
          
          <template v-if="file.tags && file.tags.length > 0">
            <div class="mt-1">
              <v-chip
                v-for="tag in file.tags"
                :key="tag"
                size="x-small"
                variant="tonal"
                class="mr-1"
              >
                {{ tag }}
              </v-chip>
            </div>
          </template>
          
          <template v-slot:append>
            <div class="d-flex align-center">
              <!-- View/Download button -->
              <v-btn
                v-if="file.type === 'external_link'"
                icon
                size="small"
                variant="text"
                :href="file.url"
                target="_blank"
                @click.stop
              >
                <v-icon>mdi-open-in-new</v-icon>
                <v-tooltip activator="parent" location="top">Open link</v-tooltip>
              </v-btn>
              
              <v-btn
                v-else
                icon
                size="small"
                variant="text"
                :href="file.downloadURL"
                target="_blank"
                @click.stop
              >
                <v-icon>mdi-download</v-icon>
                <v-tooltip activator="parent" location="top">Download</v-tooltip>
              </v-btn>
              
              <!-- More actions -->
              <v-menu v-if="canEdit">
                <template v-slot:activator="{ props }">
                  <v-btn
                    icon
                    size="small"
                    variant="text"
                    v-bind="props"
                  >
                    <v-icon>mdi-dots-vertical</v-icon>
                  </v-btn>
                </template>
                
                <v-list density="compact">
                  <v-list-item @click="editFile(file)">
                    <template v-slot:prepend>
                      <v-icon>mdi-pencil</v-icon>
                    </template>
                    <v-list-item-title>Edit Details</v-list-item-title>
                  </v-list-item>
                  
                  <v-list-item 
                    v-if="file.version && file.version > 1"
                    @click="showVersions(file)"
                  >
                    <template v-slot:prepend>
                      <v-icon>mdi-history</v-icon>
                    </template>
                    <v-list-item-title>Version History</v-list-item-title>
                  </v-list-item>
                  
                  <v-divider />
                  
                  <v-list-item @click="deleteFile(file)" class="text-error">
                    <template v-slot:prepend>
                      <v-icon color="error">mdi-delete</v-icon>
                    </template>
                    <v-list-item-title>Delete</v-list-item-title>
                  </v-list-item>
                </v-list>
              </v-menu>
            </div>
          </template>
        </v-list-item>
        
        <v-divider v-if="index < sortedFiles.length - 1" />
      </template>
    </v-list>
    
    <!-- Edit Dialog -->
    <v-dialog v-model="editDialog" max-width="500">
      <v-card>
        <v-card-title>Edit File Details</v-card-title>
        
        <v-card-text v-if="editingFile">
          <v-text-field
            v-model="editingFile.displayName"
            label="Display Name"
            variant="outlined"
            density="compact"
          />
          
          <v-textarea
            v-model="editingFile.description"
            label="Description"
            variant="outlined"
            density="compact"
            rows="3"
          />
          
          <v-combobox
            v-model="editingFile.tags"
            label="Tags"
            variant="outlined"
            density="compact"
            chips
            closable-chips
            multiple
          />
        </v-card-text>
        
        <v-card-actions>
          <v-spacer />
          <v-btn variant="text" @click="editDialog = false">Cancel</v-btn>
          <v-btn 
            color="primary" 
            variant="elevated"
            :loading="saving"
            @click="saveFileEdit"
          >
            Save
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
    
    <!-- Delete Confirmation -->
    <v-dialog v-model="deleteDialog" max-width="400">
      <v-card>
        <v-card-title class="text-error">Delete File</v-card-title>
        
        <v-card-text>
          Are you sure you want to delete "{{ deletingFile?.displayName || deletingFile?.name }}"?
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
  </v-card>
</template>

<script setup>
import { ref, computed } from 'vue'
import { formatDistanceToNow } from 'date-fns'

// Props & Emits
const props = defineProps({
  files: {
    type: Array,
    default: () => []
  },
  loading: {
    type: Boolean,
    default: false
  },
  canEdit: {
    type: Boolean,
    default: false
  }
})

const emit = defineEmits(['edit', 'delete', 'show-versions'])

// State
const editDialog = ref(false)
const editingFile = ref(null)
const saving = ref(false)
const deleteDialog = ref(false)
const deletingFile = ref(null)
const deleting = ref(false)

// Computed
const sortedFiles = computed(() => {
  return [...props.files].sort((a, b) => {
    // Sort by createdAt descending (newest first)
    const aTime = a.createdAt?.toMillis ? a.createdAt.toMillis() : 0
    const bTime = b.createdAt?.toMillis ? b.createdAt.toMillis() : 0
    return bTime - aTime
  })
})

// Methods
function getFileIcon(file) {
  if (file.type === 'external_link') return 'mdi-link'
  const type = file.type || ''
  if (type.startsWith('image/')) return 'mdi-file-image'
  if (type.startsWith('video/')) return 'mdi-file-video'
  if (type.includes('pdf')) return 'mdi-file-pdf-box'
  if (type.includes('word') || type.includes('document')) return 'mdi-file-word'
  if (type.includes('excel') || type.includes('spreadsheet')) return 'mdi-file-excel'
  if (type.includes('powerpoint') || type.includes('presentation')) return 'mdi-file-powerpoint'
  if (type.includes('zip') || type.includes('compressed')) return 'mdi-folder-zip'
  return 'mdi-file-document'
}

function formatFileSize(bytes) {
  if (!bytes) return 'Unknown size'
  if (bytes === 0) return '0 Bytes'
  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

function formatDate(timestamp) {
  if (!timestamp) return 'Unknown date'
  
  try {
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp)
    return formatDistanceToNow(date, { addSuffix: true })
  } catch (error) {
    return 'Unknown date'
  }
}

function editFile(file) {
  editingFile.value = {
    id: file.id,
    displayName: file.displayName || file.name,
    description: file.description || '',
    tags: file.tags || []
  }
  editDialog.value = true
}

async function saveFileEdit() {
  if (!editingFile.value) return
  
  saving.value = true
  
  try {
    await emit('edit', editingFile.value.id, {
      displayName: editingFile.value.displayName,
      description: editingFile.value.description,
      tags: editingFile.value.tags
    })
    
    editDialog.value = false
    editingFile.value = null
  } finally {
    saving.value = false
  }
}

function deleteFile(file) {
  deletingFile.value = file
  deleteDialog.value = true
}

async function confirmDelete() {
  if (!deletingFile.value) return
  
  deleting.value = true
  
  try {
    await emit('delete', deletingFile.value.id)
    deleteDialog.value = false
    deletingFile.value = null
  } finally {
    deleting.value = false
  }
}

function showVersions(file) {
  emit('show-versions', file.name)
}
</script>