// client/src/components/comms/projects/detail/useProjectDetail.js
import { ref, computed, watch, onMounted, onUnmounted } from 'vue'
import { onSnapshot, doc } from 'firebase/firestore'
import { db } from '@/firebase'
import { useCommsProjects } from '@/composables/comms/useCommsProjects'
import { useSnackbar } from '@/composables/useSnackbar'
import { useAudit } from '@/composables/useAudit'

export function useProjectDetail() {
  // Composables
  const { 
    getProject, 
    updateProject,
    softDeleteProject,
    hardDeleteProject,
    canEditProject 
  } = useCommsProjects()
  const { showError, showSuccess } = useSnackbar()
  const { logEvent } = useAudit()

  // State
  const dialogOpen = ref(false)
  const project = ref(null)
  const editedProject = ref({})
  const editing = ref(false)
  const saving = ref(false)
  const loading = ref(false)
  const error = ref(null)
  const activeTab = ref('details')
  const deleteDialog = ref(false)
  const deleting = ref(false)

  // Real-time listener
  let unsubscribe = null

  // Computed
  const canEdit = computed(() => {
    return project.value && canEditProject(project.value)
  })

  const hasChanges = computed(() => {
    if (!project.value || !editing.value) return false
    
    // Check if any field has changed
    const fields = ['title', 'description', 'region', 'coordinatorId', 
                    'priority', 'deadline', 'tags', 'stages', 'currentStageIndex']
    
    return fields.some(field => {
      const original = project.value[field]
      const edited = editedProject.value[field]
      
      // Handle date comparison
      if (field === 'deadline') {
        const origDate = original?.toDate ? original.toDate() : original
        const editDate = edited?.toDate ? edited.toDate() : edited
        return origDate?.getTime() !== editDate?.getTime()
      }
      
      // Handle array comparison
      if (Array.isArray(original)) {
        return JSON.stringify(original) !== JSON.stringify(edited)
      }
      
      return original !== edited
    })
  })

  // Methods
  async function open(projectId) {
    if (!projectId) return
    
    loading.value = true
    error.value = null
    dialogOpen.value = true
    
    try {
      // Load initial project data
      const projectData = await getProject(projectId)
      project.value = projectData
      resetEditedProject()
      
      // Set up real-time listener
      unsubscribe = onSnapshot(doc(db, 'comms_projects', projectId), (doc) => {
        if (doc.exists()) {
          project.value = { id: doc.id, ...doc.data() }
          
          // Only reset edited if not currently editing
          if (!editing.value) {
            resetEditedProject()
          }
        } else {
          error.value = 'Project not found'
          project.value = null
        }
      })
      
    } catch (err) {
      console.error('Error loading project:', err)
      error.value = err.message || 'Failed to load project'
    } finally {
      loading.value = false
    }
  }

  function close() {
    if (editing.value && hasChanges.value) {
      if (!confirm('You have unsaved changes. Are you sure you want to close?')) {
        return
      }
    }
    
    // Clean up listener
    if (unsubscribe) {
      unsubscribe()
      unsubscribe = null
    }
    
    dialogOpen.value = false
    project.value = null
    editedProject.value = {}
    editing.value = false
    error.value = null
    activeTab.value = 'details'
  }

  function handleClose() {
    close()
  }

  function startEdit() {
    editing.value = true
    resetEditedProject()
  }

  function cancelEdit() {
    if (hasChanges.value) {
      if (!confirm('Are you sure you want to discard your changes?')) {
        return
      }
    }
    
    editing.value = false
    resetEditedProject()
  }

  function resetEditedProject() {
    if (!project.value) return
    
    editedProject.value = {
      title: project.value.title,
      description: project.value.description || '',
      region: project.value.region,
      coordinatorId: project.value.coordinatorId || null,
      priority: project.value.priority,
      deadline: project.value.deadline,
      tags: [...(project.value.tags || [])],
      stages: [...(project.value.stages || [])],
      currentStageIndex: project.value.currentStageIndex || 0
    }
  }

  function updateEditedProject(updates) {
    // Check if this is a direct update (not in edit mode)
    if (updates.direct) {
      handleDirectUpdate(updates)
    } else {
      // Normal edit mode update
      editedProject.value = { ...editedProject.value, ...updates }
    }
  }

  async function handleDirectUpdate(updates) {
    if (!project.value || !canEdit.value) return
    
    saving.value = true
    
    try {
      const projectUpdates = {}
      
      // Handle stage-specific updates
      if (updates.stageIndex !== undefined && updates.stageUpdate) {
        const stages = [...project.value.stages]
        stages[updates.stageIndex] = {
          ...stages[updates.stageIndex],
          ...updates.stageUpdate
        }
        projectUpdates.stages = stages
      }
      
      // Handle current stage index update
      if (updates.currentStageIndex !== undefined) {
        projectUpdates.currentStageIndex = updates.currentStageIndex
      }
      
      // Update the project
      await updateProject(project.value.id, projectUpdates)
      
      // Log the action
      await logEvent('stage_updated', {
        projectId: project.value.id,
        projectTitle: project.value.title,
        updates: projectUpdates
      })
      
      showSuccess('Stage updated successfully')
      
    } catch (err) {
      console.error('Error updating stage:', err)
      showError(err.message || 'Failed to update stage')
    } finally {
      saving.value = false
    }
  }

  async function saveChanges() {
    if (!hasChanges.value || !project.value) return
    
    saving.value = true
    
    try {
      // Extract only changed fields
      const updates = {}
      const fields = ['title', 'description', 'region', 'coordinatorId', 
                      'priority', 'deadline', 'tags', 'stages', 'currentStageIndex']
      
      fields.forEach(field => {
        const original = project.value[field]
        const edited = editedProject.value[field]
        
        // Special handling for deadline
        if (field === 'deadline') {
          const origDate = original?.toDate ? original.toDate() : original
          const editDate = edited?.toDate ? edited.toDate() : edited
          if (origDate?.getTime() !== editDate?.getTime()) {
            updates[field] = edited
          }
        }
        // Handle arrays
        else if (Array.isArray(original)) {
          if (JSON.stringify(original) !== JSON.stringify(edited)) {
            updates[field] = edited
          }
        }
        // Handle other fields
        else if (original !== edited) {
          updates[field] = edited
        }
      })
      
      if (Object.keys(updates).length === 0) {
        editing.value = false
        return
      }
      
      await updateProject(project.value.id, updates)
      
      // Log the action
      await logEvent('project_updated', {
        projectId: project.value.id,
        projectTitle: project.value.title,
        fieldsUpdated: Object.keys(updates)
      })
      
      editing.value = false
      showSuccess('Project updated successfully')
      
    } catch (err) {
      console.error('Error saving changes:', err)
      showError(err.message || 'Failed to save changes')
    } finally {
      saving.value = false
    }
  }

  function handleDelete() {
    deleteDialog.value = true
  }

  async function confirmDelete(hardDelete = false) {
    if (!project.value) return
    
    deleting.value = true
    
    try {
      if (hardDelete) {
        await hardDeleteProject(project.value.id)
        await logEvent('project_hard_deleted', {
          projectId: project.value.id,
          projectTitle: project.value.title
        })
      } else {
        await softDeleteProject(project.value.id)
        await logEvent('project_soft_deleted', {
          projectId: project.value.id,
          projectTitle: project.value.title
        })
      }
      
      close()
      
    } catch (err) {
      console.error('Error deleting project:', err)
      showError(err.message || 'Failed to delete project')
    } finally {
      deleting.value = false
      deleteDialog.value = false
    }
  }

  // Watch for escape key
  function handleEscape(event) {
    if (event.key === 'Escape' && !editing.value) {
      close()
    }
  }

  // Watch for changes to reset when dialog opens/closes
  watch(dialogOpen, (newVal) => {
    if (!newVal) {
      // Clean up when closing
      if (unsubscribe) {
        unsubscribe()
        unsubscribe = null
      }
    }
  })

  // Lifecycle
  onMounted(() => {
    window.addEventListener('keydown', handleEscape)
  })

  onUnmounted(() => {
    window.removeEventListener('keydown', handleEscape)
    
    // Clean up listener
    if (unsubscribe) {
      unsubscribe()
      unsubscribe = null
    }
  })

  return {
    // State
    dialogOpen,
    project,
    editedProject,
    editing,
    saving,
    loading,
    error,
    activeTab,
    deleteDialog,
    deleting,
    
    // Computed
    canEdit,
    hasChanges,
    
    // Methods
    open,
    close,
    handleClose,
    startEdit,
    cancelEdit,
    resetEditedProject,
    updateEditedProject,
    saveChanges,
    handleDelete,
    confirmDelete
  }
}