<!-- client/src/components/comms/projects/detail/tabs/ProjectInfoTab.vue -->
<template>
  <v-card-text class="pa-6">
    <v-form ref="formRef" v-model="formValid">
      <v-row>
        <!-- Basic Information Section -->
        <v-col cols="12">
          <ProjectBasicFields
            :title="editedProject.title"
            :description="editedProject.description"
            :editing="editing"
            :rules="rules"
            @update:title="updateField('title', $event)"
            @update:description="updateField('description', $event)"
          />
        </v-col>
        
        <!-- Region & Coordinator Section -->
        <v-col cols="12">
          <ProjectRegionCoordinator
            :region="editedProject.region"
            :coordinator-id="editedProject.coordinatorId"
            :editing="editing"
            :rules="rules"
            @update:region="handleRegionChange"
            @update:coordinator="updateField('coordinatorId', $event)"
          />
        </v-col>
        
        <!-- Priority & Deadline Section -->
        <v-col cols="12">
          <ProjectScheduling
            :priority="editedProject.priority"
            :deadline="editedProject.deadline"
            :editing="editing"
            @update:priority="updateField('priority', $event)"
            @update:deadline="handleDeadlineChange"
          />
        </v-col>
        
        <!-- Tags Section -->
        <v-col cols="12">
          <ProjectTags
            :tags="editedProject.tags || []"
            :editing="editing"
            @update:tags="updateField('tags', $event || [])"
          />
        </v-col>
        
        <!-- Visibility Section -->
        <v-col cols="12">
          <div class="field-group">
            <label class="field-label">Visibility Settings</label>
            <ProjectVisibility
              :visibility="project.visibility"
              :shared-with="project.sharedWith || []"
              :can-edit="false"
            />
          </div>
        </v-col>
        
        <!-- Statistics Section -->
        <v-col cols="12">
          <v-divider class="my-4" />
          <ProjectStatistics
            :project="project"
          />
        </v-col>
      </v-row>
    </v-form>
  </v-card-text>
</template>

<script setup>
import { ref } from 'vue'
import ProjectBasicFields from './info/ProjectBasicFields.vue'
import ProjectRegionCoordinator from './info/ProjectRegionCoordinator.vue'
import ProjectScheduling from './info/ProjectScheduling.vue'
import ProjectTags from './info/ProjectTags.vue'
import ProjectStatistics from './info/ProjectStatistics.vue'
import ProjectVisibility from '../../ProjectVisibility.vue'
import { useProjectInfoForm } from '@/composables/comms/useProjectInfoForm'

// Props
const props = defineProps({
  project: {
    type: Object,
    required: true
  },
  editedProject: {
    type: Object,
    required: true
  },
  editing: {
    type: Boolean,
    default: false
  },
  canEdit: {
    type: Boolean,
    default: false
  }
})

// Emit
const emit = defineEmits(['update'])

// Form state
const formRef = ref(null)
const formValid = ref(false)

// Use shared form logic
const { rules, updateField, handleRegionChange, handleDeadlineChange } = useProjectInfoForm(props, emit)
</script>

<style scoped>
/* Component-specific styles are handled by comms-dashboard.css */
</style>