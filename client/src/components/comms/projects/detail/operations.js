import { onSnapshot, doc } from 'firebase/firestore'
import { db } from '@/firebase'

export function createProjectOperations(state, computed, editOperations, { 
  getProject, 
  softDeleteProject, 
  hardDeleteProject, 
  logEvent, 
  showError 
}) {
  async function open(projectId) {
    if (!projectId) return
    
    state.loading.value = true
    state.error.value = null
    state.dialogOpen.value = true
    
    try {
      const projectData = await getProject(projectId)
      state.project.value = projectData
      editOperations.resetEditedProject()
      
      state.unsubscribe = onSnapshot(doc(db, 'comms_projects', projectId), (doc) => {
        if (doc.exists()) {
          state.project.value = { id: doc.id, ...doc.data() }
          
          if (!state.editing.value) {
            editOperations.resetEditedProject()
          }
        } else {
          state.error.value = 'Project not found'
          state.project.value = null
        }
      })
      
    } catch (err) {
      console.error('Error loading project:', err)
      state.error.value = err.message || 'Failed to load project'
    } finally {
      state.loading.value = false
    }
  }

  function handleDelete() {
    state.deleteDialog.value = true
  }

  async function confirmDelete(hardDelete = false) {
    if (!state.project.value) return
    
    state.deleting.value = true
    
    try {
      if (hardDelete) {
        await hardDeleteProject(state.project.value.id)
        await logEvent('project_hard_deleted', {
          projectId: state.project.value.id,
          projectTitle: state.project.value.title
        })
      } else {
        await softDeleteProject(state.project.value.id)
        await logEvent('project_soft_deleted', {
          projectId: state.project.value.id,
          projectTitle: state.project.value.title
        })
      }
      
      close(computed)
      
    } catch (err) {
      console.error('Error deleting project:', err)
      showError(err.message || 'Failed to delete project')
    } finally {
      state.deleting.value = false
      state.deleteDialog.value = false
    }
  }

  function close(computed) {
    if (state.editing.value && computed.hasChanges?.value) {
      if (!confirm('You have unsaved changes. Are you sure you want to close?')) {
        return
      }
    }
    
    if (state.unsubscribe) {
      state.unsubscribe()
      state.unsubscribe = null
    }
    
    state.dialogOpen.value = false
    state.project.value = null
    state.editedProject.value = {}
    state.editing.value = false
    state.error.value = null
    state.activeTab.value = 'details'
  }

  return {
    open,
    close,
    handleDelete,
    confirmDelete
  }
}