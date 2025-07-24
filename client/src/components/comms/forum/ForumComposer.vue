<!-- client/src/components/comms/forum/ForumComposer.vue -->
<template>
  <v-card variant="outlined" class="forum-composer">
    <v-card-text>
      <v-textarea
        v-model="messageContent"
        :placeholder="placeholder"
        :rows="2"
        :disabled="disabled || sending"
        variant="outlined"
        density="compact"
        hide-details
        auto-grow
        @keydown.enter.ctrl="sendMessage"
        @keydown.enter.meta="sendMessage"
      />
      <div class="d-flex align-center justify-space-between mt-3">
        <div class="text-caption text-grey">
          <kbd>Ctrl</kbd> + <kbd>Enter</kbd> to send
        </div>
        <v-btn
          color="primary"
          :disabled="!canSend"
          :loading="sending"
          @click="sendMessage"
        >
          <v-icon left>mdi-send</v-icon>
          Send Message
        </v-btn>
      </div>
    </v-card-text>
  </v-card>
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
.forum-composer {
  border: 2px solid rgba(var(--v-theme-primary), 0.2);
  transition: border-color 0.2s ease;
}

.forum-composer:focus-within {
  border-color: rgba(var(--v-theme-primary), 0.5);
}

kbd {
  background-color: rgba(var(--v-theme-on-surface), 0.1);
  border-radius: 3px;
  padding: 2px 4px;
  font-size: 0.8em;
  font-family: monospace;
}
</style>