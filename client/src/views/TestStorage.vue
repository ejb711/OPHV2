<template>
  <v-card class="ma-4">
    <v-card-title>
      <v-icon class="mr-2">mdi-bug</v-icon>
      Storage Upload Debugging
    </v-card-title>
    
    <v-card-text>
      <div class="mb-4">
        <h3 class="text-h6 mb-2">Configuration</h3>
        <v-chip class="mr-2" size="small" label>
          Project: {{ config.projectId }}
        </v-chip>
        <v-chip class="mr-2" size="small" label>
          Bucket: {{ config.storageBucket }}
        </v-chip>
        <v-chip size="small" label :color="isAuthenticated ? 'success' : 'error'">
          Auth: {{ isAuthenticated ? 'Logged In' : 'Not Authenticated' }}
        </v-chip>
      </div>

      <v-divider class="mb-4" />

      <!-- Test Options -->
      <div class="mb-4">
        <h3 class="text-h6 mb-3">Test Options</h3>
        
        <v-row>
          <v-col cols="12" md="6">
            <v-text-field
              v-model="testPath"
              label="Storage Path"
              hint="Path where file will be uploaded"
              persistent-hint
              density="compact"
            />
          </v-col>
          <v-col cols="12" md="6">
            <v-text-field
              v-model="testContent"
              label="Test Content"
              hint="Content to upload"
              persistent-hint
              density="compact"
            />
          </v-col>
        </v-row>
      </div>

      <v-divider class="mb-4" />

      <!-- Test Actions -->
      <div class="mb-4">
        <h3 class="text-h6 mb-3">Tests</h3>
        
        <v-btn 
          color="primary" 
          class="mr-2 mb-2"
          prepend-icon="mdi-text-box"
          @click="testTextUpload"
          :disabled="!isAuthenticated"
        >
          Test Text Upload
        </v-btn>
        
        <v-btn 
          color="secondary" 
          class="mr-2 mb-2"
          prepend-icon="mdi-file"
          @click="$refs.fileInput.click()"
          :disabled="!isAuthenticated"
        >
          Test File Upload
        </v-btn>
        
        <v-btn 
          color="info" 
          class="mr-2 mb-2"
          prepend-icon="mdi-download"
          @click="testDownload"
          :disabled="!lastUploadURL"
        >
          Test Download
        </v-btn>
        
        <v-btn 
          color="warning" 
          class="mb-2"
          prepend-icon="mdi-delete"
          @click="testDelete"
          :disabled="!lastUploadPath"
        >
          Test Delete
        </v-btn>
        
        <input
          ref="fileInput"
          type="file"
          style="display: none"
          @change="handleFileSelect"
        />
      </div>

      <v-divider class="mb-4" />

      <!-- Results -->
      <div>
        <h3 class="text-h6 mb-3">Results</h3>
        
        <v-expansion-panels v-model="resultPanels">
          <v-expansion-panel
            v-for="(result, index) in results"
            :key="index"
            :color="result.type === 'error' ? 'error' : result.type === 'success' ? 'success' : 'info'"
          >
            <v-expansion-panel-title>
              <v-icon class="mr-2">
                {{ result.type === 'error' ? 'mdi-alert-circle' : 
                   result.type === 'success' ? 'mdi-check-circle' : 'mdi-information' }}
              </v-icon>
              {{ result.title }}
              <v-spacer />
              <span class="text-caption">{{ formatTime(result.timestamp) }}</span>
            </v-expansion-panel-title>
            <v-expansion-panel-text>
              <pre class="text-caption">{{ result.details }}</pre>
              <div v-if="result.url" class="mt-2">
                <v-chip 
                  size="small" 
                  label 
                  color="primary"
                  @click="copyToClipboard(result.url)"
                >
                  <v-icon start size="small">mdi-content-copy</v-icon>
                  Copy URL
                </v-chip>
              </div>
            </v-expansion-panel-text>
          </v-expansion-panel>
        </v-expansion-panels>
      </div>
    </v-card-text>
    
    <v-snackbar v-model="snackbar" :timeout="2000">
      {{ snackbarText }}
    </v-snackbar>
  </v-card>
</template>

<script setup>
import { ref, computed } from 'vue'
import { storage, auth } from '@/firebase'
import { 
  ref as storageRef, 
  uploadString, 
  uploadBytes,
  getDownloadURL, 
  deleteObject,
  getMetadata 
} from 'firebase/storage'
import { useAuthStore } from '@/stores/auth'

// Store
const authStore = useAuthStore()

// State
const results = ref([])
const resultPanels = ref([])
const testPath = ref('test/test-file.txt')
const testContent = ref(`Test upload at ${new Date().toISOString()}`)
const lastUploadURL = ref('')
const lastUploadPath = ref('')
const snackbar = ref(false)
const snackbarText = ref('')
const fileInput = ref(null)

// Firebase config for display
const config = {
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET
}

// Computed
const isAuthenticated = computed(() => authStore.isAuthenticated)

// Methods
function addResult(type, title, details, url = null) {
  const result = {
    type,
    title,
    details,
    url,
    timestamp: new Date()
  }
  results.value.unshift(result)
  // Auto-expand latest result
  resultPanels.value = [0]
}

async function testTextUpload() {
  try {
    addResult('info', 'Starting Text Upload', `Path: ${testPath.value}\nContent: ${testContent.value}`)
    
    const fileRef = storageRef(storage, testPath.value)
    
    // Upload with metadata
    const metadata = {
      contentType: 'text/plain',
      customMetadata: {
        uploadedBy: authStore.currentUser?.email || authStore.user?.email || 'unknown',
        uploadedAt: new Date().toISOString(),
        testUpload: 'true'
      }
    }
    
    const snapshot = await uploadString(fileRef, testContent.value, 'raw', metadata)
    
    // Get download URL
    const url = await getDownloadURL(snapshot.ref)
    lastUploadURL.value = url
    lastUploadPath.value = testPath.value
    
    // Get metadata to verify
    const uploadedMetadata = await getMetadata(snapshot.ref)
    
    addResult(
      'success', 
      'Text Upload Successful',
      JSON.stringify({
        path: snapshot.ref.fullPath,
        bucket: snapshot.ref.bucket,
        size: uploadedMetadata.size,
        contentType: uploadedMetadata.contentType,
        timeCreated: uploadedMetadata.timeCreated,
        customMetadata: uploadedMetadata.customMetadata
      }, null, 2),
      url
    )
    
  } catch (error) {
    addResult(
      'error',
      'Text Upload Failed',
      JSON.stringify({
        code: error.code,
        message: error.message,
        serverResponse: error.serverResponse,
        customData: error.customData
      }, null, 2)
    )
  }
}

async function handleFileSelect(event) {
  const file = event.target.files[0]
  if (!file) return
  
  try {
    const filePath = `test/${Date.now()}_${file.name}`
    addResult('info', 'Starting File Upload', `File: ${file.name}\nSize: ${file.size} bytes\nType: ${file.type}\nPath: ${filePath}`)
    
    const fileRef = storageRef(storage, filePath)
    
    // Upload file
    const snapshot = await uploadBytes(fileRef, file, {
      contentType: file.type,
      customMetadata: {
        originalName: file.name,
        uploadedBy: authStore.currentUser?.email || authStore.user?.email || 'unknown',
        uploadedAt: new Date().toISOString()
      }
    })
    
    // Get download URL
    const url = await getDownloadURL(snapshot.ref)
    lastUploadURL.value = url
    lastUploadPath.value = filePath
    
    addResult(
      'success',
      'File Upload Successful',
      JSON.stringify({
        path: snapshot.ref.fullPath,
        size: file.size,
        type: file.type
      }, null, 2),
      url
    )
    
  } catch (error) {
    addResult(
      'error',
      'File Upload Failed',
      JSON.stringify({
        code: error.code,
        message: error.message,
        file: file.name
      }, null, 2)
    )
  }
  
  // Reset input
  event.target.value = ''
}

async function testDownload() {
  if (!lastUploadURL.value) return
  
  try {
    addResult('info', 'Testing Download', `URL: ${lastUploadURL.value}`)
    
    // Try to fetch the file
    const response = await fetch(lastUploadURL.value)
    const text = await response.text()
    
    addResult(
      'success',
      'Download Successful',
      `Status: ${response.status}\nContent Preview: ${text.substring(0, 200)}...`
    )
    
  } catch (error) {
    addResult(
      'error',
      'Download Failed',
      error.message
    )
  }
}

async function testDelete() {
  if (!lastUploadPath.value) return
  
  try {
    addResult('info', 'Testing Delete', `Path: ${lastUploadPath.value}`)
    
    const fileRef = storageRef(storage, lastUploadPath.value)
    await deleteObject(fileRef)
    
    addResult(
      'success',
      'Delete Successful',
      `File deleted: ${lastUploadPath.value}`
    )
    
    lastUploadPath.value = ''
    lastUploadURL.value = ''
    
  } catch (error) {
    addResult(
      'error',
      'Delete Failed',
      JSON.stringify({
        code: error.code,
        message: error.message
      }, null, 2)
    )
  }
}

function copyToClipboard(text) {
  navigator.clipboard.writeText(text)
  snackbarText.value = 'URL copied to clipboard'
  snackbar.value = true
}

function formatTime(date) {
  return date.toLocaleTimeString()
}
</script>