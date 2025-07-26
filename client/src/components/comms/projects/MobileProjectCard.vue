<!-- Mobile-optimized Project Card -->
<template>
  <v-card 
    class="mobile-project-card" 
    :class="{ 
      'urgent-priority': project.priority === 'urgent',
      'high-priority': project.priority === 'high',
      'expanded': isExpanded
    }"
    flat
    @click="toggleExpand"
  >
    <!-- Priority Indicator -->
    <div 
      v-if="project.priority === 'urgent' || project.priority === 'high'" 
      class="priority-indicator"
      :class="project.priority"
    >
      <v-icon size="small" color="white">mdi-alert</v-icon>
    </div>
    
    <!-- Main Content -->
    <div class="card-content pa-4">
      <!-- Header Row -->
      <div class="header-row">
        <h3 class="project-title text-h6">{{ project.title }}</h3>
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
      </div>

      <!-- Metadata Row -->
      <div class="metadata-row text-body-2 text-medium-emphasis mb-2">
        {{ getRegionDisplay() }} · {{ getStatusDisplay() }} · {{ project.priority?.toUpperCase() || 'NORMAL' }}
      </div>

      <!-- Progress Bar -->
      <div class="progress-section mb-3">
        <div class="d-flex justify-space-between align-center mb-1">
          <span class="text-caption">Progress: {{ Math.round(progressPercentage) }}%</span>
          <span class="text-caption text-medium-emphasis">{{ currentStage }}</span>
        </div>
        <v-progress-linear
          :model-value="progressPercentage"
          height="8"
          rounded
          :color="getProgressColor()"
        />
      </div>

      <!-- Owner Row -->
      <div class="owner-row mb-2">
        <v-chip
          size="small"
          prepend-icon="mdi-account"
          variant="tonal"
          color="primary"
        >
          {{ project.coordinatorName || 'Unassigned' }}
        </v-chip>
      </div>

      <!-- Tags (Collapsed by default) -->
      <v-expand-transition>
        <div v-show="!isExpanded && project.tags && project.tags.length > 0" class="tags-row">
          <v-chip
            v-for="tag in project.tags.slice(0, 2)"
            :key="tag"
            size="x-small"
            variant="outlined"
            class="mr-1"
          >
            {{ tag }}
          </v-chip>
          <v-chip
            v-if="project.tags.length > 2"
            size="x-small"
            variant="outlined"
          >
            +{{ project.tags.length - 2 }}
          </v-chip>
        </div>
      </v-expand-transition>

      <!-- Expanded Content -->
      <v-expand-transition>
        <div v-show="isExpanded" class="expanded-content mt-3">
          <!-- Description -->
          <div v-if="project.description" class="description-section mb-3">
            <h4 class="text-subtitle-2 mb-1">Description</h4>
            <p class="text-body-2">{{ project.description }}</p>
          </div>

          <!-- All Tags -->
          <div v-if="project.tags && project.tags.length > 0" class="tags-section mb-3">
            <h4 class="text-subtitle-2 mb-1">Tags</h4>
            <div class="d-flex flex-wrap ga-1">
              <v-chip
                v-for="tag in project.tags"
                :key="tag"
                size="small"
                variant="outlined"
              >
                {{ tag }}
              </v-chip>
            </div>
          </div>

          <!-- Dates -->
          <div class="dates-section">
            <div class="date-item">
              <v-icon size="x-small" class="mr-1">mdi-calendar-plus</v-icon>
              <span class="text-caption">Created: {{ formatDate(project.createdAt) }}</span>
            </div>
            <div class="date-item">
              <v-icon size="x-small" class="mr-1">mdi-update</v-icon>
              <span class="text-caption">Updated: {{ formatRelativeTime(project.updatedAt) }}</span>
            </div>
          </div>

          <!-- Action Buttons -->
          <div class="action-buttons mt-3 d-flex ga-2">
            <v-btn
              variant="tonal"
              color="primary"
              size="small"
              @click.stop="$emit('view', project)"
            >
              View Details
            </v-btn>
            <v-btn
              v-if="canEdit"
              variant="outlined"
              size="small"
              @click.stop="$emit('edit', project)"
            >
              Edit
            </v-btn>
          </div>
        </div>
      </v-expand-transition>

      <!-- Deadline Alert (Always visible if overdue) -->
      <v-chip
        v-if="isOverdue"
        color="error"
        size="small"
        prepend-icon="mdi-alert"
        variant="flat"
        class="mt-2"
      >
        {{ formatDeadline(project.deadline) }}
      </v-chip>

      <!-- Expand/Collapse Indicator -->
      <div class="expand-indicator text-center mt-2">
        <v-icon size="small" color="grey">
          {{ isExpanded ? 'mdi-chevron-up' : 'mdi-chevron-down' }}
        </v-icon>
      </div>
    </div>
  </v-card>
</template>

<script setup>
import { ref, computed, toRef } from 'vue'
import { useCommsProjects } from '@/composables/comms/useCommsProjects'
import { useProjectStatus } from '@/composables/comms/useProjectStatus'
import { LOUISIANA_REGIONS as REGIONS } from '@/config/louisiana-regions'

// Props
const props = defineProps({
  project: {
    type: Object,
    required: true
  }
})

// Emits
const emit = defineEmits(['view', 'edit', 'delete'])

// State
const isExpanded = ref(false)

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

const currentStage = computed(() => {
  if (!currentStageData.value) return 'Not Started'
  return currentStageData.value.name || 'Not Started'
})

const isOverdue = computed(() => {
  if (!props.project.deadline) return false
  const deadlineDate = props.project.deadline.toDate ? 
    props.project.deadline.toDate() : 
    new Date(props.project.deadline)
  return deadlineDate < new Date()
})

// Methods
function toggleExpand() {
  isExpanded.value = !isExpanded.value
}

function getRegionDisplay() {
  const region = REGIONS[props.project.region]
  return region ? `Region ${props.project.region} - ${region.name}` : 'No Region'
}

function getStatusDisplay() {
  const statusMap = {
    not_started: 'Not Started',
    in_progress: 'In Progress',
    review: 'Review',
    completed: 'Completed',
    on_hold: 'On Hold',
    cancelled: 'Cancelled',
    pending_approval: 'Pending'
  }
  return statusMap[calculatedStatus.value] || calculatedStatus.value
}

function getProgressColor() {
  if (props.project.status === 'completed') return 'success'
  if (progressPercentage.value >= 75) return 'info'
  if (progressPercentage.value >= 50) return 'primary'
  if (progressPercentage.value >= 25) return 'warning'
  return 'error'
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

function formatDeadline(deadline) {
  if (!deadline) return ''
  
  const deadlineDate = deadline.toDate ? deadline.toDate() : new Date(deadline)
  const now = new Date()
  const daysUntil = Math.ceil((deadlineDate - now) / (1000 * 60 * 60 * 24))
  
  if (daysUntil < 0) {
    return `${Math.abs(daysUntil)} days overdue`
  } else if (daysUntil === 0) {
    return 'Due today'
  } else if (daysUntil === 1) {
    return 'Due tomorrow'
  } else if (daysUntil <= 7) {
    return `Due in ${daysUntil} days`
  } else {
    return `Due ${deadlineDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`
  }
}
</script>

<style scoped>
.mobile-project-card {
  position: relative;
  border: 1px solid rgba(0, 0, 0, 0.08);
  border-radius: 0;
  margin-bottom: 1px;
  transition: all 0.3s ease;
  cursor: pointer;
}

.mobile-project-card:first-child {
  border-top-left-radius: 8px;
  border-top-right-radius: 8px;
}

.mobile-project-card:last-child {
  border-bottom-left-radius: 8px;
  border-bottom-right-radius: 8px;
  margin-bottom: 0;
}

.mobile-project-card.expanded {
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
  z-index: 1;
  margin: 8px 0;
  border-radius: 8px !important;
}

/* Priority Styling */
.urgent-priority {
  border-left: 4px solid #FF5252;
}

.high-priority {
  border-left: 4px solid #FFC107;
}

.priority-indicator {
  position: absolute;
  top: 0;
  right: 0;
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  clip-path: polygon(100% 0, 0 0, 100% 100%);
}

.priority-indicator.urgent {
  background-color: #FF5252;
}

.priority-indicator.high {
  background-color: #FFC107;
}

/* Content Layout */
.card-content {
  position: relative;
}

.header-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  margin-bottom: 8px;
}

.project-title {
  flex: 1;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-size: 1.125rem !important;
  line-height: 1.3;
}

.metadata-row {
  font-size: 0.875rem;
  line-height: 1.4;
}

.progress-section {
  margin-top: 12px;
}

.owner-row {
  display: flex;
  align-items: center;
  gap: 8px;
}

.tags-row {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
  margin-top: 8px;
}

/* Expanded Content */
.expanded-content {
  padding-top: 12px;
  border-top: 1px solid rgba(0, 0, 0, 0.08);
}

.description-section p {
  color: rgba(0, 0, 0, 0.7);
  line-height: 1.5;
}

.dates-section {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.date-item {
  display: flex;
  align-items: center;
  color: rgba(0, 0, 0, 0.6);
}

/* Expand Indicator */
.expand-indicator {
  margin-top: 4px;
  opacity: 0.6;
}

/* Touch targets */
.v-btn {
  min-height: 44px;
}

/* Action buttons */
.action-buttons .v-btn {
  flex: 1;
}

/* Responsive font sizes */
@media (max-width: 360px) {
  .project-title {
    font-size: 1rem !important;
  }
  
  .metadata-row {
    font-size: 0.75rem;
  }
}
</style>