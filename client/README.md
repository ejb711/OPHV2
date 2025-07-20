# OPHV2 - Enterprise Permission Platform

Enterprise-grade Vue.js 3 + Firebase platform with sophisticated role-based permissions, ready for feature development.

## 🚀 Quick Start

```bash
# Development (GitHub Codespaces)
cd client && npm install
npm run dev  # Runs on port 5173

# Deploy to Firebase
npm run build
firebase deploy
```

## 📁 Project Structure

```
ophv2/
├── client/                    # Vue.js 3 frontend
│   ├── src/
│   │   ├── components/       # Reusable UI (< 350 lines each)
│   │   │   ├── PermissionGuard.vue
│   │   │   ├── AppLayout.vue
│   │   │   └── admin/
│   │   ├── views/           # Page components
│   │   ├── stores/          # Pinia state management
│   │   ├── composables/     # Reusable logic
│   │   └── router/          # Permission-based routing
├── functions/               # Cloud Functions (Node.js 20)
├── scripts/                 # Admin utilities
└── firestore.rules         # Security rules
```

## 🔧 Tech Stack

- **Frontend**: Vue 3.5, Vuetify 3.9, Pinia 3.0, Vue Router 4.5
- **Backend**: Firebase 11.10 (Auth, Firestore, Functions, Hosting)
- **Dev Tools**: Vite 7.0, ESLint 9.29, GitHub Codespaces
- **UI Theme**: Louisiana Department of Health brand standards

## 🔐 Permission System

### Role Hierarchy
```
Owner (100) → Admin (90) → User (50) → Viewer (20) → Pending (10)
```

### Core Permissions
- **System**: `view_admin_panel`, `manage_system_settings`
- **Users**: `view_users`, `create_users`, `edit_users`, `delete_users`
- **Roles**: `view_roles`, `manage_roles`, `assign_roles`
- **Ready for**: Projects, Forums, Calendar features

### Usage in Components
```vue
<PermissionGuard permission="manage_users">
  <AdminPanel />
</PermissionGuard>
```

## 🏗️ Key Architecture Patterns

### File Size Limits
- **Target**: < 350 lines per file
- **Extract at**: 250 lines
- **Hard limit**: 500 lines (exceptions only)

### Component Pattern
```vue
<!-- views/FeatureView.vue (container) -->
<template>
  <AppLayout>
    <PermissionGuard permission="view_feature">
      <FeatureContent />
    </PermissionGuard>
  </AppLayout>
</template>
```

### Store Pattern (Modular)
```javascript
// stores/feature/index.js (< 200 lines)
// stores/feature/actions.js
// stores/feature/getters.js
```

## 🔥 Firebase Configuration

### Required Environment Variables
```env
VITE_FIREBASE_API_KEY
VITE_FIREBASE_AUTH_DOMAIN
VITE_FIREBASE_PROJECT_ID
VITE_FIREBASE_STORAGE_BUCKET
VITE_FIREBASE_MESSAGING_SENDER_ID
VITE_FIREBASE_APP_ID
```

### Firestore Collections
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

### Common Issues
1. **Permission denied**: Check Firestore rules & user roles
2. **Build fails**: Clear `node_modules` and reinstall
3. **Functions timeout**: Check batch sizes in cleanup functions
4. **Index errors**: Run `firebase deploy --only firestore:indexes`

### Useful Logs
```bash
firebase functions:log              # All function logs
firebase functions:log --only cleanupAuditLogs
```

## 📚 Related Documentation

- [README-FRONTEND.md](./README-FRONTEND.md) - Components, stores, patterns
- [README-SECURITY.md](./README-SECURITY.md) - Permission system details
- [README-DEPLOYMENT.md](./README-DEPLOYMENT.md) - Build & deploy guide
- [Brand Standards Guide](./LDHBrandGuide2019.pdf) - LDH design system

## 🎯 Current Status

✅ **Complete**: Auth system, role management, admin panel, audit logging
🚧 **Ready to Build**: Projects, Forums, Calendar, Reports
📋 **Maintenance**: Keep files < 350 lines, update READMEs with changes

## 🔗 Quick Links

- **Firebase Console**: https://console.firebase.google.com/project/ophv2-98d15
- **Hosting URL**: https://ophv2-98d15.web.app
- **GitHub**: [Repository URL]

---
*Last Updated: [Current Date] - Remember to update when making structural changes!*