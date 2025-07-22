<!-- client/src/components/comms/projects/ProjectFormStep2.vue -->
<template>
  <v-card-text class="step-content pa-8">
    <div class="text-center mb-6">
      <h3 class="text-h6 font-weight-bold text-grey-darken-3 mb-2">Project Stages</h3>
      <p class="text-body-2 text-grey-darken-1">Define the workflow stages for your project</p>
    </div>

    <v-form ref="formRef" v-model="isValid">
      <!-- Project Stages Component -->
      <ProjectStages
        v-model="localStages"
        :template-id="localTemplateId"
        @update:model-value="emitUpdate"
      />

      <!-- Stage Validation -->
      <v-alert
        v-if="!stagesValid"
        type="error"
        variant="tonal"
        density="compact"
        class="mt-4"
      >
        Projects must have at least 2 stages to track progress
      </v-alert>
    </v-form>
  </v-card-text>
</template>

<script setup>
import { ref, computed, watch, onMounted } from 'vue'
import ProjectStages from './ProjectStages.vue'

// Props & Emits
const props = defineProps({
  modelValue: { type: Boolean, default: true }, // Step validity
  formData: { type: Object, required: true }
})
const emit = defineEmits(['update:modelValue', 'update:formData'])

// Form ref
const formRef = ref(null)

// Local state
const localStages = ref([])
const localTemplateId = ref(null)

// Validation
const isValid = computed({
  get: () => props.modelValue,
  set: (value) => emit('update:modelValue', value)
})

const stagesValid = computed(() => {
  return localStages.value && localStages.value.length >= 2
})

// Initialize from props
function initializeFromProps() {
  localStages.value = props.formData.stages || []
  localTemplateId.value = props.formData.templateId || null
}

// Emit update to parent
function emitUpdate() {
  emit('update:formData', {
    stages: localStages.value,
    templateId: localTemplateId.value
  })
  
  // Update validity
  isValid.value = stagesValid.value
}

// Watch for prop changes
watch(() => props.formData, () => {
  initializeFromProps()
}, { deep: true })

// Watch stages validity
watch(stagesValid, (valid) => {
  isValid.value = valid
})

// Initialize on mount
onMounted(() => {
  initializeFromProps()
  // Check initial validity
  isValid.value = stagesValid.value
})

// Expose validation method
async function validate() {
  return { valid: stagesValid.value }
}

defineExpose({
  validate,
  reset: () => {
    localStages.value = []
    formRef.value?.reset()
  }
})
</script>

<style scoped>
.step-content {
  min-height: 400px;
  max-width: 800px;
  margin: 0 auto;
}

/* Alert styling */
.v-alert {
  font-size: 0.875rem;
}
</style>