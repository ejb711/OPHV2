<!-- client/src/components/comms/search/CommsSearchAdvancedCriteria.vue -->
<template>
  <v-expansion-panels variant="accordion">
    <v-expansion-panel>
      <v-expansion-panel-title>
        <v-icon start>mdi-tune</v-icon>
        Advanced Criteria
      </v-expansion-panel-title>
      <v-expansion-panel-text>
        <v-row>
          <v-col cols="12" md="6">
            <UserSelect
              :model-value="localCriteria.createdBy"
              label="Created By"
              clearable
              density="comfortable"
              variant="outlined"
              @update:model-value="updateCriteria('createdBy', $event)"
            />
          </v-col>
          
          <v-col cols="12" md="6">
            <v-select
              :model-value="localCriteria.modifiedWithin"
              :items="modifiedOptions"
              label="Modified Within"
              clearable
              density="comfortable"
              variant="outlined"
              @update:model-value="updateCriteria('modifiedWithin', $event)"
            />
          </v-col>

          <v-col cols="12" md="6">
            <v-text-field
              :model-value="localCriteria.dateRange.start"
              label="Created After"
              type="date"
              clearable
              density="comfortable"
              variant="outlined"
              persistent-hint
              hint="Start date"
              @update:model-value="updateDateRange('start', $event)"
            />
          </v-col>

          <v-col cols="12" md="6">
            <v-text-field
              :model-value="localCriteria.dateRange.end"
              label="Created Before"
              type="date"
              clearable
              density="comfortable"
              variant="outlined"
              persistent-hint
              hint="End date"
              @update:model-value="updateDateRange('end', $event)"
            />
          </v-col>

          <v-col cols="12">
            <v-checkbox
              :model-value="localCriteria.overdue"
              label="Only show overdue projects"
              hide-details
              @update:model-value="updateCriteria('overdue', $event)"
            />
            <v-checkbox
              :model-value="localCriteria.hasFiles"
              label="Has file attachments"
              hide-details
              @update:model-value="updateCriteria('hasFiles', $event)"
            />
            <v-checkbox
              :model-value="localCriteria.hasMessages"
              label="Has forum messages"
              hide-details
              @update:model-value="updateCriteria('hasMessages', $event)"
            />
          </v-col>
        </v-row>
      </v-expansion-panel-text>
    </v-expansion-panel>
  </v-expansion-panels>
</template>

<script setup>
import { ref, watch } from 'vue'
import UserSelect from '@/components/shared/UserSelect.vue'

// Props
const props = defineProps({
  modelValue: {
    type: Object,
    default: () => ({
      createdBy: '',
      dateRange: {
        start: null,
        end: null
      },
      hasFiles: null,
      hasMessages: null,
      overdue: false,
      modifiedWithin: null
    })
  }
})

// Emits
const emit = defineEmits(['update:modelValue'])

// Local state
const localCriteria = ref({ ...props.modelValue })

// Options
const modifiedOptions = [
  { title: 'Today', value: 1 },
  { title: 'Last 3 days', value: 3 },
  { title: 'Last week', value: 7 },
  { title: 'Last 2 weeks', value: 14 },
  { title: 'Last month', value: 30 },
  { title: 'Last 3 months', value: 90 }
]

// Methods
function updateCriteria(field, value) {
  localCriteria.value[field] = value
  emit('update:modelValue', { ...localCriteria.value })
}

function updateDateRange(field, value) {
  localCriteria.value.dateRange[field] = value
  emit('update:modelValue', { ...localCriteria.value })
}

// Watch for external changes
watch(() => props.modelValue, (newVal) => {
  localCriteria.value = { ...newVal }
}, { deep: true })
</script>

<style scoped>
.v-expansion-panel-text :deep(.v-expansion-panel-text__wrapper) {
  padding-top: 16px;
}
</style>