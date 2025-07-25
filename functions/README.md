# OPHV2 Functions - Firebase Cloud Functions

## Overview

The OPHV2 functions module provides the serverless backend for the Louisiana Department of Health Operations Hub. It implements secure API endpoints for user management, authentication triggers, audit logging, and system operations.

## Architecture

The functions follow a modular architecture for better maintainability and scalability:

```
functions/
├── index.js              # Main entry point and function exports
└── src/
    ├── auth/            # Authentication event triggers
    ├── users/           # User management operations
    ├── audit/           # Audit logging and retention
    ├── system/          # System operations and health checks
    ├── comms/           # Communications module functions
    ├── config/          # Configuration and defaults
    └── utils/           # Shared utilities
```

## Available Functions

### User Management (`src/users/`)

#### `createUser`
Creates a new user with Firebase Authentication and Firestore profile.
- **Permissions Required**: `create_users`
- **Parameters**: email, password, displayName, role, region, phone, department, title
- **Returns**: User ID and success status

#### `updateUserProfile`
Updates user profile information in Firestore.
- **Permissions Required**: `edit_users`
- **Parameters**: userId, profile data object
- **Returns**: Success status

#### `updateUserRole`
Changes a user's role with proper validation.
- **Permissions Required**: `manage_user_roles`
- **Parameters**: userId, newRole
- **Validation**: Ensures caller has higher role hierarchy

#### `updateUserStatus`
Updates user account status (active, suspended, inactive).
- **Permissions Required**: `manage_users`
- **Parameters**: userId, status
- **Returns**: Success status

#### `deleteUser`
Removes user from Firebase Auth and Firestore.
- **Permissions Required**: `delete_users`
- **Parameters**: userId
- **Actions**: Deletes auth account, Firestore profile, and related data

#### `bulkUpdateUsers`
Performs batch operations on multiple users.
- **Permissions Required**: `manage_users`
- **Parameters**: Array of user operations
- **Returns**: Results array with success/failure for each operation

#### `getUserDetails`
Retrieves detailed user information.
- **Permissions Required**: `view_users`
- **Parameters**: userId
- **Returns**: Complete user profile with permissions

### Authentication Triggers (`src/auth/`)

#### `onUserCreated`
Automatically triggered when a new user signs up.
- **Type**: Auth trigger
- **Actions**: Creates initial Firestore profile, assigns default role

#### `onUserDeleted`
Automatically triggered when a user is deleted.
- **Type**: Auth trigger
- **Actions**: Cleans up Firestore data, audit logs

### Audit System (`src/audit/`)

#### `cleanupAuditLogs`
Scheduled function for automatic log retention.
- **Schedule**: Daily at 2 AM
- **Actions**: Removes logs older than retention period
- **Retention Periods**:
  - Compliance actions: 7 years
  - Security events: 365 days
  - Standard actions: 90 days
  - Operational events: 30 days

#### `manualCleanupAuditLogs`
On-demand audit log cleanup.
- **Permissions Required**: `manage_audit_logs`
- **Parameters**: Optional retention overrides
- **Returns**: Cleanup statistics

#### `getRetentionStats`
Retrieves audit log retention statistics.
- **Permissions Required**: `view_audit_logs`
- **Returns**: Log counts by category and age

#### `getAuditStatistics`
Provides audit activity analytics.
- **Permissions Required**: `view_audit_logs`
- **Parameters**: dateRange, filters
- **Returns**: Activity metrics and trends

### System Operations (`src/system/`)

#### `initializeSystemData`
Sets up initial system configuration.
- **Permissions Required**: `system_admin`
- **Actions**: Creates default roles, permissions, settings
- **Use Case**: First-time setup or system reset

#### `healthCheck`
System health monitoring endpoint.
- **Public Access**: Yes (rate limited)
- **Returns**: System status, database connectivity, function versions

#### `systemStatus`
Detailed system status report.
- **Permissions Required**: `view_system_status`
- **Returns**: Comprehensive system metrics

### Communications Module (`src/comms/`)

#### `initializeCommsData`
Sets up communications module defaults.
- **Permissions Required**: `system_admin`
- **Actions**: Creates project templates, default tags, regions

## Security

### Permission Validation
All functions implement multi-layer security:
1. Firebase Authentication verification
2. Custom claims validation
3. Role hierarchy checking
4. Operation-specific permissions
5. Firestore security rules as final layer

### Error Handling
Functions provide user-friendly error messages while logging detailed errors server-side:
```javascript
try {
  // Operation
} catch (error) {
  console.error('Detailed error:', error);
  throw new functions.https.HttpsError(
    'permission-denied',
    'You do not have permission to perform this action'
  );
}
```

### Rate Limiting
Sensitive operations implement rate limiting to prevent abuse:
- User creation: 10 per minute per admin
- Bulk operations: 100 users per request
- Health checks: 60 per minute per IP

## Development

### Local Development

```bash
# Install dependencies
cd functions
npm install

# Run emulators
firebase emulators:start --only functions,firestore,auth

# Run tests
npm test
```

### Environment Configuration

Required environment variables:
```bash
# Set project configuration
firebase functions:config:set project.id="your-project-id"
firebase functions:config:set project.region="us-central1"
```

### Debugging

Enable detailed logging:
```javascript
const functions = require('firebase-functions');
functions.logger.info('Debug info', { structuredData: true });
```

View logs:
```bash
# Recent logs
firebase functions:log

# Specific function logs
firebase functions:log --only createUser

# Live tail
firebase functions:log --follow
```

## Deployment

### Deploy All Functions
```bash
firebase deploy --only functions
```

### Deploy Specific Functions
```bash
# Deploy user management functions
firebase deploy --only functions:createUser,functions:updateUserProfile

# Deploy by module
firebase deploy --only functions:auth,functions:users
```

### Rollback
```bash
# List function versions
firebase functions:list

# Delete and redeploy
firebase functions:delete functionName
firebase deploy --only functions:functionName
```

## Best Practices

### Code Organization
- Keep functions under 200 lines
- Extract shared logic to utilities
- Use consistent error handling
- Implement comprehensive logging

### Performance
- Minimize cold starts with lightweight imports
- Use batch operations for multiple items
- Implement caching where appropriate
- Optimize Firestore queries

### Security
- Always validate permissions
- Sanitize user inputs
- Use parameterized queries
- Log security events
- Implement rate limiting

### Testing
- Unit test individual functions
- Integration test with emulators
- Test permission boundaries
- Verify error scenarios

## Monitoring

### Health Monitoring
```bash
# Check function health
curl https://us-central1-ophv2-98d15.cloudfunctions.net/healthCheck
```

### Performance Monitoring
- Firebase Console → Functions → Metrics
- Monitor execution time, memory usage
- Set up alerting for failures

### Audit Trail
All administrative actions are logged:
- User management operations
- Permission changes
- System configuration updates
- Failed authentication attempts

## Troubleshooting

### Common Issues

1. **Permission Denied Errors**
   - Verify user has required permission
   - Check role hierarchy
   - Review Firestore rules

2. **Function Timeouts**
   - Increase timeout in function config
   - Optimize database queries
   - Implement pagination

3. **Deployment Failures**
   - Check Node.js version compatibility
   - Verify all dependencies installed
   - Review function logs

### Debug Commands
```bash
# Check deployment status
firebase functions:list

# View detailed logs
firebase functions:log --only functionName

# Test function locally
npm run serve
```

## Migration Notes

When updating function signatures:
1. Deploy new version alongside old
2. Update clients to use new version
3. Monitor old version usage
4. Remove old version after migration

## Support

For issues or questions:
- Check function logs first
- Review error messages
- Consult security rules
- Contact development team