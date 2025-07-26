import { toDate } from '@/utils/dateUtils'

export function createEditOperations(state, computed, { updateProject, logEvent, showSuccess, showError }) {
  function startEdit() {
    state.editing.value = true
    resetEditedProject()
  }

  function cancelEdit() {
    if (computed.hasChanges.value) {
      if (!confirm('Are you sure you want to discard your changes?')) {
        return
      }
    }

    state.editing.value = false
    resetEditedProject()
  }

  function resetEditedProject() {
    if (!state.project.value) return

    state.editedProject.value = {
      title: state.project.value.title,
      description: state.project.value.description || '',
      region: state.project.value.region,
      coordinatorId: state.project.value.coordinatorId || null,
      priority: state.project.value.priority,
      deadline: toDate(state.project.value.deadline),
      tags: [...(state.project.value.tags || [])],
      stages: [...(state.project.value.stages || [])],
      currentStageIndex: state.project.value.currentStageIndex || 0,
      requiresApproval: state.project.value.requiresApproval ?? true,
      status: state.project.value.status || ''
    }
  }

  function updateEditedProject(updates) {
    if (updates.direct) {
      handleDirectUpdate(updates)
    } else {
      state.editedProject.value = { ...state.editedProject.value, ...updates }
    }
  }

  async function handleDirectUpdate(updates) {
    if (!state.project.value || !computed.canEdit.value) {
      return
    }

    state.saving.value = true

    try {
      const projectUpdates = {}

      if (updates.stageIndex !== undefined && updates.stageUpdate) {
        const stages = [...state.project.value.stages]
        stages[updates.stageIndex] = {
          ...stages[updates.stageIndex],
          ...updates.stageUpdate
        }
        projectUpdates.stages = stages
      }

      // Handle direct stages array update
      if (updates.stages !== undefined) {
        projectUpdates.stages = updates.stages
      }

      if (updates.currentStageIndex !== undefined) {
        projectUpdates.currentStageIndex = updates.currentStageIndex
      }

      if (updates.status !== undefined) {
        projectUpdates.status = updates.status
      }

      if (updates.isApproved !== undefined) {
        projectUpdates.isApproved = updates.isApproved
      }

      await updateProject(state.project.value.id, projectUpdates)

      await logEvent('stage_updated', {
        projectId: state.project.value.id,
        projectTitle: state.project.value.title,
        updates: projectUpdates
      })

      showSuccess('Stage updated successfully')

    } catch (err) {
      showError(err.message || 'Failed to update stage')
    } finally {
      state.saving.value = false
    }
  }

  async function saveChanges() {
    if (!computed.hasChanges.value || !state.project.value) return

    state.saving.value = true

    try {
      const updates = {}
      const fields = ['title', 'description', 'region', 'coordinatorId',
                      'priority', 'deadline', 'tags', 'stages', 'currentStageIndex',
                      'requiresApproval', 'status']

      fields.forEach(field => {
        const original = state.project.value[field]
        const edited = state.editedProject.value[field]

        if (field === 'deadline') {
          const origDate = toDate(original)
          const editDate = toDate(edited)
          if (origDate?.getTime() !== editDate?.getTime()) {
            updates[field] = edited
          }
        }
        else if (Array.isArray(original)) {
          if (JSON.stringify(original) !== JSON.stringify(edited)) {
            updates[field] = edited
          }
        }
        else if (original !== edited) {
          updates[field] = edited
        }
      })

      if (Object.keys(updates).length === 0) {
        state.editing.value = false
        return
      }

      await updateProject(state.project.value.id, updates)

      await logEvent('project_updated', {
        projectId: state.project.value.id,
        projectTitle: state.project.value.title,
        fieldsUpdated: Object.keys(updates)
      })

      state.editing.value = false
      showSuccess('Project updated successfully')

    } catch (err) {
      showError(err.message || 'Failed to save changes')
    } finally {
      state.saving.value = false
    }
  }

  return {
    startEdit,
    cancelEdit,
    resetEditedProject,
    updateEditedProject,
    saveChanges
  }
}