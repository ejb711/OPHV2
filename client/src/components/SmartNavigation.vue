<!-- client/src/components/SmartNavigation.vue - Fixed drawer state management -->
<template>
  <div class="smart-navigation">
    <!-- Desktop Navigation - Only render when drawer prop is true -->
    <v-navigation-drawer
      v-if="!mobile && drawer"
      permanent
      color="grey-lighten-4"
    >
      <v-list density="compact" nav>
        <!-- User Info -->
        <v-list-item
          :prepend-avatar="userAvatar"
          :title="userName"
          :subtitle="userRole"
          nav
        />

        <v-divider />

        <!-- Dynamic Navigation Items -->
        <template v-for="(section, idx) in navigationSections" :key="idx">
          <v-list-subheader v-if="section.items.length > 0">
            {{ section.title }}
          </v-list-subheader>
          
          <v-list-item
            v-for="item in section.items"
            :key="item.route"
            :to="item.route"
            :prepend-icon="item.icon"
            :title="item.title"
            :value="item.route"
          >
            <template v-slot:append v-if="item.badge">
              <v-badge
                :content="item.badge.content"
                :color="item.badge.color"
                inline
              />
            </template>
          </v-list-item>
          
          <v-divider v-if="idx < navigationSections.length - 1 && section.items.length > 0" />
        </template>

        <!-- Bottom Actions -->
        <template v-slot:append>
          <!-- System Status Footer -->
          <!-- NOTE: System status visibility needs debugging - not showing for owner role -->
          <!-- TODO: Debug why canViewSystemStatus is not working properly for owner role -->
          <div v-if="authStore.isOwner || authStore.isAdmin" class="pa-3">
            <v-divider class="mb-3" />
            <div class="text-caption text-medium-emphasis mb-2">System Status</div>
            <div class="text-caption">
              <div class="d-flex align-center mb-1">
                <v-icon size="x-small" class="mr-1" :color="systemStatus.platform ? 'success' : 'error'">
                  mdi-circle
                </v-icon>
                Platform: {{ systemStatus.platform ? 'Operational' : 'Issues' }}
              </div>
              <div class="d-flex align-center mb-1">
                <v-icon size="x-small" class="mr-1" :color="systemStatus.auth ? 'success' : 'error'">
                  mdi-circle
                </v-icon>
                Auth: {{ systemStatus.auth ? 'Active' : 'Issues' }}
              </div>
              <div class="d-flex align-center">
                <v-icon size="x-small" class="mr-1" :color="systemStatus.database ? 'success' : 'error'">
                  mdi-circle
                </v-icon>
                Database: {{ systemStatus.database ? 'Connected' : 'Issues' }}
              </div>
            </div>
          </div>

          <v-divider />
          
          <v-list-item
            prepend-icon="mdi-logout"
            title="Logout"
            @click="handleLogout"
          />
        </template>
      </v-list>
    </v-navigation-drawer>

    <!-- Mobile Bottom Navigation -->
    <v-bottom-navigation
      v-if="mobile"
      grow
      bg-color="primary"
      color="white"
    >
      <v-btn
        v-for="item in mobileNavItems"
        :key="item.route"
        :to="item.route"
        :value="item.route"
      >
        <v-icon>{{ item.icon }}</v-icon>
        <span class="text-caption">{{ item.title }}</span>
      </v-btn>
      
      <v-btn @click="handleLogout">
        <v-icon>mdi-logout</v-icon>
        <span class="text-caption">Logout</span>
      </v-btn>
    </v-bottom-navigation>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useDisplay } from 'vuetify'
import { useAuthStore } from '../stores/auth'
import { usePermissions } from '../composables/usePermissions'

// Props - Just receive the drawer state from parent
const props = defineProps({
  drawer: {
    type: Boolean,
    default: true
  }
})

// Composables
const router = useRouter()
const authStore = useAuthStore()
const { mobile } = useDisplay()

// Get all permissions - some might not exist yet
const permissions = usePermissions()
const canViewDashboard = permissions.canViewDashboard || ref(true)
const canAccessAdmin = permissions.canAccessAdmin || ref(false)
const canViewUsers = permissions.canViewUsers || ref(false)
const canManageRoles = permissions.canManageRoles || ref(false)
const canViewAuditLogs = permissions.canViewAuditLogs || ref(false)
const canViewProjects = permissions.canViewProjects || ref(false)
const canViewForums = permissions.canViewForums || ref(false)
const canViewCalendar = permissions.canViewCalendar || ref(false)
const canViewComms = permissions.canViewComms || ref(false)
const canViewAnalytics = permissions.canViewAnalytics || ref(false)
const canManageSettings = permissions.canManageSettings || ref(false)
const canViewSystemStatus = permissions.canViewSystemStatus || ref(false)

// System status (in real app, this would come from a store or API)
const systemStatus = ref({
  platform: true,
  auth: true,
  database: true
})

// User info
const userName = computed(() => 
  authStore.user?.displayName || authStore.user?.email?.split('@')[0] || 'User'
)

const userRole = computed(() => {
  const roleMap = {
    owner: 'Owner',
    admin: 'Admin',
    user: 'User',
    viewer: 'Viewer',
    pending: 'Pending'
  }
  return roleMap[authStore.role] || authStore.role
})

const userAvatar = computed(() => authStore.user?.photoURL || null)

// Navigation sections
const navigationSections = computed(() => {
  const sections = [
    {
      title: 'Main',
      items: [
        {
          title: 'Dashboard',
          icon: 'mdi-view-dashboard',
          route: '/dash',
          show: canViewDashboard.value
        },
        {
          title: 'My Profile',
          icon: 'mdi-account',
          route: '/profile',
          show: true
        }
      ]
    },
    {
      title: 'Administration',
      items: [
        {
          title: 'Admin Panel',
          icon: 'mdi-shield-crown',
          route: '/admin',
          show: canAccessAdmin.value
        },
        {
          title: 'Users',
          icon: 'mdi-account-group',
          route: '/admin/users',
          show: canViewUsers.value,
          disabled: true
        },
        {
          title: 'Roles & Permissions',
          icon: 'mdi-shield-account',
          route: '/admin/roles',
          show: canManageRoles.value,
          disabled: true
        },
        {
          title: 'Audit Logs',
          icon: 'mdi-history',
          route: '/admin/audit',
          show: canViewAuditLogs.value,
          disabled: true
        }
      ]
    },
    {
      title: 'Features',
      items: [
        {
          title: 'Projects',
          icon: 'mdi-folder-multiple',
          route: '/projects',
          show: canViewProjects.value,
          disabled: true // Feature not yet implemented
        },
        {
          title: 'Forums',
          icon: 'mdi-forum',
          route: '/forums',
          show: canViewForums.value,
          disabled: true
        },
        {
          title: 'Calendar',
          icon: 'mdi-calendar',
          route: '/calendar',
          show: canViewCalendar.value,
          disabled: true
        },
        {
          title: 'Communications',
          icon: 'mdi-bullhorn',
          route: '/comms',
          show: canViewComms.value,
          badge: {
            content: 'NEW',
            color: 'success'
          }
        }
      ]
    },
    {
      title: 'System',
      items: [
        {
          title: 'Analytics',
          icon: 'mdi-chart-line',
          route: '/analytics',
          show: canViewAnalytics.value,
          disabled: true
        },
        {
          title: 'Settings',
          icon: 'mdi-cog',
          route: '/settings',
          show: canManageSettings.value,
          disabled: true
        }
      ]
    }
  ]
  
  // Filter out hidden items and empty sections
  return sections.map(section => ({
    ...section,
    items: section.items.filter(item => item.show && !item.disabled)
  })).filter(section => section.items.length > 0)
})

// Mobile navigation items (top 4)
const mobileNavItems = computed(() => {
  const allItems = navigationSections.value.flatMap(s => s.items)
  return allItems.slice(0, 4)
})

// Logout handler
async function handleLogout() {
  await authStore.logout()
  router.push('/')
}
</script>

<style scoped>
.smart-navigation {
  height: 100%;
}

/* Ensure navigation drawer respects app bar */
.v-navigation-drawer {
  top: 64px !important;
  height: calc(100% - 64px) !important;
}

/* Mobile bottom navigation styling */
.v-bottom-navigation {
  position: fixed !important;
}

/* Custom styling for active navigation items */
.v-list-item--active {
  border-left: 4px solid rgb(var(--v-theme-primary));
  background-color: rgba(var(--v-theme-primary), 0.08);
}

/* System status styling */
.v-navigation-drawer .text-caption {
  font-size: 0.75rem;
  line-height: 1.2;
}

/* Responsive breakpoints */
@media (max-width: 960px) {
  .v-navigation-drawer {
    top: 56px !important;
    height: calc(100% - 56px) !important;
  }
}
</style>