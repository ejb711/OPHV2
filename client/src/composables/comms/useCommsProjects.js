// client/src/composables/comms/useCommsProjects.js
// Composable for managing Communications Dashboard projects
// Handles fetching, filtering, creating, updating, and deleting projects

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
  serverTimestamp
} from 'firebase/firestore'
import { db } from '@/firebase'
import { useAuthStore } from '@/stores/auth'
import { usePermissions } from '@/composables/usePermissions'
import { useAudit } from '@/composables/useAudit'
import { useSnackbar } from '@/composables/useSnackbar'
import { getAuth } from 'firebase/auth'
import { createProjectPermissionChecker } from './commsProjectPermissions'

export function useCommsProjects() {
  console.log('useCommsProjects composable initialized')
  
  const authStore = useAuthStore()
  const auth = getAuth()
  const { logEvent } = useAudit()
  const { showSuccess, showError } = useSnackbar()
  const { 
    canViewAllRegions, 
    canManageComms,
    hasPermission 
  } = usePermissions()
  
  // State
  const projects = ref([])
  const loading = ref(false)
  const creating = ref(false)
  const updating = ref(false)
  const deleting = ref(false)
  const error = ref(null)
  const coordinatorRegions = ref([])
  const filters = ref({
    region: null,
    status: null,
    priority: null,
    search: ''
  })
  
  // Computed - Fixed to handle auth state properly
  const currentUserId = computed(() => {
    // Try multiple sources for user ID
    return authStore.currentUser?.uid || auth.currentUser?.uid || authStore.userId
  })

  const currentUserEmail = computed(() => {
    return authStore.currentUser?.email || auth.currentUser?.email || ''
  })
  
  // Get regions the current user can view
  const viewableRegions = computed(() => {
    if (canViewAllRegions.value || canManageComms.value) {
      // Can view all regions
      return null // null means no restriction
    }
    // Otherwise, only regions where user is coordinator
    return coordinatorRegions.value
  })
  
  // Filter projects based on visibility and permissions
  const visibleProjects = computed(() => {
    if (!projects.value.length) {
      console.log('No projects to filter')
      return []
    }
    
    console.log('Filtering projects. Total:', projects.value.length)
    
    return projects.value.filter(project => {
      // Check visibility permissions
      if (!canViewProject(project)) {
        return false
      }
      
      // Apply filters
      if (filters.value.region && project.region !== filters.value.region) {
        return false
      }
      
      if (filters.value.status && project.status !== filters.value.status) {
        return false
      }
      
      if (filters.value.priority && project.priority !== filters.value.priority) {
        return false
      }
      
      if (filters.value.search) {
        const searchLower = filters.value.search.toLowerCase()
        const matchesSearch = 
          project.title.toLowerCase().includes(searchLower) ||
          project.description.toLowerCase().includes(searchLower) ||
          (project.tags || []).some(tag => tag.toLowerCase().includes(searchLower))
        
        if (!matchesSearch) return false
      }
      
      return true
    })
  })
  
  // Projects grouped by region
  const projectsByRegion = computed(() => {
    const grouped = {}
    visibleProjects.value.forEach(project => {
      if (!grouped[project.region]) {
        grouped[project.region] = []
      }
      grouped[project.region].push(project)
    })
    return grouped
  })
  
  // Project statistics
  const projectStats = computed(() => {
    const stats = {
      total: visibleProjects.value.length,
      byStatus: {},
      byPriority: {},
      byRegion: {}
    }
    
    visibleProjects.value.forEach(project => {
      // Count by status
      stats.byStatus[project.status] = (stats.byStatus[project.status] || 0) + 1
      
      // Count by priority
      if (project.priority) {
        stats.byPriority[project.priority] = (stats.byPriority[project.priority] || 0) + 1
      }
      
      // Count by region
      stats.byRegion[project.region] = (stats.byRegion[project.region] || 0) + 1
    })
    
    return stats
  })
  
  // Methods
  
  // Create permission checker with dependencies
  const permissionChecker = createProjectPermissionChecker({
    canViewAllRegions,
    canManageComms,
    hasPermission,
    authStore,
    currentUserId,
    currentUserEmail,
    coordinatorRegions
  })
  
  const { canViewProject, canEditProject, canDeleteProject } = permissionChecker
  
  // Load coordinator regions for current user
  async function loadCoordinatorRegions() {
    if (!currentUserId.value) {
      console.log('No user ID, skipping coordinator regions load')
      return
    }
    
    try {
      const q = query(
        collection(db, 'comms_coordinators'),
        where('userId', '==', currentUserId.value),
        where('active', '==', true)
      )
      
      const snapshot = await getDocs(q)
      
      if (!snapshot.empty) {
        coordinatorRegions.value = snapshot.docs.map(doc => doc.data().region)
        console.log('User is coordinator for regions:', coordinatorRegions.value)
      } else {
        coordinatorRegions.value = []
        console.log('User is not a coordinator')
      }
    } catch (error) {
      console.error('Error loading coordinator regions:', error)
      coordinatorRegions.value = []
    }
  }
  
  // Fetch projects from Firestore
  function fetchProjects() {
    loading.value = true
    error.value = null
    
    try {
      console.log('Setting up projects listener...')
      
      // Build query based on permissions
      let q = query(
        collection(db, 'comms_projects'),
        where('deleted', '==', false),
        orderBy('createdAt', 'desc')
      )
      
      const unsubscribe = onSnapshot(
        q,
        (snapshot) => {
          projects.value = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data(),
            createdAt: doc.data().createdAt?.toDate(),
            updatedAt: doc.data().updatedAt?.toDate(),
            deadline: doc.data().deadline?.toDate(),
            completedAt: doc.data().completedAt?.toDate()
          }))
          console.log('Projects loaded:', projects.value.length)
          loading.value = false
        },
        (err) => {
          console.error('Error fetching projects:', err)
          error.value = err.message
          loading.value = false
        }
      )
      
      return unsubscribe
    } catch (err) {
      console.error('Error setting up projects listener:', err)
      error.value = err.message
      loading.value = false
      return null
    }
  }

  // Create a new project
  async function createProject(projectData) {
    creating.value = true
    error.value = null
    
    try {
      // Validate user has permission
      if (!hasPermission('create_comms_projects')) {
        throw new Error('You do not have permission to create projects')
      }

      // Prepare project document
      const newProject = {
        ...projectData,
        createdBy: currentUserId.value,
        createdByEmail: currentUserEmail.value,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        deleted: false,
        status: 'not-started',
        currentStageIndex: 0,
        files: [],
        externalLinks: [],
        sharedWith: [],
        viewCount: 0,
        lastViewedAt: null,
        completedAt: null
      }

      // Add to Firestore
      const docRef = await addDoc(collection(db, 'comms_projects'), newProject)
      
      // Log the action
      await logEvent('create_comms_project', {
        projectId: docRef.id,
        projectTitle: projectData.title,
        region: projectData.region
      })

      showSuccess('Project created successfully')
      
      return docRef.id
    } catch (error) {
      console.error('Error creating project:', error)
      error.value = error.message
      showError(error.message || 'Failed to create project')
      throw error
    } finally {
      creating.value = false
    }
  }

  // Update an existing project
  async function updateProject(projectId, updates) {
    updating.value = true
    error.value = null
    
    try {
      // Fetch the project directly from Firestore to check permissions
      const project = await getProject(projectId)

      if (!canEditProject(project)) {
        throw new Error('You do not have permission to edit this project')
      }

      // Prepare update data
      const updateData = {
        ...updates,
        updatedAt: serverTimestamp(),
        updatedBy: currentUserId.value,
        updatedByEmail: currentUserEmail.value
      }

      // Remove fields that shouldn't be updated directly
      delete updateData.id
      delete updateData.createdAt
      delete updateData.createdBy
      delete updateData.createdByEmail
      
      // Clean undefined values - Firestore doesn't accept undefined
      Object.keys(updateData).forEach(key => {
        if (updateData[key] === undefined) {
          delete updateData[key]
        }
      })

      // Update in Firestore
      console.log('Updating project in Firestore:', projectId, updateData)
      await updateDoc(doc(db, 'comms_projects', projectId), updateData)

      // Log the action
      await logEvent('update_comms_project', {
        projectId,
        projectTitle: project.title,
        updates: Object.keys(updates)
      })

      showSuccess('Project updated successfully')
      
      return true
    } catch (error) {
      console.error('Error updating project:', error)
      error.value = error.message
      showError(error.message || 'Failed to update project')
      throw error
    } finally {
      updating.value = false
    }
  }

  // Soft delete a project
  async function softDeleteProject(projectId) {
    console.log('Soft delete requested for project:', projectId)
    return deleteProject(projectId, false)
  }

  // Hard delete a project (admin only)
  async function hardDeleteProject(projectId) {
    console.log('Hard delete requested for project:', projectId)
    return deleteProject(projectId, true)
  }

  // Delete a project (soft or hard)
  async function deleteProject(projectId, hard = false) {
    deleting.value = true
    error.value = null
    
    try {
      // Fetch the project directly from Firestore to ensure we have it
      const project = await getProject(projectId)
      
      if (!canDeleteProject(project)) {
        throw new Error('You do not have permission to delete this project')
      }

      if (hard) {
        // Hard delete - only for admins
        if (!canManageComms.value) {
          throw new Error('Only administrators can permanently delete projects')
        }

        // Delete from Firestore
        await deleteDoc(doc(db, 'comms_projects', projectId))

        // Log the action
        await logEvent('hard_delete_comms_project', {
          projectId,
          projectTitle: project.title
        })

        showSuccess('Project permanently deleted')
      } else {
        // Soft delete - mark as deleted
        const updateData = {
          deleted: true,
          deletedAt: serverTimestamp(),
          deletedBy: currentUserId.value,
          deletedByEmail: currentUserEmail.value
        }
        
        console.log('Soft deleting project:', projectId, updateData)
        await updateDoc(doc(db, 'comms_projects', projectId), updateData)

        // Log the action
        await logEvent('soft_delete_comms_project', {
          projectId,
          projectTitle: project.title
        })

        showSuccess('Project deleted successfully')
      }
      
      return true
    } catch (error) {
      console.error('Error deleting project:', error)
      error.value = error.message
      showError(error.message || 'Failed to delete project')
      throw error
    } finally {
      deleting.value = false
    }
  }

  // Get a single project by ID
  async function getProject(projectId) {
    try {
      const docRef = doc(db, 'comms_projects', projectId)
      const docSnap = await getDoc(docRef)
      
      if (!docSnap.exists()) {
        console.error('Project document does not exist:', projectId)
        throw new Error('Project not found')
      }
      
      const project = {
        id: docSnap.id,
        ...docSnap.data(),
        createdAt: docSnap.data().createdAt?.toDate(),
        updatedAt: docSnap.data().updatedAt?.toDate(),
        deadline: docSnap.data().deadline?.toDate(),
        completedAt: docSnap.data().completedAt?.toDate()
      }
      
      console.log('Fetched project:', project.title, 'ID:', project.id)
      
      if (!canViewProject(project)) {
        console.error('User does not have permission to view project:', projectId)
        throw new Error('You do not have permission to view this project')
      }
      
      return project
    } catch (error) {
      console.error('Error fetching project:', error)
      throw error
    }
  }
  
  // Apply filter
  function setFilter(filterKey, value) {
    filters.value[filterKey] = value
  }
  
  // Clear all filters
  function clearFilters() {
    filters.value = {
      region: null,
      status: null,
      priority: null,
      search: ''
    }
  }
  
  // Initialize composable
  async function initialize() {
    console.log('Initializing useCommsProjects...')
    console.log('Current user ID:', currentUserId.value)
    console.log('User role:', authStore.userRole)
    console.log('Has create permission:', hasPermission('create_comms_projects'))
    
    await loadCoordinatorRegions()
    return fetchProjects()
  }
  
  // Watch for auth state changes and refetch if needed
  watch(() => authStore.currentUser, (newUser, oldUser) => {
    if (newUser && !oldUser) {
      console.log('User logged in, reloading coordinator regions')
      loadCoordinatorRegions()
    }
  })
  
  return {
    // State
    projects: visibleProjects,
    allProjects: projects, // Raw projects for debugging
    loading,
    creating,
    updating,
    deleting,
    error,
    filters,
    coordinatorRegions,
    
    // Computed
    projectsByRegion,
    projectStats,
    viewableRegions,
    
    // Methods
    initialize,
    createProject,
    updateProject,
    softDeleteProject,
    hardDeleteProject,
    getProject,
    setFilter,
    clearFilters,
    canViewProject,
    canEditProject,
    canDeleteProject
  }
}