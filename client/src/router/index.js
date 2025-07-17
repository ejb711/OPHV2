// src/router/index.js
import { createRouter, createWebHistory } from 'vue-router'

import LoginView            from '../views/LoginView.vue'
import DashboardView        from '../views/DashboardView.vue'
import AwaitingApprovalView from '../views/AwaitingApproval.vue'
import AdminView            from '../views/AdminView.vue'

import { onAuthStateChanged } from 'firebase/auth'
import { auth }               from '../firebase'
import { useAuthStore }       from '../stores/auth'

export const router = createRouter({
  history: createWebHistory(),
  routes: [
    { path: '/',          name: 'Login',     component: LoginView },
    { path: '/awaiting',  name: 'Awaiting',  component: AwaitingApprovalView,
      meta: { requiresAuth: true } },
    { path: '/dash',      name: 'Dashboard', component: DashboardView,
      meta: { requiresAuth: true } },
    { path: '/admin',     name: 'Admin',     component: AdminView,
      meta: { requiresAuth: true, requiresRole: 'admin' } },
  ],
})

/* helper – wait exactly once for first auth callback */
function waitForAuth () {
  return new Promise(resolve => {
    const off = onAuthStateChanged(auth, () => { off(); resolve() })
  })
}

router.beforeEach(async to => {
  const store = useAuthStore()
  if (store.user === null) await waitForAuth()   // first load

  /* 1️⃣ must be signed-in */
  if (to.meta.requiresAuth && !store.user) return { name: 'Login' }

  /* 2️⃣ pending users are confined to awaiting page */
  if (store.role === 'pending' && to.name !== 'Awaiting') {
    return { name: 'Awaiting' }
  }

  /* 3️⃣ non-pending users cannot stay on awaiting */
  if (store.role !== 'pending' && to.name === 'Awaiting') {
    return { name: 'Dashboard' }
  }

  /* 4️⃣ admin-only gate */
  if (to.meta.requiresRole === 'admin' && store.role !== 'admin') {
    return { name: 'Dashboard' }
  }

  return true
})
