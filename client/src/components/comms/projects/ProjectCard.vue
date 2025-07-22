<template>
  <v-card
    class="project-card h-100"
    :class="{ 'project-card-hover': hover }"
    @mouseenter="hover = true"
    @mouseleave="hover = false"
    @click="$emit('click', project)"
  >
    <!-- Card Header with Status Color -->
    <div 
      class="project-card-header pa-3"
      :style="{ backgroundColor: statusColor + '20', borderColor: statusColor }"
    >
      <div class="d-flex align-center justify-space-between">
        <StatusBadge :status="project.status" />
        <v-menu v-if="showActions">
          <template v-slot:activator="{ props }">
            <v-btn
              v-bind="props"
              icon="mdi-dots-vertical"
              variant="text"
              size="small"
              @click.stop
            />
          </template>
          <v-list density="compact">
            <v-list-item @click.stop="$emit('edit', project)">
              <template v-slot:prepend>
                <v-icon size="small">mdi-pencil</v-icon>
              </template>
              <v-list-item-title>Edit</v-list-item-title>
            </v-list-item>
            <v-list-item @click.stop="$emit('duplicate', project)">
              <template v-slot:prepend>
                <v-icon size="small">mdi-content-copy</v-icon>
              </template>
              <v-list-item-title>Duplicate</v-list-item-title>
            </v-list-item>
          </v-list>
        </v-menu>
      </div>
    </div>

    <!-- Card Content -->
    <v-card-text class="pb-2">
      <!-- Title -->
      <h3 class="text-h6 font-weight-medium mb-2 project-title">
        {{ project.title }}
      </h3>

      <!-- Description -->
      <p 
        v-if="project.description" 
        class="text-body-2 text-medium-emphasis mb-3 project-description"
      >
        {{ truncateText(project.description, 120) }}
      </p>

      <!-- Metadata -->
      <div class="project-metadata">
        <!-- Region -->
        <div class="mb-2">
          <RegionBadge :region="project.region" size="small" />
        </div>

        <!-- Priority & Deadline -->
        <div class="d-flex align-center gap-3 text-caption text-medium-emphasis">
          <span v-if="project.priority" class="d-flex align-center gap-1">
            <v-icon 
              size="x-small" 
              :color="getPriorityColor(project.priority)"
            >
              mdi-flag
            </v-icon>
            {{ capitalize(project.priority) }} priority
          </span>
          
          <span v-if="project.deadline" class="d-flex align-center gap-1">
            <v-icon size="x-small">mdi-calendar-clock</v-icon>
            {{ formatDeadline(project.deadline) }}
          </span>
        </div>

        <!-- Tags -->
        <div v-if="project.tags?.length" class="mt-2">
          <v-chip
            v-for="tag in project.tags.slice(0, 3)"
            :key="tag"
            size="x-small"
            variant="tonal"
            class="mr-1"
          >
            {{ tag }}
          </v-chip>
          <span 
            v-if="project.tags.length > 3" 
            class="text-caption text-medium-emphasis"
          >
            +{{ project.tags.length - 3 }}
          </span>
        </div>
      </div>
    </v-card-text>

    <!-- Progress Bar -->
    <div v-if="project.stages?.length" class="px-4 pb-3">
      <div class="d-flex align-center justify-space-between text-caption mb-1">
        <span class="text-medium-emphasis">Progress</span>
        <span class="font-weight-medium">{{ stageProgress }}%</span>
      </div>
      <v-progress-linear
        :model-value="stageProgress"
        :color="statusColor"
        height="6"
        rounded
      />
    </div>

    <!-- Card Footer -->
    <v-divider />
    <v-card-actions class="px-4 py-2">
      <div class="d-flex align-center justify-space-between w-100">
        <!-- Coordinators -->
        <div class="d-flex align-center">
          <v-avatar
            v-for="(coordinator, index) in displayedCoordinators"
            :key="coordinator"
            size="28"
            :class="index > 0 ? 'ml-n2' : ''"
            color="grey"
          >
            <span class="text-caption">{{ getInitials(coordinator) }}</span>
          </v-avatar>
          <span 
            v-if="additionalCoordinators > 0" 
            class="text-caption text-medium-emphasis ml-2"
          >
            +{{ additionalCoordinators }}
          </span>
        </div>

        <!-- Last Updated -->
        <span class="text-caption text-medium-emphasis">
          Updated {{ formatRelativeTime(project.updatedAt) }}
        </span>
      </div>
    </v-card-actions>
  </v-card>
</template>

<script setup>
import { ref, computed } from 'vue'
import StatusBadge from '../shared/StatusBadge.vue'
import RegionBadge from '../shared/RegionBadge.vue'
import { usePermissions } from '@/composables/usePermissions'

// Props
const props = defineProps({
  project: {
    type: Object,
    required: true
  },
  showActions: {
    type: Boolean,
    default: true
  }
})

// Emits
const emit = defineEmits(['click', 'edit', 'duplicate'])

// State
const hover = ref(false)

// Composables
const { canEditCommsProjects } = usePermissions()

// Computed
const statusColor = computed(() => {
  const colors = {
    'not_started': '#9E9E9E',
    'planning': '#2196F3',
    'in_progress': '#FFC107',
    'review': '#FF9800',
    'approved': '#4CAF50',
    'completed': '#009688',
    'on_hold': '#F44336',
    'cancelled': '#616161'
  }
  return colors[props.project.status] || '#9E9E9E'
})

const stageProgress = computed(() => {
  if (!props.project.stages?.length) return 0
  
  const completed = props.project.stages.filter(
    stage => stage.status === 'completed'
  ).length
  
  return Math.round((completed / props.project.stages.length) * 100)
})

const displayedCoordinators = computed(() => {
  return props.project.assignedCoordinators?.slice(0, 3) || []
})

const additionalCoordinators = computed(() => {
  const total = props.project.assignedCoordinators?.length || 0
  return total > 3 ? total - 3 : 0
})

// Methods
function truncateText(text, maxLength) {
  if (!text || text.length <= maxLength) return text
  return text.substring(0, maxLength) + '...'
}

function capitalize(text) {
  if (!text) return ''
  return text.charAt(0).toUpperCase() + text.slice(1)
}

function getPriorityColor(priority) {
  const colors = {
    'low': 'blue',
    'medium': 'orange', 
    'high': 'red',
    'urgent': 'red-darken-2'
  }
  return colors[priority] || 'grey'
}

function formatDeadline(date) {
  if (!date) return ''
  
  const now = new Date()
  const deadline = new Date(date)
  const diffDays = Math.ceil((deadline - now) / (1000 * 60 * 60 * 24))
  
  if (diffDays < 0) {
    return `Overdue by ${Math.abs(diffDays)} days`
  } else if (diffDays === 0) {
    return 'Due today'
  } else if (diffDays === 1) {
    return 'Due tomorrow'
  } else if (diffDays <= 7) {
    return `Due in ${diffDays} days`
  } else {
    return new Intl.DateTimeFormat('en-US', { 
      month: 'short', 
      day: 'numeric' 
    }).format(deadline)
  }
}

function formatRelativeTime(date) {
  if (!date) return 'never'
  
  const now = new Date()
  const updated = new Date(date)
  const diffMs = now - updated
  const diffMins = Math.floor(diffMs / 60000)
  const diffHours = Math.floor(diffMins / 60)
  const diffDays = Math.floor(diffHours / 24)
  
  if (diffMins < 1) return 'just now'
  if (diffMins < 60) return `${diffMins}m ago`
  if (diffHours < 24) return `${diffHours}h ago`
  if (diffDays < 30) return `${diffDays}d ago`
  
  return new Intl.DateTimeFormat('en-US', { 
    month: 'short', 
    day: 'numeric' 
  }).format(updated)
}

function getInitials(name) {
  if (!name) return '?'
  return name.split(' ')
    .map(word => word.charAt(0))
    .join('')
    .toUpperCase()
    .substring(0, 2)
}
</script>

<style scoped>
.project-card {
  cursor: pointer;
  transition: all 0.2s ease;
  height: 100%;
  display: flex;
  flex-direction: column;
}

.project-card-hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

.project-card-header {
  border-left: 4px solid;
  transition: background-color 0.2s ease;
}

.project-title {
  line-height: 1.4;
  overflow: hidden;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
}

.project-description {
  line-height: 1.5;
  overflow: hidden;
  display: -webkit-box;
  -webkit-line-clamp: 3;
  -webkit-box-orient: vertical;
}

.project-metadata {
  flex: 1;
}
</style>