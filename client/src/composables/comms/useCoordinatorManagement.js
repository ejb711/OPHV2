// client/src/composables/comms/useCoordinatorManagement.js
import { ref, computed } from 'vue'
import { 
  collection, 
  doc, 
  getDocs, 
  getDoc,
  setDoc, 
  updateDoc, 
  deleteDoc, 
  query, 
  orderBy,
  serverTimestamp 
} from 'firebase/firestore'
import { db } from '@/firebase'
import { useAuthStore } from '@/stores/auth'
import { useAudit } from '@/composables/useAudit'

export function useCoordinatorManagement() {
  // State
  const coordinators = ref([])
  const loading = ref(false)
  const error = ref(null)
  
  // Composables
  const authStore = useAuthStore()
  const { logEvent } = useAudit()

  // Fetch all coordinators
  async function fetchCoordinators() {
    loading.value = true
    error.value = null
    
    try {
      const coordinatorsQuery = query(
        collection(db, 'comms_coordinators'),
        orderBy('displayName')
      )
      
      const snapshot = await getDocs(coordinatorsQuery)
      console.log(`📊 Fetched ${snapshot.size} coordinators`)
      
      coordinators.value = snapshot.docs.map(doc => {
        const data = doc.data()
        console.log(`👤 Coordinator ${doc.id}:`, {
          displayName: data.displayName,
          name: data.name,
          email: data.email
        })
        return {
          id: doc.id,
          ...data
        }
      })
    } catch (err) {
      console.error('Error fetching coordinators:', err)
      // Try without orderBy if index doesn't exist
      try {
        const snapshot = await getDocs(collection(db, 'comms_coordinators'))
        coordinators.value = snapshot.docs
          .map(doc => {
            const data = doc.data()
            console.log(`👤 Coordinator ${doc.id}:`, {
              displayName: data.displayName,
              name: data.name,
              email: data.email
            })
            return {
              id: doc.id,
              ...data
            }
          })
          .sort((a, b) => {
            const nameA = (a.displayName || a.name || a.email || '').toLowerCase()
            const nameB = (b.displayName || b.name || b.email || '').toLowerCase()
            return nameA.localeCompare(nameB)
          })
      } catch (fallbackErr) {
        error.value = fallbackErr.message
        coordinators.value = []
      }
    } finally {
      loading.value = false
    }
  }

  // Get single coordinator
  async function getCoordinator(coordinatorId) {
    try {
      const docRef = doc(db, 'comms_coordinators', coordinatorId)
      const docSnap = await getDoc(docRef)
      
      if (docSnap.exists()) {
        return { id: docSnap.id, ...docSnap.data() }
      }
      return null
    } catch (err) {
      console.error('Error fetching coordinator:', err)
      throw err
    }
  }

  // Create new coordinator
  async function createCoordinator(coordinatorData) {
    try {
      // Ensure we have proper display name
      const displayName = coordinatorData.displayName || coordinatorData.name || coordinatorData.email
      
      const newCoordinator = {
        userId: coordinatorData.userId,
        email: coordinatorData.email,
        userEmail: coordinatorData.email, // For backward compatibility
        displayName: displayName,
        name: displayName, // Keep name field in sync
        userName: displayName, // For backward compatibility
        regions: coordinatorData.regions || [],
        primaryRegion: coordinatorData.primaryRegion || null,
        isActive: true,
        createdAt: serverTimestamp(),
        createdBy: authStore.currentUser?.uid || 'system',
        updatedAt: serverTimestamp(),
        updatedBy: authStore.currentUser?.uid || 'system'
      }
      
      // Use userId as document ID for consistency
      const docRef = doc(db, 'comms_coordinators', coordinatorData.userId)
      await setDoc(docRef, newCoordinator)
      
      // Log audit event
      await logEvent('coordinator_created', {
        coordinatorId: coordinatorData.userId,
        coordinatorName: displayName,
        regions: coordinatorData.regions
      })
      
      // Refresh coordinators list
      await fetchCoordinators()
      
      return { id: coordinatorData.userId, ...newCoordinator }
    } catch (err) {
      console.error('Error creating coordinator:', err)
      throw err
    }
  }

  // Update coordinator
  async function updateCoordinator(coordinatorId, updates) {
    try {
      const docRef = doc(db, 'comms_coordinators', coordinatorId)
      
      // Ensure display name consistency
      const updateData = {
        ...updates,
        updatedAt: serverTimestamp(),
        updatedBy: authStore.currentUser?.uid || 'system'
      }
      
      // If displayName is updated, sync other name fields
      if (updates.displayName) {
        updateData.name = updates.displayName
        updateData.userName = updates.displayName
      }
      
      await updateDoc(docRef, updateData)
      
      // Log audit event
      await logEvent('coordinator_updated', {
        coordinatorId,
        updates: Object.keys(updates),
        regions: updates.regions
      })
      
      // Refresh coordinators list
      await fetchCoordinators()
    } catch (err) {
      console.error('Error updating coordinator:', err)
      throw err
    }
  }

  // Delete coordinator
  async function deleteCoordinator(coordinatorId) {
    try {
      const docRef = doc(db, 'comms_coordinators', coordinatorId)
      
      // Get coordinator data before deletion for audit
      const coordinator = await getCoordinator(coordinatorId)
      
      await deleteDoc(docRef)
      
      // Log audit event
      await logEvent('coordinator_deleted', {
        coordinatorId,
        coordinatorName: coordinator?.displayName || coordinator?.name,
        regions: coordinator?.regions
      })
      
      // Refresh coordinators list
      await fetchCoordinators()
    } catch (err) {
      console.error('Error deleting coordinator:', err)
      throw err
    }
  }

  // Check if user is a coordinator
  function isUserCoordinator(userId) {
    return coordinators.value.some(c => c.userId === userId)
  }

  // Get coordinator by user ID
  function getCoordinatorByUserId(userId) {
    return coordinators.value.find(c => c.userId === userId)
  }

  // Get coordinators for a specific region
  function getCoordinatorsForRegion(regionId) {
    return coordinators.value.filter(c => c.regions && c.regions.includes(regionId))
  }

  // Get primary coordinator for a region
  function getPrimaryCoordinatorForRegion(regionId) {
    return coordinators.value.find(c => c.primaryRegion === regionId)
  }

  return {
    // State
    coordinators: computed(() => coordinators.value),
    loading: computed(() => loading.value),
    error: computed(() => error.value),
    
    // Methods
    fetchCoordinators,
    getCoordinator,
    createCoordinator,
    updateCoordinator,
    deleteCoordinator,
    
    // Utility methods
    isUserCoordinator,
    getCoordinatorByUserId,
    getCoordinatorsForRegion,
    getPrimaryCoordinatorForRegion
  }
}