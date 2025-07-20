// functions/src/users/index.js
// OPHV2 User Management Module - Main Exports
// Modular architecture with focused, maintainable files

// Import CRUD operations
const { createUser, deleteUser, getUserDetails } = require('./crud')

// Import profile management
const { updateUserProfile } = require('./profile')

// Import role management
const { updateUserRole } = require('./role')

// Import status management
const { updateUserStatus } = require('./status')

// Import bulk operations
const { bulkUpdateUsers } = require('./bulk')

/* ---------- Main Exports ---------- */

// Export all user management functions
module.exports = {
  // CRUD Operations (create, read, delete)
  createUser,
  deleteUser,
  getUserDetails,
  
  // Profile Management
  updateUserProfile,
  
  // Role Management
  updateUserRole,
  
  // Status Management
  updateUserStatus,
  
  // Bulk Operations
  bulkUpdateUsers
}

/* ---------- Module Information ---------- */

console.log('✅ OPHV2 User Management Module loaded - Modular Architecture')
console.log('📊 Module Statistics:')
console.log('   - Total Functions: 7')
console.log('   - CRUD Operations: 3 (createUser, deleteUser, getUserDetails)')
console.log('   - Profile Management: 1 (updateUserProfile)')
console.log('   - Role Management: 1 (updateUserRole)')
console.log('   - Status Management: 1 (updateUserStatus)')
console.log('   - Bulk Operations: 1 (bulkUpdateUsers)')
console.log('📁 File Structure:')
console.log('   - crud.js: ~280 lines (CRUD operations)')
console.log('   - profile.js: ~120 lines (Profile updates)')
console.log('   - role.js: ~120 lines (Role management)')
console.log('   - status.js: ~120 lines (Status management)')
console.log('   - bulk.js: ~180 lines (Bulk operations)')
console.log('   - helpers.js: ~40 lines (Shared utilities)')
console.log('   - index.js: ~60 lines (Main exports)')
console.log('🎯 All files under 350 line limit for optimal maintainability')