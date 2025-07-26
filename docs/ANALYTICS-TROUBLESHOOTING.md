# Analytics Dashboard Troubleshooting Guide

This guide covers common issues and solutions for the Communications Analytics Dashboard.

## Common Issues

### 1. Message Counter Shows 0

**Problem**: The message counter in the analytics dashboard shows 0 even though messages exist.

**Cause**: Firebase security rules blocking access to the `comms_messages` collection.

**Solution**: 
- Ensure the user has either `view_analytics` or `manage_comms` permission
- Check that Firestore rules include the analytics permission check:
```javascript
allow read: if request.auth != null && (
  hasPermission('view_analytics') ||
  hasPermission('manage_comms') ||
  // ... other conditions
);
```

### 2. Coordinator Workload Shows Incorrect Counts

**Problem**: The coordinator workload shows incorrect active/completed project counts.

**Cause**: The UI was combining "not_started" and "in_progress" into "Active" which was confusing.

**Solution**: 
- The workload now shows three distinct statuses:
  - Not Started: Projects that haven't begun
  - In Progress: Projects actively being worked on (includes pending_approval)
  - Completed: Finished projects

### 3. Coordinator Projects Not Matching

**Problem**: Some coordinators show 0 projects even though projects are assigned to them.

**Cause**: ID mismatch between test data formats (test-coordinator-X vs test-user-X).

**Solution**: 
- The system now maps between different ID formats automatically
- Check `CoordinatorWorkload.vue` for the ID mapping logic if issues persist

## Performance Considerations

### Analytics Data Loading

The analytics dashboard loads several data streams:
1. Projects (main data source)
2. Files counter (real-time listener)
3. Messages counter (real-time listener)
4. Coordinators (real-time listener)

If performance is slow:
- Check browser console for Firebase quota errors
- Verify Firestore indexes are properly configured
- Consider implementing pagination for large datasets

### Real-time Updates

All counters use Firestore real-time listeners. If updates aren't appearing:
1. Check network connectivity
2. Verify Firebase Authentication token is valid
3. Check browser console for permission errors

## Security Permissions

### Required Permissions for Analytics

- `view_analytics`: Allows viewing all analytics data including message counts
- `manage_comms`: Full access to communications module including analytics
- `view_comms`: Basic view access (limited analytics)

### Permission Hierarchy

1. **Owner**: Has all permissions
2. **Admin**: Has most permissions including analytics
3. **User**: Requires explicit `view_analytics` permission
4. **Viewer/Custom roles**: Must be granted specific permissions

## Debugging Tips

### Enable Browser Console

Even though console.logs have been removed from production, you can:
1. Use browser DevTools to set breakpoints
2. Check Network tab for Firebase requests
3. Monitor Firestore reads in Firebase Console

### Check Firebase Console

1. Go to Firebase Console > Firestore Database
2. Check the Rules Playground to test permissions
3. Monitor usage quotas and limits

### Common Error Messages

- **"Missing or insufficient permissions"**: User lacks required permissions
- **"Failed to get documents"**: Network issue or Firebase service problem
- **"Quota exceeded"**: Too many reads, implement caching

## Test Data Considerations

The system includes test data with specific patterns:
- Projects with IDs like `test-project-X`
- Coordinators with IDs like `test-coordinator-X` or `test-user-X`
- Some older data may have different ID formats

When working with test data:
1. Be aware of the ID mapping in coordinator workload
2. Check for deleted flag on test projects
3. Verify coordinator regions match project regions

## Contact Support

If issues persist after following this guide:
1. Document the exact error message
2. Note the user's role and permissions
3. Check browser console for errors
4. Contact the development team with details