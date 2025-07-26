<!-- Mobile-first Coordinator Management Component -->
<template>
  <v-dialog
    v-model="dialogOpen"
    :fullscreen="true"
    transition="dialog-bottom-transition"
    :scrim="false"
  >
    <v-card class="coordinator-management-mobile">
      <!-- Sticky Header -->
      <div class="sticky-header">
        <v-toolbar color="primary" dark flat>
          <v-btn icon="mdi-arrow-left" @click="close" />
          <v-toolbar-title class="text-h6">Coordinators</v-toolbar-title>
          <v-spacer />
          <v-btn icon @click="showInfo = true">
            <v-icon>mdi-information-outline</v-icon>
          </v-btn>
        </v-toolbar>

        <!-- Search and Add Section -->
        <div class="search-section pa-4 bg-surface">
          <v-text-field
            v-model="search"
            prepend-inner-icon="mdi-magnify"
            placeholder="Search coordinators..."
            variant="outlined"
            density="compact"
            hide-details
            class="mb-3"
          />
          <v-btn
            color="primary"
            block
            size="large"
            prepend-icon="mdi-account-plus"
            @click="showUserSelection = true"
          >
            Add Coordinator
          </v-btn>
        </div>
      </div>

      <!-- Content Area -->
      <v-card-text class="pa-0 content-area">
        <!-- Loading State -->
        <div v-if="loading" class="text-center py-8">
          <v-progress-circular indeterminate color="primary" />
          <p class="text-body-2 mt-2">Loading coordinators...</p>
        </div>

        <!-- Empty State -->
        <v-empty-state
          v-else-if="filteredCoordinators.length === 0"
          icon="mdi-account-search"
          title="No coordinators found"
          :text="search ? 'Try adjusting your search' : 'Add your first coordinator to get started'"
          class="my-8"
        />

        <!-- Coordinators List -->
        <div v-else class="coordinator-list">
          <!-- Mobile Card View (default) -->
          <div v-if="!isTabletOrAbove" class="pa-4">
            <v-card
              v-for="coordinator in filteredCoordinators"
              :key="coordinator.id"
              class="coordinator-card mb-3"
              @click="expandedCard === coordinator.id ? expandedCard = null : expandedCard = coordinator.id"
            >
              <!-- Card Header -->
              <v-card-text class="pa-4">
                <div class="d-flex align-center">
                  <v-avatar size="48" color="primary" class="mr-3">
                    <span class="text-subtitle-1 font-weight-medium">
                      {{ getInitials(coordinator.displayName || coordinator.name || coordinator.email) }}
                    </span>
                  </v-avatar>
                  <div class="flex-grow-1">
                    <div class="text-body-1 font-weight-medium">
                      {{ coordinator.displayName || coordinator.name || coordinator.email }}
                    </div>
                    <div class="text-caption text-medium-emphasis">
                      {{ coordinator.email || coordinator.userEmail }}
                    </div>
                  </div>
                  <v-icon>
                    {{ expandedCard === coordinator.id ? 'mdi-chevron-up' : 'mdi-chevron-down' }}
                  </v-icon>
                </div>

                <!-- Region Pills (Collapsed View) -->
                <div v-if="expandedCard !== coordinator.id" class="mt-3">
                  <div class="d-flex flex-wrap ga-2">
                    <v-chip
                      v-for="(regionId, index) in coordinator.regions.slice(0, 2)"
                      :key="regionId"
                      size="small"
                      :color="regionId === coordinator.primaryRegion ? 'primary' : 'default'"
                      :variant="regionId === coordinator.primaryRegion ? 'flat' : 'outlined'"
                    >
                      {{ getRegionShortName(regionId) }}
                      <v-icon v-if="regionId === coordinator.primaryRegion" end size="x-small">mdi-star</v-icon>
                    </v-chip>
                    <v-chip
                      v-if="coordinator.regions.length > 2"
                      size="small"
                      variant="text"
                      color="primary"
                    >
                      +{{ coordinator.regions.length - 2 }} more
                    </v-chip>
                  </div>
                </div>
              </v-card-text>

              <!-- Expanded Content -->
              <v-expand-transition>
                <div v-if="expandedCard === coordinator.id">
                  <v-divider />
                  <v-card-text class="pa-4">
                    <!-- All Regions -->
                    <div class="mb-4">
                      <div class="text-caption text-medium-emphasis mb-2">Assigned Regions</div>
                      <div class="d-flex flex-wrap ga-2">
                        <v-chip
                          v-for="regionId in coordinator.regions"
                          :key="regionId"
                          size="small"
                          :color="regionId === coordinator.primaryRegion ? 'primary' : 'default'"
                          :variant="regionId === coordinator.primaryRegion ? 'flat' : 'outlined'"
                        >
                          {{ getRegionName(regionId) }}
                          <v-icon v-if="regionId === coordinator.primaryRegion" end size="x-small">mdi-star</v-icon>
                        </v-chip>
                      </div>
                    </div>

                    <!-- Actions -->
                    <v-row no-gutters>
                      <v-col cols="6" class="pr-1">
                        <v-btn
                          variant="outlined"
                          color="primary"
                          block
                          prepend-icon="mdi-pencil"
                          @click.stop="editCoordinator(coordinator)"
                        >
                          Edit
                        </v-btn>
                      </v-col>
                      <v-col cols="6" class="pl-1">
                        <v-btn
                          variant="outlined"
                          color="error"
                          block
                          prepend-icon="mdi-delete"
                          @click.stop="confirmDelete(coordinator)"
                        >
                          Remove
                        </v-btn>
                      </v-col>
                    </v-row>
                  </v-card-text>
                </div>
              </v-expand-transition>
            </v-card>
          </div>

          <!-- Tablet/Desktop Table View -->
          <div v-else class="pa-4">
            <v-data-table
              :headers="headers"
              :items="filteredCoordinators"
              :search="search"
              class="elevation-1"
            >
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
                <div class="py-2">
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
                </div>
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
          </div>
        </div>
      </v-card-text>

      <!-- Regional Coverage Bottom Sheet (Mobile) -->
      <v-bottom-sheet v-model="showRegionalCoverage" v-if="!isTabletOrAbove">
        <v-card>
          <v-card-title class="d-flex align-center">
            Regional Coverage
            <v-spacer />
            <v-btn icon="mdi-close" variant="text" @click="showRegionalCoverage = false" />
          </v-card-title>
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
      </v-bottom-sheet>

      <!-- Info Bottom Sheet -->
      <v-bottom-sheet v-model="showInfo">
        <v-card>
          <v-card-title class="d-flex align-center">
            About Coordinators
            <v-spacer />
            <v-btn icon="mdi-close" variant="text" @click="showInfo = false" />
          </v-card-title>
          <v-card-text>
            <p class="text-body-2">Communications coordinators manage projects within their assigned regions.</p>
            <ul class="text-body-2 ml-4 mt-2">
              <li>Each region should have at least one coordinator</li>
              <li>Coordinators can manage multiple regions</li>
              <li>One region is marked as primary (starred)</li>
              <li>Only users with active accounts can be coordinators</li>
            </ul>
            <v-btn
              color="primary"
              variant="text"
              block
              class="mt-4"
              @click="showRegionalCoverage = true; showInfo = false"
            >
              View Regional Coverage
            </v-btn>
          </v-card-text>
        </v-card>
      </v-bottom-sheet>
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
          <v-btn
            color="error"
            variant="flat"
            @click="deleteCoordinator"
            :loading="deleting"
          >
            Remove
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </v-dialog>
</template>

<script setup>
import { ref, computed, watch, onMounted } from 'vue'
import { useDisplay } from 'vuetify'
import { useCoordinatorManagement } from '@/composables/comms/useCoordinatorManagement'
import { useCoordinatorSelection } from '@/composables/comms/useCoordinatorSelection'
import { LOUISIANA_REGIONS } from '@/config/louisiana-regions'
import UserSelectionDialog from './UserSelectionDialog.vue'
import CoordinatorEditDialog from './CoordinatorEditDialog.vue'

// Props
const props = defineProps({
  modelValue: {
    type: Boolean,
    default: false
  }
})

// Emits
const emit = defineEmits(['update:modelValue', 'coordinator-updated'])

// Display
const display = useDisplay()
const isTabletOrAbove = computed(() => display.smAndUp.value)

// Dialog state
const dialogOpen = computed({
  get: () => props.modelValue,
  set: (value) => emit('update:modelValue', value)
})

// Composables - Management functions (for CRUD operations)
const {
  createCoordinator,
  updateCoordinator: updateCoordinatorData,
  deleteCoordinator: removeCoordinator
} = useCoordinatorManagement()

// Composables - Selection and display (for loading coordinator list)
const {
  allCoordinators,
  loadingCoordinators,
  loadAllCoordinators,
  getCoordinatorDisplayName
} = useCoordinatorSelection()

// Use allCoordinators as coordinators for consistency with desktop version
const coordinators = computed(() => allCoordinators.value)
const loading = computed(() => loadingCoordinators.value)

// State
const search = ref('')
const showUserSelection = ref(false)
const showEditDialog = ref(false)
const showDeleteDialog = ref(false)
const showInfo = ref(false)
const showRegionalCoverage = ref(false)
const selectedCoordinator = ref(null)
const deleting = ref(false)
const expandedCard = ref(null)

// Table headers for tablet/desktop view
const headers = [
  { title: 'Coordinator', key: 'displayName', sortable: true },
  { title: 'Regions', key: 'regions', sortable: false },
  { title: 'Actions', key: 'actions', sortable: false, align: 'end' }
]

// Computed
const coordinatorsWithDisplayName = computed(() => {
  return coordinators.value.map(coord => ({
    ...coord,
    displayName: coord.name || coord.displayName || coord.email || coord.userEmail || 'Unknown'
  }))
})

const filteredCoordinators = computed(() => {
  if (!search.value) return coordinatorsWithDisplayName.value
  
  const searchLower = search.value.toLowerCase()
  return coordinatorsWithDisplayName.value.filter(coord => {
    const name = (coord.displayName || '').toLowerCase()
    const email = (coord.email || coord.userEmail || '').toLowerCase()
    return name.includes(searchLower) || email.includes(searchLower)
  })
})

const existingCoordinatorIds = computed(() => {
  return coordinators.value.map(c => c.userId || c.id)
})

// Methods
function close() {
  dialogOpen.value = false
}

function getInitials(name) {
  if (!name) return '?'
  return name
    .split(' ')
    .map(word => word[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)
}

function getRegionName(regionId) {
  return LOUISIANA_REGIONS[regionId]?.name || regionId
}

function getRegionShortName(regionId) {
  // Return abbreviated version for mobile
  const name = getRegionName(regionId)
  if (name.startsWith('Region ')) {
    return 'R' + name.split(' ')[1]
  }
  // For named regions, use first 3 letters
  return name.substring(0, 3).toUpperCase()
}

function hasCoordinatorForRegion(regionId) {
  return coordinators.value.some(c => c.regions?.includes(regionId))
}

function getRegionCoordinatorInfo(regionId) {
  const coords = coordinators.value.filter(c => c.regions?.includes(regionId))
  if (coords.length === 0) return 'No coordinator assigned'
  if (coords.length === 1) {
    const coord = coords[0]
    return coord.displayName || coord.name || coord.email
  }
  return `${coords.length} coordinators`
}

function editCoordinator(coordinator) {
  selectedCoordinator.value = coordinator
  showEditDialog.value = true
}

function confirmDelete(coordinator) {
  selectedCoordinator.value = coordinator
  showDeleteDialog.value = true
}

async function deleteCoordinator() {
  if (!selectedCoordinator.value) return
  
  deleting.value = true
  try {
    await removeCoordinator(selectedCoordinator.value.id)
    showDeleteDialog.value = false
    selectedCoordinator.value = null
    emit('coordinator-updated')
    // Reload coordinators list
    await loadAllCoordinators()
  } finally {
    deleting.value = false
  }
}

async function addNewCoordinator(userData) {
  try {
    await createCoordinator(userData)
    showUserSelection.value = false
    emit('coordinator-updated')
    // Reload coordinators list
    await loadAllCoordinators()
  } catch (error) {
    console.error('Failed to add coordinator:', error)
  }
}

async function updateCoordinator(updatedData) {
  try {
    await updateCoordinatorData(selectedCoordinator.value.id, updatedData)
    showEditDialog.value = false
    selectedCoordinator.value = null
    emit('coordinator-updated')
    // Reload coordinators list
    await loadAllCoordinators()
  } catch (error) {
    console.error('Failed to update coordinator:', error)
  }
}

// Lifecycle - Load coordinators when component mounts
onMounted(async () => {
  await loadAllCoordinators()
})

// Watch dialog state
watch(dialogOpen, async (isOpen) => {
  if (isOpen) {
    await loadAllCoordinators()
  }
})
</script>

<style scoped>
.coordinator-management-mobile {
  height: 100%;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.sticky-header {
  position: sticky;
  top: 0;
  z-index: 10;
  background: rgb(var(--v-theme-surface));
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.search-section {
  border-bottom: 1px solid rgba(0, 0, 0, 0.12);
}

.content-area {
  flex: 1;
  overflow-y: auto;
  -webkit-overflow-scrolling: touch;
}

.coordinator-card {
  transition: all 0.3s ease;
  cursor: pointer;
}

.coordinator-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

/* Ensure touch targets are at least 44x44px */
.coordinator-card .v-btn {
  min-height: 44px;
  min-width: 44px;
}

/* Responsive typography */
@media (max-width: 600px) {
  .text-body-1 {
    font-size: 16px !important;
    line-height: 1.4;
  }
  
  .text-caption {
    font-size: 14px !important;
  }
}

/* Better spacing on mobile */
.coordinator-list {
  min-height: 100%;
}

/* Smooth transitions */
.v-expand-transition-enter-active,
.v-expand-transition-leave-active {
  transition: all 0.3s ease;
}
</style>