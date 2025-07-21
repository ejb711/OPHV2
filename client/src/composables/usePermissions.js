// client/src/composables/usePermissions.js - Complete permission management composable
import { computed } from 'vue'
import { useAuthStore } from '../stores/auth'

export function usePermissions() {
  const auth = useAuthStore()

  /* ---------- basic permission checks ---------- */
  const hasPermission = (permission) => auth.hasPermission(permission)
  const hasAnyPermission = (permissions) => auth.hasAnyPermission(permissions)
  const hasAllPermissions = (permissions) => auth.hasAllPermissions(permissions)

  /* ---------- role checks ---------- */
  const isOwner = computed(() => auth.isOwner)
  const isAdmin = computed(() => auth.isAdmin)
  const isUser = computed(() => auth.isUser)
  const isPending = computed(() => auth.isPending)
  const canManageRole = (targetRole) => auth.canManageRole(targetRole)

  /* ---------- feature-specific permissions ---------- */
  
  // Dashboard & Navigation
  const canViewDashboard = computed(() => hasPermission('view_dashboard') || isUser.value || isAdmin.value || isOwner.value)
  const canViewSystemStatus = computed(() => hasPermission('view_system_status') || isAdmin.value || isOwner.value)
  
  // User Management
  const canManageUsers = computed(() => hasPermission('manage_users'))
  const canViewUsers = computed(() => hasPermission('view_users') || canManageUsers.value)
  const canCreateUsers = computed(() => hasPermission('create_users') || canManageUsers.value)
  const canEditUsers = computed(() => hasPermission('edit_users') || canManageUsers.value)
  const canDeleteUsers = computed(() => hasPermission('delete_users') || canManageUsers.value)

  // Role & Permission Management
  const canManageRoles = computed(() => hasPermission('manage_roles'))
  const canManagePermissions = computed(() => hasPermission('manage_permissions'))
  const canViewAuditLogs = computed(() => hasPermission('view_audit_logs'))

  // Content Management - Projects
  const canManageProjects = computed(() => hasPermission('manage_projects'))
  const canViewProjects = computed(() => hasPermission('view_projects') || canManageProjects.value)
  const canCreateProjects = computed(() => hasPermission('create_projects') || canManageProjects.value)
  const canEditProjects = computed(() => hasPermission('edit_projects') || canManageProjects.value)
  const canDeleteProjects = computed(() => hasPermission('delete_projects') || canManageProjects.value)

  // Forum Management
  const canManageForums = computed(() => hasPermission('manage_forums'))
  const canViewForums = computed(() => hasPermission('view_forums') || canManageForums.value)
  const canCreatePosts = computed(() => hasPermission('create_posts') || canManageForums.value)
  const canEditPosts = computed(() => hasPermission('edit_posts') || canManageForums.value)
  const canDeletePosts = computed(() => hasPermission('delete_posts') || canManageForums.value)
  const canModeratePosts = computed(() => hasPermission('moderate_posts') || canManageForums.value)

  // Calendar Management
  const canManageCalendar = computed(() => hasPermission('manage_calendar'))
  const canViewCalendar = computed(() => hasPermission('view_calendar') || canManageCalendar.value)
  const canCreateEvents = computed(() => hasPermission('create_events') || canManageCalendar.value)
  const canEditEvents = computed(() => hasPermission('edit_events') || canManageCalendar.value)
  const canDeleteEvents = computed(() => hasPermission('delete_events') || canManageCalendar.value)

  // Communications Dashboard
  const canManageComms = computed(() => hasPermission('manage_comms'))
  const canViewComms = computed(() => hasPermission('view_comms') || canManageComms.value)
  const canCreateCommsProjects = computed(() => hasPermission('create_comms_projects') || canManageComms.value)
  const canEditCommsProjects = computed(() => hasPermission('edit_comms_projects') || canManageComms.value)
  const canDeleteCommsProjects = computed(() => hasPermission('delete_comms_projects') || canManageComms.value)
  const canManageCommsCoordinators = computed(() => hasPermission('manage_comms_coordinators') || canManageComms.value)
  const canViewAllRegions = computed(() => hasPermission('view_all_regions') || canManageComms.value)
  const canManageCommsTemplates = computed(() => hasPermission('manage_comms_templates') || canManageComms.value)
  const canExportCommsData = computed(() => hasPermission('export_comms_data') || canManageComms.value)
  const canApproveCommsProjects = computed(() => hasPermission('approve_comms_projects') || canManageComms.value)

  // System Management
  const canManageSystem = computed(() => hasPermission('manage_system'))
  const canViewAnalytics = computed(() => hasPermission('view_analytics'))
  const canManageSettings = computed(() => hasPermission('manage_settings'))
  const canAccessAdmin = computed(() => canManageUsers.value || canManageRoles.value || canManageSystem.value)

  /* ---------- UI helpers ---------- */
  
  // Navigation visibility
  const showAdminNav = computed(() => canAccessAdmin.value)
  const showProjectsNav = computed(() => canViewProjects.value)
  const showForumsNav = computed(() => canViewForums.value)
  const showCalendarNav = computed(() => canViewCalendar.value)
  const showCommsNav = computed(() => canViewComms.value)

  // Button visibility helpers
  const showCreateButton = (feature) => {
    switch (feature) {
      case 'users': return canCreateUsers.value
      case 'projects': return canCreateProjects.value
      case 'posts': return canCreatePosts.value
      case 'events': return canCreateEvents.value
      case 'comms_projects': return canCreateCommsProjects.value
      default: return false
    }
  }

  const showEditButton = (feature, isOwner = false) => {
    // Users can generally edit their own content
    if (isOwner) return true
    
    switch (feature) {
      case 'users': return canEditUsers.value
      case 'projects': return canEditProjects.value
      case 'posts': return canEditPosts.value
      case 'events': return canEditEvents.value
      case 'comms_projects': return canEditCommsProjects.value || isOwner
      default: return false
    }
  }

  const showDeleteButton = (feature, isOwner = false) => {
    // More restrictive than edit
    switch (feature) {
      case 'users': return canDeleteUsers.value
      case 'projects': return canDeleteProjects.value || isOwner
      case 'posts': return canDeletePosts.value || isOwner
      case 'events': return canDeleteEvents.value || isOwner
      case 'comms_projects': return canDeleteCommsProjects.value || isOwner
      default: return false
    }
  }

  /* ---------- permission requirement helpers ---------- */
  
  // For route guards
  const requiresPermission = (permission) => {
    return auth.ready && hasPermission(permission)
  }

  const requiresAnyPermission = (permissions) => {
    return auth.ready && hasAnyPermission(permissions)
  }

  const requiresRole = (role) => {
    return auth.ready && (auth.role === role || (role !== 'owner' && auth.role === 'owner'))
  }

  /* ---------- error messages ---------- */
  const getPermissionErrorMessage = (permission) => {
    if (!auth.user) return 'Please log in to access this feature'
    if (auth.isPending) return 'Your account is pending approval'
    return `You don't have permission to ${permission.replace('_', ' ')}`
  }

  return {
    // Basic checks
    hasPermission,
    hasAnyPermission,
    hasAllPermissions,

    // Role checks
    isOwner,
    isAdmin,
    isUser,
    isPending,
    canManageRole,

    // Dashboard & System
    canViewDashboard,
    canViewSystemStatus,

    // User Management
    canManageUsers,
    canViewUsers,
    canCreateUsers,
    canEditUsers,
    canDeleteUsers,
    canManageRoles,
    canManagePermissions,
    canViewAuditLogs,

    // Projects
    canManageProjects,
    canViewProjects,
    canCreateProjects,
    canEditProjects,
    canDeleteProjects,

    // Forums
    canManageForums,
    canViewForums,
    canCreatePosts,
    canEditPosts,
    canDeletePosts,
    canModeratePosts,

    // Calendar
    canManageCalendar,
    canViewCalendar,
    canCreateEvents,
    canEditEvents,
    canDeleteEvents,

    // Communications
    canManageComms,
    canViewComms,
    canCreateCommsProjects,
    canEditCommsProjects,
    canDeleteCommsProjects,
    canManageCommsCoordinators,
    canViewAllRegions,
    canManageCommsTemplates,
    canExportCommsData,
    canApproveCommsProjects,

    // System
    canManageSystem,
    canViewAnalytics,
    canManageSettings,
    canAccessAdmin,

    // UI helpers
    showAdminNav,
    showProjectsNav,
    showForumsNav,
    showCalendarNav,
    showCommsNav,
    showCreateButton,
    showEditButton,
    showDeleteButton,

    // Route guards
    requiresPermission,
    requiresAnyPermission,
    requiresRole,

    // Error handling
    getPermissionErrorMessage
  }
}