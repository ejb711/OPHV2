<!-- client/src/components/admin/RetentionMonitor.vue -->
<script setup>
import { ref, onMounted, computed } from 'vue'
import { httpsCallable } from 'firebase/functions'
import { functions } from '../../firebase'
import { useAudit } from '../../composables/useAudit'

const { getRetentionStats: getClientStats, RETENTION_CONFIG } = useAudit()

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
  const totalBytes = stats.value.totalLogs * 500
  
  if (totalBytes < 1024) return `${totalBytes} B`
  if (totalBytes < 1024 * 1024) return `${(totalBytes / 1024).toFixed(1)} KB`
  return `${(totalBytes / (1024 * 1024)).toFixed(1)} MB`
})

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
    stats.value = result.data
    
  } catch (e) {
    console.warn('Cloud Function stats failed, using client-side:', e)
    
    // Fallback to client-side stats
    try {
      const clientStats = await getClientStats()
      if (clientStats) {
        stats.value = {
          ...clientStats,
          retentionHealth: clientStats.retentionHealth || 'unknown',
          lastUpdated: new Date().toISOString()
        }
      }
    } catch (clientError) {
      console.error('Client stats also failed:', clientError)
      error.value = 'Failed to load retention statistics'
    }
  } finally {
    loading.value = false
  }
}

async function triggerManualCleanup() {
  cleanupLoading.value = true
  error.value = ''
  success.value = ''
  
  try {
    const manualCleanup = httpsCallable(functions, 'manualCleanupAuditLogs')
    const result = await manualCleanup()
    
    success.value = `Cleanup completed! Compressed: ${result.data.stats.compressed}, Deleted: ${result.data.stats.deleted}`
    
    // Reload stats to reflect changes
    setTimeout(() => loadRetentionStats(), 2000)
    
  } catch (e) {
    console.error('Manual cleanup failed:', e)
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
              Retention Status: {{ stats.retentionHealth.toUpperCase() }}
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
              {{ stats.totalLogs.toLocaleString() }}
            </div>
            <div class="text-caption text-medium-emphasis">Total Logs</div>
          </div>
        </v-col>
        
        <v-col cols="6" md="3">
          <div class="text-center">
            <div class="text-h4 font-weight-bold text-success">
              {{ stats.recentLogs.toLocaleString() }}
            </div>
            <div class="text-caption text-medium-emphasis">Recent (30 days)</div>
          </div>
        </v-col>
        
        <v-col cols="6" md="3">
          <div class="text-center">
            <div class="text-h4 font-weight-bold text-warning">
              {{ stats.compressedLogs.toLocaleString() }}
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
              :model-value="stats.compressionRate"
              :color="healthColor"
              height="20"
              class="mb-2"
            >
              <strong>{{ stats.compressionRate }}%</strong>
            </v-progress-linear>
            
            <div class="text-caption text-medium-emphasis mb-4">
              {{ stats.compressedLogs }} of {{ stats.totalLogs }} logs compressed
            </div>
            
            <!-- Manual Cleanup Button -->
            <v-btn
              color="warning"
              variant="outlined"
              :loading="cleanupLoading"
              @click="triggerManualCleanup"
              prepend-icon="mdi-broom"
              block
            >
              Manual Cleanup
            </v-btn>
            
            <div class="text-caption text-medium-emphasis mt-2">
              Automatically runs daily at 2 AM
            </div>
          </v-list>
        </v-col>
      </v-row>

      <!-- Alerts -->
      <v-alert
        v-if="error"
        type="error"
        variant="tonal"
        closable
        @click:close="error = ''"
        class="mt-4"
      >
        {{ error }}
      </v-alert>
      
      <v-alert
        v-if="success"
        type="success"
        variant="tonal"
        closable
        @click:close="success = ''"
        class="mt-4"
      >
        {{ success }}
      </v-alert>

      <!-- Cost Projection -->
      <v-expansion-panels variant="accordion" class="mt-4">
        <v-expansion-panel>
          <v-expansion-panel-title>
            <v-icon class="me-2">mdi-calculator</v-icon>
            Cost Projection
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