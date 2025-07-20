# OPHV2 Cloud Functions - Modular Architecture

## 🏗️ Architecture Overview

OPHV2 Cloud Functions follow a **modular architecture** where each module is focused, maintainable, and under 350 lines. This approach enables better code organization, easier testing, and scalable development.

## 📁 Project Structure

```
functions/
├── index.js                          # Main entry point & exports (< 100 lines)
├── src/                              # All source modules
│   ├── config/                       # Configuration modules
│   │   ├── defaults.js               # Default permissions, roles (< 300 lines)
│   │   └── audit.js                  # Audit system configuration (< 350 lines)
│   ├── utils/                        # Utility modules
│   │   └── permissions.js            # Permission checking utilities (< 350 lines)
│   ├── auth/                         # Authentication modules
│   │   └── triggers.js               # Firebase Auth event handlers (< 250 lines)
│   ├── users/                        # User management modules
│   │   └── management.js             # User CRUD operations (< 350 lines)
│   ├── audit/                        # Audit system modules
│   │   ├── retention.js              # Log cleanup & compression (< 350 lines)
│   │   └── stats.js                  # Analytics & reporting (< 350 lines)
│   └── system/                       # System management modules
│       ├── initialization.js         # System setup & config (< 300 lines)
│       └── health.js                 # Health monitoring (< 300 lines)
├── package.json                      # Dependencies & scripts
└── README.md                         # This file
```

## 🚀 Available Functions

### **Authentication & User Lifecycle**
- `onUserCreated` - Initialize new user documents in Firestore
- `onUserDeleted` - Clean up user data when Auth user is deleted

### **User Management** 
- `deleteUser` - **[FIXED]** Securely delete users from both Auth and Firestore
- `createUser` - Create new user accounts with specified roles
- `updateUserRole` - Change user roles with proper permission checks

### **Audit & Retention System**
- `cleanupAuditLogs` - Scheduled weekly cleanup and compression
- `manualCleanupAuditLogs` - On-demand cleanup for administrators
- `getRetentionStats` - Detailed retention statistics for admin dashboard
- `getAuditStatistics` - Analytics and activity patterns

### **System Management**
- `initializeSystemData` - Set up default permissions, roles, and configuration
- `setupDefaultPermissions` - Initialize permission definitions only
- `setupDefaultRoles` - Initialize role definitions only
- `healthCheck` - Public health endpoint for monitoring
- `systemStatus` - Detailed system status for administrators

## 📋 Module Documentation

### **config/defaults.js**
**Purpose**: Centralized default system configuration
**Exports**:
- `DEFAULT_PERMISSIONS` - All available permission definitions
- `DEFAULT_ROLES` - System role definitions with hierarchies
- `PERMISSION_CATEGORIES` - Permission organization
- `SYSTEM_CONFIG` - Basic system settings

**Key Features**:
- Complete permission taxonomy with categories
- Role hierarchy system (Owner: 100, Admin: 90, User: 50, etc.)
- Extensible permission structure for future features

### **config/audit.js**
**Purpose**: Audit logging and retention configuration
**Exports**:
- `RETENTION_CONFIG` - Retention periods and batch settings
- `RETENTION_TIERS` - Different retention policies (compliance, security, standard)
- `getRetentionTier()` - Classify actions by retention requirements
- `getRetentionHealth()` - Calculate system health metrics

**Key Features**:
- Smart retention policies (90 days → compressed → deleted)
- Compliance-grade retention for sensitive actions
- Performance-optimized batch processing

### **utils/permissions.js**
**Purpose**: Reusable permission checking and validation utilities
**Exports**:
- `getUserPermissions()` - Get complete user permission profile
- `hasPermission()` - Check if user has specific permission
- `validateAuth()` - Validate Firebase Auth context
- `validatePermission()` - Validate and throw errors for missing permissions
- `canManageUserWithRole()` - Check user management permissions

**Key Features**:
- Comprehensive permission resolution (role + custom - denied)
- Security validation helpers
- Rate limiting utilities
- Data validation functions

### **auth/triggers.js** 
**Purpose**: Handle Firebase Authentication lifecycle events
**Functions**:
- `onUserCreated` - Initialize user documents with default settings
- `onUserDeleted` - Clean up user data and related collections

**Key Features**:
- Automatic user document creation with sensible defaults
- Comprehensive cleanup on user deletion
- Audit logging for all auth events
- Error handling with fallback audit logs

### **users/management.js**
**Purpose**: User account management operations
**Functions**:
- `deleteUser` - **[ENHANCED]** Complete user deletion from Auth + Firestore
- `createUser` - Create users with role assignment and email verification
- `updateUserRole` - Role changes with permission validation

**Key Features**:
- **Fixed delete functionality** - Actually removes users completely
- Comprehensive permission checks before any operation
- Automatic cleanup of related user data
- Rate limiting to prevent abuse
- Detailed audit logging

### **audit/retention.js**
**Purpose**: Automated audit log maintenance and cleanup
**Functions**:
- `cleanupAuditLogs` - Scheduled weekly maintenance
- `manualCleanupAuditLogs` - Admin-triggered cleanup

**Key Features**:
- Automated log compression after 90 days
- Intelligent deletion based on retention tiers
- Batch processing for performance
- Health monitoring and error recovery

### **audit/stats.js**
**Purpose**: Audit analytics and system insights
**Functions**:
- `getRetentionStats` - Storage usage and compression metrics
- `getAuditStatistics` - User activity patterns and security events

**Key Features**:
- Real-time analytics for admin dashboard
- Activity pattern analysis (hourly, daily trends)
- Security event monitoring
- Storage projection and optimization

### **system/initialization.js**
**Purpose**: System setup and configuration management
**Functions**:
- `initializeSystemData` - Complete system setup
- `setupDefaultPermissions` - Permission initialization only
- `setupDefaultRoles` - Role initialization only

**Key Features**:
- Idempotent initialization (safe to run multiple times)
- Selective setup for permissions or roles only
- System configuration management
- Version tracking and migration support

### **system/health.js**
**Purpose**: System monitoring and health checks
**Functions**:
- `healthCheck` - Public endpoint for uptime monitoring
- `systemStatus` - Detailed status for administrators

**Key Features**:
- Comprehensive service health checks
- Performance metrics and memory usage
- Database connectivity testing
- Security event monitoring

## 🔧 Development Guidelines

### **File Size Management**
- **Target**: Keep all files under 350 lines
- **Exception**: Only when absolutely necessary for functionality
- **Strategy**: Extract helper functions, split complex logic, create sub-modules

### **Module Responsibility**
- **Single purpose**: Each module has one clear responsibility
- **Clear interfaces**: Well-defined exports and imports
- **Minimal dependencies**: Reduce coupling between modules
- **Error handling**: Consistent patterns across all modules

### **Adding New Modules**
1. **Create** new file in appropriate directory (`src/feature/`)
2. **Follow** naming convention (descriptive, clear purpose)
3. **Keep** under 350 lines
4. **Export** specific functions needed
5. **Import** in `index.js` and re-export
6. **Document** in this README

### **Testing Modules**
```bash
# Test individual module loading
cd functions
node -e "console.log('Testing...'); require('./src/utils/permissions');"

# Test specific function
node -e "
const { getUserPermissions } = require('./src/utils/permissions');
console.log('✅ getUserPermissions loaded');
"

# Test all modules
node -e "
console.log('Testing all modules...');
require('./src/config/defaults');
require('./src/config/audit');
require('./src/utils/permissions');
require('./src/auth/triggers');
require('./src/users/management');
require('./src/audit/retention');
require('./src/audit/stats');
require('./src/system/initialization');
require('./src/system/health');
console.log('✅ All modules loaded successfully');
"
```

## 🚀 Deployment

### **Standard Deployment**
```bash
# Deploy all functions
firebase deploy --only functions

# Deploy with better logging
firebase deploy --only functions --debug
```

### **Development Deployment**
```bash
# Deploy quickly during development
firebase deploy --only functions --force

# Monitor deployment
firebase functions:log --follow
```

### **Troubleshooting Deployment**
```bash
# Check for syntax errors
cd functions
npm run lint

# Clear dependencies
rm -rf node_modules
npm install

# Test function loading
node index.js

# Deploy individual functions (if supported in future)
# firebase deploy --only functions:deleteUser
```

## 📊 Monitoring & Logging

### **Function Logs**
```bash
# All function logs
firebase functions:log

# Specific function
firebase functions:log --only deleteUser
firebase functions:log --only onUserCreated

# Real-time monitoring
firebase functions:log --follow

# Filter by time
firebase functions:log --since 1h
firebase functions:log --since "2025-07-20"
```

### **Performance Monitoring**
- **Memory usage**: Tracked in health.js module
- **Execution time**: Logged automatically by Firebase
- **Error rates**: Monitored through audit system
- **Retention health**: Tracked by audit/stats.js

### **Health Checks**
```bash
# Test health endpoint
curl https://us-central1-ophv2-98d15.cloudfunctions.net/healthCheck

# Check system status (requires auth)
# Use admin panel → System Status
```

## 🔍 Function Details

### **Enhanced Error Handling**
All functions include:
- **Input validation** with specific error messages
- **Permission checking** before any operations
- **Rate limiting** to prevent abuse
- **Comprehensive logging** for debugging
- **Graceful degradation** when possible

### **Security Features**
- **Multi-layer validation**: Client, function, Firestore rules
- **Permission inheritance**: Role-based with custom overrides
- **Audit trails**: All operations logged with retention
- **Rate limiting**: Prevents abuse and DOS attacks
- **Input sanitization**: All user input validated and cleaned

### **Performance Optimizations**
- **Batch operations**: Efficient Firestore operations
- **Connection reuse**: Optimized Firebase Admin usage
- **Memory management**: Monitored and optimized
- **Query optimization**: Indexed and efficient queries

## 🔄 Migration from Monolithic Functions

### **What Changed** (July 2025)
- **Before**: Single 753-line `index.js` file
- **After**: Modular architecture with focused modules
- **Benefit**: Easier maintenance, testing, and feature development

### **Old → New Function Mapping**
| Old Function | New Function | Module | Status |
|-------------|--------------|---------|---------|
| `onNewUser` | `onUserCreated` | auth/triggers.js | ✅ Enhanced |
| `onUserRoleChange` | `updateUserRole` | users/management.js | ✅ Improved security |
| `updateUserActivity` | *(integrated)* | *(built into other functions)* | ✅ Optimized |
| `validatePermission` | *(utils)* | utils/permissions.js | ✅ Modularized |
| *(missing)* | `deleteUser` | users/management.js | 🆕 **Fixed delete functionality** |

### **All Functionality Preserved**
- ✅ **User lifecycle management** - Enhanced with better error handling
- ✅ **Permission system** - More comprehensive and secure
- ✅ **Audit logging** - Improved retention and analytics
- ✅ **System health** - New monitoring capabilities
- 🆕 **User deletion** - Now works correctly!

## 📚 Related Documentation

- [../client/README.md](../client/README.md) - Main project documentation
- [../client/README-DEPLOYMENT.md](../client/README-DEPLOYMENT.md) - Deployment procedures
- [../client/README-SECURITY.md](../client/README-SECURITY.md) - Security and permissions
- [../client/CHANGELOG-JULY-2025.md](../client/CHANGELOG-JULY-2025.md) - Recent changes

## 🎯 Future Enhancements

### **Planned Modules**
- `src/projects/` - Project management functions
- `src/forums/` - Forum and discussion functions
- `src/calendar/` - Event and calendar functions
- `src/reports/` - Analytics and reporting
- `src/notifications/` - Email and push notifications

### **Architecture Improvements**
- **TypeScript migration** - Better type safety
- **Unit testing** - Individual module testing
- **Integration testing** - End-to-end function testing
- **Performance optimization** - Further query optimization

---

*The modular architecture ensures OPHV2 Cloud Functions remain maintainable and scalable as the platform grows.* 🚀