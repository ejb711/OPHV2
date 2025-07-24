// client/src/components/comms/projects/detail/tabs/composables/useProjectStages.js
import { computed } from 'vue'

export function useProjectStages(props, emit) {
  // Computed properties
  const displayedStages = computed(() => {
    return props.editing 
      ? props.editedProject.stages 
      : props.project.stages || []
  })

  const currentStageIndex = computed(() => {
    return props.editing 
      ? props.editedProject.currentStageIndex || 0 
      : props.project.currentStageIndex || 0
  })

  const totalStages = computed(() => displayedStages.value.length)

  const completedStages = computed(() => {
    return displayedStages.value.filter(stage => stage.completed).length
  })

  const progressPercentage = computed(() => {
    if (totalStages.value === 0) return 0
    return (completedStages.value / totalStages.value) * 100
  })

  // Methods
  function toggleStageComplete(index) {
    // If in edit mode, update the edited project
    if (props.editing) {
      const stages = [...props.editedProject.stages]
      stages[index].completed = !stages[index].completed
      
      if (stages[index].completed) {
        stages[index].completedAt = new Date()
      } else {
        stages[index].completedAt = null
      }
      
      emit('update', { stages })
    } else {
      // If not in edit mode, emit a direct update event
      const stage = props.project.stages[index]
      emit('update', { 
        stageIndex: index,
        stageUpdate: {
          completed: !stage.completed,
          completedAt: !stage.completed ? new Date() : null
        },
        direct: true // Flag to indicate this is a direct update
      })
    }
  }

  function moveToNextStage() {
    const nextIndex = currentStageIndex.value + 1
    if (nextIndex < totalStages.value) {
      if (props.editing) {
        // In edit mode, update edited project
        const stages = [...props.editedProject.stages]
        stages[currentStageIndex.value].completed = true
        stages[currentStageIndex.value].completedAt = new Date()
        
        emit('update', { 
          stages,
          currentStageIndex: nextIndex 
        })
      } else {
        // Not in edit mode, emit direct update
        emit('update', {
          stageIndex: currentStageIndex.value,
          stageUpdate: {
            completed: true,
            completedAt: new Date()
          },
          currentStageIndex: nextIndex,
          direct: true
        })
      }
    }
  }

  function addStage() {
    const stages = [...props.editedProject.stages]
    stages.push({
      name: `Stage ${stages.length + 1}`,
      description: '',
      completed: false,
      startedAt: null,
      completedAt: null
    })
    
    emit('update', { stages })
  }

  function removeStage(index) {
    if (displayedStages.value.length <= 1) {
      return // Don't allow removing the last stage
    }
    
    const stages = [...props.editedProject.stages]
    stages.splice(index, 1)
    
    // Adjust current stage index if needed
    let newCurrentIndex = props.editedProject.currentStageIndex
    if (index <= newCurrentIndex && newCurrentIndex > 0) {
      newCurrentIndex--
    }
    
    emit('update', { 
      stages,
      currentStageIndex: newCurrentIndex
    })
  }

  function updateStage({ index, updates }) {
    const stages = [...props.editedProject.stages]
    stages[index] = updates
    emit('update', { stages })
  }

  return {
    // Computed
    displayedStages,
    currentStageIndex,
    totalStages,
    completedStages,
    progressPercentage,
    
    // Methods
    toggleStageComplete,
    moveToNextStage,
    addStage,
    removeStage,
    updateStage
  }
}