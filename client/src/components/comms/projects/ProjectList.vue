<!-- client/src/components/comms/projects/ProjectList.vue -->
<template>
  <div class="project-list">
    <!-- List/Grid Toggle -->
    <div class="d-flex justify-end mb-4">
      <v-btn-toggle
        v-model="viewMode"
        mandatory
        density="compact"
        variant="outlined"
      >
        <v-btn value="list" icon="mdi-view-list" />
        <v-btn value="grid" icon="mdi-view-grid" />
      </v-btn-toggle>
    </div>

    <!-- Loading State -->
    <div v-if="loading" class="text-center py-8">
      <v-progress-circular indeterminate color="primary" />
      <p class="text-body-2 mt-4">Loading projects...</p>
    </div>

    <!-- Empty State -->
    <v-empty-state
      v-else-if="filteredProjects.length === 0 && !error"
      icon="mdi-folder-open-outline"
      headline="No projects found"
      title="No projects match your filters"
      text="Try adjusting your filters or create a new project to get started."
    />

    <!-- Error State -->
    <v-alert
      v-else-if="error"
      type="error"
      variant="tonal"
      class="mb-4"
    >
      {{ error }}
    </v-alert>

    <!-- Projects Grid View -->
    <v-row v-else-if="viewMode === 'grid'">
      <v-col
        v-for="project in paginatedProjects"
        :key="project.id"
        cols="12"
        md="6"
        lg="4"
      >
        <ProjectCard
          :project="project"
          @view="$emit('select', $event)"
          @edit="$emit('select', $event)"
          @delete="handleDelete"
        />
      </v-col>
    </v-row>

    <!-- Projects List View -->
    <v-list v-else lines="two" class="bg-transparent">
      <template v-for="(project, index) in paginatedProjects" :key="project.id">
        <v-list-item
          :title="project.title"
          :subtitle="project.description"
          @click="$emit('select', project)"
        >
          <template v-slot:prepend>
            <v-avatar color="primary" variant="tonal">
              <v-icon>{{ getProjectIcon(project) }}</v-icon>
            </v-avatar>
          </template>

          <template v-slot:append>
            <div class="d-flex align-center ga-2">
              <StatusBadge :status="project.status" size="small" />
              <RegionBadge :region="project.region" size="small" />
              <v-chip
                v-if="project.deadline"
                :color="getDeadlineColor(project.deadline)"
                size="small"
                variant="tonal"
              >
                {{ formatDate(project.deadline) }}
              </v-chip>
              
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
                  <v-list-item @click.stop="$emit('select', project)">
                    <template v-slot:prepend>
                      <v-icon>mdi-eye</v-icon>
                    </template>
                    <v-list-item-title>View Details</v-list-item-title>
                  </v-list-item>
                  <v-list-item 
                    v-if="canEditProject(project)" 
                    @click.stop="$emit('select', project)"
                  >
                    <template v-slot:prepend>
                      <v-icon>mdi-pencil</v-icon>
                    </template>
                    <v-list-item-title>Edit</v-list-item-title>
                  </v-list-item>
                  <v-list-item 
                    v-if="canDeleteProject(project)" 
                    @click.stop="handleDelete(project)"
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
          </template>
        </v-list-item>
        
        <v-divider v-if="index < paginatedProjects.length - 1" />
      </template>
    </v-list>

    <!-- Pagination -->
    <div v-if="totalPages > 1" class="d-flex justify-center mt-6">
      <v-pagination
        v-model="currentPage"
        :length="totalPages"
        :total-visible="7"
        density="comfortable"
      />
    </div>

    <!-- Delete Confirmation Dialog -->
    <v-dialog v-model="deleteDialog" max-width="500">
      <v-card>
        <v-card-title class="text-h6">Delete Project?</v-card-title>
        <v-card-text>
          <p class="mb-4">Choose how you want to delete this project:</p>
          
          <v-list density="compact" class="mb-4">
            <v-list-item
              prepend-icon="mdi-delete-clock"
              @click="confirmDelete(false)"
            >
              <v-list-item-title>Move to Trash</v-list-item-title>
              <v-list-item-subtitle>
                Can be restored within 90 days
              </v-list-item-subtitle>
            </v-list-item>
            
            <v-list-item
              v-if="canManageComms"
              prepend-icon="mdi-delete-forever"
              @click="confirmDelete(true)"
              class="text-error"
            >
              <v-list-item-title>Permanently Delete</v-list-item-title>
              <v-list-item-subtitle>
                Cannot be undone - all data will be lost
              </v-list-item-subtitle>
            </v-list-item>
          </v-list>
          
          <v-alert
            type="warning"
            variant="tonal"
            density="compact"
          >
            Project: <strong>{{ projectToDelete?.title }}</strong>
          </v-alert>
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn
            variant="text"
            @click="deleteDialog = false"
          >
            Cancel
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted, onUnmounted, nextTick } from 'vue'
import { useCommsProjects } from '@/composables/comms/useCommsProjects'
import { usePermissions } from '@/composables/usePermissions'
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
  initialize,
  setFilter,
  canEditProject,
  canDeleteProject
} = useCommsProjects()

const { canManageComms } = usePermissions()

// State
const viewMode = ref('grid')
const currentPage = ref(1)
const itemsPerPage = ref(12)
const deleteDialog = ref(false)
const projectToDelete = ref(null)
let unsubscribe = null

// Computed
const totalPages = computed(() => 
  Math.ceil(filteredProjects.value.length / itemsPerPage.value)
)

const paginatedProjects = computed(() => {
  const start = (currentPage.value - 1) * itemsPerPage.value
  const end = start + itemsPerPage.value
  return filteredProjects.value.slice(start, end)
})

// Methods
function handleDelete(project) {
  projectToDelete.value = project
  deleteDialog.value = true
}

function confirmDelete(hard) {
  if (projectToDelete.value) {
    emit('delete', projectToDelete.value, hard)
  }
  deleteDialog.value = false
  projectToDelete.value = null
}

function getProjectIcon(project) {
  if (project.priority === 'high') return 'mdi-alert-circle'
  if (project.status === 'completed') return 'mdi-check-circle'
  if (project.status === 'in_progress') return 'mdi-progress-clock'
  return 'mdi-folder'
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