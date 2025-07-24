// client/src/composables/comms/commsProjectsUtils.js
import { Timestamp } from 'firebase/firestore'

/**
 * Utility functions for communications projects
 */

/**
 * Safely convert various timestamp formats to JavaScript Date
 * @param {any} timestamp - The timestamp to convert
 * @returns {Date|null} The converted date or null
 */
export function safeConvertToDate(timestamp) {
  if (!timestamp) return null
  
  if (timestamp instanceof Timestamp) {
    return timestamp.toDate()
  }
  
  if (timestamp instanceof Date) {
    return timestamp
  }
  
  if (typeof timestamp === 'object' && timestamp.seconds) {
    return new Timestamp(timestamp.seconds, timestamp.nanoseconds || 0).toDate()
  }
  
  if (typeof timestamp === 'string') {
    const date = new Date(timestamp)
    return isNaN(date.getTime()) ? null : date
  }
  
  return null
}