<!-- client/src/components/comms/projects/ProjectCard.vue -->
<template>
  <v-card 
    class="project-card h-100" 
    :class="{ 'high-priority': project.priority === 'high' }"
    hover
    @click="handleClick"
  >
    <!-- Priority Indicator -->
    <div v-if="project.priority === 'high'" class="priority-indicator" />
    
    <v-card-item>
      <v-card-title class="d-flex align-center">
        <span class="text-h6">{{ project.title }}</span>
        <v-spacer />
        <v-menu location="bottom end">
          <template v-slot:activator="{ props }">
            <v-btn
              v-bind="props"
              icon="mdi-dots-vertical"
              size="small"
              variant="text"
              @click.stop
            />
          </template>
          <v-list density="compact">
            <v-list-item @click.stop="$emit('view', project)">
              <template v-slot:prepend>
                <v-icon>mdi-eye</v-icon>
              </template>
              <v-list-item-title>View Details</v-list-item-title>
            </v-list-item>
            <v-list-item 
              v-if="canEdit" 
              @click.stop="$emit('edit', project)"
            >
              <template v-slot:prepend>
                <v-icon>mdi-pencil</v-icon>
              </template>
              <v-list-item-title>Edit</v-list-item-title>
            </v-list-item>
            <v-list-item 
              v-if="canDelete" 
              @click.stop="$emit('delete', project)"
              class="text-error"
            >
              <template v-slot:prepend>
                <v-icon>mdi-delete</v-icon>
              </template>
              <v-list-item-title>Delete</v-list-item-title>
            </v-list-item>
          </v-list>
        </v-menu>
      </v-card-title>
      
      <v-card-subtitle class="d-flex flex-wrap align-center gap-2 mt-1">
        <StatusBadge :status="project.status" small />
        <RegionBadge :region="project.region" small />
        <span class="text-caption text-medium-emphasis">
          <v-icon size="x-small" class="mr-1">mdi-calendar</v-icon>
          {{ formatDate(project.createdAt) }}
        </span>
      </v-card-subtitle>
    </v-card-item>
    
    <v-card-text>
      <p class="text-body-2 mb-3 description-text">
        {{ truncateDescription(project.description) }}
      </p>
      
      <!-- Progress Bar -->
      <div v-if="project.stages && project.stages.length > 0" class="mb-3">
        <div class="d-flex justify-space-between align-center mb-1">
          <span class="text-caption text-medium-emphasis">Progress</span>
          <span class="text-caption font-weight-bold">
            {{ currentStage }}
          </span>
        </div>
        <v-progress-linear
          :model-value="progressPercentage"
          color="primary"
          height="8"
          rounded
        />
      </div>
      
      <!-- Tags -->
      <div v-if="project.tags && project.tags.length > 0" class="d-flex flex-wrap gap-1">
        <v-chip
          v-for="tag in project.tags.slice(0, 3)"
          :key="tag"
          size="x-small"
          variant="tonal"
        >
          {{ tag }}
        </v-chip>
        <v-chip
          v-if="project.tags.length > 3"
          size="x-small"
          variant="text"
        >
          +{{ project.tags.length - 3 }}
        </v-chip>
      </div>
    </v-card-text>
    
    <v-card-actions v-if="project.deadline" class="pt-0">
      <v-chip
        :color="getDeadlineColor(project.deadline)"
        size="small"
        prepend-icon="mdi-clock-outline"
        variant="tonal"
      >
        Due: {{ formatDeadline(project.deadline) }}
      </v-chip>
    </v-card-actions>
  </v-card>
</template>

<script setup>
import { computed } from 'vue'
import { useCommsProjects } from '@/composables/comms/useCommsProjects'
import StatusBadge from '../shared/StatusBadge.vue'
import RegionBadge from '../shared/RegionBadge.vue'

// Props
const props = defineProps({
  project: {
    type: Object,
    required: true
  }
})

// Emits
const emit = defineEmits(['view', 'edit', 'delete'])

// Composables
const { canEditProject, canDeleteProject } = useCommsProjects()

// Computed
const canEdit = computed(() => canEditProject(props.project))
const canDelete = computed(() => canDeleteProject(props.project))

const progressPercentage = computed(() => {
  if (!props.project.stages || props.project.stages.length === 0) return 0
  const currentIndex = props.project.currentStageIndex || 0
  return ((currentIndex + 1) / props.project.stages.length) * 100
})

const currentStage = computed(() => {
  if (!props.project.stages || props.project.stages.length === 0) return 'Not Started'
  const currentIndex = props.project.currentStageIndex || 0
  const stage = props.project.stages[currentIndex]
  
  // Handle both string stages and object stages
  if (typeof stage === 'string') {
    return stage
  } else if (stage && typeof stage === 'object' && stage.name) {
    return stage.name
  }
  
  return 'Not Started'
})

// Methods
function handleClick() {
  emit('view', props.project)
}

function truncateDescription(description) {
  const maxLength = 120
  if (description.length <= maxLength) return description
  return description.substring(0, maxLength) + '...'
}

function formatDate(date) {
  if (!date) return 'N/A'
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  }).format(date)
}

function formatDeadline(date) {
  if (!date) return 'No deadline'
  const now = new Date()
  const deadline = new Date(date)
  const diffTime = deadline - now
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
  
  if (diffDays < 0) return 'Overdue'
  if (diffDays === 0) return 'Today'
  if (diffDays === 1) return 'Tomorrow'
  if (diffDays <= 7) return `${diffDays} days`
  
  return formatDate(date)
}

function getDeadlineColor(date) {
  if (!date) return 'default'
  const now = new Date()
  const deadline = new Date(date)
  const diffTime = deadline - now
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
  
  if (diffDays < 0) return 'error'
  if (diffDays <= 3) return 'warning'
  if (diffDays <= 7) return 'info'
  return 'default'
}
</script>

<style scoped>
.project-card {
  position: relative;
  transition: all 0.2s ease;
  cursor: pointer;
}

.project-card:hover {
  transform: translateY(-2px);
}

.high-priority {
  border: 1px solid rgba(var(--v-theme-error), 0.3);
}

.priority-indicator {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 4px;
  background: rgb(var(--v-theme-error));
}

.description-text {
  min-height: 2.5rem;
  line-height: 1.4;
}
</style>