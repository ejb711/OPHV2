// Pinia store that keeps Firebase Auth <--> Firestore “users” profile in-sync
import { defineStore } from 'pinia'
import { ref } from 'vue'
import {
  getAuth, onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
} from 'firebase/auth'
import { doc, getDoc } from 'firebase/firestore'
import { firebaseApp } from '../firebase'
import { db }          from '../firebase'

const auth = getAuth(firebaseApp)

export const useAuthStore = defineStore('auth', () => {
  /* ---------- state ---------- */
  const user  = ref(null)   // Firebase Auth user
  const role  = ref(null)   // "admin" | "pending" | …
  const ready = ref(false)  // true once (user,role) resolved

  /* ---------- react to auth state ---------- */
  onAuthStateChanged(auth, async (u) => {
    console.log('[auth] state changed:', u?.uid ?? 'signed-out')
    user.value  = u
    role.value  = null
    ready.value = false

    if (!u) {              // signed-out: nothing else to fetch
      ready.value = true
      return
    }

    /* fetch role from /users/{uid} ------------- */
    const snap = await getDoc(doc(db, 'users', u.uid))
    role.value = snap.data()?.role ?? 'pending'
    ready.value = true
    console.log('[auth] role fetched →', role.value)
  })

  /* ---------- actions ---------- */
  const login  = (e, p) => signInWithEmailAndPassword(auth, e, p)
  const signup = (e, p) => createUserWithEmailAndPassword(auth, e, p)
  const logout = ()     => signOut(auth)

  return { user, role, ready, login, signup, logout }
})
