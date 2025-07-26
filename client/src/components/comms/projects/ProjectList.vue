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
            @view="selectProject"
            @edit="handleEdit"
            @delete="handleDelete"
          />
        </v-col>
      </v-row>

      <!-- List View -->
      <div v-else class="list-view">
        <v-data-table
          :headers="tableHeaders"
          :items="paginatedProjects"
          :items-per-page="-1"
          hide-default-footer
          density="comfortable"
          hover
          disable-sort
          @click:row="(event, { item }) => selectProject(item)"
          class="project-table"
        >
          <!-- Custom header template -->
          <template v-slot:headers="{ columns }">
            <tr class="ldh-header">
              <th
                v-for="column in columns"
                :key="column.key"
                :class="[
                  'text-' + (column.align || 'start'),
                  { 'sortable': column.sortable }
                ]"
                @click="column.sortable && handleHeaderClick(column.key)"
              >
                <div class="d-flex align-center" :class="column.align === 'center' ? 'justify-center' : ''">
                  <span>{{ column.title }}</span>
                  <v-icon
                    v-if="column.sortable"
                    class="ml-1"
                    size="small"
                  >
                    {{ getSortIcon(column.key) }}
                  </v-icon>
                </div>
              </th>
            </tr>
          </template>
          <!-- Title column -->
          <template v-slot:item.title="{ item }">
            <div class="d-flex align-center ga-2 py-2">
              <v-icon
                :color="getPriorityColor(item.priority)"
                size="small"
              >
                {{ getPriorityIcon(item.priority) }}
              </v-icon>
              <span class="font-weight-medium text-no-wrap">{{ item.title }}</span>
            </div>
          </template>

          <!-- Status column -->
          <template v-slot:item.status="{ item }">
            <StatusBadge :status="calculateProjectStatus(item)" size="small" />
          </template>

          <!-- Region column -->
          <template v-slot:item.region="{ item }">
            <RegionBadge :region="item.region" size="small" />
          </template>

          <!-- Priority column -->
          <template v-slot:item.priority="{ item }">
            <v-chip
              v-if="item.priority"
              :color="getPriorityColor(item.priority)"
              size="small"
              variant="tonal"
            >
              {{ item.priority }}
            </v-chip>
            <span v-else class="text-disabled">—</span>
          </template>

          <!-- Coordinator column -->
          <template v-slot:item.coordinatorName="{ item }">
            <div v-if="item.coordinatorName" class="text-no-wrap">
              <v-icon size="x-small" class="mr-1">mdi-account</v-icon>
              {{ item.coordinatorName }}
            </div>
            <span v-else class="text-disabled">—</span>
          </template>

          <!-- Progress column -->
          <template v-slot:item.progress="{ item }">
            <div class="d-flex align-center ga-2">
              <v-progress-linear
                :model-value="calculateProgress(item)"
                height="6"
                rounded
                color="primary"
                style="min-width: 60px"
              />
              <span class="text-caption">{{ Math.round(calculateProgress(item)) }}%</span>
            </div>
          </template>

          <!-- Deadline column -->
          <template v-slot:item.deadline="{ item }">
            <v-chip
              v-if="item.deadline"
              size="small"
              variant="tonal"
              :color="getDeadlineColor(item.deadline)"
            >
              {{ formatDeadline(item.deadline) }}
            </v-chip>
            <span v-else class="text-disabled">—</span>
          </template>

          <!-- Last Updated column -->
          <template v-slot:item.updatedAt="{ item }">
            <div class="text-no-wrap text-caption">
              {{ formatRelativeTime(item.updatedAt) }}
            </div>
          </template>

          <!-- Actions column -->
          <template v-slot:item.actions="{ item }">
            <div @click.stop>
              <v-menu>
                <template v-slot:activator="{ props }">
                  <v-btn
                    icon="mdi-dots-vertical"
                    size="small"
                    variant="text"
                    v-bind="props"
                  />
                </template>
                <v-list density="compact">
                  <v-list-item @click="selectProject(item)">
                    <template v-slot:prepend>
                      <v-icon>mdi-eye</v-icon>
                    </template>
                    <v-list-item-title>View</v-list-item-title>
                  </v-list-item>
                  <v-list-item
                    v-if="canEditProject(item)"
                    @click="$emit('edit', item)"
                  >
                    <template v-slot:prepend>
                      <v-icon>mdi-pencil</v-icon>
                    </template>
                    <v-list-item-title>Edit</v-list-item-title>
                  </v-list-item>
                  <v-list-item
                    v-if="canDeleteProject(item)"
                    @click="handleDelete(item)"
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
        </v-data-table>
      </div>

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
import { calculateProjectStatus, getStatusSortOrder } from '@/composables/comms/utils/calculateProjectStatus'
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
const emit = defineEmits(['select', 'stats-update', 'delete', 'edit', 'update:filters'])

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

// Table headers for list view
const tableHeaders = computed(() => {
  return [
    { title: 'Project Title', key: 'title', sortable: true },
    { title: 'Status', key: 'status', sortable: true, align: 'center' },
    { title: 'Region', key: 'region', sortable: true, align: 'center' },
    { title: 'Priority', key: 'priority', sortable: true, align: 'center' },
    { title: 'Coordinator', key: 'coordinatorName', sortable: true },
    { title: 'Progress', key: 'progress', sortable: true, align: 'center' },
    { title: 'Deadline', key: 'deadline', sortable: true, align: 'center' },
    { title: 'Last Updated', key: 'updatedAt', sortable: true },
    { title: '', key: 'actions', sortable: false, align: 'center', width: '48px' }
  ]
})

// Computed properties for fixing the undefined error
const visibleProjects = computed(() => {
  // Return filtered projects that aren't deleted (unless specifically showing deleted)
  let projects = props.filters?.showDeleted
    ? filteredProjects.value || []
    : (filteredProjects.value || []).filter(p => !p.deleted)

  // Apply sorting
  const sortBy = props.filters?.sortBy || 'updatedAt'
  const sortDirection = props.filters?.sortDirection || 'desc'

  const sorted = [...projects].sort((a, b) => {
    let result = 0

    switch (sortBy) {
      case 'title':
        result = (a.title || '').localeCompare(b.title || '')
        break

      case 'region':
        // Sort regions numerically (Region 1, Region 2, etc.)
        const aRegion = parseInt(a.region?.replace('Region ', '') || '99')
        const bRegion = parseInt(b.region?.replace('Region ', '') || '99')
        result = aRegion - bRegion
        break

      case 'priority':
        // For priority, we need to handle the semantic meaning:
        // - Ascending: low importance first (low → medium → high → urgent)
        // - Descending: high importance first (urgent → high → medium → low)
        // Since urgent=0 and low=3 in our mapping, we need to invert for descending
        const priorityOrder = { urgent: 0, high: 1, medium: 2, low: 3 }

        // Debug logging removed - priority sorting is working correctly

        // Get priority values with fallback
        const aPriority = priorityOrder[a.priority] !== undefined ? priorityOrder[a.priority] : 99
        const bPriority = priorityOrder[b.priority] !== undefined ? priorityOrder[b.priority] : 99

        // For descending (default), we want urgent first, so normal comparison works
        // For ascending, we want low first, so we need to reverse
        if (sortDirection === 'asc') {
          // Ascending: low (3) should come before urgent (0)
          result = bPriority - aPriority
        } else {
          // Descending: urgent (0) should come before low (3)
          result = aPriority - bPriority
        }

        return result // Return early to skip the general sort direction logic

      case 'deadline':
        const aDate = a.deadline?.toDate ? a.deadline.toDate() : new Date(a.deadline || 0)
        const bDate = b.deadline?.toDate ? b.deadline.toDate() : new Date(b.deadline || 0)
        result = aDate - bDate
        break

      case 'progress':
        const aProgress = calculateProgress(a)
        const bProgress = calculateProgress(b)
        result = aProgress - bProgress
        break

      case 'coordinatorName':
        result = (a.coordinatorName || '').localeCompare(b.coordinatorName || '')
        break

      case 'status':
        // Use the shared status calculation and sort order
        const statusOrder = getStatusSortOrder()

        const aStatus = calculateProjectStatus(a)
        const bStatus = calculateProjectStatus(b)

        const aOrder = statusOrder[aStatus] !== undefined ? statusOrder[aStatus] : 99
        const bOrder = statusOrder[bStatus] !== undefined ? statusOrder[bStatus] : 99
        result = aOrder - bOrder

        // For status, return early to handle sort direction properly
        // When ascending, we want not_started first (active work)
        // When descending, we want cancelled/on_hold first (inactive work)
        return sortDirection === 'asc' ? result : -result

      case 'createdAt':
        const aCreated = a.createdAt?.toDate ? a.createdAt.toDate() : new Date(a.createdAt || 0)
        const bCreated = b.createdAt?.toDate ? b.createdAt.toDate() : new Date(b.createdAt || 0)
        result = aCreated - bCreated
        break

      case 'updatedAt':
      default:
        const aUpdated = a.updatedAt?.toDate ? a.updatedAt.toDate() : new Date(a.updatedAt || 0)
        const bUpdated = b.updatedAt?.toDate ? b.updatedAt.toDate() : new Date(b.updatedAt || 0)
        result = aUpdated - bUpdated
        break
    }

    // Apply sort direction
    return sortDirection === 'asc' ? result : -result
  })

  // Debug: Log final sorted array when sorting by status
  if (sortBy === 'status') {
    // Use the shared status calculation utility

    // Show all status groups
    const statusGroups = {
      not_started: [],
      in_progress: [],
      pending_approval: [],
      completed: []
    }

    sorted.forEach(p => {
      const status = calculateProjectStatus(p)
      if (statusGroups[status]) {
        statusGroups[status].push(p.title)
      }
    })

    Object.entries(statusGroups).forEach(([status, projects]) => {
      if (projects.length > 0) {
        // Process status groups
      }
    })

    // Show actual order in the sorted array
    sorted.slice(0, 10).forEach((p, idx) => {
      const status = calculateProjectStatus(p)
      // Process each project
    })
  }

  return sorted
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
    return 'No projects found matching "' + props.filters.search + '"'
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

function calculateProgress(project) {
  if (!project.stages || project.stages.length === 0) return 0
  const completed = project.stages.filter(s => s.completed).length
  return (completed / project.stages.length) * 100
}

function handleDelete(project) {
  emit('delete', project)
}

function handleEdit(project) {
  emit('edit', project)
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
    urgent: 'mdi-alert-octagon',
    high: 'mdi-alert-circle',
    medium: 'mdi-alert',
    low: 'mdi-information'
  }
  return icons[priority] || 'mdi-information'
}

function getPriorityColor(priority) {
  const colors = {
    urgent: 'error',
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

function formatDeadline(deadline) {
  if (!deadline) return ''
  const dateObj = deadline.toDate ? deadline.toDate() : new Date(deadline)
  const daysUntil = Math.ceil((dateObj - new Date()) / (1000 * 60 * 60 * 24))

  const formatted = formatDate(dateObj)
  if (daysUntil < 0) return 'Overdue (' + formatted + ')'
  if (daysUntil === 0) return 'Due Today'
  if (daysUntil === 1) return 'Due Tomorrow'
  if (daysUntil <= 7) return daysUntil + ' days'
  return formatted
}

function getCalculatedStatus(project) {
  // If manually set to pending_approval, keep that
  if (project.status === 'pending_approval') {
    return 'pending_approval'
  }

  // Calculate based on stages
  if (!project.stages || project.stages.length === 0) {
    return 'not_started'
  }

  const completedCount = project.stages.filter(s => s.completed).length
  if (completedCount === project.stages.length) {
    return 'completed'
  } else if (completedCount > 0) {
    return 'in_progress'
  } else {
    return 'not_started'
  }
}

// Sorting functions
function handleHeaderClick(key) {
  const currentSortBy = props.filters?.sortBy || 'updatedAt'
  const currentDirection = props.filters?.sortDirection || 'desc'

  let newDirection = 'desc'
  if (currentSortBy === key) {
    newDirection = currentDirection === 'desc' ? 'asc' : 'desc'
  }

  emit('update:filters', {
    ...props.filters,
    sortBy: key,
    sortDirection: newDirection
  })
}

function getSortIcon(key) {
  const sortBy = props.filters?.sortBy || 'updatedAt'
  const sortDirection = props.filters?.sortDirection || 'desc'

  if (sortBy !== key) {
    return 'mdi-unfold-more-horizontal'
  }

  return sortDirection === 'asc' ? 'mdi-arrow-up' : 'mdi-arrow-down'
}

// Watch for filter changes
watch(() => props.filters, (newFilters) => {
  // Only apply filters that setFilter handles
  const filterableKeys = ['region', 'status', 'priority', 'coordinator', 'search', 'deleted']

  Object.entries(newFilters).forEach(([key, value]) => {
    if (filterableKeys.includes(key)) {
      setFilter(key, value)
    }
  })
}, { deep: true })

// Watch for projects changes and emit stats update only when projects actually change
watch(() => projects.value, (newProjects) => {
  // Use nextTick to ensure stats are calculated after projects update
  nextTick(() => {
    emit('stats-update', projectStats.value)
  })
}, { immediate: true })

// Reset page when filters change
watch(filteredProjects, () => {
  currentPage.value = 1
})

// Lifecycle
onMounted(async () => {
  unsubscribe = await initialize()
})

onUnmounted(() => {
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

.list-view {
  margin: -12px;
}

.project-table {
  border-radius: 8px;
  overflow: hidden;
}

.project-table :deep(.v-table__wrapper) {
  overflow-x: auto;
}

.project-table :deep(tbody tr) {
  cursor: pointer;
  transition: all 0.2s ease;
}

.project-table :deep(tbody tr:hover) {
  background-color: rgba(var(--v-theme-primary), 0.04);
  transform: translateY(-1px);
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.project-table :deep(th) {
  font-weight: 600 !important;
  font-size: 0.875rem !important;
  text-transform: uppercase;
  letter-spacing: 0.025em;
  background-color: rgba(var(--v-theme-surface-variant), 0.5) !important;
}

.project-table :deep(.ldh-header) {
  background: linear-gradient(135deg, #003057 0%, #004080 100%);
}

.project-table :deep(.ldh-header th) {
  color: white !important;
  background-color: transparent !important;
  border-bottom: 2px solid rgba(255, 255, 255, 0.2) !important;
  padding: 16px 12px !important;
}

.project-table :deep(.ldh-header th.sortable) {
  cursor: pointer;
  transition: background-color 0.2s ease;
}

.project-table :deep(.ldh-header th.sortable:hover) {
  background-color: rgba(255, 255, 255, 0.1) !important;
}

.project-table :deep(.ldh-header .v-icon) {
  color: rgba(255, 255, 255, 0.8) !important;
}

.project-table :deep(.text-no-wrap) {
  white-space: nowrap;
}

/* Responsive adjustments */
@media (max-width: 1280px) {
  .project-table :deep(th),
  .project-table :deep(td) {
    padding: 12px 8px !important;
  }
}

@media (max-width: 960px) {
  .list-view {
    margin: -8px;
  }

  .project-table :deep(.v-data-table-header__content) {
    font-size: 0.75rem !important;
  }

  .project-table :deep(td) {
    font-size: 0.875rem !important;
  }
}

@media (max-width: 600px) {
  /* Hide less important columns on mobile */
  .project-table :deep(th:nth-child(5)),
  .project-table :deep(td:nth-child(5)),
  .project-table :deep(th:nth-child(6)),
  .project-table :deep(td:nth-child(6)) {
    display: none;
  }
}
</style>