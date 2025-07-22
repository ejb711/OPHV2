<!-- client/src/components/comms/CommsDashboard.vue -->
<template>
  <v-container fluid class="pa-4">
    <!-- Dashboard Header -->
    <v-row>
      <v-col cols="12">
        <div class="d-flex align-center justify-space-between mb-6">
          <div>
            <h1 class="text-h4 font-weight-bold text-primary">
              Communications Dashboard
            </h1>
            <p class="text-body-1 text-medium-emphasis mt-1">
              Manage communications projects across Louisiana's 9 health regions
            </p>
          </div>
          
          <!-- Quick Actions -->
          <div v-if="canCreateProjects" class="d-flex gap-2">
            <v-btn
              color="primary"
              prepend-icon="mdi-plus"
              variant="flat"
              @click="showCreateDialog = true"
            >
              New Project
            </v-btn>
            <v-btn
              variant="outlined"
              prepend-icon="mdi-download"
              disabled
            >
              Export
            </v-btn>
          </div>
        </div>
      </v-col>
    </v-row>

    <!-- Statistics Overview -->
    <v-row>
      <v-col cols="12">
        <CommsStats :stats="projectStats" />
      </v-col>
    </v-row>

    <!-- Filters and Search -->
    <v-row class="mt-4">
      <v-col cols="12">
        <CommsFilters 
          :filters="filters"
          @update:filters="handleFilterUpdate"
        />
      </v-col>
    </v-row>

    <!-- Main Content Area - Project List -->
    <v-row class="mt-4">
      <v-col cols="12">
        <ProjectList 
          :filters="filters"
          @select="handleProjectSelect"
          @stats-update="handleStatsUpdate"
        />
      </v-col>
    </v-row>

    <!-- Create Project Dialog -->
    <ProjectForm 
      v-model="showCreateDialog"
      @created="handleProjectCreated"
    />

    <!-- Project Detail Dialog -->
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
import { ref, computed, shallowRef, nextTick } from 'vue'
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

// State - Use shallowRef for objects that don't need deep reactivity
const showCreateDialog = ref(false)
const projectDetailRef = ref(null)
const deleteSnackbar = ref(false)
const deleteHard = ref(false)

// Use shallowRef for filters and stats to prevent deep reactivity issues
const filters = shallowRef({
  region: null,
  status: null,
  priority: null,
  search: ''
})

const projectStats = shallowRef({
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
  // Create a new object reference to trigger updates
  filters.value = {
    region: newFilters.region,
    status: newFilters.status,
    priority: newFilters.priority,
    search: newFilters.search
  }
}

function handleProjectSelect(project) {
  console.log('Project selected:', project)
  if (projectDetailRef.value) {
    projectDetailRef.value.open(project.id)
  }
}

async function handleStatsUpdate(stats) {
  // Use nextTick to ensure update happens after current cycle
  await nextTick()
  
  // Only update if stats actually changed to prevent loops
  const currentStatsString = JSON.stringify(projectStats.value)
  const newStatsString = JSON.stringify(stats)
  
  if (currentStatsString !== newStatsString) {
    // Create a new object reference
    projectStats.value = {
      total: stats.total || 0,
      byStatus: { ...(stats.byStatus || {}) },
      byPriority: { ...(stats.byPriority || {}) },
      byRegion: { ...(stats.byRegion || {}) }
    }
  }
}

async function handleProjectCreated(projectData) {
  try {
    await createProject(projectData)
    // Dialog will close automatically on success
  } catch (error) {
    console.error('Failed to create project:', error)
    // Error is already shown by the composable
  }
}

function handleProjectUpdated(project) {
  console.log('Project updated:', project)
  // The list will auto-update due to Firestore listeners
}

async function handleProjectDeleted(project, hard) {
  try {
    // Use project.id to ensure we're passing the correct ID
    const projectId = project?.id
    if (!projectId) {
      console.error('No project ID provided for deletion')
      return
    }
    
    console.log(`Deleting project ${projectId} (${hard ? 'hard' : 'soft'} delete)`)
    
    if (hard) {
      await hardDeleteProject(projectId)
    } else {
      await softDeleteProject(projectId)
    }
    deleteHard.value = hard
    deleteSnackbar.value = true
  } catch (error) {
    console.error('Failed to delete project:', error)
  }
}
</script>

<style scoped>
/* No custom styles needed */
</style>