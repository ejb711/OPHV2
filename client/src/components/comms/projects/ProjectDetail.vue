<!-- client/src/components/comms/projects/ProjectDetail.vue -->
<template>
  <v-dialog 
    v-model="dialogOpen" 
    max-width="900" 
    persistent
    class="project-detail-dialog"
  >
    <v-card v-if="project" class="d-flex flex-column dialog-card">
      <!-- Header (Fixed) -->
      <ProjectHeader
        :project="project"
        :can-edit="canEdit"
        :editing="editing"
        :saving="saving"
        @close="handleClose"
        @edit="startEdit"
        @save="saveChanges"
        @cancel="cancelEdit"
        @delete="handleDelete"
      />
      
      <!-- Tabs (Fixed) -->
      <v-tabs v-model="activeTab" class="border-b flex-grow-0">
        <v-tab value="details">
          <v-icon class="mr-2">mdi-information</v-icon>
          Details
        </v-tab>
        <v-tab value="stages">
          <v-icon class="mr-2">mdi-progress-check</v-icon>
          Stages
        </v-tab>
        <v-tab value="files">
          <v-icon class="mr-2">mdi-paperclip</v-icon>
          Files & Links
        </v-tab>
      </v-tabs>
      
      <!-- Tab Content (Scrollable) -->
      <v-card-text class="flex-grow-1 pa-0 overflow-hidden">
        <v-window v-model="activeTab" class="h-100">
          <!-- Details Tab -->
          <v-window-item value="details" class="h-100">
            <div class="tab-content-wrapper">
              <ProjectInfoTab
                :project="project"
                :edited-project="editedProject"
                :editing="editing"
                :can-edit="canEdit"
                @update="updateEditedProject"
              />
            </div>
          </v-window-item>
          
          <!-- Stages Tab -->
          <v-window-item value="stages" class="h-100">
            <div class="tab-content-wrapper">
              <ProjectStagesTab
                :project="project"
                :edited-project="editedProject"
                :editing="editing"
                :can-edit="canEdit"
                @update="updateEditedProject"
              />
            </div>
          </v-window-item>
          
          <!-- Files Tab -->
          <v-window-item value="files" class="h-100">
            <div class="tab-content-wrapper">
              <ProjectFilesTab
                :project-id="project.id"
                :can-edit="canEdit"
              />
            </div>
          </v-window-item>
        </v-window>
      </v-card-text>
      
      <!-- Footer Actions (Fixed) -->
      <v-card-actions v-if="!editing" class="pa-4 border-t flex-grow-0">
        <v-spacer />
        <v-btn
          variant="text"
          @click="close"
        >
          Close
        </v-btn>
      </v-card-actions>
    </v-card>
    
    <!-- Loading State -->
    <v-card v-else-if="loading" class="pa-8">
      <div class="text-center">
        <v-progress-circular indeterminate color="primary" />
        <p class="mt-4">Loading project details...</p>
      </div>
    </v-card>
    
    <!-- Error State -->
    <v-card v-else-if="error" class="pa-8">
      <div class="text-center">
        <v-icon size="48" color="error">mdi-alert-circle</v-icon>
        <p class="mt-4 text-error">{{ error }}</p>
        <v-btn
          color="primary"
          variant="tonal"
          class="mt-4"
          @click="close"
        >
          Close
        </v-btn>
      </div>
    </v-card>
    
    <!-- Delete Confirmation -->
    <ProjectDeleteDialog
      v-model="deleteDialog"
      :project-name="project?.title"
      :deleting="deleting"
      @confirm="confirmDelete"
    />
  </v-dialog>
</template>

<script setup>
import { ref, computed, watch, onMounted, onUnmounted } from 'vue'
import { useCommsProjects } from '@/composables/comms/useCommsProjects'
import { useSnackbar } from '@/composables/useSnackbar'
import ProjectHeader from './detail/ProjectHeader.vue'
import ProjectInfoTab from './detail/tabs/ProjectInfoTab.vue'
import ProjectStagesTab from './detail/tabs/ProjectStagesTab.vue'
import ProjectFilesTab from './detail/tabs/ProjectFilesTab.vue'
import ProjectDeleteDialog from './detail/dialogs/ProjectDeleteDialog.vue'

// Composables
const { 
  getProject, 
  updateProject,
  softDeleteProject,
  canEditProject 
} = useCommsProjects()
const { showError, showSuccess } = useSnackbar()

// State
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

// Computed
const canEdit = computed(() => {
  return project.value && canEditProject(project.value)
})

const hasChanges = computed(() => {
  if (!project.value || !editing.value) return false
  
  // Check if any field has changed
  const fields = ['title', 'description', 'region', 'coordinatorId', 
                  'priority', 'deadline', 'tags', 'stages', 'currentStageIndex']
  
  return fields.some(field => {
    const original = project.value[field]
    const edited = editedProject.value[field]
    
    if (Array.isArray(original)) {
      return JSON.stringify(original) !== JSON.stringify(edited)
    }
    return original !== edited
  })
})

// Methods
async function open(projectId) {
  if (!projectId) return
  
  dialogOpen.value = true
  loading.value = true
  error.value = null
  activeTab.value = 'details'
  
  try {
    project.value = await getProject(projectId)
    resetEditedProject()
  } catch (err) {
    console.error('Failed to load project:', err)
    error.value = err.message || 'Failed to load project details'
  } finally {
    loading.value = false
  }
}

function close() {
  if (editing.value && hasChanges.value) {
    if (!confirm('You have unsaved changes. Are you sure you want to close?')) {
      return
    }
  }
  
  dialogOpen.value = false
  project.value = null
  editedProject.value = {}
  editing.value = false
  error.value = null
  activeTab.value = 'details'
}

function handleClose() {
  close()
}

function startEdit() {
  editing.value = true
  resetEditedProject()
}

function cancelEdit() {
  editing.value = false
  resetEditedProject()
}

function resetEditedProject() {
  if (!project.value) return
  
  editedProject.value = {
    title: project.value.title,
    description: project.value.description || '',
    region: project.value.region,
    coordinatorId: project.value.coordinatorId || null,
    priority: project.value.priority,
    deadline: project.value.deadline,
    tags: [...(project.value.tags || [])],
    stages: [...(project.value.stages || [])],
    currentStageIndex: project.value.currentStageIndex || 0
  }
}

function updateEditedProject(field, value) {
  editedProject.value[field] = value
}

async function saveChanges() {
  if (!hasChanges.value || !project.value) return
  
  saving.value = true
  
  try {
    await updateProject(project.value.id, editedProject.value)
    
    // Update local project data
    Object.assign(project.value, editedProject.value)
    
    editing.value = false
    showSuccess('Project updated successfully')
    emit('updated', project.value)
  } catch (err) {
    console.error('Failed to save changes:', err)
    showError(err.message || 'Failed to save changes')
  } finally {
    saving.value = false
  }
}

function handleDelete() {
  deleteDialog.value = true
}

async function confirmDelete() {
  if (!project.value) return
  
  deleting.value = true
  
  try {
    await softDeleteProject(project.value.id)
    showSuccess('Project moved to trash')
    emit('deleted', project.value.id)
    close()
  } catch (err) {
    console.error('Failed to delete project:', err)
    showError(err.message || 'Failed to delete project')
  } finally {
    deleting.value = false
    deleteDialog.value = false
  }
}

// Watch for escape key
function handleEscape(event) {
  if (event.key === 'Escape' && !editing.value) {
    close()
  }
}

// Lifecycle
onMounted(() => {
  window.addEventListener('keydown', handleEscape)
})

onUnmounted(() => {
  window.removeEventListener('keydown', handleEscape)
})

// Expose methods for parent
defineExpose({
  open,
  close
})

// Emit events
const emit = defineEmits(['updated', 'deleted'])
</script>

<style scoped>
/* Ensure proper dialog height */
:deep(.v-dialog > .v-overlay__content) {
  max-height: 90vh !important;
  height: 90vh !important;
  display: flex !important;
  margin: 24px !important;
}

/* Make the card fill the dialog and use flexbox */
.dialog-card {
  height: 100% !important;
  max-height: 100% !important;
  display: flex !important;
  flex-direction: column !important;
  overflow: hidden !important;
}

/* Tab styling */
:deep(.v-tabs) {
  background-color: #f5f5f5;
  flex-shrink: 0;
}

:deep(.v-tab) {
  text-transform: none;
  letter-spacing: normal;
}

/* Card text should flex and contain overflow */
:deep(.v-card-text) {
  display: flex !important;
  flex-direction: column !important;
  min-height: 0 !important;
  position: relative !important;
}

/* Window should fill the card text */
:deep(.v-window) {
  flex: 1 1 auto !important;
  overflow: hidden !important;
  height: 100% !important;
}

/* Window items should be full height */
:deep(.v-window-item) {
  height: 100% !important;
  overflow: hidden !important;
}

/* Scrollable content wrapper */
.tab-content-wrapper {
  height: 100%;
  overflow-y: auto;
  overflow-x: hidden;
  padding: 24px;
}

/* Ensure footer stays at bottom */
:deep(.v-card-actions) {
  flex-shrink: 0;
  border-top: 1px solid rgba(0, 0, 0, 0.12);
}

/* Mobile adjustments */
@media (max-width: 599px) {
  :deep(.v-dialog > .v-overlay__content) {
    margin: 0 !important;
    max-height: 100vh !important;
    height: 100vh !important;
  }
  
  .tab-content-wrapper {
    padding: 16px;
  }
}

/* Utility classes */
.h-100 {
  height: 100% !important;
}

.overflow-hidden {
  overflow: hidden !important;
}

.border-t {
  border-top: 1px solid rgba(0, 0, 0, 0.12);
}

.border-b {
  border-bottom: 1px solid rgba(0, 0, 0, 0.12);
}

/* Custom scrollbar for better visibility */
.tab-content-wrapper::-webkit-scrollbar {
  width: 8px;
}

.tab-content-wrapper::-webkit-scrollbar-track {
  background: #f5f5f5;
  border-radius: 4px;
}

.tab-content-wrapper::-webkit-scrollbar-thumb {
  background: #c0c0c0;
  border-radius: 4px;
}

.tab-content-wrapper::-webkit-scrollbar-thumb:hover {
  background: #999;
}

/* Firefox scrollbar */
.tab-content-wrapper {
  scrollbar-width: thin;
  scrollbar-color: #c0c0c0 #f5f5f5;
}
</style>