<!-- client/src/components/comms/projects/ProjectFormStep3.vue -->
<template>
  <div class="step-content pa-6">
    <div class="text-center mb-6">
      <h3 class="text-h6 font-weight-bold text-grey-darken-3 mb-2">Additional Settings</h3>
      <p class="text-body-2 text-grey-darken-1 mb-0">Configure visibility and collaboration options</p>
    </div>
    
    <v-form ref="formRef" v-model="valid" @submit.prevent>
      <v-container fluid class="pa-0">
        <v-row>
          <!-- Visibility Settings -->
          <v-col cols="12" class="pb-6">
            <v-select
              v-model="localFormData.visibility"
              :items="visibilityOptions"
              label="Project Visibility"
              variant="outlined"
              density="comfortable"
              hint="Who can view and access this project"
              persistent-hint
              hide-details="auto"
              class="text-field-spaced"
            >
              <template v-slot:prepend-inner>
                <v-icon color="primary">mdi-eye</v-icon>
              </template>
            </v-select>
          </v-col>

          <!-- Tags -->
          <v-col cols="12" class="pb-6">
            <v-combobox
              v-model="localFormData.tags"
              label="Project Tags (Optional)"
              variant="outlined"
              density="comfortable"
              multiple
              chips
              closable-chips
              hint="Add tags to help organize and categorize projects"
              persistent-hint
              placeholder="Type and press Enter to add tags"
              hide-details="auto"
              class="text-field-spaced"
            >
              <template v-slot:prepend-inner>
                <v-icon color="primary">mdi-tag-multiple</v-icon>
              </template>
              
              <template v-slot:chip="{ props, item }">
                <v-chip
                  v-bind="props"
                  color="primary"
                  variant="tonal"
                  size="small"
                  closable
                >
                  {{ item }}
                </v-chip>
              </template>
            </v-combobox>
          </v-col>

          <!-- Forum Settings -->
          <v-col cols="12" class="pb-4">
            <v-card variant="outlined" class="pa-4">
              <div class="d-flex align-center">
                <v-icon color="primary" class="mr-3">mdi-forum</v-icon>
                <div class="flex-grow-1">
                  <div class="text-body-1 font-weight-medium mb-1">Discussion Forum</div>
                  <div class="text-body-2 text-grey-darken-1">
                    Enable a discussion forum for this project where team members can collaborate
                  </div>
                </div>
                <v-switch
                  v-model="localFormData.enableForum"
                  color="primary"
                  hide-details
                  inset
                />
              </div>
            </v-card>
          </v-col>
        </v-row>

        <!-- Template Section (Placeholder) -->
        <v-divider class="my-6" />
        
        <div class="text-center">
          <v-alert
            type="info"
            variant="tonal"
            class="text-left"
          >
            <template v-slot:prepend>
              <v-icon>mdi-information</v-icon>
            </template>
            <div class="text-body-2">
              <strong>Coming Soon:</strong> Project templates will allow you to save and reuse common project configurations.
              This feature will be available in a future update.
            </div>
          </v-alert>
        </div>
      </v-container>
    </v-form>
  </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue'

// Props
const props = defineProps({
  formData: {
    type: Object,
    required: true
  },
  modelValue: {
    type: Boolean,
    default: true // Settings have defaults, so default to valid
  }
})

// Emits
const emit = defineEmits(['update:modelValue', 'update:formData'])

// Refs
const formRef = ref(null)

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

// Options
const visibilityOptions = [
  { 
    title: 'Private (Only me)', 
    value: 'private',
    subtitle: 'Only you can view this project'
  },
  { 
    title: 'Coordinator & Creator', 
    value: 'coordinator',
    subtitle: 'Project creator and assigned coordinator can view'
  },
  { 
    title: 'Communications Team', 
    value: 'team',
    subtitle: 'All communications team members can view'
  },
  { 
    title: 'Public (Anyone with link)', 
    value: 'public',
    subtitle: 'Anyone with the project link can view'
  }
]

// Expose validation method to parent
async function validate() {
  if (!formRef.value) return { valid: true } // Settings are optional/have defaults
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

/* Ensure consistent field heights */
:deep(.v-field) {
  border-radius: 8px !important;
  margin-bottom: 4px;
}

:deep(.v-select .v-field__input),
:deep(.v-combobox .v-field__input) {
  min-height: 52px !important;
  padding-top: 18px !important;
  padding-bottom: 18px !important;
}

/* Fix label positioning */
:deep(.v-label) {
  font-size: 0.875rem;
  color: rgba(0, 0, 0, 0.6) !important;
}

/* Forum settings card */
.v-card.v-card--variant-outlined {
  border-color: rgba(0, 0, 0, 0.12);
  transition: border-color 0.3s ease;
}

.v-card.v-card--variant-outlined:hover {
  border-color: rgba(25, 118, 210, 0.5);
}

/* Switch styling */
:deep(.v-switch) {
  flex-shrink: 0;
}

/* Consistent column spacing */
.v-col {
  padding-left: 12px;
  padding-right: 12px;
}

/* Chip styling */
.v-chip.v-chip--size-small {
  font-size: 0.8125rem;
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