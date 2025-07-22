<!-- client/src/components/comms/projects/ProjectFormStep1.vue -->
<template>
  <v-card-text class="step-content pa-8 text-left">
    <v-form ref="formRef" v-model="isValid">
      <!-- Title Field -->
      <div class="field-group">
        <label class="field-label">
          Project Title <span class="text-error">*</span>
        </label>
        <v-text-field
          v-model="localTitle"
          :rules="[rules.required]"
          placeholder="Enter a descriptive title for your project"
          variant="outlined"
          density="comfortable"
          counter="100"
          maxlength="100"
          @update:model-value="emitUpdate"
        />
      </div>

      <!-- Description Field -->
      <div class="field-group">
        <label class="field-label">
          Description <span class="text-error">*</span>
        </label>
        <v-textarea
          v-model="localDescription"
          :rules="[rules.required, rules.minLength(20)]"
          placeholder="Provide a detailed description of the project objectives and scope"
          variant="outlined"
          density="comfortable"
          rows="4"
          counter="500"
          maxlength="500"
          @update:model-value="emitUpdate"
        />
      </div>

      <!-- Region and Coordinator Row -->
      <v-row>
        <v-col cols="12" md="6">
          <div class="field-group">
            <label class="field-label">
              Region <span class="text-error">*</span>
            </label>
            <v-select
              v-model="localRegion"
              :items="regionOptions"
              item-title="name"
              item-value="id"
              :rules="[rules.required]"
              placeholder="Select region"
              variant="outlined"
              density="comfortable"
              @update:model-value="handleRegionChange"
            />
          </div>
        </v-col>
        
        <v-col cols="12" md="6">
          <div class="field-group">
            <label class="field-label">
              Coordinator <span class="text-error">*</span>
            </label>
            <v-text-field
              v-model="localCoordinator"
              :rules="[rules.required]"
              placeholder="Coordinator will be assigned"
              variant="outlined"
              density="comfortable"
              readonly
              @update:model-value="emitUpdate"
            />
            <p class="field-hint">
              Project coordinator will be automatically selected based on region
            </p>
          </div>
        </v-col>
      </v-row>

      <!-- Priority and Deadline Row -->
      <v-row>
        <v-col cols="12" md="6">
          <div class="field-group">
            <label class="field-label">
              Priority
            </label>
            <v-select
              v-model="localPriority"
              :items="priorityOptions"
              item-title="title"
              item-value="value"
              variant="outlined"
              density="comfortable"
              @update:model-value="emitUpdate"
            />
            <p class="field-hint">
              Set the urgency level for this project
            </p>
          </div>
        </v-col>
        
        <v-col cols="12" md="6">
          <div class="field-group">
            <label class="field-label">
              Deadline
            </label>
            <v-text-field
              v-model="localDeadline"
              type="date"
              :min="minDate"
              variant="outlined"
              density="comfortable"
              clearable
              @update:model-value="emitUpdate"
            />
            <p class="field-hint">
              Optional target completion date
            </p>
          </div>
        </v-col>
      </v-row>
    </v-form>
  </v-card-text>
</template>

<script setup>
import { ref, computed, watch, onMounted } from 'vue'
import { LOUISIANA_REGIONS } from '@/config/louisiana-regions'

// Props & Emits
const props = defineProps({
  modelValue: { type: Boolean, default: false },
  formData: { type: Object, required: true }
})
const emit = defineEmits(['update:modelValue', 'update:formData', 'coordinator-auto-selected'])

// Form ref and validation
const formRef = ref(null)
const isValid = computed({
  get: () => props.modelValue,
  set: (value) => emit('update:modelValue', value)
})

// Local state initialized from props
const localTitle = ref('')
const localDescription = ref('')
const localRegion = ref('')
const localCoordinator = ref('')
const localPriority = ref('normal')
const localDeadline = ref(null)

// UI state
const showNonDefaultAlert = ref(false)
const nonDefaultCoordinatorName = ref('')

// Options
const regionOptions = computed(() => 
  Object.entries(LOUISIANA_REGIONS).map(([id, region]) => ({
    id,
    name: region.name
  }))
)

const priorityOptions = [
  { title: 'Low', value: 'low' },
  { title: 'Normal', value: 'normal' },
  { title: 'High', value: 'high' },
  { title: 'Urgent', value: 'urgent' }
]

// Computed
const minDate = computed(() => {
  const today = new Date()
  today.setDate(today.getDate() + 1)
  return today.toISOString().split('T')[0]
})

// Validation rules
const rules = {
  required: (v) => !!v || 'This field is required',
  minLength: (min) => (v) => (v && v.length >= min) || `Must be at least ${min} characters`
}

// Initialize local values from props
function initializeFromProps() {
  localTitle.value = props.formData.title || ''
  localDescription.value = props.formData.description || ''
  localRegion.value = props.formData.region || ''
  localCoordinator.value = props.formData.coordinator || ''
  localPriority.value = props.formData.priority || 'normal'
  localDeadline.value = props.formData.deadline || null
}

// Emit updates to parent
function emitUpdate() {
  emit('update:formData', {
    title: localTitle.value,
    description: localDescription.value,
    region: localRegion.value,
    coordinator: localCoordinator.value,
    priority: localPriority.value,
    deadline: localDeadline.value
  })
}

// Handle region change
function handleRegionChange() {
  // Auto-assign coordinator placeholder when region changes
  if (localRegion.value) {
    const region = LOUISIANA_REGIONS[localRegion.value]
    if (region) {
      localCoordinator.value = `${region.name} Coordinator`
    }
  } else {
    localCoordinator.value = ''
  }
  emitUpdate()
}

// Handle coordinator selection
function handleCoordinatorAutoSelected(event) {
  console.log('Default coordinator selected:', event)
  const coordinator = event.coordinator
  const isDefault = event.isDefault !== undefined ? event.isDefault : true
  
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

// Watch for prop changes and reinitialize
watch(() => props.formData, () => {
  initializeFromProps()
}, { deep: true })

// Expose validation method to parent
async function validate() {
  if (!formRef.value) return { valid: false }
  const validation = await formRef.value.validate()
  return validation
}

// Initialize on mount
onMounted(() => {
  initializeFromProps()
})

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