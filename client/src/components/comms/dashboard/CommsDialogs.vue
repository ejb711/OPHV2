// client/src/components/comms/dashboard/CommsDialogs.vue
<!-- Dialog management component (~100 lines) -->
<!-- Props: create-dialog -->
<!-- Events: project-created, project-updated, project-deleted -->
<!-- Purpose: Manages project creation and detail dialogs -->
<template>
  <div>
    <!-- Create Project Dialog -->
    <v-dialog
      v-model="createDialog"
      max-width="900"
      persistent
    >
      <ProjectForm
        @close="createDialog = false"
        @project-created="handleProjectCreated"
      />
    </v-dialog>

    <!-- Project Detail Dialog -->
    <ProjectDetail
      ref="projectDetailRef"
      @project-updated="handleProjectUpdated"
      @project-deleted="handleProjectDeleted"
    />
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import ProjectForm from '../projects/ProjectForm.vue'
import ProjectDetail from '../projects/ProjectDetail.vue'

// Model
const createDialog = defineModel('createDialog', { 
  type: Boolean,
  default: false 
})

// Refs
const projectDetailRef = ref(null)

// Emit
const emit = defineEmits([
  'project-created',
  'project-updated', 
  'project-deleted'
])

// Methods
function handleProjectCreated(project) {
  createDialog.value = false
  emit('project-created', project)
}

function handleProjectUpdated(project) {
  emit('project-updated', project)
}

function handleProjectDeleted(project, hard) {
  emit('project-deleted', project, hard)
}

// Expose the projectDetailRef so parent can access it
defineExpose({
  projectDetailRef
})
</script>