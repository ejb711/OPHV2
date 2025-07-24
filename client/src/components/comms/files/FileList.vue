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
        <FileListItem
          :file="file"
          :can-edit="canEdit"
          :file-version-groups="fileVersionGroups"
          @edit="editFile"
          @delete="deleteFile"
          @show-versions="handleShowVersions"
        />
        <v-divider v-if="index < sortedFiles.length - 1" />
      </template>
    </v-list>
    
    <!-- Edit Dialog -->
    <v-dialog v-model="editDialog" max-width="500">
      <v-card>
        <v-card-title>Edit File Details</v-card-title>
        
        <v-card-text>
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
            multiple
            chips
            closable-chips
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
    
    <!-- Delete Confirmation Dialog -->
    <v-dialog v-model="deleteDialog" max-width="400">
      <v-card>
        <v-card-title>Delete File</v-card-title>
        
        <v-card-text>
          Are you sure you want to delete "{{ deletingFile?.displayName || deletingFile?.name }}"?
          <br><br>
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
  </v-card>
</template>

<script setup>
import { ref, toRefs } from 'vue'
import FileListItem from './FileListItem.vue'
import { useFileDisplay } from '@/composables/comms/useFileDisplay'

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

// Composables
const { files } = toRefs(props)
const { sortedFiles, fileVersionGroups } = useFileDisplay(files)

// State
const editDialog = ref(false)
const editingFile = ref(null)
const saving = ref(false)
const deleteDialog = ref(false)
const deletingFile = ref(null)
const deleting = ref(false)

// Methods
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

function handleShowVersions(fileName) {
  emit('show-versions', fileName)
}
</script>