<!-- client/src/components/comms/coordinators/CoordinatorWorkload.vue -->
<template>
  <v-card>
    <v-card-title>
      <v-icon class="mr-2">mdi-account-group</v-icon>
      Coordinator Workload
      <v-spacer />
      <v-btn
        icon
        variant="text"
        size="small"
        @click="refreshData"
        :loading="loading"
      >
        <v-icon>mdi-refresh</v-icon>
      </v-btn>
    </v-card-title>

    <v-card-text>
      <div v-if="loading && coordinators.length === 0" class="text-center py-8">
        <v-progress-circular indeterminate color="primary" />
        <p class="text-caption mt-2">Loading coordinators...</p>
      </div>

      <div v-else-if="workloadData.length === 0" class="text-center py-8">
        <v-icon size="48" color="grey">mdi-account-group-outline</v-icon>
        <p class="text-body-2 mt-2">No coordinators found</p>
      </div>

      <div v-else>
        <v-list lines="two">
          <template v-for="(coordinator, index) in workloadData" :key="coordinator.id">
            <v-list-item
              @click="selectCoordinator(coordinator)"
              class="px-0"
            >
              <template v-slot:prepend>
                <v-avatar :color="getWorkloadColor(coordinator.workload)" size="40">
                  <span class="text-h6">{{ coordinator.workload }}</span>
                </v-avatar>
              </template>

              <v-list-item-title>
                {{ coordinator.name }}
                <v-chip
                  v-for="regionId in coordinator.regions"
                  :key="regionId"
                  :color="LOUISIANA_REGIONS[regionId]?.color"
                  size="x-small"
                  class="ml-2"
                >
                  {{ LOUISIANA_REGIONS[regionId]?.abbreviation || `Region ${regionId}` }}
                </v-chip>
              </v-list-item-title>

              <v-list-item-subtitle>
                {{ coordinator.email }}
              </v-list-item-subtitle>

              <template v-slot:append>
                <div class="text-right">
                  <p class="text-caption mb-0">
                    <span class="text-medium-emphasis">Not Started:</span>
                    {{ coordinator.notStartedProjects }}
                  </p>
                  <p class="text-caption mb-0">
                    <span class="text-medium-emphasis">In Progress:</span>
                    {{ coordinator.inProgressProjects }}
                  </p>
                  <p class="text-caption">
                    <span class="text-medium-emphasis">Completed:</span>
                    {{ coordinator.completedProjects }}
                  </p>
                </div>
              </template>
            </v-list-item>

            <v-divider v-if="index < workloadData.length - 1" />
          </template>
        </v-list>

        <!-- Summary Stats -->
        <v-divider class="my-3" />
        <div class="d-flex justify-space-around text-center">
          <div>
            <p class="text-h6 mb-0">{{ totalCoordinators }}</p>
            <p class="text-caption text-medium-emphasis">Total Coordinators</p>
          </div>
          <v-divider vertical />
          <div>
            <p class="text-h6 mb-0">{{ avgWorkload }}</p>
            <p class="text-caption text-medium-emphasis">Avg. Projects</p>
          </div>
          <v-divider vertical />
          <div>
            <p class="text-h6 mb-0">{{ coveredRegions }}/9</p>
            <p class="text-caption text-medium-emphasis">Regions Covered</p>
          </div>
        </div>
      </div>
    </v-card-text>

    <!-- Coordinator Detail Dialog -->
    <v-dialog v-model="detailDialog" max-width="600">
      <v-card v-if="selectedCoordinator">
        <v-card-title>
          {{ selectedCoordinator.name }}
        </v-card-title>
        <v-card-text>
          <v-row>
            <v-col cols="12" sm="6">
              <p class="text-overline mb-1">Email</p>
              <p class="text-body-2">{{ selectedCoordinator.email }}</p>
            </v-col>
            <v-col cols="12" sm="6">
              <p class="text-overline mb-1">Total Projects</p>
              <p class="text-body-2">{{ selectedCoordinator.workload }}</p>
            </v-col>
          </v-row>

          <p class="text-overline mb-1 mt-3">Assigned Regions</p>
          <v-chip
            v-for="regionId in selectedCoordinator.regions"
            :key="regionId"
            class="mr-2 mb-2"
            :color="LOUISIANA_REGIONS[regionId]?.color"
          >
            {{ LOUISIANA_REGIONS[regionId]?.name }}
          </v-chip>

          <p class="text-overline mb-1 mt-3">Project Breakdown</p>
          <v-table density="compact">
            <thead>
              <tr>
                <th>Status</th>
                <th class="text-right">Count</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="(count, status) in selectedCoordinator.statusBreakdown" :key="status">
                <td>{{ formatStatus(status) }}</td>
                <td class="text-right">{{ count }}</td>
              </tr>
            </tbody>
          </v-table>
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn @click="detailDialog = false" variant="text">Close</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </v-card>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted, watch } from 'vue'
import { collection, query, onSnapshot } from 'firebase/firestore'
import { db } from '@/firebase'
import { LOUISIANA_REGIONS } from '@/config/louisiana-regions'

// Props
const props = defineProps({
  projects: {
    type: Array,
    default: () => []
  }
})

// Debug props
watch(() => props.projects, (newProjects) => {
  // Projects changed
}, { immediate: true })

// State
const loading = ref(true)
const coordinators = ref([])
const detailDialog = ref(false)
const selectedCoordinator = ref(null)

// Listeners
let coordinatorsUnsubscribe = null

// Helper function to calculate status based on stages
const calculateProjectStatus = (project) => {
  if (!project) return 'unknown'

  // First check if project has an explicit status set
  if (project.status) {
    return project.status
  }

  // If no explicit status, calculate based on stages
  if (!project.stages || project.stages.length === 0) {
    return 'not_started'
  }

  // Count completed stages
  const completedCount = project.stages.filter(s => s.completed).length

  // All completed
  if (completedCount === project.stages.length) {
    return 'completed'
  }

  // None completed
  if (completedCount === 0) {
    return 'not_started'
  }

  // Some completed - in progress
  return 'in_progress'
}

// Computed workload data
const workloadData = computed(() => {
  // First, let's see all unique coordinator IDs in projects
  const projectCoordinatorIds = new Set()
  props.projects.forEach(p => {
    if (p.coordinatorId && !p.deleted) {
      projectCoordinatorIds.add(p.coordinatorId)
    }
  })

  // Now let's see all coordinator IDs we have
  const coordinatorIds = coordinators.value.map(c => ({
    userId: c.userId,
    id: c.id,
    uid: c.uid,
    name: c.userName || c.name
  }))
  return coordinators.value.map(coord => {
    // Try multiple fields for coordinator ID matching
    const possibleIds = [coord.userId, coord.id, coord.uid].filter(Boolean)

    // Add mapped IDs to handle test-coordinator-X to test-user-X mapping
    const mappedIds = [...possibleIds]
    possibleIds.forEach(id => {
      // If we have test-user-X, also check for test-coordinator-X
      if (id && id.startsWith('test-user-')) {
        const coordinatorId = id.replace('test-user-', 'test-coordinator-')
        mappedIds.push(coordinatorId)
      }
      // If we have test-coordinator-X, also check for test-user-X
      if (id && id.startsWith('test-coordinator-')) {
        const userId = id.replace('test-coordinator-', 'test-user-')
        mappedIds.push(userId)
      }
    })

    // Debug: show first few projects and their coordinator IDs
    // Skip debug logging

    const coordProjects = props.projects.filter(p => {
      const matches = mappedIds.includes(p.coordinatorId) && !p.deleted
      return matches
    })

    // Projects mapped

    // Calculate status for each project
    const statusBreakdown = coordProjects.reduce((acc, p) => {
      const status = calculateProjectStatus(p)
      acc[status] = (acc[status] || 0) + 1
      return acc
    }, {})

    // Count projects by status - use calculated status
    const notStartedProjects = coordProjects.filter(p => {
      const status = calculateProjectStatus(p)
      return status === 'not_started'
    }).length

    const inProgressProjects = coordProjects.filter(p => {
      const status = calculateProjectStatus(p)
      return status === 'in_progress' || status === 'pending_approval'
    }).length

    const completedProjects = coordProjects.filter(p => {
      const status = calculateProjectStatus(p)
      return status === 'completed'
    }).length

    return {
      id: coord.userId,
      name: coord.userName || coord.name || 'Unknown Coordinator',
      email: coord.userEmail || coord.email || '',
      regions: coord.regions || [],
      workload: coordProjects.length,
      notStartedProjects,
      inProgressProjects,
      completedProjects,
      statusBreakdown
    }
  }).sort((a, b) => b.workload - a.workload)
})

// Summary stats
const totalCoordinators = computed(() => workloadData.value.length)

const avgWorkload = computed(() => {
  if (workloadData.value.length === 0) return 0
  const total = workloadData.value.reduce((sum, c) => sum + c.workload, 0)
  return Math.round(total / workloadData.value.length)
})

const coveredRegions = computed(() => {
  const regions = new Set()
  workloadData.value.forEach(c => {
    c.regions.forEach(r => regions.add(r))
  })
  return regions.size
})

// Methods
const refreshData = () => {
  loading.value = true
  setupListener()
}

const selectCoordinator = (coordinator) => {
  selectedCoordinator.value = coordinator
  detailDialog.value = true
}

const getWorkloadColor = (workload) => {
  if (workload === 0) return 'grey'
  if (workload <= 3) return 'green'
  if (workload <= 6) return 'amber'
  return 'red'
}

const formatStatus = (status) => {
  return status.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())
}

// Set up real-time listener
const setupListener = () => {
  if (coordinatorsUnsubscribe) {
    coordinatorsUnsubscribe()
  }

  const q = query(collection(db, 'comms_coordinators'))

  coordinatorsUnsubscribe = onSnapshot(q, (snapshot) => {
    coordinators.value = snapshot.docs.map(doc => {
      const data = doc.data()
      return {
        ...data,
        id: doc.id,
        userId: data.userId || doc.id,
        userName: data.userName || data.name || 'Unknown',
        userEmail: data.userEmail || data.email || ''
      }
    })
    loading.value = false
  }, (error) => {
    loading.value = false
  })
}

// Lifecycle
onMounted(() => {
  setupListener()
})

onUnmounted(() => {
  if (coordinatorsUnsubscribe) {
    coordinatorsUnsubscribe()
  }
})
</script>