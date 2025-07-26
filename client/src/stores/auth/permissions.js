// client/src/stores/auth/permissions.js - Permission handling logic (120 lines)
import { doc, getDoc } from 'firebase/firestore'
import { db } from '@/firebase'

/**
 * Creates permission handling functions for the auth store
 * @param {Object} deps - Dependencies from main store
 * @returns {Object} Permission handling methods
 */
export function createPermissionHandlers({ role, isOwner, effectivePermissions, rolePermissions }) {
  // Permission cache for performance
  let permissionCache = new Map()

  /**
   * Check if user has a specific permission
   */
  function hasPermission(permission) {
    // Owners have all permissions
    if (isOwner.value) return true

    // Check cache first
    if (permissionCache.has(permission)) {
      return permissionCache.get(permission)
    }

    // Check effective permissions
    const hasIt = effectivePermissions.value.has(permission)
    permissionCache.set(permission, hasIt)
    return hasIt
  }

  /**
   * Check if user has any of the specified permissions
   */
  function hasAnyPermission(permissions) {
    return permissions.some(p => hasPermission(p))
  }

  /**
   * Check if user has all of the specified permissions
   */
  function hasAllPermissions(permissions) {
    return permissions.every(p => hasPermission(p))
  }

  /**
   * Clear the permission cache (call after permission changes)
   */
  function clearPermissionCache() {
    permissionCache.clear()
  }

  /**
   * Check if user can manage a specific role based on hierarchy
   */
  function canManageRole(targetRole) {
    if (!hasPermission('manage_roles')) return false

    // Define role hierarchy
    const hierarchy = {
      'owner': 100,
      'admin': 90,
      'user': 50,
      'viewer': 20,
      'pending': 10
    }

    const userHierarchy = hierarchy[role.value] || 0
    const targetHierarchy = hierarchy[targetRole] || 0

    // Can only manage roles below your hierarchy
    return userHierarchy > targetHierarchy
  }

  /**
   * Fetch permissions for a specific role from Firestore
   */
  async function fetchRolePermissions(roleName) {
    try {
      const roleDoc = await getDoc(doc(db, 'roles', roleName))

      if (roleDoc.exists()) {
        const roleData = roleDoc.data()
        const permissions = roleData.permissions || []

        rolePermissions.value = new Set(permissions)
        clearPermissionCache()

        } else {
        rolePermissions.value = new Set()
      }
    } catch (err) {
      rolePermissions.value = new Set()
    }
  }

  return {
    hasPermission,
    hasAnyPermission,
    hasAllPermissions,
    canManageRole,
    fetchRolePermissions,
    clearPermissionCache
  }
}