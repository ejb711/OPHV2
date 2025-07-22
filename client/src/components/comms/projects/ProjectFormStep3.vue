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
              v-model="localVisibility"
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
                <span>{{ getVisibilityTitle(localVisibility) }}</span>
              </template>
            </v-select>
          </v-col>

          <!-- Tags -->
          <v-col cols="12" class="pb-6">
            <v-combobox
              v-model="localTags"
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
                  {{ cleanTag(item) }}
                </v-chip>
              </template>
            </v-combobox>
          </v-col>

          <!-- Enable Forum -->
          <v-col cols="12">
            <v-switch
              v-model="localEnableForum"
              label="Enable project forum"
              color="primary"
              density="comfortable"
              hide-details
              disabled
            >
              <template v-slot:label>
                <div>
                  <div class="text-body-2 font-weight-medium mb-1">Enable project forum</div>
                  <div class="text-caption text-grey-darken-1">Allow team members to discuss this project (coming soon)</div>
                </div>
              </template>
            </v-switch>
            
            <v-alert
              type="info"
              variant="tonal"
              density="compact"
              class="mt-3"
              text="Forums will allow team members to discuss project details, share updates, and collaborate effectively. This feature will be available in a future update."
            >
              <template v-slot:prepend>
                <v-icon>mdi-information-outline</v-icon>
              </template>
              <div class="text-caption">
                Forums will allow team members to discuss project details, share updates, and collaborate effectively. 
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

// Local copies of form fields
const localVisibility = ref(props.formData.visibility || 'coordinator')
const localTags = ref(props.formData.tags || [])
const localEnableForum = ref(props.formData.enableForum !== false)

// Form validation
const valid = computed({
  get: () => props.modelValue,
  set: (value) => emit('update:modelValue', value)
})

// Helper function to clean a single tag
function cleanTag(tag) {
  if (typeof tag === 'string') return tag
  if (tag && typeof tag === 'object') {
    return tag.text || tag.value || tag.title || String(tag)
  }
  return String(tag)
}

// Helper function to clean tags array
function cleanTags(tags) {
  if (!tags || !Array.isArray(tags)) return []
  
  return tags.map(cleanTag).filter(tag => tag && tag.trim())
}

// Update parent form data
function updateFormData() {
  emit('update:formData', {
    ...props.formData,
    visibility: localVisibility.value,
    tags: cleanTags(localTags.value),
    enableForum: localEnableForum.value
  })
}

// Watch all local values and update parent
watch([localVisibility, localTags, localEnableForum], () => {
  updateFormData()
}, { deep: true })

// Watch for external changes to props
watch(() => props.formData, (newData) => {
  localVisibility.value = newData.visibility || 'coordinator'
  localTags.value = newData.tags || []
  localEnableForum.value = newData.enableForum !== false
}, { deep: true })

// Clean tags whenever they change
watch(localTags, (newTags) => {
  const cleaned = cleanTags(newTags)
  if (JSON.stringify(cleaned) !== JSON.stringify(newTags)) {
    localTags.value = cleaned
  }
}, { deep: true })

// Initialize on mount
onMounted(() => {
  // Ensure tags are clean on mount
  localTags.value = cleanTags(localTags.value)
})

// Expose validation method to parent
async function validate() {
  if (!formRef.value) return { valid: true } // Settings are optional/have defaults
  return await formRef.value.validate()
}

defineExpose({
  validate,
  reset: () => formRef.value?.reset()
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