<!-- client/src/components/comms/projects/ProjectForm.vue -->
<template>
  <v-dialog
    v-model="dialogOpen"
    max-width="800"
    persistent
    scrollable
  >
    <v-card>
      <!-- Header -->
      <v-card-title class="d-flex align-center pa-4">
        <v-icon start>mdi-folder-plus</v-icon>
        <span>Create New Project</span>
        <v-spacer />
        <v-btn
          icon
          variant="text"
          @click="handleCancel"
          :disabled="saving"
        >
          <v-icon>mdi-close</v-icon>
        </v-btn>
      </v-card-title>

      <v-divider />

      <!-- Form Content -->
      <v-card-text class="pa-6">
        <v-form ref="form" v-model="valid">
          <!-- Basic Information -->
          <div class="text-h6 mb-4">Basic Information</div>
          
          <v-row>
            <v-col cols="12">
              <v-text-field
                v-model="formData.title"
                label="Project Title"
                :rules="[rules.required]"
                variant="outlined"
                density="comfortable"
                counter="100"
                maxlength="100"
              />
            </v-col>

            <v-col cols="12">
              <v-textarea
                v-model="formData.description"
                label="Description"
                :rules="[rules.required]"
                variant="outlined"
                density="comfortable"
                rows="3"
                counter="500"
                maxlength="500"
              />
            </v-col>

            <v-col cols="12" md="6">
              <v-select
                v-model="formData.region"
                :items="regionItems"
                label="Region"
                :rules="[rules.required]"
                variant="outlined"
                density="comfortable"
              />
            </v-col>

            <v-col cols="12" md="6">
              <CoordinatorSelect
                v-model="formData.coordinator"
                :region="formData.region"
                :rules="[rules.required]"
              />
            </v-col>

            <v-col cols="12" md="6">
              <v-select
                v-model="formData.priority"
                :items="priorityOptions"
                label="Priority"
                variant="outlined"
                density="comfortable"
              />
            </v-col>

            <v-col cols="12" md="6">
              <v-menu
                v-model="deadlineMenu"
                :close-on-content-click="false"
                min-width="auto"
              >
                <template v-slot:activator="{ props }">
                  <v-text-field
                    v-model="formattedDeadline"
                    label="Deadline (Optional)"
                    prepend-inner-icon="mdi-calendar"
                    variant="outlined"
                    density="comfortable"
                    readonly
                    v-bind="props"
                    clearable
                    @click:clear="formData.deadline = null"
                  />
                </template>
                <v-date-picker
                  v-model="formData.deadline"
                  @update:model-value="deadlineMenu = false"
                />
              </v-menu>
            </v-col>
          </v-row>

          <!-- Project Stages -->
          <div class="text-h6 mb-4 mt-6">Project Stages</div>
          <ProjectStages
            v-model="formData.stages"
            :template-id="formData.templateId"
          />

          <!-- Additional Settings -->
          <div class="text-h6 mb-4 mt-6">Additional Settings</div>
          
          <v-row>
            <v-col cols="12">
              <v-select
                v-model="formData.visibility"
                :items="visibilityOptions"
                label="Visibility"
                variant="outlined"
                density="comfortable"
                hint="Who can view this project"
                persistent-hint
              />
            </v-col>

            <v-col cols="12">
              <v-combobox
                v-model="formData.tags"
                label="Tags (Optional)"
                variant="outlined"
                density="comfortable"
                multiple
                chips
                closable-chips
                hint="Press Enter to add a tag"
                persistent-hint
              />
            </v-col>

            <v-col cols="12">
              <v-checkbox
                v-model="formData.enableForum"
                label="Enable project discussion forum"
                density="comfortable"
              />
            </v-col>
          </v-row>

          <!-- Template Selection (Placeholder) -->
          <v-alert
            type="info"
            variant="tonal"
            class="mt-4"
          >
            <v-icon start>mdi-information</v-icon>
            Template selection will be available in a future update
          </v-alert>
        </v-form>
      </v-card-text>

      <v-divider />

      <!-- Actions -->
      <v-card-actions class="pa-4">
        <v-spacer />
        <v-btn
          variant="text"
          @click="handleCancel"
          :disabled="saving"
        >
          Cancel
        </v-btn>
        <v-btn
          color="primary"
          variant="flat"
          @click="handleSave"
          :loading="saving"
          :disabled="!valid || saving"
        >
          Create Project
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import { LOUISIANA_REGIONS as louisianaRegions } from '@/config/louisiana-regions'
import ProjectStages from './ProjectStages.vue'
import CoordinatorSelect from '../coordinators/CoordinatorSelect.vue'

// Props
const props = defineProps({
  modelValue: {
    type: Boolean,
    default: false
  }
})

// Emits
const emit = defineEmits(['update:modelValue', 'created'])

// Dialog state
const dialogOpen = computed({
  get: () => props.modelValue,
  set: (value) => emit('update:modelValue', value)
})

// Form state
const form = ref(null)
const valid = ref(false)
const saving = ref(false)
const deadlineMenu = ref(false)

// Form data
const formData = ref({
  title: '',
  description: '',
  region: '',
  coordinator: '',
  priority: 'normal',
  deadline: null,
  stages: [],
  visibility: 'coordinator',
  tags: [],
  enableForum: true,
  templateId: null
})

// Validation rules
const rules = {
  required: (v) => !!v || 'This field is required'
}

// Options
const regionItems = computed(() => 
  Object.entries(louisianaRegions).map(([id, region]) => ({
    title: region.name,
    value: id
  }))
)

const priorityOptions = [
  { title: 'Low', value: 'low' },
  { title: 'Normal', value: 'normal' },
  { title: 'High', value: 'high' },
  { title: 'Urgent', value: 'urgent' }
]

const visibilityOptions = [
  { title: 'Private (Only me)', value: 'private' },
  { title: 'Coordinator & Creator', value: 'coordinator' },
  { title: 'All Communications Team', value: 'team' },
  { title: 'Public (Anyone with link)', value: 'public' }
]

// Computed
const formattedDeadline = computed(() => {
  if (!formData.value.deadline) return ''
  return new Date(formData.value.deadline).toLocaleDateString()
})

// Methods
function handleCancel() {
  if (!saving.value) {
    resetForm()
    dialogOpen.value = false
  }
}

async function handleSave() {
  const validation = await form.value.validate()
  if (!validation.valid) return

  saving.value = true
  
  try {
    // Emit the form data for parent to handle
    emit('created', {
      ...formData.value,
      deadline: formData.value.deadline ? new Date(formData.value.deadline) : null
    })
    
    resetForm()
    dialogOpen.value = false
  } catch (error) {
    console.error('Error in form submission:', error)
  } finally {
    saving.value = false
  }
}

function resetForm() {
  form.value?.reset()
  formData.value = {
    title: '',
    description: '',
    region: '',
    coordinator: '',
    priority: 'normal',
    deadline: null,
    stages: [],
    visibility: 'coordinator',
    tags: [],
    enableForum: true,
    templateId: null
  }
}

// Reset form when dialog opens
watch(dialogOpen, (newVal) => {
  if (newVal) {
    resetForm()
  }
})
</script>

<style scoped>
.v-card-title {
  font-weight: 500;
}
</style>