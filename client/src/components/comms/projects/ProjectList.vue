<!-- client/src/components/comms/projects/ProjectList.vue -->
<template>
  <div class="project-list">
    <!-- Loading State -->
    <div v-if="loading" class="text-center py-8">
      <v-progress-circular indeterminate color="primary" />
      <p class="text-body-2 mt-4 text-medium-emphasis">Loading projects...</p>
    </div>

    <!-- Error State -->
    <v-alert v-else-if="error" type="error" variant="tonal" class="mb-4">
      {{ error }}
    </v-alert>

    <!-- Empty State -->
    <v-card v-else-if="!projects.length" variant="outlined" class="text-center py-12">
      <v-card-text>
        <v-icon size="64" color="grey-lighten-1" class="mb-4">
          mdi-folder-open-outline
        </v-icon>
        <h3 class="text-h6 mb-2">No Projects Found</h3>
        <p class="text-body-2 text-medium-emphasis">
          {{ hasFilters ? 'Try adjusting your filters' : 'Create your first project to get started' }}
        </p>
      </v-card-text>
    </v-card>

    <!-- Projects Grid/List -->
    <template v-else>
      <!-- View Toggle -->
      <div class="d-flex justify-end mb-4">
        <v-btn-toggle v-model="viewMode" mandatory density="compact">
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
          md="4"
          lg="3"
        >
          <ProjectCard 
            :project="project" 
            @view="handleProjectClick"
            @edit="handleProjectEdit"
            @delete="handleProjectDelete"
          />
        </v-col>
      </v-row>

      <!-- List View -->
      <v-list v-else lines="two" class="bg-transparent">
        <template v-for="(project, index) in projects" :key="project.id">
          <v-list-item
            @click="handleProjectClick(project)"
            :prepend-icon="getPriorityIcon(project.priority)"
            :class="{ 'text-error': project.priority === 'high' }"
          >
            <template v-slot:prepend>
              <v-icon :color="project.priority === 'high' ? 'error' : ''">
                {{ getPriorityIcon(project.priority) }}
              </v-icon>
            </template>

            <v-list-item-title class="font-weight-medium">
              {{ project.title }}
            </v-list-item-title>
            
            <v-list-item-subtitle>
              <div class="d-flex align-center gap-2">
                <StatusBadge :status="project.status" small />
                <RegionBadge :region="project.region" small />
                <span class="text-caption text-medium-emphasis">
                  {{ formatDate(project.createdAt) }}
                </span>
                <span v-if="project.deadline" class="text-caption">
                  • Due: {{ formatDate(project.deadline) }}
                </span>
              </div>
            </v-list-item-subtitle>

            <template v-slot:append>
              <ProjectActions
                :project="project"
                :hide-edit="true"
                :hide-delete="true"
                :show-more="false"
              />
            </template>
          </v-list-item>
          
          <v-divider v-if="index < projects.length - 1" />
        </template>
      </v-list>
    </template>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted, watch } from 'vue'
import { useCommsProjects } from '@/composables/comms/useCommsProjects'
import ProjectCard from './ProjectCard.vue'
import ProjectActions from './ProjectActions.vue'
import StatusBadge from '../shared/StatusBadge.vue'
import RegionBadge from '../shared/RegionBadge.vue'

// Props
const props = defineProps({
  filters: {
    type: Object,
    default: () => ({
      region: null,
      status: null,
      priority: null,
      search: ''
    })
  }
})

// Emits
const emit = defineEmits(['select', 'statsUpdate'])

// Composables
const commsProjects = useCommsProjects()
const { 
  projects, 
  loading, 
  error, 
  projectStats,
  initialize,
  setFilter,
  clearFilters
} = commsProjects

// State
const viewMode = ref('grid')
let unsubscribe = null

// Computed
const hasFilters = computed(() => {
  return props.filters.region || 
         props.filters.status || 
         props.filters.priority || 
         props.filters.search
})

// Methods
function handleProjectClick(project) {
  emit('select', project)
}

function handleProjectEdit(project) {
  emit('select', project)
}

function handleProjectDelete(project) {
  emit('select', project)
}

function getPriorityIcon(priority) {
  switch (priority) {
    case 'high': return 'mdi-alert-circle'
    case 'normal': return 'mdi-circle-medium'
    case 'low': return 'mdi-circle-outline'
    default: return 'mdi-circle-outline'
  }
}

function formatDate(date) {
  if (!date) return ''
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  }).format(date)
}

// Watch for filter changes
watch(() => props.filters, (newFilters) => {
  console.log('Filters changed:', newFilters)
  
  // Apply each filter
  Object.entries(newFilters).forEach(([key, value]) => {
    setFilter(key, value)
  })
}, { deep: true })

// Watch for stats changes
watch(projectStats, (newStats) => {
  console.log('Stats updated:', newStats)
  emit('statsUpdate', newStats)
}, { deep: true })

// Lifecycle
onMounted(async () => {
  console.log('ProjectList mounted, initializing...')
  unsubscribe = await initialize()
})

onUnmounted(() => {
  console.log('ProjectList unmounting, cleaning up...')
  if (unsubscribe) {
    unsubscribe()
  }
})
</script>

<style scoped>
.project-list {
  min-height: 400px;
}

.v-list-item {
  cursor: pointer;
  transition: background-color 0.2s;
}

.v-list-item:hover {
  background-color: rgba(0, 0, 0, 0.04);
}

.v-theme--dark .v-list-item:hover {
  background-color: rgba(255, 255, 255, 0.08);
}
</style>