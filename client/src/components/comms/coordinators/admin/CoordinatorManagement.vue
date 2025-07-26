<!-- client/src/components/comms/coordinators/admin/CoordinatorManagement.vue -->
<template>
  <v-dialog
    v-model="dialogOpen"
    max-width="1200"
    fullscreen
    transition="dialog-bottom-transition"
  >
    <v-card>
      <!-- Header -->
      <v-card-title class="d-flex align-center pa-6 bg-grey-lighten-5">
        <div class="d-flex align-center">
          <div class="rounded-lg pa-2 mr-4" style="background-color: rgba(33, 150, 243, 0.1);">
            <v-icon size="28" color="primary">mdi-account-cog</v-icon>
          </div>
          <div>
            <h2 class="text-h5 font-weight-bold text-grey-darken-3 mb-1">Manage Communications Coordinators</h2>
            <p class="text-body-2 text-grey-darken-1 mb-0">Assign users as coordinators and manage their regional assignments</p>
          </div>
        </div>
        <v-spacer />
        <v-btn
          icon="mdi-close"
          variant="text"
          size="small"
          @click="close"
        />
      </v-card-title>

      <v-divider />

      <!-- Content -->
      <v-card-text class="pa-0">
        <v-container fluid>
          <v-row>
            <!-- Coordinators List -->
            <v-col cols="12" md="8">
              <v-card flat>
                <v-card-title class="d-flex align-center justify-space-between">
                  <span>Current Coordinators</span>
                  <v-btn
                    color="primary"
                    prepend-icon="mdi-account-plus"
                    @click="showUserSelection = true"
                  >
                    Add Coordinator
                  </v-btn>
                </v-card-title>
                
                <v-card-text>
                  <!-- Loading State -->
                  <div v-if="loading" class="text-center py-8">
                    <v-progress-circular indeterminate color="primary" />
                    <p class="text-body-2 mt-2">Loading coordinators...</p>
                  </div>

                  <!-- Coordinators Table -->
                  <v-data-table
                    v-else
                    :headers="headers"
                    :items="coordinatorsWithDisplayName"
                    :loading="loading"
                    :search="search"
                    class="elevation-1"
                  >
                    <!-- Search slot -->
                    <template v-slot:top>
                      <v-text-field
                        v-model="search"
                        prepend-inner-icon="mdi-magnify"
                        label="Search coordinators"
                        single-line
                        hide-details
                        variant="outlined"
                        density="compact"
                        class="mx-4 mb-4"
                      />
                    </template>

                    <!-- Name slot -->
                    <template v-slot:item.displayName="{ item }">
                      <div class="d-flex align-center py-2">
                        <v-avatar size="40" color="primary">
                          <span class="text-subtitle-2">
                            {{ getInitials(item.displayName || item.name || item.email) }}
                          </span>
                        </v-avatar>
                        <div class="ml-3">
                          <div class="font-weight-medium">{{ item.displayName || item.name || item.email || item.id }}</div>
                          <div class="text-caption text-grey-darken-1">{{ item.email || item.userEmail }}</div>
                        </div>
                      </div>
                    </template>

                    <!-- Regions slot -->
                    <template v-slot:item.regions="{ item }">
                      <v-chip-group>
                        <v-chip
                          v-for="regionId in item.regions"
                          :key="regionId"
                          size="small"
                          :color="regionId === item.primaryRegion ? 'primary' : 'default'"
                          :variant="regionId === item.primaryRegion ? 'flat' : 'outlined'"
                        >
                          {{ getRegionName(regionId) }}
                          <v-icon v-if="regionId === item.primaryRegion" end size="x-small">mdi-star</v-icon>
                        </v-chip>
                      </v-chip-group>
                    </template>

                    <!-- Actions slot -->
                    <template v-slot:item.actions="{ item }">
                      <v-btn
                        icon="mdi-pencil"
                        size="small"
                        variant="text"
                        @click="editCoordinator(item)"
                      />
                      <v-btn
                        icon="mdi-delete"
                        size="small"
                        variant="text"
                        color="error"
                        @click="confirmDelete(item)"
                      />
                    </template>
                  </v-data-table>
                </v-card-text>
              </v-card>
            </v-col>

            <!-- Stats/Info Panel -->
            <v-col cols="12" md="4">
              <v-card flat>
                <v-card-title>Regional Coverage</v-card-title>
                <v-card-text>
                  <v-list>
                    <v-list-item
                      v-for="(region, regionId) in LOUISIANA_REGIONS"
                      :key="regionId"
                      :title="region.name"
                      :subtitle="getRegionCoordinatorInfo(regionId)"
                    >
                      <template v-slot:prepend>
                        <v-icon :color="hasCoordinatorForRegion(regionId) ? 'success' : 'warning'">
                          {{ hasCoordinatorForRegion(regionId) ? 'mdi-check-circle' : 'mdi-alert-circle' }}
                        </v-icon>
                      </template>
                    </v-list-item>
                  </v-list>
                </v-card-text>
              </v-card>

              <!-- Info Card -->
              <v-card flat class="mt-4">
                <v-card-title>
                  <v-icon start>mdi-information</v-icon>
                  About Coordinators
                </v-card-title>
                <v-card-text>
                  <p class="text-body-2">Communications coordinators manage projects within their assigned regions.</p>
                  <ul class="text-body-2 ml-4 mt-2">
                    <li>Each region should have at least one coordinator</li>
                    <li>Coordinators can manage multiple regions</li>
                    <li>One region is marked as primary (starred)</li>
                    <li>Only users with active accounts can be coordinators</li>
                  </ul>
                </v-card-text>
              </v-card>
            </v-col>
          </v-row>
        </v-container>
      </v-card-text>
    </v-card>

    <!-- User Selection Dialog -->
    <UserSelectionDialog
      v-model="showUserSelection"
      :excluded-user-ids="existingCoordinatorIds"
      @select="addNewCoordinator"
    />

    <!-- Edit Coordinator Dialog -->
    <CoordinatorEditDialog
      v-model="showEditDialog"
      :coordinator="selectedCoordinator"
      @save="updateCoordinator"
    />

    <!-- Delete Confirmation Dialog -->
    <v-dialog v-model="showDeleteDialog" max-width="500">
      <v-card>
        <v-card-title>Remove Coordinator</v-card-title>
        <v-card-text>
          Are you sure you want to remove <strong>{{ selectedCoordinator?.displayName || selectedCoordinator?.name }}</strong> as a coordinator?
          <v-alert type="warning" variant="tonal" class="mt-3">
            This will remove all regional assignments. Projects assigned to this coordinator will remain unchanged.
          </v-alert>
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn variant="text" @click="showDeleteDialog = false">Cancel</v-btn>
          <v-btn color="error" variant="flat" @click="deleteCoordinator" :loading="deleting">Remove</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </v-dialog>
</template>

<script setup>
import { ref, computed, watch, onMounted } from 'vue'
import { useCoordinatorManagement } from '@/composables/comms/useCoordinatorManagement'
import { useCoordinatorSelection } from '@/composables/comms/useCoordinatorSelection'
import { LOUISIANA_REGIONS } from '@/config/louisiana-regions'
import UserSelectionDialog from './UserSelectionDialog.vue'
import CoordinatorEditDialog from './CoordinatorEditDialog.vue'
import { useSnackbar } from '@/composables/useSnackbar'

// Props & Emits
const props = defineProps({
  modelValue: {
    type: Boolean,
    default: false
  }
})

const emit = defineEmits(['update:modelValue', 'coordinator-updated'])

// Composables - Management functions
const { 
  createCoordinator, 
  updateCoordinator: updateCoordinatorData, 
  deleteCoordinator: deleteCoordinatorData 
} = useCoordinatorManagement()

// Composables - Selection and display (SAME AS ProjectRegionCoordinator)
const {
  allCoordinators,
  loadingCoordinators,
  loadAllCoordinators,
  getCoordinatorDisplayName
} = useCoordinatorSelection()

const { showSuccess, showError } = useSnackbar()

// Use allCoordinators as coordinators for consistency
const coordinators = computed(() => allCoordinators.value)
const loading = computed(() => loadingCoordinators.value)

// State
const search = ref('')
const showUserSelection = ref(false)
const showEditDialog = ref(false)
const showDeleteDialog = ref(false)
const selectedCoordinator = ref(null)
const deleting = ref(false)

// Computed
const dialogOpen = computed({
  get: () => props.modelValue,
  set: (value) => emit('update:modelValue', value)
})

const headers = [
  { title: 'Coordinator', key: 'displayName', sortable: true },
  { title: 'Regions', key: 'regions', sortable: false },
  { title: 'Actions', key: 'actions', sortable: false, align: 'end' }
]

const existingCoordinatorIds = computed(() => 
  coordinators.value.map(c => c.userId || c.id)
)

// Transform coordinators to ensure displayName is properly set USING THE SAME METHOD AS ProjectRegionCoordinator
const coordinatorsWithDisplayName = computed(() => {
  return coordinators.value.map(coord => ({
    ...coord,
    displayName: getCoordinatorDisplayName(coord.id) // USE THE EXACT SAME FUNCTION!
  }))
})

// Methods
function close() {
  dialogOpen.value = false
}

function getInitials(name) {
  if (!name) return '?'
  return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
}

function getRegionName(regionId) {
  return LOUISIANA_REGIONS[regionId]?.name || regionId
}

function hasCoordinatorForRegion(regionId) {
  return coordinatorsWithDisplayName.value.some(c => c.regions.includes(regionId))
}

function getRegionCoordinatorInfo(regionId) {
  const coords = coordinatorsWithDisplayName.value.filter(c => c.regions.includes(regionId))
  if (coords.length === 0) return 'No coordinator assigned'
  if (coords.length === 1) {
    const coord = coords[0]
    const name = coord.displayName
    return coord.primaryRegion === regionId ? `${name} (Primary)` : name
  }
  return `${coords.length} coordinators`
}

async function addNewCoordinator(user) {
  try {
    console.log('Adding new coordinator:', user)
    
    // Ensure we have a proper display name
    const displayName = user.displayName || user.name || user.email.split('@')[0]
    
    await createCoordinator({
      userId: user.uid,
      email: user.email,
      displayName: displayName,
      name: displayName, // Keep name in sync
      regions: [],
      primaryRegion: null
    })
    
    showSuccess(`${displayName} added as coordinator successfully`)
    emit('coordinator-updated')
    showUserSelection.value = false
    
    // Refresh the coordinator list - USE THE SAME METHOD
    await loadAllCoordinators()
  } catch (error) {
    showError(error.message || 'Failed to add coordinator')
  }
}

function editCoordinator(coordinator) {
  selectedCoordinator.value = coordinator
  showEditDialog.value = true
}

function confirmDelete(coordinator) {
  selectedCoordinator.value = coordinator
  showDeleteDialog.value = true
}

async function updateCoordinator(updatedData) {
  try {
    await updateCoordinatorData(selectedCoordinator.value.id, updatedData)
    showSuccess('Coordinator updated successfully')
    emit('coordinator-updated')
    showEditDialog.value = false
  } catch (error) {
    showError(error.message || 'Failed to update coordinator')
  }
}

async function deleteCoordinator() {
  if (!selectedCoordinator.value) return
  
  deleting.value = true
  try {
    await deleteCoordinatorData(selectedCoordinator.value.id)
    showSuccess('Coordinator removed successfully')
    emit('coordinator-updated')
    showDeleteDialog.value = false
  } catch (error) {
    showError(error.message || 'Failed to remove coordinator')
  } finally {
    deleting.value = false
  }
}

// Lifecycle - LOAD COORDINATORS THE SAME WAY AS ProjectRegionCoordinator
onMounted(async () => {
  await loadAllCoordinators()
})

// Watch dialog open
watch(dialogOpen, async (isOpen) => {
  if (isOpen) {
    await loadAllCoordinators()
  }
})
</script>

<style scoped>
.v-data-table {
  background: transparent;
}

.v-chip-group {
  gap: 4px;
}
</style>