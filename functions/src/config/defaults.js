// functions/src/config/defaults.js - Permission System Configuration
// Centralized permission and role definitions for OPHV2

/* ---------- Default Permissions ---------- */
const DEFAULT_PERMISSIONS = [
  // User Management
  { id: 'manage_users', name: 'Manage Users', description: 'Create, edit, and delete users', category: 'user_management' },
  { id: 'view_users', name: 'View Users', description: 'View user profiles and lists', category: 'user_management' },
  { id: 'create_users', name: 'Create Users', description: 'Create new user accounts', category: 'user_management' },
  { id: 'edit_users', name: 'Edit Users', description: 'Edit user profiles and settings', category: 'user_management' },
  { id: 'delete_users', name: 'Delete Users', description: 'Delete user accounts', category: 'user_management' },
  
  // Role Management
  { id: 'manage_roles', name: 'Manage Roles', description: 'Create and modify user roles', category: 'user_management' },
  { id: 'manage_permissions', name: 'Manage Permissions', description: 'Assign permissions to roles', category: 'user_management' },
  { id: 'view_audit_logs', name: 'View Audit Logs', description: 'View system audit and change logs', category: 'user_management' },
  
  // Content Management
  { id: 'manage_projects', name: 'Manage Projects', description: 'Full project management access', category: 'content_management' },
  { id: 'view_projects', name: 'View Projects', description: 'View projects and project data', category: 'content_management' },
  { id: 'create_projects', name: 'Create Projects', description: 'Create new projects', category: 'content_management' },
  { id: 'edit_projects', name: 'Edit Projects', description: 'Edit project details and data', category: 'content_management' },
  { id: 'delete_projects', name: 'Delete Projects', description: 'Delete projects', category: 'content_management' },
  
  // Community Features
  { id: 'manage_forums', name: 'Manage Forums', description: 'Forum administration and moderation', category: 'community' },
  { id: 'view_forums', name: 'View Forums', description: 'View and read forum content', category: 'community' },
  { id: 'create_posts', name: 'Create Posts', description: 'Create new forum posts and topics', category: 'community' },
  { id: 'edit_posts', name: 'Edit Posts', description: 'Edit forum posts and topics', category: 'community' },
  { id: 'delete_posts', name: 'Delete Posts', description: 'Delete forum posts and topics', category: 'community' },
  { id: 'moderate_posts', name: 'Moderate Posts', description: 'Moderate forum content', category: 'community' },
  
  // Calendar & Events
  { id: 'manage_calendar', name: 'Manage Calendar', description: 'Full calendar administration', category: 'scheduling' },
  { id: 'view_calendar', name: 'View Calendar', description: 'View calendar and events', category: 'scheduling' },
  { id: 'create_events', name: 'Create Events', description: 'Create new calendar events', category: 'scheduling' },
  { id: 'edit_events', name: 'Edit Events', description: 'Edit calendar events', category: 'scheduling' },
  { id: 'delete_events', name: 'Delete Events', description: 'Delete calendar events', category: 'scheduling' },
  
  // Communications Dashboard Permissions
  { id: 'manage_comms', name: 'Manage Communications', description: 'Full communications dashboard access', category: 'communications' },
  { id: 'view_comms', name: 'View Communications', description: 'View communications dashboard and projects', category: 'communications' },
  { id: 'create_comms_projects', name: 'Create Communications Projects', description: 'Create new communications projects', category: 'communications' },
  { id: 'edit_comms_projects', name: 'Edit Communications Projects', description: 'Edit communications project details', category: 'communications' },
  { id: 'delete_comms_projects', name: 'Delete Communications Projects', description: 'Delete communications projects', category: 'communications' },
  { id: 'manage_comms_coordinators', name: 'Manage Communications Coordinators', description: 'Assign and manage regional coordinators', category: 'communications' },
  { id: 'view_all_regions', name: 'View All Regions', description: 'View projects from all Louisiana regions', category: 'communications' },
  { id: 'manage_comms_templates', name: 'Manage Communications Templates', description: 'Create and manage project templates', category: 'communications' },
  { id: 'export_comms_data', name: 'Export Communications Data', description: 'Export project data and reports', category: 'communications' },
  { id: 'approve_comms_projects', name: 'Approve Communications Projects', description: 'Approve projects in pending status', category: 'communications' },
  { id: 'post_comms_messages', name: 'Post Communications Messages', description: 'Post messages in project discussions', category: 'communications' },
  
  // Profile Management
  { id: 'view_own_profile', name: 'View Own Profile', description: 'View personal profile information', category: 'profile' },
  { id: 'edit_own_profile', name: 'Edit Own Profile', description: 'Edit personal profile information', category: 'profile' },
  { id: 'view_own_activity', name: 'View Own Activity', description: 'View personal activity history', category: 'profile' },
  { id: 'manage_own_security', name: 'Manage Own Security', description: 'Change password and security settings', category: 'profile' },
  { id: 'upload_avatar', name: 'Upload Avatar', description: 'Upload and change profile photo', category: 'profile' },
  
  // System Administration
  { id: 'access_admin', name: 'Access Admin Panel', description: 'Access administrative interface', category: 'system' },
  { id: 'manage_system', name: 'Manage System', description: 'System configuration and maintenance', category: 'system' },
  { id: 'view_system_status', name: 'View System Status', description: 'View system health and status', category: 'system' },
  { id: 'view_analytics', name: 'View Analytics', description: 'View system analytics and reports', category: 'system' },
  { id: 'manage_settings', name: 'Manage Settings', description: 'Configure system settings', category: 'system' }
]

/* ---------- Default Roles ---------- */
const DEFAULT_ROLES = [
  {
    id: 'owner',
    name: 'Owner',
    description: 'Full system access - cannot be modified',
    hierarchy: 100,
    isSystemRole: true,
    permissions: DEFAULT_PERMISSIONS.map(p => p.id) // All permissions
  },
  {
    id: 'admin',
    name: 'Administrator', 
    description: 'Administrative access with user management',
    hierarchy: 90,
    isSystemRole: true,
    permissions: [
      'access_admin', 'manage_users', 'view_users', 'create_users', 'edit_users', 'delete_users',
      'manage_roles', 'manage_permissions', 'view_audit_logs',
      'manage_projects', 'view_projects', 'create_projects', 'edit_projects', 'delete_projects',
      'view_own_profile', 'edit_own_profile', 'view_own_activity', 'manage_own_security', 'upload_avatar',
      'manage_forums', 'view_forums', 'create_posts', 'edit_posts', 'delete_posts', 'moderate_posts',
      'manage_calendar', 'view_calendar', 'create_events', 'edit_events', 'delete_events',
      'view_system_status', 'view_analytics', 'manage_settings',
      // Communications permissions
      'manage_comms', 'view_comms', 'create_comms_projects', 'edit_comms_projects', 'delete_comms_projects',
      'manage_comms_coordinators', 'view_all_regions', 'manage_comms_templates', 'export_comms_data', 'approve_comms_projects'
    ]
  },
  {
    id: 'user',
    name: 'User',
    description: 'Standard user with content access',
    hierarchy: 50,
    isSystemRole: true,
    permissions: [
      'view_users', 'view_projects', 'create_projects', 'edit_projects',
      'view_own_profile', 'edit_own_profile', 'view_own_activity', 'manage_own_security', 'upload_avatar',
      'view_forums', 'create_posts', 'edit_posts',
      'view_calendar', 'create_events', 'edit_events',
      // Basic communications permissions
      'view_comms', 'create_comms_projects', 'edit_comms_projects','post_comms_messages'
    ]
  },
  {
    id: 'viewer',
    name: 'Viewer',
    description: 'Read-only access to content',
    hierarchy: 20,
    isSystemRole: true,
    permissions: [
      'view_users', 'view_projects',
      'view_own_profile', 'view_own_activity',
      'view_forums', 'view_calendar',
      'view_comms' // Can view communications dashboard
    ]
  },
  {
    id: 'pending',
    name: 'Pending Approval',
    description: 'Awaiting administrator approval',
    hierarchy: 10,
    isSystemRole: true,
    permissions: ['view_own_profile'] // Very limited access
  }
]

/* ---------- Permission Categories ---------- */
const PERMISSION_CATEGORIES = {
  user_management: 'User Management',
  content_management: 'Content Management', 
  community: 'Community Features',
  scheduling: 'Calendar & Events',
  communications: 'Communications Dashboard',
  profile: 'Profile Management',
  system: 'System Administration'
}

/* ---------- System Configuration ---------- */
const SYSTEM_CONFIG = {
  DEFAULT_ROLE: 'pending',
  OWNER_PERMISSIONS: 'all',
  ROLE_HIERARCHY_ENABLED: true,
  CUSTOM_PERMISSIONS_ENABLED: true,
  PERMISSION_INHERITANCE: true
}

module.exports = {
  DEFAULT_PERMISSIONS,
  DEFAULT_ROLES,
  PERMISSION_CATEGORIES,
  SYSTEM_CONFIG
}