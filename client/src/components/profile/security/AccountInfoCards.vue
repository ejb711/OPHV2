<!-- client/src/components/profile/security/AccountInfoCards.vue -->
<template>
  <v-row>
    <v-col cols="12" md="6">
      <v-card variant="outlined" class="pa-4 brand-info-card">
        <h3 class="text-subtitle-1 font-weight-bold mb-2">Account Status</h3>
        <div class="d-flex align-center gap-2 mb-2">
          <v-chip 
            :color="getRoleColor(authStore.userRole)" 
            size="small" 
            variant="flat"
          >
            {{ authStore.userRole?.toUpperCase() || 'Unknown' }}
          </v-chip>
          <v-chip color="success" size="small" variant="outlined">
            Active
          </v-chip>
        </div>
        <p class="text-body-2 text-medium-emphasis">
          Account created: {{ formatDate(authStore.userDocument?.createdAt) }}
        </p>
      </v-card>
    </v-col>

    <v-col cols="12" md="6">
      <v-card variant="outlined" class="pa-4 brand-info-card">
        <h3 class="text-subtitle-1 font-weight-bold mb-2">Email Verification</h3>
        <div class="d-flex align-center gap-2 mb-2">
          <v-icon 
            :color="currentUser?.emailVerified ? 'success' : 'warning'"
            size="small"
          >
            {{ currentUser?.emailVerified ? 'mdi-email-check' : 'mdi-email-alert' }}
          </v-icon>
          <span class="text-body-2">
            {{ currentUser?.emailVerified ? 'Email verified' : 'Email not verified' }}
          </span>
        </div>
        <v-btn
          v-if="!currentUser?.emailVerified"
          variant="outlined"
          size="small"
          @click="sendVerificationEmail"
          :loading="loading"
        >
          Send Verification Email
        </v-btn>
      </v-card>
    </v-col>
  </v-row>
</template>

<script setup>
import { ref, computed } from 'vue'
import { sendEmailVerification } from 'firebase/auth'
import { auth } from '../../../firebase'
import { useAuthStore } from '../../../stores/auth'

const authStore = useAuthStore()
const loading = ref(false)

const emit = defineEmits(['show-snackbar'])

const currentUser = computed(() => auth.currentUser)

const sendVerificationEmail = async () => {
  loading.value = true
  try {
    const user = auth.currentUser
    if (!user) throw new Error('No authenticated user')
    
    await sendEmailVerification(user)
    emit('show-snackbar', 'Verification email sent', 'success')
  } catch (error) {
    console.error('Error sending verification email:', error)
    emit('show-snackbar', 'Failed to send verification email', 'error')
  } finally {
    loading.value = false
  }
}

const getRoleColor = (role) => {
  const colors = {
    owner: 'purple',
    admin: 'primary',
    user: 'info',
    viewer: 'success',
    pending: 'warning'
  }
  return colors[role] || 'grey'
}

const formatDate = (date) => {
  if (!date) return 'Unknown'
  const d = date.toDate ? date.toDate() : new Date(date)
  return d.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  })
}
</script>

<style scoped>
/* Louisiana Department of Health Brand Colors */
.brand-info-card {
  background-color: #f5f5f5;
  border: 1px solid #e0e0e0;
}

.brand-info-card:hover {
  border-color: #1976d2;
  transition: border-color 0.2s ease;
}
</style>