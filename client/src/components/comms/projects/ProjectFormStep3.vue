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
              
              <!-- Custom selection to ensure proper text display -->
              <template v-slot:selection="{ item }">
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
              
              <template v-slot:no-data>
                <v-list-item>
                  <v-list-item-title class="text-caption text-grey">
                    Type to create new tags
                  </v-list-item-title>
                </v-list-item>
              </template>
            </v-combobox>
          </v-col>

          <!-- Enable Discussion Forum -->
          <v-col cols="12" class="pb-6">
            <v-switch
              v-model="localFormData.enableForum"
              label="Discussion Forum"
              color="primary"
              hide-details="auto"
              class="mt-0"
            >
              <template v-slot:label>
                <div>
                  <div class="font-weight-medium text-grey-darken-3">Discussion Forum</div>
                  <div class="text-caption text-grey-darken-1 mt-1">
                    Enable a discussion forum for this project where team members can collaborate
                  </div>
                </div>
              </template>
              <template v-slot:prepend>
                <v-icon color="primary">mdi-forum</v-icon>
              </template>
            </v-switch>
          </v-col>

          <!-- Future Features Placeholder -->
          <v-col cols="12">
            <v-alert
              type="info"
              variant="tonal"
              density="compact"
              icon="mdi-information-outline"
            >
              <div class="text-body-2">
                <strong>Coming Soon:</strong> Email notifications, Slack integration, and custom project templates.
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
import { useVisibilityOptions } from '@/composables/comms/useVisibilityOptions'

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

// Composables
const { visibilityOptions, getVisibilityTitle } = useVisibilityOptions()

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

// Add reset functionality
function reset() {
  if (formRef.value) {
    formRef.value.reset()
  }
}

defineExpose({ validate, reset })

// Watch tags to ensure they're always clean strings
watch(() => localFormData.value.tags, (newTags) => {
  const cleaned = cleanTags(newTags)
  if (JSON.stringify(cleaned) !== JSON.stringify(newTags)) {
    localFormData.value.tags = cleaned
  }
}, { deep: true })

// Watch for validation changes
watch(valid, (newVal) => {
  emit('update:modelValue', newVal)
})

// Initialize on mount
onMounted(() => {
  // Ensure tags are clean on mount
  if (localFormData.value.tags) {
    localFormData.value.tags = cleanTags(localFormData.value.tags)
  }
})
</script>

<style scoped>
/* Step content styling */
.step-content {
  max-width: 800px;
  margin: 0 auto;
}

/* Field spacing with hints */
.text-field-spaced {
  margin-bottom: 4px;
}

/* Switch label styling */
.v-switch :deep(.v-label) {
  opacity: 1 !important;
}

/* Tag chip styling */
.comms-tags-field :deep(.v-chip) {
  height: 28px !important;
  font-size: 0.875rem !important;
}

/* Alert styling */
.v-alert {
  font-size: 0.875rem;
}

/* Forum switch styling */
.v-switch {
  align-items: start !important;
}

.v-switch :deep(.v-selection-control) {
  min-height: auto !important;
}
</style>