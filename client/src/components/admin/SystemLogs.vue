<!-- client/src/components/admin/SystemLogs.vue -->
<script setup>
import { ref, onMounted } from 'vue'
import { collection, query, orderBy, limit, onSnapshot } from 'firebase/firestore'
import { db } from '../../firebase'

const logs = ref([])
const loading = ref(true)

let unsubscribe = null

onMounted(() => {
  setupRealtimeListener()
})

onUnmounted(() => {
  if (unsubscribe) unsubscribe()
})

function setupRealtimeListener() {
  const q = query(
    collection(db, 'audit_logs'),
    orderBy('timestamp', 'desc'),
    limit(50)
  )
  
  unsubscribe = onSnapshot(q, (snapshot) => {
    logs.value = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      timestamp: doc.data().timestamp?.toDate() || new Date()
    }))
    loading.value = false
  })
}

function formatDate(date) {
  return new Date(date).toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}

const actionIcons = {
  user_updated: 'mdi-account-edit',
  user_deleted: 'mdi-account-remove',
  bulk_operation: 'mdi-account-multiple-check',
  admin_tab_viewed: 'mdi-eye',
  default: 'mdi-history'
}

function getActionIcon(action) {
  return actionIcons[action] || actionIcons.default
}
</script>

<template>
  <div class="pa-4">
    <v-alert type="info" variant="tonal" class="mb-4">
      <v-alert-title>System Logs</v-alert-title>
      Showing recent system activity. Full audit log features coming soon.
    </v-alert>

    <!-- Recent Activity -->
    <v-card v-if="!loading && logs.length > 0">
      <v-list>
        <v-list-item
          v-for="log in logs"
          :key="log.id"
          lines="two"
        >
          <template v-slot:prepend>
            <v-avatar color="grey-lighten-2">
              <v-icon>{{ getActionIcon(log.action) }}</v-icon>
            </v-avatar>
          </template>

          <v-list-item-title>
            {{ log.action.replace(/_/g, ' ').toUpperCase() }}
          </v-list-item-title>
          
          <v-list-item-subtitle>
            <div>{{ log.userEmail }} • {{ formatDate(log.timestamp) }}</div>
            <div v-if="log.details" class="text-caption">
              {{ JSON.stringify(log.details).substring(0, 100) }}...
            </div>
          </v-list-item-subtitle>
        </v-list-item>
      </v-list>
    </v-card>

    <!-- Empty State -->
    <v-card v-else-if="!loading" class="text-center pa-8">
      <v-icon size="64" color="grey-lighten-1">mdi-history</v-icon>
      <p class="text-h6 mt-4">No activity logs yet</p>
      <p class="text-body-2 text-medium-emphasis">
        System activity will appear here once users start making changes
      </p>
    </v-card>

    <!-- Loading State -->
    <div v-else class="text-center pa-8">
      <v-progress-circular indeterminate color="primary"></v-progress-circular>
    </div>
  </div>
</template>