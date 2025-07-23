# 📡 COMMS PROJECT README - Claude Reference

## 🗂️ Structure Map
```
/comms/
├── views/CommsView.vue [wrapper]
├── components/comms/
│   ├── CommsDashboard.vue [orchestrator]
│   ├── CommsStats.vue [metrics display]
│   ├── CommsFilters.vue [filter UI]
│   └── projects/
│       ├── ProjectList.vue [display+delete dialog]
│       ├── ProjectCard.vue [emit only]
│       ├── ProjectForm.vue [create]
│       ├── ProjectDetail.vue [view/edit]
│       └── ProjectActions.vue [action btns]
├── composables/comms/
│   ├── useCommsProjects.js [CRUD+filters]
│   └── commsProjectPermissions.js [access ctrl]
└── config/louisiana-regions.js [9 regions]
```

## 🔄 Event Flow Patterns
```
Delete: Card→List→Dashboard→useCommsProjects→Firestore
Select: Card/List→Dashboard→Detail.open()
Create: Dashboard→Form→useCommsProjects→Firestore
Update: Detail→useCommsProjects→Firestore
```

## 🔑 Key Dependencies
- **Auth**: `authStore.user.uid` (nullable!)
- **Perms**: `usePermissions()` → hasPermission/canManageComms
- **Snack**: `useSnackbar()` → showError/showSuccess
- **Audit**: `useAudit()` → logEvent()
- **Firebase**: serverTimestamp(), Timestamp conversions

## ⚠️ Critical Patterns
1. **Timestamp Safety**: Always use `safeConvertToDate()`
2. **Permission Checks**: Project-level perms via `canEditProject(project)`
3. **Real-time**: `onSnapshot` listeners auto-update UI
4. **Soft Delete**: `deleted: true` flag, 90-day retention
5. **File Limits**: Keep components <250 lines (extract if needed)

## 📊 Data Schema
```javascript
comms_projects: {
  id, title, description, region, status, priority,
  stages[], currentStageIndex, deadline, tags[],
  visibility, sharedWith[], coordinatorId,
  createdBy/At, updatedBy/At, deleted, deletedAt,
  viewCount, files[], externalLinks[], messages[]
}

comms_coordinators: {
  userId, regions[], assignedBy/At
}

comms_templates: {
  name, description, stages[], tags[], createdBy
}
```

## 🎯 Phase Status
✅ P1: Permissions/Routes
✅ P2: DB/Security Rules  
✅ P3: Dashboard Shell
✅ P4: Read/List + Delete Fix
🔲 P5: Create
🔲 P6: Update/Delete UI
🔲 P7: Files
🔲 P8: Forums
🔲 P9: Search
🔲 P10: Analytics
🔲 P11: Templates
🔲 P12: Polish

## 🚀 Quick Implementation Checklist
```
□ Check auth state (authStore.user exists?)
□ Import permission composables
□ Add loading/error states
□ Handle timestamps properly
□ Test with different roles
□ Check file size (<250 lines)
□ Verify real-time updates work
□ Add audit logging
```

## 🔧 Common Fixes
- **"Unknown Region"**: Check ID format (numeric vs string)
- **Delete not working**: Check event chain Card→List→Dashboard
- **Perms fail**: Ensure currentUser populated before checks
- **Stats wrong**: Use nextTick() after data updates

## 📝 Component Patterns
```vue
<!-- Standard structure -->
<template>
  <v-container>
    <!-- Loading -->
    <div v-if="loading">...</div>
    <!-- Error -->
    <v-alert v-else-if="error">...</v-alert>
    <!-- Content -->
    <div v-else>...</div>
  </v-container>
</template>

<script setup>
// Composables first
const { needed, functions } = useCommsProjects()

// Props/Emits
const props = defineProps({...})
const emit = defineEmits([...])

// State
const loading = ref(false)
const error = ref(null)

// Computed (perms)
const canDoX = computed(() => canEditProject(props.project))

// Methods (try/catch)
async function handleAction() {
  try {
    loading.value = true
    await doThing()
  } catch (err) {
    error.value = err.message
  } finally {
    loading.value = false
  }
}
</script>
```

## 🎨 UI Patterns
- **Louisiana colors**: See louisiana-regions.js
- **Status colors**: not_started(grey), in_progress(blue), completed(green)
- **Priority**: high(red border + indicator), medium(default), low(grey)
- **Deadline colors**: overdue(red), <7d(warning), <30d(info), else(success)

## 🔐 Security Rules Pattern
```
match /comms_projects/{projectId} {
  allow read: if request.auth != null && 
    (isOwnerOrAdmin() || canViewCommsProject(resource));
  allow create: if hasPermission('create_comms_projects');
  allow update: if canEditCommsProject(resource);
  allow delete: if isOwnerOrAdmin() || 
    (resource.data.createdBy == request.auth.uid && 
     hasPermission('delete_comms_projects'));
}
```

## 📦 Future Scaling
- **Pagination**: Implement cursor-based (not offset)
- **Caching**: Consider Vuex/Pinia for shared state
- **Search**: Algolia integration or Firestore composite indexes
- **Files**: Firebase Storage with size/type limits
- **Notifications**: FCM tokens + Cloud Functions triggers
- **Bulk Ops**: Batch writes, max 500 per batch
- **Export**: Cloud Functions for PDF generation

## 🐛 Debug Commands
```javascript
// Check auth state
console.log('User:', authStore.user)
console.log('Perms:', authStore.effectivePermissions)

// Check project visibility
console.log('Can view:', canViewProject(project))
console.log('Can edit:', canEditProject(project))

// Force refresh
unsubscribe?.()
unsubscribe = await initialize()
```

## ⚡ Performance Tips
- Lazy load heavy components (ProjectDetail, Forum)
- Use v-show for frequently toggled elements
- Debounce search inputs (300ms)
- Limit real-time listeners (unsubscribe on unmount)
- Index Firestore queries (region+status, createdAt)

## 🎁 Copy-Paste Helpers
```javascript
// Standard CRUD error handling
const handleError = (err, action) => {
  console.error(`Error ${action}:`, err)
  showError(err.message || `Failed to ${action}`)
}

// Permission wrapper
if (!canDoThing.value) {
  showError('Insufficient permissions')
  return
}

// Timestamp helper
const formatDate = (date) => date ? 
  new Intl.DateTimeFormat('en-US', {
    month: 'short', day: 'numeric', year: 'numeric'
  }).format(date) : 'N/A'
```