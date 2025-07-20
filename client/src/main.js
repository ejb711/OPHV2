// client/src/main.js - Updated with global CSS imports
import { createApp, watch }      from 'vue'
import { createPinia }           from 'pinia'
import App                       from './App.vue'
import { router }                from './router'
import { vuetify }               from './plugins/vuetify'
import '@mdi/font/css/materialdesignicons.css'

// Import global styles BEFORE any other imports
import './assets/main.css'

import { auth }                  from './firebase'
import { onAuthStateChanged }    from 'firebase/auth'
import { useAuthStore }          from './stores/auth'

/* ────────────────────────────────────────────────
   1.  Hot-reload friendly singleton Vue instance
   ─────────────────────────────────────────────── */
let app = window.__ophv2
if (!app) {
  app = createApp(App)
  app.use(createPinia())
     .use(router)
     .use(vuetify)

  // remember across Vite HMR swaps
  window.__ophv2 = app
}

/* ────────────────────────────────────────────────
   2.  Only mount after the FIRST auth callback
   ─────────────────────────────────────────────── */
let booted = false
onAuthStateChanged(auth, () => {
  if (booted) return
  booted = true

  // install the role-watch once routing is ready
  router.isReady().then(() => {
    const store = useAuthStore()

    watch(
      () => store.role,
      role => {
        const cur = router.currentRoute.value

        // waiting for approval → force '/awaiting'
        if (role === 'pending' && cur.name !== 'Awaiting') {
          router.replace('/awaiting')
        }

        // admin users landing on anything except admin start page
        if (role === 'admin' && cur.name === 'Dashboard') {
          router.replace('/admin')
        }

        // non-admin trying to hit admin page
        if (role !== 'admin' && cur.name === 'Admin') {
          router.replace('/dash')
        }
      },
      { immediate: true }
    )
  })

  app.mount('#app')    // exactly once
})