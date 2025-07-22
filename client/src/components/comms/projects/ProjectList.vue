<!-- client/src/components/comms/projects/ProjectList.vue -->
<template>
  <div class="project-list">
    <!-- Loading State -->
    <v-skeleton-loader
      v-if="loading"
      type="card@4"
      class="mb-4"
    />

    <!-- Error State -->
    <v-alert
      v-else-if="error"
      type="error"
      variant="tonal"
      class="mb-4"
    >
      <v-alert-title>Error Loading Projects</v-alert-title>
      {{ error }}
    </v-alert>

    <!-- Empty State -->
    <v-card
      v-else-if="projects.length === 0 && !hasFilters"
      variant="flat"
      class="text-center pa-8"
    >
      <v-icon
        size="64"
        color="grey-lighten-1"
        class="mb-4"
      >
        mdi-folder-outline
      </v-icon>
      <h3 class="text-h6 mb-2">No Projects Yet</h3>
      <p class="text-body-2 text-medium-emphasis">
        Create your first project to get started
      </p>
    </v-card>

    <!-- No Results State -->
    <v-card
      v-else-if="projects.length === 0 && hasFilters"
      variant="flat"
      class="text-center pa-8"
    >
      <v-icon
        size="64"
        color="grey-lighten-1"
        class="mb-4"
      >
        mdi-magnify-remove-outline
      </v-icon>
      <h3 class="text-h6 mb-2">No Matching Projects</h3>
      <p class="text-body-2 text-medium-emphasis">
        Try adjusting your filters to see more results
      </p>
    </v-card>

    <!-- Projects Grid View -->
    <template v-else-if="viewMode === 'grid'">
      <v-row>
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
    </template>

    <!-- Projects List View -->
    <template v-else>
      <v-list lines="two" class="bg-surface">
        <template v-for="(project, index) in projects" :key="project.id">
          <v-list-item
            @click="handleProjectClick(project)"
            class="px-4"
          >
            <template v-slot:prepend>
              <v-icon
                :color="project.priority === 'urgent' ? 'error' : project.priority === 'high' ? 'warning' : ''"
              >
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
import { ref, computed, onMounted, onUnmounted, watch, nextTick } from 'vue'
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
const emit = defineEmits(['select', 'stats-update'])

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
let statsEmitted = false

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

// Watch for projects changes and emit stats update only when projects actually change
watch(() => projects.value, (newProjects) => {
  // Use nextTick to ensure stats are calculated after projects update
  nextTick(() => {
    console.log('Projects updated, emitting stats:', projectStats.value)
    emit('stats-update', projectStats.value)
  })
}, { immediate: true })

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