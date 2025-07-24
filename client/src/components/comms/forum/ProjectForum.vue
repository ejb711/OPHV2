<!-- client/src/components/comms/forum/ProjectForum.vue -->
<template>
  <div class="project-forum">
    <!-- Forum Header -->
    <div class="d-flex align-center mb-4">
      <v-icon class="mr-2">mdi-forum</v-icon>
      <h3 class="text-h6">Project Discussion</h3>
      <v-spacer />
      <v-chip small>
        {{ visibleMessages.length }} {{ visibleMessages.length === 1 ? 'message' : 'messages' }}
      </v-chip>
    </div>

    <!-- Loading State -->
    <v-progress-linear 
      v-if="loading" 
      indeterminate 
      color="primary"
      class="mb-4"
    />

    <!-- Error State - Simple and Direct -->
    <div 
      v-if="error" 
      class="mb-4 pa-3 rounded d-flex align-center justify-space-between"
      style="background-color: #ffebee; color: #c62828; border: 1px solid #ef5350;"
    >
      <div class="d-flex align-center">
        <v-icon color="error" class="mr-2">mdi-alert-circle</v-icon>
        <span>{{ error }}</span>
      </div>
      <v-btn
        icon="mdi-close"
        size="small"
        variant="text"
        color="error"
        @click="clearError"
      />
    </div>

    <!-- Messages Container -->
    <div 
      ref="messagesContainer"
      class="messages-container"
      :class="{ 'messages-empty': !visibleMessages.length && !loading }"
      @scroll.passive="updateScrollPosition"
    >
      <!-- Empty State -->
      <div 
        v-if="!visibleMessages.length && !loading"
        class="text-center py-8"
      >
        <v-icon size="48" color="grey-lighten-1">mdi-message-text-outline</v-icon>
        <p class="text-grey-darken-1 mt-4">
          No messages yet. Start the conversation!
        </p>
      </div>

      <!-- Message List -->
      <div v-else class="messages-list">
        <ForumMessage
          v-for="message in visibleMessages"
          :key="message.id"
          :message="message"
          :can-edit="canEditMessage(message)"
          :can-delete="canDeleteMessage(message)"
          @edit="handleEdit"
          @delete="handleDelete"
        />
      </div>
    </div>

    <!-- Message Composer -->
    <div class="composer-container">
      <ForumComposer
        :sending="sendingMessage"
        :disabled="!canPost"
        @send="handleSend"
      />
    </div>

    <!-- Scroll to Bottom Button -->
    <v-fab
      v-if="showScrollButton"
      size="small"
      color="primary"
      icon="mdi-arrow-down"
      class="scroll-to-bottom"
      @click="doScrollToBottom"
    />
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, watch } from 'vue'
import { useProjectForum } from '@/composables/comms/useProjectForum'
import ForumMessage from './ForumMessage.vue'
import ForumComposer from './ForumComposer.vue'
import { useSnackbar } from '@/composables/useSnackbar'
import { useAuthStore } from '@/stores/auth'

const props = defineProps({
  projectId: {
    type: String,
    required: true
  },
  canPost: {
    type: Boolean,
    default: true
  }
})

const { showSnackbar } = useSnackbar()
const authStore = useAuthStore()

// Forum composable
const projectIdRef = ref(props.projectId)
const {
  visibleMessages,
  loading,
  error,
  sendingMessage,
  watchMessages,
  stopWatching,
  sendMessage,
  editMessage,
  deleteMessage,
  hardDeleteMessage,
  canEditMessage,
  canDeleteMessage,
  clearError
} = useProjectForum(projectIdRef)

// Refs
const messagesContainer = ref(null)

// State
const showScrollButton = ref(false)
const isNearBottom = ref(true)
const lastScrollTop = ref(0)
const messageCountRef = ref(0)

// Simple scroll to bottom function
const doScrollToBottom = () => {
  const container = messagesContainer.value
  if (!container) {
    console.warn('No messages container found')
    return
  }
  
  // Direct DOM manipulation - most reliable
  container.scrollTop = container.scrollHeight
  
  // Update button visibility
  showScrollButton.value = false
  isNearBottom.value = true
}

// Update scroll position tracking
const updateScrollPosition = () => {
  const container = messagesContainer.value
  if (!container) return
  
  const { scrollTop, scrollHeight, clientHeight } = container
  const distanceFromBottom = scrollHeight - scrollTop - clientHeight
  
  // Track if near bottom (within 100px)
  isNearBottom.value = distanceFromBottom < 100
  showScrollButton.value = distanceFromBottom > 100
  
  lastScrollTop.value = scrollTop
}

// Handle sending a message
const handleSend = async (content) => {
  handleClearError()
  
  const success = await sendMessage(content)
  if (success) {
    showSnackbar('Message sent', 'success')
    // Always scroll to bottom for own messages
    setTimeout(doScrollToBottom, 150)
  } else {
    console.error('Failed to send message:', error.value)
  }
}

// Handle editing a message
const handleEdit = async ({ messageId, content }) => {
  const success = await editMessage(messageId, content)
  if (success) {
    showSnackbar('Message updated', 'success')
  } else {
    showSnackbar(error.value || 'Failed to update message', 'error')
  }
}

// Handle deleting a message
const handleDelete = async (messageId) => {
  const isAdmin = authStore.hasPermission('manage_comms')
  const success = isAdmin 
    ? await hardDeleteMessage(messageId)
    : await deleteMessage(messageId)
    
  if (success) {
    showSnackbar('Message deleted', 'success')
  } else {
    showSnackbar(error.value || 'Failed to delete message', 'error')
  }
}

// Clear error handler
const handleClearError = () => {
  if (clearError) {
    clearError()
  } else {
    error.value = null
  }
}

// Watch for new messages - SIMPLE APPROACH
watch(() => visibleMessages.value.length, (newCount, oldCount) => {
  // Store the count
  messageCountRef.value = newCount
  
  // Skip if no messages
  if (newCount === 0) return
  
  // Initial load or new message
  if (oldCount === 0 || (newCount > oldCount && isNearBottom.value)) {
    // Use RAF to ensure DOM is updated
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        doScrollToBottom()
      })
    })
  }
})

// Also watch the loading state
watch(loading, (isLoading, wasLoading) => {
  if (wasLoading && !isLoading && visibleMessages.value.length > 0) {
    // Messages just finished loading
    setTimeout(doScrollToBottom, 200)
  }
})

// Lifecycle
onMounted(() => {
  watchMessages()
  
  // Initial scroll after mount
  setTimeout(() => {
    if (visibleMessages.value.length > 0) {
      doScrollToBottom()
    }
  }, 300)
})

onUnmounted(() => {
  stopWatching()
})
</script>

<style scoped>
.project-forum {
  height: calc(100% - 20px);
  display: flex;
  flex-direction: column;
}

.messages-container {
  flex: 1;
  overflow-y: auto;
  overflow-x: hidden;
  background-color: rgb(var(--v-theme-grey-lighten-5));
  border-radius: 8px;
  padding: 16px;
  margin-bottom: 8px;
  min-height: 200px;
  max-height: calc(100vh - 400px);
}

.messages-empty {
  display: flex;
  align-items: center;
  justify-content: center;
}

.messages-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.scroll-to-bottom {
  position: absolute;
  bottom: 150px;
  right: 24px;
  z-index: 10;
}

/* Ensure rounded corners */
.rounded {
  border-radius: 4px;
}

/* Custom scrollbar */
.messages-container::-webkit-scrollbar {
  width: 8px;
}

.messages-container::-webkit-scrollbar-track {
  background: #f1f1f1;
  border-radius: 4px;
}

.messages-container::-webkit-scrollbar-thumb {
  background: #888;
  border-radius: 4px;
}

.messages-container::-webkit-scrollbar-thumb:hover {
  background: #555;
}

/* Composer container styling */
.composer-container {
  margin-top: auto;
  padding: 8px 0 0 0;
  background-color: transparent;
}

/* Hide any Vue devtools overlay if present */
.project-forum :deep([data-v-inspector]) {
  display: none !important;
}
</style>