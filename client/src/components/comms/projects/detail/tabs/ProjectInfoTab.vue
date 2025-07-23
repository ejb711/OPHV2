<!-- client/src/components/comms/projects/detail/tabs/ProjectInfoTab.vue -->
<template>
  <v-card-text>
    <v-form ref="formRef" v-model="formValid">
      <v-row>
        <!-- Title -->
        <v-col cols="12">
          <v-text-field
            :model-value="editedProject.title"
            label="Project Title"
            :readonly="!editing"
            :variant="editing ? 'outlined' : 'plain'"
            :rules="editing ? [rules.required] : []"
            @update:model-value="updateField('title', $event)"
          />
        </v-col>
        
        <!-- Description -->
        <v-col cols="12">
          <v-textarea
            :model-value="editedProject.description"
            label="Description"
            :readonly="!editing"
            :variant="editing ? 'outlined' : 'plain'"
            :rows="editing ? 4 : 3"
            auto-grow
            @update:model-value="updateField('description', $event)"
          />
        </v-col>
        
        <!-- Region & Coordinator -->
        <v-col cols="12" md="6">
          <v-select
            :model-value="editedProject.region"
            label="Region"
            :items="regionOptions"
            item-title="name"
            item-value="id"
            :readonly="!editing"
            :variant="editing ? 'outlined' : 'plain'"
            :rules="editing ? [rules.required] : []"
            @update:model-value="handleRegionChange"
          >
            <template v-slot:item="{ props, item }">
              <v-list-item v-bind="props">
                <template v-slot:prepend>
                  <v-avatar
                    :color="getRegionColor(item.raw.id)"
                    size="small"
                  />
                </template>
              </v-list-item>
            </template>
          </v-select>
        </v-col>
        
        <v-col cols="12" md="6">
          <v-select
            :model-value="editedProject.coordinatorId"
            label="Coordinator"
            :items="coordinatorOptions"
            item-title="label"
            item-value="value"
            :readonly="!editing"
            :variant="editing ? 'outlined' : 'plain'"
            :loading="loadingCoordinators"
            clearable
            @update:model-value="updateField('coordinatorId', $event)"
          />
        </v-col>
        
        <!-- Priority & Deadline -->
        <v-col cols="12" md="6">
          <v-select
            :model-value="editedProject.priority"
            label="Priority"
            :items="priorityOptions"
            :readonly="!editing"
            :variant="editing ? 'outlined' : 'plain'"
            @update:model-value="updateField('priority', $event)"
          />
        </v-col>
        
        <v-col cols="12" md="6">
          <v-text-field
            :model-value="formattedDeadline"
            label="Deadline"
            type="date"
            :readonly="!editing"
            :variant="editing ? 'outlined' : 'plain'"
            clearable
            @update:model-value="handleDeadlineChange"
          />
        </v-col>
        
        <!-- Tags -->
        <v-col cols="12">
          <v-combobox
            :model-value="editedProject.tags"
            label="Tags"
            :readonly="!editing"
            :variant="editing ? 'outlined' : 'plain'"
            chips
            closable-chips
            multiple
            :hint="editing ? 'Press enter to add tags' : ''"
            persistent-hint
            @update:model-value="updateField('tags', $event)"
          />
        </v-col>
        
        <!-- Visibility -->
        <v-col cols="12">
          <ProjectVisibility
            :visibility="project.visibility"
            :shared-with="project.sharedWith || []"
            :can-edit="false"
          />
        </v-col>
        
        <!-- Statistics -->
        <v-col cols="12">
          <v-divider class="my-4" />
          
          <div class="text-caption text-grey mb-2">Project Statistics</div>
          
          <v-row dense>
            <v-col cols="6" sm="3">
              <div class="text-center">
                <div class="text-h6">{{ project.viewCount || 0 }}</div>
                <div class="text-caption">Views</div>
              </div>
            </v-col>
            
            <v-col cols="6" sm="3">
              <div class="text-center">
                <div class="text-h6">{{ fileCount }}</div>
                <div class="text-caption">Files</div>
              </div>
            </v-col>
            
            <v-col cols="6" sm="3">
              <div class="text-center">
                <div class="text-h6">{{ messageCount }}</div>
                <div class="text-caption">Messages</div>
              </div>
            </v-col>
            
            <v-col cols="6" sm="3">
              <div class="text-center">
                <div class="text-h6">{{ daysActive }}</div>
                <div class="text-caption">Days Active</div>
              </div>
            </v-col>
          </v-row>
        </v-col>
      </v-row>
    </v-form>
  </v-card-text>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
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
  required: v => !!v || 'Required'
}

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

// Computed
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
  return props.project.messages?.length || 0
})

const daysActive = computed(() => {
  if (!props.project.createdAt) return 0
  
  try {
    const created = props.project.createdAt.toDate 
      ? props.project.createdAt.toDate() 
      : new Date(props.project.createdAt)
    
    const now = new Date()
    const diffTime = Math.abs(now - created)
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    
    return diffDays
  } catch (error) {
    return 0
  }
})

// Methods
function updateField(field, value) {
  emit('update', field, value)
}

function getRegionColor(regionId) {
  return LOUISIANA_REGIONS[regionId]?.color || 'grey'
}

function handleRegionChange(value) {
  updateField('region', value)
  
  // Clear coordinator if changing region
  if (value !== props.project.region) {
    updateField('coordinatorId', null)
  }
  
  // Load coordinators for new region
  loadCoordinatorsForRegion(value)
}

function handleDeadlineChange(value) {
  const deadline = value ? new Date(value) : null
  updateField('deadline', deadline)
}

async function loadCoordinatorsForRegion(regionId) {
  if (!regionId) {
    coordinatorOptions.value = []
    return
  }
  
  loadingCoordinators.value = true
  
  try {
    // Get coordinators for this region
    const coords = await coordinatorRegions.value
    const regionCoords = coords
      .filter(c => c.regions?.includes(regionId))
      .map(c => ({
        value: c.userId,
        label: c.email || c.userId
      }))
    
    coordinatorOptions.value = [
      { value: null, label: 'Unassigned' },
      ...regionCoords
    ]
  } catch (error) {
    console.error('Failed to load coordinators:', error)
    coordinatorOptions.value = []
  } finally {
    loadingCoordinators.value = false
  }
}

// Watch for region changes
watch(() => props.editedProject.region, (region) => {
  if (region) {
    loadCoordinatorsForRegion(region)
  }
}, { immediate: true })
</script>