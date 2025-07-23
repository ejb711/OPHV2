<template>
  <v-card class="ma-4 pa-4">
    <v-card-title>Storage Test</v-card-title>
    <v-card-text>
      <v-btn color="primary" @click="testUpload">Test Simple Upload</v-btn>
      <div v-if="status" class="mt-4">
        <v-alert :type="status.type" dense>
          {{ status.message }}
        </v-alert>
      </div>
    </v-card-text>
  </v-card>
</template>

<script setup>
import { ref } from 'vue'
import { storage } from '@/firebase'
import { ref as storageRef, uploadString, getDownloadURL } from 'firebase/storage'
import { useAuthStore } from '@/stores/auth'

const authStore = useAuthStore()
const status = ref(null)

async function testUpload() {
  try {
    status.value = { type: 'info', message: 'Starting upload test...' }
    
    // Create a simple text file
    const testContent = `Test upload at ${new Date().toISOString()}`
    const testRef = storageRef(storage, `test/test-${Date.now()}.txt`)
    
    // Try to upload
    const snapshot = await uploadString(testRef, testContent)
    status.value = { type: 'info', message: 'Upload successful! Getting URL...' }
    
    // Get download URL
    const url = await getDownloadURL(snapshot.ref)
    status.value = { 
      type: 'success', 
      message: `Success! File uploaded to: ${url}` 
    }
    
  } catch (error) {
    console.error('Upload test failed:', error)
    status.value = { 
      type: 'error', 
      message: `Error: ${error.code} - ${error.message}` 
    }
  }
}
</script>