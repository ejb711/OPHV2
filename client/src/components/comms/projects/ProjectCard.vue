<!-- client/src/components/comms/projects/ProjectCard.vue -->
<template>
  <v-card 
    class="project-card" 
    :class="{ 
      'urgent-priority': project.priority === 'urgent',
      'high-priority': project.priority === 'high' 
    }"
    hover
    @click="handleClick"
  >
    <!-- Priority Indicator -->
    <div v-if="project.priority === 'urgent'" class="priority-indicator urgent" />
    <div v-else-if="project.priority === 'high'" class="priority-indicator high" />
    
    <v-card-item>
      <v-card-title class="d-flex align-center project-header">
        <span class="text-h6 project-title text-truncate">{{ project.title }}</span>
        <v-menu location="bottom end" class="ml-2">
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
      
      <v-card-subtitle class="d-flex align-center flex-wrap ga-2 mt-1">
        <RegionBadge :region="project.region" size="small" />
        <StatusBadge :status="displayStatus" size="small" />
        <v-chip
          v-if="project.priority"
          :color="getPriorityColor(project.priority)"
          size="small"
          variant="tonal"
        >
          <v-icon start size="x-small">mdi-alert-circle</v-icon>
          {{ project.priority }}
        </v-chip>
      </v-card-subtitle>
    </v-card-item>

    <v-card-text class="project-card-content">
      <div class="description-container mb-3">
        <p class="text-body-2">{{ project.description || 'No description' }}</p>
      </div>
      
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
    
    <v-card-actions class="pt-0 mt-auto flex-column align-start">
      <!-- Dates Row -->
      <div class="d-flex justify-space-between align-center w-100 text-caption text-medium-emphasis mb-2">
        <div>
          <v-icon size="x-small">mdi-calendar-plus</v-icon>
          {{ formatDate(project.createdAt) }}
        </div>
        <div>
          <v-icon size="x-small">mdi-update</v-icon>
          Updated: {{ formatRelativeTime(project.updatedAt) }}
        </div>
      </div>
      
      <!-- Deadline -->
      <v-chip
        v-if="project.deadline"
        :color="getDeadlineColor(project.deadline)"
        size="small"
        prepend-icon="mdi-calendar-clock"
        variant="tonal"
        class="mt-auto"
      >
        Due: {{ formatDeadline(project.deadline) }}
      </v-chip>
    </v-card-actions>
  </v-card>
</template>

<script setup>
import { computed, toRef } from 'vue'
import { useCommsProjects } from '@/composables/comms/useCommsProjects'
import { useProjectStatus } from '@/composables/comms/useProjectStatus'
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
const projectRef = toRef(props, 'project')
const { 
  progressPercentage, 
  calculatedStatus,
  currentStage: currentStageData
} = useProjectStatus(projectRef)

// Computed
const canEdit = computed(() => canEditProject(props.project))
const canDelete = computed(() => canDeleteProject(props.project))

// Status to display (use calculated status instead of stored status)
const displayStatus = computed(() => {
  // If manually set to pending_approval, keep that
  if (props.project.status === 'pending_approval') {
    return 'pending_approval'
  }
  return calculatedStatus.value
})

const currentStage = computed(() => {
  if (!currentStageData.value) return 'Not Started'
  return currentStageData.value.name || 'Not Started'
})

// Methods
function handleClick() {
  emit('view', props.project)
}

function getPriorityColor(priority) {
  switch (priority) {
    case 'urgent': return 'error'
    case 'high': return 'warning'
    case 'medium': return 'info'
    case 'low': return 'success'
    default: return 'grey'
  }
}

function formatDate(date) {
  if (!date) return 'Unknown'
  const dateObj = date.toDate ? date.toDate() : new Date(date)
  return dateObj.toLocaleDateString('en-US', { 
    month: 'short', 
    day: 'numeric',
    year: 'numeric'
  })
}

function formatRelativeTime(date) {
  if (!date) return 'Never'
  const dateObj = date.toDate ? date.toDate() : new Date(date)
  const now = new Date()
  const diffMs = now - dateObj
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60))
  const diffMinutes = Math.floor(diffMs / (1000 * 60))
  
  if (diffMinutes < 1) return 'Just now'
  if (diffMinutes < 60) return `${diffMinutes}m ago`
  if (diffHours < 24) return `${diffHours}h ago`
  if (diffDays < 7) return `${diffDays}d ago`
  
  return dateObj.toLocaleDateString('en-US', { 
    month: 'short', 
    day: 'numeric' 
  })
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
  height: 460px;
  display: flex;
  flex-direction: column;
}

.project-header {
  gap: 8px;
  min-height: 48px;
}

.project-title {
  flex: 1;
  min-width: 0;
  padding-right: 8px;
}

.project-card:hover {
  transform: translateY(-2px);
}

.project-card-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.description-container {
  max-height: 60px;
  overflow-y: auto;
  overflow-x: hidden;
}

.description-container::-webkit-scrollbar {
  width: 4px;
}

.description-container::-webkit-scrollbar-track {
  background: rgba(0, 0, 0, 0.05);
  border-radius: 2px;
}

.description-container::-webkit-scrollbar-thumb {
  background: rgba(0, 0, 0, 0.2);
  border-radius: 2px;
}

.description-container::-webkit-scrollbar-thumb:hover {
  background: rgba(0, 0, 0, 0.3);
}

.urgent-priority {
  border: 2px solid #FF5252;
}

.high-priority {
  border: 2px solid #FFC107;
}

.priority-indicator {
  position: absolute;
  top: 0;
  right: 0;
  width: 0;
  height: 0;
  border-style: solid;
  border-width: 0 40px 40px 0;
}

.priority-indicator.urgent {
  border-color: transparent #FF5252 transparent transparent;
}

.priority-indicator.high {
  border-color: transparent #FFC107 transparent transparent;
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

/* Card actions styling */
.v-card-actions {
  padding: 12px 16px;
  background-color: rgba(0, 0, 0, 0.02);
  border-top: 1px solid rgba(0, 0, 0, 0.08);
}

/* Priority chip in subtitle */
.v-card-subtitle .v-chip {
  height: 20px;
  font-size: 0.7rem;
  font-weight: 500;
  text-transform: uppercase;
}

/* Date icons */
.v-card-actions .v-icon {
  opacity: 0.7;
  margin-right: 2px;
}
</style>