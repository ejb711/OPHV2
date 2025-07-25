import { onMounted, onUnmounted } from 'vue'

export function createDialogHandlers(state, computed, operations) {
  function handleClose() {
    operations.close()
  }

  function handleEscape(event) {
    if (event.key === 'Escape' && state.dialogOpen.value) {
      handleClose()
    }
  }

  function setupKeyboardHandlers() {
    onMounted(() => {
      window.addEventListener('keydown', handleEscape)
    })

    onUnmounted(() => {
      window.removeEventListener('keydown', handleEscape)
      if (state.unsubscribe) {
        state.unsubscribe()
      }
    })
  }

  return {
    handleClose,
    setupKeyboardHandlers
  }
}