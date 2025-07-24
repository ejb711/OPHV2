<!-- client/src/components/comms/forum/ForumComposer.vue -->
<template>
  <div class="forum-composer-minimal">
    <textarea
      v-model="messageContent"
      :placeholder="placeholder"
      :disabled="disabled || sending"
      class="message-input"
      @keydown.enter.ctrl="sendMessage"
      @keydown.enter.meta="sendMessage"
    />
    <div class="controls">
      <span class="hint">
        <kbd>Ctrl</kbd> + <kbd>Enter</kbd> to send
      </span>
      <v-btn
        color="primary"
        size="small"
        variant="flat"
        :disabled="!canSend"
        :loading="sending"
        @click="sendMessage"
      >
        Send
      </v-btn>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'

const props = defineProps({
  disabled: {
    type: Boolean,
    default: false
  },
  sending: {
    type: Boolean,
    default: false
  },
  placeholder: {
    type: String,
    default: 'Type your message here...'
  }
})

const emit = defineEmits(['send'])

// Local state
const messageContent = ref('')

// Computed
const canSend = computed(() => {
  return !props.disabled && 
         !props.sending && 
         messageContent.value.trim().length > 0
})

// Methods
const sendMessage = () => {
  if (!canSend.value) return
  
  const content = messageContent.value.trim()
  if (content) {
    emit('send', content)
    messageContent.value = ''
  }
}
</script>

<style scoped>
.forum-composer-minimal {
  display: flex;
  align-items: flex-end;
  gap: 8px;
  padding: 0;
  margin: 0;
}

.message-input {
  flex: 1;
  height: 100px;
  min-height: 100px;
  max-height: 100px;
  padding: 12px 14px;
  border: 1px solid rgba(0, 0, 0, 0.23);
  border-radius: 4px;
  font-family: inherit;
  font-size: 0.875rem;
  line-height: 1.4;
  resize: none;
  outline: none;
  overflow-y: auto;
  background-color: white;
  transition: border-color 0.2s ease;
}

.message-input:focus {
  border-color: #1976d2;
  border-width: 2px;
  padding: 11px 13px;
}

.message-input:disabled {
  background-color: rgba(0, 0, 0, 0.04);
  color: rgba(0, 0, 0, 0.38);
  cursor: not-allowed;
}

.message-input::placeholder {
  color: rgba(0, 0, 0, 0.38);
}

.controls {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 4px;
  padding-bottom: 4px;
}

.hint {
  font-size: 0.75rem;
  color: rgba(0, 0, 0, 0.6);
  white-space: nowrap;
}

kbd {
  background-color: rgba(0, 0, 0, 0.08);
  border-radius: 3px;
  padding: 1px 3px;
  font-size: 0.7em;
  font-family: monospace;
}

/* Scrollbar styling */
.message-input::-webkit-scrollbar {
  width: 6px;
}

.message-input::-webkit-scrollbar-track {
  background: #f1f1f1;
  border-radius: 3px;
}

.message-input::-webkit-scrollbar-thumb {
  background: #888;
  border-radius: 3px;
}

.message-input::-webkit-scrollbar-thumb:hover {
  background: #555;
}
</style>