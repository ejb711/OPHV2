import { ref } from 'vue'

export function createProjectDetailState() {
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
  
  let unsubscribe = null
  
  return {
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
    unsubscribe
  }
}