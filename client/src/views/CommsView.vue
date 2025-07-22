<template>
  <AppLayout>
    <CommsDashboard />
  </AppLayout>
</template>

<script setup>
import AppLayout from '@/components/AppLayout.vue'
import CommsDashboard from '@/components/comms/CommsDashboard.vue'
import { usePermissions } from '@/composables/usePermissions'
import { useRouter } from 'vue-router'
import { onMounted } from 'vue'

const router = useRouter()
const { hasPermission } = usePermissions()

// Redirect if user doesn't have permission
onMounted(() => {
  if (!hasPermission('view_comms')) {
    router.push('/dash')
  }
})
</script>