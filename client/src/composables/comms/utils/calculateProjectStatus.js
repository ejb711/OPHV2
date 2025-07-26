/**
 * Calculate the effective status of a project
 * If project has an explicit status, use that
 * Otherwise calculate based on stage completion
 */
export function calculateProjectStatus(project) {
  if (!project) return 'unknown'
  
  // If project has an explicit status set, use that
  // This includes all status types: not_started, planning, in_progress, review, 
  // pending_approval, approved, completed, on_hold, cancelled
  if (project.status) {
    return project.status
  }
  
  // If no explicit status, calculate based on stages
  if (!project.stages || project.stages.length === 0) {
    return 'not_started'
  }
  
  // Count completed stages
  const completedCount = project.stages.filter(s => s.completed).length
  
  // All completed
  if (completedCount === project.stages.length) {
    return 'completed'
  }
  
  // None completed
  if (completedCount === 0) {
    return 'not_started'
  }
  
  // Some completed - in progress
  return 'in_progress'
}

/**
 * Get the sort order for status values
 * Lower numbers appear first in ascending sort
 */
export function getStatusSortOrder() {
  return {
    not_started: 0,
    planning: 1,
    in_progress: 2,
    review: 3,
    pending_approval: 4,
    approved: 5,
    completed: 6,
    on_hold: 7,
    cancelled: 8
  }
}