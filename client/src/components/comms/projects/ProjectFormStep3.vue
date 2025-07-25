<!-- client/src/components/comms/projects/ProjectFormStep3.vue -->
<template>
  <v-card-text class="step-content pa-8">
    <v-form ref="formRef" v-model="isValid">
      <!-- Visibility Settings -->
      <div class="mb-6">
        <h3 class="text-h6 font-weight-medium mb-4">Visibility Settings</h3>
        <v-select
          v-model="localVisibility"
          :items="visibilityOptions"
          item-title="title"
          item-value="value"
          label="Who can view this project"
          variant="outlined"
          density="comfortable"
          @update:model-value="emitUpdate"
        />
        <p class="text-caption text-grey-darken-1 mt-2">
          Control who can view and access this project
        </p>
      </div>

      <v-divider class="my-6" />

      <!-- Project Tags -->
      <div class="mb-6">
        <h3 class="text-h6 font-weight-medium mb-4">Project Tags</h3>
        <v-combobox
          v-model="localTags"
          :items="suggestedTags"
          label="Add tags to categorize this project"
          variant="outlined"
          density="comfortable"
          multiple
          chips
          closable-chips
          clearable
          hide-details
          class="comms-tags-field text-field-spaced"
          @update:model-value="handleTagsUpdate"
        />
        <p class="text-caption text-grey-darken-1 mt-2">
          Tags help organize and search for projects. Press Enter to add custom tags.
        </p>
      </div>

      <v-divider class="my-6" />

      <!-- Additional Options -->
      <div>
        <h3 class="text-h6 font-weight-medium mb-4">Additional Options</h3>
        
        <!-- Enable Forum -->
        <v-switch
          v-model="localEnableForum"
          color="primary"
          hide-details
          density="comfortable"
          class="mb-4"
          @update:model-value="emitUpdate"
        >
          <template v-slot:label>
            <div>
              <div class="font-weight-medium">Enable Discussion Forum</div>
              <div class="text-caption text-grey-darken-1">
                Allow team members to discuss and collaborate on this project
              </div>
            </div>
          </template>
        </v-switch>

        <!-- Requires Approval -->
        <v-switch
          v-model="localRequiresApproval"
          color="primary"
          hide-details
          density="comfortable"
          @update:model-value="emitUpdate"
        >
          <template v-slot:label>
            <div>
              <div class="font-weight-medium">Requires Approval</div>
              <div class="text-caption text-grey-darken-1">
                Project must be approved before it can be marked as complete
              </div>
            </div>
          </template>
        </v-switch>

        <!-- Future: Email Notifications -->
        <v-alert
          type="info"
          variant="tonal"
          density="compact"
          class="mt-4"
        >
          <div class="text-body-2">
            <strong>Coming Soon:</strong> Email notifications, file attachments, and custom workflows will be available in future updates.
          </div>
        </v-alert>
      </div>
    </v-form>
  </v-card-text>
</template>

<script setup>
import { ref, computed, watch, onMounted } from 'vue'

// Props & Emits
const props = defineProps({
  modelValue: { type: Boolean, default: true }, // Step is valid by default
  formData: { type: Object, required: true }
})
const emit = defineEmits(['update:modelValue', 'update:formData'])

// Form ref and validation
const formRef = ref(null)
const isValid = computed({
  get: () => props.modelValue,
  set: (value) => emit('update:modelValue', value)
})

// Local state
const localVisibility = ref('coordinator')
const localTags = ref([])
const localEnableForum = ref(true)
const localRequiresApproval = ref(true)

// Visibility options
const visibilityOptions = [
  { title: 'Only Coordinator', value: 'coordinator' },
  { title: 'Region Team', value: 'region' },
  { title: 'All Staff', value: 'all' }
]

// Suggested tags for the combobox
const suggestedTags = [
  'COVID-19',
  'Mental Health', 
  'Maternal Health',
  'Pediatrics',
  'Emergency Response',
  'Community Outreach',
  'Education',
  'Prevention',
  'Vaccination',
  'Public Awareness'
]

// Helper function to clean tag value
function cleanTag(tag) {
  if (!tag) return ''
  if (typeof tag === 'string') return tag.trim()
  if (tag && typeof tag === 'object') {
    return (tag.text || tag.value || tag.title || String(tag)).trim()
  }
  return String(tag).trim()
}

// Helper function to clean tags array
function cleanTags(tags) {
  if (!tags || !Array.isArray(tags)) return []
  return tags.map(cleanTag).filter(tag => tag && tag.length > 0)
}

// Initialize from props
function initializeFromProps() {
  localVisibility.value = props.formData.visibility || 'coordinator'
  localTags.value = cleanTags(props.formData.tags || [])
  localEnableForum.value = props.formData.enableForum !== false
  localRequiresApproval.value = props.formData.requiresApproval !== false
}

// Emit update to parent
function emitUpdate() {
  emit('update:formData', {
    visibility: localVisibility.value,
    tags: cleanTags(localTags.value),
    enableForum: localEnableForum.value,
    requiresApproval: localRequiresApproval.value
  })
}

// Handle tags update specially to clean them
function handleTagsUpdate(newTags) {
  localTags.value = cleanTags(newTags)
  emitUpdate()
}

// Watch for prop changes
watch(() => props.formData, () => {
  initializeFromProps()
}, { deep: true })

// Initialize on mount
onMounted(() => {
  initializeFromProps()
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