<!-- client/src/components/comms/dashboard/CommsNotifications.vue -->
<!-- Notification snackbars component (~130 lines) -->
<!-- Props: delete-snackbar, success-snackbar, error-snackbar, etc. -->
<!-- Purpose: Display user notifications -->
<template>
  <div>
    <!-- Delete notification -->
    <v-snackbar
      v-model="deleteSnackbar"
      :color="deleteHard ? 'error' : 'warning'"
      timeout="5000"
    >
      Project {{ deleteHard ? 'permanently deleted' : 'moved to trash' }}
      <template v-slot:actions>
        <v-btn
          variant="text"
          @click="deleteSnackbar = false"
        >
          Close
        </v-btn>
      </template>
    </v-snackbar>

    <!-- Success notification -->
    <v-snackbar
      v-model="successSnackbar"
      color="success"
      timeout="3000"
    >
      {{ successMessage }}
      <template v-slot:actions>
        <v-btn
          variant="text"
          @click="successSnackbar = false"
        >
          Close
        </v-btn>
      </template>
    </v-snackbar>

    <!-- Error notification -->
    <v-snackbar
      v-model="errorSnackbar"
      color="error"
      timeout="5000"
    >
      {{ errorMessage }}
      <template v-slot:actions>
        <v-btn
          variant="text"
          @click="errorSnackbar = false"
        >
          Close
        </v-btn>
      </template>
    </v-snackbar>
  </div>
</template>

<script setup>
// Model bindings
const deleteSnackbar = defineModel('deleteSnackbar', {
  type: Boolean,
  default: false
})

const successSnackbar = defineModel('successSnackbar', {
  type: Boolean,
  default: false
})

const errorSnackbar = defineModel('errorSnackbar', {
  type: Boolean,
  default: false
})

// Props
defineProps({
  deleteHard: {
    type: Boolean,
    default: false
  },
  successMessage: {
    type: String,
    default: ''
  },
  errorMessage: {
    type: String,
    default: ''
  }
})
</script>