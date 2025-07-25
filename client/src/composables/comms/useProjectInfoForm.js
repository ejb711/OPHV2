// client/src/composables/comms/useProjectInfoForm.js
// Fixed version with proper deadline type handling
import { createDateFromInput } from '@/utils/dateUtils'

export function useProjectInfoForm(props, emit) {
  // Validation rules
  const rules = {
    required: v => !!v || 'This field is required',
    minLength: (min) => v => (v && v.length >= min) || `Must be at least ${min} characters`
  }

  // Update field helper
  function updateField(field, value) {
    emit('update', { ...props.editedProject, [field]: value })
  }

  // Handle region change
  function handleRegionChange(value) {
    updateField('region', value)
    // Reset coordinator when region changes
    if (props.editedProject.coordinatorId) {
      updateField('coordinatorId', null)
    }
  }

  // Handle deadline change
  function handleDeadlineChange(value) {
    if (!value) {
      updateField('deadline', null)
      return
    }
    
    const date = createDateFromInput(value)
    updateField('deadline', date)
  }

  return {
    rules,
    updateField,
    handleRegionChange,
    handleDeadlineChange
  }
}