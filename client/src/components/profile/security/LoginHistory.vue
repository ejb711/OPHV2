<!-- client/src/components/profile/security/LoginHistory.vue -->
<template>
  <v-card variant="outlined" class="mt-4">
    <v-card-title class="d-flex align-center gap-2">
      <v-icon color="primary">mdi-login-variant</v-icon>
      Recent Logins
    </v-card-title>
    
    <v-card-text>
      <div class="text-body-2 text-medium-emphasis mb-3">
        <v-icon size="small" class="me-1">mdi-information</v-icon>
        Shows your last 5 login attempts
      </div>
      
      <v-list v-if="loginHistory.length > 0" density="compact">
        <v-list-item
          v-for="login in loginHistory"
          :key="login.id"
          class="px-0"
        >
          <template v-slot:prepend>
            <v-icon 
              :icon="login.success ? 'mdi-check-circle' : 'mdi-alert-circle'" 
              :color="login.success ? 'success' : 'error'"
              size="small"
            />
          </template>

          <v-list-item-title class="text-body-2">
            {{ login.success ? 'Successful login' : 'Failed login attempt' }}
          </v-list-item-title>

          <v-list-item-subtitle class="text-caption">
            {{ formatTimestamp(login.timestamp) }}
            <span v-if="login.details?.browser" class="ms-2">
              • {{ login.details.browser }}
            </span>
          </v-list-item-subtitle>
        </v-list-item>
      </v-list>

      <div v-else class="text-center py-6 text-medium-emphasis">
        <p class="text-body-2">No login history available</p>
      </div>
    </v-card-text>
  </v-card>
</template>

<script setup>
defineProps({
  loginHistory: {
    type: Array,
    default: () => []
  }
})

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