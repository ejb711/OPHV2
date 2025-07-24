<!-- client/src/components/comms/projects/ProjectDetail.vue -->
<template>
  <v-dialog 
    v-model="dialogOpen" 
    max-width="900" 
    persistent
    class="project-detail-dialog"
  >
    <!-- Main Card -->
    <v-card v-if="project" class="d-flex flex-column dialog-card">
      <!-- Header (Fixed) -->
      <ProjectDetailHeader
        :project="project"
        :can-edit="canEdit"
        :editing="editing"
        :saving="saving"
        :has-changes="hasChanges"
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
import { ref } from 'vue'
import ProjectDetailHeader from './detail/ProjectDetailHeader.vue'
import ProjectInfoTab from './detail/tabs/ProjectInfoTab.vue'
import ProjectStagesTab from './detail/tabs/ProjectStagesTab.vue'
import ProjectFilesTab from './detail/tabs/ProjectFilesTab.vue'
import ProjectDeleteDialog from './detail/dialogs/ProjectDeleteDialog.vue'
import { useProjectDetail } from './detail/useProjectDetail'

// Use the composable for all business logic
const {
  // State
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
  
  // Computed
  canEdit,
  hasChanges,
  
  // Methods
  open,
  close,
  handleClose,
  startEdit,
  cancelEdit,
  updateEditedProject,
  saveChanges,
  handleDelete,
  confirmDelete
} = useProjectDetail()

// Expose methods for parent
defineExpose({
  open,
  close
})
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
  overflow: hidden !important;
}

/* Tab content wrapper */
.tab-content-wrapper {
  height: 100%;
  overflow-y: auto;
  overflow-x: hidden;
}

/* Custom scrollbar for tab content */
.tab-content-wrapper::-webkit-scrollbar {
  width: 8px;
}

.tab-content-wrapper::-webkit-scrollbar-track {
  background: #f1f1f1;
}

.tab-content-wrapper::-webkit-scrollbar-thumb {
  background: #888;
  border-radius: 4px;
}

.tab-content-wrapper::-webkit-scrollbar-thumb:hover {
  background: #555;
}
</style>