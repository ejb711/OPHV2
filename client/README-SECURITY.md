# OPHV2 - Security & Permissions Guide

## 🔐 Permission System Overview

### Role Hierarchy
```
Owner (100)
  ↓ inherits all from
Admin (90)  
  ↓ inherits all from
User (50)
  ↓ inherits all from  
Viewer (20)
  ↓ inherits all from
Pending (10)
```

### Permission Structure
```javascript
user: {
  role: 'user',                    // Base role
  customPermissions: ['special'],  // Additional
  deniedPermissions: ['delete']    // Explicitly denied
}
// Effective = role + custom - denied
```

## 📋 Permission Categories

### System Permissions
- `view_admin_panel` - Access admin interface
- `manage_system_settings` - Modify system config
- `view_audit_logs` - View system activity
- `manage_audit_retention` - Configure retention

### User Management
- `view_users` - List users
- `create_users` - Add new users
- `edit_users` - Modify user data
- `delete_users` - Remove users
- `manage_user_roles` - Assign roles
- `approve_pending_users` - Approve registrations

### Role Management  
- `view_roles` - List roles
- `create_roles` - Add custom roles
- `edit_roles` - Modify role permissions
- `delete_roles` - Remove roles
- `view_permission_matrix` - See role/permission grid

### Feature Permissions (Ready to implement)
```javascript
// Projects
'view_projects', 'create_projects', 'edit_projects', 'delete_projects'

// Forums
'view_forums', 'post_forums', 'moderate_forums', 'delete_posts'

// Calendar
'view_calendar', 'create_events', 'edit_events', 'delete_events'
```

## 🛡️ Firestore Security Rules

### Basic Pattern
```javascript
match /users/{userId} {
  allow read: if isAuthenticated() && 
    (isOwner(userId) || hasPermission('view_users'));
  
  allow update: if isAuthenticated() && 
    (isOwner(userId) || hasPermission('edit_users'));
    
  allow delete: if hasPermission('delete_users');
}
```

### Helper Functions
```javascript
function isAuthenticated() {
  return request.auth != null;
}

function hasPermission(permission) {
  return request.auth.token.permissions.hasAny([permission]);
}

function isOwner(userId) {
  return request.auth.uid == userId;
}

function hasRole(role) {
  return request.auth.token.role == role;
}
```

### Collection Rules
```javascript
// Audit logs - read only for admins
match /audit_logs/{logId} {
  allow read: if hasPermission('view_audit_logs');
  allow write: if false; // Only Cloud Functions
}

// Roles - managed by admins
match /roles/{roleId} {
  allow read: if hasPermission('view_roles');
  allow write: if hasPermission('manage_roles');
}
```

## 🔍 Permission Checking

### Frontend (Vue)
```javascript
// In components
import { usePermissions } from '@/composables/usePermissions'

const { hasPermission, isAdmin } = usePermissions()

if (hasPermission('delete_users')) {
  // Show delete button
}

// In templates
<v-btn v-if="hasPermission('edit_users')">Edit</v-btn>
```

### Backend (Cloud Functions)
```javascript
// Verify permissions in functions
exports.deleteUser = functions.https.onCall(async (data, context) => {
  // Check auth
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated');
  }
  
  // Check permission
  const permissions = context.auth.token.permissions || [];
  if (!permissions.includes('delete_users')) {
    throw new functions.https.HttpsError('permission-denied');
  }
  
  // Proceed with deletion
});
```

## 🔒 Security Best Practices

### 1. Defense in Depth
```
Frontend checks → Route guards → API validation → Firestore rules
```

### 2. Audit Everything
```javascript
// Log administrative actions
await logAction('user_role_changed', {
  targetUserId,
  oldRole,
  newRole,
  changedBy: context.auth.uid
});
```

### 3. Validate Client Data
```javascript
// Never trust client input
const cleanData = {
  email: data.email?.toLowerCase().trim(),
  role: VALID_ROLES.includes(data.role) ? data.role : 'viewer'
};
```

### 4. Rate Limiting
```javascript
// Implement in Cloud Functions
const rateLimit = new Map();
if (rateLimit.get(context.auth.uid) > 10) {
  throw new functions.https.HttpsError('resource-exhausted');
}
```

## 🚨 Common Security Issues

### Issue: Direct Firestore Access
```javascript
// ❌ Bad: Client writes directly
await setDoc(doc(db, 'users', uid), userData)

// ✅ Good: Use Cloud Function
await httpsCallable('updateUser')({ uid, userData })
```

### Issue: Missing Permission Checks
```javascript
// ❌ Bad: No verification
const deleteUser = (id) => deleteDoc(doc(db, 'users', id))

// ✅ Good: Check permissions
const deleteUser = async (id) => {
  if (!hasPermission('delete_users')) {
    throw new Error('Permission denied')
  }
  return httpsCallable('deleteUser')({ id })
}
```

### Issue: Exposed Sensitive Data
```javascript
// ❌ Bad: Returning all user data
return users

// ✅ Good: Filter sensitive fields
return users.map(u => ({
  id: u.id,
  email: u.email,
  role: u.role
  // Exclude: customPermissions, deniedPermissions
}))
```

## 📊 Audit & Compliance

### Audit Log Structure
```javascript
{
  action: 'user_deleted',
  userId: 'performer-id',
  targetId: 'affected-id',
  timestamp: serverTimestamp(),
  details: { /* context */ },
  ip: context.rawRequest.ip,
  userAgent: context.rawRequest.headers['user-agent']
}
```

### Retention Policy
- **90 days**: Full audit logs
- **365 days**: Compressed summaries
- **Forever**: Compliance-critical actions

---
*See main [README.md](./README.md) for project overview*