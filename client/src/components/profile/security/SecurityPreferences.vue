<!-- client/src/components/profile/security/SecurityPreferences.vue -->
<template>
  <v-card variant="outlined" class="mt-4">
    <v-card-title class="d-flex align-center gap-2">
      <v-icon color="primary">mdi-shield-check</v-icon>
      Security Preferences
    </v-card-title>
    
    <v-card-text>
      <v-row>
        <v-col cols="12" md="6">
          <v-select
            v-model="securitySettings.sessionTimeout"
            :items="sessionTimeoutOptions"
            label="Session Timeout (minutes)"
            variant="solo-filled"
            density="comfortable"
            flat
            item-title="text"
            item-value="value"
            @update:modelValue="$emit('update-settings')"
          >
            <template v-slot:item="{ props, item }">
              <v-list-item 
                v-bind="props" 
                :class="{ 'text-warning': item.value === 1 }"
              />
            </template>
          </v-select>
          <p class="text-caption text-medium-emphasis mt-1">
            How long to stay logged in when inactive
            <span v-if="securitySettings.sessionTimeout === 1" class="text-warning">
              (Testing mode - very short timeout)
            </span>
          </p>
        </v-col>

        <v-col cols="12" md="6">
          <v-switch
            v-model="securitySettings.allowMultipleSessions"
            label="Allow Multiple Sessions"
            color="primary"
            inset
            @change="$emit('update-settings')"
          />
          <p class="text-caption text-medium-emphasis ml-8">
            Allow logging in from multiple devices simultaneously
          </p>
        </v-col>

        <v-col cols="12" md="6">
          <v-switch
            v-model="securitySettings.requirePasswordChange"
            label="Require Periodic Password Change"
            color="primary"
            inset
            @change="$emit('update-settings')"
          />
          <p class="text-caption text-medium-emphasis ml-8">
            Require password change every 90 days
          </p>
        </v-col>
      </v-row>

      <v-divider class="my-4" />

      <div class="d-flex gap-3 flex-wrap">
        <v-btn
          variant="outlined"
          color="warning"
          @click="$emit('revoke-sessions')"
          :loading="loading"
        >
          <v-icon left>mdi-logout-variant</v-icon>
          Revoke All Sessions
        </v-btn>
        
        <v-btn
          variant="outlined"
          color="info"
          @click="$emit('download-data')"
          :loading="loading"
        >
          <v-icon left>mdi-download</v-icon>
          Download My Data
        </v-btn>
      </div>
    </v-card-text>
  </v-card>
</template>

<script setup>
defineProps({
  securitySettings: {
    type: Object,
    required: true
  },
  sessionTimeoutOptions: {
    type: Array,
    required: true
  },
  loading: {
    type: Boolean,
    default: false
  }
})

defineEmits(['update-settings', 'revoke-sessions', 'download-data'])
</script>

<style scoped>
/* Card styling */
:deep(.v-card) {
  border-radius: 8px;
}

:deep(.v-card-title) {
  font-size: 1.125rem;
  font-weight: 600;
  padding: 16px;
}

/* Switch styling */
:deep(.v-switch .v-selection-control) {
  min-height: auto;
}
</style>