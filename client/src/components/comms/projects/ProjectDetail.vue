<!-- client/src/components/comms/projects/ProjectDetail.vue -->
<template>
  <v-dialog
    v-model="dialogOpen"
    max-width="800"
    persistent
    scrollable
  >
    <v-card v-if="project" class="project-detail-card">
      <!-- Header -->
      <v-card-title class="d-flex align-center pa-6 bg-grey-lighten-5">
        <div class="flex-grow-1">
          <h2 class="text-h5 font-weight-bold">{{ project.title }}</h2>
          <div class="d-flex align-center gap-2 mt-2">
            <StatusBadge :status="project.status" />
            <RegionBadge :region="project.region" />
            <v-chip 
              v-if="project.priority === 'high'" 
              color="error" 
              size="small"
              prepend-icon="mdi-alert"
            >
              High Priority
            </v-chip>
          </div>
        </div>
        <v-btn
          icon="mdi-close"
          variant="text"
          @click="close"
          :disabled="saving"
        />
      </v-card-title>

      <v-divider />

      <!-- Content -->
      <v-card-text class="pa-6" style="max-height: 600px;">
        <v-form ref="formRef" v-model="formValid">
          <!-- Title -->
          <v-text-field
            v-model="editedProject.title"
            label="Project Title"
            :rules="[v => !!v || 'Title is required']"
            :readonly="!editing"
            variant="outlined"
            class="mb-4"
          />

          <!-- Description -->
          <v-textarea
            v-model="editedProject.description"
            label="Description"
            :rules="[v => !!v || 'Description is required']"
            :readonly="!editing"
            variant="outlined"
            rows="3"
            class="mb-4"
          />

          <!-- Region and Coordinator -->
          <v-row class="mb-4">
            <v-col cols="12" md="6">
              <v-select
                v-model="editedProject.region"
                :items="regionOptions"
                label="Region"
                :readonly="!editing"
                variant="outlined"
                item-title="name"
                item-value="id"
              />
            </v-col>
            <v-col cols="12" md="6">
              <v-select
                v-model="editedProject.coordinatorId"
                :items="coordinatorOptions"
                label="Coordinator"
                :readonly="!editing"
                variant="outlined"
                item-title="name"
                item-value="id"
                clearable
                :hint="coordinatorOptions.length === 0 ? 'No coordinators available for this region' : ''"
                persistent-hint
              />
            </v-col>
          </v-row>

          <!-- Priority and Deadline -->
          <v-row class="mb-4">
            <v-col cols="12" md="6">
              <v-select
                v-model="editedProject.priority"
                :items="priorityOptions"
                label="Priority"
                :readonly="!editing"
                variant="outlined"
              />
            </v-col>
            <v-col cols="12" md="6">
              <v-text-field
                v-model="editedProject.deadline"
                label="Deadline"
                type="date"
                :readonly="!editing"
                variant="outlined"
              />
            </v-col>
          </v-row>

          <!-- Tags -->
          <v-combobox
            v-model="editedProject.tags"
            label="Tags"
            :readonly="!editing"
            variant="outlined"
            chips
            closable-chips
            multiple
            class="mb-4"
          />

          <!-- Project Stages -->
          <div class="mb-4">
            <h3 class="text-subtitle-1 font-weight-bold mb-2">Project Stages</h3>
            <v-chip-group
              v-model="editedProject.currentStageIndex"
              :disabled="!editing"
              mandatory
              selected-class="v-chip--selected"
            >
              <v-chip
                v-for="(stage, index) in editedProject.stages"
                :key="index"
                :color="index <= editedProject.currentStageIndex ? 'primary' : 'default'"
                :variant="index === editedProject.currentStageIndex ? 'flat' : 'outlined'"
              >
                {{ stage }}
              </v-chip>
            </v-chip-group>
          </div>

          <!-- Visibility Settings -->
          <ProjectVisibility
            v-model="editedProject.visibility"
            :shared-with="editedProject.sharedWith"
            :readonly="!editing"
            @update:shared-with="editedProject.sharedWith = $event"
          />

          <!-- Metadata -->
          <v-card variant="outlined" class="pa-4 bg-grey-lighten-5">
            <div class="text-caption text-medium-emphasis">
              <div>Created: {{ formatDate(project.createdAt) }} by {{ project.createdByEmail }}</div>
              <div v-if="project.updatedAt">
                Updated: {{ formatDate(project.updatedAt) }}
                <span v-if="project.updatedByEmail">by {{ project.updatedByEmail }}</span>
              </div>
              <div>Views: {{ project.viewCount || 0 }}</div>
            </div>
          </v-card>
        </v-form>
      </v-card-text>

      <v-divider />

      <!-- Actions -->
      <v-card-actions class="pa-6 bg-grey-lighten-5">
        <ProjectActions
          :project="project"
          @edit="startEdit"
          @delete="handleDelete"
        />
        
        <v-spacer />
        
        <template v-if="editing">
          <v-btn
            variant="text"
            @click="cancelEdit"
            :disabled="saving"
          >
            Cancel
          </v-btn>
          <v-btn
            color="primary"
            variant="elevated"
            @click="saveChanges"
            :loading="saving"
            :disabled="!formValid || !hasChanges"
          >
            Save Changes
          </v-btn>
        </template>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import { useCommsProjects } from '@/composables/comms/useCommsProjects'
import { LOUISIANA_REGIONS } from '@/config/louisiana-regions'
import StatusBadge from '../shared/StatusBadge.vue'
import RegionBadge from '../shared/RegionBadge.vue'
import ProjectVisibility from './ProjectVisibility.vue'
import ProjectActions from './ProjectActions.vue'

// Props & Emits
const props = defineProps({
  projectId: {
    type: String,
    default: null
  }
})

const emit = defineEmits(['close', 'updated', 'deleted'])

// Composables
const { 
  getProject, 
  updateProject, 
  canEditProject,
  coordinatorRegions 
} = useCommsProjects()

// State
const dialogOpen = ref(false)
const project = ref(null)
const editedProject = ref({})
const editing = ref(false)
const saving = ref(false)
const formRef = ref(null)
const formValid = ref(false)

// Options
const regionOptions = Object.entries(LOUISIANA_REGIONS).map(([id, region]) => ({
  id,
  name: region.name
}))

const priorityOptions = [
  { title: 'Low', value: 'low' },
  { title: 'Normal', value: 'normal' },
  { title: 'High', value: 'high' }
]

const coordinatorOptions = ref([]) // Will be loaded based on selected region

// Computed
const hasChanges = computed(() => {
  if (!project.value || !editing.value) return false
  
  return JSON.stringify(editedProject.value) !== JSON.stringify({
    title: project.value.title,
    description: project.value.description,
    region: project.value.region,
    coordinatorId: project.value.coordinatorId,
    priority: project.value.priority,
    deadline: formatDateForInput(project.value.deadline),
    tags: project.value.tags || [],
    stages: project.value.stages,
    currentStageIndex: project.value.currentStageIndex,
    visibility: project.value.visibility,
    sharedWith: project.value.sharedWith || []
  })
})

// Methods
async function open(id) {
  if (!id) return
  
  try {
    project.value = await getProject(id)
    resetEditedProject()
    dialogOpen.value = true
  } catch (error) {
    console.error('Error loading project:', error)
  }
}

function close() {
  dialogOpen.value = false
  editing.value = false
  project.value = null
  editedProject.value = {}
  emit('close')
}

function startEdit() {
  if (!canEditProject(project.value)) return
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
    description: project.value.description,
    region: project.value.region,
    coordinatorId: project.value.coordinatorId || '',
    priority: project.value.priority || 'normal',
    deadline: formatDateForInput(project.value.deadline),
    tags: project.value.tags || [],
    stages: project.value.stages || [],
    currentStageIndex: project.value.currentStageIndex || 0,
    visibility: project.value.visibility || 'coordinator',
    sharedWith: project.value.sharedWith || []
  }
}

async function saveChanges() {
  if (!formRef.value?.validate()) return
  
  saving.value = true
  try {
    // Prepare update data - clean undefined values
    const updates = {
      title: editedProject.value.title,
      description: editedProject.value.description,
      region: editedProject.value.region,
      priority: editedProject.value.priority,
      tags: editedProject.value.tags,
      stages: editedProject.value.stages,
      currentStageIndex: editedProject.value.currentStageIndex,
      visibility: editedProject.value.visibility,
      sharedWith: editedProject.value.sharedWith
    }
    
    // Only include fields that have values
    if (editedProject.value.coordinatorId) {
      updates.coordinatorId = editedProject.value.coordinatorId
    }
    
    if (editedProject.value.deadline) {
      updates.deadline = new Date(editedProject.value.deadline)
    }
    
    await updateProject(project.value.id, updates)
    
    // Refresh project data
    project.value = await getProject(project.value.id)
    editing.value = false
    emit('updated', project.value)
  } catch (error) {
    console.error('Error saving project:', error)
  } finally {
    saving.value = false
  }
}

async function handleDelete(hard = false) {
  if (!project.value) return
  
  emit('deleted', project.value, hard)
  close()
}

// Utilities
function formatDate(date) {
  if (!date) return 'N/A'
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  }).format(date)
}

function formatDateForInput(date) {
  if (!date) return ''
  const d = new Date(date)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

// Expose open method
defineExpose({ open })
</script>

<style scoped>
.project-detail-card {
  border-radius: 12px !important;
}

.v-chip--selected {
  font-weight: 600;
}
</style>