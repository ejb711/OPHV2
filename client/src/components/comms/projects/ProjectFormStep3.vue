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
              item-title="title"
              item-value="value"
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
              
              <!-- Custom selection slot to display the title -->
              <template v-slot:selection="{ item, index }">
                <span>{{ getVisibilityTitle(localFormData.visibility) }}</span>
              </template>
            </v-select>
          </v-col>

          <!-- Tags -->
          <v-col cols="12" class="pb-6">
            <v-combobox
              v-model="localFormData.tags"
              :items="[]"
              label="Project Tags (Optional)"
              variant="outlined"
              density="comfortable"
              multiple
              chips
              closable-chips
              hint="Add tags to help organize and categorize projects"
              persistent-hint
              hide-details="auto"
              class="text-field-spaced comms-tags-field"
              :return-object="false"
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
                  {{ typeof item === 'string' ? item : (item.text || item.value || item) }}
                </v-chip>
              </template>
              
              <!-- Hide placeholder when chips exist -->
              <template v-slot:placeholder>
                <span v-if="!localFormData.tags || localFormData.tags.length === 0">
                  Type and press Enter to add tags
                </span>
              </template>
            </v-combobox>
          </v-col>

          <!-- Forum Settings -->
          <v-col cols="12" class="pb-4">
            <v-card variant="outlined" class="pa-4">
              <div class="d-flex align-center justify-space-between">
                <div class="flex-grow-1 mr-4">
                  <div class="d-flex align-center">
                    <v-icon color="primary" class="mr-3">mdi-forum</v-icon>
                    <div>
                      <h4 class="text-body-1 font-weight-medium">Discussion Forum</h4>
                      <p class="text-body-2 text-grey-darken-1 mb-0">
                        Enable a discussion forum for this project where team members can collaborate
                      </p>
                    </div>
                  </div>
                </div>
                <v-switch
                  v-model="localFormData.enableForum"
                  color="primary"
                  hide-details
                  density="compact"
                />
              </div>
            </v-card>
          </v-col>

          <!-- Template Note -->
          <v-col cols="12">
            <v-alert
              type="info"
              variant="tonal"
              class="text-body-2"
              icon="mdi-information-outline"
            >
              <div class="d-flex align-center">
                <strong class="mr-2">Coming Soon:</strong>
                Project templates will allow you to save and reuse common project configurations.
                This feature will be available in a future update.
              </div>
            </v-alert>
          </v-col>
        </v-row>
      </v-container>
    </v-form>
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted } from 'vue'

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

// Helper function to clean tags
function cleanTags(tags) {
  if (!tags || !Array.isArray(tags)) return []
  
  return tags.map(tag => {
    if (typeof tag === 'string') return tag
    if (tag && typeof tag === 'object') {
      return tag.text || tag.value || tag.title || String(tag)
    }
    return String(tag)
  }).filter(tag => tag && tag.trim())
}

// Expose validation method to parent
async function validate() {
  if (!formRef.value) return { valid: true } // Settings are optional/have defaults
  return await formRef.value.validate()
}

// Helper method to get visibility title from value
function getVisibilityTitle(value) {
  const option = visibilityOptions.find(opt => opt.value === value)
  return option ? option.title : value
}

// Watch for changes and emit updates
watch(localFormData, (newValue) => {
  emit('update:formData', newValue)
}, { deep: true })

// Ensure tags are always strings
watch(() => localFormData.value.tags, (newTags) => {
  if (newTags && Array.isArray(newTags)) {
    const cleanedTags = cleanTags(newTags)
    
    if (JSON.stringify(cleanedTags) !== JSON.stringify(newTags)) {
      localFormData.value.tags = cleanedTags
    }
  }
}, { immediate: true })

// Clean tags on mount
onMounted(() => {
  if (localFormData.value.tags && Array.isArray(localFormData.value.tags)) {
    localFormData.value.tags = cleanTags(localFormData.value.tags)
  }
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

/* Fix for tags combobox overlap issue */
:deep(.comms-tags-field .v-field__input) {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
  align-items: center;
}

:deep(.comms-tags-field .v-combobox__selection) {
  max-width: none !important;
  overflow: visible !important;
}

/* Hide any text that's not in a chip */
:deep(.comms-tags-field .v-combobox__selection-text) {
  display: none !important;
}

/* Ensure input is properly positioned */
:deep(.comms-tags-field input) {
  flex: 1 1 auto;
  min-width: 50px;
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