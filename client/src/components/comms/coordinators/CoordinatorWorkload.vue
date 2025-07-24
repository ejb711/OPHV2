<!-- client/src/components/comms/coordinators/CoordinatorWorkload.vue -->
<template>
  <v-card>
    <v-card-title class="d-flex align-center">
      <v-icon class="mr-2">mdi-account-group</v-icon>
      Coordinator Workload
      <v-spacer />
      <v-btn
        icon
        size="small"
        @click="refreshData"
        :loading="loading"
      >
        <v-icon>mdi-refresh</v-icon>
      </v-btn>
    </v-card-title>

    <v-card-text>
      <!-- Loading State -->
      <div v-if="loading" class="text-center py-8">
        <v-progress-circular indeterminate color="primary" />
        <p class="text-caption mt-2">Loading coordinator data...</p>
      </div>

      <!-- Empty State -->
      <div v-else-if="workloadData.length === 0" class="text-center py-8">
        <v-icon size="64" color="grey-lighten-1">mdi-account-group-outline</v-icon>
        <p class="text-h6 mt-2">No Coordinators Assigned</p>
        <p class="text-caption text-medium-emphasis">
          Coordinators will appear here once they are assigned to regions
        </p>
      </div>

      <!-- Workload List -->
      <div v-else>
        <v-list lines="two" class="pa-0">
          <template v-for="(coordinator, index) in workloadData" :key="coordinator.id">
            <v-list-item @click="selectCoordinator(coordinator)">
              <template v-slot:prepend>
                <v-avatar :color="getWorkloadColor(coordinator.workload)">
                  <span class="text-h6">{{ coordinator.workload }}</span>
                </v-avatar>
              </template>

              <v-list-item-title>
                {{ coordinator.name }}
              </v-list-item-title>
              <v-list-item-subtitle>
                <v-chip
                  v-for="regionId in coordinator.regions"
                  :key="regionId"
                  size="x-small"
                  class="mr-1"
                  :color="LOUISIANA_REGIONS[regionId]?.color"
                  variant="tonal"
                >
                  {{ LOUISIANA_REGIONS[regionId]?.name || 'Region ' + regionId }}
                </v-chip>
              </v-list-item-subtitle>

              <template v-slot:append>
                <div class="text-right">
                  <p class="text-caption mb-0">
                    <span class="text-medium-emphasis">Active:</span> 
                    {{ coordinator.activeProjects }}
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
import { ref, computed, onMounted, onUnmounted } from 'vue'
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

// State
const loading = ref(true)
const coordinators = ref([])
const detailDialog = ref(false)
const selectedCoordinator = ref(null)

// Listeners
let coordinatorsUnsubscribe = null

// Computed workload data
const workloadData = computed(() => {
  return coordinators.value.map(coord => {
    const coordProjects = props.projects.filter(p => 
      p.coordinatorId === coord.userId && !p.deleted
    )
    
    const statusBreakdown = coordProjects.reduce((acc, p) => {
      acc[p.status] = (acc[p.status] || 0) + 1
      return acc
    }, {})
    
    return {
      id: coord.userId,
      name: coord.userName || 'Unknown Coordinator',
      email: coord.userEmail || '',
      regions: coord.regions || [],
      workload: coordProjects.length,
      activeProjects: coordProjects.filter(p => 
        ['planning', 'in_progress', 'review'].includes(p.status)
      ).length,
      completedProjects: coordProjects.filter(p => p.status === 'completed').length,
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
  setTimeout(() => {
    loading.value = false
  }, 500)
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
  const q = query(collection(db, 'comms_coordinators'))
  
  coordinatorsUnsubscribe = onSnapshot(q, (snapshot) => {
    coordinators.value = snapshot.docs.map(doc => ({
      ...doc.data(),
      id: doc.id
    }))
    loading.value = false
  }, (error) => {
    console.error('Error fetching coordinators:', error)
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