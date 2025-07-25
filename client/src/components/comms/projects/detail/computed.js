import { computed } from 'vue'
import { toDate } from '@/utils/dateUtils'

export function createProjectDetailComputed(state, { canEditProject }) {
  const canEdit = computed(() => {
    return state.project.value && canEditProject(state.project.value)
  })

  const hasChanges = computed(() => {
    if (!state.project.value || !state.editing.value) return false
    
    const fields = ['title', 'description', 'region', 'coordinatorId', 
                    'priority', 'deadline', 'tags', 'stages', 'currentStageIndex']
    
    return fields.some(field => {
      const original = state.project.value[field]
      const edited = state.editedProject.value[field]
      
      if (field === 'deadline') {
        const origDate = toDate(original)
        const editDate = toDate(edited)
        return origDate?.getTime() !== editDate?.getTime()
      }
      
      if (Array.isArray(original)) {
        return JSON.stringify(original) !== JSON.stringify(edited)
      }
      
      return original !== edited
    })
  })

  return {
    canEdit,
    hasChanges
  }
}