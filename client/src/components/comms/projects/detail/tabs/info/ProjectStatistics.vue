<!-- client/src/components/comms/projects/detail/tabs/info/ProjectStatistics.vue -->
<template>
  <div class="field-group stats-group">
    <label class="field-label">Project Statistics</label>

    <v-row dense>
      <!-- Views -->
      <v-col cols="6" sm="3">
        <div class="text-center stat-card">
          <div class="text-h6">{{ project.viewCount || 0 }}</div>
          <div class="text-caption text-grey-darken-1">Views</div>
        </div>
      </v-col>

      <!-- Files -->
      <v-col cols="6" sm="3">
        <div class="text-center stat-card">
          <div class="text-h6">{{ fileCount }}</div>
          <div class="text-caption text-grey-darken-1">Files</div>
        </div>
      </v-col>

      <!-- Messages -->
      <v-col cols="6" sm="3">
        <div class="text-center stat-card">
          <div class="text-h6">{{ messageCount }}</div>
          <div class="text-caption text-grey-darken-1">Messages</div>
        </div>
      </v-col>

      <!-- Days Active -->
      <v-col cols="6" sm="3">
        <div class="text-center stat-card">
          <div class="text-h6">{{ daysActive }}</div>
          <div class="text-caption text-grey-darken-1">Days Active</div>
        </div>
      </v-col>
    </v-row>
  </div>
</template>

<script setup>
import { ref, computed, watch, onUnmounted } from 'vue'
import {
  collection,
  query,
  where,
  onSnapshot
} from 'firebase/firestore'
import { db } from '@/firebase'

// Props
const props = defineProps({
  project: {
    type: Object,
    required: true
  }
})

// State
const fileCount = ref(0)
const messageCount = ref(0)

// Firestore listeners
let filesUnsubscribe = null
let messagesUnsubscribe = null

// Computed properties
const daysActive = computed(() => {
  if (!props.project?.createdAt) return 0

  const created = props.project.createdAt.toDate
    ? props.project.createdAt.toDate()
    : new Date(props.project.createdAt)

  const now = new Date()
  const diff = now - created

  return Math.floor(diff / (1000 * 60 * 60 * 24))
})

// Watch for project changes
watch(() => props.project?.id, (newId, oldId) => {
  // Clean up old listeners
  if (oldId) {
    cleanupListeners()
  }

  // Set up new listeners
  if (newId) {
    setupListeners(newId)
  }
}, { immediate: true })

// Set up real-time listeners for counts
function setupListeners(projectId) {
  if (!projectId) return

  // Listen to files count
  const filesQuery = query(
    collection(db, 'comms_files'),
    where('projectId', '==', projectId),
    where('deleted', '==', false)
  )

  filesUnsubscribe = onSnapshot(filesQuery, (snapshot) => {
    fileCount.value = snapshot.size
  }, (error) => {
    })

  // Listen to messages count
  const messagesQuery = query(
    collection(db, 'comms_messages'),
    where('projectId', '==', projectId),
    where('deleted', '==', false)
  )

  messagesUnsubscribe = onSnapshot(messagesQuery, (snapshot) => {
    messageCount.value = snapshot.size
  }, (error) => {
    })
}

// Clean up listeners
function cleanupListeners() {
  if (filesUnsubscribe) {
    filesUnsubscribe()
    filesUnsubscribe = null
  }

  if (messagesUnsubscribe) {
    messagesUnsubscribe()
    messagesUnsubscribe = null
  }

  // Reset counts
  fileCount.value = 0
  messageCount.value = 0
}

// Cleanup on unmount
onUnmounted(() => {
  cleanupListeners()
})
</script>

<style scoped>
/* Statistics cards */
.stats-group {
  background-color: rgba(0, 0, 0, 0.02) !important;
}

.stat-card {
  background-color: #fff;
  border-radius: 8px;
  padding: 16px 8px;
  border: 1px solid rgba(0, 0, 0, 0.06);
  transition: all 0.2s ease;
}

.stat-card:hover {
  border-color: rgba(0, 0, 0, 0.12);
  transform: translateY(-1px);
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.08);
}
</style>