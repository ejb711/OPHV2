// client/src/composables/comms/useCommsProjectsFilters.js
import { computed } from 'vue'
import { useAuthStore } from '@/stores/auth'
import { useCommsProjectPermissions } from './commsProjectPermissions'
import { calculateProjectStatus } from './utils/calculateProjectStatus'

/**
 * Filtering logic for communications projects
 * Provides computed properties for filtered and sorted projects
 */
export function useCommsProjectsFilters(
  projects,
  filterRegion,
  filterStatus,
  filterPriority,
  filterCoordinator,
  filterSearch,
  filterDeleted
) {
  // Store and permissions
  const authStore = useAuthStore()
  const { canViewProject } = useCommsProjectPermissions()
  
  // Computed
  const currentUserId = computed(() => authStore.user?.uid || null)
  const currentUserEmail = computed(() => authStore.user?.email || null)
  
  const coordinatorRegions = computed(() => {
    // Get regions where current user is a coordinator
    // This would come from user's coordinator assignments
    return []
  })
  
  // Use the shared status calculation utility

  const filteredProjects = computed(() => {
    return projects.value.filter(project => {
      // Permission check
      if (!canViewProject(project)) return false
      
      // Region filter
      if (filterRegion.value && project.region !== filterRegion.value) return false
      
      // Status filter - use calculated status
      if (filterStatus.value) {
        const calculatedStatus = calculateProjectStatus(project)
        if (calculatedStatus !== filterStatus.value) return false
      }
      
      // Priority filter - handle 'normal' as 'medium'
      if (filterPriority.value) {
        const projectPriority = project.priority === 'normal' ? 'medium' : project.priority
        if (projectPriority !== filterPriority.value) return false
      }
      
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
      // Status stats - use calculated status
      const status = calculateProjectStatus(project)
      stats.byStatus[status] = (stats.byStatus[status] || 0) + 1
      
      // Priority stats - handle 'normal' as 'medium'
      const priority = project.priority === 'normal' ? 'medium' : project.priority
      stats.byPriority[priority] = (stats.byPriority[priority] || 0) + 1
      
      // Region stats
      stats.byRegion[project.region] = (stats.byRegion[project.region] || 0) + 1
    })
    
    return stats
  })
  
  // Additional computed properties for UI
  const activeProjectsCount = computed(() => {
    return projects.value.filter(p => {
      if (!canViewProject(p) || p.deleted) return false
      const status = calculateProjectStatus(p)
      return status !== 'completed'
    }).length
  })
  
  const completedProjectsCount = computed(() => {
    return projects.value.filter(p => {
      if (!canViewProject(p) || p.deleted) return false
      const status = calculateProjectStatus(p)
      return status === 'completed'
    }).length
  })
  
  const myProjectsCount = computed(() => {
    return projects.value.filter(p => 
      canViewProject(p) && 
      !p.deleted && 
      (p.createdBy === currentUserId.value || p.coordinatorId === currentUserId.value)
    ).length
  })
  
  const highPriorityProjects = computed(() => {
    return filteredProjects.value
      .filter(p => {
        const priority = p.priority === 'normal' ? 'medium' : p.priority
        const status = calculateProjectStatus(p)
        return (priority === 'high' || priority === 'urgent') && status !== 'completed'
      })
      .sort((a, b) => {
        // Sort by deadline if available
        if (a.deadline && b.deadline) {
          return new Date(a.deadline) - new Date(b.deadline)
        }
        return 0
      })
  })
  
  const upcomingDeadlines = computed(() => {
    const now = new Date()
    const weekFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000)
    
    return filteredProjects.value
      .filter(p => {
        if (!p.deadline) return false
        const status = calculateProjectStatus(p)
        if (status === 'completed') return false
        const deadline = new Date(p.deadline)
        return deadline >= now && deadline <= weekFromNow
      })
      .sort((a, b) => new Date(a.deadline) - new Date(b.deadline))
  })
  
  return {
    // User info
    currentUserId,
    currentUserEmail,
    coordinatorRegions,
    
    // Filtered data
    filteredProjects,
    projectStats,
    
    // Counts
    activeProjectsCount,
    completedProjectsCount,
    myProjectsCount,
    
    // Special lists
    highPriorityProjects,
    upcomingDeadlines
  }
}