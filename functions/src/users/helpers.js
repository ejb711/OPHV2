// functions/src/users/helpers.js
// OPHV2 User Management Shared Helper Functions
// File size: ~40 lines (well under 350 line limit)

const admin = require('firebase-admin')

/* ---------- Audit Logging Helper ---------- */

/**
 * Create simple audit log entry directly to Firestore
 * @param {Object} logData - Audit log data
 * @returns {Promise<void>}
 */
async function createSimpleAuditLog(logData) {
  try {
    await admin.firestore().collection('audit_logs').add({
      ...logData,
      timestamp: admin.firestore.FieldValue.serverTimestamp(),
      source: 'cloud_function'
    })
  } catch (error) {
    console.error('Error creating audit log:', error)
    // Don't throw - audit logging shouldn't break main functionality
  }
}

/* ---------- Exports ---------- */

module.exports = {
  createSimpleAuditLog
}

console.log('✅ User Helper Functions loaded')
console.log('📋 Helper Functions: createSimpleAuditLog')