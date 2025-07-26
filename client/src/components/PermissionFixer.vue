<!-- client/src/components/PermissionFixer.vue -->
<template>
  <v-card class="ma-4" color="warning" variant="tonal">
    <v-card-title class="d-flex align-center">
      <v-icon class="mr-2">mdi-wrench</v-icon>
      🔧 Permission System Fixer
      <v-spacer />
      <v-chip :color="systemStatus.color" size="small">
        {{ systemStatus.text }}
      </v-chip>
    </v-card-title>

    <v-card-text>
      <div class="mb-4">
        <p class="text-body-2 mb-3">
          Use these tools to initialize or fix the permission system. This is typically needed during initial setup
          or when the permission system gets out of sync.
        </p>

        <!-- System Status -->
        <v-alert
          :type="systemStatus.color"
          variant="tonal"
          class="mb-4"
        >
          <v-icon>{{ systemStatus.icon }}</v-icon>
          <strong>System Status:</strong> {{ systemStatus.message }}
        </v-alert>

        <!-- Diagnostic Information -->
        <v-expansion-panels class="mb-4">
          <v-expansion-panel title="🔍 System Diagnostics">
            <v-expansion-panel-text>
              <v-row>
                <v-col cols="12" md="6">
                  <h4 class="text-h6 mb-2">Collections Status</h4>
                  <div><strong>Permissions Collection:</strong>
                    <v-chip :color="diagnostics.permissionsExist ? 'green' : 'red'" size="small">
                      {{ diagnostics.permissionsCount }} permissions
                    </v-chip>
                  </div>
                  <div><strong>Roles Collection:</strong>
                    <v-chip :color="diagnostics.rolesExist ? 'green' : 'red'" size="small">
                      {{ diagnostics.rolesCount }} roles
                    </v-chip>
                  </div>
                </v-col>

                <v-col cols="12" md="6">
                  <h4 class="text-h6 mb-2">Your Account Status</h4>
                  <div><strong>Role:</strong> {{ auth.role || 'Not loaded' }}</div>
                  <div><strong>Role Permissions:</strong> {{ auth.rolePermissions.length }}</div>
                  <div><strong>Effective Permissions:</strong> {{ auth.effectivePermissions.length }}</div>
                  <div><strong>Using Fallback:</strong>
                    <v-chip :color="usingFallback ? 'orange' : 'green'" size="small">
                      {{ usingFallback ? 'Yes' : 'No' }}
                    </v-chip>
                  </div>
                </v-col>
              </v-row>
            </v-expansion-panel-text>
          </v-expansion-panel>
        </v-expansion-panels>
      </div>

      <!-- Action Buttons -->
      <v-row>
        <v-col cols="12" md="6">
          <v-btn
            @click="initializeSystem"
            :loading="loading.initialize"
            :disabled="loading.any"
            color="primary"
            variant="elevated"
            size="large"
            block
            prepend-icon="mdi-rocket-launch"
          >
            Initialize System
          </v-btn>
          <p class="text-caption mt-2 text-grey">
            Creates default permissions and roles collections. Safe to run multiple times.
          </p>
        </v-col>

        <v-col cols="12" md="6">
          <v-btn
            @click="fixAdminPermissions"
            :loading="loading.fix"
            :disabled="loading.any"
            color="orange"
            variant="elevated"
            size="large"
            block
            prepend-icon="mdi-account-wrench"
          >
            Fix Admin Permissions
          </v-btn>
          <p class="text-caption mt-2 text-grey">
            Ensures admin users have proper permissions loaded. Run if admins have 0 permissions.
          </p>
        </v-col>
      </v-row>

      <v-row class="mt-4">
        <v-col cols="12" md="6">
          <v-btn
            @click="refreshPermissions"
            :loading="loading.refresh"
            :disabled="loading.any"
            color="info"
            variant="outlined"
            block
            prepend-icon="mdi-refresh"
          >
            Refresh My Permissions
          </v-btn>
        </v-col>

        <v-col cols="12" md="6">
          <v-btn
            @click="showResetDialog = true"
            :disabled="loading.any"
            color="error"
            variant="outlined"
            block
            prepend-icon="mdi-delete-forever"
          >
            Reset System (Danger)
          </v-btn>
        </v-col>
      </v-row>

      <!-- Results Display -->
      <v-alert
        v-if="lastResult"
        :type="lastResult.success ? 'success' : 'error'"
        class="mt-4"
        dismissible
        @click:close="lastResult = null"
      >
        <div class="d-flex align-center">
          <v-icon class="mr-2">
            {{ lastResult.success ? 'mdi-check-circle' : 'mdi-alert-circle' }}
          </v-icon>
          <div>
            <strong>{{ lastResult.success ? 'Success!' : 'Error!' }}</strong><br>
            {{ lastResult.message }}
            <div v-if="lastResult.details" class="text-caption mt-1">
              {{ lastResult.details }}
            </div>
          </div>
        </div>
      </v-alert>
    </v-card-text>

    <!-- Reset Confirmation Dialog -->
    <v-dialog v-model="showResetDialog" max-width="500">
      <v-card>
        <v-card-title class="text-h5 text-error">
          ⚠️ Danger: Reset Permission System
        </v-card-title>
        <v-card-text>
          <v-alert type="error" variant="tonal" class="mb-4">
            <strong>This will completely reset the permission system!</strong><br>
            All custom roles and permissions will be deleted and replaced with defaults.
          </v-alert>

          <p>Are you absolutely sure you want to proceed? This action cannot be undone.</p>

          <v-text-field
            v-model="resetConfirmation"
            label="Type 'RESET' to confirm"
            variant="outlined"
            class="mt-4"
          />
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn @click="showResetDialog = false">Cancel</v-btn>
          <v-btn
            @click="resetSystem"
            :disabled="resetConfirmation !== 'RESET' || loading.any"
            :loading="loading.reset"
            color="error"
          >
            Reset System
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </v-card>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useAuthStore } from '../stores/auth'
import { collection, getDocs } from 'firebase/firestore'
import { db } from '../firebase'

const auth = useAuthStore()

/* ---------- state ---------- */
const loading = ref({
  initialize: false,
  fix: false,
  refresh: false,
  reset: false,
  get any() {
    return this.initialize || this.fix || this.refresh || this.reset
  }
})

const lastResult = ref(null)
const showResetDialog = ref(false)
const resetConfirmation = ref('')
const diagnostics = ref({
  permissionsExist: false,
  permissionsCount: 0,
  rolesExist: false,
  rolesCount: 0
})

/* ---------- computed ---------- */
const usingFallback = computed(() => {
  return auth.role === 'admin' && auth.effectivePermissions.length === 0
})

const systemStatus = computed(() => {
  if (!diagnostics.value.permissionsExist || !diagnostics.value.rolesExist) {
    return {
      color: 'error',
      text: 'Not Initialized',
      icon: 'mdi-alert-circle',
      message: 'Permission system not initialized. Click "Initialize System" to set up.'
    }
  }

  if (usingFallback.value) {
    return {
      color: 'warning',
      text: 'Needs Fixing',
      icon: 'mdi-wrench',
      message: 'Admin permissions not loading properly. Click "Fix Admin Permissions".'
    }
  }

  return {
    color: 'success',
    text: 'Working',
    icon: 'mdi-check-circle',
    message: 'Permission system is working correctly.'
  }
})

/* ---------- lifecycle ---------- */
onMounted(async () => {
  await checkSystemStatus()
})

/* ---------- methods ---------- */
async function checkSystemStatus() {
  try {
    // Check permissions collection
    const permissionsSnapshot = await getDocs(collection(db, 'permissions'))
    diagnostics.value.permissionsExist = !permissionsSnapshot.empty
    diagnostics.value.permissionsCount = permissionsSnapshot.size

    // Check roles collection
    const rolesSnapshot = await getDocs(collection(db, 'roles'))
    diagnostics.value.rolesExist = !rolesSnapshot.empty
    diagnostics.value.rolesCount = rolesSnapshot.size

  } catch (error) {
    diagnostics.value.permissionsExist = false
    diagnostics.value.rolesExist = false
  }
}

async function initializeSystem() {
  loading.value.initialize = true
  lastResult.value = null

  try {
    // Call cloud function to initialize system
    const functionUrl = `${window.location.origin.includes('localhost') ? 'http://localhost:5001' : 'https://us-central1-' + 'YOUR_PROJECT_ID'}/initializePermissionSystem`

    const response = await fetch(functionUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      }
    })

    const result = await response.json()

    if (result.success) {
      lastResult.value = {
        success: true,
        message: 'Permission system initialized successfully!',
        details: `Created ${result.permissions} permissions and ${result.roles} roles.`
      }

      // Refresh diagnostics and user permissions
      await Promise.all([
        checkSystemStatus(),
        auth.refreshPermissions()
      ])

    } else {
      throw new Error(result.error || 'Unknown error')
    }

  } catch (error) {
    lastResult.value = {
      success: false,
      message: 'Failed to initialize permission system.',
      details: error.message
    }
  } finally {
    loading.value.initialize = false
  }
}

async function fixAdminPermissions() {
  loading.value.fix = true
  lastResult.value = null

  try {
    const functionUrl = `${window.location.origin.includes('localhost') ? 'http://localhost:5001' : 'https://us-central1-' + 'YOUR_PROJECT_ID'}/fixAdminPermissions`

    const response = await fetch(functionUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      }
    })

    const result = await response.json()

    if (result.success) {
      lastResult.value = {
        success: true,
        message: 'Admin permissions fixed successfully!',
        details: `Updated ${result.updatedUsers} admin users.`
      }

      // Refresh user permissions
      await auth.refreshPermissions()

    } else {
      throw new Error(result.error || 'Unknown error')
    }

  } catch (error) {
    lastResult.value = {
      success: false,
      message: 'Failed to fix admin permissions.',
      details: error.message
    }
  } finally {
    loading.value.fix = false
  }
}

async function refreshPermissions() {
  loading.value.refresh = true
  lastResult.value = null

  try {
    await auth.refreshPermissions()

    lastResult.value = {
      success: true,
      message: 'Your permissions have been refreshed.',
      details: `You now have ${auth.effectivePermissions.length} effective permissions.`
    }

  } catch (error) {
    lastResult.value = {
      success: false,
      message: 'Failed to refresh permissions.',
      details: error.message
    }
  } finally {
    loading.value.refresh = false
  }
}

async function resetSystem() {
  loading.value.reset = true
  lastResult.value = null

  try {
    const functionUrl = `${window.location.origin.includes('localhost') ? 'http://localhost:5001' : 'https://us-central1-' + 'YOUR_PROJECT_ID'}/resetPermissionSystem`

    const response = await fetch(functionUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer reset-permissions-token'
      }
    })

    const result = await response.json()

    if (result.success) {
      lastResult.value = {
        success: true,
        message: 'Permission system reset successfully!',
        details: `Recreated ${result.permissions} permissions and ${result.roles} roles.`
      }

      // Refresh everything
      await Promise.all([
        checkSystemStatus(),
        auth.refreshPermissions()
      ])

      showResetDialog.value = false
      resetConfirmation.value = ''

    } else {
      throw new Error(result.error || 'Unknown error')
    }

  } catch (error) {
    lastResult.value = {
      success: false,
      message: 'Failed to reset permission system.',
      details: error.message
    }
  } finally {
    loading.value.reset = false
  }
}
</script>