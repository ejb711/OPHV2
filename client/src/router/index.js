// client/src/router/index.js - Enhanced with permission-based routing
import { createRouter, createWebHistory } from 'vue-router'

import LoginView from '../views/LoginView.vue'
import DashboardView from '../views/DashboardView.vue'
import AwaitingApprovalView from '../views/AwaitingApproval.vue'
import AdminView from '../views/AdminView.vue'
// import RoleManagementView from '../views/RoleManagementView.vue' // Create this component first

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
    // Role Management - Create this view component first
    // { 
    //   path: '/admin/roles', 
    //   name: 'RoleManagement', 
    //   component: () => import('../views/RoleManagementView.vue'),
    //   meta: { 
    //     requiresAuth: true, 
    //     requiresAnyPermission: ['manage_users', 'manage_roles', 'manage_permissions']
    //   } 
    // },
    // Future routes will be added here as we create the view components
    // Examples:
    // { 
    //   path: '/projects', 
    //   name: 'Projects', 
    //   component: () => import('../views/ProjectsView.vue'),
    //   meta: { 
    //     requiresAuth: true, 
    //     requiresPermission: 'view_projects'
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