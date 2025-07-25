// client/src/components/comms/projects/ProjectList.vue
<template>
  <div class="project-list">
    <!-- Loading State -->
    <div v-if="loading" class="text-center py-8">
      <v-progress-circular
        indeterminate
        size="64"
        color="primary"
      />
      <p class="mt-4 text-body-1">Loading projects...</p>
    </div>

    <!-- Error State -->
    <v-alert
      v-else-if="error"
      type="error"
      variant="tonal"
      class="mb-4"
    >
      {{ error }}
    </v-alert>

    <!-- Empty State -->
    <v-empty-state
      v-else-if="!loading && visibleProjects.length === 0"
      icon="mdi-folder-open-outline"
      title="No projects found"
      :text="emptyStateText"
      class="py-8"
    />

    <!-- Projects Grid/List -->
    <template v-else>
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
          v-for="project in paginatedProjects"
          :key="project.id"
          cols="12"
          sm="6"
          md="4"
          lg="3"
        >
          <ProjectCard
            :project="project"
            @click="selectProject(project)"
            @delete="handleDelete"
          />
        </v-col>
      </v-row>

      <!-- List View -->
      <v-list v-else lines="three" class="bg-transparent">
        <template v-for="(project, index) in paginatedProjects" :key="project.id">
          <v-list-item
            @click="selectProject(project)"
            :prepend-icon="getPriorityIcon(project.priority)"
            :prepend-color="getPriorityColor(project.priority)"
          >
            <template v-slot:title>
              <div class="d-flex align-center ga-2">
                <span class="font-weight-medium">{{ project.title }}</span>
                <StatusBadge :status="project.status || 'not_started'" small />
                <RegionBadge :region="project.region" small />
              </div>
            </template>

            <template v-slot:subtitle>
              <div>
                {{ project.description }}
              </div>
              <div class="mt-1 text-caption">
                <v-chip
                  v-if="project.coordinatorName"
                  size="x-small"
                  variant="tonal"
                  prepend-icon="mdi-account"
                  class="mr-2"
                >
                  {{ project.coordinatorName }}
                </v-chip>
                <v-chip
                  v-if="project.deadline"
                  size="x-small"
                  variant="tonal"
                  :color="getDeadlineColor(project.deadline)"
                  :prepend-icon="getDeadlineIcon(project.deadline)"
                >
                  {{ formatDate(project.deadline) }}
                </v-chip>
              </div>
            </template>

            <template v-slot:append>
              <div class="text-right">
                <div class="text-caption text-disabled">
                  Updated {{ formatRelativeTime(project.updatedAt) }}
                </div>
                <div class="mt-2">
                  <v-btn
                    v-if="canEditProject(project)"
                    icon="mdi-pencil"
                    size="small"
                    variant="text"
                    @click.stop="selectProject(project)"
                  />
                  <v-btn
                    v-if="canDeleteProject(project)"
                    icon="mdi-delete"
                    size="small"
                    variant="text"
                    color="error"
                    @click.stop="handleDelete(project)"
                  />
                </div>
              </div>
            </template>
          </v-list-item>
          <v-divider v-if="index < paginatedProjects.length - 1" />
        </template>
      </v-list>

      <!-- Pagination -->
      <v-pagination
        v-if="pageCount > 1"
        v-model="currentPage"
        :length="pageCount"
        :total-visible="7"
        rounded="circle"
        class="mt-4"
      />
    </template>
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted, onUnmounted, nextTick } from 'vue'
import { useCommsProjects } from '@/composables/comms/useCommsProjects'
import { formatDistanceToNow } from 'date-fns'
import ProjectCard from './ProjectCard.vue'
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
const emit = defineEmits(['select', 'stats-update', 'delete'])

// Composables
const {
  projects,
  loading,
  error,
  filteredProjects,
  projectStats,
  setFilter,
  initialize,
  canEditProject,
  canDeleteProject
} = useCommsProjects()

// State
const viewMode = ref('grid')
const currentPage = ref(1)
const itemsPerPage = computed(() => viewMode.value === 'grid' ? 12 : 20)
let unsubscribe = null

// Computed properties for fixing the undefined error
const visibleProjects = computed(() => {
  // Return filtered projects that aren't deleted (unless specifically showing deleted)
  if (props.filters?.showDeleted) {
    return filteredProjects.value || []
  }
  return (filteredProjects.value || []).filter(p => !p.deleted)
})

const pageCount = computed(() => {
  return Math.ceil(visibleProjects.value.length / itemsPerPage.value)
})

const paginatedProjects = computed(() => {
  const start = (currentPage.value - 1) * itemsPerPage.value
  return visibleProjects.value.slice(start, start + itemsPerPage.value)
})

const emptyStateText = computed(() => {
  if (props.filters?.search) {
    return `No projects found matching "${props.filters.search}"`
  }
  if (props.filters?.region || props.filters?.status || props.filters?.priority) {
    return 'No projects match the selected filters'
  }
  return 'No projects have been created yet'
})

// Methods
function selectProject(project) {
  emit('select', project)
}

function handleDelete(project) {
  emit('delete', project)
}

function formatRelativeTime(date) {
  if (!date) return 'never'
  
  try {
    const dateObj = date instanceof Date ? date : date.toDate()
    return formatDistanceToNow(dateObj, { addSuffix: true })
  } catch (error) {
    return 'unknown'
  }
}

function getPriorityIcon(priority) {
  const icons = {
    high: 'mdi-alert-circle',
    medium: 'mdi-alert',
    low: 'mdi-information'
  }
  return icons[priority] || 'mdi-information'
}

function getPriorityColor(priority) {
  const colors = {
    high: 'error',
    medium: 'warning',
    low: 'info'
  }
  return colors[priority] || 'grey'
}

function getDeadlineColor(deadline) {
  if (!deadline) return 'grey'
  
  const daysUntil = Math.ceil((new Date(deadline) - new Date()) / (1000 * 60 * 60 * 24))
  
  if (daysUntil < 0) return 'error'
  if (daysUntil <= 7) return 'warning'
  if (daysUntil <= 30) return 'info'
  return 'success'
}

function getDeadlineIcon(deadline) {
  const daysUntil = Math.ceil((new Date(deadline) - new Date()) / (1000 * 60 * 60 * 24))
  
  if (daysUntil < 0) return 'mdi-clock-alert-outline'
  if (daysUntil <= 7) return 'mdi-clock-fast'
  if (daysUntil <= 30) return 'mdi-clock-outline'
  return 'mdi-clock-check-outline'
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

// Reset page when filters change
watch(filteredProjects, () => {
  currentPage.value = 1
})

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

defineExpose({
  projects,
  visibleProjects
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