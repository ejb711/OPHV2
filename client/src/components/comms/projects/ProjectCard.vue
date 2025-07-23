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
      
      <v-card-subtitle class="d-flex align-center ga-2 mt-1">
        <RegionBadge :region="project.region" size="small" />
        <StatusBadge :status="project.status" size="small" />
      </v-card-subtitle>
    </v-card-item>

    <v-card-text>
      <p class="text-body-2 mb-3">{{ project.description || 'No description' }}</p>
      
      <!-- Progress Bar -->
      <div class="mb-3">
        <div class="d-flex justify-space-between text-caption mb-1">
          <span>Progress</span>
          <span>{{ Math.round(progressPercentage) }}%</span>
        </div>
        <v-progress-linear
          :model-value="progressPercentage"
          height="6"
          rounded
          :color="project.status === 'completed' ? 'success' : 'primary'"
        />
        <div class="text-caption text-medium-emphasis mt-1">
          Stage: {{ currentStage }}
        </div>
      </div>
      
      <!-- Coordinator -->
      <div v-if="project.coordinatorName" class="mb-2">
        <v-chip
          size="small"
          prepend-icon="mdi-account"
          variant="tonal"
        >
          {{ project.coordinatorName }}
        </v-chip>
      </div>
      
      <!-- Tags -->
      <div v-if="project.tags && project.tags.length > 0" class="d-flex flex-wrap ga-1">
        <v-chip
          v-for="tag in project.tags.slice(0, 3)"
          :key="tag"
          size="x-small"
          variant="outlined"
        >
          {{ tag }}
        </v-chip>
        <v-chip
          v-if="project.tags.length > 3"
          size="x-small"
          variant="outlined"
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

function getDeadlineColor(deadline) {
  if (!deadline) return 'grey'
  
  const now = new Date()
  const deadlineDate = new Date(deadline)
  const daysUntil = Math.ceil((deadlineDate - now) / (1000 * 60 * 60 * 24))
  
  if (daysUntil < 0) return 'error'
  if (daysUntil <= 7) return 'warning'
  if (daysUntil <= 30) return 'info'
  return 'success'
}

function formatDeadline(deadline) {
  if (!deadline) return 'No deadline'
  
  const now = new Date()
  const deadlineDate = new Date(deadline)
  const daysUntil = Math.ceil((deadlineDate - now) / (1000 * 60 * 60 * 24))
  
  if (daysUntil < 0) {
    return `${Math.abs(daysUntil)} days overdue`
  } else if (daysUntil === 0) {
    return 'Due today'
  } else if (daysUntil === 1) {
    return 'Due tomorrow'
  } else if (daysUntil <= 7) {
    return `${daysUntil} days`
  } else {
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric'
    }).format(deadlineDate)
  }
}
</script>

<style scoped>
.project-card {
  position: relative;
  transition: all 0.3s ease;
}

.project-card.high-priority {
  border: 2px solid rgb(var(--v-theme-error));
}

.priority-indicator {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 4px;
  background: rgb(var(--v-theme-error));
}

.project-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
}

/* Ensure consistent card height */
.h-100 {
  height: 100%;
  display: flex;
  flex-direction: column;
}

.v-card-text {
  flex: 1;
}

/* Progress bar styling */
.v-progress-linear {
  transition: all 0.3s ease;
}

/* Tag overflow handling */
.v-chip + .v-chip {
  margin-left: 4px;
}
</style>