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
```

### 3. Common Build Issues
- **Large bundle**: Check for unused imports
- **Missing assets**: Verify public/ folder contents
- **Build errors**: Clear node_modules and reinstall

## 🚢 Deployment Commands

### Full Deployment
```bash
# Deploy everything
firebase deploy

# Deployment includes:
# - Hosting (Vue app)
# - Functions
# - Firestore rules
# - Firestore indexes
```

### Selective Deployment
```bash
# Frontend only
firebase deploy --only hosting

# Functions only
firebase deploy --only functions

# Specific function
firebase deploy --only functions:onUserCreated

# Security rules
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
```

### 2. Test Functions
```bash
# Monitor function execution
firebase functions:log --follow

# Check for:
- [ ] No timeout errors
- [ ] Proper error handling
- [ ] Audit logs created
```

### 3. Verify Security Rules
- Try unauthorized access
- Test permission boundaries
- Check audit trail creation

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

## 📊 Monitoring & Logs

### Firebase Console Sections
- **Hosting**: Traffic, performance
- **Functions**: Logs, errors, execution time
- **Firestore**: Usage, performance
- **Authentication**: User activity

### Key Metrics to Monitor
- Function execution time (< 10s)
- Firestore reads/writes per day
- Hosting bandwidth usage
- Error rates in functions

## 🚨 Common Deployment Issues

### Issue: Functions Deployment Fails
```bash
# Fix: Clean and retry
cd functions
rm -rf node_modules
npm install
firebase deploy --only functions
```

### Issue: Permissions Errors
```bash
# Fix: Check project permissions
firebase projects:list
firebase use ophv2-98d15
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

## 🔒 Production Best Practices

### Security
- Enable App Check for API protection
- Review Firestore rules monthly
- Monitor failed authentication attempts
- Keep dependencies updated

### Performance
- Enable Firebase Hosting caching
- Optimize Firestore queries
- Use compound indexes
- Implement lazy loading

### Maintenance
- Schedule regular dependency updates
- Monitor Firebase quotas
- Review and clean old audit logs
- Test rollback procedures

## 📝 Deployment Checklist Template

```markdown
## Deployment Date: [DATE]
## Version: [VERSION]

### Pre-Deployment
- [ ] Code review completed
- [ ] Tests passing
- [ ] README updates if needed
- [ ] Environment variables verified

### Deployment
- [ ] Build successful
- [ ] Functions deployed
- [ ] Rules updated
- [ ] Hosting deployed

### Post-Deployment
- [ ] Site accessible
- [ ] Functions operational
- [ ] No console errors
- [ ] Audit logs working

### Notes:
[Any special considerations]
```

---
*See main [README.md](./README.md) for project overview*