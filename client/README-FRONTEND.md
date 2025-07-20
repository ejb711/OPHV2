# OPHV2 - Frontend Development Guide

## 🎨 Component Architecture

### Core Components
```
components/
├── PermissionGuard.vue    # Conditional rendering wrapper
├── AppLayout.vue         # Universal layout with navigation
├── admin/
│   ├── UserManagement.vue
│   ├── RoleMatrix.vue
│   └── AuditLogs.vue
└── shared/
    ├── LoadingSpinner.vue
    └── ErrorAlert.vue
```

### Component Rules
- **Max 350 lines** (extract at 250)
- Use `<script setup>` for new components
- Always include permission checks
- Emit events, don't mutate props

### PermissionGuard Usage
```vue
<!-- Single permission -->
<PermissionGuard permission="edit_users">
  <EditButton />
</PermissionGuard>

<!-- Multiple (ANY) -->
<PermissionGuard :any-permissions="['edit_users', 'admin']">
  <AdminControls />
</PermissionGuard>

<!-- Multiple (ALL) -->
<PermissionGuard :all-permissions="['view_data', 'export_data']">
  <ExportButton />
</PermissionGuard>
```

## 🗄️ State Management (Pinia)

### Store Structure
```javascript
// stores/auth.js
- currentUser
- isAuthenticated
- userRole
- permissions[]
- hasPermission()
- signIn/signOut()

// stores/permissions.js  
- users[]
- roles[]
- permissions[]
- fetchUsers()
- updateUserRole()
```

### Store Patterns
```javascript
// Modular store (when > 350 lines)
stores/feature/
├── index.js      # Store definition
├── actions.js    # Async operations
├── getters.js    # Computed values
└── types.js      # Constants
```

## 🪝 Composables

### Key Composables
```javascript
// composables/usePermissions.js
const { hasPermission, isAdmin, canManageUsers } = usePermissions()

// composables/useAudit.js
const { logAction } = useAudit()
await logAction('user_deleted', { userId, deletedBy })

// composables/useFirestore.js
const { loading, error, data } = useFirestoreCollection('users')
```

### Creating Composables
```javascript
// Extract when logic is:
// - Used in multiple components
// - Complex (> 50 lines)
// - Testable separately
export function useFeature() {
  const state = reactive({})
  const computed = computed(() => {})
  const methods = {}
  
  return { ...toRefs(state), computed, ...methods }
}
```

## 🛣️ Routing Patterns

### Permission-Based Routes
```javascript
{
  path: '/admin',
  component: AdminView,
  meta: { 
    requiresAuth: true,
    requiresPermission: 'view_admin_panel'
  }
}
```

### Route Guards
```javascript
router.beforeEach((to, from, next) => {
  // Check auth
  if (to.meta.requiresAuth && !authStore.isAuthenticated) {
    return next('/login')
  }
  
  // Check permission
  if (to.meta.requiresPermission && 
      !authStore.hasPermission(to.meta.requiresPermission)) {
    return next('/unauthorized')
  }
  
  next()
})
```

## 🎭 UI/UX Patterns

### Vuetify Components
- Use Vuetify's built-in components
- Follow Material Design principles
- Maintain consistent spacing (4px grid)

### Brand Colors
```scss
// Louisiana Department of Health palette (from LDHBrandGuide2019.pdf)
// Primary Colors
$navy: #003057;      // PMS 541 - Logo navy
$blue: #426DA9;      // PMS 7683 - Logo blue  
$gold: #B89D18;      // PMS 457 - Logo gold
$aqua: #63B1BC;      // PMS 7709 - Logo aqua

// Secondary Colors  
$dark-blue: #041E41; // PMS 282
$gray: #9EA2A2;      // PMS 422
$tan: #CFC493;       // PMS 4535
$light-blue: #A3C7D2;// PMS 551
$teal: #0099A8;      // PMS 320
$purple: #9595D2;    // PMS 271
```

### Typography
```css
/* Headers: font-weight-bold (Franklin Gothic) */
.v-card-title { font-weight: bold; }

/* Body: Default Vuetify (Cambria equivalent) */
.v-card-text { /* uses body-1 */ }
```

## 📝 Form Patterns

### Validation Rules
```javascript
const rules = {
  required: v => !!v || 'Required',
  email: v => /.+@.+\..+/.test(v) || 'Invalid email',
  minLength: len => v => v.length >= len || `Min ${len} characters`
}
```

### Form Components
```vue
<v-form v-model="valid" @submit.prevent="handleSubmit">
  <v-text-field
    v-model="email"
    :rules="[rules.required, rules.email]"
    label="Email"
  />
</v-form>
```

## 🔧 Development Tips

### File Organization
```
views/ComplexView.vue → Split into:
├── ComplexView.vue (< 150 lines)
├── components/ComplexViewHeader.vue
├── components/ComplexViewContent.vue
└── composables/useComplexView.js
```

### Performance
- Lazy load routes: `() => import('./views/Feature.vue')`
- Use `v-show` for frequently toggled elements
- Implement virtual scrolling for large lists
- Cache Firestore listeners in composables

### Error Handling
```javascript
try {
  await someAction()
  showSnackbar('Success!', 'success')
} catch (error) {
  console.error('Action failed:', error)
  showSnackbar('Operation failed', 'error')
}
```

## 🐛 Common Issues

1. **Reactivity not working**: Use `reactive()` or `ref()`
2. **Props mutation**: Emit events instead
3. **Memory leaks**: Clean up listeners in `onUnmounted()`
4. **Large files**: Extract components/composables

---
*See main [README.md](./README.md) for project overview*