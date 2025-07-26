<!-- client/src/components/admin/RetentionMonitor.vue -->
<script setup>
import { ref, onMounted, computed } from 'vue'
import { httpsCallable } from 'firebase/functions'
import { functions, db } from '../../firebase'
import { collection, query, where, orderBy, limit, getDocs, Timestamp } from 'firebase/firestore'
import { useAudit } from '../../composables/useAudit'

const { RETENTION_CONFIG } = useAudit()

/* ---------- state ---------- */
const loading = ref(false)
const cleanupLoading = ref(false)
const stats = ref({
  totalLogs: 0,
  compressedLogs: 0,
  recentLogs: 0,
  compressionRate: 0,
  retentionHealth: 'unknown',
  lastUpdated: null
})

const error = ref('')
const success = ref('')

/* ---------- computed ---------- */
const healthColor = computed(() => {
  switch (stats.value.retentionHealth) {
    case 'excellent': return 'success'
    case 'good': return 'success'
    case 'warning': return 'warning'
    case 'poor': return 'error'
    default: return 'info'
  }
})

const healthIcon = computed(() => {
  switch (stats.value.retentionHealth) {
    case 'excellent': return 'mdi-check-circle'
    case 'good': return 'mdi-check-circle'
    case 'warning': return 'mdi-alert-circle'
    case 'poor': return 'mdi-alert-circle'
    default: return 'mdi-help-circle'
  }
})

const storageEstimate = computed(() => {
  // Rough estimate: ~500 bytes per log
  const totalBytes = (stats.value.totalLogs || 0) * 500

  if (totalBytes < 1024) return `${totalBytes} B`
  if (totalBytes < 1024 * 1024) return `${(totalBytes / 1024).toFixed(1)} KB`
  return `${(totalBytes / (1024 * 1024)).toFixed(1)} MB`
})

// Safe formatting functions
const formatNumber = (value) => {
  return (value || 0).toLocaleString()
}

const formatHealthStatus = (status) => {
  return (status || 'unknown').toUpperCase()
}

/* ---------- lifecycle ---------- */
onMounted(() => {
  loadRetentionStats()
})

/* ---------- methods ---------- */
async function loadRetentionStats() {
  loading.value = true
  error.value = ''

  try {
    // Try to get stats from Cloud Function first
    const getRetentionStats = httpsCallable(functions, 'getRetentionStats')
    const result = await getRetentionStats()
    // Debug full response
    // Debug data property

    // Handle different possible response structures
    let statsData = null

    // Case 1: Nested structure with success flag and data property
    if (result.data && result.data.success && result.data.data) {
      statsData = result.data.data
      }
    // Case 2: Direct data structure
    else if (result.data && result.data.overview) {
      statsData = result.data
      }
    // Case 3: Maybe the overview is at the top level
    else if (result.data && result.data.totalLogs !== undefined) {
      statsData = { overview: result.data }
      }

    if (statsData && statsData.overview) {
      stats.value = {
        totalLogs: statsData.overview.totalLogs || 0,
        compressedLogs: statsData.overview.compressedLogs || 0,
        recentLogs: statsData.overview.recentLogs || 0,
        compressionRate: parseFloat(statsData.overview.compressionRate) || 0,
        retentionHealth: statsData.overview.retentionHealth || 'unknown',
        lastUpdated: statsData.lastUpdated || null
      }
      } else {
      throw new Error('Invalid response structure from Cloud Function')
    }

  } catch (e) {
    // Simple client-side fallback - just get basic counts
    try {
      const totalLogs = await getClientSideStats()
      stats.value = {
        totalLogs,
        compressedLogs: 0, // Would need more complex query
        recentLogs: totalLogs, // Simplified
        compressionRate: 0,
        retentionHealth: totalLogs > 0 ? 'good' : 'unknown',
        lastUpdated: new Date().toISOString()
      }
    } catch (clientError) {
      error.value = 'Failed to load retention statistics'

      // Set default values to prevent UI errors
      stats.value = {
        totalLogs: 0,
        compressedLogs: 0,
        recentLogs: 0,
        compressionRate: 0,
        retentionHealth: 'unknown',
        lastUpdated: new Date().toISOString()
      }
    }
  } finally {
    loading.value = false
  }
}

// Simple client-side stats as fallback
async function getClientSideStats() {
  try {
    // Get recent logs count (simplified)
    const recentQuery = query(
      collection(db, 'audit_logs'),
      orderBy('timestamp', 'desc'),
      limit(100)
    )
    const snapshot = await getDocs(recentQuery)
    return snapshot.size
  } catch (error) {
    return 0
  }
}

async function triggerManualCleanup() {
  cleanupLoading.value = true
  error.value = ''
  success.value = ''

  try {
    const manualCleanup = httpsCallable(functions, 'manualCleanupAuditLogs')
    const result = await manualCleanup()

    const cleanupStats = result.data.stats || {}
    success.value = `Cleanup completed! Compressed: ${cleanupStats.compressed || 0}, Deleted: ${cleanupStats.deleted || 0}`

    // Reload stats to reflect changes
    setTimeout(() => loadRetentionStats(), 2000)

  } catch (e) {
    error.value = e.message || 'Cleanup failed'
  } finally {
    cleanupLoading.value = false
  }
}

function formatDate(dateString) {
  if (!dateString) return 'Never'
  return new Date(dateString).toLocaleString()
}
</script>

<template>
  <v-card class="mb-4" elevation="2">
    <v-card-title class="d-flex align-center">
      <v-icon class="me-2">mdi-database-cog</v-icon>
      Audit Log Retention
      <v-spacer />
      <v-btn
        size="small"
        variant="outlined"
        @click="loadRetentionStats"
        :loading="loading"
        icon="mdi-refresh"
      />
    </v-card-title>

    <v-card-text>
      <!-- Health Status -->
      <v-row class="mb-4">
        <v-col cols="12">
          <v-alert
            :type="healthColor"
            variant="tonal"
            :icon="healthIcon"
            class="mb-0"
          >
            <v-alert-title>
              Retention Status: {{ formatHealthStatus(stats.retentionHealth) }}
            </v-alert-title>
            <div class="text-caption">
              Last updated: {{ formatDate(stats.lastUpdated) }}
            </div>
          </v-alert>
        </v-col>
      </v-row>

      <!-- Statistics Grid -->
      <v-row>
        <v-col cols="6" md="3">
          <div class="text-center">
            <div class="text-h4 font-weight-bold text-primary">
              {{ formatNumber(stats.totalLogs) }}
            </div>
            <div class="text-caption text-medium-emphasis">Total Logs</div>
          </div>
        </v-col>

        <v-col cols="6" md="3">
          <div class="text-center">
            <div class="text-h4 font-weight-bold text-success">
              {{ formatNumber(stats.recentLogs) }}
            </div>
            <div class="text-caption text-medium-emphasis">Recent (30 days)</div>
          </div>
        </v-col>

        <v-col cols="6" md="3">
          <div class="text-center">
            <div class="text-h4 font-weight-bold text-warning">
              {{ formatNumber(stats.compressedLogs) }}
            </div>
            <div class="text-caption text-medium-emphasis">Compressed</div>
          </div>
        </v-col>

        <v-col cols="6" md="3">
          <div class="text-center">
            <div class="text-h4 font-weight-bold text-info">
              {{ storageEstimate }}
            </div>
            <div class="text-caption text-medium-emphasis">Est. Storage</div>
          </div>
        </v-col>
      </v-row>

      <!-- Retention Policy Info -->
      <v-divider class="my-4" />

      <v-row>
        <v-col cols="12" md="6">
          <v-list density="compact">
            <v-list-subheader>Retention Policy</v-list-subheader>

            <v-list-item>
              <v-list-item-title>Full Detail Retention</v-list-item-title>
              <v-list-item-subtitle>
                {{ RETENTION_CONFIG.FULL_RETENTION_DAYS }} days
              </v-list-item-subtitle>
            </v-list-item>

            <v-list-item>
              <v-list-item-title>Compressed Retention</v-list-item-title>
              <v-list-item-subtitle>
                {{ RETENTION_CONFIG.COMPRESSED_RETENTION_DAYS }} days total
              </v-list-item-subtitle>
            </v-list-item>

            <v-list-item>
              <v-list-item-title>Compliance Actions</v-list-item-title>
              <v-list-item-subtitle>
                Extended retention (2+ years)
              </v-list-item-subtitle>
            </v-list-item>
          </v-list>
        </v-col>

        <v-col cols="12" md="6">
          <v-list density="compact">
            <v-list-subheader>Compression Rate</v-list-subheader>

            <v-progress-linear
              :model-value="stats.compressionRate || 0"
              :color="healthColor"
              height="20"
              class="mb-2"
            >
              <strong>{{ stats.compressionRate || 0 }}%</strong>
            </v-progress-linear>

            <div class="text-caption text-medium-emphasis">
              Logs older than {{ RETENTION_CONFIG.FULL_RETENTION_DAYS }} days are compressed to save storage
            </div>
          </v-list>
        </v-col>
      </v-row>

      <!-- Actions -->
      <v-divider class="my-4" />

      <div class="d-flex justify-space-between align-center">
        <div>
          <v-btn
            color="warning"
            variant="outlined"
            size="small"
            @click="triggerManualCleanup"
            :loading="cleanupLoading"
            :disabled="loading"
          >
            <v-icon left size="small">mdi-broom</v-icon>
            Manual Cleanup
          </v-btn>
          <div class="text-caption text-medium-emphasis mt-1">
            Manually trigger compression and deletion
          </div>
        </div>

        <div class="text-caption text-end text-medium-emphasis">
          Automatic cleanup runs weekly on Sundays
        </div>
      </div>

      <!-- Success/Error Messages -->
      <v-alert
        v-if="success"
        type="success"
        variant="tonal"
        closable
        class="mt-4"
        @click:close="success = ''"
      >
        {{ success }}
      </v-alert>

      <v-alert
        v-if="error"
        type="error"
        variant="tonal"
        closable
        class="mt-4"
        @click:close="error = ''"
      >
        {{ error }}
      </v-alert>

      <!-- Expandable Details -->
      <v-expansion-panels class="mt-4">
        <v-expansion-panel>
          <v-expansion-panel-title>
            <v-icon class="me-2">mdi-information-outline</v-icon>
            Firebase Free Tier Usage Projections
          </v-expansion-panel-title>
          <v-expansion-panel-text>
            <v-table density="compact">
              <thead>
                <tr>
                  <th><strong>Metric</strong></th>
                  <th><strong>Value</strong></th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td><strong>Current Usage</strong></td>
                  <td>{{ storageEstimate }} storage</td>
                </tr>
                <tr>
                  <td><strong>Firebase Free Tier</strong></td>
                  <td>1 GiB storage limit</td>
                </tr>
                <tr>
                  <td><strong>Daily Writes</strong></td>
                  <td>~2,000 (limit: 20,000)</td>
                </tr>
                <tr>
                  <td><strong>Daily Reads</strong></td>
                  <td>~10,000 (limit: 50,000)</td>
                </tr>
                <tr>
                  <td><strong>Status</strong></td>
                  <td>
                    <v-chip size="small" color="success">
                      Well within free tier
                    </v-chip>
                  </td>
                </tr>
              </tbody>
            </v-table>

            <div class="text-caption text-medium-emphasis mt-2">
              * Projections based on 100 users, 1 hour daily usage
            </div>
          </v-expansion-panel-text>
        </v-expansion-panel>
      </v-expansion-panels>
    </v-card-text>
  </v-card>
</template>

<style scoped>
.v-progress-linear {
  border-radius: 4px;
}

.v-table th,
.v-table td {
  padding: 8px 12px !important;
  font-size: 0.875rem;
}

.v-table th {
  font-weight: 600;
  background-color: rgba(0, 0, 0, 0.05);
}
</style>