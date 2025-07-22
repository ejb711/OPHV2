<!-- client/src/components/comms/projects/ProjectFormStep2.vue -->
<template>
  <div class="step-content pa-6">
    <div class="text-center mb-6">
      <h3 class="text-h6 font-weight-bold text-grey-darken-3 mb-2">Project Stages</h3>
      <p class="text-body-2 text-grey-darken-1 mb-0">Define the workflow stages for your project</p>
    </div>
    
    <v-form ref="formRef" v-model="valid" @submit.prevent>
      <ProjectStages
        v-model="localFormData.stages"
        :template-id="localFormData.templateId"
      />
      
      <!-- Stage information card -->
      <v-card 
        variant="tonal" 
        color="info" 
        class="mt-6"
      >
        <v-card-text class="pa-4">
          <div class="d-flex align-center">
            <v-icon class="mr-3" color="info">mdi-information-outline</v-icon>
            <div>
              <div class="text-body-2 font-weight-medium mb-1">Default Stage Workflow</div>
              <div class="text-caption text-grey-darken-1">
                Projects follow: Not Started → In Progress → Final Draft → Pending Approval → Approved
              </div>
            </div>
          </div>
        </v-card-text>
      </v-card>
    </v-form>
  </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import ProjectStages from './ProjectStages.vue'

// Props
const props = defineProps({
  formData: {
    type: Object,
    required: true
  },
  modelValue: {
    type: Boolean,
    default: true // Stages are optional, so default to valid
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

// Expose validation method to parent
async function validate() {
  if (!formRef.value) return { valid: true } // Stages are optional
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

/* Info card styling */
.v-card.v-card--variant-tonal {
  border: 1px solid rgba(33, 150, 243, 0.3);
}

/* Responsive improvements */
@media (max-width: 599px) {
  .step-content {
    padding: 24px 16px !important;
  }
}
</style>