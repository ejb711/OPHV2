<!-- client/src/components/comms/projects/ProjectVisibility.vue -->
<template>
  <div class="project-visibility">
    <h3 class="text-subtitle-1 font-weight-bold mb-2">Visibility Settings</h3>
    
    <!-- Visibility Level -->
    <v-select
      :model-value="modelValue"
      @update:model-value="$emit('update:modelValue', $event)"
      :items="visibilityOptions"
      label="Who can view this project?"
      :readonly="readonly"
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
      <div v-if="modelValue === 'creator' && !readonly">
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

    <!-- Current Access Summary -->
    <v-card 
      v-if="!readonly" 
      variant="outlined" 
      density="compact" 
      class="mt-3 pa-3"
    >
      <div class="text-caption text-medium-emphasis">
        <strong>Current Access:</strong>
        <ul class="mt-1 ml-4">
          <li v-for="(item, index) in accessSummary" :key="index">
            {{ item }}
          </li>
        </ul>
      </div>
    </v-card>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useAuthStore } from '@/stores/auth'

// Props
const props = defineProps({
  modelValue: {
    type: String,
    default: 'coordinator'
  },
  sharedWith: {
    type: Array,
    default: () => []
  },
  readonly: {
    type: Boolean,
    default: false
  },
  projectRegion: {
    type: String,
    default: null
  }
})

// Emits
const emit = defineEmits(['update:modelValue', 'update:sharedWith'])

// Composables
const authStore = useAuthStore()

// Visibility options
const visibilityOptions = [
  {
    title: 'Owner Only',
    value: 'owner',
    icon: 'mdi-shield-crown',
    description: 'Only system owners can view this project'
  },
  {
    title: 'Admins',
    value: 'admin',
    icon: 'mdi-shield-account',
    description: 'System owners and administrators'
  },
  {
    title: 'Regional Coordinators',
    value: 'coordinator',
    icon: 'mdi-account-supervisor',
    description: 'Coordinators in the same region, plus admins'
  },
  {
    title: 'Creator & Shared',
    value: 'creator',
    icon: 'mdi-account-lock',
    description: 'Only you and specific users you share with'
  },
  {
    title: 'All Users',
    value: 'public',
    icon: 'mdi-account-multiple',
    description: 'Anyone with access to the Communications Dashboard'
  }
]

// Suggested users for sharing (in real app, would fetch from API)
const suggestedUsers = computed(() => {
  // This would typically come from an API
  return []
})

// Access summary based on current settings
const accessSummary = computed(() => {
  const summary = []
  
  switch (props.modelValue) {
    case 'owner':
      summary.push('System owners only')
      break
    case 'admin':
      summary.push('System owners')
      summary.push('System administrators')
      break
    case 'coordinator':
      summary.push('System owners and administrators')
      if (props.projectRegion) {
        summary.push(`Regional coordinators for ${props.projectRegion}`)
      } else {
        summary.push('Regional coordinators (same region)')
      }
      break
    case 'creator':
      summary.push('You (creator)')
      summary.push('System owners and administrators')
      if (props.sharedWith.length > 0) {
        summary.push(`${props.sharedWith.length} shared user${props.sharedWith.length > 1 ? 's' : ''}`)
      }
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
  margin-bottom: 1rem;
}
</style>