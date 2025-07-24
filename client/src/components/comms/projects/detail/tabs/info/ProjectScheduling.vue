<!-- client/src/components/comms/projects/detail/tabs/info/ProjectScheduling.vue -->
<template>
  <v-row>
    <!-- Priority Field -->
    <v-col cols="12" md="6">
      <div class="field-group">
        <label class="field-label">Priority</label>
        <!-- Show chip in view mode -->
        <div v-if="!editing" class="mt-2">
          <v-chip
            :color="getPriorityColor(priority)"
            size="small"
            label
          >
            {{ displayedPriority }}
          </v-chip>
        </div>
        <!-- Show select in edit mode -->
        <v-select
          v-else
          :model-value="priority"
          :items="priorityOptions"
          variant="outlined"
          density="comfortable"
          @update:model-value="$emit('update:priority', $event)"
        >
          <template v-slot:item="{ props, item }">
            <v-list-item v-bind="props">
              <template v-slot:prepend>
                <v-chip
                  :color="getPriorityColor(item.value)"
                  size="small"
                  label
                >
                  {{ item.title }}
                </v-chip>
              </template>
            </v-list-item>
          </template>
        </v-select>
      </div>
    </v-col>
    
    <!-- Deadline Field -->
    <v-col cols="12" md="6">
      <div class="field-group">
        <label class="field-label">Deadline</label>
        <v-text-field
          :model-value="formattedDeadline"
          type="date"
          :readonly="!editing"
          :variant="editing ? 'outlined' : 'plain'"
          density="comfortable"
          :clearable="editing"
          @update:model-value="$emit('update:deadline', $event)"
        />
      </div>
    </v-col>
  </v-row>
</template>

<script setup>
import { computed } from 'vue'

// Props
const props = defineProps({
  priority: {
    type: String,
    default: ''
  },
  deadline: {
    type: [Date, Object],
    default: null
  },
  editing: {
    type: Boolean,
    default: false
  }
})

// Emits
defineEmits(['update:priority', 'update:deadline'])

// Priority options with labels
const priorityOptions = [
  { title: 'Low', value: 'low' },
  { title: 'Medium', value: 'medium' },
  { title: 'High', value: 'high' },
  { title: 'Urgent', value: 'urgent' }
]

// Computed properties
const displayedPriority = computed(() => {
  if (!props.priority) return ''
  const priority = priorityOptions.find(p => p.value === props.priority)
  return priority?.title || props.priority
})

const formattedDeadline = computed(() => {
  if (!props.deadline) return ''
  
  try {
    const date = props.deadline.toDate 
      ? props.deadline.toDate() 
      : new Date(props.deadline)
    
    return date.toISOString().split('T')[0]
  } catch (error) {
    return ''
  }
})

// Methods
function getPriorityColor(priority) {
  const colors = {
    low: 'grey',
    medium: 'blue',
    high: 'orange',
    urgent: 'red'
  }
  return colors[priority] || 'grey'
}
</script>

<style scoped>
/* Ensure proper chip display in view mode */
.field-group .v-chip {
  cursor: default;
}

/* Disable all interactive elements in readonly date fields */
.field-group .v-field--readonly input[type="date"] {
  pointer-events: none;
}

/* Hide date picker icon in readonly mode */
.field-group .v-field--readonly input[type="date"]::-webkit-calendar-picker-indicator {
  display: none;
}

/* Ensure readonly date field appears non-interactive */
.field-group .v-field--variant-plain input[type="date"] {
  color: rgba(0, 0, 0, 0.87) !important;
  cursor: default !important;
}
</style>