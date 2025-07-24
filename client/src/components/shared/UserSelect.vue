<!-- client/src/components/shared/UserSelect.vue -->
<template>
  <v-autocomplete
    v-model="internalValue"
    :items="users"
    :label="label"
    :clearable="clearable"
    :multiple="multiple"
    :loading="loading"
    item-title="displayName"
    item-value="uid"
    :variant="variant"
    :density="density"
    hide-details
    @update:model-value="$emit('update:modelValue', $event)"
  >
    <template v-slot:item="{ props, item }">
      <v-list-item
        v-bind="props"
        :title="item.raw.displayName"
        :subtitle="item.raw.email"
      />
    </template>

    <template v-slot:selection="{ item, index }">
      <v-chip
        v-if="multiple"
        size="small"
        closable
        @click:close="removeSelection(index)"
      >
        {{ item.raw.displayName }}
      </v-chip>
      <span v-else>{{ item.raw.displayName }}</span>
    </template>
  </v-autocomplete>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { collection, getDocs } from 'firebase/firestore'
import { db } from '@/firebase'

// Props
const props = defineProps({
  modelValue: {
    type: [String, Array],
    default: null
  },
  label: {
    type: String,
    default: 'Select User'
  },
  clearable: {
    type: Boolean,
    default: true
  },
  multiple: {
    type: Boolean,
    default: false
  },
  variant: {
    type: String,
    default: 'outlined'
  },
  density: {
    type: String,
    default: 'comfortable'
  }
})

// Emits
const emit = defineEmits(['update:modelValue'])

// State
const users = ref([])
const loading = ref(false)

// Computed
const internalValue = computed({
  get: () => props.modelValue,
  set: (value) => emit('update:modelValue', value)
})

// Methods
async function loadUsers() {
  loading.value = true
  try {
    const snapshot = await getDocs(collection(db, 'users'))
    users.value = snapshot.docs.map(doc => ({
      uid: doc.id,
      ...doc.data(),
      displayName: doc.data().displayName || doc.data().email
    }))
  } catch (error) {
    console.error('Error loading users:', error)
  } finally {
    loading.value = false
  }
}

function removeSelection(index) {
  if (props.multiple && Array.isArray(internalValue.value)) {
    const newValue = [...internalValue.value]
    newValue.splice(index, 1)
    internalValue.value = newValue
  }
}

// Lifecycle
onMounted(() => {
  loadUsers()
})
</script>