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
          <!-- Project Title - Full Width -->
          <v-col cols="12" class="pb-6">
            <v-text-field
              v-model="localFormData.title"
              label="Project Title"
              :rules="[rules.required]"
              variant="outlined"
              density="default"
              counter="100"
              maxlength="100"
              placeholder="Enter a descriptive project title"
              hide-details="auto"
              class="text-field-spaced"
              required
            >
              <template v-slot:label>
                <span>Project Title <span class="text-error">*</span></span>
              </template>
            </v-text-field>
          </v-col>

          <!-- Description - Full Width -->
          <v-col cols="12" class="pb-6">
            <v-textarea
              v-model="localFormData.description"
              label="Description"
              :rules="[rules.required]"
              variant="outlined"
              density="default"
              rows="3"
              counter="500"
              maxlength="500"
              placeholder="Describe the project goals and objectives"
              hide-details="auto"
              class="text-field-spaced"
              required
            >
              <template v-slot:label>
                <span>Description <span class="text-error">*</span></span>
              </template>
            </v-textarea>
          </v-col>

          <!-- Region and Coordinator Row -->
          <v-col cols="12" sm="6" class="pb-6">
            <v-select
              v-model="localFormData.region"
              :items="regionItems"
              label="Region"
              :rules="[rules.required]"
              variant="outlined"
              density="default"
              placeholder="Select target region"
              hide-details="auto"
              class="text-field-spaced"
              @update:model-value="handleRegionChange"
              required
            >
              <template v-slot:label>
                <span>Region <span class="text-error">*</span></span>
              </template>
            </v-select>
          </v-col>

          <v-col cols="12" sm="6" class="pb-6">
            <CoordinatorSelect
              v-model="localFormData.coordinator"
              :region="localFormData.region"
              :rules="[rules.required]"
              label="Coordinator *"
              required
              @coordinator-auto-selected="onCoordinatorAutoSelected"
              @non-default-selected="onNonDefaultSelected"
              @default-selected="onDefaultSelected"
            />
          </v-col>

          <!-- Priority and Deadline Row -->
          <v-col cols="12" sm="6" class="pb-6">
            <v-select
              v-model="localFormData.priority"
              :items="priorityOptions"
              label="Priority"
              variant="outlined"
              density="default"
              hide-details="auto"
              class="text-field-spaced"
            />
          </v-col>

          <v-col cols="12" sm="6" class="pb-4">
            <v-menu
              v-model="deadlineMenu"
              :close-on-content-click="false"
              min-width="auto"
              offset-y
            >
              <template v-slot:activator="{ props }">
                <v-text-field
                  v-model="formattedDeadline"
                  label="Deadline (Optional)"
                  prepend-inner-icon="mdi-calendar"
                  variant="outlined"
                  density="default"
                  readonly
                  v-bind="props"
                  clearable
                  @click:clear="localFormData.deadline = null"
                  placeholder="Set project deadline"
                  hide-details="auto"
                  class="text-field-spaced"
                />
              </template>
              <v-date-picker
                v-model="localFormData.deadline"
                @update:model-value="deadlineMenu = false"
              />
            </v-menu>
          </v-col>
        </v-row>

        <!-- Non-default coordinator alert -->
        <v-alert
          v-if="showNonDefaultAlert"
          type="info"
          variant="tonal"
          density="compact"
          closable
          class="mt-4"
          @click:close="showNonDefaultAlert = false"
        >
          <template v-slot:title>
            <div class="d-flex align-center">
              <v-icon start size="small">mdi-information</v-icon>
              Non-default Coordinator Selected
            </div>
          </template>
          <div class="text-body-2">
            You've selected <strong>{{ nonDefaultCoordinatorName }}</strong> instead of the default coordinator for {{ selectedRegionName }}.
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
  return region ? region.name : localFormData.value.region
})

const priorityOptions = [
  { title: 'Low', value: 'low' },
  { title: 'Normal', value: 'normal' },
  { title: 'High', value: 'high' },
  { title: 'Urgent', value: 'urgent' }
]

// Computed
const formattedDeadline = computed(() => {
  if (!localFormData.value.deadline) return ''
  return new Date(localFormData.value.deadline).toLocaleDateString()
})

// Methods
function handleRegionChange(value) {
  // Clear coordinator if changing region
  if (value !== props.formData.region) {
    localFormData.value.coordinator = ''
    showNonDefaultAlert.value = false
  }
}

function onCoordinatorAutoSelected(event) {
  console.log('Coordinator auto-selected:', event)
  emit('coordinator-auto-selected', event)
  showNonDefaultAlert.value = false
}

function onNonDefaultSelected(event) {
  console.log('Non-default coordinator selected:', event)
  
  // Show alert to user
  nonDefaultCoordinatorName.value = event.coordinator.name || event.coordinator.email
  showNonDefaultAlert.value = true
  
  // Also show a snackbar for immediate feedback
  showSnackbar({
    message: `Selected ${event.coordinator.name || event.coordinator.email} as coordinator`,
    color: 'info',
    timeout: 3000
  })
}

function onDefaultSelected(event) {
  console.log('Default coordinator selected:', event)
  // Clear the non-default alert
  showNonDefaultAlert.value = false
}

// Expose validation method to parent
async function validate() {
  if (!formRef.value) return { valid: false }
  return await formRef.value.validate()
}

// Watch for changes and emit updates
watch(localFormData, (newValue) => {
  emit('update:formData', newValue)
}, { deep: true })

defineExpose({
  validate,
  reset: () => {
    formRef.value?.reset()
    showNonDefaultAlert.value = false
  }
})
</script>

<style scoped>
.step-content {
  min-height: 500px;
}

/* Enhanced form field spacing */
.text-field-spaced {
  margin-bottom: 8px !important;
}

/* ========================================
   FIELD STRUCTURE AND LABEL POSITIONING
   Based on admin panel working styles
   ======================================== */

/* Ensure consistent field structure */
:deep(.v-field) {
  border-radius: 8px !important;
  background-color: transparent !important;
  transition: all 0.2s ease !important;
}

/* Text field and textarea input spacing */
:deep(.v-text-field .v-field__input),
:deep(.v-textarea .v-field__input) {
  min-height: 56px !important;
  padding: 20px 16px 8px 16px !important;
  font-size: 16px !important;
  line-height: 1.5 !important;
}

/* SELECT FIELD SPECIFIC - Different from text fields */
:deep(.v-select .v-field__input) {
  min-height: 56px !important;
  padding: 16px !important;
  display: flex !important;
  align-items: center !important;
}

/* Fix label positioning for ALL field types */
:deep(.v-field__label) {
  font-size: 16px !important;
  color: rgba(0, 0, 0, 0.6) !important;
  font-family: 'Cambria', Georgia, serif !important;
}

/* Text field labels - floating behavior */
:deep(.v-text-field .v-field__label),
:deep(.v-textarea .v-field__label) {
  position: absolute !important;
  top: 50% !important;
  left: 16px !important;
  transform: translateY(-50%) !important;
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1) !important;
  pointer-events: none !important;
  max-width: calc(100% - 32px) !important;
}

/* Active/focused/dirty state for text fields */
:deep(.v-text-field .v-field--active .v-field__label),
:deep(.v-text-field .v-field--focused .v-field__label),
:deep(.v-text-field .v-field--dirty .v-field__label),
:deep(.v-textarea .v-field--active .v-field__label),
:deep(.v-textarea .v-field--focused .v-field__label),
:deep(.v-textarea .v-field--dirty .v-field__label) {
  top: 12px !important;
  transform: translateY(0) scale(0.75) !important;
  transform-origin: top left !important;
  background-color: white !important;
  padding: 0 4px !important;
  margin-left: -4px !important;
}

/* Ensure proper z-index for labels */
:deep(.v-field__label) {
  z-index: 10 !important;
}

/* Outline variant label background */
:deep(.v-field--variant-outlined .v-field__label) {
  background-color: white !important;
}

/* Fix textarea specific styling */
:deep(.v-textarea .v-field__input) {
  padding-top: 28px !important;
  min-height: auto !important;
}

/* Placeholder styling */
:deep(.v-field__input input::placeholder),
:deep(.v-field__input textarea::placeholder) {
  color: rgba(0, 0, 0, 0.38) !important;
  opacity: 1 !important;
}

/* Focus states */
:deep(.v-field--focused) {
  box-shadow: 0 0 0 2px rgba(25, 118, 210, 0.2) !important;
}

/* Error states */
:deep(.v-field--error:not(.v-field--disabled) .v-field__outline) {
  color: #d32f2f !important;
}

/* Consistent column spacing */
.v-col {
  padding-left: 12px;
  padding-right: 12px;
}

/* Alert styling */
.v-alert {
  border-radius: 8px;
}

.v-alert .text-body-2 {
  line-height: 1.5;
}

/* Counter styling */
:deep(.v-counter) {
  font-size: 0.75rem !important;
  color: rgba(0, 0, 0, 0.6) !important;
}

/* Messages (errors/hints) styling */
:deep(.v-messages) {
  min-height: 22px !important;
  padding-top: 4px !important;
  font-size: 0.75rem !important;
}

/* Responsive improvements */
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