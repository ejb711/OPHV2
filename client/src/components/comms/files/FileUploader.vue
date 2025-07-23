<!-- client/src/components/comms/files/FileUploader.vue -->
<template>
  <v-card>
    <v-card-title>
      <v-icon class="mr-2">mdi-cloud-upload</v-icon>
      Upload Files
    </v-card-title>
    
    <v-card-text>
      <!-- Drop zone -->
      <v-sheet
        :class="[
          'pa-8 text-center rounded-lg border-dashed',
          dragover ? 'border-primary' : ''
        ]"
        :style="{
          border: '2px dashed',
          borderColor: dragover ? 'primary' : '#ccc',
          backgroundColor: dragover ? 'rgba(33, 150, 243, 0.05)' : 'transparent',
          transition: 'all 0.3s'
        }"
        @drop.prevent="handleDrop"
        @dragover.prevent="dragover = true"
        @dragleave.prevent="dragover = false"
      >
        <v-icon size="48" color="grey">mdi-cloud-upload-outline</v-icon>
        <p class="text-h6 mt-2">Drop files here or click to browse</p>
        <p class="text-caption text-grey">Maximum file size: 25MB</p>
        
        <input
          ref="fileInput"
          type="file"
          multiple
          :accept="acceptedTypes"
          style="display: none"
          @change="handleFileSelect"
        />
        
        <v-btn
          color="primary"
          variant="tonal"
          class="mt-4"
          prepend-icon="mdi-file-plus"
          @click="$refs.fileInput.click()"
        >
          Select Files
        </v-btn>
      </v-sheet>
      
      <!-- File preview list -->
      <div v-if="selectedFiles.length > 0" class="mt-4">
        <p class="text-subtitle-2 mb-2">Selected files:</p>
        
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
        <v-text-field
          v-model="uploadDescription"
          label="Description (optional)"
          placeholder="Add a description for these files"
          variant="outlined"
          density="compact"
          class="mt-3"
        />
        
        <!-- Tags -->
        <v-combobox
          v-model="uploadTags"
          label="Tags (optional)"
          placeholder="Add tags"
          variant="outlined"
          density="compact"
          chips
          closable-chips
          multiple
          class="mb-2"
        />
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
    // Check if already selected
    if (selectedFiles.value.some(f => f.name === file.name && f.size === file.size)) {
      return
    }
    
    // Validate file
    let error = null
    if (file.size > props.maxFileSize) {
      error = 'File exceeds 25MB limit'
    }
    
    selectedFiles.value.push({
      file,
      name: file.name,
      size: file.size,
      type: file.type,
      error
    })
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
  if (!validFiles.value.length) return
  
  uploading.value = true
  const results = []
  const errors = []
  
  for (const fileData of validFiles.value) {
    try {
      const metadata = {
        description: uploadDescription.value,
        tags: uploadTags.value
      }
      
      // Emit each file for parent to handle actual upload
      const result = await emit('uploaded', fileData.file, metadata)
      results.push(result)
    } catch (error) {
      errors.push({ file: fileData.name, error: error.message })
    }
  }
  
  uploading.value = false
  
  if (errors.length > 0) {
    emit('error', errors)
  }
  
  // Clear on success
  if (results.length > 0) {
    clearFiles()
  }
}

// Utility functions
function getFileIcon(type) {
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
  if (bytes === 0) return '0 Bytes'
  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}
</script>