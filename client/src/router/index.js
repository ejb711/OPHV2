// client/src/router/index.js - Updated with Profile Route
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
        requiresPermission: 'manage_users'
      } 
    },
    
    // 🆕 PHASE 2: User Profile Management
    { 
      path: '/profile', 
      name: 'Profile', 
      component: () => import('../views/ProfileView.vue'),
      meta: { 
        requiresAuth: true
        // Note: Will add 'view_own_profile' permission after creating profile permissions
      } 
    },
    
    // 🔮 FUTURE ROUTES (Phase 2 & 3) - Commented out until components are implemented
    // PHASE 2: Core Features
    // { 
    //   path: '/projects', 
    //   name: 'Projects', 
    //   component: () => import('../views/ProjectView.vue'),
    //   meta: { 
    //     requiresAuth: true, 
    //     requiresPermission: 'view_projects'
    //   } 
    // },
    // { 
    //   path: '/forums', 
    //   name: 'Forums', 
    //   component: () => import('../views/ForumView.vue'),
    //   meta: { 
    //     requiresAuth: true, 
    //     requiresPermission: 'view_forums'
    //   } 
    // },
    // { 
    //   path: '/calendar', 
    //   name: 'Calendar', 
    //   component: () => import('../views/CalendarView.vue'),
    //   meta: { 
    //     requiresAuth: true, 
    //     requiresPermission: 'view_calendar'
    //   } 
    // }
  ],
})

/* helper – wait exactly once for first auth callback */
function waitForAuth() {
  return new Promise(resolve => {
    const off = onAuthStateChanged(auth, () => { off(); resolve() })
  })
}

router.beforeEach(async to => {
  const store = useAuthStore()
  
  // Wait for auth state if not already loaded
  if (store.user === null) await waitForAuth()
  
  // Wait for permissions to load
  if (store.user && !store.ready) {
    await new Promise(resolve => {
      const interval = setInterval(() => {
        if (store.ready) {
          clearInterval(interval)
          resolve()
        }
      }, 100)
    })
  }

  /* 1️⃣ Authentication required */
  if (to.meta.requiresAuth && !store.user) {
    return { name: 'Login' }
  }

  /* 2️⃣ Pending users confined to awaiting page */
  if (store.role === 'pending' && to.name !== 'Awaiting') {
    return { name: 'Awaiting' }
  }

  /* 3️⃣ Non-pending users cannot stay on awaiting */
  if (store.role !== 'pending' && to.name === 'Awaiting') {
    return { name: 'Dashboard' }
  }

  /* 4️⃣ Single permission requirement */
  if (to.meta.requiresPermission && !store.hasPermission(to.meta.requiresPermission)) {
    
    // 🚨 TEMPORARY FIX: Add fallback for admin users while permission system initializes
    if (store.role === 'admin' && store.effectivePermissions.length === 0) {
      const adminFallbackPermissions = [
        'manage_users', 'view_users', 'access_admin', 'manage_roles', 'view_audit_logs'
        // Project permissions removed - feature on hold
      ]
      if (adminFallbackPermissions.includes(to.meta.requiresPermission)) {
        console.log(`[router] 🔧 Admin fallback permission granted: ${to.meta.requiresPermission}`)
        return true // Allow access with fallback
      }
    }
  
    console.warn(`Access denied: Missing permission '${to.meta.requiresPermission}'`)
    return { name: 'Dashboard' }
  }

  /* 5️⃣ Any permission requirement (user needs at least one) */
  if (to.meta.requiresAnyPermission && !store.hasAnyPermission(to.meta.requiresAnyPermission)) {
    console.warn(`Access denied: Missing any of permissions:`, to.meta.requiresAnyPermission)
    return { name: 'Dashboard' }
  }

  /* 6️⃣ All permissions requirement (user needs all) */
  if (to.meta.requiresAllPermissions && !store.hasAllPermissions(to.meta.requiresAllPermissions)) {
    console.warn(`Access denied: Missing required permissions:`, to.meta.requiresAllPermissions)
    return { name: 'Dashboard' }
  }

  /* 7️⃣ Role requirement (backwards compatibility) */
  if (to.meta.requiresRole) {
    const requiredRole = to.meta.requiresRole
    const userRole = store.role
    
    // Owner can access everything
    if (userRole === 'owner') return true
    
    // Exact role match
    if (userRole === requiredRole) return true
    
    // Admin can access user/viewer content
    if (userRole === 'admin' && ['user', 'viewer'].includes(requiredRole)) return true
    
    // User can access viewer content
    if (userRole === 'user' && requiredRole === 'viewer') return true
    
    console.warn(`Access denied: Role '${userRole}' cannot access '${requiredRole}' content`)
    return { name: 'Dashboard' }
  }

  return true
})

/* Router helper for programmatic navigation with permission checks */
export function navigateWithPermissionCheck(route, fallback = '/dash') {
  const store = useAuthStore()
  
  // Get route definition
  const routeRecord = router.getRoutes().find(r => r.name === route.name || r.path === route.path)
  
  if (!routeRecord) {
    router.push(fallback)
    return false
  }
  
  // Check permissions
  if (routeRecord.meta?.requiresPermission && !store.hasPermission(routeRecord.meta.requiresPermission)) {
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

export default router