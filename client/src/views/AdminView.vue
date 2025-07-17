<!-- src/views/AdminView.vue -->
<script setup>
import { ref, onMounted }  from 'vue'
import { db, auth }        from '../firebase'
import { collection,
         getDocs,
         updateDoc,
         doc }             from 'firebase/firestore'
import AppLayout            from '../components/AppLayout.vue'

const pending = ref([])
const loading = ref(true)
const error = ref('')

onMounted(async () => {
  try {
    // Wait for fresh token with custom claims
    await auth.currentUser.getIdToken(true) // force refresh
    
    const snap = await getDocs(collection(db, 'users'))
    pending.value = snap.docs
      .filter(d => d.data().role === 'pending')
      .map(d => ({ id: d.id, ...d.data() }))
  } catch (err) {
    console.error('Error loading pending users:', err)
    error.value = err.message
  } finally {
    loading.value = false
  }
})

async function approve(id) {
  try {
    await updateDoc(doc(db, 'users', id), { role: 'viewer' })
    pending.value = pending.value.filter(u => u.id !== id)
  } catch (err) {
    console.error('Error approving user:', err)
    error.value = err.message
  }
}
</script>

<template>
  <AppLayout>
    <h2 class="text-h5 mb-4">Pending users</h2>

    <div v-if="loading">
      <v-progress-circular indeterminate />
      Loading...
    </div>

    <v-alert v-else-if="error" type="error" class="mb-4">
      {{ error }}
    </v-alert>

    <div v-else-if="pending.length === 0">
      No pending users
      <span>🎉</span>
    </div>

    <v-card
      v-else
      v-for="u in pending"
      :key="u.id"
      class="mb-2 pa-3 d-flex align-center justify-space-between"
    >
      <span>{{ u.email }}</span>
      <v-btn color="secondary" @click="approve(u.id)">Approve</v-btn>
    </v-card>
  </AppLayout>
</template>