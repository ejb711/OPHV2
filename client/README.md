# OPHV2 - Enterprise Permission Platform

## 🚨 Project Overview
OPHV2 is an enterprise-grade web platform built on Vue.js 3 and Firebase, featuring a sophisticated permission-based architecture. Originally conceived as a simple collaborative site, it has evolved into a robust foundation ready for feature development.

## 📋 Collections
- `users/` - User profiles with roles and permissions
- `roles/` - Role definitions with hierarchical permissions
- `permissions/` - Available permission definitions
- `audit_logs/` - Activity tracking with 90-day retention and compression

### Cloud Functions (Modular Architecture)
```
functions/
├── index.js                    # Main entry point & exports
├── src/
│   ├── config/
│   │   ├── defaults.js         # Default permissions, roles, system settings
│   │   └── audit.js           # Audit logging & retention configuration
│   ├── utils/
│   │   └── permissions.js     # Permission checking utilities
│   ├── auth/
│   │   └── triggers.js        # Firebase Auth event handlers
│   ├── users/
│   │   └── management.js      # User CRUD operations (create, delete, update)
│   ├── audit/
│   │   ├── retention.js       # Log cleanup & compression system
│   │   └── stats.js          # Analytics & reporting functions
│   └── system/
│       ├── initialization.js  # System setup & configuration
│       └── health.js         # Health monitoring & status checks
```

**Available Functions:**
- `onUserCreated` / `onUserDeleted` - User lifecycle management
- `deleteUser` / `createUser` / `updateUserRole` - User management (**fixed delete functionality**)
- `cleanupAuditLogs` / `manualCleanupAuditLogs` - Retention system
- `getRetentionStats` / `getAuditStatistics` - Analytics
- `initializeSystemData` / `healthCheck` / `systemStatus` - System management

## 📦 Key Dependencies

### Frontend
- `firebase`: 11.10.0
- `vue`: 3.5.17
- `vuetify`: 3.9.0
- `pinia`: 3.0.3
- `@mdi/font`: 7.4.47

### Cloud Functions (Modular)
- `firebase-admin`: 13.4.0
- `firebase-functions`: 6.4.0
- **Architecture**: Modular design with files < 350 lines each

## 🛠️ Common Commands

```bash
# Development
npm run dev                  # Start dev server
npm run lint                # Run ESLint
npm run build              # Build for production

# Firebase
firebase login             # Authenticate
firebase use ophv2-98d15   # Select project
firebase deploy            # Full deployment
firebase deploy --only functions
firebase deploy --only hosting
firebase deploy --only firestore:rules

# Admin Scripts
node scripts/add-owner-user.js  # Create owner account
```

## 🐛 Troubleshooting

### ⚠️ **Recently Fixed Issues** (Updated July 20, 2025)

#### 1. **User Delete Functionality** (FIXED)
**Symptoms**: Delete button shows success but user not removed from Firestore or admin panel
```bash
User appears deleted but remains in database and user list
```

**Solution**: 
- ✅ **Fixed in current codebase** - New modular `deleteUser` Cloud Function
- ✅ **Complete removal** - Deletes from both Firestore and Firebase Auth
- ✅ **Real-time UI updates** - Users disappear immediately from admin panel
- 🚀 **Test**: Admin Panel → User Management → Delete user button

#### 2. **Firestore Permissions Errors** (FIXED)
**Symptoms**: "Missing or insufficient permissions" errors in console, especially in admin panel
```bash
Failed to log audit event: FirebaseError: Missing or insufficient permissions.
```

**Solution**: 
- ✅ **Fixed in current codebase** - Security rules updated for client-side audit logging
- 📖 **See**: `README-FIRESTORE-PERMISSIONS-FIX.md` for detailed fix documentation
- 🚀 **Quick Fix**: Run `./fix-firestore-permissions.sh` if errors persist

#### 3. **useActivityTracker Import Errors** (FIXED)
**Symptoms**: "The requested module does not provide an export named 'useActivityTracker'"
```bash
Uncaught SyntaxError: The requested module '/src/composables/useActivityTracker.js' 
does not provide an export named 'useActivityTracker'
```

**Solution**: 
- ✅ **Fixed in current codebase** - Complete composable with proper exports
- 🔧 **Root Cause**: File was truncated and missing return statement
- 📁 **File**: `client/src/composables/useActivityTracker.js` is now complete

#### 4. **Cloud Functions Organization** (IMPROVED)
**Symptoms**: Monolithic 753-line functions file difficult to maintain
**Solution**:
- ✅ **Modular architecture** - Functions split into focused modules (< 350 lines each)
- ✅ **Clear separation** - Auth, users, audit, system modules
- ✅ **Better maintainability** - Easy to find and modify specific functionality
- ✅ **Enhanced error handling** - Consistent patterns across all modules

### Common Issues

#### 5. **Permission Denied Errors**
```bash
# Symptoms
Error: Permission denied accessing collection 'users'
```
**Diagnosis Steps**:
1. Check Firestore rules: `firebase firestore:rules get`
2. Verify user role in Firestore Console → users collection
3. Check effective permissions in browser dev tools
4. Redeploy rules if needed: `firebase deploy --only firestore:rules`

#### 6. **Function Deployment Fails**
```bash
# Clean and retry
cd functions
rm -rf node_modules
npm install
firebase deploy --only functions
```

#### 7. **Development Server Issues**
```bash
# Clear cache and restart
rm -rf node_modules/.vite
npm run dev

# Or complete reset
rm -rf node_modules
npm install
npm run dev
```

#### 8. **Build Failures**
```bash
# Check for errors
npm run build

# Common fixes:
- Remove unused imports
- Check for TypeScript errors
- Verify all components are properly imported
```

#### 9. **Authentication Loop**
**Symptoms**: Login works but immediately redirects back to login
**Diagnosis**:
1. Check user role in Firestore: `users/[uid]` → role field
2. Verify role permissions exist in `roles/[role]` collection
3. Check browser console for permission errors
4. Test with owner account first

#### 10. **Audit Logging Not Working**
**Symptoms**: No entries in audit_logs collection despite user activity
**Diagnosis**:
1. Check browser console for Firestore permission errors
2. Verify audit composable usage: Import both `log` and `logEvent`
3. Use correct API: `log.adminPanelAccessed()` not `log('admin_panel_accessed')`
4. Import both: `const { log, logEvent } = useAudit()`
5. Use `logEvent()` for custom actions, `log.methodName()` for predefined actions

#### 11. **Vuetify 3 Component Warnings**
**Symptoms**: "Failed to resolve component: v-subheader" or similar deprecated components
**Solutions**:
1. Replace v-subheader with: `<div class="text-h6 font-weight-medium mb-3 text-primary">`
2. Check Vuetify 3 migration guide for other deprecated components
3. Use modern Vuetify 3 typography and spacing classes

#### 12. **Modular Functions Import Errors**
**Symptoms**: Cloud Function deployment fails with module not found errors
**Solutions**:
1. Verify all module files exist in correct directory structure
2. Check `module.exports` statements in each module
3. Verify imports in `functions/index.js` match actual file structure
4. Test module loading: `node -e "console.log(require('./src/utils/permissions'))"`

### Advanced Debugging

#### Debug Permissions in Browser Console
```javascript
// Check current user permissions
const auth = window.__ophv2?.auth || useAuthStore()
console.log('User role:', auth.role)
console.log('Effective permissions:', auth.effectivePermissions)
console.log('Has admin access:', auth.hasPermission('access_admin'))
```

#### Monitor Real-time Activity
```bash
# Watch function logs (modular functions)
firebase functions:log --follow

# Watch specific function logs
firebase functions:log --only deleteUser
firebase functions:log --only onUserCreated
firebase functions:log --only cleanupAuditLogs

# Watch Firestore activity
# Firebase Console → Firestore → Usage tab
```

#### Test Modular Functions
```bash
# Test individual modules (locally)
cd functions
node -e "
const perms = require('./src/utils/permissions');
console.log('✅ Permissions utilities loaded');

const audit = require('./src/config/audit');
console.log('✅ Audit config loaded');

const defaults = require('./src/config/defaults');
console.log('✅ Default configs loaded');
"
```

### Useful Logs
```bash
firebase functions:log              # All function logs
firebase functions:log --only deleteUser   # Specific function
firebase functions:log --only cleanupAuditLogs
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
✅ **Recently Fixed**: User deletion, Firestore permissions, activity tracking, function organization  
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

### **File Organization Best Practices**
- **Keep files < 350 lines** - Extract to new modules when approaching limit
- **Single responsibility** - Each file/module has one clear purpose
- **Clear naming** - File names describe their specific functionality
- **Consistent patterns** - Similar functions follow same patterns across modules

---

*OPHV2 is built for the future - modular, scalable, and ready for enterprise growth.* 🚀