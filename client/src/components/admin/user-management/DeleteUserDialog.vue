<!-- client/src/components/admin/user-management/DeleteUserDialog.vue -->
<template>
  <v-dialog
    :model-value="modelValue"
    @update:model-value="$emit('update:modelValue', $event)"
    max-width="500"
    persistent
  >
    <v-card>
      <v-card-title class="text-h5 font-weight-bold">
        Confirm User Deletion
      </v-card-title>
      
      <v-card-text>
        <v-alert
          type="warning"
          variant="tonal"
          class="mb-4"
        >
          <v-alert-title>This action cannot be undone</v-alert-title>
          <div class="text-body-2">
            Deleting this user will:
            <ul class="mt-2">
              <li>Remove their account from Firebase Authentication</li>
              <li>Delete their profile and all associated data</li>
              <li>Revoke all their access permissions</li>
            </ul>
          </div>
        </v-alert>

        <div v-if="user" class="user-info">
          <p class="text-body-1 mb-2">
            Are you sure you want to delete this user?
          </p>
          <v-card variant="outlined" density="compact">
            <v-card-text>
              <div class="d-flex align-center">
                <v-avatar color="error" size="40" class="mr-3">
                  <v-icon>mdi-account-remove</v-icon>
                </v-avatar>
                <div>
                  <div class="font-weight-medium">
                    {{ user.displayName || 'No Name' }}
                  </div>
                  <div class="text-caption text-medium-emphasis">
                    {{ user.email }}
                  </div>
                  <div class="text-caption">
                    Role: <RoleChip :role="user.role" size="x-small" />
                  </div>
                </div>
              </div>
            </v-card-text>
          </v-card>
        </div>
      </v-card-text>

      <v-card-actions>
        <v-spacer />
        <v-btn
          variant="text"
          @click="$emit('cancel')"
          :disabled="deleting"
        >
          Cancel
        </v-btn>
        <v-btn
          color="error"
          variant="flat"
          @click="$emit('confirm')"
          :loading="deleting"
        >
          <v-icon left>mdi-delete</v-icon>
          Delete User
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script setup>
import RoleChip from '../RoleChip.vue'

// Props
defineProps({
  modelValue: {
    type: Boolean,
    required: true
  },
  user: {
    type: Object,
    default: null
  },
  deleting: {
    type: Boolean,
    default: false
  }
})

// Emits
defineEmits(['update:modelValue', 'confirm', 'cancel'])
</script>

<style scoped>
.user-info {
  margin-top: 16px;
}
</style>