# OPHV2 - Deployment & DevOps Guide

## 🚀 Deployment Overview

### Deployment Targets
- **Hosting**: Firebase Hosting (Vue.js SPA)
- **Functions**: Firebase Cloud Functions (Node.js 20)
- **Database**: Firestore with security rules
- **Auth**: Firebase Authentication

## 📋 Pre-Deployment Checklist

### Environment Setup
- [ ] Firebase CLI installed (`npm install -g firebase-tools`)
- [ ] Logged in (`firebase login`)
- [ ] Project selected (`firebase use ophv2-98d15`)
- [ ] Environment variables configured
- [ ] Node.js 20.x for functions compatibility

### Code Quality
- [ ] All files < 350 lines
- [ ] ESLint passing (`npm run lint`)
- [ ] No console.log statements in production
- [ ] Error handling implemented
- [ ] Loading states for async operations
- [ ] **No permission errors in browser console**
- [ ] **Audit logging working correctly**

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

### 3. Common Build Issues
- **Large bundle**: Check for unused imports
- **Missing assets**: Verify public/ folder contents
- **Build errors**: Clear node_modules and reinstall
- **Permission errors in preview**: Deploy rules first (see Firestore section below)

## 🚢 Deployment Commands

### Recommended Deployment Order
```bash
# 1. Deploy security rules FIRST (critical for permissions)
firebase deploy --only firestore:rules

# 2. Deploy functions
firebase deploy --only functions

# 3. Deploy frontend
firebase deploy --only hosting

# OR deploy everything at once
firebase deploy
```

### Selective Deployment
```bash
# Frontend only
firebase deploy --only hosting

# Functions only
firebase deploy --only functions

# Specific function
firebase deploy --only functions:onUserCreated

# Security rules (CRITICAL - deploy first)
firebase deploy --only firestore:rules

# Indexes (if needed)
firebase deploy --only firestore:indexes
```

## ⚡ Cloud Functions

### Function Configuration
```javascript
// functions/index.js
exports.functionName = functions
  .runWith({
    timeoutSeconds: 60,
    memory: '256MB'
  })
  .https.onCall(async (data, context) => {
    // Function logic
  });
```

### Deployment Optimization
```bash
# Skip dependency installation (faster)
firebase deploy --only functions --force

# View function logs
firebase functions:log
firebase functions:log --only functionName
```

## 🔥 Firestore Rules & Permissions

### **CRITICAL**: Deploy Rules Before Frontend
```bash
# Always deploy rules first to prevent permission errors
firebase deploy --only firestore:rules

# Verify rules deployed correctly
firebase firestore:rules get
```

### **Validate Rules Before Deployment**
```bash
# Test rules syntax
firebase firestore:rules validate

# If validation fails, check rules file for syntax errors
```

### **Post-Rules Deployment Testing**
1. Check rules in Firebase Console → Firestore → Rules tab
2. Test permission scenarios:
   - Admin user can access admin panel
   - Regular user can't access admin functions
   - Audit logs are being created
   - Activity tracking works

## 🔍 Post-Deployment Verification

### 1. Check Hosting
```bash
# Visit your app
open https://ophv2-98d15.web.app

# Verify:
- [ ] App loads without errors
- [ ] Authentication works
- [ ] Permissions enforced
- [ ] Data loads correctly
- [ ] **NO permission errors in browser console**
- [ ] **Audit logs appear in Firestore**
- [ ] **Activity tracking updates lastActive field**
```

### 2. Test Functions
```bash
# Monitor function execution
firebase functions:log --follow

# Check for:
- [ ] No timeout errors
- [ ] Proper error handling
- [ ] Audit logs created
- [ ] User activity tracking working
```

### 3. Verify Security Rules
- Try unauthorized access
- Test permission boundaries
- Check audit trail creation
- **Verify no "Missing or insufficient permissions" errors**

### 4. **NEW**: Test Recent Fixes
```bash
# Open browser dev tools and verify:
1. No "Failed to log audit event" errors
2. No "useActivityTracker export" errors
3. Admin panel tabs switch without errors
4. User lastActive field updates every 5 minutes
5. Audit logs appear in Firestore Console
```

## 🔄 Rollback Procedures

### Hosting Rollback
```bash
# View release history
firebase hosting:releases:list

# Rollback to previous
firebase hosting:rollback
```

### Function Rollback
- Deploy previous version from Git
- Or use Firebase Console → Functions → Version history

### **Rules Rollback** (If Permission Errors Occur)
```bash
# Quick fix: redeploy current rules
firebase deploy --only firestore:rules

# Or restore from backup
cp firestore.rules.backup firestore.rules
firebase deploy --only firestore:rules
```

## 📊 Monitoring & Logs

### Firebase Console Sections
- **Hosting**: Traffic, performance
- **Functions**: Logs, errors, execution time
- **Firestore**: Usage, performance, **Rules tab for debugging**
- **Authentication**: User activity

### Key Metrics to Monitor
- Function execution time (< 10s)
- Firestore reads/writes per day
- Hosting bandwidth usage
- Error rates in functions
- **Permission denial rates (should be near 0)**
- **Audit log creation rate**

## 🚨 Common Deployment Issues

### **Issue: Permission Errors After Deployment**
```
Error: Missing or insufficient permissions for audit_logs
```
**Fix**:
```bash
# 1. Redeploy rules
firebase deploy --only firestore:rules

# 2. If still failing, use the fix script
./fix-firestore-permissions.sh

# 3. Verify in browser console - no more errors
```

### **Issue: useActivityTracker Import Errors**
```
Uncaught SyntaxError: The requested module does not provide an export
```
**Fix**:
```bash
# File is fixed in current codebase, but if you see this:
# 1. Verify client/src/composables/useActivityTracker.js is complete
# 2. Check the file ends with proper return statement
# 3. Restart dev server: npm run dev
```

### Issue: Functions Deployment Fails
```bash
# Fix: Clean and retry
cd functions
rm -rf node_modules
npm install
firebase deploy --only functions
```

### Issue: Build Size Too Large
```bash
# Analyze bundle
npm run build -- --report

# Common fixes:
- Dynamic imports for large components
- Remove unused dependencies
- Optimize images
```

### **Issue: Rules Validation Fails**
```bash
# Check syntax
firebase firestore:rules validate

# Common issues:
- Missing semicolons
- Incorrect function syntax
- Typos in collection names
```

## 🔒 Production Best Practices

### Security
- **Deploy Firestore rules BEFORE frontend code**
- Enable App Check for API protection
- Review Firestore rules monthly
- Monitor failed authentication attempts
- Keep dependencies updated
- **Monitor permission denial logs**

### Performance
- Enable Firebase Hosting caching
- Optimize Firestore queries
- Use compound indexes
- Implement lazy loading
- **Throttle activity tracking (already implemented)**

### Maintenance
- Schedule regular dependency updates
- Monitor Firebase quotas
- Review and clean old audit logs
- Test rollback procedures
- **Run permission health checks monthly**

## 📝 Deployment Checklist Template

```markdown
## Deployment Date: [DATE]
## Version: [VERSION]

### Pre-Deployment
- [ ] Code review completed
- [ ] Tests passing
- [ ] README updates if needed
- [ ] Environment variables verified
- [ ] **No permission errors in dev**
- [ ] **Audit logging working in dev**

### Deployment
- [ ] **Firestore rules deployed FIRST**
- [ ] Rules validation passed
- [ ] Build successful
- [ ] Functions deployed
- [ ] Hosting deployed

### Post-Deployment
- [ ] Site accessible
- [ ] Functions operational
- [ ] **No console errors (especially permissions)**
- [ ] **Audit logs working**
- [ ] **Activity tracking functional**
- [ ] Authentication flow works
- [ ] Admin panel accessible (for admin users)

### Notes:
[Any special considerations]
```

## 🆘 Emergency Procedures

### **If Permission Errors Appear in Production**
```bash
# IMMEDIATE FIX:
firebase deploy --only firestore:rules

# If that doesn't work:
./fix-firestore-permissions.sh

# Monitor resolution:
firebase functions:log --follow
```

### **If Audit Logging Stops Working**
```bash
# 1. Check Firestore Console → audit_logs collection
# 2. Verify browser console for errors
# 3. Redeploy rules: firebase deploy --only firestore:rules
# 4. Check function logs: firebase functions:log
```

---

## 📚 Related Documents
- **[README-FIRESTORE-PERMISSIONS-FIX.md](./README-FIRESTORE-PERMISSIONS-FIX.md)** - Detailed fix documentation
- **[README.md](./README.md)** - Project overview and troubleshooting
- **[README-SECURITY.md](./README-SECURITY.md)** - Security best practices

---
*Last Updated: July 20, 2025 - Added Firestore permissions fix procedures*  
*See main [README.md](./README.md) for project overview*