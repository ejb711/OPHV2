<!-- client/src/components/admin/SystemLogs.vue - Enhanced with filtering, search, and export -->
<script setup>
import { ref, onMounted, computed, watch, onUnmounted } from 'vue'
import { collection, query, orderBy, where, limit, startAfter, onSnapshot, getDocs } from 'firebase/firestore'
import { db } from '../../firebase'
import { useAuthStore } from '../../stores/auth'

const authStore = useAuthStore()

/* ---------- state ---------- */
const logs = ref([])
const filteredLogs = ref([])
const loading = ref(true)
const searching = ref(false)
const exporting = ref(false)

// Filters
const filters = ref({
  dateRange: {
    start: null,
    end: null
  },
  action: '',
  user: '',
  search: ''
})

// Pagination
const pagination = ref({
  page: 1,
  itemsPerPage: 25,
  total: 0
})

// Filter options
const actionTypes = ref([])
const userEmails = ref([])

let unsubscribe = null

/* ---------- computed ---------- */
const paginatedLogs = computed(() => {
  const start = (pagination.value.page - 1) * pagination.value.itemsPerPage
  const end = start + pagination.value.itemsPerPage
  return filteredLogs.value.slice(start, end)
})

const totalPages = computed(() => 
  Math.ceil(filteredLogs.value.length / pagination.value.itemsPerPage)
)

const availableActions = computed(() => {
  const actions = [...new Set(logs.value.map(log => log.action))]
  return actions.sort()
})

const availableUsers = computed(() => {
  const users = [...new Set(logs.value.map(log => log.userEmail))]
  return users.filter(user => user && user !== 'unknown').sort()
})

/* ---------- watchers ---------- */
watch([
  () => filters.value.action,
  () => filters.value.user,
  () => filters.value.search,
  () => filters.value.dateRange
], () => {
  applyFilters()
  pagination.value.page = 1 // Reset to first page when filtering
}, { deep: true })

/* ---------- lifecycle ---------- */
onMounted(() => {
  setupRealtimeListener()
})

onUnmounted(() => {
  if (unsubscribe) unsubscribe()
})

/* ---------- data loading ---------- */
function setupRealtimeListener() {
  // Get more comprehensive logs (last 1000 records)
  const q = query(
    collection(db, 'audit_logs'),
    orderBy('timestamp', 'desc'),
    limit(1000)
  )
  
  unsubscribe = onSnapshot(q, (snapshot) => {
    logs.value = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      timestamp: doc.data().timestamp?.toDate() || new Date()
    }))
    
    // Apply current filters
    applyFilters()
    loading.value = false
  })
}

/* ---------- filtering ---------- */
function applyFilters() {
  searching.value = true
  
  let filtered = [...logs.value]
  
  // Date range filter
  if (filters.value.dateRange.start) {
    const startDate = new Date(filters.value.dateRange.start)
    startDate.setHours(0, 0, 0, 0)
    filtered = filtered.filter(log => log.timestamp >= startDate)
  }
  
  if (filters.value.dateRange.end) {
    const endDate = new Date(filters.value.dateRange.end)
    endDate.setHours(23, 59, 59, 999)
    filtered = filtered.filter(log => log.timestamp <= endDate)
  }
  
  // Action filter
  if (filters.value.action) {
    filtered = filtered.filter(log => log.action === filters.value.action)
  }
  
  // User filter
  if (filters.value.user) {
    filtered = filtered.filter(log => log.userEmail === filters.value.user)
  }
  
  // Search filter (searches action, user email, and details)
  if (filters.value.search) {
    const searchTerm = filters.value.search.toLowerCase()
    filtered = filtered.filter(log => {
      const action = log.action.toLowerCase()
      const email = (log.userEmail || '').toLowerCase()
      const details = JSON.stringify(log.details || {}).toLowerCase()
      
      return action.includes(searchTerm) || 
             email.includes(searchTerm) || 
             details.includes(searchTerm)
    })
  }
  
  filteredLogs.value = filtered
  pagination.value.total = filtered.length
  searching.value = false
}

function clearFilters() {
  filters.value = {
    dateRange: { start: null, end: null },
    action: '',
    user: '',
    search: ''
  }
}

function setQuickDateFilter(days) {
  const end = new Date()
  const start = new Date()
  start.setDate(start.getDate() - days)
  
  filters.value.dateRange = {
    start: start.toISOString().split('T')[0],
    end: end.toISOString().split('T')[0]
  }
}

/* ---------- export ---------- */
async function exportToCSV() {
  exporting.value = true
  
  try {
    // Use filtered logs for export
    const dataToExport = filteredLogs.value.map(log => ({
      timestamp: formatDateForExport(log.timestamp),
      action: log.action,
      user_email: log.userEmail,
      user_id: log.userId,
      details: JSON.stringify(log.details || {})
    }))
    
    // Create CSV content
    const headers = ['Timestamp', 'Action', 'User Email', 'User ID', 'Details']
    const csvContent = [
      headers.join(','),
      ...dataToExport.map(row => [
        `"${row.timestamp}"`,
        `"${row.action}"`,
        `"${row.user_email}"`,
        `"${row.user_id}"`,
        `"${row.details.replace(/"/g, '""')}"` // Escape quotes in JSON
      ].join(','))
    ].join('\n')
    
    // Download file
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    const url = URL.createObjectURL(blob)
    link.setAttribute('href', url)
    link.setAttribute('download', `ophv2_audit_logs_${new Date().toISOString().split('T')[0]}.csv`)
    link.style.visibility = 'hidden'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    
  } catch (error) {
    console.error('Export failed:', error)
    // You might want to show a snackbar or alert here
  } finally {
    exporting.value = false
  }
}

/* ---------- formatting ---------- */
function formatDate(date) {
  return new Date(date).toLocaleString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  })
}

function formatDateForExport(date) {
  return new Date(date).toISOString()
}

function formatAction(action) {
  return action.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())
}

function formatDetails(details) {
  if (!details || Object.keys(details).length === 0) return 'No details'
  
  // Create a more readable format for details
  const formatted = Object.entries(details)
    .map(([key, value]) => {
      if (typeof value === 'object') {
        return `${key}: ${JSON.stringify(value)}`
      }
      return `${key}: ${value}`
    })
    .join(', ')
  
  return formatted.length > 100 ? formatted.substring(0, 100) + '...' : formatted
}

const actionIcons = {
  user_updated: 'mdi-account-edit',
  user_deleted: 'mdi-account-remove',
  user_created: 'mdi-account-plus',
  role_changed: 'mdi-shield-refresh',
  permission_granted: 'mdi-key-plus',
  permission_revoked: 'mdi-key-minus',
  bulk_operation: 'mdi-account-multiple-check',
  admin_tab_viewed: 'mdi-eye',
  user_login: 'mdi-login',
  user_logout: 'mdi-logout',
  security_alert: 'mdi-alert',
  system_error: 'mdi-alert-circle',
  default: 'mdi-history'
}

function getActionIcon(action) {
  return actionIcons[action] || actionIcons.default
}

function getActionColor(action) {
  const colorMap = {
    user_deleted: 'error',
    security_alert: 'error',
    system_error: 'error',
    user_created: 'success',
    permission_granted: 'success',
    user_login: 'success',
    user_updated: 'warning',
    role_changed: 'warning',
    permission_revoked: 'warning',
    default: 'primary'
  }
  return colorMap[action] || colorMap.default
}
</script>

<template>
  <div class="pa-4">
    <!-- Header with Export Button -->
    <v-row class="mb-4" align="center">
      <v-col>
        <h2 class="text-h5 font-weight-bold">System Activity Logs</h2>
        <p class="text-body-2 text-medium-emphasis">
          View and analyze system activity with advanced filtering and export capabilities
        </p>
      </v-col>
      <v-col cols="auto">
        <v-btn
          color="primary"
          variant="outlined"
          prepend-icon="mdi-download"
          :loading="exporting"
          :disabled="filteredLogs.length === 0"
          @click="exportToCSV"
        >
          Export CSV
        </v-btn>
      </v-col>
    </v-row>

    <!-- Filters Section -->
    <v-card class="mb-4" elevation="2">
      <v-card-title class="pb-2">
        <v-icon class="me-2">mdi-filter</v-icon>
        Filters
      </v-card-title>
      
      <v-card-text>
        <v-row>
          <!-- Search -->
          <v-col cols="12" md="6">
            <v-text-field
              v-model="filters.search"
              label="Search actions, users, or details"
              prepend-inner-icon="mdi-magnify"
              variant="outlined"
              density="compact"
              clearable
              hide-details
            />
          </v-col>

          <!-- Action Filter -->
          <v-col cols="12" md="3">
            <v-select
              v-model="filters.action"
              :items="availableActions"
              label="Action Type"
              variant="outlined"
              density="compact"
              clearable
              hide-details
            >
              <template v-slot:item="{ props, item }">
                <v-list-item v-bind="props">
                  <template v-slot:prepend>
                    <v-icon :icon="getActionIcon(item.value)" size="small" />
                  </template>
                  <v-list-item-title>{{ formatAction(item.value) }}</v-list-item-title>
                </v-list-item>
              </template>
            </v-select>
          </v-col>

          <!-- User Filter -->
          <v-col cols="12" md="3">
            <v-select
              v-model="filters.user"
              :items="availableUsers"
              label="User"
              variant="outlined"
              density="compact"
              clearable
              hide-details
            />
          </v-col>

          <!-- Date Range -->
          <v-col cols="12" md="3">
            <v-text-field
              v-model="filters.dateRange.start"
              label="Start Date"
              type="date"
              variant="outlined"
              density="compact"
              hide-details
            />
          </v-col>

          <v-col cols="12" md="3">
            <v-text-field
              v-model="filters.dateRange.end"
              label="End Date"
              type="date"
              variant="outlined"
              density="compact"
              hide-details
            />
          </v-col>

          <!-- Quick Date Filters -->
          <v-col cols="12" md="6">
            <v-btn-group density="compact" variant="outlined">
              <v-btn size="small" @click="setQuickDateFilter(1)">Today</v-btn>
              <v-btn size="small" @click="setQuickDateFilter(7)">7 Days</v-btn>
              <v-btn size="small" @click="setQuickDateFilter(30)">30 Days</v-btn>
              <v-btn size="small" @click="clearFilters">Clear All</v-btn>
            </v-btn-group>
          </v-col>
        </v-row>

        <!-- Results Summary -->
        <v-row class="mt-2" v-if="!loading">
          <v-col>
            <v-chip size="small" color="primary" variant="outlined">
              {{ filteredLogs.length }} of {{ logs.length }} logs
            </v-chip>
            <v-chip v-if="searching" size="small" color="warning" variant="outlined" class="ms-2">
              <v-progress-circular size="12" width="2" indeterminate class="me-1" />
              Filtering...
            </v-chip>
          </v-col>
        </v-row>
      </v-card-text>
    </v-card>

    <!-- Logs Table -->
    <v-card elevation="2">
      <v-data-table
        :headers="[
          { title: 'Action', key: 'action', sortable: true },
          { title: 'User', key: 'userEmail', sortable: true },
          { title: 'Details', key: 'details', sortable: false },
          { title: 'Timestamp', key: 'timestamp', sortable: true }
        ]"
        :items="filteredLogs"
        :loading="loading"
        :items-per-page="pagination.itemsPerPage"
        :page="pagination.page"
        @update:page="pagination.page = $event"
        @update:items-per-page="pagination.itemsPerPage = $event"
        class="elevation-0"
        hover
      >
        <!-- Action Column -->
        <template v-slot:item.action="{ item }">
          <div class="d-flex align-center">
            <v-avatar size="32" :color="getActionColor(item.action)" class="me-3">
              <v-icon color="white" size="18">{{ getActionIcon(item.action) }}</v-icon>
            </v-avatar>
            <div>
              <div class="font-weight-medium">{{ formatAction(item.action) }}</div>
              <div class="text-caption text-medium-emphasis">{{ item.action }}</div>
            </div>
          </div>
        </template>

        <!-- User Column -->
        <template v-slot:item.userEmail="{ item }">
          <div>
            <div class="font-weight-medium">{{ item.userEmail }}</div>
            <div class="text-caption text-medium-emphasis">{{ item.userId }}</div>
          </div>
        </template>

        <!-- Details Column -->
        <template v-slot:item.details="{ item }">
          <div class="text-caption">
            {{ formatDetails(item.details) }}
          </div>
        </template>

        <!-- Timestamp Column -->
        <template v-slot:item.timestamp="{ item }">
          <div>
            <div class="font-weight-medium">{{ formatDate(item.timestamp) }}</div>
            <div class="text-caption text-medium-emphasis">
              {{ new Date(item.timestamp).toLocaleDateString() }}
            </div>
          </div>
        </template>

        <!-- Loading State -->
        <template v-slot:loading>
          <v-skeleton-loader type="table-row@10" />
        </template>

        <!-- No Data State -->
        <template v-slot:no-data>
          <div class="text-center pa-8">
            <v-icon size="64" color="grey-lighten-1">mdi-database-search</v-icon>
            <p class="text-h6 mt-4">No logs found</p>
            <p class="text-body-2 text-medium-emphasis">
              Try adjusting your filters or check back later
            </p>
          </div>
        </template>
      </v-data-table>
    </v-card>

    <!-- Summary Stats Card -->
    <v-card class="mt-4" elevation="2" v-if="!loading && filteredLogs.length > 0">
      <v-card-title>Quick Stats</v-card-title>
      <v-card-text>
        <v-row>
          <v-col cols="6" md="3" class="text-center">
            <div class="text-h5 font-weight-bold text-primary">
              {{ filteredLogs.length }}
            </div>
            <div class="text-caption">Total Events</div>
          </v-col>
          
          <v-col cols="6" md="3" class="text-center">
            <div class="text-h5 font-weight-bold text-success">
              {{ [...new Set(filteredLogs.map(l => l.userEmail))].length }}
            </div>
            <div class="text-caption">Unique Users</div>
          </v-col>
          
          <v-col cols="6" md="3" class="text-center">
            <div class="text-h5 font-weight-bold text-warning">
              {{ [...new Set(filteredLogs.map(l => l.action))].length }}
            </div>
            <div class="text-caption">Action Types</div>
          </v-col>
          
          <v-col cols="6" md="3" class="text-center">
            <div class="text-h5 font-weight-bold text-info">
              {{ filteredLogs.filter(l => 
                new Date(l.timestamp) > new Date(Date.now() - 24*60*60*1000)
              ).length }}
            </div>
            <div class="text-caption">Last 24h</div>
          </v-col>
        </v-row>
      </v-card-text>
    </v-card>
  </div>
</template>

<style scoped>
.v-data-table {
  font-size: 0.875rem;
}

.v-data-table :deep(.v-data-table__td) {
  padding: 8px 16px;
}

.v-data-table :deep(.v-data-table__th) {
  padding: 12px 16px;
  font-weight: 600;
}
</style>