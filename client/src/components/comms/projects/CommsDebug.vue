<!-- client/src/components/comms/projects/CommsDebug.vue -->
<!-- Temporary debug component - remove after troubleshooting -->
<template>
  <v-card class="mt-4 mb-4" color="orange-lighten-5" variant="outlined">
    <v-card-title class="text-h6">
      <v-icon start color="orange">mdi-bug</v-icon>
      Debug Information
    </v-card-title>
    <v-card-text>
      <div class="debug-info">
        <h4>User Info:</h4>
        <ul>
          <li>User ID: {{ userId || 'Not logged in' }}</li>
          <li>Email: {{ userEmail || 'N/A' }}</li>
          <li>Role: {{ userRole || 'N/A' }}</li>
        </ul>

        <h4 class="mt-3">Permissions:</h4>
        <ul>
          <li>view_comms: {{ permissions.viewComms ? '✅' : '❌' }}</li>
          <li>manage_comms: {{ permissions.manageComms ? '✅' : '❌' }}</li>
          <li>view_all_regions: {{ permissions.viewAllRegions ? '✅' : '❌' }}</li>
          <li>Is Coordinator: {{ isCoordinator ? '✅' : '❌' }}</li>
          <li v-if="coordinatorRegions.length">
            Coordinator Regions: {{ coordinatorRegions.join(', ') }}
          </li>
        </ul>

        <h4 class="mt-3">Firestore Query:</h4>
        <ul>
          <li>Loading: {{ loading ? '⏳' : '✅' }}</li>
          <li>Error: {{ error || 'None' }}</li>
          <li>Raw Projects Count: {{ rawProjects.length }}</li>
          <li>Filtered Projects Count: {{ filteredProjects.length }}</li>
          <li>Viewable Regions: {{ viewableRegions || 'All' }}</li>
        </ul>

        <h4 class="mt-3">Raw Projects Data:</h4>
        <pre v-if="rawProjects.length" class="text-caption">{{ JSON.stringify(rawProjects.slice(0, 2), null, 2) }}</pre>
        <p v-else class="text-caption text-red">No projects fetched from Firestore</p>

        <v-btn
          class="mt-3"
          size="small"
          color="orange"
          @click="testDirectQuery"
        >
          Test Direct Firestore Query
        </v-btn>

        <div v-if="directQueryResult" class="mt-2">
          <strong>Direct Query Result:</strong>
          <pre class="text-caption">{{ directQueryResult }}</pre>
        </div>
      </div>
    </v-card-text>
  </v-card>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useAuthStore } from '@/stores/auth'
import { usePermissions } from '@/composables/usePermissions'
import { collection, getDocs, query, limit } from 'firebase/firestore'
import { db } from '@/firebase'

// Store and composables
const authStore = useAuthStore()
const { hasPermission, canViewAllRegions, canManageComms } = usePermissions()

// Props from parent
const props = defineProps({
  projects: Array,
  loading: Boolean,
  error: String,
  coordinatorRegions: Array,
  viewableRegions: [Array, null]
})

// State
const directQueryResult = ref('')
const rawProjects = ref([])

// Computed
const userId = computed(() => authStore.currentUser?.uid)
const userEmail = computed(() => authStore.currentUser?.email)
const userRole = computed(() => authStore.userRole)
const isCoordinator = computed(() => props.coordinatorRegions?.length > 0)

const permissions = computed(() => ({
  viewComms: hasPermission('view_comms'),
  manageComms: canManageComms.value,
  viewAllRegions: canViewAllRegions.value
}))

const filteredProjects = computed(() => props.projects || [])

// Methods
async function testDirectQuery() {
  try {
    directQueryResult.value = 'Querying...'

    const q = query(collection(db, 'comms_projects'), limit(5))
    const snapshot = await getDocs(q)

    if (snapshot.empty) {
      directQueryResult.value = 'No documents found in comms_projects collection'
    } else {
      const docs = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }))
      directQueryResult.value = `Found ${docs.length} documents:\n${JSON.stringify(docs.slice(0, 2), null, 2)}`
      rawProjects.value = docs
    }
  } catch (error) {
    directQueryResult.value = `Error: ${error.message}`
    }
}

// Lifecycle
onMounted(() => {
  })
</script>

<style scoped>
.debug-info {
  font-family: monospace;
}

.debug-info h4 {
  color: #FF6F00;
  margin-bottom: 0.5rem;
}

.debug-info ul {
  list-style: none;
  padding-left: 1rem;
}

.debug-info pre {
  background-color: #f5f5f5;
  padding: 0.5rem;
  border-radius: 4px;
  overflow-x: auto;
  max-height: 200px;
  font-size: 0.75rem;
}
</style>