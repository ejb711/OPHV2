<!-- client/src/components/comms/forum/ForumMessage.vue -->
<template>
  <div>
    <v-card
      :class="['forum-message', { 'own-message': isOwnMessage }]"
      variant="outlined"
    >
      <v-card-text class="pb-2">
        <!-- Message Header -->
        <div class="d-flex align-center mb-2">
          <v-avatar size="32" color="primary">
            <span class="text-caption">{{ authorInitials }}</span>
          </v-avatar>
          <div class="ml-3">
            <div class="d-flex align-center">
              <span class="font-weight-medium">{{ message.authorName }}</span>
              <v-chip
                v-if="message.editedAt"
                size="x-small"
                variant="tonal"
                class="ml-2"
              >
                edited
              </v-chip>
            </div>
            <span class="text-caption text-grey">{{ formattedTime }}</span>
          </div>
          <v-spacer />
          
          <!-- Message Actions -->
          <div v-if="!editing" class="message-actions">
            <v-btn
              v-if="canEdit"
              icon="mdi-pencil"
              size="x-small"
              variant="text"
              @click="startEdit"
            />
            <v-btn
              v-if="canDelete"
              icon="mdi-delete"
              size="x-small"
              variant="text"
              color="error"
              @click="confirmDelete"
            />
          </div>
        </div>

        <!-- Message Content -->
        <div v-if="!editing" class="message-content">
          {{ message.content }}
        </div>

        <!-- Edit Form -->
        <div v-else class="edit-form">
          <v-textarea
            v-model="editContent"
            :rows="3"
            variant="outlined"
            density="compact"
            hide-details
            auto-grow
            @keydown.esc="cancelEdit"
            @keydown.enter.ctrl="saveEdit"
            @keydown.enter.meta="saveEdit"
          />
          <div class="d-flex justify-end mt-2 gap-2">
            <v-btn
              size="small"
              variant="text"
              @click="cancelEdit"
            >
              Cancel
            </v-btn>
            <v-btn
              size="small"
              color="primary"
              :disabled="!editContent.trim() || editContent.trim() === message.content"
              @click="saveEdit"
            >
              Save
            </v-btn>
          </div>
        </div>
      </v-card-text>
    </v-card>

    <!-- Delete Confirmation Dialog -->
    <v-dialog v-model="deleteDialog" max-width="400">
      <v-card>
        <v-card-title>Delete Message?</v-card-title>
        <v-card-text>
          Are you sure you want to delete this message? This action cannot be undone.
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn
            variant="text"
            @click="deleteDialog = false"
          >
            Cancel
          </v-btn>
          <v-btn
            color="error"
            variant="flat"
            @click="deleteMessage"
          >
            Delete
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useAuthStore } from '@/stores/auth'
import { useProjectForum } from '@/composables/comms/useProjectForum'

const props = defineProps({
  message: {
    type: Object,
    required: true
  },
  canEdit: {
    type: Boolean,
    default: false
  },
  canDelete: {
    type: Boolean,
    default: false
  }
})

const emit = defineEmits(['edit', 'delete'])

const authStore = useAuthStore()
const { formatTimestamp } = useProjectForum(ref(null))

// Local state
const editing = ref(false)
const editContent = ref('')
const deleteDialog = ref(false)

// Computed properties
const isOwnMessage = computed(() => {
  return props.message.authorId === authStore.user?.uid
})

const authorInitials = computed(() => {
  const name = props.message.authorName || props.message.authorEmail || 'U'
  return name.split(' ')
    .map(part => part[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)
})

const formattedTime = computed(() => {
  return formatTimestamp(props.message.createdAt)
})

// Methods
const startEdit = () => {
  editContent.value = props.message.content
  editing.value = true
}

const cancelEdit = () => {
  editing.value = false
  editContent.value = ''
}

const saveEdit = () => {
  if (editContent.value.trim() && editContent.value.trim() !== props.message.content) {
    emit('edit', {
      messageId: props.message.id,
      content: editContent.value.trim()
    })
  }
  cancelEdit()
}

const confirmDelete = () => {
  deleteDialog.value = true
}

const deleteMessage = () => {
  emit('delete', props.message.id)
  deleteDialog.value = false
}
</script>

<style scoped>
.forum-message {
  transition: all 0.2s ease;
  border: 1px solid rgba(var(--v-border-color), 0.12);
}

.forum-message:hover {
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.own-message {
  background-color: rgba(var(--v-theme-primary), 0.05);
  border-color: rgba(var(--v-theme-primary), 0.2);
}

.message-content {
  white-space: pre-wrap;
  word-break: break-word;
  margin-left: 44px;
}

.edit-form {
  margin-top: 8px;
}

.message-actions {
  opacity: 0;
  transition: opacity 0.2s ease;
}

.forum-message:hover .message-actions {
  opacity: 1;
}

.gap-2 > * + * {
  margin-left: 8px;
}
</style>