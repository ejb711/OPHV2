# Code Cleanup Guide

This guide documents the console.log removal process and best practices for debugging in production.

## Console.log Removal Script

A script was created to automatically remove all console statements from the codebase:

```javascript
// scripts/remove-console-logs.js
```

### What the Script Does

1. **Finds all console statements**: Including log, warn, error, debug, info, etc.
2. **Removes them completely**: Not just comments them out
3. **Cleans up empty blocks**: Removes empty watch/onMounted blocks left behind
4. **Fixes formatting**: Removes extra blank lines and trailing whitespace

### Running the Script

```bash
cd /workspaces/OPHV2
npm install glob  # One-time installation
node scripts/remove-console-logs.js
```

### Results

- Removed 441 console statements from 77 files
- Fixed syntax issues in affected files
- Cleaned up empty code blocks

## Debugging Best Practices

### Development Environment

During development, you can still use console.log, but remember to remove before committing:

```javascript
// Good - Use during development only
if (process.env.NODE_ENV === 'development') {
  console.log('Debug info:', data);
}

// Better - Use Vue DevTools or browser debugger
debugger; // Pause execution here
```

### Production Debugging

For production debugging without console.log:

1. **Use Browser DevTools**
   - Set breakpoints in Sources tab
   - Use Conditional breakpoints for specific cases
   - Monitor Network tab for API calls

2. **Firebase Console**
   - Check Firestore reads/writes
   - Monitor Authentication logs
   - Review Cloud Functions logs

3. **Error Tracking**
   - Implement proper error handling with try/catch
   - Use Firebase Crashlytics or similar service
   - Log errors to Firestore audit logs

### Alternative Debugging Methods

```javascript
// Instead of console.log, use:

// 1. Conditional rendering for debug info
<div v-if="showDebug">
  {{ debugData }}
</div>

// 2. Browser debugging
debugger; // Only in development!

// 3. Audit logging for important events
import { useAudit } from '@/composables/useAudit'
const { logEvent } = useAudit()
await logEvent('debug_event', { data: debugInfo })

// 4. Development-only logs
if (import.meta.env.DEV) {
  console.log('This only runs in development')
}
```

## Common Syntax Issues After Cleanup

### Empty Function Bodies

```javascript
// Before cleanup
watch(() => props.data, (newData) => {
  console.log('Data changed:', newData)
}, { immediate: true })

// After cleanup - might need fixing
watch(() => props.data, (newData) => {
  // Data changed
}, { immediate: true })
```

### Orphaned Catch Blocks

```javascript
// Before
try {
  await someFunction()
} catch (error) {
  console.error('Error:', error)
}

// After - add meaningful error handling
try {
  await someFunction()
} catch (error) {
  // Handle error appropriately
  showError(error.message)
}
```

### Empty Conditional Blocks

```javascript
// Before
if (data) {
  console.log('Data exists:', data)
}

// After - remove if not needed
// Or add meaningful logic
```

## Maintaining Clean Code

### Pre-commit Checks

Consider adding a pre-commit hook to check for console statements:

```bash
# .git/hooks/pre-commit
#!/bin/sh
if grep -r "console\." --include="*.js" --include="*.vue" client/src; then
  echo "Error: console statements found. Please remove before committing."
  exit 1
fi
```

### ESLint Rules

Add ESLint rules to prevent console statements:

```javascript
// .eslintrc.js
module.exports = {
  rules: {
    'no-console': process.env.NODE_ENV === 'production' ? 'error' : 'warn'
  }
}
```

### Code Review Checklist

- [ ] No console.log statements in production code
- [ ] Proper error handling instead of console.error
- [ ] Use development conditionals for debug code
- [ ] Remove debugger statements
- [ ] Clean up empty blocks after removal

## Benefits of Console-Free Code

1. **Smaller Bundle Size**: Reduced JavaScript payload
2. **Better Performance**: No unnecessary string operations
3. **Cleaner Output**: No console pollution in production
4. **Security**: No accidental data leaks to console
5. **Professionalism**: Cleaner for end users

## When Console Logs Are Acceptable

- Build scripts and tooling
- Node.js server-side code (with proper log management)
- Development-only conditional blocks
- CLI tools and utilities
- Error boundaries (with proper error tracking)