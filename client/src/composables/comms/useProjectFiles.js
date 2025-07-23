// client/src/composables/comms/useProjectFiles.js
import { ref, computed } from 'vue'
import { 
  collection, 
  doc, 
  addDoc, 
  updateDoc, 
  deleteDoc,
  query, 
  where, 
  orderBy,
  onSnapshot,
  serverTimestamp,
  Timestamp
} from 'firebase/firestore'
import { 
  ref as storageRef,
  uploadBytes,
  getDownloadURL,
  deleteObject
} from 'firebase/storage'
import { db, storage } from '@/firebase'
import { useAuthStore } from '@/stores/auth'
import { useSnackbar } from '@/composables/useSnackbar'
import { useAudit } from '@/composables/useAudit'

export function useProjectFiles(projectId) {
  const authStore = useAuthStore()
  const { showError, showSuccess } = useSnackbar()
  const { logEvent } = useAudit()
  
  // State
  const files = ref([])
  const links = ref([])
  const loading = ref(false)
  const uploading = ref(false)
  const deleting = ref(false)
  
  // Listeners
  let filesUnsubscribe = null
  
  // Computed
  const currentUserId = computed(() => authStore.user?.uid || null)
  const currentUserEmail = computed(() => authStore.user?.email || '')
  
  const sortedFiles = computed(() => {
    return [...files.value].sort((a, b) => {
      // Sort by createdAt descending (newest first)
      const aTime = a.createdAt?.toMillis() || 0
      const bTime = b.createdAt?.toMillis() || 0
      return bTime - aTime
    })
  })
  
  const filesByVersion = computed(() => {
    // Group files by name to show versions
    const grouped = {}
    files.value.forEach(file => {
      if (!grouped[file.name]) {
        grouped[file.name] = []
      }
      grouped[file.name].push(file)
    })
    
    // Sort each group by version
    Object.keys(grouped).forEach(name => {
      grouped[name].sort((a, b) => (b.version || 0) - (a.version || 0))
    })
    
    return grouped
  })
  
  // Initialize
  async function initialize() {
    if (!projectId || filesUnsubscribe) return
    
    loading.value = true
    
    try {
      // Set up real-time listener for files
      const filesQuery = query(
        collection(db, 'comms_files'),
        where('projectId', '==', projectId),
        where('deleted', '==', false),
        orderBy('createdAt', 'desc')
      )
      
      filesUnsubscribe = onSnapshot(filesQuery, (snapshot) => {
        files.value = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }))
        loading.value = false
      }, (error) => {
        console.error('Error listening to files:', error)
        showError('Failed to load files')
        loading.value = false
      })
      
    } catch (error) {
      console.error('Error initializing files:', error)
      showError('Failed to initialize files')
      loading.value = false
    }
  }
  
  // Cleanup
  function cleanup() {
    if (filesUnsubscribe) {
      filesUnsubscribe()
      filesUnsubscribe = null
    }
    files.value = []
    links.value = []
  }
  
  // Upload file
  async function uploadFile(file, metadata = {}) {
    if (!projectId) return null
    
    uploading.value = true
    
    try {
      // Generate storage path
      const timestamp = Date.now()
      const fileName = `${timestamp}_${file.name}`
      const filePath = `comms/${projectId}/${fileName}`
      
      // Upload to Firebase Storage
      const fileRef = storageRef(storage, filePath)
      const snapshot = await uploadBytes(fileRef, file)
      const downloadURL = await getDownloadURL(snapshot.ref)
      
      // Check for existing versions
      const existingVersions = files.value.filter(f => 
        f.name === file.name && !f.deleted
      )
      const version = existingVersions.length + 1
      
      // Create file document
      const fileData = {
        projectId,
        name: file.name,
        originalName: file.name,
        displayName: metadata.displayName || file.name,
        description: metadata.description || '',
        size: file.size,
        type: file.type,
        storagePath: filePath,
        downloadURL,
        version,
        tags: metadata.tags || [],
        deleted: false,
        createdAt: serverTimestamp(),
        createdBy: currentUserId.value,
        createdByEmail: currentUserEmail.value,
        updatedAt: serverTimestamp()
      }
      
      const docRef = await addDoc(collection(db, 'comms_files'), fileData)
      
      // Log the action
      await logEvent('upload_comms_file', {
        projectId,
        fileId: docRef.id,
        fileName: file.name,
        fileSize: file.size,
        version
      })
      
      showSuccess(`File uploaded successfully${version > 1 ? ` (v${version})` : ''}`)
      
      return { id: docRef.id, ...fileData }
      
    } catch (error) {
      console.error('Error uploading file:', error)
      showError(error.message || 'Failed to upload file')
      throw error
    } finally {
      uploading.value = false
    }
  }
  
  // Add external link
  async function addExternalLink(linkData) {
    if (!projectId) return null
    
    try {
      const link = {
        projectId,
        type: 'external_link',
        name: linkData.title,
        displayName: linkData.title,
        description: linkData.description || '',
        url: linkData.url,
        deleted: false,
        createdAt: serverTimestamp(),
        createdBy: currentUserId.value,
        createdByEmail: currentUserEmail.value
      }
      
      const docRef = await addDoc(collection(db, 'comms_files'), link)
      
      await logEvent('add_comms_link', {
        projectId,
        linkId: docRef.id,
        linkTitle: linkData.title
      })
      
      showSuccess('Link added successfully')
      
      return { id: docRef.id, ...link }
      
    } catch (error) {
      console.error('Error adding link:', error)
      showError('Failed to add link')
      throw error
    }
  }
  
  // Update file/link metadata - This is the key fix!
  async function updateFile(fileId, updates) {
    if (!fileId) return
    
    try {
      const updateData = {
        ...updates,
        updatedAt: serverTimestamp()
      }
      
      await updateDoc(doc(db, 'comms_files', fileId), updateData)
      
      await logEvent('update_comms_file', {
        projectId,
        fileId,
        updates: Object.keys(updates)
      })
      
      showSuccess('File updated successfully')
      
    } catch (error) {
      console.error('Error updating file:', error)
      showError('Failed to update file')
      throw error
    }
  }
  
  // Delete file (soft delete)
  async function deleteFile(fileId) {
    if (!fileId) return
    
    deleting.value = true
    
    try {
      // Find the file
      const file = files.value.find(f => f.id === fileId)
      if (!file) throw new Error('File not found')
      
      // Soft delete in database
      await updateDoc(doc(db, 'comms_files', fileId), {
        deleted: true,
        deletedAt: serverTimestamp(),
        deletedBy: currentUserId.value
      })
      
      // Note: We keep the file in Storage for potential recovery
      // Add a scheduled function to clean up old deleted files if needed
      
      await logEvent('delete_comms_file', {
        projectId,
        fileId,
        fileName: file.name
      })
      
      showSuccess('File deleted successfully')
      
    } catch (error) {
      console.error('Error deleting file:', error)
      showError('Failed to delete file')
      throw error
    } finally {
      deleting.value = false
    }
  }
  
  // Hard delete file (permanent delete - for admin only)
  async function hardDeleteFile(fileId) {
    if (!fileId) return
    
    try {
      // Find the file
      const file = files.value.find(f => f.id === fileId)
      if (!file) throw new Error('File not found')
      
      // Delete from Storage if not an external link
      if (file.storagePath && file.type !== 'external_link') {
        try {
          const fileRef = storageRef(storage, file.storagePath)
          await deleteObject(fileRef)
        } catch (error) {
          console.warn('Failed to delete file from storage:', error)
          // Continue with database deletion even if storage deletion fails
        }
      }
      
      // Delete from database
      await deleteDoc(doc(db, 'comms_files', fileId))
      
      await logEvent('hard_delete_comms_file', {
        projectId,
        fileId,
        fileName: file.name
      })
      
      showSuccess('File permanently deleted')
      
    } catch (error) {
      console.error('Error permanently deleting file:', error)
      showError('Failed to permanently delete file')
      throw error
    }
  }
  
  // Download file
  function downloadFile(file) {
    if (!file.downloadURL) return
    
    // Create a temporary link and click it
    const link = document.createElement('a')
    link.href = file.downloadURL
    link.download = file.displayName || file.name
    link.target = '_blank'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    
    // Log the download
    logEvent('download_comms_file', {
      projectId,
      fileId: file.id,
      fileName: file.name
    })
  }
  
  // Get file icon based on type
  function getFileIcon(file) {
    if (file.type === 'external_link') return 'mdi-link-variant'
    
    const type = file.type || ''
    
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
  
  // Format file size
  function formatFileSize(bytes) {
    if (!bytes) return '0 B'
    
    const sizes = ['B', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(1024))
    
    return `${(bytes / Math.pow(1024, i)).toFixed(1)} ${sizes[i]}`
  }
  
  return {
    // State
    files,
    links,
    loading,
    uploading,
    deleting,
    
    // Computed
    sortedFiles,
    filesByVersion,
    
    // Methods
    initialize,
    cleanup,
    uploadFile,
    addExternalLink,
    updateFile,  // Fixed: This now correctly points to the function
    deleteFile,
    hardDeleteFile,
    downloadFile,
    
    // Utilities
    getFileIcon,
    formatFileSize
  }
}