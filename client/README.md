# OPHV2 - Enterprise Dashboard Platform

## 🚀 Project Overview

OPHV2 is a modern, enterprise-grade web platform built on Vue.js 3 and Firebase. Originally conceived as a collaborative site for the Louisiana Department of Health, it has evolved into a robust foundation featuring sophisticated permission-based architecture, modular Cloud Functions, and comprehensive audit logging.

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

### **Enterprise Authentication & Authorization**
- **5-tier role hierarchy**: Owner → Admin → User → Viewer → Pending
- **Permission inheritance**: Higher roles inherit all lower role permissions
- **Custom permissions**: Users can have additional permissions beyond their role
- **Permission denial**: Specific permissions can be explicitly denied
- **Secure routing**: Route guards enforce permission requirements

### **Advanced Admin Management**
- **User Management**: Create, edit, delete users with role assignment
- **Role Management**: Create custom roles with specific permission sets
- **Permission Matrix**: Visual grid showing all role-permission relationships
- **Audit Logging**: Tracks all administrative actions with 90-day retention
- **System Monitoring**: Real-time activity tracking and statistics

### **User Experience Features**
- **Profile Management**: Tabbed interface for user settings and preferences
- **Dashboard**: Role-based content display with quick actions
- **Awaiting Approval**: Workflow for pending users awaiting admin approval
- **Real-time Updates**: Live data synchronization across all interfaces

### **Modular Cloud Functions** (NEW)
- **Organized Architecture**: Clear separation of concerns in focused modules
- **User Management**: Complete CRUD operations with security validation
- **Audit System**: Automated logging with intelligent retention policies
- **System Health**: Monitoring and maintenance capabilities
- **Enhanced Security**: Multi-layer validation and rate limiting

## 🛠️ Recent Fixes & Updates

### **Latest (July 20, 2025 Evening)**

#### **✅ FIXED: Admin Panel Load Error**
- **Issue**: `TypeError: permissionsStore.loadPermissions is not a function`
- **Solution**: Updated AdminView.vue to use correct `permissionsStore.loadAllData()` method
- **Status**: ✅ Admin panel now loads without console errors

#### **✅ FIXED: User Creation Not Working**
- **Issue**: Add User button created users in Firestore but not Firebase Auth
- **Solution**: Implemented proper Cloud Function calls for server-side user creation
- **Status**: ✅ Users now created in both Firebase Auth and Firestore, can sign in immediately

### **Major Updates (July 20, 2025 Morning)**

#### **✅ FIXED: User Delete Functionality**
- **Issue**: Delete button showed success but users remained in database
- **Solution**: New modular `deleteUser` Cloud Function with complete removal
- **Status**: ✅ Users properly deleted from both Firebase Auth and Firestore

#### **✅ ENHANCED: Modular Cloud Functions Architecture**  
- **Migration**: Transformed 753-line monolithic functions into focused modules
- **Benefits**: Easier maintenance, better testing, team development support
- **Status**: ✅ All functions modular, each file < 350 lines

#### **✅ FIXED: Firestore Permissions Errors**
- **Issue**: "Missing or insufficient permissions" errors in console
- **Solution**: Updated security rules for client-side audit logging
- **Status**: ✅ Comprehensive audit logging working without errors

## 🚨 Common Issues & Troubleshooting

### **Admin Panel Issues**

#### 1. **Admin Panel Won't Load / Store Method Errors** (FIXED)
**Symptoms**: Console error `TypeError: permissionsStore.loadPermissions is not a function`
```bash
AdminView.vue:320 Error loading admin panel: TypeError: permissionsStore.loadPermissions is not a function
```

**Solution**: 
- ✅ **Fixed in current codebase** - AdminView.vue updated to use correct method
- 🔄 **If still seeing**: Clear browser cache and hard refresh (Ctrl+Shift+R)
- 🚀 **Test**: Admin Panel should load statistics and tabs correctly

#### 2. **Add User Button Not Working** (FIXED)
**Symptoms**: Users appear in Firestore but not Firebase Auth console, can't sign in
```bash
User shows in admin panel but cannot authenticate with provided credentials
```

**Solution**: 
- ✅ **Fixed in current codebase** - Now uses Cloud Function for proper user creation
- 🔧 **Verification**: Check Firebase Auth console after creating user
- 🚀 **Test**: New users should appear in both Firestore AND Firebase Auth

#### 3. **User Delete Functionality** (FIXED)
**Symptoms**: Delete button shows success but user not removed from admin panel
```bash
User appears deleted but remains in database and user list
```

**Solution**: 
- ✅ **Fixed in current codebase** - New modular `deleteUser` Cloud Function
- ✅ **Complete removal** - Deletes from both Firestore and Firebase Auth
- ✅ **Real-time UI updates** - Users disappear immediately from admin panel
- 🚀 **Test**: Admin Panel → User Management → Delete user button

### **Development Issues**

#### 4. **Firestore Permissions Errors** (FIXED)
**Symptoms**: "Missing or insufficient permissions" errors in console, especially in admin panel
```bash
Failed to log audit event: FirebaseError: Missing or insufficient permissions.
```

**Solution**: 
- ✅ **Fixed in current codebase** - Security rules updated for client-side audit logging
- 📖 **See**: `README-FIRESTORE-PERMISSIONS-FIX.md` for detailed fix documentation
- 🚀 **Quick Fix**: Run `./fix-firestore-permissions.sh` if errors persist

#### 5. **useActivityTracker Import Errors** (FIXED)
**Symptoms**: "The requested module does not provide an export named 'useActivityTracker'"
```bash
Uncaught SyntaxError: The requested module '/src/composables/useActivityTracker.js' 
does not provide an export named 'useActivityTracker'
```

**Solution**: 
- ✅ **Fixed in current codebase** - Complete composable with proper exports
- 🔧 **Root Cause**: File was truncated and missing return statement
- 📁 **File**: `client/src/composables/useActivityTracker.js` is now complete

#### 6. **Cloud Functions Organization** (IMPROVED)
**Symptoms**: Monolithic 753-line functions file difficult to maintain
**Solution**:
- ✅ **Modular architecture** - Functions split into focused modules (< 350 lines each)
- ✅ **Clear separation** - Auth, users, audit, system modules
- ✅ **Better maintainability** - Easy to find and modify specific functionality
- ✅ **Enhanced error handling** - Consistent patterns across all modules

### **General Troubleshooting**

#### 7. **Permission Denied Errors**
```bash
# Symptoms
Error: Permission denied accessing collection 'users'
```
**Diagnosis Steps**:
1. Check Firestore rules: `firebase firestore:rules get`
2. Verify user role in Firestore Console → users collection
3. Check effective permissions in browser dev tools
4. Redeploy rules if needed: `firebase deploy --only firestore:rules`

#### 8. **Function Deployment Fails**
```bash
# Clean and retry
cd functions
rm -rf node_modules
npm install
firebase deploy --only functions
```

#### 9. **Development Server Issues**
```bash
# Clear cache and restart
rm -rf node_modules/.vite
npm run dev

# Or complete reset
rm -rf node_modules
npm install
npm run dev
```

#### 10. **Build Failures**
```bash
# Check for errors
npm run build

# Common fixes:
- Remove unused imports
- Check for TypeScript errors
- Verify all components are properly imported
```

## 🔍 Debugging & Monitoring

### **Cloud Functions Debugging**
```bash
# Monitor function logs in real-time
firebase functions:log --follow

# Check specific function
firebase functions:log --only deleteUser --since 1h

# Test function locally
cd functions
npm run serve

# Check function health
curl https://us-central1-ophv2-98d15.cloudfunctions.net/healthCheck
```

### **Enhanced Function Monitoring (NEW)**
```bash
# Monitor modular functions
firebase functions:log --only createUser,deleteUser,updateUserRole

# Check audit system
firebase functions:log --only cleanupAuditLogs,getRetentionStats

# System health monitoring  
firebase functions:log --only healthCheck,systemStatus

# Module-specific monitoring
firebase functions:log --only onUserCreated,manualCleanupAuditLogs
firebase functions:log --follow     # Real-time monitoring

# View security rules
firebase firestore:rules get

# Test rule deployment
firebase firestore:rules validate

# List all deployed functions
firebase functions:list
```

## 📚 Related Documentation

- [README-FRONTEND-COMPOSABLES.md](./README-FRONTEND-COMPOSABLES.md) - Vue composables documentation
- [README-SECURITY.md](./README-SECURITY.md) - Permission system details
- [README-DEPLOYMENT.md](./README-DEPLOYMENT.md) - Build & deploy guide (updated for modular functions)
- [README-FIRESTORE-PERMISSIONS-FIX.md](./README-FIRESTORE-PERMISSIONS-FIX.md) - Detailed fix documentation
- [CHANGELOG-JULY-2025.md](./CHANGELOG-JULY-2025.md) - Recent updates and changes
- [functions/README.md](../functions/README.md) - Modular Cloud Functions documentation
- [Brand Standards Guide](./LDHBrandGuide2019.pdf) - LDH design system

## 🎯 Current Status

✅ **Complete**: Auth system, role management, admin panel, audit logging, **modular functions**  
✅ **Recently Fixed**: User deletion, Firestore permissions, activity tracking, function organization, **admin panel loading, user creation**  
✅ **Enhanced**: Modular architecture, improved error handling, comprehensive logging  
🚧 **Ready to Build**: Projects, Forums, Calendar, Reports (with solid foundation)  
📋 **Maintenance**: Maintain modular structure (files < 350 lines), update docs with changes  

## 🏗️ Architecture Highlights

### **Modular Cloud Functions** (NEW)
- **Organized**: Clear separation of concerns in focused modules
- **Maintainable**: Each file < 350 lines for easy development
- **Scalable**: Easy to add new features without touching existing code
- **Testable**: Individual modules can be tested in isolation

### **Permission System**
- **5-tier hierarchy**: Owner → Admin → User → Viewer → Pending
- **Granular controls**: Custom permissions and denials
- **Inheritance**: Higher roles get all lower role permissions
- **Security**: Multi-layer validation (client, functions, Firestore rules)

### **Audit System**
- **Comprehensive tracking**: All user actions logged with retention
- **Smart retention**: 90-day full, 365-day compressed, 7-year compliance
- **Performance optimized**: Automatic cleanup and compression
- **Privacy compliant**: Configurable retention policies

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

2. **Configure environment**:
   ```bash
   # Copy environment template
   cp .env.example .env.local
   # Add your Firebase config values
   ```

3. **Start development**:
   ```bash
   npm run dev
   ```

4. **Test permissions** (important):
   - Create test account
   - Verify login flow works
   - Check browser console for permission errors
   - Test admin panel access (admin/owner accounts)

5. **Understand modular functions**:
   ```bash
   # Explore the function structure
   ls -la functions/src/
   
   # Check function documentation
   cat functions/README.md
   ```

## 🔄 Migration Notes

### **From Monolithic to Modular Functions** (July 2025)
If upgrading from older versions:

1. **Functions were reorganized** - Old functions deleted, new modular structure deployed
2. **All functionality preserved** - Enhanced error handling and security
3. **Delete user now works** - Properly removes users from both Auth and Firestore
4. **Better maintainability** - Each module focuses on specific functionality

### **AdminView.vue Updates** (July 2025)
Recent fixes address:

1. **Store method compatibility** - Updated to use correct permissions store methods
2. **User creation process** - Now properly creates users via Cloud Functions
3. **Enhanced error handling** - Better feedback for failed operations
4. **Form validation** - Improved user input validation and security

### **File Organization Best Practices**
- **Keep files < 350 lines** - Extract to new modules when approaching limit
- **Single responsibility** - Each file/module has one clear purpose
- **Clear naming** - File names describe their specific functionality
- **Consistent patterns** - Similar functions follow same patterns across modules

---

*OPHV2 is built for the future - modular, scalable, and ready for enterprise growth.* 🚀

**Latest Update**: July 20, 2025 - AdminView.vue fixes complete, all admin functionality working correctly.