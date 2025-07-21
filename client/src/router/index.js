// client/src/router/index.js - Enhanced with User Profile Edit Route
import { createRouter, createWebHistory } from 'vue-router'

import LoginView from '../views/LoginView.vue'
import DashboardView from '../views/DashboardView.vue'
import AwaitingApprovalView from '../views/AwaitingApproval.vue'
import AdminView from '../views/AdminView.vue'

import { onAuthStateChanged } from 'firebase/auth'
import { auth } from '../firebase'
import { useAuthStore } from '../stores/auth'

export const router = createRouter({
  history: createWebHistory(),
  routes: [
    { 
      path: '/', 
      name: 'Login', 
      component: LoginView 
    },
    { 
      path: '/awaiting', 
      name: 'Awaiting', 
      component: AwaitingApprovalView,
      meta: { requiresAuth: true } 
    },
    { 
      path: '/dash', 
      name: 'Dashboard', 
      component: DashboardView,
      meta: { requiresAuth: true } 
    },
    { 
      path: '/admin', 
      name: 'Admin', 
      component: AdminView,
      meta: { 
        requiresAuth: true, 
        requiresPermission: 'access_admin'
      } 
    },
    { 
      path: '/auth/action', 
      name: 'auth-action', 
      component: () => import('../views/PasswordResetView.vue'),
      meta: { 
        requiresAuth: false, 
        isPublic: true
      } 
    },    
    
    // PHASE 2: User Profile Management
    { 
      path: '/profile', 
      name: 'Profile', 
      component: () => import('../views/ProfileView.vue'),
      meta: { 
        requiresAuth: true,
        requiresPermission: 'view_own_profile'
      } 
    },

    // NEW: Admin User Profile Edit
    {
      path: '/admin/users/:userId/edit',
      name: 'UserProfileEdit',
      component: () => import('../views/UserProfileEditView.vue'),
      meta: {
        requiresAuth: true,
        requiresPermission: 'edit_users'
      }
    },
    
    // Catch-all 404
    {
      path: '/:pathMatch(.*)*',
      name: 'NotFound',
      component: () => import('../views/NotFoundView.vue')
    }
  ],
})

/* Helper – wait for first auth callback with timeout */
function waitForAuth(timeout = 5000) {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      reject(new Error('Auth timeout'))
    }, timeout)
    
    const off = onAuthStateChanged(auth, () => { 
      clearTimeout(timer)
      off()
      resolve() 
    })
  })
}

/* Enhanced permission check helper */
async function waitForPermissions(store, maxAttempts = 50) {
  if (store.ready) return true
  
  for (let i = 0; i < maxAttempts; i++) {
    await new Promise(resolve => setTimeout(resolve, 100))
    if (store.ready) return true
  }
  
  console.warn('[router] Permissions loading timeout')
  return false
}

/* Navigation guard with improved permission handling */
router.beforeEach(async (to, from) => {
  const store = useAuthStore()
  
  try {
    // 1. Wait for auth state if not loaded
    if (store.user === null) {
      await waitForAuth()
    }
    
    // 2. Allow non-auth routes
    if (!to.meta.requiresAuth) {
      return true
    }
    
    // 3. Require authentication
    if (!store.user) {
      return { name: 'Login' }
    }
    
    // 4. Wait for permissions to load
    const permissionsLoaded = await waitForPermissions(store)
    if (!permissionsLoaded) {
      console.error('[router] Failed to load permissions')
      return { name: 'Login' }
    }
    
    // 5. Handle pending users
    if (store.role === 'pending') {
      if (to.name === 'Awaiting') return true
      return { name: 'Awaiting' }
    }
    
    // 6. Redirect approved users away from awaiting page
    if (store.role !== 'pending' && to.name === 'Awaiting') {
      return { name: 'Dashboard' }
    }
    
    // 7. Special handling for UserProfileEdit route
    if (to.name === 'UserProfileEdit') {
      // Check if user has edit_users permission
      if (!store.hasPermission('edit_users')) {
        console.warn('[router] Access denied: Missing permission "edit_users"')
        return { name: 'Admin' }
      }

      // Additional check: prevent editing own profile via admin route
      // (should use regular /profile route instead)
      const targetUserId = to.params.userId
      if (targetUserId === store.user.uid) {
        console.log('[router] Redirecting to own profile page')
        return { name: 'Profile' }
      }

      // Owners can edit anyone, admins cannot edit other owners
      if (store.role !== 'owner') {
        // We'll validate the target user's role in the component
        // since we need to fetch user data first
      }
    }
    
    // 8. Check single permission requirement
    if (to.meta.requiresPermission && !store.hasPermission(to.meta.requiresPermission)) {
      console.warn(`[router] Access denied: Missing permission '${to.meta.requiresPermission}'`)
      return { name: 'Dashboard' }
    }
    
    // 9. Check multiple permissions (any)
    if (to.meta.requiresAnyPermission && !store.hasAnyPermission(to.meta.requiresAnyPermission)) {
      console.warn(`[router] Access denied: Missing any of permissions:`, to.meta.requiresAnyPermission)
      return { name: 'Dashboard' }
    }
    
    // 10. Check multiple permissions (all)
    if (to.meta.requiresAllPermissions && !store.hasAllPermissions(to.meta.requiresAllPermissions)) {
      console.warn(`[router] Access denied: Missing required permissions:`, to.meta.requiresAllPermissions)
      return { name: 'Dashboard' }
    }
    
    // 11. Role requirement (backwards compatibility)
    if (to.meta.requiresRole) {
      const hasRole = checkRoleAccess(store.role, to.meta.requiresRole)
      if (!hasRole) {
        console.warn(`[router] Access denied: Role '${store.role}' cannot access '${to.meta.requiresRole}' content`)
        return { name: 'Dashboard' }
      }
    }
    
    return true
    
  } catch (error) {
    console.error('[router] Navigation guard error:', error)
    return { name: 'Login' }
  }
})

/* Role hierarchy check helper */
function checkRoleAccess(userRole, requiredRole) {
  // Owner can access everything
  if (userRole === 'owner') return true
  
  // Exact role match
  if (userRole === requiredRole) return true
  
  // Role hierarchy
  const hierarchy = {
    owner: 100,
    admin: 90,
    user: 50,
    viewer: 20,
    pending: 10
  }
  
  const userLevel = hierarchy[userRole] || 0
  const requiredLevel = hierarchy[requiredRole] || 0
  
  return userLevel >= requiredLevel
}

/* Programmatic navigation with permission checks */
export function navigateWithPermissionCheck(route, fallback = '/dash') {
  const store = useAuthStore()
  
  // Get route definition
  const routeRecord = router.getRoutes().find(r => 
    r.name === route.name || r.path === route.path || r.path === route
  )
  
  if (!routeRecord) {
    console.warn(`[router] Route not found: ${route}`)
    router.push(fallback)
    return false
  }
  
  // Check permissions
  if (routeRecord.meta?.requiresPermission && !store.hasPermission(routeRecord.meta.requiresPermission)) {
    console.warn(`[router] Permission denied for route: ${routeRecord.path}`)
    router.push(fallback)
    return false
  }
  
  if (routeRecord.meta?.requiresAnyPermission && !store.hasAnyPermission(routeRecord.meta.requiresAnyPermission)) {
    router.push(fallback)
    return false
  }
  
  if (routeRecord.meta?.requiresAllPermissions && !store.hasAllPermissions(routeRecord.meta.requiresAllPermissions)) {
    router.push(fallback)
    return false
  }
  
  // Navigate if all checks pass
  router.push(route)
  return true
}

/* Route helper to get accessible routes for current user */
export function getAccessibleRoutes() {
  const store = useAuthStore()
  if (!store.user || !store.ready) return []
  
  return router.getRoutes().filter(route => {
    // Skip non-navigable routes
    if (!route.name || route.name === 'Login' || route.name === 'NotFound' || route.name === 'UserProfileEdit') return false
    
    // Check auth requirement
    if (route.meta?.requiresAuth && !store.user) return false
    
    // Check permissions
    if (route.meta?.requiresPermission && !store.hasPermission(route.meta.requiresPermission)) return false
    if (route.meta?.requiresAnyPermission && !store.hasAnyPermission(route.meta.requiresAnyPermission)) return false
    if (route.meta?.requiresAllPermissions && !store.hasAllPermissions(route.meta.requiresAllPermissions)) return false
    
    // Check role
    if (route.meta?.requiresRole && !checkRoleAccess(store.role, route.meta.requiresRole)) return false
    
    return true
  })
}

/* Helper to check if user can access a specific route */
export function canAccessRoute(routeName, params = {}) {
  const store = useAuthStore()
  if (!store.user || !store.ready) return false
  
  const route = router.getRoutes().find(r => r.name === routeName)
  if (!route) return false
  
  // Check basic permissions
  if (route.meta?.requiresAuth && !store.user) return false
  if (route.meta?.requiresPermission && !store.hasPermission(route.meta.requiresPermission)) return false
  if (route.meta?.requiresAnyPermission && !store.hasAnyPermission(route.meta.requiresAnyPermission)) return false
  if (route.meta?.requiresAllPermissions && !store.hasAllPermissions(route.meta.requiresAllPermissions)) return false
  if (route.meta?.requiresRole && !checkRoleAccess(store.role, route.meta.requiresRole)) return false
  
  // Special checks for specific routes
  if (routeName === 'UserProfileEdit') {
    const targetUserId = params.userId
    if (targetUserId === store.user.uid) return false // Use /profile instead
    // Additional role-based checks would be done in component
  }
  
  return true
}

export default router