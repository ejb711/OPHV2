<!-- client/src/components/comms/projects/detail/tabs/ProjectInfoTab.vue -->
<template>
  <v-card-text class="pa-6">
    <v-form ref="formRef" v-model="formValid">
      <v-row>
        <!-- Title -->
        <v-col cols="12">
          <div class="field-group">
            <label class="field-label">
              Project Title
              <span v-if="editing" class="text-error">*</span>
            </label>
            <v-text-field
              :model-value="editedProject.title"
              :readonly="!editing"
              :variant="editing ? 'outlined' : 'plain'"
              :rules="editing ? [rules.required] : []"
              density="comfortable"
              @update:model-value="updateField('title', $event)"
            />
          </div>
        </v-col>
        
        <!-- Description -->
        <v-col cols="12">
          <div class="field-group">
            <label class="field-label">Description</label>
            <v-textarea
              :model-value="editedProject.description"
              :readonly="!editing"
              :variant="editing ? 'outlined' : 'plain'"
              :rows="editing ? 4 : 2"
              :auto-grow="true"
              :no-resize="!editing"
              density="comfortable"
              hide-details
              @update:model-value="updateField('description', $event)"
            />
          </div>
        </v-col>
        
        <!-- Region & Coordinator -->
        <v-col cols="12" md="6">
          <div class="field-group">
            <label class="field-label">
              Region
              <span v-if="editing" class="text-error">*</span>
            </label>
            <!-- Show text field in view mode -->
            <v-text-field
              v-if="!editing"
              :model-value="displayedRegion"
              readonly
              variant="plain"
              density="comfortable"
            />
            <!-- Show select in edit mode -->
            <v-select
              v-else
              :model-value="editedProject.region"
              :items="regionOptions"
              item-title="name"
              item-value="id"
              variant="outlined"
              :rules="[rules.required]"
              density="comfortable"
              @update:model-value="handleRegionChange"
            >
              <template v-slot:item="{ props, item }">
                <v-list-item v-bind="props">
                  <template v-slot:prepend>
                    <v-avatar
                      :color="getRegionColor(item.raw.id)"
                      size="small"
                    >
                      <span class="text-caption">{{ item.raw.id }}</span>
                    </v-avatar>
                  </template>
                </v-list-item>
              </template>
            </v-select>
          </div>
        </v-col>
        
        <v-col cols="12" md="6">
          <div class="field-group">
            <label class="field-label">Coordinator</label>
            <!-- Show text field in view mode -->
            <v-text-field
              v-if="!editing"
              :model-value="displayedCoordinator"
              readonly
              variant="plain"
              density="comfortable"
            />
            <!-- Show select in edit mode -->
            <v-select
              v-else
              :model-value="editedProject.coordinatorId"
              :items="coordinatorOptions"
              item-title="label"
              item-value="value"
              variant="outlined"
              :loading="loadingCoordinators"
              density="comfortable"
              clearable
              @update:model-value="updateField('coordinatorId', $event)"
            />
          </div>
        </v-col>
        
        <!-- Priority & Deadline -->
        <v-col cols="12" md="6">
          <div class="field-group">
            <label class="field-label">Priority</label>
            <!-- Show chip in view mode -->
            <div v-if="!editing" class="mt-2">
              <v-chip
                :color="getPriorityColor(editedProject.priority)"
                size="small"
                label
              >
                {{ displayedPriority }}
              </v-chip>
            </div>
            <!-- Show select in edit mode -->
            <v-select
              v-else
              :model-value="editedProject.priority"
              :items="priorityOptions"
              variant="outlined"
              density="comfortable"
              @update:model-value="updateField('priority', $event)"
            >
              <template v-slot:item="{ props, item }">
                <v-list-item v-bind="props">
                  <template v-slot:prepend>
                    <v-chip
                      :color="getPriorityColor(item.value)"
                      size="small"
                      label
                    >
                      {{ item.title }}
                    </v-chip>
                  </template>
                </v-list-item>
              </template>
            </v-select>
          </div>
        </v-col>
        
        <v-col cols="12" md="6">
          <div class="field-group">
            <label class="field-label">Deadline</label>
            <v-text-field
              :model-value="formattedDeadline"
              type="date"
              :readonly="!editing"
              :variant="editing ? 'outlined' : 'plain'"
              density="comfortable"
              clearable
              @update:model-value="handleDeadlineChange"
            />
          </div>
        </v-col>
        
        <!-- Tags -->
        <v-col cols="12">
          <div class="field-group">
            <label class="field-label">Tags</label>
            <v-combobox
              :model-value="editedProject.tags || []"
              :readonly="!editing"
              :variant="editing ? 'outlined' : 'plain'"
              chips
              closable-chips
              multiple
              density="comfortable"
              :hide-details="!editing"
              :hint="editing ? 'Press enter to add tags' : ''"
              :persistent-hint="editing"
              @update:model-value="updateField('tags', $event || [])"
            />
          </div>
        </v-col>
        
        <!-- Visibility -->
        <v-col cols="12">
          <div class="field-group">
            <label class="field-label">Visibility Settings</label>
            <ProjectVisibility
              :visibility="project.visibility"
              :shared-with="project.sharedWith || []"
              :can-edit="false"
            />
          </div>
        </v-col>
        
        <!-- Statistics -->
        <v-col cols="12">
          <v-divider class="my-4" />
          
          <div class="field-group stats-group">
            <label class="field-label">Project Statistics</label>
            
            <v-row dense>
              <v-col cols="6" sm="3">
                <div class="text-center stat-card">
                  <div class="text-h6">{{ project.viewCount || 0 }}</div>
                  <div class="text-caption text-grey-darken-1">Views</div>
                </div>
              </v-col>
              
              <v-col cols="6" sm="3">
                <div class="text-center stat-card">
                  <div class="text-h6">{{ fileCount }}</div>
                  <div class="text-caption text-grey-darken-1">Files</div>
                </div>
              </v-col>
              
              <v-col cols="6" sm="3">
                <div class="text-center stat-card">
                  <div class="text-h6">{{ messageCount }}</div>
                  <div class="text-caption text-grey-darken-1">Messages</div>
                </div>
              </v-col>
              
              <v-col cols="6" sm="3">
                <div class="text-center stat-card">
                  <div class="text-h6">{{ daysActive }}</div>
                  <div class="text-caption text-grey-darken-1">Days Active</div>
                </div>
              </v-col>
            </v-row>
          </div>
        </v-col>
      </v-row>
    </v-form>
  </v-card-text>
</template>

<script setup>
import { ref, computed, watch, onMounted } from 'vue'
import { LOUISIANA_REGIONS } from '@/config/louisiana-regions'
import ProjectVisibility from '../../ProjectVisibility.vue'
import { useCommsProjects } from '@/composables/comms/useCommsProjects'

// Props
const props = defineProps({
  project: {
    type: Object,
    required: true
  },
  editedProject: {
    type: Object,
    required: true
  },
  editing: {
    type: Boolean,
    default: false
  },
  canEdit: {
    type: Boolean,
    default: false
  }
})

// Emit
const emit = defineEmits(['update'])

// Composables
const { coordinatorRegions } = useCommsProjects()

// State
const formRef = ref(null)
const formValid = ref(false)
const loadingCoordinators = ref(false)
const coordinatorOptions = ref([])

// Validation rules
const rules = {
  required: v => !!v || 'This field is required',
  minLength: (min) => v => (v && v.length >= min) || `Must be at least ${min} characters`
}

// Region options with proper formatting
const regionOptions = computed(() => {
  return Object.entries(LOUISIANA_REGIONS).map(([id, region]) => ({
    id,
    name: region.name,
    parishes: region.parishes
  }))
})

// Priority options with labels
const priorityOptions = [
  { title: 'Low', value: 'low' },
  { title: 'Medium', value: 'medium' },
  { title: 'High', value: 'high' },
  { title: 'Urgent', value: 'urgent' }
]

// Computed properties
const displayedRegion = computed(() => {
  if (!props.project.region) return ''
  const region = regionOptions.value.find(r => r.id === props.project.region)
  return region?.name || props.project.region
})

const displayedPriority = computed(() => {
  if (!props.project.priority) return ''
  const priority = priorityOptions.find(p => p.value === props.project.priority)
  return priority?.title || props.project.priority
})

const displayedCoordinator = computed(() => {
  if (!props.project.coordinatorId) return 'Not assigned'
  const coordinator = coordinatorOptions.value.find(c => c.value === props.project.coordinatorId)
  return coordinator?.label || 'Loading...'
})

const formattedDeadline = computed(() => {
  if (!props.editedProject.deadline) return ''
  
  try {
    const date = props.editedProject.deadline.toDate 
      ? props.editedProject.deadline.toDate() 
      : new Date(props.editedProject.deadline)
    
    return date.toISOString().split('T')[0]
  } catch (error) {
    return ''
  }
})

const fileCount = computed(() => {
  return props.project.files?.length || 0
})

const messageCount = computed(() => {
  return props.project.messageCount || 0
})

const daysActive = computed(() => {
  if (!props.project.createdAt) return 0
  
  const created = props.project.createdAt.toDate 
    ? props.project.createdAt.toDate() 
    : new Date(props.project.createdAt)
  
  const now = new Date()
  const diff = now - created
  
  return Math.floor(diff / (1000 * 60 * 60 * 24))
})

// Methods
function updateField(field, value) {
  emit('update', { ...props.editedProject, [field]: value })
}

function handleRegionChange(value) {
  updateField('region', value)
  // Reset coordinator when region changes
  if (props.editedProject.coordinatorId) {
    updateField('coordinatorId', null)
  }
  loadCoordinators(value)
}

function handleDeadlineChange(value) {
  if (!value) {
    updateField('deadline', null)
    return
  }
  
  try {
    const date = new Date(value)
    updateField('deadline', date)
  } catch (error) {
    console.error('Invalid date:', error)
  }
}

async function loadCoordinators(regionId) {
  if (!regionId) return
  
  loadingCoordinators.value = true
  try {
    const coordinators = await coordinatorRegions(regionId)
    coordinatorOptions.value = coordinators.map(coord => ({
      label: coord.displayName || coord.email,
      value: coord.id,
      email: coord.email
    }))
  } catch (error) {
    console.error('Failed to load coordinators:', error)
    coordinatorOptions.value = []
  } finally {
    loadingCoordinators.value = false
  }
}

function getRegionColor(regionId) {
  const colors = {
    '1': '#1976D2',
    '2': '#388E3C',
    '3': '#7B1FA2',
    '4': '#F57C00',
    '5': '#D32F2F',
    '6': '#00796B',
    '7': '#5D4037',
    '8': '#616161',
    '9': '#303F9F'
  }
  return colors[regionId] || '#757575'
}

function getPriorityColor(priority) {
  const colors = {
    low: 'grey',
    medium: 'blue',
    high: 'orange',
    urgent: 'red'
  }
  return colors[priority] || 'grey'
}

// Watchers
watch(() => props.project.region, (newRegion) => {
  if (newRegion) {
    loadCoordinators(newRegion)
  }
})

watch(() => props.editing, (newVal) => {
  if (newVal && props.editedProject.region) {
    loadCoordinators(props.editedProject.region)
  }
})

// Lifecycle
onMounted(() => {
  // Load coordinators for display even when not editing
  if (props.project.region) {
    loadCoordinators(props.project.region)
  }
})
</script>

<style scoped>
/* Component-specific styles are handled by comms-dashboard.css */
/* Additional view mode styling */
.field-group .v-field--variant-plain .v-field__input {
  color: rgba(0, 0, 0, 0.87) !important;
  font-size: 1rem !important;
}

/* Ensure proper chip display in view mode */
.field-group .v-chip {
  cursor: default;
}

/* Description field specific fixes */
.field-group .v-textarea .v-field__input {
  min-height: auto !important;
  overflow: visible !important;
  line-height: 1.5 !important;
  padding-bottom: 12px !important;
}

/* Ensure text is not cut off in plain variant */
.field-group .v-field--variant-plain .v-textarea__wrapper {
  min-height: auto !important;
}

.field-group .v-textarea--auto-grow .v-field__input {
  overflow-y: hidden !important;
  word-break: break-word !important;
}

/* Ensure description shows all content */
.field-group .v-textarea[readonly] {
  min-height: fit-content !important;
}

/* Statistics cards */
.stats-group {
  background-color: rgba(0, 0, 0, 0.02) !important;
}

.stat-card {
  background-color: #fff;
  border-radius: 8px;
  padding: 16px 8px;
  border: 1px solid rgba(0, 0, 0, 0.06);
  transition: all 0.2s ease;
}

.stat-card:hover {
  border-color: rgba(0, 0, 0, 0.12);
  transform: translateY(-1px);
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.08);
}
</style>