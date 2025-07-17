<!-- client/src/views/AdminView.vue - Simplified version without cloud functions -->
<script setup>
import { ref, onMounted, computed } from 'vue'
import { useRouter } from 'vue-router'
import { db, auth } from '../firebase'
import { collection, getDocs, updateDoc, doc } from 'firebase/firestore'
import AppLayout from '../components/AppLayout.vue'
import { useAuthStore } from '../stores/auth'

const router = useRouter()
const authStore = useAuthStore()

/* ---------- state ---------- */
const pendingUsers = ref([])
const allUsers = ref([])
const loading = ref(true)
const error = ref('')

/* ---------- computed ---------- */
const userStats = computed(() => {
  const stats = {
    total: allUsers.value.length,
    pending: allUsers.value.filter(u => u.role === 'pending').length,
    active: allUsers.value.filter(u => u.role !== 'pending').length,
    admins: allUsers.value.filter(u => ['admin', 'owner'].includes(u.role)).length
  }
  return stats
})

const isOwner = computed(() => authStore.role === 'owner')
const isAdmin = computed(() => ['admin', 'owner'].includes(authStore.role))

/* ---------- lifecycle ---------- */
onMounted(async () => {
  await loadData()
})

/* ---------- data loading ---------- */
async function loadData() {
  try {
    loading.value = true
    
    // Wait for fresh token with custom claims
    await auth.currentUser.getIdToken(true)
    
    // Load all users
    const usersSnap = await getDocs(collection(db, 'users'))
    allUsers.value = usersSnap.docs.map(d => ({ id: d.id, ...d.data() }))
    
    // Filter pending users
    pendingUsers.value = allUsers.value.filter(u => u.role === 'pending')
    
  } catch (err) {
    console.error('Error loading admin data:', err)
    error.value = err.message
  } finally {
    loading.value = false
  }
}

/* ---------- user management ---------- */
async function approveUser(user, newRole = 'user') {
  try {
    await updateDoc(doc(db, 'users', user.id), { role: newRole })
    
    // Remove from pending list
    pendingUsers.value = pendingUsers.value.filter(u => u.id !== user.id)
    
    // Update in all users list
    const userIndex = allUsers.value.findIndex(u => u.id === user.id)
    if (userIndex !== -1) {
      allUsers.value[userIndex].role = newRole
    }
    
  } catch (err) {
    console.error('Error approving user:', err)
    error.value = err.message
  }
}

/* ---------- helpers ---------- */
function getRoleBadgeColor(role) {
  switch (role) {
    case 'owner': return 'purple'
    case 'admin': return 'red'
    case 'user': return 'blue'
    case 'viewer': return 'green'
    case 'pending': return 'orange'
    default: return 'grey'
  }
}

function formatDate(timestamp) {
  if (!timestamp) return 'Never'
  return new Date(timestamp.toDate()).toLocaleDateString()
}
</script>

<template>
  <AppLayout>
    <template #actions>
      <v-btn color="accent" variant="flat" @click="router.push('/dash')">
        Back to Dashboard
      </v-btn>
    </template>

    <div class="d-flex justify-space-between align-center mb-6">
      <h1 class="text-h4">Admin Dashboard</h1>
      <v-btn color="primary" @click="loadData" :loading="loading">
        <v-icon start>mdi-refresh</v-icon>
        Refresh
      </v-btn>
    </div>

    <!-- Loading State -->
    <v-card v-if="loading" class="text-center pa-8">
      <v-progress-circular indeterminate size="50" />
      <div class="mt-4">Loading admin data...</div>
    </v-card>

    <!-- Error Alert -->
    <v-alert v-if="error" type="error" class="mb-4" closable @click:close="error = ''">
      {{ error }}
    </v-alert>

    <!-- Admin Dashboard Content -->
    <div v-if="!loading">
      <!-- Stats Cards -->
      <v-row class="mb-6">
        <v-col cols="12" sm="6" md="3">
          <v-card>
            <v-card-text>
              <div class="d-flex align-center">
                <div class="flex-grow-1">
                  <div class="text-h5 font-weight-bold">{{ userStats.total }}</div>
                  <div class="text-caption text-grey">Total Users</div>
                </div>
                <v-icon size="large" color="blue">mdi-account-group</v-icon>
              </div>
            </v-card-text>
          </v-card>
        </v-col>
        
        <v-col cols="12" sm="6" md="3">
          <v-card>
            <v-card-text>
              <div class="d-flex align-center">
                <div class="flex-grow-1">
                  <div class="text-h5 font-weight-bold">{{ userStats.pending }}</div>
                  <div class="text-caption text-grey">Pending Approval</div>
                </div>
                <v-icon size="large" color="orange">mdi-clock-outline</v-icon>
              </div>
            </v-card-text>
          </v-card>
        </v-col>
        
        <v-col cols="12" sm="6" md="3">
          <v-card>
            <v-card-text>
              <div class="d-flex align-center">
                <div class="flex-grow-1">
                  <div class="text-h5 font-weight-bold">{{ userStats.active }}</div>
                  <div class="text-caption text-grey">Active Users</div>
                </div>
                <v-icon size="large" color="green">mdi-account-check</v-icon>
              </div>
            </v-card-text>
          </v-card>
        </v-col>
        
        <v-col cols="12" sm="6" md="3">
          <v-card>
            <v-card-text>
              <div class="d-flex align-center">
                <div class="flex-grow-1">
                  <div class="text-h5 font-weight-bold">{{ userStats.admins }}</div>
                  <div class="text-caption text-grey">Administrators</div>
                </div>
                <v-icon size="large" color="red">mdi-shield-account</v-icon>
              </div>
            </v-card-text>
          </v-card>
        </v-col>
      </v-row>

      <!-- Pending Users Section -->
      <v-card class="mb-6">
        <v-card-title>
          <v-icon start>mdi-clock-outline</v-icon>
          Pending User Approvals
        </v-card-title>
        
        <v-card-text>
          <div v-if="pendingUsers.length === 0" class="text-center pa-4">
            <v-icon size="48" color="green">mdi-check-circle</v-icon>
            <div class="mt-2">No pending users</div>
          </div>
          
          <v-list v-else>
            <v-list-item
              v-for="user in pendingUsers"
              :key="user.id"
              class="mb-2"
            >
              <template #prepend>
                <v-avatar color="orange">
                  <v-icon>mdi-account</v-icon>
                </v-avatar>
              </template>
              
              <v-list-item-title>{{ user.email }}</v-list-item-title>
              <v-list-item-subtitle>
                Registered: {{ formatDate(user.createdAt) }}
              </v-list-item-subtitle>
              
              <template #append>
                <div class="d-flex ga-2">
                  <v-btn
                    color="blue"
                    variant="flat"
                    size="small"
                    @click="approveUser(user, 'user')"
                  >
                    Approve as User
                  </v-btn>
                  <v-btn
                    color="green"
                    variant="flat"
                    size="small"
                    @click="approveUser(user, 'viewer')"
                  >
                    Approve as Viewer
                  </v-btn>
                  <v-btn
                    v-if="isOwner"
                    color="red"
                    variant="flat"
                    size="small"
                    @click="approveUser(user, 'admin')"
                  >
                    Approve as Admin
                  </v-btn>
                </div>
              </template>
            </v-list-item>
          </v-list>
        </v-card-text>
      </v-card>

      <!-- All Users Section -->
      <v-card>
        <v-card-title>
          <v-icon start>mdi-account-group</v-icon>
          All Users
        </v-card-title>
        
        <v-card-text>
          <v-data-table
            :items="allUsers"
            :headers="[
              { title: 'Email', key: 'email' },
              { title: 'Role', key: 'role' },
              { title: 'Created', key: 'createdAt' },
              { title: 'Last Active', key: 'lastActive' }
            ]"
            item-value="id"
            density="compact"
          >
            <template #item.role="{ item }">
              <v-chip :color="getRoleBadgeColor(item.role)" size="small">
                {{ item.role }}
              </v-chip>
            </template>

            <template #item.createdAt="{ item }">
              {{ formatDate(item.createdAt) }}
            </template>

            <template #item.lastActive="{ item }">
              {{ formatDate(item.lastActive) }}
            </template>
          </v-data-table>
        </v-card-text>
      </v-card>
    </div>
  </AppLayout>
</template>