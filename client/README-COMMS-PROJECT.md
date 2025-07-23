# 📡 OPHV2 Communications Dashboard

## 🎯 Overview

The Communications Dashboard is a comprehensive project management system for Louisiana Department of Health communications coordinators. It enables regional project tracking, file management, collaboration, and reporting across Louisiana's 9 health regions.

## 🏗️ Architecture

### Component Hierarchy
```
CommsView.vue (route wrapper)
└── CommsDashboard.vue (orchestrator)
    ├── CommsStats.vue (metrics display)
    ├── CommsFilters.vue (search/filter UI)
    └── ProjectList.vue (project display)
        └── ProjectCard.vue (individual project)
            └── ProjectDetail.vue (detailed view/edit)
```

### Event Flow Pattern
```
User Action → Component → Composable → Firestore → Real-time Update → UI
```

Example: Delete Flow
```
ProjectCard (emit) → ProjectList (dialog) → CommsDashboard (execute) → useCommsProjects → Firestore
```

## 📁 Project Structure

```
client/src/
├── views/
│   └── CommsView.vue                          # Main route component
├── components/comms/
│   ├── CommsDashboard.vue                     # Dashboard orchestrator
│   ├── CommsStats.vue                         # Statistics display
│   ├── CommsFilters.vue                       # Filter controls
│   ├── projects/
│   │   ├── ProjectList.vue                    # Project list/grid view
│   │   ├── ProjectCard.vue                    # Individual project card
│   │   ├── ProjectForm.vue                    # Create/edit form
│   │   ├── ProjectDetail.vue                  # Detailed view
│   │   ├── ProjectActions.vue                 # Action buttons
│   │   ├── ProjectStages.vue                  # Stage management
│   │   └── ProjectVisibility.vue              # Visibility controls
│   ├── files/
│   │   ├── FileUploader.vue                   # File upload component
│   │   ├── FileList.vue                       # File display list
│   │   ├── LinkManager.vue                    # External links
│   │   └── VersionHistory.vue                 # File versions
│   ├── forum/
│   │   ├── ProjectForum.vue                   # Discussion forum
│   │   ├── ForumMessage.vue                   # Individual message
│   │   └── ForumComposer.vue                  # Message composer
│   ├── coordinators/
│   │   ├── CoordinatorSelect.vue              # Coordinator picker
│   │   └── CoordinatorWorkload.vue            # Workload display
│   └── shared/
│       ├── StatusBadge.vue                    # Status indicator
│       ├── RegionBadge.vue                    # Region indicator
│       └── ProgressTracker.vue                # Progress display
├── composables/comms/
│   ├── useCommsProjects.js                    # Project CRUD operations
│   ├── useProjectFiles.js                     # File management
│   ├── useProjectForum.js                     # Forum functionality
│   ├── useProjectTemplates.js                 # Template management
│   ├── useProjectAnalytics.js                 # Analytics/reporting
│   └── commsProjectPermissions.js             # Permission helpers
└── config/
    └── louisiana-regions.js                   # Region configuration
```

## 📊 Data Models

### comms_projects
```javascript
{
  id: string,
  title: string,
  description: string,
  region: string,              // "1" through "9"
  status: string,              // not_started, planning, in_progress, review, completed
  priority: string,            // low, medium, high
  stages: string[],            // Custom project stages
  currentStageIndex: number,
  deadline: Timestamp,
  tags: string[],
  visibility: string,          // private, coordinators, organization, public
  sharedWith: string[],        // User IDs
  coordinatorId: string,
  createdBy: string,
  createdByEmail: string,
  createdAt: Timestamp,
  updatedBy: string,
  updatedByEmail: string,
  updatedAt: Timestamp,
  deleted: boolean,
  deletedAt: Timestamp,
  deletedBy: string,
  viewCount: number
}
```

### comms_files
```javascript
{
  id: string,
  projectId: string,
  name: string,
  displayName: string,
  description: string,
  size: number,
  type: string,                // MIME type or 'external_link'
  storagePath: string,         // Firebase Storage path
  downloadURL: string,
  url: string,                 // For external links
  version: number,
  tags: string[],
  deleted: boolean,
  createdAt: Timestamp,
  createdBy: string,
  createdByEmail: string,
  updatedAt: Timestamp
}
```

### comms_messages
```javascript
{
  id: string,
  projectId: string,
  content: string,
  authorId: string,
  authorName: string,
  authorEmail: string,
  createdAt: Timestamp,
  editedAt: Timestamp,
  deleted: boolean
}
```

### comms_coordinators
```javascript
{
  userId: string,
  regions: string[],           // Array of region IDs
  assignedBy: string,
  assignedAt: Timestamp
}
```

## 🚦 Implementation Status

### ✅ Completed Phases

#### Phase 1: Foundation & Permissions
- Added communications permissions to Cloud Functions
- Created Louisiana regions configuration
- Set up routing and navigation
- Added menu item with permission guards

#### Phase 2: Database Structure & Security Rules
- Implemented Firestore security rules for all collections
- Fixed field name consistency (createdBy vs uploadedBy)
- Created test data seeder script
- Established permission-based access control

#### Phase 3: Main Dashboard Shell
- Built responsive dashboard layout
- Created statistics placeholder cards
- Implemented filter UI structure
- Applied Louisiana Department of Health branding

#### Phase 4: Project CRUD - Read & List
- Real-time project fetching with Firestore listeners
- Grid and list view modes
- Status, priority, and region badges
- Fixed auth state issues
- Implemented visibility filtering

#### Phase 5: Project CRUD - Create
- Full project creation form with validation
- Custom stage management
- Tag system implementation
- Template selection placeholder
- Fixed v-combobox display issues

#### Phase 6: Project CRUD - Update & Delete
- Project detail view with tabs
- Edit functionality
- Soft delete with retention
- Visibility controls
- Tab-based interface

#### Phase 7: File Management System
- ✅ File upload to Firebase Storage
- ✅ External link management
- ✅ Version control for duplicate filenames
- ✅ File list with metadata display
- ✅ Fixed Firestore permission issues
- ✅ Integrated with project detail tabs

### 🔄 In Progress

#### Phase 8: Project Forum System
- Basic structure created
- Need to implement real-time messaging
- Edit/delete functionality pending

### 📋 Remaining Phases

#### Phase 9: Search & Filtering
- Full-text search implementation
- Advanced filter logic
- Search history
- Quick filter presets

#### Phase 10: Analytics & Reporting
- Real statistics calculation
- Export functionality (PDF/Excel)
- Coordinator workload analysis
- Regional rollup reports

#### Phase 11: Templates & Automation
- Template CRUD operations
- Project duplication
- Auto-assignment logic
- Workflow automation

#### Phase 12: Polish & Optimization
- Performance optimization
- Enhanced error handling
- Help documentation
- Retention policy automation

## 🔧 Configuration & Setup

### Required Permissions
Users need these permissions to access the dashboard:
- `view_comms` - Basic access
- `create_comms_projects` - Create projects
- `edit_comms_projects` - Edit own projects
- `delete_comms_projects` - Delete own projects
- `manage_comms` - Full administrative access

### Firebase Configuration

#### Storage Rules
```javascript
match /comms/{projectId}/{allPaths=**} {
  allow read: if request.auth != null;
  allow write: if request.auth != null
    && request.resource.size < 25 * 1024 * 1024;
  allow delete: if request.auth != null;
}
```

#### Firestore Rules Key Points
- Users can only create files with their own ID as `createdBy`
- Visibility rules enforce project-level permissions
- Coordinators have special access to their assigned regions

### Environment Setup
1. Ensure Firebase project has Storage enabled
2. Apply CORS configuration for GitHub Codespaces
3. Deploy Firestore security rules
4. Grant users appropriate permissions

## 🐛 Common Issues & Solutions

### File Upload 403 Error
**Issue**: "Firebase Storage: User does not have permission"
**Solution**: 
1. Check Storage rules are deployed
2. Verify CORS configuration
3. Ensure user is authenticated

### Firestore Permission Errors
**Issue**: "Missing or insufficient permissions"
**Solution**:
1. Check user has required permissions (view_comms, etc.)
2. Verify Firestore rules match data structure
3. Ensure field names are consistent (createdBy not uploadedBy)

### Region Display Issues
**Issue**: Regions show as "Unknown Region"
**Solution**: Use numeric strings ("1" not "region1") for region IDs

## 🎨 UI/UX Patterns

### Louisiana Health Regions
The dashboard uses Louisiana's 9 health regions with designated colors:
1. Northwest (Blue)
2. Northeast (Green)
3. Central (Purple)
4. Acadiana (Orange)
5. Southwest (Red)
6. South Central (Yellow)
7. Jefferson Parish (Pink)
8. Greater New Orleans (Teal)
9. Northshore (Brown)

### Status Workflow
Projects follow this status progression:
1. `not_started` → Planning begins
2. `planning` → Implementation starts
3. `in_progress` → Work ongoing
4. `review` → Awaiting approval
5. `completed` → Project finished

### Visibility Levels
- **Private**: Only creator and explicitly shared users
- **Coordinators**: Regional coordinators can view
- **Organization**: All authenticated users
- **Public**: All dashboard users

## 🚀 Development Guidelines

### Component Best Practices
- Keep components under 250 lines
- Extract sub-components when needed
- Use composition over inheritance
- Implement loading and error states

### Event Handling Pattern
```javascript
// Child component emits
emit('action', data)

// Parent handles or forwards
function handleAction(data) {
  // Process or forward to orchestrator
}

// Orchestrator executes
async function executeAction(data) {
  // Call composable method
}
```

### Real-time Updates
All list views use Firestore listeners for automatic updates:
```javascript
onSnapshot(query, (snapshot) => {
  // Update reactive data
})
```

### Error Handling
```javascript
try {
  // Operation
  showSuccess('Success message')
} catch (error) {
  console.error('Context:', error)
  showError('User-friendly message')
}
```

## 📈 Performance Considerations

### Pagination
- Projects: 12 per page (grid), 20 per page (list)
- Messages: 50 per load
- Files: All files loaded (consider pagination for large projects)

### Lazy Loading
- Project detail components
- Forum messages
- File preview components

### Caching Strategy
- Region data is static (cache indefinitely)
- Coordinator assignments (cache 5 minutes)
- User permissions (cache during session)

## 🔒 Security Considerations

### Data Access
- All data access goes through Firestore security rules
- Storage files inherit project permissions
- Audit logging for administrative actions

### Soft Delete Pattern
- Data marked with `deleted: true` flag
- 90-day retention for recovery
- Hard delete requires admin permission

### File Security
- 25MB file size limit
- Virus scanning recommended for production
- Download URLs are publicly accessible (consider signed URLs)

## 🧪 Testing Checklist

### User Roles
Test with each role:
- [ ] Owner: Full system access
- [ ] Admin: Full communications access
- [ ] Coordinator: Regional access only
- [ ] User: Own projects + shared
- [ ] Viewer: Read-only access

### Features
- [ ] Create project with all fields
- [ ] Edit project details
- [ ] Upload/download files
- [ ] Add external links
- [ ] Post forum messages
- [ ] Apply filters
- [ ] View statistics

### Edge Cases
- [ ] Empty states
- [ ] Network errors
- [ ] Large file uploads
- [ ] Concurrent edits
- [ ] Permission changes

## 📚 Resources

### Firebase Documentation
- [Firestore Security Rules](https://firebase.google.com/docs/firestore/security/get-started)
- [Storage Security Rules](https://firebase.google.com/docs/storage/security)
- [Cloud Functions](https://firebase.google.com/docs/functions)

### Vue.js Resources
- [Vue 3 Composition API](https://vuejs.org/guide/extras/composition-api-faq.html)
- [Vuetify 3 Components](https://vuetifyjs.com/en/components/all/)

### Project Specific
- Louisiana Department of Health [Brand Guidelines](internal)
- OPHV2 Main [README.md](../README.md)
- [Project Architecture](../ARCHITECTURE.md)

## 🤝 Contributing

When adding new features:
1. Follow established patterns
2. Maintain file size limits (<250 lines)
3. Add appropriate error handling
4. Update relevant documentation
5. Test with multiple user roles
6. Ensure real-time updates work
7. Consider mobile responsiveness

## 📞 Support

For issues or questions:
1. Check this README first
2. Review error messages in console
3. Verify Firebase configuration
4. Test in incognito mode
5. Contact project maintainers

---

*Last Updated: July 2025*  
*Version: 1.0.0*  
*Phase 7 Completed - Debugging