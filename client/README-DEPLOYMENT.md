# OPHV2 - Deployment & DevOps Guide

## 🚀 Deployment Overview

### Deployment Targets
- **Hosting**: Firebase Hosting (Vue.js SPA)
- **Functions**: Firebase Cloud Functions (Node.js 20) - **Modular Architecture**
- **Database**: Firestore with security rules
- **Auth**: Firebase Authentication

### **NEW: Modular Functions Architecture**
OPHV2 now uses a modular Cloud Functions architecture with focused, maintainable modules:
```
functions/src/
├── config/     # System configuration
├── utils/      # Reusable utilities  
├── auth/       # Authentication handlers
├── users/      # User management (includes fixed deleteUser)
├── audit/      # Audit & retention system
└── system/     # Health & initialization
```

## 📋 Pre-Deployment Checklist

### Environment Setup
- [ ] Firebase CLI installed (`npm install -g firebase-tools`)
- [ ] Logged in (`firebase login`)
- [ ] Project selected (`firebase use ophv2-98d15`)
- [ ] Environment variables configured
- [ ] Node.js 20.x for functions compatibility

### Code Quality
- [ ] All files < 350 lines (modular architecture)
- [ ] ESLint passing (`npm run lint`)
- [ ] No console.log statements in production
- [ ] Error handling implemented
- [ ] Loading states for async operations
- [ ] **No permission errors in browser console**
- [ ] **Audit logging working correctly**
- [ ] **User deletion functionality tested**

### **NEW: Modular Functions Checklist**
- [ ] All function modules load correctly: `node -e "require('./functions/index.js'); console.log('✅ Functions loaded')"`
- [ ] Module exports properly defined
- [ ] No circular dependencies between modules
- [ ] Individual modules under 350 lines each

## 🔧 Environment Variables

### Required in `client/.env.production`
```env
VITE_FIREBASE_API_KEY=your-api-key
VITE_FIREBASE_AUTH_DOMAIN=ophv2-98d15.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=ophv2-98d15
VITE_FIREBASE_STORAGE_BUCKET=ophv2-98d15.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your-sender-id
VITE_FIREBASE_APP_ID=your-app-id
```

### Security Note
- Never commit `.env` files
- Use Firebase Console for production values
- Rotate API keys regularly

## 📦 Build Process

### 1. Build Frontend
```bash
cd client
npm install          # Install dependencies
npm run build       # Creates dist/ folder
```

### 2. Verify Build
```bash
# Check bundle size
ls -lah dist/assets/

# Test locally
npm run preview     # Serves production build

# ⚠️ IMPORTANT: Test permissions in preview mode
# Open browser dev tools and check for permission errors
```

### 3. **NEW: Validate Modular Functions**
```bash
cd functions

# Test all modules load correctly
node -e "
console.log('Testing modular functions...');
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

# Check for linting issues
npm run lint

# Verify package dependencies
npm audit
```

### 4. Common Build Issues
- **Large bundle**: Check for unused imports
- **Missing assets**: Verify public/ folder contents
- **Build errors**: Clear node_modules and reinstall
- **Permission errors in preview**: Deploy rules first (see Firestore section below)
- **Module loading errors**: Check module exports and imports
- **Function size warnings**: Ensure all modules < 350 lines

## 🚢 Deployment Commands

### **CRITICAL: Recommended Deployment Order**
```bash
# 1. Deploy security rules FIRST (prevents permission errors)
firebase deploy --only firestore:rules

# 2. Deploy modular functions
firebase deploy --only functions

# 3. Deploy frontend (last, depends on functions)
firebase deploy --only hosting

# OR deploy everything at once (after testing individually)
firebase deploy
```

### **Enhanced Function Deployment**
```bash
# Standard modular functions deployment
firebase deploy --only functions

# Force deployment (faster during development)
firebase deploy --only functions --force

# Deploy with detailed logging
firebase deploy --only functions --debug

# List all deployed functions (verify modular functions)
firebase functions:list
```

### Selective Deployment
```bash
# Frontend only
firebase deploy --only hosting

# Functions only (modular architecture)
firebase deploy --only functions

# Security rules (CRITICAL - deploy first)
firebase deploy --only firestore:rules

# Indexes (if needed)
firebase deploy --only firestore:indexes

# Storage rules (if applicable)
firebase deploy --only storage
```

## ⚡ Modular Cloud Functions

### **NEW: Function Architecture**
The new modular functions provide enhanced capabilities:

**User Management Functions:**
- `deleteUser` - **[FIXED]** Complete user deletion from Auth + Firestore
- `createUser` - Enhanced user creation with role assignment
- `updateUserRole` - Secure role updates with permission validation

**System Functions:**
- `healthCheck` - Public health monitoring endpoint
- `systemStatus` - Detailed admin system status
- `initializeSystemData` - Complete system setup

**Audit Functions:**
- `cleanupAuditLogs` - Automated log maintenance
- `getRetentionStats` - Storage and retention analytics
- `getAuditStatistics` - User activity insights

### Function Configuration
```javascript
// functions/src/example/module.js
const functions = require('firebase-functions/v1')

exports.exampleFunction = functions
  .runWith({
    timeoutSeconds: 60,
    memory: '256MB'
  })
  .https.onCall(async (data, context) => {
    // Modular function logic
  })
```

### **Function Monitoring**
```bash
# Monitor all functions
firebase functions:log --follow

# Monitor specific modular functions
firebase functions:log --only deleteUser
firebase functions:log --only onUserCreated
firebase functions:log --only cleanupAuditLogs

# Check function performance
firebase functions:log --since 1h | grep -E "(timeout|error|failed)"

# View function execution times
firebase functions:log | grep -E "Function execution took"
```

### Deployment Optimization
```bash
# Skip dependency installation (faster)
firebase deploy --only functions --force

# View real-time deployment progress
firebase deploy --only functions --debug 2>&1 | grep -E "(uploading|deployed)"

# Test function deployment locally first
cd functions
npm run serve  # Starts local emulator
```

## 🔥 Firestore Rules & Permissions

### **CRITICAL: Deploy Rules Before Frontend**
```bash
# Always deploy rules first to prevent permission errors
firebase deploy --only firestore:rules

# Verify rules deployed correctly
firebase firestore:rules get

# Test rules syntax before deployment
firebase firestore:rules validate
```

### **Enhanced Rules for Modular Functions**
The updated rules support both client-side audit logging and server-side function operations:

```javascript
// Enhanced user deletion rules
match /users/{userId} {
  allow delete: if request.auth != null && 
    hasPermission('delete_users') && 
    request.auth.uid != userId &&
    canManageUserWithRole(resource.data.role);
}

// Client-compatible audit logging
match /audit_logs/{document} {
  allow create: if request.auth != null && 
    request.resource.data.userId == request.auth.uid;
}
```

### **Post-Rules Deployment Testing**
1. Check rules in Firebase Console → Firestore → Rules tab
2. Test permission scenarios:
   - ✅ Admin user can access admin panel
   - ✅ Regular user can't access admin functions
   - ✅ **User deletion works completely** (new functionality)
   - ✅ Audit logs are being created without errors
   - ✅ Activity tracking updates user documents

## 🔍 Post-Deployment Verification

### 1. **Enhanced Frontend Verification**
```bash
# Visit your app
open https://ophv2-98d15.web.app

# Verify core functionality:
- [ ] App loads without errors
- [ ] Authentication works (login/logout)
- [ ] Permissions enforced correctly
- [ ] Data loads correctly
- [ ] **NO permission errors in browser console**
- [ ] **Audit logs appear in Firestore**
- [ ] **Activity tracking updates lastActive field**
- [ ] **User deletion works completely** (admin panel)
```

### 2. **Test Modular Functions**
```bash
# Monitor function execution
firebase functions:log --follow

# Test specific new functions:
# 1. User deletion (admin panel → delete user)
# 2. Health check: curl https://us-central1-ophv2-98d15.cloudfunctions.net/healthCheck
# 3. User creation (admin panel → add user)
# 4. Audit logging (perform any admin action)

# Check for:
- [ ] No timeout errors
- [ ] Proper error handling and user-friendly messages
- [ ] Audit logs created for all admin actions
- [ ] User activity tracking working
- [ ] **Complete user deletion (not just status change)**
- [ ] Function modules loading correctly
```

### 3. **Verify Enhanced Security**
- Try unauthorized access attempts
- Test permission boundaries with different user roles
- Verify audit trail creation for all admin actions
- **Test user deletion permissions and execution**
- **Verify no "Missing or insufficient permissions" errors**
- Test rate limiting on sensitive operations

### 4. **NEW: Test Modular Function Health**
```bash
# Verify all functions deployed
firebase functions:list | grep -E "(deleteUser|createUser|healthCheck|cleanupAuditLogs)"

# Test function cold starts
firebase functions:log --since 10m | grep -E "Function execution started"

# Check for module loading errors
firebase functions:log | grep -E "(module|require|import)" | grep -i error
```

## 🚨 Troubleshooting Enhanced

### **NEW: Modular Function Issues**

#### **Module Loading Errors**
```bash
# Symptoms: "Cannot find module" errors during deployment
# Solutions:
cd functions
rm -rf node_modules package-lock.json
npm install
firebase deploy --only functions

# Test module loading locally:
node -e "require('./index.js'); console.log('✅ Modules load correctly')"
```

#### **Function Import/Export Errors**
```bash
# Check all module exports
cd functions/src
find . -name "*.js" -exec node -e "
  try { 
    require('./{}/src'); 
    console.log('✅ {} exports working'); 
  } catch(e) { 
    console.log('❌ {} export error:', e.message); 
  }
" \;
```

### **Enhanced User Deletion Issues**

#### **Delete Button Not Working**
```bash
# New troubleshooting for fixed delete functionality:
# 1. Check if deleteUser function deployed:
firebase functions:list | grep deleteUser

# 2. Monitor function execution:
firebase functions:log --only deleteUser --follow

# 3. Test permissions in browser console:
# Open admin panel → dev tools → console:
# firebase.functions().httpsCallable('deleteUser')({userId: 'test-id'})

# 4. Verify Firestore rules allow deletion:
firebase firestore:rules get | grep -A 10 "delete.*users"
```

### **Original Issues (Previously Fixed)**

#### **Firestore Permission Errors**
```bash
# If permission errors reappear:
firebase deploy --only firestore:rules

# Emergency fix script:
./fix-firestore-permissions.sh

# Verify in browser console - should see no more errors
```

#### **Activity Tracker Issues**
```bash
# If import errors return:
# 1. Verify file exists and is complete:
cat client/src/composables/useActivityTracker.js | tail -20

# 2. Check for proper exports at end of file
# 3. Restart dev server: npm run dev
```

### **Advanced Troubleshooting**

#### **Function Performance Issues**
```bash
# Monitor function execution times
firebase functions:log | grep -E "Function execution took" | sort -k 4 -n

# Check memory usage
firebase functions:log | grep -E "memory|timeout" 

# Analyze cold start times
firebase functions:log --since 1h | grep -E "Function execution started"
```

#### **Audit System Issues**
```bash
# Check audit log creation
firebase firestore:data export --collection-ids audit_logs

# Monitor audit statistics
firebase functions:log --only getRetentionStats

# Test cleanup functions
firebase functions:log --only cleanupAuditLogs
```

## 🔒 Enhanced Production Best Practices

### Security
- **Deploy Firestore rules BEFORE frontend code** (prevent permission windows)
- Enable App Check for API protection
- Review Firestore rules monthly
- Monitor failed authentication attempts
- Keep dependencies updated
- **Monitor permission denial logs from new modular functions**
- **Test user deletion security boundaries**

### Performance
- Enable Firebase Hosting caching
- Optimize Firestore queries with compound indexes
- **Monitor modular function cold start times**
- Implement lazy loading for large components
- **Use function batching for related operations**
- **Monitor audit log storage growth and cleanup efficiency**

### Maintenance
- Schedule regular dependency updates
- Monitor Firebase quotas and billing
- Review and clean old audit logs (automated)
- **Test modular function deployments in staging first**
- **Monitor individual module performance**
- Test rollback procedures for modular functions

## 📝 Enhanced Deployment Checklist Template

```markdown
## Deployment Date: [DATE]
## Version: [VERSION] - Modular Functions Architecture

### Pre-Deployment
- [ ] Code review completed
- [ ] All function modules tested individually
- [ ] Module loading verified locally
- [ ] No circular dependencies
- [ ] Tests passing (when available)
- [ ] README updates included
- [ ] Environment variables verified
- [ ] **No permission errors in dev environment**
- [ ] **User deletion tested and working**
- [ ] **Audit logging functional**

### Deployment Steps
- [ ] **Firestore rules deployed FIRST**
- [ ] Rules validation passed
- [ ] Frontend build successful (no bundle issues)
- [ ] **Modular functions deployed successfully**
- [ ] All function modules loaded correctly
- [ ] Hosting deployed
- [ ] Function list verified (all expected functions present)

### Post-Deployment Validation
- [ ] Site accessible and loading correctly
- [ ] **All modular functions operational**
- [ ] Authentication flow works
- [ ] **User deletion functionality working completely**
- [ ] **No console errors (especially permissions)**
- [ ] **Audit logs being created successfully**
- [ ] **Activity tracking functional**
- [ ] Admin panel accessible (for admin users)
- [ ] Health check endpoint responding
- [ ] System status function working

### Function-Specific Testing
- [ ] `deleteUser` - Complete user removal tested
- [ ] `createUser` - New user creation with roles
- [ ] `healthCheck` - Public endpoint accessible
- [ ] `cleanupAuditLogs` - Automated maintenance working
- [ ] `getRetentionStats` - Admin dashboard analytics
- [ ] Auth triggers (`onUserCreated`, `onUserDeleted`) functional

### Notes:
[Any special considerations for modular functions]
```

## 🆘 Emergency Procedures Enhanced

### **Critical Function Failures**
```bash
# If core functions fail after modular deployment:

# 1. Check function logs immediately
firebase functions:log --follow --since 10m

# 2. Verify all modules loading
firebase functions:list | wc -l  # Should show expected count

# 3. Quick function test
curl https://us-central1-ophv2-98d15.cloudfunctions.net/healthCheck

# 4. Emergency redeployment
firebase deploy --only functions --force
```

### **User Deletion Emergency**
```bash
# If delete functionality breaks:
# 1. Check deleteUser function status
firebase functions:log --only deleteUser --since 1h

# 2. Test function directly (admin only)
# Use Firebase Console → Functions → deleteUser → Test

# 3. Verify permissions
firebase firestore:rules get | grep -A 5 "delete.*users"
```

### **Audit System Failure**
```bash
# If audit logging stops:
# 1. Check Firestore Console → audit_logs collection
# 2. Monitor function logs for errors
firebase functions:log | grep -i audit

# 3. Test individual audit functions
firebase functions:log --only getRetentionStats
```

### **Complete System Recovery**
```bash
# Nuclear option - complete redeployment:
firebase deploy --only firestore:rules
firebase deploy --only functions --force
firebase deploy --only hosting
```

## 📊 Enhanced Monitoring

### **Function Health Dashboard**
Monitor these key metrics for modular functions:

1. **Execution Success Rate**: >99% for critical functions
2. **Cold Start Times**: <3 seconds for auth functions
3. **Memory Usage**: <80% of allocated memory
4. **Error Rates**: <1% across all modules
5. **Audit Log Creation**: 100% success rate

### **Automated Alerts**
Set up monitoring for:
- Function timeout errors
- Permission denial spikes
- Audit log creation failures
- **User deletion failures**
- Module loading errors

---

*The enhanced deployment guide ensures successful deployment and monitoring of OPHV2's new modular Cloud Functions architecture.* 🚀