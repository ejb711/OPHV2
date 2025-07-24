// client/src/utils/regionUtils.js

/**
 * Get the color associated with a Louisiana region
 * @param {string} regionId - The region ID (1-9)
 * @returns {string} The hex color code for the region
 */
export function getRegionColor(regionId) {
  const colors = {
    '1': '#1976D2', // Blue - Region 1
    '2': '#388E3C', // Green - Region 2
    '3': '#7B1FA2', // Purple - Region 3
    '4': '#F57C00', // Orange - Region 4
    '5': '#D32F2F', // Red - Region 5
    '6': '#00796B', // Teal - Region 6
    '7': '#5D4037', // Brown - Region 7
    '8': '#616161', // Grey - Region 8
    '9': '#303F9F'  // Indigo - Region 9
  }
  return colors[regionId] || '#757575' // Default grey
}

/**
 * Format region options for select dropdowns
 * @param {Object} regions - The LOUISIANA_REGIONS object
 * @returns {Array} Formatted array of region options
 */
export function formatRegionOptions(regions) {
  return Object.entries(regions).map(([id, region]) => ({
    id,
    name: region.name,
    parishes: region.parishes
  }))
}