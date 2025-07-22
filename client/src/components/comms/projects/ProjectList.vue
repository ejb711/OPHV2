<template>
  <div class="project-list">
    <!-- Loading State -->
    <div v-if="loading" class="text-center py-8">
      <v-progress-circular
        indeterminate
        color="primary"
        size="48"
      />
      <p class="text-medium-emphasis mt-4">Loading projects...</p>
    </div>

    <!-- Error State -->
    <v-alert
      v-else-if="error"
      type="error"
      variant="tonal"
      class="mb-4"
    >
      <strong>Error loading projects:</strong> {{ error }}
    </v-alert>

    <!-- Empty State -->
    <v-card
      v-else-if="projects.length === 0"
      class="text-center py-12"
    >
      <v-icon
        size="64"
        color="grey-lighten-1"
        class="mb-4"
      >
        mdi-folder-open-outline
      </v-icon>
      <h3 class="text-h6 text-medium-emphasis">
        No projects found
      </h3>
      <p class="text-body-2 text-disabled mt-2">
        {{ filters.search || filters.region || filters.status || filters.priority 
          ? 'Try adjusting your filters' 
          : 'Create your first project to get started' }}
      </p>
    </v-card>

    <!-- Project Grid -->
    <div v-else>
      <!-- View Toggle -->
      <div class="d-flex justify-end mb-4">
        <v-btn-toggle
          v-model="viewMode"
          mandatory
          density="compact"
          variant="outlined"
        >
          <v-btn value="grid" icon="mdi-view-grid" />
          <v-btn value="list" icon="mdi-view-list" />
        </v-btn-toggle>
      </div>

      <!-- Grid View -->
      <v-row v-if="viewMode === 'grid'">
        <v-col
          v-for="project in projects"
          :key="project.id"
          cols="12"
          sm="6"
          lg="4"
        >
          <ProjectCard
            :project="project"
            @click="$emit('select-project', project)"
          />
        </v-col>
      </v-row>

      <!-- List View -->
      <v-list v-else lines="two" class="bg-transparent">
        <template v-for="(project, index) in projects" :key="project.id">
          <v-list-item
            @click="$emit('select-project', project)"
            class="px-0"
          >
            <template v-slot:prepend>
              <v-avatar
                :color="getStatusColor(project.status)"
                size="40"
                class="text-white font-weight-bold"
              >
                {{ project.title.charAt(0).toUpperCase() }}
              </v-avatar>
            </template>

            <v-list-item-title class="font-weight-medium">
              {{ project.title }}
            </v-list-item-title>
            
            <v-list-item-subtitle>
              <div class="d-flex align-center gap-2 flex-wrap mt-1">
                <RegionBadge :region="project.region" size="small" />
                <StatusBadge :status="project.status" size="small" />
                <span v-if="project.priority" class="text-caption">
                  <v-icon size="x-small" :color="getPriorityColor(project.priority)">
                    mdi-flag
                  </v-icon>
                  {{ project.priority }}
                </span>
                <span v-if="project.deadline" class="text-caption">
                  <v-icon size="x-small">mdi-calendar</v-icon>
                  {{ formatDate(project.deadline) }}
                </span>
              </div>
            </v-list-item-subtitle>

            <template v-slot:append>
              <v-btn
                variant="text"
                icon="mdi-chevron-right"
                size="small"
              />
            </template>
          </v-list-item>
          
          <v-divider v-if="index < projects.length - 1" />
        </template>
      </v-list>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, watch } from 'vue'
import { useCommsProjects } from '@/composables/comms/useCommsProjects'
import ProjectCard from './ProjectCard.vue'
import StatusBadge from '../shared/StatusBadge.vue'
import RegionBadge from '../shared/RegionBadge.vue'

// Props
const props = defineProps({
  filters: {
    type: Object,
    default: () => ({})
  }
})

// Emits
const emit = defineEmits(['select-project', 'update:stats'])

// Composables
const { 
  projects, 
  loading, 
  error, 
  projectStats,
  filters,
  initialize,
  setFilter
} = useCommsProjects()

// State
const viewMode = ref('grid')
let unsubscribe = null

// Methods
function getStatusColor(status) {
  const colors = {
    'not_started': 'grey',
    'planning': 'blue',
    'in_progress': 'amber',
    'review': 'orange',
    'approved': 'green',
    'completed': 'teal',
    'on_hold': 'red',
    'cancelled': 'grey-darken-2'
  }
  return colors[status] || 'grey'
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

function formatDate(date) {
  if (!date) return ''
  return new Intl.DateTimeFormat('en-US', { 
    month: 'short', 
    day: 'numeric',
    year: 'numeric'
  }).format(date)
}

// Watch for external filter changes
const watchFilters = () => {
  if (props.filters.region !== undefined) {
    setFilter('region', props.filters.region)
  }
  if (props.filters.status !== undefined) {
    setFilter('status', props.filters.status)
  }
  if (props.filters.priority !== undefined) {
    setFilter('priority', props.filters.priority)
  }
  if (props.filters.search !== undefined) {
    setFilter('search', props.filters.search)
  }
}

// Watch for stats changes and emit them
watch(projectStats, (newStats) => {
  console.log('Project stats updated:', newStats)
  emit('update:stats', newStats)
}, { deep: true })

// Watch for project changes to update stats
watch(projects, (newProjects) => {
  console.log('Projects updated, count:', newProjects.length)
  // Emit stats whenever projects change
  if (newProjects.length > 0) {
    emit('update:stats', projectStats.value)
  }
}, { immediate: true })

// Lifecycle
onMounted(async () => {
  console.log('ProjectList mounted')
  
  // Add a delay to ensure auth is ready
  setTimeout(async () => {
    loading.value = true
    try {
      // Use initialize directly (not projectsComposable.initialize)
      unsubscribe = await initialize()
      console.log('Projects initialized')
    } catch (error) {
      console.error('Failed to initialize projects:', error)
    } finally {
      loading.value = false
    }
  }, 1500) // 1.5 second delay
  
  // Also watch filters after delay
  setTimeout(() => {
    watchFilters()
  }, 1600)
})

onUnmounted(() => {
  if (unsubscribe) {
    unsubscribe()
  }
})
</script>

<style scoped>
.project-list {
  min-height: 400px;
}
</style>