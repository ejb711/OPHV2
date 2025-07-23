// client/src/composables/comms/commsProjectPermissions.js
import { computed } from 'vue'
import { useAuthStore } from '@/stores/auth'
import { usePermissions } from '@/composables/usePermissions'

export function useCommsProjectPermissions() {
  // Store and composables
  const authStore = useAuthStore()
  const { hasPermission, canManageComms } = usePermissions()
  
  // Computed
  const currentUserId = computed(() => authStore.user?.uid || null)
  
  const coordinatorRegions = computed(() => {
    // Get regions where current user is a coordinator
    // This would come from user's coordinator assignments
    // For now, return empty array - will be implemented when coordinator assignments are added
    return []
  })
  
  // Check if user can view a project
  function canViewProject(project) {
    if (!project) return false
    
    // Admins and owners can view all projects
    if (canManageComms.value || hasPermission('view_all_comms_projects')) {
      return true
    }
    
    // Check visibility settings
    if (project.visibility === 'public' || project.visibility === 'organization') {
      return hasPermission('view_comms')
    }
    
    // Coordinators can view projects in their regions
    if (project.visibility === 'coordinators' && coordinatorRegions.value.includes(project.region)) {
      return true
    }
    
    // Creators can always view their own projects
    if (project.createdBy === currentUserId.value) {
      return true
    }
    
    // Check if user is in shared list
    if (project.sharedWith && project.sharedWith.includes(currentUserId.value)) {
      return true
    }
    
    // Default deny
    return false
  }
  
  // Check if user can edit a project
  function canEditProject(project) {
    if (!project) return false
    
    const userId = currentUserId.value
    
    // Admins and owners can edit any project
    if (canManageComms.value || hasPermission('edit_all_comms_projects')) {
      return true
    }
    
    // Coordinators can edit projects in their regions
    if (hasPermission('edit_comms_projects') && coordinatorRegions.value.includes(project.region)) {
      return true
    }
    
    // Creators can edit their own projects if they have permission
    if (hasPermission('edit_comms_projects') && project.createdBy === userId) {
      return true
    }
    
    return false
  }

  // Check if user can delete a project
  function canDeleteProject(project) {
    if (!project) return false
    
    const userId = currentUserId.value
    
    // Only admins/owners or project creators can delete
    if (canManageComms.value || hasPermission('delete_all_comms_projects')) {
      return true
    }
    
    // Creators can delete their own projects if they have permission
    if (hasPermission('delete_comms_projects') && project.createdBy === userId) {
      return true
    }
    
    return false
  }

  return {
    canViewProject,
    canEditProject,
    canDeleteProject
  }
}