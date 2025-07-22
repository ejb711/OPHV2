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
              label="Project Title *"
              :rules="[rules.required]"
              variant="outlined"
              density="comfortable"
              counter="100"
              maxlength="100"
              placeholder="Enter a descriptive project title"
              hide-details="auto"
              class="text-field-spaced"
            />
          </v-col>

          <!-- Description - Full Width -->
          <v-col cols="12" class="pb-6">
            <v-textarea
              v-model="localFormData.description"
              label="Description *"
              :rules="[rules.required]"
              variant="outlined"
              density="comfortable"
              rows="3"
              counter="500"
              maxlength="500"
              placeholder="Describe the project goals and objectives"
              hide-details="auto"
              class="text-field-spaced"
            />
          </v-col>

          <!-- Region and Coordinator Row -->
          <v-col cols="12" sm="6" class="pb-6">
            <v-select
              v-model="localFormData.region"
              :items="regionItems"
              label="Region *"
              :rules="[rules.required]"
              variant="outlined"
              density="comfortable"
              placeholder="Select target region"
              hide-details="auto"
              class="text-field-spaced"
            />
          </v-col>

          <v-col cols="12" sm="6" class="pb-6">
            <CoordinatorSelect
              v-model="localFormData.coordinator"
              :region="localFormData.region"
              :rules="[rules.required]"
              label="Coordinator *"
              @coordinator-auto-selected="onCoordinatorAutoSelected"
            />
          </v-col>

          <!-- Priority and Deadline Row -->
          <v-col cols="12" sm="6" class="pb-6">
            <v-select
              v-model="localFormData.priority"
              :items="priorityOptions"
              label="Priority"
              variant="outlined"
              density="comfortable"
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
                  density="comfortable"
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
      </v-container>
    </v-form>
  </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import { LOUISIANA_REGIONS as louisianaRegions } from '@/config/louisiana-regions'
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

// Refs
const formRef = ref(null)
const deadlineMenu = ref(false)

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
function onCoordinatorAutoSelected(event) {
  emit('coordinator-auto-selected', event)
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
  reset: () => formRef.value?.reset()
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

/* Ensure consistent field heights and spacing */
:deep(.v-field) {
  border-radius: 8px !important;
  margin-bottom: 4px;
}

:deep(.v-text-field .v-field__input),
:deep(.v-textarea .v-field__input),
:deep(.v-select .v-field__input) {
  min-height: 52px !important;
  padding-top: 18px !important;
  padding-bottom: 18px !important;
}

/* Fix label positioning */
:deep(.v-label) {
  font-size: 0.875rem;
  color: rgba(0, 0, 0, 0.6) !important;
}

/* Proper spacing for form validation messages */
:deep(.v-messages) {
  min-height: 0px !important;
  padding-top: 4px !important;
}

/* Consistent column spacing */
.v-col {
  padding-left: 12px;
  padding-right: 12px;
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