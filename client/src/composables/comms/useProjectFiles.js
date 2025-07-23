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
import { db, storage } from '@/firebase/config'
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
    
    // Sort versions within each group
    Object.keys(grouped).forEach(name => {
      grouped[name].sort((a, b) => {
        return (b.version || 1) - (a.version || 1)
      })
    })
    
    return grouped
  })
  
  // Initialize
  async function initialize() {
    if (!projectId) return
    
    loading.value = true
    
    try {
      // Subscribe to files
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
      })
      
    } catch (error) {
      console.error('Error initializing files:', error)
      showError('Failed to load files')
    } finally {
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
    if (!projectId || !file) return null
    
    uploading.value = true
    
    try {
      // Check file size (25MB limit)
      const maxSize = 25 * 1024 * 1024 // 25MB
      if (file.size > maxSize) {
        throw new Error('File size exceeds 25MB limit')
      }
      
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
  
  // Update file/link metadata
  async function updateFile(fileId, updates) {
    try {
      const updateData = {
        ...updates,
        updatedAt: serverTimestamp(),
        updatedBy: currentUserId.value,
        updatedByEmail: currentUserEmail.value
      }
      
      await updateDoc(doc(db, 'comms_files', fileId), updateData)
      
      await logEvent('update_comms_file', {
        projectId,
        fileId,
        updates: Object.keys(updates)
      })
      
      showSuccess('Updated successfully')
      
    } catch (error) {
      console.error('Error updating file:', error)
      showError('Failed to update')
      throw error
    }
  }
  
  // Delete file (soft delete)
  async function deleteFile(fileId) {
    deleting.value = true
    
    try {
      await updateDoc(doc(db, 'comms_files', fileId), {
        deleted: true,
        deletedAt: serverTimestamp(),
        deletedBy: currentUserId.value
      })
      
      await logEvent('delete_comms_file', {
        projectId,
        fileId
      })
      
      showSuccess('File deleted')
      
    } catch (error) {
      console.error('Error deleting file:', error)
      showError('Failed to delete file')
      throw error
    } finally {
      deleting.value = false
    }
  }
  
  // Permanently delete file (including storage)
  async function hardDeleteFile(fileId) {
    const file = files.value.find(f => f.id === fileId)
    if (!file) return
    
    deleting.value = true
    
    try {
      // Delete from storage if it's a file (not a link)
      if (file.storagePath && file.type !== 'external_link') {
        const fileRef = storageRef(storage, file.storagePath)
        await deleteObject(fileRef)
      }
      
      // Delete document
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
    } finally {
      deleting.value = false
    }
  }
  
  return {
    // State
    files,
    links: computed(() => files.value.filter(f => f.type === 'external_link')),
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
    updateFile,
    deleteFile,
    hardDeleteFile
  }
}