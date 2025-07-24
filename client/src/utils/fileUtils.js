// client/src/utils/fileUtils.js
import { formatDistanceToNow } from 'date-fns'

/**
 * Get appropriate icon for file type
 * @param {Object} file - File object with type property
 * @returns {string} Material Design Icon name
 */
export function getFileIcon(file) {
  if (file.type === 'external_link') return 'mdi-link'
  
  const type = file.type || ''
  
  if (type.startsWith('image/')) return 'mdi-file-image'
  if (type.startsWith('video/')) return 'mdi-file-video'
  if (type.includes('pdf')) return 'mdi-file-pdf-box'
  if (type.includes('word') || type.includes('document')) return 'mdi-file-word'
  if (type.includes('excel') || type.includes('spreadsheet')) return 'mdi-file-excel'
  if (type.includes('powerpoint') || type.includes('presentation')) return 'mdi-file-powerpoint'
  if (type.includes('zip') || type.includes('compressed')) return 'mdi-folder-zip'
  
  return 'mdi-file-document'
}

/**
 * Format file size in human-readable format
 * @param {number} bytes - File size in bytes
 * @returns {string} Formatted file size
 */
export function formatFileSize(bytes) {
  if (!bytes) return 'Unknown size'
  if (bytes === 0) return '0 Bytes'
  
  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

/**
 * Format timestamp to relative date
 * @param {Object} timestamp - Firestore timestamp or Date object
 * @returns {string} Formatted relative date
 */
export function formatDate(timestamp) {
  if (!timestamp) return 'Unknown date'
  
  try {
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp)
    return formatDistanceToNow(date, { addSuffix: true })
  } catch (error) {
    return 'Unknown date'
  }
}

/**
 * Get file extension from filename
 * @param {string} filename - File name
 * @returns {string} File extension without dot
 */
export function getFileExtension(filename) {
  if (!filename) return ''
  const parts = filename.split('.')
  return parts.length > 1 ? parts.pop().toLowerCase() : ''
}

/**
 * Check if file type is an image
 * @param {string} type - MIME type
 * @returns {boolean}
 */
export function isImageFile(type) {
  return type && type.startsWith('image/')
}

/**
 * Check if file type is a document
 * @param {string} type - MIME type
 * @returns {boolean}
 */
export function isDocumentFile(type) {
  return type && (
    type.includes('pdf') ||
    type.includes('word') ||
    type.includes('document') ||
    type.includes('text')
  )
}