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
    const stages = [...props.editedProject.stages]
    stages[index].completed = !stages[index].completed
    
    if (stages[index].completed) {
      stages[index].completedAt = new Date()
    } else {
      stages[index].completedAt = null
    }
    
    emit('update', { stages })
  }

  function moveToNextStage() {
    const nextIndex = currentStageIndex.value + 1
    if (nextIndex < totalStages.value) {
      // Mark current stage as completed
      const stages = [...props.editedProject.stages]
      stages[currentStageIndex.value].completed = true
      stages[currentStageIndex.value].completedAt = new Date()
      
      // Update current stage index
      emit('update', { 
        stages,
        currentStageIndex: nextIndex 
      })
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