// client/src/composables/comms/commsProjectPermissions.js
// Helper functions for checking project permissions
// Extracted to keep main composable under 350 lines

export function createProjectPermissionChecker(deps) {
  const {
    canViewAllRegions,
    canManageComms,
    hasPermission,
    authStore,
    currentUserId,
    currentUserEmail,
    coordinatorRegions
  } = deps

  // Check if current user can view a specific project
  function canViewProject(project) {
    // For system-created test projects without visibility settings
    if (!project.visibility) {
      console.log('Project has no visibility setting, defaulting to visible')
      return true
    }
    
    const userId = currentUserId.value
    const userEmail = currentUserEmail.value
    
    console.log('Checking visibility for project:', project.title)
    console.log('Project visibility:', project.visibility)
    console.log('Current user ID:', userId)
    console.log('User email:', userEmail)
    
    // Check based on visibility level
    switch (project.visibility) {
      case 'owner':
        return canManageComms.value || authStore.userRole === 'owner'
      
      case 'admin':
        return canManageComms.value || ['owner', 'admin'].includes(authStore.userRole)
      
      case 'coordinator':
      case 'team': // Handle alternate naming
        // Visible to coordinators of the same region, admins, and owners
        if (canManageComms.value || canViewAllRegions.value) {
          return true
        }
        return coordinatorRegions.value.includes(project.region)
      
      case 'creator':
      case 'private': // Handle legacy/alternate naming
        // Only visible to the creator, coordinators of same region, and admins
        if (canManageComms.value || canViewAllRegions.value) {
          return true
        }
        if (project.createdBy === userId || project.createdByEmail === userEmail) {
          return true
        }
        return coordinatorRegions.value.includes(project.region)
      
      case 'public':
      default:
        return true
    }
  }

  // Check if user can edit a project
  function canEditProject(project) {
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