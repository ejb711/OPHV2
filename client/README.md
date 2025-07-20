# OPHV2 - Enterprise Dashboard Platform

## 🚀 Project Overview

OPHV2 is a modern, enterprise-grade web platform built on Vue.js 3 and Firebase. Originally conceived as a collaborative site for the Louisiana Department of Health, it has evolved into a robust foundation featuring sophisticated permission-based architecture, modular Cloud Functions, comprehensive audit logging, and advanced user management capabilities.

## 🔧 Quick Start

```bash
# Clone and setup
git clone [repository-url]
cd OPHV2/client
npm install

# Configure environment
cp .env.example .env.local
# Add your Firebase config values

# Start development
npm run dev
```

## 🏗️ Tech Stack

- **Frontend**: Vue.js 3, Vuetify 3, Pinia, Vue Router
- **Backend**: Firebase (Auth, Firestore, Functions, Hosting)  
- **Development**: GitHub Codespaces, Vite, ESLint
- **UI Framework**: Vuetify with Louisiana Department of Health brand standards

## ✅ Current Features

### **🎯 NEW: Admin User Profile Management**
- **Clickable user emails** in admin panel that navigate to comprehensive profile editing
- **UserProfileEditView** - Complete personal information management for any user
- **Professional admin interface** with all profile fields (name, email, phone, title, department, region, location, bio)
- **Role-based editing restrictions** (owners can edit all, admins cannot edit owners)
- **Audit logging** for all profile modifications
- **Seamless workflow** - Click email → edit profile → save → return to admin panel

### **Enterprise Authentication & Authorization**
- **5-tier role hierarchy**: Owner → Admin → User → Viewer → Pending
- **Permission inheritance**: Higher roles inherit all lower role permissions
- **Custom permissions**: Users can have additional permissions beyond their role
- **Permission denial**: Specific permissions can be explicitly denied
- **Secure routing**: Route guards enforce permission requirements
- **🔧 Enhanced login error handling** - User-friendly messages for authentication failures

### **Advanced Admin Management**
- **User Management**: Create, edit, delete users with role assignment
- **✨ Enhanced Profile Editing**: Click user emails to access comprehensive profile editing interface
- **Role Management**: Create custom roles with specific permission sets
- **Permission Matrix**: Visual grid showing all role-permission relationships
- **Audit Logging**: Tracks all administrative actions with 90-day retention
- **System Monitoring**: Real-time activity tracking and statistics

### **Comprehensive User Features**
- **Profile Management**: Tabbed interface for user settings and preferences
- **Dashboard**: Role-based content display with quick actions
- **Awaiting Approval**: Workflow for pending users awaiting admin approval

### **Robust Infrastructure**
- **Modular Cloud Functions**: 8 focused modules for maintainability
- **Firestore Security Rules**: Permission-based access control at database level
- **Component Guards**: PermissionGuard wrapper for conditional UI rendering
- **Brand Compliance**: Consistent typography and color scheme per LDH standards

### **Advanced Systems**
- **Audit Logging with Retention**: 
  - Automatic 90-day full retention, 365-day compressed retention
  - Compliance actions tracked separately
  - Use `useAudit()` composable for all important actions
- **Permission System**: 
  - Granular permissions with categories
  - Runtime permission checking via `usePermissions()`
  - Firestore rules enforce backend security
- **Error Handling**: 
  - Consistent error transformation patterns
  - User-friendly messages with snackbar notifications
  - Graceful degradation for network issues

## 📁 Project Structure

```
/
├── client/                      # Vue.js frontend application
│   ├── src/
│   │   ├── components/         # Reusable UI components
│   │   │   ├── PermissionGuard.vue  # Access control wrapper
│   │   │   ├── AppLayout.vue        # Universal layout wrapper
│   │   │   └── admin/              # Admin-specific components
│   │   │       └── UserManagement.vue  # Enhanced with clickable emails
│   │   ├── views/              # Page components
│   │   │   ├── DashboardView.vue       # Main user dashboard
│   │   │   ├── AdminView.vue           # Admin panel
│   │   │   ├── ProfileView.vue         # User profile management
│   │   │   ├── LoginView.vue           # 🔧 Enhanced error handling
│   │   │   └── UserProfileEditView.vue # 🆕 Admin user profile editing
│   │   ├── stores/             # Pinia state management
│   │   │   ├── auth.js            # Authentication & user permissions
│   │   │   └── permissions.js     # Role & permission management
│   │   ├── composables/        # Reusable composition functions
│   │   │   ├── usePermissions.js  # Permission checking utilities
│   │   │   ├── useAudit.js       # Audit logging with retention
│   │   │   └── useErrorHandler.js # 🔧 Enhanced Firebase error handling
│   │   └── router/             # Vue Router configuration
│   │       └── index.js           # Routes with permission guards
├── functions/                  # Modular Cloud Functions
│   ├── index.js               # Main entry point (67 lines)
│   ├── src/                   # Organized module structure
│   │   ├── config/           # Configuration modules
│   │   ├── utils/            # Utility functions
│   │   ├── auth/             # Authentication handlers
│   │   ├── users/            # User management (✅ FIXED deleteUser)
│   │   ├── audit/            # Audit and retention
│   │   └── system/           # System health monitoring
│   └── README.md             # Complete function documentation
├── scripts/                   # Administrative utilities
│   └── add-owner-user.js      # Create initial owner account
└── firestore.rules            # Database security rules
```

## 🔗 Quick Links

- **Firebase Console**: https://console.firebase.google.com/project/ophv2-98d15
- **Hosting URL**: https://ophv2-98d15.web.app
- **Firestore Database**: https://console.firebase.google.com/project/ophv2-98d15/firestore
- **Function Logs**: https://console.firebase.google.com/project/ophv2-98d15/functions/logs

## 🚀 Getting Started (New Developers)

1. **Clone and setup**:
   ```bash
   git clone [repository-url]
   cd OPHV2/client
   npm install
   ```

2. **Environment configuration**:
   ```bash
   cp .env.example .env.local
   # Add your Firebase config values (ask team for keys)
   ```

3. **Start development**:
   ```bash
   npm run dev
   # Application will be available at http://localhost:5173
   ```

4. **Test login**:
   - Use the test account: `test2@example.com` / `password`
   - Or create a new account through the admin panel

## 🛠️ Development Workflow

### **Making Changes**
```bash
# Create feature branch
git checkout -b feature/your-feature-name

# Make your changes
# Test thoroughly with different user roles

# Commit and push
git add .
git commit -m "feat: describe your changes"
git push origin feature/your-feature-name
```

### **Testing Checklist**
- [ ] Test with all user roles (Owner, Admin, User, Viewer, Pending)
- [ ] Verify permission system works correctly
- [ ] Check audit logging captures actions
- [ ] Test error scenarios (network issues, invalid data, etc.)
- [ ] Verify responsive design on mobile
- [ ] Check console for errors or warnings

### **Code Standards**
- **Component files**: Keep under 350 lines for maintainability
- **Use composables**: Extract reusable logic
- **Permission guards**: Always check permissions for sensitive operations
- **Error handling**: Use `useErrorHandler()` for consistent error management
- **Audit logging**: Use `useAudit()` for tracking important actions

## 🔐 Permission System

### **Role Hierarchy**
```
Owner (100)    - Full system access, cannot be restricted
  ↓
Admin (90)     - User management, system configuration  
  ↓
User (50)      - Standard features, create/edit own content
  ↓
Viewer (20)    - Read-only access to permitted content
  ↓
Pending (10)   - Awaiting approval, minimal access
```

### **Common Permission Categories**
- **System**: Core administrative functions
- **Users**: User management operations  
- **Roles**: Role and permission management
- **Projects**: Project-related permissions
- **Forums**: Discussion features
- **Calendar**: Event management

### **Using Permissions in Components**
```vue
<template>
  <PermissionGuard permission="manage_users">
    <AdminPanel />
  </PermissionGuard>
  
  <PermissionGuard :any-permissions="['edit_projects', 'manage_projects']">
    <EditButton @click="editProject" />
  </PermissionGuard>
</template>

<script setup>
import { usePermissions } from '@/composables/usePermissions'

const { hasPermission, isAdmin, canManageUsers } = usePermissions()

// Use in JavaScript logic
if (hasPermission('delete_users')) {
  // Allow user deletion
}
</script>
```

## 🔧 Cloud Functions (Modular Architecture)

### **Available Functions**
- **User Management**: `deleteUser`, `createUser`, `updateUserRole`, `updateUserProfile`
- **System Health**: `healthCheck`, `systemStatus`
- **Audit System**: `cleanupAuditLogs`, `getAuditStatistics`
- **Authentication**: `onUserCreated`, `onUserDeleted`

### **Testing Functions Locally**
```bash
# Start emulators
firebase emulators:start --only functions,firestore,auth

# Test individual function
firebase functions:shell
> deleteUser({userId: 'test-user-id'})

# Monitor function logs
firebase functions:log --only deleteUser
```

### **Function Development**
See `functions/README.md` for detailed documentation on:
- Module structure and organization
- Development guidelines and best practices
- Deployment procedures
- Troubleshooting common issues

## 🐛 Troubleshooting

### **🔧 Login Issues**

#### **Problem: User sees "Invalid email or password" but credentials are correct**
**Solution**: Check Firebase console for account status
```bash
# Check Firebase Auth console
# Navigate to: Firebase Console → Authentication → Users
# Verify user exists and is not disabled
```

#### **Problem: Login form shows technical error codes**
**Solution**: Verify error handler is working correctly
- **Check**: Error handler has latest Firebase error code mappings
- **Modern Firebase**: Uses `auth/invalid-credential` instead of specific errors
- **Expected behavior**: Users should see "Invalid email or password" for any authentication failure
- **Developer console**: Will still show technical details for debugging

#### **Problem: Login fails with network errors**
**Solutions**:
1. **Check internet connection**
2. **Verify Firebase project configuration** in `.env` file
3. **Test Firebase connection**:
   ```bash
   # Test Firebase connection
   firebase projects:list
   firebase use ophv2-98d15
   ```

#### **Problem: Console shows "auth/too-many-requests"**
**Solution**: Firebase rate limiting triggered
- **User message**: "Too many failed attempts. Please try again later"
- **Resolution**: Wait 15-30 minutes or reset from Firebase console
- **Prevention**: Implement proper password reset functionality

### **Admin Panel Issues**

#### **Problem: Admin panel won't load - "TypeError: permissionsStore.loadPermissions is not a function"**
**Solution**: Update AdminView.vue method call
```javascript
// ❌ Incorrect
await permissionsStore.loadPermissions()

// ✅ Correct  
await permissionsStore.loadAllData()
```

#### **Problem: "Add User" button creates user in Firestore but not Firebase Auth**
**Solution**: Verify Cloud Function integration
1. **Check function deployment**:
   ```bash
   firebase functions:list | grep createUser
   ```
2. **Test function directly**:
   ```bash
   firebase functions:log --only createUser
   ```
3. **Verify permissions**: User must have `create_users` permission

#### **Problem: User deletion fails**
**Solution**: Use modular deleteUser function
- **Function**: Now properly deletes from both Firebase Auth and Firestore
- **Test**: `firebase functions:log --only deleteUser`
- **Permissions**: Requires `delete_users` permission

### **Permission System Issues**

#### **Problem: User can't access features they should have access to**
**Debugging steps**:
1. **Check user role**: Console → `authStore.role`
2. **Check effective permissions**: Console → `authStore.effectivePermissions`
3. **Verify permission name**: Ensure exact spelling
4. **Check permission cache**: Try `authStore.refreshPermissions()`

#### **Problem: Permission checks not working in routes**
**Solution**: Verify route meta configuration
```javascript
{
  path: '/admin',
  component: AdminView,
  meta: { 
    requiresAuth: true,
    requiresPermission: 'access_admin'  // Check spelling
  }
}
```

### **Database Issues**

#### **Problem: Firestore permission denied errors**
**Solutions**:
1. **Check security rules**: Verify user has required permissions
2. **Verify user authentication**: Ensure user is logged in
3. **Test rules**: Use Firestore simulator in Firebase console

#### **Problem: Data not updating in real-time**
**Solutions**:
1. **Check Firestore listeners**: Verify `onSnapshot` usage
2. **Memory leaks**: Ensure listeners are cleaned up in `onUnmounted`
3. **Network issues**: Check browser network tab

### **Development Environment Issues**

#### **Problem: npm install fails**
**Solutions**:
```bash
# Clear npm cache
npm cache clean --force

# Delete node_modules and reinstall
rm -rf node_modules package-lock.json
npm install

# Use specific Node version (if using nvm)
nvm use 18
npm install
```

#### **Problem: Vite dev server won't start**
**Solutions**:
1. **Check port availability**: Default is 5173
2. **Clear Vite cache**:
   ```bash
   rm -rf node_modules/.vite
   npm run dev
   ```
3. **Check environment variables**: Verify `.env.local` configuration

#### **Problem: ESLint errors prevent compilation**
**Quick fix**:
```bash
# Fix auto-fixable errors
npm run lint:fix

# Disable specific rules temporarily (not recommended for production)
// eslint-disable-next-line rule-name
```

### **Production Deployment Issues**

#### **Problem: Build fails with import errors**
**Solutions**:
1. **Check dynamic imports**: Ensure proper lazy loading syntax
2. **Verify dependencies**: All imports have corresponding packages
3. **Clear build cache**:
   ```bash
   rm -rf dist
   npm run build
   ```

#### **Problem: Functions deployment fails**
**Solutions**:
1. **Test functions locally**: `firebase emulators:start --only functions`
2. **Check Node.js version**: Functions require Node.js 20.x
3. **Verify function syntax**: Test individual modules:
   ```bash
   cd functions
   node -e "require('./src/users/management.js'); console.log('✅ Module loaded')"
   ```

### **Getting Help**

#### **Console Debugging**
```javascript
// Check auth state
console.log('Auth State:', {
  user: authStore.user,
  role: authStore.role,
  permissions: authStore.effectivePermissions,
  ready: authStore.ready
})

// Check permission for specific action
console.log('Can manage users:', authStore.hasPermission('manage_users'))
```

#### **Useful Firebase Console Commands**
```bash
# Check project status
firebase projects:list
firebase use ophv2-98d15

# Monitor functions
firebase functions:log --since 1h

# Check Firestore indexes
firebase firestore:indexes

# Test security rules
firebase emulators:start --only firestore
```

#### **Log Analysis**
- **Frontend errors**: Browser console (F12)
- **Function errors**: Firebase Console → Functions → Logs
- **Database errors**: Firebase Console → Firestore → Usage tab
- **Authentication errors**: Firebase Console → Authentication → Users

#### **Common Error Patterns**
- **"Permission denied"**: Check Firestore rules and user permissions
- **"Function not found"**: Verify function deployment and naming
- **"User not authenticated"**: Check auth state and token validity
- **"Network request failed"**: Check internet connection and Firebase project status

## 📚 Additional Documentation

- **Deployment Guide**: See `client/README-DEPLOYMENT.md`
- **Security Overview**: See `client/README-SECURITY.md`
- **Frontend Composables**: See `client/README-FRONTEND-COMPOSABLES.md`
- **Cloud Functions**: See `functions/README.md`
- **Firestore Permissions Fix**: See `client/README-FIRESTORE-PERMISSIONS-FIX.md`

## 🚀 Current Status

### **✅ Production Ready Features**
- **Authentication**: Multi-tier role system with enhanced error handling ✅
- **User Management**: Complete CRUD with admin profile editing ✅
- **Admin Interface**: Professional panel with all management capabilities ✅
- **Audit System**: Comprehensive logging with retention policies ✅
- **Security**: Multi-layer permission enforcement ✅
- **Performance**: Optimized queries and efficient real-time updates ✅
- **Cloud Functions**: Modular architecture with full CRUD capabilities ✅
- **Error Handling**: User-friendly messages with graceful recovery ✅

### **🎯 Ready for Feature Development**
The foundation is complete and robust. The permission system is designed to easily accommodate new features. The modular Cloud Functions architecture supports rapid development of additional capabilities.

**OPHV2 Status**: 🚀 **Enterprise-Ready Platform** prepared for advanced feature development (Projects, Forums, Calendar, Advanced Reporting)

---

*This platform provides a solid foundation for building sophisticated enterprise applications with Vue.js 3 and Firebase, featuring comprehensive user management, advanced permissions, audit logging, and professional admin interfaces with enhanced error handling.*