// client/src/composables/comms/useProjectStatus.js
import { computed } from 'vue'

/**
 * Composable for calculating project status based on stage progress
 * Status logic:
 * - 0% progress = not_started
 * - >0% and <100% = in_progress
 * - 100% = completed (only if approval not required OR pending_approval stage is done)
 * - pending_approval = manually set when project is awaiting approval
 */
export function useProjectStatus(project) {
  // Calculate completed stages count
  const completedStages = computed(() => {
    if (!project.value?.stages || project.value.stages.length === 0) return 0
    return project.value.stages.filter(stage => stage.completed === true).length
  })
  
  // Calculate total stages count
  const totalStages = computed(() => {
    return project.value?.stages?.length || 0
  })
  
  // Calculate progress percentage
  const progressPercentage = computed(() => {
    if (totalStages.value === 0) return 0
    return Math.round((completedStages.value / totalStages.value) * 100)
  })
  
  // Check if project has a pending approval stage
  const hasPendingApprovalStage = computed(() => {
    if (!project.value?.stages) return false
    return project.value.stages.some(stage => 
      stage.name && (
        stage.name.toLowerCase().includes('approval') ||
        stage.name.toLowerCase().includes('pending approval') ||
        stage.name.toLowerCase().includes('pending_approval')
      )
    )
  })
  
  // Check if pending approval stage is completed
  const pendingApprovalCompleted = computed(() => {
    if (!project.value?.stages) return false
    const approvalStage = project.value.stages.find(stage => 
      stage.name && (
        stage.name.toLowerCase().includes('approval') ||
        stage.name.toLowerCase().includes('pending approval') ||
        stage.name.toLowerCase().includes('pending_approval')
      )
    )
    return approvalStage ? approvalStage.completed === true : false
  })
  
  // Calculate the actual status based on progress and approval requirements
  const calculatedStatus = computed(() => {
    const progress = progressPercentage.value
    const requiresApproval = project.value?.requiresApproval
    const isApproved = project.value?.isApproved
    
    // 0% progress = not started
    if (progress === 0) {
      return 'not_started'
    }
    
    // 100% progress
    if (progress === 100) {
      // If requires approval
      if (requiresApproval) {
        // Check explicit isApproved field first
        if (isApproved === false || project.value?.status === 'pending_approval') {
          return 'pending_approval'
        }
        // If approved or no explicit approval status, completed
        return 'completed'
      }
      // No approval required, just completed
      return 'completed'
    }
    
    // Between 0% and 100%
    // If requires approval and explicitly not approved, show pending
    if (requiresApproval && isApproved === false) {
      return 'pending_approval'
    }
    
    return 'in_progress'
  })
  
  // Get the current active stage
  const currentStage = computed(() => {
    if (!project.value?.stages || project.value.stages.length === 0) {
      return null
    }
    
    // Find the first uncompleted stage
    const activeStage = project.value.stages.find(stage => !stage.completed)
    if (activeStage) return activeStage
    
    // If all stages are completed, return the last stage
    return project.value.stages[project.value.stages.length - 1]
  })
  
  // Get current stage index
  const currentStageIndex = computed(() => {
    if (!project.value?.stages || !currentStage.value) return 0
    return project.value.stages.findIndex(stage => stage === currentStage.value)
  })
  
  return {
    completedStages,
    totalStages,
    progressPercentage,
    calculatedStatus,
    currentStage,
    currentStageIndex,
    hasPendingApprovalStage,
    pendingApprovalCompleted
  }
}