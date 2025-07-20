# OPHV2 - Enterprise Permission Platform

## 🚨 Project Overview
OPHV2 is an enterprise-grade web platform built on Vue.js 3 and Firebase, featuring a sophisticated permission-based architecture. Originally conceived as a simple collaborative site, it has evolved into a robust foundation ready for feature development.

## 📋 Collections
- `users/` - User profiles with roles
- `roles/` - Role definitions
- `permissions/` - Available permissions
- `audit_logs/` - Activity tracking (90-day retention)

### Cloud Functions
- `onUserCreated` - Initialize new users
- `onUserDeleted` - Cleanup user data
- `cleanupAuditLogs` - Daily retention management
- `manualCleanupAuditLogs` - On-demand cleanup
- `getRetentionStats` - Audit statistics

## 📦 Key Dependencies

### Frontend
- `firebase`: 11.10.0
- `vue`: 3.5.17
- `vuetify`: 3.9.0
- `pinia`: 3.0.3
- `@mdi/font`: 7.4.47

### Functions
- `firebase-admin`: 13.4.0
- `firebase-functions`: 6.4.0

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

### ⚠️ **Recently Fixed Issues** 

#### 1. **Firestore Permissions Errors** (FIXED July 20, 2025)
**Symptoms**: "Missing or insufficient permissions" errors in console, especially in admin panel
```bash
Failed to log audit event: FirebaseError: Missing or insufficient permissions.
```

**Solution**: 
- ✅ **Fixed in current codebase** - Security rules updated for client-side audit logging
- 📖 **See**: `README-FIRESTORE-PERMISSIONS-FIX.md` for detailed fix documentation
- 🚀 **Quick Fix**: Run `./fix-firestore-permissions.sh` if errors persist

#### 2. **useActivityTracker Import Errors** (FIXED July 20, 2025)
**Symptoms**: "The requested module does not provide an export named 'useActivityTracker'"
```bash
Uncaught SyntaxError: The requested module '/src/composables/useActivityTracker.js' 
does not provide an export named 'useActivityTracker'
```

**Solution**: 
- ✅ **Fixed in current codebase** - Complete composable with proper exports
- 🔧 **Root Cause**: File was truncated and missing return statement
- 📁 **File**: `client/src/composables/useActivityTracker.js` is now complete

### Common Issues

#### 3. **Permission Denied Errors**
```bash
# Symptoms
Error: Permission denied accessing collection 'users'
```
**Diagnosis Steps**:
1. Check Firestore rules: `firebase firestore:rules get`
2. Verify user role in Firestore Console → users collection
3. Check effective permissions in browser dev tools
4. Use `DebugPermissions.vue` component if available

**Solutions**:
- Update security rules: `firebase deploy --only firestore:rules`
- Fix user permissions: `node scripts/fix-permissions.js`
- Verify role assignments in admin panel

#### 4. **Build Failures**
```bash
# Clear cache and rebuild
cd client
rm -rf node_modules package-lock.json
npm install
npm run build
```

#### 5. **Function Timeouts**
```bash
# Check batch sizes in cleanup functions
# Reduce CLEANUP_BATCH_SIZE in functions/index.js if needed
firebase functions:log --only cleanupAuditLogs
```

#### 6. **Index Errors**
```bash
# Deploy indexes
firebase deploy --only firestore:indexes

# Or use automatic script
./scripts/fix-firestore-indexes.sh
```

#### 7. **Activity Tracking Not Working**
**Symptoms**: `lastActive` field not updating, console errors
**Solutions**:
1. Check browser console for permission errors
2. Verify user can update their own document in Firestore rules
3. Reset activity tracker: Call `useActivityTracker().resetErrorState()`

#### 8. **Audit Logs Not Appearing**
**Symptoms**: No entries in audit_logs collection
**Solutions**:
1. Check Firestore rules allow `create` operations for audit_logs
2. Verify `useAudit()` composable is imported correctly
3. Check browser network tab for failed requests

#### 9. **Vue Component Emit Warnings**
**Symptoms**: "Component emitted event 'X' but it is neither declared in the emits option"
**Solutions**:
1. Add missing events to defineEmits array: `defineEmits(['existing-event', 'new-event'])`
2. Check child components for undeclared emitted events
3. Verify parent components handle emitted events properly

#### 10. **useAudit "log is not a function" Error**
**Symptoms**: "TypeError: log is not a function"
**Solutions**:
1. Use correct API: `log.adminPanelAccessed()` not `log('admin_panel_accessed')`
2. Import both: `const { log, logEvent } = useAudit()`
3. Use `logEvent()` for custom actions, `log.methodName()` for predefined actions

#### 11. **Vuetify 3 Component Warnings**
**Symptoms**: "Failed to resolve component: v-subheader" or similar deprecated components
**Solutions**:
1. Replace v-subheader with: `<div class="text-h6 font-weight-medium mb-3 text-primary">`
2. Check Vuetify 3 migration guide for other deprecated components
3. Use modern Vuetify 3 typography and spacing classes

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
# Watch function logs
firebase functions:log --follow

# Watch Firestore activity
# Firebase Console → Firestore → Usage tab
```

### Useful Logs
```bash
firebase functions:log              # All function logs
firebase functions:log --only cleanupAuditLogs
firebase functions:log --follow     # Real-time monitoring

# View security rules
firebase firestore:rules get

# Test rule deployment
firebase firestore:rules validate
```

## 📚 Related Documentation

- [README-FRONTEND.md](./README-FRONTEND.md) - Components, stores, patterns
- [README-SECURITY.md](./README-SECURITY.md) - Permission system details
- [README-DEPLOYMENT.md](./README-DEPLOYMENT.md) - Build & deploy guide
- [README-FIRESTORE-PERMISSIONS-FIX.md](./README-FIRESTORE-PERMISSIONS-FIX.md) - Detailed fix documentation
- [Brand Standards Guide](./LDHBrandGuide2019.pdf) - LDH design system

## 🎯 Current Status

✅ **Complete**: Auth system, role management, admin panel, audit logging  
✅ **Recently Fixed**: Firestore permissions, activity tracking, audit logging  
🚧 **Ready to Build**: Projects, Forums, Calendar, Reports  
📋 **Maintenance**: Keep files < 350 lines, update READMEs with changes  

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

4. **Verify setup**:
   - App loads at http://localhost:5173
   - No console errors
   - Can log in and access admin panel (if admin user)

---
*Last Updated: July 20, 2025 - Major permissions fix applied*  
*Remember to update when making structural changes!*

### **4. Quick Status Update**
Since you recently had Firestore permission fixes, you might also want to add a note in the main README.md status section:

```markdown
## 🎯 Current Status

✅ **Complete**: Auth system, role management, admin panel, audit logging  
✅ **Recently Fixed**: Firestore permissions, activity tracking, Vue emit warnings, audit logging API  
🚧 **Ready to Build**: Projects, Forums, Calendar, Reports  
📋 **Maintenance**: Keep files < 350 lines, update READMEs with changes