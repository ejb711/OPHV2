<!-- client/src/components/comms/projects/ProjectFormStep1.vue -->
<template>
  <div class="step-content pa-6">
    <div class="text-center mb-6">
      <h3 class="text-h6 font-weight-bold text-grey-darken-3 mb-2">Basic Information</h3>
      <p class="text-body-2 text-grey-darken-1 mb-0">Enter the essential details for your project</p>
    </div>
    
    <v-form ref="formRef" v-model="valid" @submit.prevent>
      <v-container fluid class="pa-0">
        <v-row>
          <!-- Project Title -->
          <v-col cols="12">
            <div class="field-group">
              <label class="field-label">
                Project Title <span class="text-error">*</span>
              </label>
              <v-text-field
                v-model="localFormData.title"
                variant="outlined"
                density="comfortable"
                placeholder="Enter a descriptive project title"
                :rules="[rules.required]"
                counter="100"
                maxlength="100"
                hide-details="auto"
              />
            </div>
          </v-col>

          <!-- Description -->
          <v-col cols="12">
            <div class="field-group">
              <label class="field-label">
                Description <span class="text-error">*</span>
              </label>
              <v-textarea
                v-model="localFormData.description"
                variant="outlined"
                density="comfortable"
                placeholder="Describe the project goals and objectives"
                :rules="[rules.required]"
                rows="3"
                counter="500"
                maxlength="500"
                hide-details="auto"
              />
            </div>
          </v-col>

          <!-- Region -->
          <v-col cols="12" md="6">
            <div class="field-group">
              <label class="field-label">
                Region <span class="text-error">*</span>
              </label>
              <v-select
                v-model="localFormData.region"
                :items="regionItems"
                variant="outlined"
                density="comfortable"
                placeholder="Select region"
                :rules="[rules.required]"
                hide-details="auto"
                @update:model-value="handleRegionChange"
              >
                <template v-slot:prepend-inner>
                  <v-icon color="primary" size="small">mdi-map-marker</v-icon>
                </template>
              </v-select>
              <div class="field-hint">Select the Louisiana region for this project</div>
            </div>
          </v-col>

          <!-- Coordinator -->
          <v-col cols="12" md="6">
            <div class="field-group">
              <label class="field-label">
                Coordinator <span class="text-error">*</span>
              </label>
              <CoordinatorSelect
                v-model="localFormData.coordinator"
                :region="localFormData.region"
                :rules="[rules.required]"
                label=""
                auto-select
                density="comfortable"
                @default-selected="handleDefaultCoordinatorSelected"
                @non-default-selected="handleNonDefaultSelected"
                @coordinator-auto-selected="handleDefaultCoordinatorSelected"
              />
              <div class="field-hint">Select the project coordinator</div>
            </div>
          </v-col>

          <!-- Priority -->
          <v-col cols="12" md="6">
            <div class="field-group">
              <label class="field-label">Priority</label>
              <v-select
                v-model="localFormData.priority"
                :items="priorityOptions"
                variant="outlined"
                density="comfortable"
                placeholder="Select priority"
                hide-details="auto"
              >
                <template v-slot:prepend-inner>
                  <v-icon 
                    :color="getPriorityColor(localFormData.priority)" 
                    size="small"
                  >
                    {{ getPriorityIcon(localFormData.priority) }}
                  </v-icon>
                </template>
                <template v-slot:item="{ props, item }">
                  <v-list-item v-bind="props">
                    <template v-slot:prepend>
                      <v-icon :color="getPriorityColor(item.value)">
                        {{ getPriorityIcon(item.value) }}
                      </v-icon>
                    </template>
                  </v-list-item>
                </template>
              </v-select>
              <div class="field-hint">Set the priority level for this project</div>
            </div>
          </v-col>

          <!-- Deadline -->
          <v-col cols="12" md="6">
            <div class="field-group">
              <label class="field-label">Deadline (Optional)</label>
              <v-menu
                v-model="deadlineMenu"
                :close-on-content-click="false"
                transition="scale-transition"
                min-width="auto"
              >
                <template v-slot:activator="{ props }">
                  <v-text-field
                    v-model="formattedDeadline"
                    variant="outlined"
                    density="comfortable"
                    placeholder="Select deadline"
                    readonly
                    v-bind="props"
                    hide-details
                    clearable
                    @click:clear="localFormData.deadline = null"
                  >
                    <template v-slot:prepend-inner>
                      <v-icon color="primary" size="small">mdi-calendar</v-icon>
                    </template>
                  </v-text-field>
                </template>
                <v-date-picker
                  v-model="localFormData.deadline"
                  :min="minDate"
                  color="primary"
                  @update:model-value="deadlineMenu = false"
                />
              </v-menu>
              <div class="field-hint">Click to select a target completion date</div>
            </div>
          </v-col>
        </v-row>

        <!-- Alert for non-default coordinator -->
        <v-alert
          v-if="showNonDefaultAlert && nonDefaultCoordinatorName"
          type="info"
          variant="tonal"
          class="mt-4"
          closable
          @click:close="showNonDefaultAlert = false"
        >
          <template v-slot:prepend>
            <v-icon>mdi-information</v-icon>
          </template>
          <div class="text-body-2">
            <strong>{{ nonDefaultCoordinatorName }}</strong> will be assigned as the coordinator for this project in the <strong>{{ selectedRegionName }}</strong> region.
            This coordinator will be notified of the project assignment.
          </div>
        </v-alert>
      </v-container>
    </v-form>
  </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import { LOUISIANA_REGIONS as louisianaRegions } from '@/config/louisiana-regions'
import { useSnackbar } from '@/composables/useSnackbar'
import CoordinatorSelect from '../coordinators/CoordinatorSelect.vue'

// Props
const props = defineProps({
  formData: {
    type: Object,
    required: true
  },
  modelValue: {
    type: Boolean,
    default: false
  }
})

// Emits
const emit = defineEmits(['update:modelValue', 'update:formData', 'coordinator-auto-selected'])

// Composables
const { showSnackbar } = useSnackbar()

// Refs
const formRef = ref(null)
const deadlineMenu = ref(false)
const showNonDefaultAlert = ref(false)
const nonDefaultCoordinatorName = ref('')

// Local form data (two-way binding with parent)
const localFormData = computed({
  get: () => props.formData,
  set: (value) => emit('update:formData', value)
})

// Form validation
const valid = computed({
  get: () => props.modelValue,
  set: (value) => emit('update:modelValue', value)
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

const selectedRegionName = computed(() => {
  if (!localFormData.value.region) return ''
  const region = louisianaRegions[localFormData.value.region]
  return region ? region.name : ''
})

const priorityOptions = [
  { title: 'Low', value: 'low' },
  { title: 'Normal', value: 'normal' },
  { title: 'High', value: 'high' },
  { title: 'Urgent', value: 'urgent' }
]

// Computed
const minDate = computed(() => {
  const date = new Date()
  date.setDate(date.getDate() + 1)
  return date.toISOString().split('T')[0]
})

const formattedDeadline = computed(() => {
  if (!localFormData.value.deadline) return ''
  try {
    const date = new Date(localFormData.value.deadline)
    return date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric' 
    })
  } catch {
    return ''
  }
})

// Methods
function getPriorityColor(priority) {
  const colors = {
    low: 'success',
    normal: 'info',
    high: 'warning',
    urgent: 'error'
  }
  return colors[priority] || 'info'
}

function getPriorityIcon(priority) {
  const icons = {
    low: 'mdi-chevron-down',
    normal: 'mdi-minus',
    high: 'mdi-chevron-up',
    urgent: 'mdi-alert-circle'
  }
  return icons[priority] || 'mdi-minus'
}

function handleRegionChange() {
  // Clear coordinator when region changes
  localFormData.value.coordinator = ''
  showNonDefaultAlert.value = false
  nonDefaultCoordinatorName.value = ''
}

function handleDefaultCoordinatorSelected(event) {
  console.log('Coordinator selected event:', event)
  
  // Handle both event formats from CoordinatorSelect
  const coordinator = event.coordinator || event
  const isDefault = event.region ? true : false
  
  if (isDefault && coordinator) {
    showNonDefaultAlert.value = false
    nonDefaultCoordinatorName.value = ''
  }
  
  emit('coordinator-auto-selected', event)
}

function handleNonDefaultSelected(event) {
  console.log('Non-default coordinator selected:', event)
  if (event.coordinator) {
    nonDefaultCoordinatorName.value = event.coordinator.name || event.coordinator.displayName || event.coordinator.email
    showNonDefaultAlert.value = true
  }
  emit('coordinator-auto-selected', event)
}

// Expose validation method to parent
async function validate() {
  if (!formRef.value) return { valid: false }
  const validation = await formRef.value.validate()
  return validation
}

// Watch for changes and emit updates
watch(localFormData, (newValue) => {
  emit('update:formData', newValue)
}, { deep: true })

defineExpose({
  validate,
  reset: () => formRef.value?.reset()
})
</script>

<style scoped>
.step-content {
  min-height: 500px;
}

/* Field Group Styling */
.field-group {
  margin-bottom: 1rem;
}

.field-label {
  display: block;
  font-size: 0.875rem;
  font-weight: 600;
  color: #424242;
  margin-bottom: 0.5rem;
  font-family: 'Cambria', Georgia, serif;
}

.field-hint {
  font-size: 0.75rem;
  color: #666;
  margin-top: 0.25rem;
  font-family: 'Cambria', Georgia, serif;
}

/* Required field indicator */
.text-error {
  color: rgb(176, 0, 32);
}

/* Column spacing */
.v-col {
  padding-left: 12px;
  padding-right: 12px;
}

/* Alert styling */
.v-alert {
  border-radius: 8px;
}

/* Ensure consistent field heights and appearance */
:deep(.v-field) {
  min-height: 40px;
}

:deep(.v-field__input) {
  min-height: 40px;
  font-size: 16px;
}

:deep(.v-select .v-field__input),
:deep(.v-text-field .v-field__input) {
  padding-top: 0;
  padding-bottom: 0;
}

/* Responsive adjustments */
@media (max-width: 599px) {
  .v-col {
    padding-left: 8px;
    padding-right: 8px;
  }
  
  .step-content {
    padding: 24px 16px !important;
  }
}
</style>