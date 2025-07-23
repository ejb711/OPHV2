<!-- client/src/components/comms/files/FileUploader.vue -->
<template>
  <v-card>
    <v-card-title>
      <v-icon class="mr-2">mdi-cloud-upload</v-icon>
      Upload Files
    </v-card-title>
    
    <v-card-text>
      <!-- Drop zone -->
      <div
        class="drop-zone"
        :class="{ 'drag-over': dragover }"
        @drop.prevent="handleDrop"
        @dragover.prevent="dragover = true"
        @dragleave.prevent="dragover = false"
      >
        <input
          ref="fileInput"
          type="file"
          multiple
          :accept="acceptedTypes"
          @change="handleFileSelect"
          style="display: none"
        />
        
        <v-icon size="48" color="grey">mdi-cloud-upload</v-icon>
        <div class="text-h6 mt-2">Drop files here or click to browse</div>
        <div class="text-caption text-grey">
          Maximum file size: {{ formatFileSize(maxFileSize) }}
        </div>
        
        <v-btn
          color="primary"
          variant="tonal"
          class="mt-4"
          @click="$refs.fileInput.click()"
        >
          <v-icon left>mdi-folder-open</v-icon>
          Select Files
        </v-btn>
      </div>
      
      <!-- Selected files list -->
      <div v-if="selectedFiles.length > 0" class="mt-4">
        <div class="text-subtitle-2 mb-2">
          Selected files:
        </div>
        
        <v-list density="compact">
          <v-list-item
            v-for="(file, index) in selectedFiles"
            :key="index"
            :class="{ 'error--text': file.error }"
          >
            <template v-slot:prepend>
              <v-icon :color="file.error ? 'error' : 'primary'">
                {{ getFileIcon(file.type) }}
              </v-icon>
            </template>
            
            <v-list-item-title>
              {{ file.name }}
            </v-list-item-title>
            
            <v-list-item-subtitle>
              {{ formatFileSize(file.size) }}
              <span v-if="file.error" class="error--text ml-2">
                {{ file.error }}
              </span>
            </v-list-item-subtitle>
            
            <template v-slot:append>
              <v-btn
                icon
                size="small"
                variant="text"
                @click="removeFile(index)"
              >
                <v-icon>mdi-close</v-icon>
              </v-btn>
            </template>
          </v-list-item>
        </v-list>
        
        <!-- Upload metadata -->
        <div class="mt-4">
          <div class="text-subtitle-2 mb-2">Add description (optional)</div>
          <v-textarea
            v-model="uploadDescription"
            placeholder="Add a description for these files"
            variant="outlined"
            density="compact"
            rows="2"
            hide-details
            class="mb-3"
          />
        </div>
        
        <!-- Tags -->
        <div>
          <div class="text-subtitle-2 mb-2">Tags (optional)</div>
          <v-combobox
            v-model="uploadTags"
            placeholder="Add tags"
            variant="outlined"
            density="compact"
            chips
            closable-chips
            multiple
            hide-details
          />
        </div>
      </div>
    </v-card-text>
    
    <v-card-actions v-if="selectedFiles.length > 0">
      <v-spacer />
      <v-btn
        variant="text"
        @click="clearFiles"
      >
        Clear
      </v-btn>
      <v-btn
        color="primary"
        variant="elevated"
        :loading="uploading"
        :disabled="!validFiles.length"
        @click="uploadFiles"
      >
        Upload {{ validFiles.length }} {{ validFiles.length === 1 ? 'File' : 'Files' }}
      </v-btn>
    </v-card-actions>
  </v-card>
</template>

<script setup>
import { ref, computed } from 'vue'

// Props & Emits
const props = defineProps({
  projectId: {
    type: String,
    required: true
  },
  acceptedTypes: {
    type: String,
    default: '*'
  },
  maxFileSize: {
    type: Number,
    default: 25 * 1024 * 1024 // 25MB
  }
})

const emit = defineEmits(['uploaded', 'error'])

// State
const dragover = ref(false)
const selectedFiles = ref([])
const uploading = ref(false)
const uploadDescription = ref('')
const uploadTags = ref([])
const fileInput = ref(null)

// Computed
const validFiles = computed(() => {
  return selectedFiles.value.filter(f => !f.error)
})

// Methods
function handleDrop(event) {
  dragover.value = false
  const files = Array.from(event.dataTransfer.files)
  processFiles(files)
}

function handleFileSelect(event) {
  const files = Array.from(event.target.files)
  processFiles(files)
  // Reset input so same file can be selected again
  event.target.value = ''
}

function processFiles(files) {
  files.forEach(file => {
    // Check file size
    if (file.size > props.maxFileSize) {
      selectedFiles.value.push({
        ...file,
        error: `File too large (max ${formatFileSize(props.maxFileSize)})`
      })
      return
    }
    
    // Check if file already selected
    if (selectedFiles.value.some(f => f.name === file.name && f.size === file.size)) {
      return
    }
    
    selectedFiles.value.push(file)
  })
}

function removeFile(index) {
  selectedFiles.value.splice(index, 1)
}

function clearFiles() {
  selectedFiles.value = []
  uploadDescription.value = ''
  uploadTags.value = []
}

async function uploadFiles() {
  uploading.value = true
  const errors = []
  
  for (const file of validFiles.value) {
    try {
      await emit('uploaded', file, {
        description: uploadDescription.value,
        tags: uploadTags.value
      })
    } catch (error) {
      console.error('Upload error:', error)
      errors.push({ file: file.name, error: error.message })
    }
  }
  
  uploading.value = false
  
  if (errors.length > 0) {
    emit('error', errors)
  } else {
    clearFiles()
  }
}

function getFileIcon(type) {
  if (!type) return 'mdi-file'
  
  if (type.includes('image')) return 'mdi-file-image'
  if (type.includes('pdf')) return 'mdi-file-pdf-box'
  if (type.includes('word') || type.includes('document')) return 'mdi-file-word'
  if (type.includes('excel') || type.includes('spreadsheet')) return 'mdi-file-excel'
  if (type.includes('powerpoint') || type.includes('presentation')) return 'mdi-file-powerpoint'
  if (type.includes('video')) return 'mdi-file-video'
  if (type.includes('audio')) return 'mdi-file-music'
  if (type.includes('zip') || type.includes('rar')) return 'mdi-folder-zip'
  if (type.includes('text')) return 'mdi-file-document'
  
  return 'mdi-file'
}

function formatFileSize(bytes) {
  if (!bytes) return '0 B'
  
  const sizes = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(1024))
  
  return `${(bytes / Math.pow(1024, i)).toFixed(1)} ${sizes[i]}`
}
</script>

<style scoped>
.drop-zone {
  border: 2px dashed #e0e0e0;
  border-radius: 8px;
  padding: 48px;
  text-align: center;
  transition: all 0.3s ease;
  cursor: pointer;
}

.drop-zone:hover {
  border-color: #1976d2;
  background-color: #f5f5f5;
}

.drop-zone.drag-over {
  border-color: #1976d2;
  background-color: #e3f2fd;
}

/* Fix for combobox chip spacing */
:deep(.v-combobox .v-field__input) {
  padding-top: 4px !important;
  padding-bottom: 4px !important;
}

:deep(.v-combobox .v-chip) {
  margin: 2px;
}
</style>