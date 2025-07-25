import { useCommsProjects } from '@/composables/comms/useCommsProjects'
import { useSnackbar } from '@/composables/useSnackbar'
import { useAudit } from '@/composables/useAudit'
import { createProjectDetailState } from './state'
import { createProjectDetailComputed } from './computed'
import { createEditOperations } from './edit'
import { createProjectOperations } from './operations'
import { createDialogHandlers } from './dialog'

export function useProjectDetail() {
  const { 
    getProject, 
    updateProject,
    softDeleteProject,
    hardDeleteProject,
    canEditProject 
  } = useCommsProjects()
  const { showError, showSuccess } = useSnackbar()
  const { logEvent } = useAudit()

  const state = createProjectDetailState()
  
  const computed = createProjectDetailComputed(state, { canEditProject })
  
  const editOperations = createEditOperations(state, computed, { 
    updateProject, 
    logEvent, 
    showSuccess, 
    showError 
  })
  
  const projectOperations = createProjectOperations(state, computed, editOperations, { 
    getProject, 
    softDeleteProject, 
    hardDeleteProject, 
    logEvent, 
    showError 
  })
  
  const dialogHandlers = createDialogHandlers(state, computed, projectOperations)
  
  dialogHandlers.setupKeyboardHandlers()

  return {
    ...state,
    ...computed,
    ...editOperations,
    ...projectOperations,
    ...dialogHandlers
  }
}