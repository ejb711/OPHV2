// client/src/config/louisiana-regions.js
// Louisiana Health Regions Configuration for Communications Dashboard

/**
 * Louisiana Department of Health Regional Structure
 * 9 regions covering all 64 parishes
 * Used for organizing communications projects by geographic area
 */

export const LOUISIANA_REGIONS = {
  // Region 1 - Greater New Orleans
  '1': {
    id: '1',
    name: 'Region 1 - Orleans',
    shortName: 'Orleans',
    headquarters: 'New Orleans',
    parishes: ['Jefferson', 'Orleans', 'Plaquemines', 'St. Bernard'],
    color: '#1976D2', // Blue
    population: 965000 // Approximate
  },
  
  // Region 2 - Capital Area
  '2': {
    id: '2',
    name: 'Region 2 - Baton Rouge',
    shortName: 'Baton Rouge',
    headquarters: 'Baton Rouge',
    parishes: [
      'Ascension', 'East Baton Rouge', 'East Feliciana', 
      'Iberville', 'Pointe Coupee', 'West Baton Rouge', 'West Feliciana'
    ],
    color: '#388E3C', // Green
    population: 730000
  },
  
  // Region 3 - South Central
  '3': {
    id: '3',
    name: 'Region 3 - Houma',
    shortName: 'Houma',
    headquarters: 'Houma',
    parishes: [
      'Assumption', 'Lafourche', 'St. Charles', 'St. James', 
      'St. John the Baptist', 'St. Mary', 'Terrebonne'
    ],
    color: '#D32F2F', // Red
    population: 385000
  },
  
  // Region 4 - Acadiana
  '4': {
    id: '4',
    name: 'Region 4 - Lafayette',
    shortName: 'Lafayette',
    headquarters: 'Lafayette',
    parishes: [
      'Acadia', 'Evangeline', 'Iberia', 'Lafayette', 
      'St. Landry', 'St. Martin', 'Vermilion'
    ],
    color: '#7B1FA2', // Purple
    population: 615000
  },
  
  // Region 5 - Southwest
  '5': {
    id: '5',
    name: 'Region 5 - Lake Charles',
    shortName: 'Lake Charles',
    headquarters: 'Lake Charles',
    parishes: [
      'Allen', 'Beauregard', 'Calcasieu', 
      'Cameron', 'Jefferson Davis'
    ],
    color: '#F57C00', // Orange
    population: 313000
  },
  
  // Region 6 - Central
  '6': {
    id: '6',
    name: 'Region 6 - Alexandria',
    shortName: 'Alexandria',
    headquarters: 'Alexandria',
    parishes: [
      'Avoyelles', 'Catahoula', 'Concordia', 'Grant', 
      'LaSalle', 'Rapides', 'Vernon', 'Winn'
    ],
    color: '#689F38', // Light Green
    population: 300000
  },
  
  // Region 7 - Northwest
  '7': {
    id: '7',
    name: 'Region 7 - Shreveport',
    shortName: 'Shreveport',
    headquarters: 'Shreveport',
    parishes: [
      'Bienville', 'Bossier', 'Caddo', 'Claiborne', 
      'DeSoto', 'Natchitoches', 'Red River', 'Sabine', 'Webster'
    ],
    color: '#0288D1', // Light Blue
    population: 463000
  },
  
  // Region 8 - Northeast
  '8': {
    id: '8',
    name: 'Region 8 - Monroe',
    shortName: 'Monroe',
    headquarters: 'Monroe',
    parishes: [
      'Caldwell', 'East Carroll', 'Franklin', 'Jackson', 
      'Lincoln', 'Madison', 'Morehouse', 'Ouachita', 
      'Richland', 'Tensas', 'Union', 'West Carroll'
    ],
    color: '#616161', // Grey
    population: 310000
  },
  
  // Region 9 - Northshore
  '9': {
    id: '9',
    name: 'Region 9 - Hammond',
    shortName: 'Hammond',
    headquarters: 'Hammond',
    parishes: [
      'Livingston', 'St. Helena', 'St. Tammany', 
      'Tangipahoa', 'Washington'
    ],
    color: '#00796B', // Teal
    population: 475000
  },
  
  // Central Office - Not a geographic region
  'central': {
    id: 'central',
    name: 'Central Office',
    shortName: 'Central',
    headquarters: 'Baton Rouge',
    parishes: [], // No parishes - statewide
    color: '#5D4037', // Brown
    population: null // N/A
  }
}

/**
 * Get region by ID
 */
export function getRegionById(regionId) {
  return LOUISIANA_REGIONS[regionId] || null
}

/**
 * Get region by parish name
 */
export function getRegionByParish(parishName) {
  for (const [regionId, region] of Object.entries(LOUISIANA_REGIONS)) {
    if (region.parishes.includes(parishName)) {
      return region
    }
  }
  return null
}

/**
 * Get all regions as array
 */
export function getAllRegions() {
  return Object.values(LOUISIANA_REGIONS)
}

/**
 * Get regions for select dropdown
 */
export function getRegionOptions() {
  return Object.values(LOUISIANA_REGIONS).map(region => ({
    value: region.id,
    title: region.name,
    shortTitle: region.shortName
  }))
}

/**
 * Format region display name
 */
export function formatRegionName(regionId, format = 'full') {
  const region = getRegionById(regionId)
  if (!region) return 'Unknown Region'
  
  switch (format) {
    case 'short':
      return region.shortName
    case 'number':
      return regionId === 'central' ? 'Central' : `Region ${regionId}`
    case 'full':
    default:
      return region.name
  }
}

/**
 * Check if user can access region
 * (Future: This will check against user's assigned regions)
 */
export function canAccessRegion(userRegions, targetRegion) {
  // If user has 'central' or can view all regions, they can access any region
  if (userRegions.includes('central') || userRegions.includes('all')) {
    return true
  }
  
  // Otherwise check if target region is in user's assigned regions
  return userRegions.includes(targetRegion)
}

/**
 * Get region statistics placeholder
 * (Future: Will connect to real data)
 */
export function getRegionStats(regionId) {
  const region = getRegionById(regionId)
  if (!region) return null
  
  return {
    regionId: region.id,
    name: region.name,
    totalProjects: 0,
    activeProjects: 0,
    completedProjects: 0,
    pendingApproval: 0
  }
}

// Export default for easy importing
export default LOUISIANA_REGIONS