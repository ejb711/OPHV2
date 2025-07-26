// client/src/composables/comms/useCommsProjectsCrud.js
import {
  collection,
  doc,
  getDoc,
  addDoc,
  updateDoc,
  deleteDoc,
  serverTimestamp,
  Timestamp
} from 'firebase/firestore'
import { db } from '@/firebase'
import { useSnackbar } from '@/composables/useSnackbar'
import { useAudit } from '@/composables/useAudit'
import { useCommsProjectPermissions } from './commsProjectPermissions'
import { safeConvertToDate } from './commsProjectsUtils'

/**
 * CRUD operations for communications projects
 * Handles create, read, update, delete operations
 */
export function useCommsProjectsCrud(
  currentUserId,
  currentUserEmail,
  canManageComms,
  setCreating,
  setUpdating,
  setDeleting,
  setError,
  clearError
) {
  const { showError, showSuccess } = useSnackbar()
  const { logEvent } = useAudit()
  const { canViewProject, canEditProject, canDeleteProject } = useCommsProjectPermissions()

  // Create a new project
  async function createProject(projectData) {
    setCreating(true)
    clearError()

    try {
      // Validate required fields
      if (!projectData.title) throw new Error('Project title is required')
      if (!projectData.region) throw new Error('Region is required')

      // Prepare project data
      const newProject = {
        ...projectData,
        // Status will be calculated based on stages, but set initial value
        status: 'not_started',
        priority: projectData.priority || 'medium',
        requiresApproval: projectData.requiresApproval !== false,
        currentStageIndex: 0,
        viewCount: 0,
        deleted: false,
        createdAt: serverTimestamp(),
        createdBy: currentUserId.value,
        createdByEmail: currentUserEmail.value,
        updatedAt: serverTimestamp()
      }

      // Handle coordinator data
      if (projectData.coordinatorId) {
        // newProject.coordinatorId = projectData.coordinatorId
        // We'll need to fetch coordinator name from the coordinators collection
        try {
          const coordDoc = await getDoc(doc(db, 'comms_coordinators', projectData.coordinatorId))
          if (coordDoc.exists()) {
            const coordData = coordDoc.data()
            newProject.coordinatorName = coordData.name || coordData.displayName || coordData.email
            newProject.coordinatorEmail = coordData.email
            // } else {
            }
        } catch (err) {
          // Coordinator lookup failed, continue without coordinator data
        }
      } else {
        // No coordinator assigned
      }

      // Create in Firestore
      const docRef = await addDoc(collection(db, 'comms_projects'), newProject)

      // // Log the action
      await logEvent('create_comms_project', {
        projectId: docRef.id,
        projectTitle: newProject.title,
        region: newProject.region
      })

      // Fetch the created project to get the actual timestamp values
      const createdDoc = await getDoc(docRef)
      const createdData = createdDoc.data()
      const returnedProject = {
        id: docRef.id,
        ...createdData,
        createdAt: safeConvertToDate(createdData.createdAt),
        updatedAt: safeConvertToDate(createdData.updatedAt),
        deadline: safeConvertToDate(createdData.deadline)
      }

      // showSuccess('Project created successfully')

      return returnedProject

    } catch (error) {
      setError(error.message)
      showError(error.message || 'Failed to create project')
      throw error
    } finally {
      setCreating(false)
    }
  }

  // Update an existing project
  async function updateProject(projectId, updates) {
    setUpdating(true)
    clearError()

    try {
      // Clean up undefined values
      const cleanUpdates = Object.entries(updates).reduce((acc, [key, value]) => {
        if (value !== undefined) {
          acc[key] = value
        }
        return acc
      }, {})

      // Add metadata
      const updateData = {
        ...cleanUpdates,
        updatedAt: serverTimestamp(),
        updatedBy: currentUserId.value,
        updatedByEmail: currentUserEmail.value
      }

      // Special handling for deadline to ensure it's a Timestamp
      if (updates.deadline !== undefined) {
        const deadlineDate = updates.deadline ? new Date(updates.deadline) : null
        updateData.deadline = deadlineDate ? Timestamp.fromDate(deadlineDate) : null
      }

      // Update in Firestore
      await updateDoc(doc(db, 'comms_projects', projectId), updateData)

      // Log the action
      await logEvent('update_comms_project', {
        projectId,
        updatedFields: Object.keys(updates)
      })

      showSuccess('Project updated successfully')

    } catch (error) {
      setError(error.message)
      showError(error.message || 'Failed to update project')
      throw error
    } finally {
      setUpdating(false)
    }
  }

  // Soft delete project (move to trash)
  async function softDeleteProject(projectId) {
    setDeleting(true)
    clearError()

    try {
      const projectDoc = await getDoc(doc(db, 'comms_projects', projectId))

      if (!projectDoc.exists()) {
        throw new Error('Project not found')
      }

      const project = { id: projectDoc.id, ...projectDoc.data() }

      if (!canDeleteProject(project)) {
        throw new Error('You do not have permission to delete this project')
      }

      await updateDoc(doc(db, 'comms_projects', projectId), {
        deleted: true,
        deletedAt: serverTimestamp(),
        deletedBy: currentUserId.value
      })

      await logEvent('soft_delete_comms_project', {
        projectId,
        projectTitle: project.title
      })

      showSuccess('Project moved to trash')
      return true

    } catch (err) {
      setError(err.message)
      showError(err.message || 'Failed to delete project')
      throw err
    } finally {
      setDeleting(false)
    }
  }

  // Hard delete project (permanent)
  async function hardDeleteProject(projectId) {
    setDeleting(true)
    clearError()

    try {
      const projectDoc = await getDoc(doc(db, 'comms_projects', projectId))

      if (!projectDoc.exists()) {
        throw new Error('Project not found')
      }

      const project = { id: projectDoc.id, ...projectDoc.data() }

      if (!canManageComms.value) {
        throw new Error('Only administrators can permanently delete projects')
      }

      await deleteDoc(doc(db, 'comms_projects', projectId))

      await logEvent('hard_delete_comms_project', {
        projectId,
        projectTitle: project.title
      })

      showSuccess('Project permanently deleted')
      return true

    } catch (err) {
      setError(err.message)
      showError(err.message || 'Failed to permanently delete project')
      throw err
    } finally {
      setDeleting(false)
    }
  }

  // Get a single project by ID
  async function getProject(projectId) {
    try {
      const docSnap = await getDoc(doc(db, 'comms_projects', projectId))

      if (!docSnap.exists()) {
        throw new Error('Project not found')
      }

      const data = docSnap.data()
      const project = {
        id: docSnap.id,
        ...data,
        createdAt: safeConvertToDate(data.createdAt),
        updatedAt: safeConvertToDate(data.updatedAt),
        deadline: safeConvertToDate(data.deadline),
        completedAt: safeConvertToDate(data.completedAt),
        deletedAt: safeConvertToDate(data.deletedAt)
      }

      if (!canViewProject(project)) {
        throw new Error('You do not have permission to view this project')
      }

      await updateDoc(doc(db, 'comms_projects', projectId), {
        viewCount: (project.viewCount || 0) + 1,
        lastViewedAt: serverTimestamp(),
        lastViewedBy: currentUserId.value
      })

      return project
    } catch (error) {
      showError(error.message || 'Failed to load project')
      throw error
    }
  }

  // Restore soft-deleted project
  async function restoreProject(projectId) {
    try {
      await updateDoc(doc(db, 'comms_projects', projectId), {
        deleted: false,
        deletedAt: null,
        deletedBy: null,
        restoredAt: serverTimestamp(),
        restoredBy: currentUserId.value
      })

      await logEvent('restore_comms_project', { projectId })
      showSuccess('Project restored successfully')

    } catch (error) {
      showError('Failed to restore project')
      throw error
    }
  }

  return {
    createProject,
    updateProject,
    softDeleteProject,
    hardDeleteProject,
    getProject,
    restoreProject
  }
}