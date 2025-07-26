// client/src/composables/comms/useCoordinatorSelection.js
import { ref, computed } from 'vue'
import { collection, query, getDocs, orderBy } from 'firebase/firestore'
import { db } from '@/firebase'
import { LOUISIANA_REGIONS } from '@/config/louisiana-regions'

export function useCoordinatorSelection() {
  // State
  const allCoordinators = ref([])
  const loadingCoordinators = ref(false)

  // Load all coordinators from Firestore
  async function loadAllCoordinators() {
    loadingCoordinators.value = true
    try {
      const coordinatorsQuery = query(
        collection(db, 'comms_coordinators'),
        orderBy('name')
      )

      const snapshot = await getDocs(coordinatorsQuery)
      allCoordinators.value = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }))
    } catch (error) {
      allCoordinators.value = []
    } finally {
      loadingCoordinators.value = false
    }
  }

  // Get default coordinator for a region
  function getDefaultCoordinatorForRegion(regionId) {
    if (!regionId) return null

    // Find primary coordinator for the region
    const primaryCoord = allCoordinators.value.find(c => c.primaryRegion === regionId)
    if (primaryCoord) return primaryCoord

    // If no primary, find first coordinator assigned to the region
    return allCoordinators.value.find(c => c.regions && c.regions.includes(regionId))
  }

  // Format coordinators for v-select display
  function formatCoordinatorsForSelect(currentRegion) {
    const items = allCoordinators.value.map(coord => {
      const isForCurrentRegion = currentRegion && coord.regions && coord.regions.includes(currentRegion)
      const isPrimary = currentRegion && coord.primaryRegion === currentRegion

      // Get region names
      const regionNames = (coord.regions || [])
        .map(regionId => {
          const region = LOUISIANA_REGIONS[regionId]
          return region ? region.name : regionId
        })
        .join(', ')

      return {
        label: coord.displayName || coord.name || coord.email,
        value: coord.id,
        email: coord.email,
        isPrimary,
        isForCurrentRegion,
        regions: coord.regions || [],
        regionNames,
        displayName: coord.displayName || coord.name || coord.email,
        raw: coord
      }
    })

    // Sort: primary first, then assigned to region, then alphabetically
    return items.sort((a, b) => {
      if (a.isPrimary && !b.isPrimary) return -1
      if (!a.isPrimary && b.isPrimary) return 1
      if (a.isForCurrentRegion && !b.isForCurrentRegion) return -1
      if (!a.isForCurrentRegion && b.isForCurrentRegion) return 1
      return a.label.localeCompare(b.label)
    })
  }

  // Get display name for a coordinator
  function getCoordinatorDisplayName(coordinatorId) {
    if (!coordinatorId) return 'Not assigned'
    const coordinator = allCoordinators.value.find(c => c.id === coordinatorId)
    return coordinator ? (coordinator.displayName || coordinator.name || coordinator.email) : 'Loading...'
  }

  // Check if a coordinator is the default for a region
  function isDefaultCoordinator(coordinatorId, regionId) {
    if (!coordinatorId || !regionId) return false
    const defaultCoord = getDefaultCoordinatorForRegion(regionId)
    return defaultCoord && defaultCoord.id === coordinatorId
  }

  return {
    allCoordinators,
    loadingCoordinators,
    loadAllCoordinators,
    getDefaultCoordinatorForRegion,
    formatCoordinatorsForSelect,
    getCoordinatorDisplayName,
    isDefaultCoordinator
  }
}