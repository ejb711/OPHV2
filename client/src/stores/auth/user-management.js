// client/src/stores/auth/user-management.js - User document management (140 lines)
import { doc, getDoc, onSnapshot } from 'firebase/firestore'
import { db, auth } from '@/firebase'

/**
 * Creates user management functions for the auth store
 * @param {Object} deps - Dependencies from main store
 * @returns {Object} User management methods
 */
export function createUserManagement({
  user,
  role,
  userDocument,
  rolePermissions,
  customPermissions,
  deniedPermissions,
  error,
  fetchRolePermissions,
  clearPermissionCache
}) {
  // Keep track of Firestore listener
  let userDocUnsubscribe = null

  /**
   * Fetch user permissions and document from Firestore
   */
  async function fetchUserPermissions(uid) {
    if (!uid) return

    try {
      // Clear existing permissions
      rolePermissions.value.clear()
      customPermissions.value = []
      deniedPermissions.value = []
      clearPermissionCache()

      // Get user document
      const userDoc = await getDoc(doc(db, 'users', uid))

      if (userDoc.exists()) {
        const userData = userDoc.data()

        // Set user document in store
        userDocument.value = { id: userDoc.id, ...userData }

        // Set role
        role.value = userData.role || 'pending'

        // Set custom permissions
        customPermissions.value = userData.customPermissions || []
        deniedPermissions.value = userData.deniedPermissions || []

        // Fetch role permissions if not pending
        if (role.value !== 'pending') {
          await fetchRolePermissions(role.value)
        }

        // Set up real-time listener for user document changes
        setupUserDocumentListener(uid)
      } else {
        role.value = 'pending'
        userDocument.value = null
      }
    } catch (err) {
      error.value = err.message
      role.value = 'pending'
      userDocument.value = null
    }
  }

  /**
   * Set up real-time listener for user document changes
   */
  function setupUserDocumentListener(uid) {
    // Clean up existing listener
    if (userDocUnsubscribe) {
      userDocUnsubscribe()
    }

    userDocUnsubscribe = onSnapshot(doc(db, 'users', uid), (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.data()
        userDocument.value = { id: snapshot.id, ...data }

        // Update role and permissions if they changed
        if (data.role !== role.value) {
          role.value = data.role || 'pending'
          if (role.value !== 'pending') {
            fetchRolePermissions(role.value)
          }
        }

        // Update custom permissions if they changed
        if (JSON.stringify(data.customPermissions) !== JSON.stringify(customPermissions.value) ||
            JSON.stringify(data.deniedPermissions) !== JSON.stringify(deniedPermissions.value)) {
          customPermissions.value = data.customPermissions || []
          deniedPermissions.value = data.deniedPermissions || []
          clearPermissionCache()
        }
      }
    }, (error) => {
      })
  }

  /**
   * Get user document (one-time fetch)
   */
  async function getUserDocument() {
    if (!user.value) return null

    try {
      const userDoc = await getDoc(doc(db, 'users', user.value.uid))
      return userDoc.exists() ? userDoc.data() : null
    } catch (error) {
      return null
    }
  }

  /**
   * Refresh current user from Firebase Auth
   */
  async function refreshCurrentUser() {
    if (!user.value) return

    try {
      await auth.currentUser.reload()
      // The onAuthStateChanged listener will automatically update
    } catch (error) {
      }
  }

  /**
   * Clean up all listeners
   */
  function cleanupListeners() {
    if (userDocUnsubscribe) {
      userDocUnsubscribe()
      userDocUnsubscribe = null
    }
  }

  return {
    fetchUserPermissions,
    getUserDocument,
    refreshCurrentUser,
    cleanupListeners
  }
}