<!-- client/src/components/comms/projects/ProjectStages.vue -->
<template>
  <div>
    <!-- Stage List -->
    <v-list
      v-if="stages.length > 0"
      lines="two"
      density="comfortable"
      class="mb-4 elevation-1 rounded"
    >
      <draggable
        v-model="stages"
        group="stages"
        @start="drag = true"
        @end="drag = false"
        item-key="id"
        handle=".drag-handle"
      >
        <template #item="{ element: stage, index }">
          <v-list-item>
            <template v-slot:prepend>
              <v-icon
                class="drag-handle cursor-move"
                :disabled="isDefaultStages"
              >
                mdi-drag-vertical
              </v-icon>
            </template>

            <v-list-item-title>
              {{ stage.name }}
            </v-list-item-title>

            <v-list-item-subtitle>
              Stage {{ index + 1 }} of {{ stages.length }}
            </v-list-item-subtitle>

            <template v-slot:append>
              <v-btn
                v-if="!isDefaultStages"
                icon
                density="compact"
                variant="text"
                @click="removeStage(index)"
                :disabled="stages.length <= 2"
              >
                <v-icon size="small">mdi-close</v-icon>
              </v-btn>
            </template>
          </v-list-item>
        </template>
      </draggable>
    </v-list>

    <!-- Empty State -->
    <v-alert
      v-else
      type="info"
      variant="tonal"
      class="mb-4"
    >
      No stages defined. Add stages to track project progress.
    </v-alert>

    <!-- Add Stage -->
    <v-row v-if="!isDefaultStages" align="center" class="mb-4">
      <v-col>
        <v-text-field
          v-model="newStageName"
          label="New stage name"
          variant="outlined"
          density="compact"
          hide-details
          @keyup.enter="addStage"
        />
      </v-col>
      <v-col cols="auto">
        <v-btn
          color="primary"
          variant="tonal"
          @click="addStage"
          :disabled="!newStageName.trim() || stages.length >= 10"
        >
          <v-icon start>mdi-plus</v-icon>
          Add Stage
        </v-btn>
      </v-col>
    </v-row>

    <!-- Options -->
    <v-row>
      <v-col cols="12" sm="6">
        <v-btn
          variant="outlined"
          block
          @click="useDefaultStages"
          :disabled="isDefaultStages"
        >
          <v-icon start>mdi-restore</v-icon>
          Use Default Stages
        </v-btn>
      </v-col>
      <v-col cols="12" sm="6">
        <v-btn
          variant="outlined"
          block
          @click="clearStages"
          :disabled="stages.length === 0"
        >
          <v-icon start>mdi-delete-outline</v-icon>
          Clear All
        </v-btn>
      </v-col>
    </v-row>

    <!-- Help Text -->
    <v-alert
      type="info"
      variant="text"
      density="compact"
      class="mt-4"
    >
      <div class="text-caption">
        <strong>Default stages:</strong> Not Started → In Progress → Final Draft → Pending Approval → Approved
      </div>
      <div class="text-caption mt-1">
        You can customize stages or use the defaults. Minimum 2 stages, maximum 10 stages.
      </div>
    </v-alert>
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted } from 'vue'
import draggable from 'vuedraggable'

// Props
const props = defineProps({
  modelValue: {
    type: Array,
    default: () => []
  },
  templateId: {
    type: String,
    default: null
  }
})

// Emits
const emit = defineEmits(['update:modelValue'])

// Default stages
const defaultStages = [
  { id: 'not-started', name: 'Not Started' },
  { id: 'in-progress', name: 'In Progress' },
  { id: 'final-draft', name: 'Final Draft' },
  { id: 'pending-approval', name: 'Pending Approval' },
  { id: 'approved', name: 'Approved' }
]

// Local state
const drag = ref(false)
const newStageName = ref('')

// Computed stages with two-way binding
const stages = computed({
  get: () => props.modelValue,
  set: (value) => emit('update:modelValue', value)
})

// Check if using default stages
const isDefaultStages = computed(() => {
  if (stages.value.length !== defaultStages.length) return false
  return stages.value.every((stage, index) =>
    stage.name === defaultStages[index].name
  )
})

// Methods
function addStage() {
  const name = newStageName.value.trim()
  if (!name || stages.value.length >= 10) return

  const newStage = {
    id: `custom-${Date.now()}`,
    name: name
  }

  stages.value = [...stages.value, newStage]
  newStageName.value = ''
}

function removeStage(index) {
  if (stages.value.length <= 2) return
  stages.value = stages.value.filter((_, i) => i !== index)
}

function useDefaultStages() {
  stages.value = [...defaultStages]
}

function clearStages() {
  stages.value = []
}

// Initialize with default stages if empty
onMounted(() => {
  if (stages.value.length === 0) {
    useDefaultStages()
  }
})

// Watch for template changes (for future template support)
watch(() => props.templateId, (newTemplateId) => {
  if (newTemplateId) {
    // In the future, load stages from template
    }
})
</script>

<style scoped>
.cursor-move {
  cursor: move;
}

.drag-handle {
  opacity: 0.5;
  transition: opacity 0.2s;
}

.drag-handle:hover {
  opacity: 1;
}

.v-list-item {
  border-bottom: 1px solid rgba(0, 0, 0, 0.05);
}

.v-list-item:last-child {
  border-bottom: none;
}
</style>