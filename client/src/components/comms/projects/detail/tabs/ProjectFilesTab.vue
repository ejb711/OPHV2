<!-- client/src/components/comms/projects/detail/tabs/ProjectFilesTab.vue -->
<template>
  <v-container fluid class="pa-0">
    <!-- File Upload Section -->
    <div v-if="canEdit" class="mb-4">
      <FileUploader
        :project-id="projectId"
        @uploaded="handleFileUploaded"
        @error="handleUploadError"
      />
    </div>
    
    <!-- Single Column Layout for Better Responsiveness -->
    <div class="files-layout">
      <!-- Project Files Section -->
      <div class="mb-4">
        <FileList
          :files="projectFiles"
          :loading="filesLoading"
          :can-edit="canEdit"
          @edit="handleFileEdit"
          @delete="handleFileDelete"
          @show-versions="handleShowVersions"
        />
      </div>
      
      <!-- External Links Section -->
      <div v-if="hasLinks || canEdit">
        <LinkManager
          :links="projectLinks"
          :can-edit="canEdit"
          @add="handleAddLink"
          @edit="handleLinkEdit"
          @delete="handleLinkDelete"
        />
      </div>
    </div>
    
    <!-- Version History Dialog -->
    <VersionHistory
      v-model="showVersionDialog"
      :file-name="selectedFileName"
      :versions="selectedVersions"
      :can-restore="canEdit"
      :can-delete="canDeleteFiles"
      @restore="handleRestoreVersion"
      @delete="handleDeleteVersion"
    />
    
    <!-- Upload Error Snackbar -->
    <v-snackbar
      v-model="errorSnackbar"
      color="error"
      :timeout="5000"
    >
      {{ errorMessage }}
      <template v-slot:actions>
        <v-btn
          variant="text"
          @click="errorSnackbar = false"
        >
          Close
        </v-btn>
      </template>
    </v-snackbar>
  </v-container>
</template>

<script setup>
import { ref, computed, watch, onUnmounted } from 'vue'
import { useProjectFiles } from '@/composables/comms/useProjectFiles'
import { usePermissions } from '@/composables/usePermissions'
import FileUploader from '../../../files/FileUploader.vue'
import FileList from '../../../files/FileList.vue'
import LinkManager from '../../../files/LinkManager.vue'
import VersionHistory from '../../../files/VersionHistory.vue'

// Props
const props = defineProps({
  projectId: {
    type: String,
    required: true
  },
  canEdit: {
    type: Boolean,
    default: false
  }
})

// Composables
const { hasPermission } = usePermissions()
const { 
  files,
  loading: filesLoading,
  filesByVersion,
  initialize: initializeFiles,
  cleanup: cleanupFiles,
  uploadFile,
  addExternalLink,
  updateFile,
  deleteFile,
  hardDeleteFile
} = useProjectFiles(props.projectId)

// State
const showVersionDialog = ref(false)
const selectedFileName = ref('')
const selectedVersions = ref([])
const errorSnackbar = ref(false)
const errorMessage = ref('')

// Computed
const projectFiles = computed(() => files.value.filter(f => f.type !== 'external_link'))
const projectLinks = computed(() => files.value.filter(f => f.type === 'external_link'))
const hasLinks = computed(() => projectLinks.value.length > 0)
const canDeleteFiles = computed(() => hasPermission('delete_comms_projects'))

// Initialize on mount
initializeFiles()

// File handling methods
async function handleFileUploaded(file, metadata) {
  try {
    await uploadFile(file, metadata)
  } catch (error) {
    console.error('Upload error:', error)
    throw error
  }
}

function handleUploadError(errors) {
  const errorList = errors.map(e => `${e.file}: ${e.error}`).join(', ')
  errorMessage.value = `Upload failed: ${errorList}`
  errorSnackbar.value = true
}

async function handleFileEdit(fileId, updates) {
  try {
    await updateFile(fileId, updates)
  } catch (error) {
    errorMessage.value = 'Failed to update file'
    errorSnackbar.value = true
  }
}

async function handleFileDelete(fileId) {
  try {
    await deleteFile(fileId)
  } catch (error) {
    errorMessage.value = 'Failed to delete file'
    errorSnackbar.value = true
  }
}

async function handleAddLink(linkData) {
  try {
    await addExternalLink(linkData)
  } catch (error) {
    errorMessage.value = 'Failed to add link'
    errorSnackbar.value = true
  }
}

async function handleLinkEdit(linkId, updates) {
  try {
    await updateFile(linkId, updates)
  } catch (error) {
    errorMessage.value = 'Failed to update link'
    errorSnackbar.value = true
  }
}

async function handleLinkDelete(linkId) {
  try {
    await deleteFile(linkId)
  } catch (error) {
    errorMessage.value = 'Failed to delete link'
    errorSnackbar.value = true
  }
}

function handleShowVersions(fileName) {
  selectedFileName.value = fileName
  selectedVersions.value = filesByVersion.value[fileName] || []
  showVersionDialog.value = true
}

async function handleRestoreVersion(version) {
  try {
    const response = await fetch(version.downloadURL)
    const blob = await response.blob()
    const file = new File([blob], version.originalName, { type: version.type })
    
    await uploadFile(file, {
      description: `Restored from version ${version.version}`,
      tags: version.tags || []
    })
    
    showVersionDialog.value = false
  } catch (error) {
    console.error('Failed to restore version:', error)
    errorMessage.value = 'Failed to restore version'
    errorSnackbar.value = true
  }
}

async function handleDeleteVersion(versionId) {
  try {
    await hardDeleteFile(versionId)
    
    // Refresh versions
    const versions = filesByVersion.value[selectedFileName.value] || []
    selectedVersions.value = versions.filter(v => v.id !== versionId)
    
    if (selectedVersions.value.length === 0) {
      showVersionDialog.value = false
    }
  } catch (error) {
    errorMessage.value = 'Failed to delete version'
    errorSnackbar.value = true
  }
}

// Cleanup on unmount
onUnmounted(() => {
  cleanupFiles()
})
</script>

<style scoped>
.files-layout {
  max-width: 100%;
  overflow-x: hidden;
}

/* Ensure cards don't cause horizontal scroll */
:deep(.v-card) {
  max-width: 100%;
  overflow-wrap: break-word;
}

/* Prevent long file names from breaking layout */
:deep(.v-list-item-title) {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

/* Ensure form fields in LinkManager don't overflow */
:deep(.v-text-field),
:deep(.v-textarea) {
  max-width: 100%;
}
</style>