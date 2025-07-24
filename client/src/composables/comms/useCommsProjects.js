// client/src/composables/comms/useCommsProjects.js
import { ref, computed, watch } from 'vue'
import { 
  collection, 
  query, 
  where, 
  orderBy, 
  onSnapshot,
  doc,
  getDoc,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  serverTimestamp,
  Timestamp
} from 'firebase/firestore'
import { db } from '@/firebase'
import { useAuthStore } from '@/stores/auth'
import { usePermissions } from '@/composables/usePermissions'
import { useSnackbar } from '@/composables/useSnackbar'
import { useAudit } from '@/composables/useAudit'
import { useCommsProjectPermissions } from './commsProjectPermissions'

export function useCommsProjects() {
  // Store and composables
  const authStore = useAuthStore()
  const { 
    hasPermission, 
    canManageComms, 
    canViewAllRegions 
  } = usePermissions()
  const { showError, showSuccess } = useSnackbar()
  const { logEvent } = useAudit()
  
  // Import permission functions
  const { canViewProject, canEditProject, canDeleteProject } = useCommsProjectPermissions()

  // State
  const projects = ref([])
  const loading = ref(false)
  const creating = ref(false)
  const updating = ref(false)
  const deleting = ref(false)
  const error = ref(null)
  
  // Filters
  const filterRegion = ref(null)
  const filterStatus = ref(null)
  const filterPriority = ref(null)
  const filterCoordinator = ref(null)
  const filterSearch = ref('')
  const filterDeleted = ref(false)
  
  // Computed
  const currentUserId = computed(() => authStore.user?.uid || null)
  const currentUserEmail = computed(() => authStore.user?.email || null)
  
  const coordinatorRegions = computed(() => {
    // Get regions where current user is a coordinator
    // This would come from user's coordinator assignments
    return []
  })
  
  const filteredProjects = computed(() => {
    return projects.value.filter(project => {
      // Permission check
      if (!canViewProject(project)) return false
      
      // Region filter
      if (filterRegion.value && project.region !== filterRegion.value) return false
      
      // Status filter
      if (filterStatus.value && project.status !== filterStatus.value) return false
      
      // Priority filter
      if (filterPriority.value && project.priority !== filterPriority.value) return false
      
      // Coordinator filter
      if (filterCoordinator.value && project.coordinatorId !== filterCoordinator.value) return false
      
      // Search filter
      if (filterSearch.value) {
        const search = filterSearch.value.toLowerCase()
        const matchesTitle = project.title?.toLowerCase().includes(search)
        const matchesDescription = project.description?.toLowerCase().includes(search)
        const matchesTags = project.tags?.some(tag => tag.toLowerCase().includes(search))
        
        if (!matchesTitle && !matchesDescription && !matchesTags) return false
      }
      
      // Deleted filter
      if (!filterDeleted.value && project.deleted) return false
      if (filterDeleted.value && !project.deleted) return false
      
      return true
    })
  })
  
  const projectStats = computed(() => {
    const stats = {
      total: filteredProjects.value.length,
      byStatus: {},
      byPriority: {},
      byRegion: {}
    }
    
    filteredProjects.value.forEach(project => {
      // Status stats
      stats.byStatus[project.status] = (stats.byStatus[project.status] || 0) + 1
      
      // Priority stats
      stats.byPriority[project.priority] = (stats.byPriority[project.priority] || 0) + 1
      
      // Region stats
      stats.byRegion[project.region] = (stats.byRegion[project.region] || 0) + 1
    })
    
    return stats
  })
  
  // Methods
  function initialize() {
    loading.value = true
    error.value = null
    
    try {
      // Build query
      let q = query(collection(db, 'comms_projects'))
      
      // Add ordering
      q = query(q, orderBy('createdAt', 'desc'))
      
      // Set up real-time listener
      const unsubscribe = onSnapshot(q, 
        (snapshot) => {
          console.log('Received projects update:', snapshot.size, 'projects')
          
          projects.value = snapshot.docs.map(doc => {
            const data = doc.data()
            return {
              id: doc.id,
              ...data,
              // Safely convert timestamp fields
              createdAt: safeConvertToDate(data.createdAt),
              updatedAt: safeConvertToDate(data.updatedAt),
              deadline: safeConvertToDate(data.deadline),
              completedAt: safeConvertToDate(data.completedAt),
              deletedAt: safeConvertToDate(data.deletedAt)
            }
          })
          
          loading.value = false
        },
        (err) => {
          console.error('Error fetching projects:', err)
          error.value = err.message
          loading.value = false
          showError('Failed to load projects')
        }
      )
      
      return unsubscribe
    } catch (err) {
      console.error('Error initializing projects:', err)
      error.value = err.message
      loading.value = false
      showError('Failed to initialize projects')
      return null
    }
  }
  
  // Utility function to safely convert timestamps
  function safeConvertToDate(timestamp) {
    if (!timestamp) return null
    
    if (timestamp instanceof Timestamp) {
      return timestamp.toDate()
    }
    
    if (timestamp instanceof Date) {
      return timestamp
    }
    
    if (typeof timestamp === 'object' && timestamp.seconds) {
      return new Timestamp(timestamp.seconds, timestamp.nanoseconds || 0).toDate()
    }
    
    if (typeof timestamp === 'string') {
      const date = new Date(timestamp)
      return isNaN(date.getTime()) ? null : date
    }
    
    return null
  }
  
  // Filter methods
  function setFilter(filterName, value) {
    switch (filterName) {
      case 'region':
        filterRegion.value = value
        break
      case 'status':
        filterStatus.value = value
        break
      case 'priority':
        filterPriority.value = value
        break
      case 'coordinator':
        filterCoordinator.value = value
        break
      case 'search':
        filterSearch.value = value
        break
      case 'deleted':
        filterDeleted.value = value
        break
    }
  }
  
  function clearFilters() {
    filterRegion.value = null
    filterStatus.value = null
    filterPriority.value = null
    filterCoordinator.value = null
    filterSearch.value = ''
    filterDeleted.value = false
  }
  
  // CRUD operations
  async function createProject(projectData) {
    creating.value = true
    error.value = null
    
    try {
      // Validate required fields
      if (!projectData.title) throw new Error('Project title is required')
      if (!projectData.region) throw new Error('Region is required')
      
      // Prepare project data
      const newProject = {
        ...projectData,
        status: projectData.status || 'not_started',
        priority: projectData.priority || 'medium',
        currentStageIndex: 0,
        viewCount: 0,
        deleted: false,
        createdAt: serverTimestamp(),
        createdBy: currentUserId.value,
        createdByEmail: currentUserEmail.value,
        updatedAt: serverTimestamp()
      }
      
      // Create in Firestore
      const docRef = await addDoc(collection(db, 'comms_projects'), newProject)
      
      // Log the action
      await logEvent('create_comms_project', {
        projectId: docRef.id,
        projectTitle: newProject.title,
        region: newProject.region
      })
      
      showSuccess('Project created successfully')
      
      return { id: docRef.id, ...newProject }
      
    } catch (error) {
      console.error('Error creating project:', error)
      error.value = error.message
      showError(error.message || 'Failed to create project')
      throw error
    } finally {
      creating.value = false
    }
  }
  
  async function updateProject(projectId, updates) {
    updating.value = true
    error.value = null
    
    try {
      // Clean up undefined values
      const cleanUpdates = Object.entries(updates).reduce((acc, [key, value]) => {
        if (value !== undefined) {
          acc[key] = value
        }
        return acc
      }, {})
      
      // Add metadata
      const updateData = {
        ...cleanUpdates,
        updatedAt: serverTimestamp(),
        updatedBy: currentUserId.value,
        updatedByEmail: currentUserEmail.value
      }
      
      // Special handling for deadline to ensure it's a Timestamp
      if (updates.deadline !== undefined) {
        const deadlineDate = updates.deadline ? new Date(updates.deadline) : null
        updateData.deadline = deadlineDate ? Timestamp.fromDate(deadlineDate) : null
      }
      
      // Update in Firestore
      await updateDoc(doc(db, 'comms_projects', projectId), updateData)
      
      // Log the action
      await logEvent('update_comms_project', {
        projectId,
        updatedFields: Object.keys(updates)
      })
      
      showSuccess('Project updated successfully')
      
    } catch (error) {
      console.error('Error updating project:', error)
      error.value = error.message
      showError(error.message || 'Failed to update project')
      throw error
    } finally {
      updating.value = false
    }
  }
  
  // Soft delete project (move to trash)
  async function softDeleteProject(projectId) {
    deleting.value = true
    error.value = null
    
    try {
      // Fetch the project to check permissions
      const projectDoc = await getDoc(doc(db, 'comms_projects', projectId))
      
      if (!projectDoc.exists()) {
        throw new Error('Project not found')
      }
      
      const project = { id: projectDoc.id, ...projectDoc.data() }
      
      if (!canDeleteProject(project)) {
        throw new Error('You do not have permission to delete this project')
      }
      
      // Soft delete by setting deleted flag
      await updateDoc(doc(db, 'comms_projects', projectId), {
        deleted: true,
        deletedAt: serverTimestamp(),
        deletedBy: currentUserId.value
      })
      
      // Log the action
      await logEvent('soft_delete_comms_project', {
        projectId,
        projectTitle: project.title
      })
      
      showSuccess('Project moved to trash')
      
      return true
      
    } catch (err) {
      console.error('Error soft deleting project:', err)
      error.value = err.message
      showError(err.message || 'Failed to delete project')
      throw err
    } finally {
      deleting.value = false
    }
  }
  
  // Hard delete project (permanent)
  async function hardDeleteProject(projectId) {
    deleting.value = true
    error.value = null
    
    try {
      // Fetch the project to check permissions
      const projectDoc = await getDoc(doc(db, 'comms_projects', projectId))
      
      if (!projectDoc.exists()) {
        throw new Error('Project not found')
      }
      
      const project = { id: projectDoc.id, ...projectDoc.data() }
      
      // Only super admins can hard delete
      if (!canManageComms.value) {
        throw new Error('Only administrators can permanently delete projects')
      }
      
      // Permanently delete
      await deleteDoc(doc(db, 'comms_projects', projectId))
      
      // Log the action
      await logEvent('hard_delete_comms_project', {
        projectId,
        projectTitle: project.title
      })
      
      showSuccess('Project permanently deleted')
      
      return true
      
    } catch (err) {
      console.error('Error hard deleting project:', err)
      error.value = err.message
      showError(err.message || 'Failed to permanently delete project')
      throw err
    } finally {
      deleting.value = false
    }
  }
  
  // Get a single project by ID
  async function getProject(projectId) {
    try {
      const docSnap = await getDoc(doc(db, 'comms_projects', projectId))
      
      if (!docSnap.exists()) {
        throw new Error('Project not found')
      }
      
      const data = docSnap.data()
      const project = {
        id: docSnap.id,
        ...data,
        // Safely convert timestamp fields
        createdAt: safeConvertToDate(data.createdAt),
        updatedAt: safeConvertToDate(data.updatedAt),
        deadline: safeConvertToDate(data.deadline),
        completedAt: safeConvertToDate(data.completedAt),
        deletedAt: safeConvertToDate(data.deletedAt)
      }
      
      // Check permissions
      if (!canViewProject(project)) {
        throw new Error('You do not have permission to view this project')
      }
      
      // Update view count
      await updateDoc(doc(db, 'comms_projects', projectId), {
        viewCount: (project.viewCount || 0) + 1,
        lastViewedAt: serverTimestamp(),
        lastViewedBy: currentUserId.value
      })
      
      return project
    } catch (error) {
      console.error('Error fetching project:', error)
      showError(error.message || 'Failed to load project')
      throw error
    }
  }
  
  // Restore soft-deleted project
  async function restoreProject(projectId) {
    try {
      await updateDoc(doc(db, 'comms_projects', projectId), {
        deleted: false,
        deletedAt: null,
        deletedBy: null,
        restoredAt: serverTimestamp(),
        restoredBy: currentUserId.value
      })
      
      await logEvent('restore_comms_project', { projectId })
      showSuccess('Project restored successfully')
      
    } catch (error) {
      console.error('Error restoring project:', error)
      showError('Failed to restore project')
      throw error
    }
  }
  
  return {
    // State
    projects,
    loading,
    creating,
    updating,
    deleting,
    error,
    
    // Computed
    filteredProjects,
    projectStats,
    coordinatorRegions,
    
    // Methods
    initialize,
    setFilter,
    clearFilters,
    createProject,
    updateProject,
    softDeleteProject,
    hardDeleteProject,
    getProject,
    restoreProject,
    
    // Permission checks
    canViewProject,
    canEditProject,
    canDeleteProject
  }
}