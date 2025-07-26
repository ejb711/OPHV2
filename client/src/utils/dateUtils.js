// client/src/utils/dateUtils.js
// Centralized date conversion utilities for consistent date handling

/**
 * Convert various date formats to a JavaScript Date object
 * Handles Date objects, Firestore Timestamps, strings, and numbers
 * @param {Date|Object|string|number} date - The date to convert
 * @returns {Date|null} - Converted Date object or null if invalid
 */
export function toDate(date) {
  if (!date) return null

  // Already a Date object
  if (date instanceof Date) {
    return isNaN(date.getTime()) ? null : date
  }

  // Firestore Timestamp object
  if (date?.toDate && typeof date.toDate === 'function') {
    try {
      return date.toDate()
    } catch (e) {
      return null
    }
  }

  // String or number representation
  if (typeof date === 'string' || typeof date === 'number') {
    try {
      const converted = new Date(date)
      return isNaN(converted.getTime()) ? null : converted
    } catch (e) {
      return null
    }
  }

  // Unsupported format
  return null
}

/**
 * Format a date as YYYY-MM-DD for HTML date inputs
 * @param {Date|Object|string|number} date - The date to format
 * @returns {string} - Formatted date string or empty string if invalid
 */
export function formatDateForInput(date) {
  const dateObj = toDate(date)
  if (!dateObj) return ''

  try {
    const year = dateObj.getFullYear()
    const month = String(dateObj.getMonth() + 1).padStart(2, '0')
    const day = String(dateObj.getDate()).padStart(2, '0')
    return `${year}-${month}-${day}`
  } catch (error) {
    return ''
  }
}

/**
 * Compare two dates for equality (ignoring time)
 * @param {Date|Object|string|number} date1 - First date
 * @param {Date|Object|string|number} date2 - Second date
 * @returns {boolean} - True if dates are equal (ignoring time)
 */
export function areDatesEqual(date1, date2) {
  const d1 = toDate(date1)
  const d2 = toDate(date2)

  if (!d1 && !d2) return true
  if (!d1 || !d2) return false

  // Compare dates without time
  return d1.toDateString() === d2.toDateString()
}

/**
 * Create a Date object from a date input string (YYYY-MM-DD)
 * Sets time to start of day to avoid timezone issues
 * @param {string} dateString - Date string from input
 * @returns {Date|null} - Date object or null if invalid
 */
export function createDateFromInput(dateString) {
  if (!dateString) return null

  try {
    const date = new Date(dateString)
    if (isNaN(date.getTime())) return null

    // Set to start of day
    date.setHours(0, 0, 0, 0)
    return date
  } catch (error) {
    return null
  }
}