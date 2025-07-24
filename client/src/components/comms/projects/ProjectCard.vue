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

// Calculate progress based on completed stages (matching ProjectStagesTab logic)
const completedStages = computed(() => {
  if (!props.project.stages || props.project.stages.length === 0) return 0
  return props.project.stages.filter(stage => {
    // Handle both object stages and simple string stages
    if (typeof stage === 'object' && stage !== null) {
      return stage.completed === true
    }
    return false
  }).length
})

const progressPercentage = computed(() => {
  if (!props.project.stages || props.project.stages.length === 0) return 0
  const totalStages = props.project.stages.length
  return (completedStages.value / totalStages) * 100
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
  const deadlineDate = deadline.toDate ? deadline.toDate() : new Date(deadline)
  const daysUntil = Math.ceil((deadlineDate - now) / (1000 * 60 * 60 * 24))
  
  if (daysUntil < 0) return 'error'
  if (daysUntil <= 3) return 'warning'
  if (daysUntil <= 7) return 'orange'
  return 'grey'
}

function formatDeadline(deadline) {
  if (!deadline) return ''
  
  const deadlineDate = deadline.toDate ? deadline.toDate() : new Date(deadline)
  const now = new Date()
  const daysUntil = Math.ceil((deadlineDate - now) / (1000 * 60 * 60 * 24))
  
  if (daysUntil < 0) {
    return `${Math.abs(daysUntil)} days overdue`
  } else if (daysUntil === 0) {
    return 'Today'
  } else if (daysUntil === 1) {
    return 'Tomorrow'
  } else if (daysUntil <= 7) {
    return `${daysUntil} days`
  } else {
    return deadlineDate.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric' 
    })
  }
}
</script>

<style scoped>
.project-card {
  transition: all 0.3s ease;
  position: relative;
  overflow: hidden;
}

.project-card:hover {
  transform: translateY(-2px);
}

.high-priority {
  border: 2px solid #FF5252;
}

.priority-indicator {
  position: absolute;
  top: 0;
  right: 0;
  width: 0;
  height: 0;
  border-style: solid;
  border-width: 0 40px 40px 0;
  border-color: transparent #FF5252 transparent transparent;
}

.priority-indicator::after {
  content: '!';
  position: absolute;
  top: 2px;
  right: -32px;
  color: white;
  font-weight: bold;
  font-size: 14px;
}

/* Ensure consistent card height */
.v-card-text {
  flex: 1;
}
</style>