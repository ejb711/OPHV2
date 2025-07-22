<!-- client/src/components/comms/CommsDashboard.vue -->
<template>
  <v-container fluid>
    <!-- Header -->
    <div class="d-flex align-center justify-space-between mb-6">
      <div>
        <h1 class="text-h4 font-weight-bold text-grey-darken-3 mb-2">
          Communications Dashboard
        </h1>
        <p class="text-body-1 text-grey-darken-1">
          Manage communications projects across Louisiana's 9 health regions
        </p>
      </div>
      <div class="d-flex ga-3">
        <v-btn
          color="primary"
          variant="elevated"
          prepend-icon="mdi-folder-plus"
          :disabled="!canCreateProjects"
          @click="showCreateDialog = true"
        >
          New Project
        </v-btn>
        <v-btn
          variant="outlined"
          prepend-icon="mdi-export"
          disabled
        >
          Export
        </v-btn>
      </div>
    </div>

    <!-- Stats Cards -->
    <CommsStats 
      :stats="projectStats" 
      class="mb-6"
    />

    <!-- Filters -->
    <CommsFilters 
      :filters="filters"
      @update:filters="handleFilterUpdate"
      class="mb-6"
    />

    <!-- Projects List -->
    <ProjectList
      :filters="filters"
      @select="handleProjectSelect"
      @stats-update="handleStatsUpdate"
      @delete="handleProjectDelete"
    />

    <!-- Create Project Dialog -->
    <ProjectForm
      v-model="showCreateDialog"
      @created="handleProjectCreated"
    />

    <!-- Project Detail Drawer -->
    <ProjectDetail
      ref="projectDetailRef"
      @updated="handleProjectUpdated"
      @deleted="handleProjectDeleted"
    />

    <!-- Delete Confirmation Snackbar -->
    <v-snackbar
      v-model="deleteSnackbar"
      :color="deleteHard ? 'error' : 'warning'"
      timeout="5000"
    >
      Project {{ deleteHard ? 'permanently deleted' : 'moved to trash' }}
      <template v-slot:actions>
        <v-btn
          variant="text"
          @click="deleteSnackbar = false"
        >
          Close
        </v-btn>
      </template>
    </v-snackbar>
  </v-container>
</template>

<script setup>
import { ref, computed } from 'vue'
import { usePermissions } from '@/composables/usePermissions'
import { useCommsProjects } from '@/composables/comms/useCommsProjects'
import { LOUISIANA_REGIONS as louisianaRegions } from '@/config/louisiana-regions'
import CommsStats from './CommsStats.vue'
import CommsFilters from './CommsFilters.vue'
import ProjectList from './projects/ProjectList.vue'
import ProjectForm from './projects/ProjectForm.vue'
import ProjectDetail from './projects/ProjectDetail.vue'

// Composables
const { hasPermission } = usePermissions()
const { 
  createProject, 
  softDeleteProject, 
  hardDeleteProject 
} = useCommsProjects()

// State
const showCreateDialog = ref(false)
const projectDetailRef = ref(null)
const deleteSnackbar = ref(false)
const deleteHard = ref(false)

// Initialize filters with plain object
const filters = ref({
  region: null,
  status: null,
  priority: null,
  search: ''
})

// Initialize stats with plain object
const projectStats = ref({
  total: 0,
  byStatus: {},
  byPriority: {},
  byRegion: {}
})

// Computed
const canCreateProjects = computed(() => 
  hasPermission('create_comms_projects')
)

// Methods
function handleFilterUpdate(newFilters) {
  // Simply assign the new filters
  filters.value = newFilters
}

function handleProjectSelect(project) {
  console.log('Project selected:', project)
  if (projectDetailRef.value) {
    projectDetailRef.value.open(project.id)
  }
}

function handleStatsUpdate(stats) {
  // Directly update stats without comparison
  projectStats.value = stats
}

function handleProjectCreated(project) {
  console.log('Project created:', project)
  // The list will auto-refresh due to Firestore listener
}

function handleProjectUpdated(project) {
  console.log('Project updated:', project)
  // The list will auto-refresh due to Firestore listener
}

function handleProjectDeleted(options) {
  console.log('Project deleted:', options)
  deleteHard.value = options.hard
  deleteSnackbar.value = true
  // The list will auto-refresh due to Firestore listener
}

async function handleProjectDelete(project, hard = false) {
  try {
    if (hard) {
      await hardDeleteProject(project.id)
    } else {
      await softDeleteProject(project.id)
    }
    handleProjectDeleted({ project, hard })
  } catch (error) {
    console.error('Error deleting project:', error)
  }
}
</script>

<style scoped>
/* Container adjustments */
.v-container {
  max-width: 1400px;
}

/* Header styling */
h1 {
  font-family: 'ITC Franklin Gothic Demi', 'Arial Black', sans-serif;
  letter-spacing: -0.02em;
}

/* Button styling */
.v-btn {
  text-transform: none;
  font-weight: 500;
  letter-spacing: 0.02em;
}

/* Responsive adjustments */
@media (max-width: 599px) {
  .d-flex {
    flex-direction: column;
    align-items: stretch !important;
  }
  
  .d-flex.ga-3 {
    gap: 8px !important;
  }
  
  h1 {
    font-size: 1.5rem !important;
  }
}
</style>