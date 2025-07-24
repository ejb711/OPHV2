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
      class="messages-container"
      :class="{ 'messages-empty': !visibleMessages.length && !loading }"
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
      <TransitionGroup
        v-else
        name="message"
        tag="div"
        class="messages-list"
      >
        <ForumMessage
          v-for="message in visibleMessages"
          :key="message.id"
          :message="message"
          :can-edit="canEditMessage(message)"
          :can-delete="canDeleteMessage(message)"
          @edit="handleEdit"
          @delete="handleDelete"
        />
      </TransitionGroup>
    </div>

    <!-- Message Composer -->
    <ForumComposer
      :sending="sendingMessage"
      :disabled="!canPost"
      @send="handleSend"
    />

    <!-- Scroll to Bottom Button -->
    <v-fab
      v-if="showScrollButton"
      size="small"
      color="primary"
      icon="mdi-arrow-down"
      class="scroll-to-bottom"
      @click="scrollToBottom"
    />
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted, nextTick, watch } from 'vue'
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

// Local state
const showScrollButton = ref(false)
const messagesContainer = ref(null)

// Clear error
const handleClearError = () => {
  if (clearError) {
    clearError()
  } else {
    error.value = null
  }
}

// Handle sending a message
const handleSend = async (content) => {
  handleClearError() // Clear any previous errors
  const success = await sendMessage(content)
  if (success) {
    showSnackbar('Message sent', 'success')
    await nextTick()
    scrollToBottom()
  } else {
    // Error is already set by sendMessage
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

// Scroll to bottom of messages
const scrollToBottom = () => {
  const container = document.querySelector('.messages-container')
  if (container) {
    container.scrollTop = container.scrollHeight
  }
}

// Check if should show scroll button
const checkScroll = () => {
  const container = document.querySelector('.messages-container')
  if (container) {
    const { scrollTop, scrollHeight, clientHeight } = container
    showScrollButton.value = scrollHeight - scrollTop - clientHeight > 100
  }
}

// Watch for new messages and auto-scroll
watch(visibleMessages, async (newMessages, oldMessages) => {
  if (newMessages.length > oldMessages?.length) {
    await nextTick()
    scrollToBottom()
  }
})

// Lifecycle
onMounted(() => {
  watchMessages()
  
  // Add scroll listener
  const container = document.querySelector('.messages-container')
  if (container) {
    container.addEventListener('scroll', checkScroll)
  }
})

onUnmounted(() => {
  stopWatching()
  
  // Remove scroll listener
  const container = document.querySelector('.messages-container')
  if (container) {
    container.removeEventListener('scroll', checkScroll)
  }
})
</script>

<style scoped>
.project-forum {
  height: 100%;
  display: flex;
  flex-direction: column;
}

.messages-container {
  flex: 1;
  overflow-y: auto;
  background-color: rgb(var(--v-theme-grey-lighten-5));
  border-radius: 8px;
  padding: 16px;
  margin-bottom: 16px;
  min-height: 300px;
  max-height: 500px;
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

/* Message transitions */
.message-enter-active {
  transition: all 0.3s ease;
}

.message-leave-active {
  transition: all 0.3s ease;
  position: absolute;
  width: 100%;
}

.message-enter-from {
  transform: translateX(-30px);
  opacity: 0;
}

.message-leave-to {
  transform: translateX(30px);
  opacity: 0;
}

.scroll-to-bottom {
  position: absolute;
  bottom: 80px;
  right: 24px;
}

/* Ensure rounded corners */
.rounded {
  border-radius: 4px;
}
</style>