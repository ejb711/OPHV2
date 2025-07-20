# OPHV2 - Frontend Composables Documentation

## 🧩 Composables Overview

OPHV2 uses Vue 3 composition functions for reusable business logic. All composables follow consistent patterns and provide error handling.

## 📋 Available Composables

### 1. **useAudit.js** - Audit Logging System
**Purpose**: Track user actions and system events for compliance and debugging

**Import**:
```javascript
import { useAudit } from '@/composables/useAudit'
```

**Basic Usage**:
```javascript
const { log } = useAudit()

// Simple action logging
await log.userLogin({ ip: '192.168.1.1' })
await log.adminTabViewed('users')
await log.userUpdated({ targetUserId: 'user123', changes: { role: 'admin' } })

// Custom events
await log.custom('custom_action', { details: 'any data' })
```

**Available Log Methods**:
```javascript
// Authentication
log.userLogin(details)
log.userLogout(details)

// Profile Management  
log.profileViewed(details)
log.profileUpdated(details)
log.settingsChanged(details)
log.passwordChanged(details)

// Admin Actions
log.adminPanelAccessed(details)
log.adminTabViewed(tabName)
log.userCreated(details)
log.userUpdated(details)
log.userDeleted(details)
log.roleChanged(details)
log.permissionGranted(details)
log.permissionRevoked(details)
log.bulkOperation(details)

// Future Features (Ready)
log.projectCreated(details)
log.projectUpdated(details)
log.projectDeleted(details)
log.forumPostCreated(details)
log.eventCreated(details)

// Security Events
log.securityAlert(details)
log.unauthorizedAccess(details)
log.systemError(details)
```

**Advanced Usage**:
```javascript
const { logEvent, getRecentActivity, RETENTION_CONFIG } = useAudit()

// Direct logging with custom action
await logEvent('complex_workflow_completed', {
  workflowId: 'wf-123',
  steps: ['step1', 'step2', 'step3'],
  duration: 1200
})

// Get user's recent activity
const recentActivity = await getRecentActivity(25) // Last 25 actions
```

**Error Handling**:
- Composable gracefully handles permission errors
- Never throws exceptions that break app functionality
- Logs errors to console in development mode
- Automatically retries on temporary failures

---

### 2. **useActivityTracker.js** - User Activity Monitoring
**Purpose**: Track user presence and update `lastActive` timestamp

**Import**:
```javascript
import { useActivityTracker } from '@/composables/useActivityTracker'
```

**Basic Usage** (Auto-start):
```javascript
// In App.vue or main layout component
useActivityTracker() // Automatically starts tracking
```

**Manual Control**:
```javascript
const { 
  startTracking, 
  stopTracking, 
  updateActivity, 
  resetErrorState,
  forceUpdate,
  hasPermissionError,
  isTracking 
} = useActivityTracker()

// Manual control
startTracking()     // Start tracking user activity
stopTracking()      // Stop tracking
forceUpdate()       // Force immediate update
resetErrorState()   // Reset after fixing permissions

// Status checks
console.log('Has errors:', hasPermissionError())
console.log('Is tracking:', isTracking())
```

**Features**:
- **Auto-throttling**: Updates max once per minute
- **Event tracking**: Responds to mouse, keyboard, touch events
- **Error recovery**: Automatically handles permission issues
- **Network resilience**: Graceful handling of offline scenarios
- **Performance optimized**: Passive event listeners, minimal overhead

**Configuration**:
```javascript
// Activity is tracked when user:
// - Moves mouse, clicks, types, scrolls, touches screen
// - Automatic update every 5 minutes
// - Throttled to prevent excessive updates (max 1/minute)
```

---

### 3. **usePermissions.js** - Permission Checking
**Purpose**: Check user permissions and role-based access

**Import**:
```javascript
import { usePermissions } from '@/composables/usePermissions'
```

**Basic Usage**:
```javascript
const { 
  hasPermission, 
  hasAnyPermission, 
  isAdmin, 
  canManageUsers,
  requiresPermission 
} = usePermissions()

// Single permission check
if (hasPermission('edit_users')) {
  // Show edit button
}

// Multiple permission check (user needs ANY of these)
if (hasAnyPermission(['edit_posts', 'moderate_posts'])) {
  // Show content moderation
}

// Role checks
if (isAdmin) {
  // Show admin features
}

// Specific functionality checks
if (canManageUsers) {
  // Show user management
}

// Route guard usage
const canAccess = requiresPermission('view_admin_panel')
```

**Complete API**:
```javascript
// Permission checks
hasPermission(permission)
hasAnyPermission([permissions])
hasAllPermissions([permissions])

// Role checks  
isOwner, isAdmin, isUser, isPending
canManageRole(targetRole)

// Feature-specific checks
canManageUsers, canViewUsers, canCreateUsers
canManageProjects, canViewProjects
canManageForums, canViewForums
canManageCalendar, canViewCalendar
canAccessAdmin, canViewAnalytics

// UI helpers
showAdminNav, showProjectsNav, showForumsNav
showCreateButton, showEditButton, showDeleteButton

// Route guards
requiresPermission(permission)
requiresAnyPermission([permissions])
requiresRole(role)

// Error handling
getPermissionErrorMessage(permission)
```

---

### 4. **useErrorHandler.js** - Global Error Management
**Purpose**: Centralized error handling and user feedback

**Import**:
```javascript
import { useErrorHandler } from '@/composables/useErrorHandler'
```

**Usage**:
```javascript
const { handleError, showError, showSuccess } = useErrorHandler()

try {
  await riskyOperation()
  showSuccess('Operation completed successfully!')
} catch (error) {
  handleError(error, {
    context: 'User Management',
    action: 'updateUser',
    userId: 'user123'
  })
}

// Direct user messages
showError('Something went wrong')
showSuccess('Data saved successfully')
```

---

## 🛠️ Composable Patterns & Best Practices

### 1. **Error Handling Pattern**
All composables follow this error handling pattern:
```javascript
export function useComposable() {
  const loading = ref(false)
  const error = ref(null)
  
  const performAction = async () => {
    loading.value = true
    error.value = null
    
    try {
      // Action logic
      return result
    } catch (err) {
      error.value = err
      console.error('Composable error:', err)
      // Don't re-throw to prevent app crashes
    } finally {
      loading.value = false
    }
  }
  
  return { performAction, loading, error }
}
```

### 2. **Reactive State Pattern**
```javascript
export function useFeature() {
  const state = reactive({
    data: [],
    loading: false,
    error: null
  })
  
  const fetchData = async () => {
    state.loading = true
    try {
      state.data = await apiCall()
    } catch (error) {
      state.error = error
    } finally {
      state.loading = false
    }
  }
  
  return { state, fetchData }
}
```

### 3. **Auto-cleanup Pattern**
```javascript
export function useFeature() {
  let unsubscribe = null
  
  const startListening = () => {
    unsubscribe = onSnapshot(collection, (snapshot) => {
      // Handle updates
    })
  }
  
  onUnmounted(() => {
    if (unsubscribe) unsubscribe()
  })
  
  return { startListening }
}
```

## 🔧 Creating New Composables

### Template for New Composables:
```javascript
// composables/useNewFeature.js
import { ref, reactive, onMounted, onUnmounted } from 'vue'
import { useAuthStore } from '@/stores/auth'
import { useAudit } from '@/composables/useAudit'

export function useNewFeature() {
  const auth = useAuthStore()
  const { log } = useAudit()
  
  // State
  const loading = ref(false)
  const error = ref(null)
  const data = reactive({
    items: [],
    total: 0
  })
  
  // Methods
  const fetchData = async () => {
    if (!auth.user) return
    
    loading.value = true
    error.value = null
    
    try {
      // Implementation
      await log.custom('feature_accessed')
      return result
    } catch (err) {
      error.value = err
      console.error('New feature error:', err)
    } finally {
      loading.value = false
    }
  }
  
  // Lifecycle
  onMounted(() => {
    if (auth.ready) {
      fetchData()
    }
  })
  
  // Return public API
  return {
    // State
    loading: readonly(loading),
    error: readonly(error),
    data: readonly(data),
    
    // Methods
    fetchData,
    
    // Computed
    hasData: computed(() => data.items.length > 0)
  }
}
```

## 📊 File Organization Rules

### Size Limits (CRITICAL)
- **Target**: Keep composables under 350 lines
- **Max**: 500 lines absolute maximum
- **Strategy**: Extract helper functions, split complex features

### When to Split a Composable:
```javascript
// ❌ Too large (600+ lines)
useComplexFeature.js

// ✅ Better: Split into focused composables
useFeatureData.js       // Data fetching (200 lines)
useFeatureActions.js    // User actions (180 lines)
useFeatureValidation.js // Validation logic (120 lines)
```

### Modular Pattern:
```javascript
// Main composable (orchestrator)
export function useComplexFeature() {
  const { data, loading, fetchData } = useFeatureData()
  const { createItem, updateItem, deleteItem } = useFeatureActions()
  const { validateInput, errors } = useFeatureValidation()
  
  return {
    // Data
    data, loading,
    
    // Actions
    createItem, updateItem, deleteItem,
    
    // Validation
    validateInput, errors,
    
    // Lifecycle
    fetchData
  }
}
```

## 🔍 Testing Composables

### Browser Console Testing:
```javascript
// Test useAudit
const { log } = useAudit()
await log.custom('test_action', { test: true })

// Test useActivityTracker
const tracker = useActivityTracker()
console.log('Is tracking:', tracker.isTracking())

// Test usePermissions
const perms = usePermissions()
console.log('Is admin:', perms.isAdmin)
console.log('Can manage users:', perms.canManageUsers)
```

### Development Debugging:
```javascript
// Add to any composable for debugging
if (import.meta.env.DEV) {
  window.__debug_composable = {
    state: readonly(state),
    actions: { fetchData, updateData },
    utils: { clearCache, resetState }
  }
}
```

## 🚨 Common Issues & Solutions

### Issue: "Export not found" errors
**Solution**: Verify composable has proper export and return statement
```javascript
// ✅ Correct
export function useComposable() {
  // ... implementation
  return { methods, state } // MUST have return!
}
```

### Issue: Permission errors in composables
**Solution**: Check Firestore rules and use error handling
```javascript
try {
  await firestoreOperation()
} catch (error) {
  if (error.code === 'permission-denied') {
    console.warn('Permission denied - graceful fallback')
    return null
  }
  throw error
}
```

### Issue: Memory leaks in composables
**Solution**: Always cleanup in onUnmounted
```javascript
onUnmounted(() => {
  if (unsubscribe) unsubscribe()
  if (interval) clearInterval(interval)
  if (timeout) clearTimeout(timeout)
})
```

---

*Last Updated: July 20, 2025*  
*Related: [README.md](./README.md), [README-SECURITY.md](./README-SECURITY.md)*