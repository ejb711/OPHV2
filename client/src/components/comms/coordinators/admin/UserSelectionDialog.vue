<!-- client/src/components/comms/coordinators/admin/UserSelectionDialog.vue -->
<template>
  <v-dialog
    v-model="dialogOpen"
    :max-width="$vuetify.display.smAndDown ? '100%' : '800'"
    :fullscreen="$vuetify.display.smAndDown"
    scrollable
    transition="dialog-bottom-transition"
  >
    <v-card>
      <v-toolbar
        :color="$vuetify.display.smAndDown ? 'primary' : 'transparent'"
        :dark="$vuetify.display.smAndDown"
        flat
      >
        <v-btn
          v-if="$vuetify.display.smAndDown"
          icon="mdi-close"
          @click="close"
        />
        <v-toolbar-title>
          <v-icon v-if="!$vuetify.display.smAndDown" start>mdi-account-search</v-icon>
          Select User
        </v-toolbar-title>
        <v-spacer />
        <v-btn
          v-if="!$vuetify.display.smAndDown"
          icon="mdi-close"
          variant="text"
          @click="close"
        />
      </v-toolbar>

      <v-divider />

      <v-card-text class="pa-0" :style="$vuetify.display.smAndDown ? '' : 'height: 500px;'">
        <!-- Search -->
        <div class="pa-4 pb-0">
          <v-text-field
            v-model="search"
            prepend-inner-icon="mdi-magnify"
            label="Search users by name or email"
            variant="outlined"
            density="compact"
            hide-details
            clearable
          />
        </div>

        <!-- Loading State -->
        <div v-if="loading" class="text-center py-8">
          <v-progress-circular indeterminate color="primary" />
          <p class="text-body-2 mt-2">Loading users...</p>
        </div>

        <!-- User List -->
        <v-list v-else>
          <template v-if="filteredUsers.length > 0">
            <v-list-item
              v-for="user in filteredUsers"
              :key="user.uid"
              @click="selectUser(user)"
              :disabled="isUserExcluded(user.uid)"
            >
              <template v-slot:prepend>
                <v-avatar color="primary">
                  <span class="text-subtitle-2">
                    {{ getInitials(user.displayName || user.email) }}
                  </span>
                </v-avatar>
              </template>

              <v-list-item-title>
                {{ user.displayName || user.name || user.email }}
              </v-list-item-title>

              <v-list-item-subtitle>
                <div>{{ user.email }}</div>
                <div v-if="user.role" class="text-caption">
                  Role: {{ user.role }}
                </div>
              </v-list-item-subtitle>

              <template v-slot:append>
                <v-chip
                  v-if="isUserExcluded(user.uid)"
                  size="small"
                  color="grey"
                  variant="tonal"
                >
                  Already Coordinator
                </v-chip>
                <v-icon v-else color="primary">mdi-chevron-right</v-icon>
              </template>
            </v-list-item>
          </template>

          <!-- No Results -->
          <v-list-item v-else>
            <v-list-item-title class="text-center text-grey">
              {{ search ? 'No users found matching your search' : 'No users available' }}
            </v-list-item-title>
          </v-list-item>
        </v-list>
      </v-card-text>

      <v-divider />

      <v-card-actions>
        <v-spacer />
        <v-btn variant="text" @click="close">Cancel</v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script setup>
import { ref, computed, watch, onMounted } from 'vue'
import { collection, query, getDocs, where, orderBy } from 'firebase/firestore'
import { db } from '@/firebase'

// Props & Emits
const props = defineProps({
  modelValue: {
    type: Boolean,
    default: false
  },
  excludedUserIds: {
    type: Array,
    default: () => []
  }
})

const emit = defineEmits(['update:modelValue', 'select'])

// State
const search = ref('')
const loading = ref(false)
const users = ref([])

// Computed
const dialogOpen = computed({
  get: () => props.modelValue,
  set: (value) => emit('update:modelValue', value)
})

const filteredUsers = computed(() => {
  if (!search.value) return users.value

  const searchLower = search.value.toLowerCase()
  return users.value.filter(user => {
    const name = (user.displayName || user.email || '').toLowerCase()
    const email = (user.email || '').toLowerCase()
    return name.includes(searchLower) || email.includes(searchLower)
  })
})

// Methods
function close() {
  dialogOpen.value = false
  search.value = ''
}

function getInitials(name) {
  if (!name) return '?'
  return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
}

function isUserExcluded(userId) {
  return props.excludedUserIds.includes(userId)
}

function selectUser(user) {
  if (!isUserExcluded(user.uid)) {
    emit('select', user)
    close()
  }
}

async function fetchUsers() {
  loading.value = true
  try {
    // Try to get all users first, then filter client-side
    const usersQuery = query(collection(db, 'users'))

    const snapshot = await getDocs(usersQuery)
    // Map and filter users
    const allUsers = snapshot.docs.map(doc => ({
      uid: doc.id,
      ...doc.data()
    }))

    // Filter for active users (consider users active if isActive is not explicitly false)
    users.value = allUsers
      .filter(user => {
        // Include user if:
        // - isActive is true
        // - isActive doesn't exist (assume active)
        // - isActive is not explicitly false
        const isActive = user.isActive !== false

        // Also filter out users with pending role
        const isNotPending = user.role !== 'pending'

        return isActive && isNotPending
      })
      .sort((a, b) => {
        const nameA = (a.displayName || a.name || a.email || '').toLowerCase()
        const nameB = (b.displayName || b.name || b.email || '').toLowerCase()
        return nameA.localeCompare(nameB)
      })

    } catch (error) {
    users.value = []
  } finally {
    loading.value = false
  }
}

// Lifecycle
onMounted(() => {
  if (dialogOpen.value) {
    fetchUsers()
  }
})

// Watch dialog open
watch(dialogOpen, (isOpen) => {
  if (isOpen && users.value.length === 0) {
    fetchUsers()
  }
})
</script>

<style scoped>
.v-list-item {
  border-bottom: 1px solid rgba(0, 0, 0, 0.05);
}

.v-list-item:hover {
  background-color: rgba(0, 0, 0, 0.02);
}

.v-list-item--disabled {
  opacity: 0.6;
}
</style>