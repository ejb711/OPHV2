// client/src/composables/useUserManagement.js
import { ref, computed, onMounted } from 'vue'
import { usePermissionsStore } from '@/stores/permissions'
import { useAuthStore } from '@/stores/auth'
import { useAudit } from '@/composables/useAudit'
import { getFunctions, httpsCallable } from 'firebase/functions'
import { sendPasswordResetEmail } from 'firebase/auth'
import { auth } from '@/firebase'

export function useUserManagement() {
  // Stores & Composables
  const permissionsStore = usePermissionsStore()
  const authStore = useAuthStore()
  const { logEvent } = useAudit()
  const functions = getFunctions()

  // Reactive Data
  const loading = ref(false)
  const search = ref('')
  const roleFilter = ref(null)
  const showCreateDialog = ref(false)
  const showEditDialog = ref(false)
  const showDeleteDialog = ref(false)
  const showPasswordResetDialog = ref(false)
  const editingUser = ref(null)
  const userToDelete = ref(null)
  const passwordResetUser = ref(null)
  const saving = ref(false)
  const deleting = ref(false)
  const resettingPassword = ref(false)

  // Snackbar function (will be overridden by parent)
  const showSnackbar = ref(() => {})

  // Computed Properties
  const availableRoles = computed(() => permissionsStore.roles || [])
  const availablePermissions = computed(() => permissionsStore.permissions || [])

  const roleFilterOptions = computed(() => [
    { title: 'All Roles', value: null },
    ...availableRoles.value.map(role => ({
      title: role.name,
      value: role.id
    }))
  ])

  const filteredUsers = computed(() => {
    let users = permissionsStore.allUsers || []
    
    if (roleFilter.value) {
      users = users.filter(user => user.role === roleFilter.value)
    }
    
    return users
  })

  const totalUsers = computed(() => filteredUsers.value.length)
  const activeUsers = computed(() => filteredUsers.value.filter(u => (u.status || 'active') === 'active').length)
  const pendingUsers = computed(() => filteredUsers.value.filter(u => u.role === 'pending').length)

  // Methods
  const refresh = async () => {
    loading.value = true
    try {
      await permissionsStore.loadAllData()
    } catch (error) {
      console.error('Error refreshing data:', error)
      showSnackbar.value('Error refreshing user data', 'error')
    } finally {
      loading.value = false
    }
  }

  const handleEditUser = (user) => {
    editingUser.value = user
    showEditDialog.value = true
  }

  const confirmDeleteUser = (user) => {
    userToDelete.value = user
    showDeleteDialog.value = true
  }

  const deleteUser = async () => {
    if (!userToDelete.value) return
    
    deleting.value = true
    try {
      // Call the Firebase Cloud Function
      const deleteUserFunction = httpsCallable(functions, 'deleteUser')
      const result = await deleteUserFunction({ 
        userId: userToDelete.value.id,
        reason: 'Deleted by admin from user management panel'
      })
      
      // Log the deletion
      await logEvent('user_deleted', {
        targetUserId: userToDelete.value.id,
        targetUserEmail: userToDelete.value.email,
        performedBy: authStore.currentUser?.email
      })
      
      showSnackbar.value(`User ${userToDelete.value.email} has been deleted successfully`, 'success')
      
      // Close dialog and refresh
      showDeleteDialog.value = false
      userToDelete.value = null
      await refresh()
      
    } catch (error) {
      console.error('Error deleting user:', error)
      showSnackbar.value(error.message || 'Failed to delete user. Please try again.', 'error')
    } finally {
      deleting.value = false
    }
  }

  const cancelEdit = () => {
    showEditDialog.value = false
    editingUser.value = null
  }

  const saveUserEdit = async (formData) => {
    if (!formData) return
    
    try {
      saving.value = true
      
      // Update role if changed
      if (formData.role !== editingUser.value.role) {
        const result = await permissionsStore.updateUserRole(
          formData.id,
          formData.role
        )
        
        if (!result.success) {
          throw new Error(result.error || 'Failed to update role')
        }
      }
      
      // Update custom permissions
      const result = await permissionsStore.updateUserCustomPermissions(
        formData.id,
        formData.customPermissions,
        formData.deniedPermissions
      )
      
      if (result.success) {
        await logEvent('user_permissions_updated', {
          targetUserId: formData.id,
          targetUserEmail: formData.email,
          changes: {
            role: formData.role,
            customPermissions: formData.customPermissions,
            deniedPermissions: formData.deniedPermissions
          }
        })
        
        showSnackbar.value('User permissions updated successfully', 'success')
        cancelEdit()
        await refresh()
      } else {
        throw new Error(result.error || 'Failed to update user')
      }
    } catch (error) {
      console.error('Error updating user:', error)
      showSnackbar.value(error.message || 'Failed to update user', 'error')
    } finally {
      saving.value = false
    }
  }

  const handleUserCreated = async (userData) => {
    showCreateDialog.value = false
    await refresh()
    showSnackbar.value('User created successfully', 'success')
  }

  const handleUpdateRole = async (user, newRole) => {
    if (user.role === newRole) return
    
    try {
      const result = await permissionsStore.updateUserRole(user.id, newRole)
      
      if (result.success) {
        await logEvent('user_role_updated', {
          targetUserId: user.id,
          targetUserEmail: user.email,
          oldRole: user.role,
          newRole: newRole
        })
        
        showSnackbar.value(`Updated ${user.email} role to ${newRole}`, 'success')
        await refresh()
      } else {
        throw new Error(result.error || 'Failed to update role')
      }
    } catch (error) {
      console.error('Error updating user role:', error)
      showSnackbar.value(error.message || 'Failed to update user role', 'error')
    }
  }

  const handleToggleStatus = async (user) => {
    const currentStatus = user.status || 'active'
    const newStatus = currentStatus === 'active' ? 'suspended' : 'active'
    
    try {
      // Call update status function
      const updateStatusFunction = httpsCallable(functions, 'updateUserStatus')
      await updateStatusFunction({ 
        userId: user.id, 
        status: newStatus 
      })
      
      await logEvent('user_status_updated', {
        targetUserId: user.id,
        targetUserEmail: user.email,
        oldStatus: currentStatus,
        newStatus: newStatus
      })
      
      showSnackbar.value(`User ${user.email} ${newStatus}`, 'success')
      await refresh()
    } catch (error) {
      console.error('Error toggling user status:', error)
      showSnackbar.value('Failed to toggle user status', 'error')
    }
  }

  const sendPasswordReset = async () => {
    if (!passwordResetUser.value) return
    
    resettingPassword.value = true
    try {
      await sendPasswordResetEmail(auth, passwordResetUser.value.email)
      
      await logEvent('password_reset_sent', {
        targetUserId: passwordResetUser.value.id,
        targetUserEmail: passwordResetUser.value.email
      })
      
      showSnackbar.value(`Password reset email sent to ${passwordResetUser.value.email}`, 'success')
      showPasswordResetDialog.value = false
      passwordResetUser.value = null
    } catch (error) {
      console.error('Error sending password reset:', error)
      showSnackbar.value('Failed to send password reset email', 'error')
    } finally {
      resettingPassword.value = false
    }
  }

  // Load initial data
  onMounted(async () => {
    await refresh()
  })

  return {
    // Data
    loading,
    search,
    roleFilter,
    showCreateDialog,
    showEditDialog,
    showDeleteDialog,
    showPasswordResetDialog,
    editingUser,
    userToDelete,
    passwordResetUser,
    saving,
    deleting,
    resettingPassword,
    availableRoles,
    availablePermissions,
    filteredUsers,
    // Computed
    roleFilterOptions,
    totalUsers,
    activeUsers,
    pendingUsers,
    // Methods
    refresh,
    handleEditUser,
    confirmDeleteUser,
    deleteUser,
    cancelEdit,
    saveUserEdit,
    handleUserCreated,
    handleUpdateRole,
    handleToggleStatus,
    sendPasswordReset,
    showSnackbar
  }
}