// Filter options configuration for Communications dashboard
import { LOUISIANA_REGIONS } from '@/config/louisiana-regions'

// Status options for project filtering
export const STATUS_OPTIONS = [
  { title: 'Not Started', value: 'not_started' },
  { title: 'Planning', value: 'planning' },
  { title: 'In Progress', value: 'in_progress' },
  { title: 'Under Review', value: 'review' },
  { title: 'Pending Approval', value: 'pending_approval' },
  { title: 'Approved', value: 'approved' },
  { title: 'Completed', value: 'completed' },
  { title: 'On Hold', value: 'on_hold' },
  { title: 'Cancelled', value: 'cancelled' }
]

// Priority options for project filtering
export const PRIORITY_OPTIONS = [
  { title: 'Low', value: 'low' },
  { title: 'Medium', value: 'medium' },
  { title: 'High', value: 'high' },
  { title: 'Urgent', value: 'urgent' }
]

// Generate region options from Louisiana regions config
export function getRegionOptions() {
  return Object.entries(LOUISIANA_REGIONS).map(([key, region]) => ({
    title: region.name,
    value: key
  }))
}

// Default filter state
export const DEFAULT_FILTERS = {
  region: null,
  status: null,
  priority: null,
  coordinator: null,
  search: '',
  quickFilters: [],
  advancedSearch: null,
  sortBy: 'updatedAt',
  sortDirection: 'desc'
}