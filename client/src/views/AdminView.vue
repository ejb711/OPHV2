<!-- src/views/AdminView.vue -->
<script setup>
import { ref, onMounted }  from 'vue'
import { db }              from '../firebase'
import { collection,
         getDocs,
         updateDoc,
         doc }             from 'firebase/firestore'
import AppLayout            from '../components/AppLayout.vue'

const pending = ref([])

onMounted(async () => {
  const snap = await getDocs(collection(db, 'users'))
  pending.value = snap.docs
    .filter(d => d.data().role === 'pending')
    .map(d => ({ id: d.id, ...d.data() }))
})

async function approve(id) {
  await updateDoc(doc(db, 'users', id), { role: 'viewer' })
  pending.value = pending.value.filter(u => u.id !== id)
}
</script>

<template>
  <AppLayout>
    <h2 class="text-h5 mb-4">Pending users</h2>

    <div v-if="pending.length === 0">
      No pending users
      <span>🎉</span>
    </div>

    <v-card
      v-for="u in pending"
      :key="u.id"
      class="mb-2 pa-3 d-flex align-center justify-space-between"
    >
      <span>{{ u.email }}</span>
      <v-btn color="secondary" @click="approve(u.id)">Approve</v-btn>
    </v-card>
  </AppLayout>
</template>
