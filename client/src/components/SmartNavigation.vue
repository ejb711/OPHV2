<!-- client/src/components/SmartNavigation.vue - Permission-based navigation -->
<template>
  <div class="smart-navigation">
    <!-- Desktop Navigation -->
    <v-navigation-drawer
      v-if="!mobile"
      v-model="drawer"
      :rail="rail"
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
        >
          <template v-slot:append>
            <v-btn
              variant="text"
              icon="mdi-chevron-left"
              @click.stop="rail = !rail"
            />
          </template>
        </v-list-item>

        <v-divider />

        <!-- Dynamic Navigation Items -->
        <template v-for="(section, idx) in navigationSections" :key="idx">
          <v-list-subheader v-if="!rail && section.items.length > 0">
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
            <v-tooltip
              v-if="rail"
              :text="item.title"
              location="end"
            >
              <template v-slot:activator="{ props }">
                <v-icon v-bind="props">{{ item.icon }}</v-icon>
              </template>
            </v-tooltip>
          </v-list-item>
          
          <v-divider v-if="idx < navigationSections.length - 1 && section.items.length > 0" />
        </template>

        <!-- Bottom Actions -->
        <template v-slot:append>
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
      v-model="bottomNav"
      grow
      color="primary"
    >
      <v-btn
        v-for="item in mobileNavItems"
        :key="item.route"
        :to="item.route"
        :value="item.route"
      >
        <v-icon>{{ item.icon }}</v-icon>
        <span>{{ item.title }}</span>
      </v-btn>
      
      <v-btn @click="showMobileMenu = true">
        <v-icon>mdi-menu</v-icon>
        <span>More</span>
      </v-btn>
    </v-bottom-navigation>

    <!-- Mobile Menu Dialog -->
    <v-dialog
      v-model="showMobileMenu"
      fullscreen
      transition="dialog-bottom-transition"
    >
      <v-card>
        <v-toolbar color="primary">
          <v-toolbar-title>Menu</v-toolbar-title>
          <v-spacer />
          <v-btn icon @click="showMobileMenu = false">
            <v-icon>mdi-close</v-icon>
          </v-btn>
        </v-toolbar>
        
        <v-list>
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
              @click="showMobileMenu = false"
            />
            
            <v-divider v-if="idx < navigationSections.length - 1" />
          </template>
          
          <v-divider />
          
          <v-list-item
            prepend-icon="mdi-logout"
            title="Logout"
            @click="handleLogout"
          />
        </v-list>
      </v-card>
    </v-dialog>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useDisplay } from 'vuetify'
import { useAuthStore } from '../stores/auth'
import { usePermissions } from '../composables/usePermissions'
import { getAccessibleRoutes } from '../router'

const router = useRouter()
const authStore = useAuthStore()
const { mobile } = useDisplay()
const {
  canViewUsers,
  canManageRoles,
  canViewAuditLogs,
  canViewProjects,
  canViewForums,
  canViewCalendar,
  canViewAnalytics,
  canManageSettings
} = usePermissions()

// Navigation state
const drawer = ref(true)
const rail = ref(false)
const bottomNav = ref('dashboard')
const showMobileMenu = ref(false)

// User info
const userName = computed(() => authStore.user?.email?.split('@')[0] || 'User')
const userRole = computed(() => {
  const roles = {
    owner: 'System Owner',
    admin: 'Administrator',
    user: 'User',
    viewer: 'Viewer',
    pending: 'Pending Approval'
  }
  return roles[authStore.role] || 'Unknown'
})
const userAvatar = computed(() => {
  // Future: Return actual avatar URL
  return null
})

// Navigation structure with permission checks
const navigationSections = computed(() => {
  const sections = [
    {
      title: 'Main',
      items: [
        {
          title: 'Dashboard',
          icon: 'mdi-view-dashboard',
          route: '/dash',
          show: true
        },
        {
          title: 'Profile',
          icon: 'mdi-account',
          route: '/profile',
          show: authStore.role !== 'pending'
        }
      ]
    },
    {
      title: 'Administration',
      items: [
        {
          title: 'User Management',
          icon: 'mdi-account-group',
          route: '/admin',
          show: canViewUsers.value
        },
        {
          title: 'Roles & Permissions',
          icon: 'mdi-shield-account',
          route: '/admin?tab=roles',
          show: canManageRoles.value
        },
        {
          title: 'Audit Logs',
          icon: 'mdi-history',
          route: '/admin?tab=logs',
          show: canViewAuditLogs.value
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

/* Rail mode transitions */
.v-navigation-drawer--rail {
  transition: width 0.2s ease-in-out;
}

/* Custom styling for different user roles */
.v-list-item--active {
  border-left: 4px solid rgb(var(--v-theme-primary));
}

/* Responsive breakpoints */
@media (max-width: 960px) {
  .v-navigation-drawer {
    top: 56px !important;
    height: calc(100% - 56px) !important;
  }
}
</style>