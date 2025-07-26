// client/src/composables/comms/useProjectForum.js
import { ref, computed } from 'vue'
import { 
  collection, 
  doc, 
  query, 
  where, 
  orderBy, 
  onSnapshot, 
  addDoc, 
  updateDoc, 
  deleteDoc,
  serverTimestamp,
  Timestamp 
} from 'firebase/firestore'
import { db } from '@/firebase'
import { useAuthStore } from '@/stores/auth'

export function useProjectForum(projectId) {
  const authStore = useAuthStore()
  const messages = ref([])
  const loading = ref(false)
  const error = ref(null)
  const sendingMessage = ref(false)
  
  let unsubscribe = null
  
  // Computed properties
  const sortedMessages = computed(() => {
    return [...messages.value].sort((a, b) => {
      const dateA = a.createdAt?.toDate?.() || new Date(0)
      const dateB = b.createdAt?.toDate?.() || new Date(0)
      return dateA - dateB
    })
  })
  
  const visibleMessages = computed(() => {
    return sortedMessages.value.filter(msg => !msg.deleted)
  })
  
  // Watch messages for a specific project
  const watchMessages = () => {
    if (!projectId.value) return
    
    loading.value = true
    error.value = null
    
    try {
      const q = query(
        collection(db, 'comms_messages'),
        where('projectId', '==', projectId.value),
        orderBy('createdAt', 'asc')
      )
      
      unsubscribe = onSnapshot(q, 
        (snapshot) => {
          messages.value = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
          }))
          loading.value = false
        },
        (err) => {
          console.error('Error watching messages:', err)
          error.value = err.message
          loading.value = false
        }
      )
    } catch (err) {
      console.error('Error setting up message watcher:', err)
      error.value = err.message
      loading.value = false
    }
  }
  
  // Stop watching messages
  const stopWatching = () => {
    if (unsubscribe) {
      unsubscribe()
      unsubscribe = null
    }
  }
  
  // Send a new message
  const sendMessage = async (content) => {
    if (!content?.trim() || !projectId.value) return
    
    // Check if user is authenticated
    if (!authStore.user) {
      error.value = 'You must be logged in to send messages'
      return false
    }
    
    sendingMessage.value = true
    error.value = null
    
    try {
      const messageData = {
        projectId: projectId.value,
        content: content.trim(),
        authorId: authStore.user.uid,
        authorName: authStore.user.displayName || authStore.user.email,
        authorEmail: authStore.user.email,
        createdAt: serverTimestamp(),
        editedAt: null,
        deleted: false
      }
      
      await addDoc(collection(db, 'comms_messages'), messageData)
      
      // Update project's updatedAt timestamp
      const projectRef = doc(db, 'comms_projects', projectId.value)
      await updateDoc(projectRef, {
        updatedAt: serverTimestamp()
      })
      
      return true
    } catch (err) {
      console.error('Error sending message:', err)
      error.value = err.message
      return false
    } finally {
      sendingMessage.value = false
    }
  }
  
  // Edit a message
  const editMessage = async (messageId, newContent) => {
    if (!newContent?.trim() || !messageId) return
    
    error.value = null
    
    try {
      const messageRef = doc(db, 'comms_messages', messageId)
      await updateDoc(messageRef, {
        content: newContent.trim(),
        editedAt: serverTimestamp()
      })
      return true
    } catch (err) {
      console.error('Error editing message:', err)
      error.value = err.message
      return false
    }
  }
  
  // Delete a message (soft delete)
  const deleteMessage = async (messageId) => {
    if (!messageId) return
    
    error.value = null
    
    try {
      const messageRef = doc(db, 'comms_messages', messageId)
      await updateDoc(messageRef, {
        deleted: true
      })
      return true
    } catch (err) {
      console.error('Error deleting message:', err)
      error.value = err.message
      return false
    }
  }
  
  // Hard delete a message (admin only)
  const hardDeleteMessage = async (messageId) => {
    if (!messageId) return
    
    error.value = null
    
    try {
      await deleteDoc(doc(db, 'comms_messages', messageId))
      return true
    } catch (err) {
      console.error('Error hard deleting message:', err)
      error.value = err.message
      return false
    }
  }
  
  // Check if user can edit a message
  const canEditMessage = (message) => {
    if (!message || !authStore.user) return false
    return message.authorId === authStore.user.uid
  }
  
  // Check if user can delete a message
  const canDeleteMessage = (message) => {
    if (!message || !authStore.user) return false
    return message.authorId === authStore.user.uid || 
           authStore.hasPermission('manage_comms')
  }
  
  // Format timestamp for display
  const formatTimestamp = (timestamp) => {
    if (!timestamp) return ''
    
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp)
    const now = new Date()
    const diff = now - date
    
    // Less than a minute
    if (diff < 60000) return 'Just now'
    
    // Less than an hour
    if (diff < 3600000) {
      const minutes = Math.floor(diff / 60000)
      return `${minutes} minute${minutes > 1 ? 's' : ''} ago`
    }
    
    // Less than a day
    if (diff < 86400000) {
      const hours = Math.floor(diff / 3600000)
      return `${hours} hour${hours > 1 ? 's' : ''} ago`
    }
    
    // Less than a week
    if (diff < 604800000) {
      const days = Math.floor(diff / 86400000)
      return `${days} day${days > 1 ? 's' : ''} ago`
    }
    
    // Format as date
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined
    })
  }
  
  return {
    // State
    messages,
    loading,
    error,
    sendingMessage,
    
    // Computed
    sortedMessages,
    visibleMessages,
    
    // Methods
    watchMessages,
    stopWatching,
    sendMessage,
    editMessage,
    deleteMessage,
    hardDeleteMessage,
    
    // Utilities
    canEditMessage,
    canDeleteMessage,
    formatTimestamp,
    
    // Allow clearing error from component
    clearError: () => { error.value = null }
  }
}