<!-- client/src/components/admin/user-management/UserEditDialog.vue -->
<template>
  <v-dialog :model-value="modelValue" @update:model-value="$emit('update:modelValue', $event)" max-width="600">
    <v-card>
      <v-card-title>
        <span class="text-h5">Edit User Permissions</span>
      </v-card-title>
      
      <v-card-text>
        <v-form ref="editFormRef" v-model="editFormValid">
          <v-row>
            <v-col cols="12">
              <v-text-field
                v-model="formData.email"
                label="Email"
                variant="outlined"
                readonly
                disabled
              />
            </v-col>
            
            <v-col cols="12">
              <v-select
                v-model="formData.role"
                :items="roles"
                item-title="name"
                item-value="id"
                label="Role"
                variant="outlined"
                :rules="[v => !!v || 'Role is required']"
              />
            </v-col>
            
            <v-col cols="12">
              <v-autocomplete
                v-model="formData.customPermissions"
                :items="permissions"
                item-title="name"
                item-value="id"
                label="Custom Permissions"
                variant="outlined"
                multiple
                chips
                closable-chips
              >
                <template #chip="{ props, item }">
                  <v-chip
                    v-bind="props"
                    color="primary"
                    text-color="white"
                    size="small"
                    closable
                  >
                    {{ item.raw.name }}
                  </v-chip>
                </template>
              </v-autocomplete>
            </v-col>
            
            <v-col cols="12">
              <v-autocomplete
                v-model="formData.deniedPermissions"
                :items="permissions"
                item-title="name"
                item-value="id"
                label="Denied Permissions"
                variant="outlined"
                multiple
                chips
                closable-chips
              >
                <template #chip="{ props, item }">
                  <v-chip
                    v-bind="props"
                    color="error"
                    text-color="white"
                    size="small"
                    closable
                  >
                    {{ item.raw.name }}
                  </v-chip>
                </template>
              </v-autocomplete>
            </v-col>
          </v-row>
        </v-form>
      </v-card-text>
      
      <v-card-actions>
        <v-spacer />
        <v-btn
          variant="text"
          @click="$emit('cancel')"
          :disabled="saving"
        >
          Cancel
        </v-btn>
        <v-btn
          color="primary"
          variant="flat"
          @click="handleSave"
          :loading="saving"
          :disabled="!editFormValid"
        >
          Save Changes
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script setup>
import { ref, watch, reactive } from 'vue'

// Props
const props = defineProps({
  modelValue: {
    type: Boolean,
    required: true
  },
  user: {
    type: Object,
    default: null
  },
  roles: {
    type: Array,
    required: true
  },
  permissions: {
    type: Array,
    required: true
  },
  saving: {
    type: Boolean,
    default: false
  }
})

// Emits
const emit = defineEmits(['update:modelValue', 'save', 'cancel'])

// Form data
const editFormRef = ref(null)
const editFormValid = ref(false)
const formData = reactive({
  email: '',
  role: '',
  customPermissions: [],
  deniedPermissions: []
})

// Watch for user changes
watch(() => props.user, (newUser) => {
  if (newUser) {
    formData.email = newUser.email
    formData.role = newUser.role
    formData.customPermissions = newUser.customPermissions || []
    formData.deniedPermissions = newUser.deniedPermissions || []
  }
}, { immediate: true })

// Methods
const handleSave = () => {
  if (editFormRef.value?.validate()) {
    emit('save', {
      ...formData,
      id: props.user?.id
    })
  }
}
</script>