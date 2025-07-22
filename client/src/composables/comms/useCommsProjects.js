// client/src/composables/comms/useCommsProjects.js
// Composable for managing Communications Dashboard projects
// Handles fetching, filtering, and project visibility logic

import { ref, computed, watch } from 'vue'
import { 
  collection, 
  query, 
  where, 
  orderBy, 
  onSnapshot,
  doc,
  getDoc,
  getDocs
} from 'firebase/firestore'
import { db } from '@/firebase'
import { useAuthStore } from '@/stores/auth'
import { usePermissions } from '@/composables/usePermissions'
import { getAuth } from 'firebase/auth'

export function useCommsProjects() {
  console.log('useCommsProjects composable initialized')
  
  const authStore = useAuthStore()
  const auth = getAuth()
  const { 
    canViewAllRegions, 
    canManageComms,
    hasPermission 
  } = usePermissions()
  
  // State
  const projects = ref([])
  const loading = ref(false)
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
    console.log('Current user ID:', currentUserId.value)
    console.log('Can view all regions:', canViewAllRegions.value)
    console.log('Can manage comms:', canManageComms.value)
    console.log('Has view_comms:', hasPermission('view_comms'))
    
    const filtered = projects.value.filter(project => {
      // Check visibility permissions
      const canView = canViewProject(project)
      if (!canView) {
        console.log(`Cannot view project "${project.title}" - visibility check failed`)
      }
      if (!canView) return false
      
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
        const searchableText = [
          project.title,
          project.description,
          ...(project.tags || [])
        ].join(' ').toLowerCase()
        if (!searchableText.includes(searchLower)) {
          return false
        }
      }
      
      return true
    })
    
    console.log('Filtered projects count:', filtered.length)
    return filtered
  })
  
  // Group projects by region for display
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
  
  // Get project statistics
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
    
    // If we get here, user cannot view the project
    console.log(`User cannot view project "${project.title}":`, {
      hasViewComms: hasPermission('view_comms'),
      canManageComms: canManageComms.value,
      canViewAllRegions: canViewAllRegions.value,
      isCreator: project.createdBy === userId,
      isSharedWith: project.sharedWith?.includes(userId),
      projectVisibility: project.visibility,
      projectRegion: project.region,
      userCoordinatorRegions: coordinatorRegions.value
    })
    
    return false
  }
  
  // Load coordinator regions for current user
  async function loadCoordinatorRegions() {
    const userId = currentUserId.value
    if (!userId) {
      console.log('No user ID available for loading coordinator regions')
      return
    }
    
    try {
      console.log('Loading coordinator regions for user:', userId)
      const coordinatorDoc = await getDoc(
        doc(db, 'comms_coordinators', userId)
      )
      
      if (coordinatorDoc.exists()) {
        coordinatorRegions.value = coordinatorDoc.data().regions || []
        console.log('User is coordinator for regions:', coordinatorRegions.value)
      } else {
        console.log('User is not a coordinator')
      }
    } catch (err) {
      console.error('Error loading coordinator regions:', err)
    }
  }
  
  // Fetch all projects (will be filtered client-side)
  function fetchProjects() {
    loading.value = true
    error.value = null
    
    console.log('Starting to fetch projects...')
    console.log('Current auth state:', {
      userId: currentUserId.value,
      userRole: authStore.userRole,
      isOwner: authStore.isOwner,
      isAdmin: authStore.isAdmin
    })
    
    try {
      // Build query
      let q = query(
        collection(db, 'comms_projects'),
        orderBy('createdAt', 'desc')
      )
      
      // Subscribe to real-time updates
      const unsubscribe = onSnapshot(
        q,
        (snapshot) => {
          console.log('Received snapshot with', snapshot.docs.length, 'documents')
          projects.value = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data(),
            // Convert Firestore timestamps
            createdAt: doc.data().createdAt?.toDate(),
            updatedAt: doc.data().updatedAt?.toDate(),
            deadline: doc.data().deadline?.toDate(),
            completedAt: doc.data().completedAt?.toDate()
          }))
          console.log('Projects loaded:', projects.value.length)
          console.log('Sample project:', projects.value[0])
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
    console.log('Is Owner:', authStore.isOwner)
    console.log('Has view_comms permission:', hasPermission('view_comms'))
    
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
    error,
    filters,
    coordinatorRegions, // Add this for debugging
    
    // Computed
    projectsByRegion,
    projectStats,
    viewableRegions,
    
    // Methods
    initialize,
    setFilter,
    clearFilters,
    canViewProject
  }
}