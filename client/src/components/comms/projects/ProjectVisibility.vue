<!-- client/src/components/comms/projects/ProjectVisibility.vue -->
<template>
  <div class="project-visibility">
    <!-- Visibility Level (Read-only view) -->
    <div v-if="readonly">
      <v-select
        :model-value="modelValue"
        :items="visibilityOptions"
        :readonly="true"
        variant="plain"
        density="compact"
        hide-details
      >
        <template v-slot:item="{ item, props }">
          <v-list-item v-bind="props">
            <template v-slot:prepend>
              <v-icon :icon="item.raw.icon" />
            </template>
            <v-list-item-subtitle>{{ item.raw.description }}</v-list-item-subtitle>
          </v-list-item>
        </template>
      </v-select>

      <!-- Current Access Summary (Compact) -->
      <div v-if="accessSummary.length > 0" class="current-access-info mt-3">
        <div class="text-caption font-weight-medium mb-1">Current Access:</div>
        <div class="access-summary">
          <div v-for="(item, index) in accessSummary" :key="index" class="text-body-2">
            <v-icon size="x-small" class="mr-1">mdi-check</v-icon>
            {{ item }}
          </div>
        </div>
      </div>
    </div>

    <!-- Edit Mode -->
    <div v-else>
      <h3 class="text-subtitle-1 font-weight-bold mb-2">Visibility Settings</h3>
      
      <!-- Visibility Level -->
      <v-select
        :model-value="modelValue"
        @update:model-value="$emit('update:modelValue', $event)"
        :items="visibilityOptions"
        label="Who can view this project?"
        variant="outlined"
        density="compact"
        class="mb-3"
      >
        <template v-slot:item="{ item, props }">
          <v-list-item v-bind="props">
            <template v-slot:prepend>
              <v-icon :icon="item.raw.icon" />
            </template>
            <v-list-item-subtitle>{{ item.raw.description }}</v-list-item-subtitle>
          </v-list-item>
        </template>
      </v-select>

      <!-- Shared With (for creator visibility) -->
      <v-expand-transition>
        <div v-if="modelValue === 'creator'">
          <v-combobox
            :model-value="sharedWith"
            @update:model-value="$emit('update:sharedWith', $event)"
            label="Share with specific users (email addresses)"
            :items="suggestedUsers"
            multiple
            chips
            closable-chips
            variant="outlined"
            density="compact"
            hint="Enter email addresses of users who should have access"
            persistent-hint
            :rules="[validateEmails]"
          >
            <template v-slot:chip="{ item, props }">
              <v-chip v-bind="props" size="small">
                <v-icon start size="small">mdi-account</v-icon>
                {{ item.title }}
              </v-chip>
            </template>
          </v-combobox>
        </div>
      </v-expand-transition>

      <!-- Current Access Summary (Edit Mode) -->
      <div v-if="accessSummary.length > 0 && modelValue !== 'creator'" class="current-access-info mt-3">
        <div class="text-caption font-weight-medium mb-1">Current Access:</div>
        <div class="access-summary">
          <div v-for="(item, index) in accessSummary" :key="index" class="text-body-2">
            <v-icon size="x-small" class="mr-1">mdi-check</v-icon>
            {{ item }}
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'

// Props
const props = defineProps({
  modelValue: {
    type: String,
    default: 'coordinators'
  },
  sharedWith: {
    type: Array,
    default: () => []
  },
  readonly: {
    type: Boolean,
    default: false
  },
  canEdit: {
    type: Boolean,
    default: false
  }
})

// Emits
const emit = defineEmits(['update:modelValue', 'update:sharedWith'])

// Visibility options
const visibilityOptions = [
  {
    title: 'Private',
    value: 'creator',
    icon: 'mdi-lock',
    description: 'Only you and people you share with'
  },
  {
    title: 'Coordinators',
    value: 'coordinators',
    icon: 'mdi-account-multiple',
    description: 'Regional coordinators (same region)'
  },
  {
    title: 'Organization',
    value: 'organization',
    icon: 'mdi-domain',
    description: 'All system owners and administrators'
  },
  {
    title: 'Public',
    value: 'public',
    icon: 'mdi-earth',
    description: 'Anyone with access to the Communications Dashboard'
  }
]

// Suggested users (would come from a real API)
const suggestedUsers = []

// Computed access summary
const accessSummary = computed(() => {
  const summary = []
  
  switch (props.modelValue) {
    case 'creator':
      summary.push('Project creator (you)')
      if (props.sharedWith && props.sharedWith.length > 0) {
        summary.push(`${props.sharedWith.length} shared user${props.sharedWith.length > 1 ? 's' : ''}`)
      }
      break
    case 'coordinators':
      summary.push('System owners and administrators')
      summary.push('Regional coordinators (same region)')
      break
    case 'organization':
      summary.push('System owners and administrators')
      break
    case 'public':
      summary.push('All users with Communications Dashboard access')
      break
  }
  
  return summary
})

// Validation
function validateEmails(emails) {
  if (!Array.isArray(emails)) return true
  
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  const invalid = emails.filter(email => !emailRegex.test(email))
  
  if (invalid.length > 0) {
    return `Invalid email${invalid.length > 1 ? 's' : ''}: ${invalid.join(', ')}`
  }
  
  return true
}
</script>

<style scoped>
.project-visibility {
  margin-bottom: 0;
}

/* Compact current access info styling */
.current-access-info {
  background-color: rgba(76, 175, 80, 0.08);
  border: 1px solid rgba(76, 175, 80, 0.2);
  border-radius: 4px;
  padding: 8px 12px;
}

.access-summary {
  color: rgba(0, 0, 0, 0.7);
}

.access-summary > div {
  line-height: 1.6;
}

/* Remove excessive margins in readonly mode */
.project-visibility .v-field--variant-plain {
  margin-bottom: 0;
}

.project-visibility .v-field--variant-plain .v-select__selection {
  font-weight: 500;
}
</style>