// client/src/composables/comms/useCommsProjects.js
// Composable for managing Communications Dashboard projects
// Handles fetching, filtering, creating, and project visibility logic

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
  serverTimestamp
} from 'firebase/firestore'
import { db } from '@/firebase'
import { useAuthStore } from '@/stores/auth'
import { usePermissions } from '@/composables/usePermissions'
import { useAudit } from '@/composables/useAudit'
import { useSnackbar } from '@/composables/useSnackbar'
import { getAuth } from 'firebase/auth'

export function useCommsProjects() {
  console.log('useCommsProjects composable initialized')
  
  const authStore = useAuthStore()
  const auth = getAuth()
  const { logAction } = useAudit()
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
  
  // Check if current user can view a specific project - FIXED
  function canViewProject(project) {
    // For system-created projects or when user has full permissions, allow viewing
    if (canManageComms.value || authStore.isOwner || authStore.isAdmin) {
      console.log('User has full access (owner/admin/manage_comms)')
      return true
    }
    
    // If user has view_comms permission and project is public, allow viewing
    if (project.visibility === 'public' && hasPermission('view_comms')) {
      console.log('Project is public and user has view_comms')
      return true
    }
    
    // Check if we have a user ID to do user-specific checks
    const userId = currentUserId.value
    if (!userId) {
      console.log('No user ID available, but checking role-based permissions')
      // Even without user ID, check if they have general viewing permissions
      return hasPermission('view_comms') || canViewAllRegions.value
    }
    
    // Creator can always view
    if (project.createdBy === userId) return true
    
    // Explicitly shared with user
    if (project.sharedWith?.includes(userId)) return true
    
    // Regional coordinator can view projects in their regions
    if (coordinatorRegions.value.includes(project.region)) return true
    
    // Can view all regions permission
    if (canViewAllRegions.value) return true
    
    // Team visibility - anyone with view_comms can see
    if (project.visibility === 'team' && hasPermission('view_comms')) return true
    
    // If we get here, user cannot view the project
    console.log(`User cannot view project "${project.title}"`)
    return false
  }
  
  // Load regions where current user is a coordinator
  async function loadCoordinatorRegions() {
    const userId = currentUserId.value
    if (!userId) {
      console.log('No user ID, skipping coordinator regions load')
      return
    }
    
    try {
      const q = query(
        collection(db, 'comms_coordinators'),
        where('userId', '==', userId)
      )
      const snapshot = await getDocs(q)
      
      if (!snapshot.empty) {
        const coordDoc = snapshot.docs[0]
        coordinatorRegions.value = coordDoc.data().regions || []
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
      await logAction('create_comms_project', {
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
    loading,
    creating,
    error,
    filters,
    coordinatorRegions, // Add this for debugging
    
    // Computed
    projectsByRegion,
    projectStats,
    viewableRegions,
    
    // Methods
    initialize,
    createProject,
    setFilter,
    clearFilters,
    canViewProject
  }
}