<!-- client/src/views/NotFoundView.vue - 404 Page -->
<template>
  <AppLayout>
    <template #actions>
      <v-btn 
        v-if="authStore.user"
        icon="mdi-account-circle"
        @click="router.push('/profile')"
      />
    </template>
    
    <v-container class="not-found-container">
      <v-row align="center" justify="center" class="fill-height">
        <v-col cols="12" sm="8" md="6" lg="5">
          <v-card class="text-center pa-8" elevation="0">
            <!-- 404 Icon -->
            <v-icon 
              size="120" 
              color="primary"
              class="mb-6"
            >
              mdi-map-marker-question
            </v-icon>
            
            <!-- Error Message -->
            <h1 class="text-h3 font-weight-bold mb-4">
              Page Not Found
            </h1>
            
            <p class="text-h6 text-medium-emphasis mb-8">
              The page you're looking for doesn't exist or has been moved.
            </p>
            
            <!-- Suggestion List -->
            <v-list
              v-if="suggestedRoutes.length > 0"
              class="mb-6 mx-auto"
              max-width="400"
              density="comfortable"
            >
              <v-list-subheader>
                You might be looking for:
              </v-list-subheader>
              
              <v-list-item
                v-for="route in suggestedRoutes"
                :key="route.path"
                :to="route.path"
                :prepend-icon="route.icon"
              >
                <v-list-item-title>{{ route.title }}</v-list-item-title>
              </v-list-item>
            </v-list>
            
            <!-- Action Buttons -->
            <v-btn
              color="primary"
              size="large"
              class="mb-3"
              @click="goHome"
              prepend-icon="mdi-home"
            >
              Go to Dashboard
            </v-btn>
            
            <br>
            
            <v-btn
              variant="text"
              @click="goBack"
              prepend-icon="mdi-arrow-left"
            >
              Go Back
            </v-btn>
            
            <!-- Error Details (Dev Mode) -->
            <v-expand-transition>
              <v-alert
                v-if="showDetails"
                type="info"
                variant="tonal"
                class="mt-6 text-left"
                density="compact"
              >
                <v-alert-title>Technical Details</v-alert-title>
                <pre class="text-caption">{{ errorDetails }}</pre>
              </v-alert>
            </v-expand-transition>
            
            <!-- Dev Mode Toggle -->
            <v-btn
              v-if="isDevelopment"
              variant="text"
              size="x-small"
              class="mt-4"
              @click="showDetails = !showDetails"
            >
              {{ showDetails ? 'Hide' : 'Show' }} Details
            </v-btn>
          </v-card>
        </v-col>
      </v-row>
    </v-container>
  </AppLayout>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useAuthStore } from '../stores/auth'
import { getAccessibleRoutes } from '../router'
import AppLayout from '../components/AppLayout.vue'

const router = useRouter()
const route = useRoute()
const authStore = useAuthStore()

// State
const showDetails = ref(false)

// Environment check
const isDevelopment = computed(() => import.meta.env.DEV)

// Suggested routes based on user permissions
const suggestedRoutes = computed(() => {
  if (!authStore.user) {
    return [
      { path: '/', title: 'Login', icon: 'mdi-login' }
    ]
  }
  
  const accessibleRoutes = getAccessibleRoutes()
  const suggestions = []
  
  // Map route names to friendly titles and icons
  const routeInfo = {
    Dashboard: { title: 'Dashboard', icon: 'mdi-view-dashboard' },
    Profile: { title: 'My Profile', icon: 'mdi-account' },
    Admin: { title: 'Admin Panel', icon: 'mdi-shield-crown' },
    Projects: { title: 'Projects', icon: 'mdi-folder-multiple' },
    Forums: { title: 'Forums', icon: 'mdi-forum' },
    Calendar: { title: 'Calendar', icon: 'mdi-calendar' }
  }
  
  // Get top accessible routes
  for (const route of accessibleRoutes) {
    if (routeInfo[route.name]) {
      suggestions.push({
        path: route.path,
        ...routeInfo[route.name]
      })
    }
    
    if (suggestions.length >= 3) break
  }
  
  return suggestions
})

// Error details for debugging
const errorDetails = computed(() => ({
  path: route.path,
  fullPath: route.fullPath,
  params: route.params,
  query: route.query,
  hash: route.hash,
  matched: route.matched.length,
  timestamp: new Date().toISOString(),
  user: authStore.user?.email || 'Not logged in',
  role: authStore.role || 'None'
}))

// Navigation methods
function goHome() {
  router.push(authStore.user ? '/dash' : '/')
}

function goBack() {
  if (window.history.length > 1) {
    router.go(-1)
  } else {
    goHome()
  }
}
</script>

<style scoped>
.not-found-container {
  min-height: calc(100vh - 64px);
  display: flex;
  align-items: center;
  justify-content: center;
}

/* Animated icon */
.v-icon {
  animation: float 3s ease-in-out infinite;
}

@keyframes float {
  0%, 100% {
    transform: translateY(0);
  }
  50% {
    transform: translateY(-10px);
  }
}

/* Responsive adjustments */
@media (max-width: 600px) {
  .not-found-container {
    min-height: calc(100vh - 56px);
  }
  
  .v-card {
    padding: 2rem !important;
  }
  
  .text-h3 {
    font-size: 2rem !important;
  }
}

/* Technical details formatting */
pre {
  white-space: pre-wrap;
  word-wrap: break-word;
  max-width: 100%;
  overflow-x: auto;
}
</style>