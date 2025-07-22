<!-- client/src/components/comms/CommsDebug.vue -->
<!-- Temporary debug component to test project loading -->
<template>
  <v-card class="ma-4">
    <v-card-title>Communications Debug Panel</v-card-title>
    <v-card-text>
      <!-- Auth Info -->
      <div class="mb-4">
        <h4>Authentication Status</h4>
        <pre>{{ authInfo }}</pre>
      </div>

      <!-- Permission Info -->
      <div class="mb-4">
        <h4>Permissions</h4>
        <pre>{{ permissionInfo }}</pre>
      </div>

      <!-- Direct Query Test -->
      <div class="mb-4">
        <h4>Direct Query Test</h4>
        <v-btn @click="testDirectQuery" color="primary" size="small">
          Run Direct Query
        </v-btn>
        <pre class="mt-2">{{ directQueryResult }}</pre>
      </div>

      <!-- Projects from Composable -->
      <div class="mb-4">
        <h4>Projects from Composable</h4>
        <p>Loading: {{ loading }}</p>
        <p>Error: {{ error || 'None' }}</p>
        <p>Total Projects: {{ projects?.length || 0 }}</p>
        <p>Visible Projects: {{ visibleProjects?.length || 0 }}</p>
      </div>

      <!-- Raw Project Data -->
      <div v-if="visibleProjects?.length > 0">
        <h4>First Project (Raw)</h4>
        <pre>{{ JSON.stringify(visibleProjects[0], null, 2) }}</pre>
      </div>
    </v-card-text>
  </v-card>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useAuthStore } from '@/stores/auth'
import { usePermissions } from '@/composables/usePermissions'
import { useCommsProjects } from '@/composables/comms/useCommsProjects'
import { collection, getDocs, query, limit } from 'firebase/firestore'
import { db } from '@/firebase'

// Store and composables
const authStore = useAuthStore()
const { hasPermission } = usePermissions()
const { projects, visibleProjects, loading, error } = useCommsProjects()

// State
const directQueryResult = ref('')

// Computed
const authInfo = computed(() => JSON.stringify({
  isAuthenticated: !!authStore.currentUser,
  userId: authStore.currentUser?.uid,
  email: authStore.currentUser?.email,
  role: authStore.currentUser?.role,
  isOwner: authStore.isOwner,
  isAdmin: authStore.isAdmin
}, null, 2))

const permissionInfo = computed(() => JSON.stringify({
  view_comms: hasPermission('view_comms'),
  manage_comms: hasPermission('manage_comms'),
  view_all_regions: hasPermission('view_all_regions')
}, null, 2))

// Methods
async function testDirectQuery() {
  try {
    directQueryResult.value = 'Querying...'
    
    const q = query(collection(db, 'comms_projects'), limit(5))
    const snapshot = await getDocs(q)
    
    if (snapshot.empty) {
      directQueryResult.value = 'No documents found'
    } else {
      const docs = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }))
      directQueryResult.value = `Found ${snapshot.size} documents:\n${JSON.stringify(docs[0], null, 2)}`
    }
  } catch (error) {
    directQueryResult.value = `Error: ${error.message}`
  }
}

// Lifecycle
onMounted(() => {
  console.log('CommsDebug mounted')
  console.log('Auth store:', authStore)
  console.log('Projects:', projects.value)
  console.log('Visible projects:', visibleProjects.value)
})
</script>