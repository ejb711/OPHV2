// client/src/composables/comms/useCommsProjects.js
import {
  collection,
  query,
  orderBy,
  onSnapshot,
  Timestamp
} from 'firebase/firestore'
import { db } from '@/firebase'
import { usePermissions } from '@/composables/usePermissions'
import { useSnackbar } from '@/composables/useSnackbar'
import { useCommsProjectPermissions } from './commsProjectPermissions'
import { useCommsProjectsState } from './useCommsProjectsState'
import { useCommsProjectsFilters } from './useCommsProjectsFilters'
import { useCommsProjectsCrud } from './useCommsProjectsCrud'
import { safeConvertToDate } from './commsProjectsUtils'

/**
 * Main composable for communications projects
 * Orchestrates state, filters, and CRUD operations
 */
export function useCommsProjects() {
  // Permissions
  const { canManageComms } = usePermissions()
  const { canViewProject, canEditProject, canDeleteProject } = useCommsProjectPermissions()
  const { showError } = useSnackbar()

  // Initialize state management
  const {
    projects,
    loading,
    creating,
    updating,
    deleting,
    error,
    filterRegion,
    filterStatus,
    filterPriority,
    filterCoordinator,
    filterSearch,
    filterDeleted,
    setProjects,
    setLoading,
    setCreating,
    setUpdating,
    setDeleting,
    setError,
    clearError,
    setFilter,
    clearFilters
  } = useCommsProjectsState()

  // Initialize filters
  const {
    currentUserId,
    currentUserEmail,
    coordinatorRegions,
    filteredProjects,
    projectStats,
    activeProjectsCount,
    completedProjectsCount,
    myProjectsCount,
    highPriorityProjects,
    upcomingDeadlines
  } = useCommsProjectsFilters(
    projects,
    filterRegion,
    filterStatus,
    filterPriority,
    filterCoordinator,
    filterSearch,
    filterDeleted
  )

  // Initialize CRUD operations
  const {
    createProject,
    updateProject,
    softDeleteProject,
    hardDeleteProject,
    getProject,
    restoreProject
  } = useCommsProjectsCrud(
    currentUserId,
    currentUserEmail,
    canManageComms,
    setCreating,
    setUpdating,
    setDeleting,
    setError,
    clearError
  )

  // Initialize projects listener
  function initialize() {
    setLoading(true)
    clearError()

    try {
      // Build query
      let q = query(
        collection(db, 'comms_projects'),
        orderBy('createdAt', 'desc')
      )

      // Set up real-time listener
      const unsubscribe = onSnapshot(q,
        (snapshot) => {
          const projectsData = snapshot.docs.map(doc => {
            const data = doc.data()
            return {
              id: doc.id,
              ...data,
              // Safely convert timestamp fields
              createdAt: safeConvertToDate(data.createdAt),
              updatedAt: safeConvertToDate(data.updatedAt),
              deadline: safeConvertToDate(data.deadline),
              completedAt: safeConvertToDate(data.completedAt),
              deletedAt: safeConvertToDate(data.deletedAt)
            }
          })

          setProjects(projectsData)
          setLoading(false)
        },
        (err) => {
          setError(err.message)
          setLoading(false)
          showError('Failed to load projects')
        }
      )

      return unsubscribe
    } catch (err) {
      setError(err.message)
      setLoading(false)
      showError('Failed to initialize projects')
      return null
    }
  }

  return {
    // State
    projects,
    loading,
    creating,
    updating,
    deleting,
    error,

    // Computed
    filteredProjects,
    projectStats,
    coordinatorRegions,
    activeProjectsCount,
    completedProjectsCount,
    myProjectsCount,
    highPriorityProjects,
    upcomingDeadlines,

    // Methods
    initialize,
    setFilter,
    clearFilters,
    createProject,
    updateProject,
    softDeleteProject,
    hardDeleteProject,
    getProject,
    restoreProject,

    // Permission checks
    canViewProject,
    canEditProject,
    canDeleteProject
  }
}