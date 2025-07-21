// client/src/stores/auth/actions.js - Authentication actions (50 lines)
import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword,
  signOut
} from 'firebase/auth'

/**
 * Creates authentication action functions
 * @param {Object} deps - Dependencies from main store
 * @returns {Object} Authentication methods
 */
export function createAuthActions({ auth, error }) {
  /**
   * Log in with email and password
   */
  async function login(email, password) {
    try {
      error.value = null
      const credential = await signInWithEmailAndPassword(auth, email, password)
      return { success: true, user: credential.user }
    } catch (err) {
      error.value = err.message
      return { success: false, error: err.message }
    }
  }
  
  /**
   * Sign up with email and password
   */
  async function signup(email, password) {
    try {
      error.value = null
      const credential = await createUserWithEmailAndPassword(auth, email, password)
      return { success: true, user: credential.user }
    } catch (err) {
      error.value = err.message
      return { success: false, error: err.message }
    }
  }
  
  /**
   * Sign out the current user
   */
  async function logout() {
    await signOut(auth)
  }
  
  return {
    login,
    signup,
    logout
  }
}