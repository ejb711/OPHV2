// functions/index.js - Modular Entry Point
// OPHV2 Cloud Functions - Organized for maintainability
const functions = require('firebase-functions/v1')
const admin = require('firebase-admin')

// Initialize Firebase Admin
admin.initializeApp()

/* ---------- Import Modular Functions ---------- */

// Authentication & User Lifecycle
const authTriggers = require('./src/auth/triggers')
const userManagement = require('./src/users/management')

// Audit & Retention System
const auditSystem = require('./src/audit/retention')
const auditStats = require('./src/audit/stats')

// System & Configuration
const systemInit = require('./src/system/initialization')
const systemHealth = require('./src/system/health')

// Permissions & Roles
const permissionsUtils = require('./src/utils/permissions')

/* ---------- Export All Functions ---------- */

// Authentication Triggers (from src/auth/triggers.js)
exports.onUserCreated = authTriggers.onUserCreated
exports.onUserDeleted = authTriggers.onUserDeleted

// User Management (from src/users/management.js)
exports.deleteUser = userManagement.deleteUser
exports.createUser = userManagement.createUser
exports.updateUserRole = userManagement.updateUserRole

// Audit & Retention (from src/audit/retention.js)
exports.cleanupAuditLogs = auditSystem.cleanupAuditLogs
exports.manualCleanupAuditLogs = auditSystem.manualCleanupAuditLogs

// Audit Statistics (from src/audit/stats.js)
exports.getRetentionStats = auditStats.getRetentionStats
exports.getAuditStatistics = auditStats.getAuditStatistics

// System Initialization (from src/system/initialization.js)
exports.initializeSystemData = systemInit.initializeSystemData
exports.setupDefaultRoles = systemInit.setupDefaultRoles
exports.setupDefaultPermissions = systemInit.setupDefaultPermissions

// System Health (from src/system/health.js)
exports.healthCheck = systemHealth.healthCheck
exports.systemStatus = systemHealth.systemStatus

console.log('🚀 OPHV2 Cloud Functions loaded successfully - Modular Architecture v2.1.0')
console.log('📦 Modules: auth, users, audit, system, utils, config')
console.log('📁 Structure: Organized for maintainability with clear naming conventions')