<!-- ProfileActivityTab.vue -->
<script setup>
import { ref, computed, onMounted } from 'vue'
import { collection, query, where, orderBy, limit, getDocs, startAfter } from 'firebase/firestore'
import { db } from '../../firebase'
import { useAuthStore } from '../../stores/auth'

const authStore = useAuthStore()

// State
const loading = ref(true)
const loadingMore = ref(false)
const activities = ref([])
const lastDoc = ref(null)
const hasMore = ref(true)
const pageSize = 25

// Filters
const selectedFilter = ref('all')
const selectedTimeRange = ref('30')

// Computed
const currentUser = computed(() => authStore.user)

const filteredActivities = computed(() => {
  let filtered = activities.value

  // Filter by activity type
  if (selectedFilter.value !== 'all') {
    filtered = filtered.filter(activity =>
      getActivityCategory(activity.action) === selectedFilter.value
    )
  }

  // Filter by time range
  if (selectedTimeRange.value !== 'all') {
    const days = parseInt(selectedTimeRange.value)
    const cutoff = new Date()
    cutoff.setDate(cutoff.getDate() - days)

    filtered = filtered.filter(activity => {
      const activityDate = activity.timestamp?.toDate()
      return activityDate && activityDate > cutoff
    })
  }

  return filtered
})

const activityCounts = computed(() => {
  const counts = {
    total: activities.value.length,
    profile: 0,
    projects: 0,
    forums: 0,
    calendar: 0,
    admin: 0,
    security: 0
  }

  activities.value.forEach(activity => {
    const category = getActivityCategory(activity.action)
    if (counts[category] !== undefined) {
      counts[category]++
    }
  })

  return counts
})

// Activity filters
const activityFilters = [
  { value: 'all', text: 'All Activities', icon: 'mdi-view-list' },
  { value: 'profile', text: 'Profile Changes', icon: 'mdi-account' },
  { value: 'projects', text: 'Project Activity', icon: 'mdi-folder' },
  { value: 'forums', text: 'Forum Activity', icon: 'mdi-forum' },
  { value: 'calendar', text: 'Calendar Events', icon: 'mdi-calendar' },
  { value: 'admin', text: 'Admin Actions', icon: 'mdi-shield-crown' },
  { value: 'security', text: 'Security Events', icon: 'mdi-security' }
]

const timeRanges = [
  { value: '7', text: 'Last 7 days' },
  { value: '30', text: 'Last 30 days' },
  { value: '90', text: 'Last 90 days' },
  { value: 'all', text: 'All time' }
]

// Methods
const getActivityCategory = (action) => {
  if (action.includes('profile') || action.includes('user_updated') || action.includes('settings')) {
    return 'profile'
  } else if (action.includes('project')) {
    return 'projects'
  } else if (action.includes('forum') || action.includes('post')) {
    return 'forums'
  } else if (action.includes('calendar') || action.includes('event')) {
    return 'calendar'
  } else if (action.includes('admin') || action.includes('role') || action.includes('permission')) {
    return 'admin'
  } else if (action.includes('login') || action.includes('logout') || action.includes('security') || action.includes('password')) {
    return 'security'
  }
  return 'profile'
}

const getActivityIcon = (action) => {
  const category = getActivityCategory(action)
  const icons = {
    profile: 'mdi-account-edit',
    projects: 'mdi-folder-plus',
    forums: 'mdi-message-plus',
    calendar: 'mdi-calendar-plus',
    admin: 'mdi-shield-crown',
    security: 'mdi-lock'
  }

  // Specific action icons
  if (action.includes('login')) return 'mdi-login'
  if (action.includes('logout')) return 'mdi-logout'
  if (action.includes('delete')) return 'mdi-delete'
  if (action.includes('create')) return 'mdi-plus'
  if (action.includes('edit') || action.includes('update')) return 'mdi-pencil'
  if (action.includes('view')) return 'mdi-eye'

  return icons[category] || 'mdi-information'
}

const getActivityColor = (action) => {
  if (action.includes('delete')) return 'error'
  if (action.includes('create')) return 'success'
  if (action.includes('login')) return 'info'
  if (action.includes('logout')) return 'warning'
  if (action.includes('security') || action.includes('password')) return 'orange'
  return 'primary'
}

const formatActivityText = (activity) => {
  const actionMap = {
    'user_login': 'Logged into the system',
    'user_logout': 'Logged out of the system',
    'profile_updated': 'Updated profile information',
    'profile_viewed': 'Viewed profile page',
    'settings_updated': 'Changed account settings',
    'password_changed': 'Changed account password',
    'project_created': 'Created a new project',
    'project_updated': 'Updated a project',
    'project_viewed': 'Viewed a project',
    'forum_post_created': 'Created a forum post',
    'forum_post_updated': 'Updated a forum post',
    'event_created': 'Created a calendar event',
    'event_updated': 'Updated a calendar event',
    'admin_panel_accessed': 'Accessed admin panel',
    'role_changed': 'Role was changed',
    'permissions_updated': 'Permissions were updated'
  }

  let text = actionMap[activity.action] || activity.action.replace(/_/g, ' ')

  // Add details if available
  if (activity.details?.targetName) {
    text += ` (${activity.details.targetName})`
  } else if (activity.details?.projectName) {
    text += ` (${activity.details.projectName})`
  } else if (activity.details?.eventTitle) {
    text += ` (${activity.details.eventTitle})`
  }

  return text
}

const formatDate = (timestamp) => {
  if (!timestamp) return 'Unknown time'

  const date = timestamp.toDate()
  const now = new Date()
  const diffMs = now - date
  const diffMins = Math.floor(diffMs / (1000 * 60))
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60))
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))

  if (diffMins < 1) return 'Just now'
  if (diffMins < 60) return `${diffMins} minute${diffMins !== 1 ? 's' : ''} ago`
  if (diffHours < 24) return `${diffHours} hour${diffHours !== 1 ? 's' : ''} ago`
  if (diffDays < 7) return `${diffDays} day${diffDays !== 1 ? 's' : ''} ago`

  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}

const loadActivities = async (loadMore = false) => {
  if (!currentUser.value) return

  if (!loadMore) {
    loading.value = true
    activities.value = []
    lastDoc.value = null
    hasMore.value = true
  } else {
    loadingMore.value = true
  }

  try {
    let q = query(
      collection(db, 'audit_logs'),
      where('userId', '==', currentUser.value.uid),
      orderBy('timestamp', 'desc'),
      limit(pageSize)
    )

    if (loadMore && lastDoc.value) {
      q = query(
        collection(db, 'audit_logs'),
        where('userId', '==', currentUser.value.uid),
        orderBy('timestamp', 'desc'),
        startAfter(lastDoc.value),
        limit(pageSize)
      )
    }

    const snapshot = await getDocs(q)

    if (snapshot.empty) {
      hasMore.value = false
      return
    }

    const newActivities = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }))

    if (loadMore) {
      activities.value.push(...newActivities)
    } else {
      activities.value = newActivities
    }

    lastDoc.value = snapshot.docs[snapshot.docs.length - 1]
    hasMore.value = snapshot.docs.length === pageSize

  } catch (error) {
    } finally {
    loading.value = false
    loadingMore.value = false
  }
}

const refreshActivities = () => {
  loadActivities(false)
}

const exportActivities = () => {
  // Create CSV content
  const headers = ['Date', 'Action', 'Details', 'IP Address']
  const rows = filteredActivities.value.map(activity => [
    formatDate(activity.timestamp),
    formatActivityText(activity),
    JSON.stringify(activity.details || {}),
    activity.details?.ip || 'N/A'
  ])

  const csvContent = [headers, ...rows]
    .map(row => row.map(cell => `"${cell}"`).join(','))
    .join('\n')

  // Download file
  const blob = new Blob([csvContent], { type: 'text/csv' })
  const url = window.URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `activity-history-${new Date().toISOString().split('T')[0]}.csv`
  a.click()
  window.URL.revokeObjectURL(url)
}

onMounted(() => {
  loadActivities()
})
</script>

<template>
  <div class="profile-activity">
    <div class="d-flex justify-space-between align-center mb-4">
      <div>
        <h2 class="text-h5 font-weight-bold">Activity History</h2>
        <p class="text-body-1 text-medium-emphasis">
          Track your account activity and system interactions
        </p>
      </div>
      <v-btn
        variant="outlined"
        size="small"
        @click="exportActivities"
        :disabled="filteredActivities.length === 0"
      >
        <v-icon left>mdi-download</v-icon>
        Export
      </v-btn>
    </div>

    <!-- Activity Stats -->
    <v-row class="mb-6">
      <v-col cols="6" sm="4" md="2" v-for="(count, key) in activityCounts" :key="key">
        <v-card variant="outlined" class="text-center pa-3">
          <div class="text-h6 font-weight-bold">{{ count }}</div>
          <div class="text-caption text-medium-emphasis">
            {{ key === 'total' ? 'Total' : key.charAt(0).toUpperCase() + key.slice(1) }}
          </div>
        </v-card>
      </v-col>
    </v-row>

    <!-- Filters -->
    <v-card variant="outlined" class="mb-6">
      <v-card-text>
        <v-row align="center">
          <v-col cols="12" md="6">
            <v-select
              v-model="selectedFilter"
              :items="activityFilters"
              label="Filter by Activity Type"
              variant="outlined"
              density="compact"
              item-title="text"
              item-value="value"
            >
              <template #prepend-item>
                <v-list-item
                  v-for="filter in activityFilters"
                  :key="filter.value"
                  :value="filter.value"
                  @click="selectedFilter = filter.value"
                >
                  <template #prepend>
                    <v-icon>{{ filter.icon }}</v-icon>
                  </template>
                  <v-list-item-title>{{ filter.text }}</v-list-item-title>
                </v-list-item>
              </template>
            </v-select>
          </v-col>
          <v-col cols="12" md="4">
            <v-select
              v-model="selectedTimeRange"
              :items="timeRanges"
              label="Time Range"
              variant="outlined"
              density="compact"
              item-title="text"
              item-value="value"
            />
          </v-col>
          <v-col cols="12" md="2">
            <v-btn
              variant="outlined"
              block
              @click="refreshActivities"
              :loading="loading"
            >
              <v-icon left>mdi-refresh</v-icon>
              Refresh
            </v-btn>
          </v-col>
        </v-row>
      </v-card-text>
    </v-card>

    <!-- Loading State -->
    <div v-if="loading" class="text-center py-8">
      <v-progress-circular indeterminate size="64" color="primary" />
      <p class="mt-4 text-body-1">Loading activity history...</p>
    </div>

    <!-- Empty State -->
    <div v-else-if="filteredActivities.length === 0" class="text-center py-8">
      <v-icon size="64" color="grey">mdi-history</v-icon>
      <h3 class="text-h6 mt-4">No Activity Found</h3>
      <p class="text-body-1 text-medium-emphasis">
        {{ selectedFilter !== 'all' || selectedTimeRange !== 'all'
           ? 'Try adjusting your filters to see more activities.'
           : 'Your activity history will appear here as you use the system.' }}
      </p>
    </div>

    <!-- Activity Timeline -->
    <div v-else>
      <v-timeline>
        <v-timeline-item
          v-for="activity in filteredActivities"
          :key="activity.id"
          :dot-color="getActivityColor(activity.action)"
          size="small"
        >
          <template #icon>
            <v-icon size="16">{{ getActivityIcon(activity.action) }}</v-icon>
          </template>

          <v-card variant="outlined" class="mb-3">
            <v-card-text>
              <div class="d-flex justify-space-between align-start">
                <div class="flex-grow-1">
                  <div class="text-body-1 font-weight-medium">
                    {{ formatActivityText(activity) }}
                  </div>

                  <!-- Activity Details -->
                  <div v-if="activity.details && Object.keys(activity.details).length > 0" class="mt-2">
                    <v-chip
                      v-if="activity.details.ip"
                      size="x-small"
                      variant="outlined"
                      class="mr-2 mb-1"
                    >
                      <v-icon left size="12">mdi-web</v-icon>
                      {{ activity.details.ip }}
                    </v-chip>

                    <v-chip
                      v-if="activity.details.userAgent"
                      size="x-small"
                      variant="outlined"
                      class="mr-2 mb-1"
                    >
                      <v-icon left size="12">mdi-devices</v-icon>
                      {{ activity.details.userAgent.split(' ')[0] }}
                    </v-chip>

                    <v-chip
                      v-if="activity.details.location"
                      size="x-small"
                      variant="outlined"
                      class="mr-2 mb-1"
                    >
                      <v-icon left size="12">mdi-map-marker</v-icon>
                      {{ activity.details.location }}
                    </v-chip>
                  </div>
                </div>

                <div class="text-caption text-medium-emphasis ml-4">
                  {{ formatDate(activity.timestamp) }}
                </div>
              </div>
            </v-card-text>
          </v-card>
        </v-timeline-item>
      </v-timeline>

      <!-- Load More Button -->
      <div v-if="hasMore" class="text-center mt-4">
        <v-btn
          variant="outlined"
          @click="loadActivities(true)"
          :loading="loadingMore"
        >
          Load More Activities
        </v-btn>
      </div>

      <!-- End of Activities Message -->
      <div v-else class="text-center mt-4">
        <p class="text-body-2 text-medium-emphasis">
          You've reached the end of your activity history
        </p>
      </div>
    </div>
  </div>
</template>

<style scoped>
.profile-activity h2 {
  font-family: 'ITC Franklin Gothic', Arial, sans-serif;
}

.v-card-title {
  font-family: 'ITC Franklin Gothic', Arial, sans-serif;
}

.v-card-text {
  font-family: 'Cambria', Georgia, serif;
}
</style>