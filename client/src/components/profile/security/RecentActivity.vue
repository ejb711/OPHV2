<!-- client/src/components/profile/security/RecentActivity.vue -->
<template>
  <v-card variant="outlined">
    <v-card-title class="d-flex align-center gap-2">
      <v-icon color="primary">mdi-history</v-icon>
      Recent Activity
    </v-card-title>
    
    <v-card-text>
      <v-list v-if="recentEvents.length > 0" density="compact">
        <v-list-item
          v-for="event in recentEvents"
          :key="event.id"
          class="px-0"
        >
          <template v-slot:prepend>
            <v-icon 
              :icon="getEventIcon(event.action)" 
              :color="getEventColor(event.action)"
              size="small"
            />
          </template>

          <v-list-item-title class="text-body-2">
            {{ formatEventText(event) }}
          </v-list-item-title>

          <v-list-item-subtitle class="text-caption">
            {{ formatTimestamp(event.timestamp) }}
            <span v-if="event.details?.ip" class="ms-2">
              • IP: {{ event.details.ip }}
            </span>
          </v-list-item-subtitle>
        </v-list-item>
      </v-list>

      <div v-else-if="loadingEvents" class="text-center py-8">
        <v-progress-circular
          indeterminate
          color="primary"
          size="32"
        />
      </div>

      <div v-else class="text-center py-8 text-medium-emphasis">
        <v-icon size="48" color="grey-lighten-1">mdi-history</v-icon>
        <p class="text-body-2 mt-2">No recent activity</p>
      </div>
    </v-card-text>
  </v-card>
</template>

<script setup>
defineProps({
  recentEvents: {
    type: Array,
    default: () => []
  },
  loadingEvents: {
    type: Boolean,
    default: false
  }
})

const getEventIcon = (action) => {
  const icons = {
    'user_login': 'mdi-login',
    'user_logout': 'mdi-logout',
    'password_changed': 'mdi-key-change',
    'password_reset_requested': 'mdi-email-send',
    'email_changed': 'mdi-email-edit',
    'security_settings_updated': 'mdi-shield-edit',
    'failed_login_attempt': 'mdi-alert-circle'
  }
  return icons[action] || 'mdi-information'
}

const getEventColor = (action) => {
  if (action.includes('failed') || action.includes('alert')) return 'error'
  if (action.includes('login')) return 'success'
  if (action.includes('logout')) return 'info'
  if (action.includes('changed') || action.includes('updated')) return 'primary'
  return 'grey'
}

const formatEventText = (event) => {
  const textMap = {
    'user_login': 'Logged in',
    'user_logout': 'Logged out',
    'password_changed': 'Changed password',
    'password_reset_requested': 'Requested password reset',
    'email_changed': 'Changed email address',
    'security_settings_updated': 'Updated security settings',
    'failed_login_attempt': 'Failed login attempt'
  }
  return textMap[event.action] || event.action
}

const formatTimestamp = (timestamp) => {
  if (!timestamp) return 'Unknown'
  const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp)
  const now = new Date()
  const diffInHours = (now - date) / (1000 * 60 * 60)
  
  if (diffInHours < 1) {
    const diffInMinutes = Math.floor((now - date) / (1000 * 60))
    return diffInMinutes <= 1 ? 'Just now' : `${diffInMinutes} minutes ago`
  } else if (diffInHours < 24) {
    return `${Math.floor(diffInHours)} hours ago`
  } else if (diffInHours < 168) { // 7 days
    return `${Math.floor(diffInHours / 24)} days ago`
  } else {
    return date.toLocaleDateString()
  }
}
</script>

<style scoped>
/* Card styling */
:deep(.v-card) {
  border-radius: 8px;
}

:deep(.v-card-title) {
  font-size: 1.125rem;
  font-weight: 600;
  padding: 16px;
}

/* List styling */
:deep(.v-list-item) {
  min-height: 48px;
}

:deep(.v-list-item:hover) {
  background-color: rgba(0, 0, 0, 0.04);
}
</style>