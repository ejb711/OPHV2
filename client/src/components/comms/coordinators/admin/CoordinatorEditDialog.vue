<!-- client/src/components/comms/coordinators/admin/CoordinatorEditDialog.vue -->
<template>
  <v-dialog
    v-model="dialogOpen"
    :max-width="$vuetify.display.smAndDown ? '100%' : '600'"
    :fullscreen="$vuetify.display.smAndDown"
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
          icon="mdi-arrow-left"
          @click="close"
        />
        <v-toolbar-title>
          <v-icon v-if="!$vuetify.display.smAndDown" start>mdi-account-edit</v-icon>
          Edit Coordinator
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

      <v-form ref="formRef" v-model="isValid">
        <v-card-text>
          <!-- Display Name -->
          <div class="mb-4">
            <label class="text-subtitle-2 d-block mb-1">Display Name</label>
            <v-text-field
              v-model="localData.displayName"
              :rules="[rules.required]"
              variant="outlined"
              density="comfortable"
              placeholder="Enter display name"
            />
          </div>

          <!-- Email (Read-only) -->
          <div class="mb-4">
            <label class="text-subtitle-2 d-block mb-1">Email</label>
            <v-text-field
              :model-value="coordinator?.email"
              variant="outlined"
              density="comfortable"
              readonly
              disabled
            />
          </div>

          <!-- Region Assignment -->
          <div class="mb-4">
            <label class="text-subtitle-2 d-block mb-1">Assigned Regions</label>
            <v-select
              v-model="localData.regions"
              :items="regionOptions"
              item-title="name"
              item-value="id"
              multiple
              chips
              closable-chips
              variant="outlined"
              density="comfortable"
              :rules="[rules.required]"
              placeholder="Select regions"
            >
              <template v-slot:chip="{ item, props: chipProps }">
                <v-chip
                  v-bind="chipProps"
                  :color="item.value === localData.primaryRegion ? 'primary' : 'default'"
                >
                  {{ item.title }}
                  <v-icon v-if="item.value === localData.primaryRegion" end size="x-small">mdi-star</v-icon>
                </v-chip>
              </template>
            </v-select>
            <p class="text-caption text-grey mt-1">
              Coordinator can manage projects in these regions
            </p>
          </div>

          <!-- Primary Region -->
          <div class="mb-4">
            <label class="text-subtitle-2 d-block mb-1">Primary Region</label>
            <v-select
              v-model="localData.primaryRegion"
              :items="assignedRegionOptions"
              item-title="name"
              item-value="id"
              variant="outlined"
              density="comfortable"
              :rules="[rules.primaryRegion]"
              placeholder="Select primary region"
            />
            <p class="text-caption text-grey mt-1">
              This coordinator will be the default for this region
            </p>
          </div>
        </v-card-text>

        <v-divider />

        <v-card-actions>
          <v-spacer />
          <v-btn variant="text" @click="close">Cancel</v-btn>
          <v-btn 
            color="primary" 
            variant="flat" 
            @click="save"
            :disabled="!isValid || !hasChanges"
            :loading="saving"
          >
            Save Changes
          </v-btn>
        </v-card-actions>
      </v-form>
    </v-card>
  </v-dialog>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import { LOUISIANA_REGIONS } from '@/config/louisiana-regions'

// Props & Emits
const props = defineProps({
  modelValue: {
    type: Boolean,
    default: false
  },
  coordinator: {
    type: Object,
    default: null
  }
})

const emit = defineEmits(['update:modelValue', 'save'])

// State
const formRef = ref(null)
const isValid = ref(false)
const saving = ref(false)
const localData = ref({
  displayName: '',
  regions: [],
  primaryRegion: null
})

// Original data for comparison
const originalData = ref({})

// Computed
const dialogOpen = computed({
  get: () => props.modelValue,
  set: (value) => emit('update:modelValue', value)
})

const regionOptions = computed(() => 
  Object.entries(LOUISIANA_REGIONS).map(([id, region]) => ({
    id,
    name: region.name
  }))
)

const assignedRegionOptions = computed(() => {
  if (!localData.value.regions || localData.value.regions.length === 0) {
    return []
  }
  
  return localData.value.regions.map(regionId => ({
    id: regionId,
    name: LOUISIANA_REGIONS[regionId]?.name || regionId
  }))
})

const hasChanges = computed(() => {
  return JSON.stringify(localData.value) !== JSON.stringify(originalData.value)
})

// Validation rules
const rules = {
  required: (v) => !!v || 'This field is required',
  primaryRegion: (v) => {
    if (!localData.value.regions || localData.value.regions.length === 0) return true
    if (!v) return true
    return localData.value.regions.includes(v) || 'Primary region must be one of the assigned regions'
  }
}

// Methods
function close() {
  dialogOpen.value = false
  resetForm()
}

function resetForm() {
  localData.value = {
    displayName: '',
    regions: [],
    primaryRegion: null
  }
  originalData.value = {}
  if (formRef.value) {
    formRef.value.resetValidation()
  }
}

async function save() {
  if (!formRef.value || !isValid.value || !hasChanges.value) return
  
  const validation = await formRef.value.validate()
  if (!validation.valid) return
  
  saving.value = true
  
  // Prepare update data
  const updateData = {
    displayName: localData.value.displayName,
    name: localData.value.displayName, // Keep name in sync
    regions: localData.value.regions,
    primaryRegion: localData.value.primaryRegion || null
  }
  
  emit('save', updateData)
  saving.value = false
}

// Initialize form when coordinator changes
function initializeForm() {
  if (props.coordinator) {
    localData.value = {
      displayName: props.coordinator.displayName || props.coordinator.name || '',
      regions: props.coordinator.regions || [],
      primaryRegion: props.coordinator.primaryRegion || null
    }
    originalData.value = JSON.parse(JSON.stringify(localData.value))
  }
}

// Watch for coordinator changes
watch(() => props.coordinator, () => {
  if (dialogOpen.value && props.coordinator) {
    initializeForm()
  }
}, { immediate: true })

// Watch for regions changes to validate primary region
watch(() => localData.value.regions, (newRegions) => {
  // If primary region is not in the new regions list, clear it
  if (localData.value.primaryRegion && !newRegions.includes(localData.value.primaryRegion)) {
    localData.value.primaryRegion = null
  }
})
</script>

<style scoped>
label {
  font-weight: 500;
  color: rgba(0, 0, 0, 0.87);
}

.v-card-actions {
  padding: 16px 24px;
}
</style>