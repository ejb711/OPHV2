# OPHV2 Scripts - Administrative Utilities

## Overview

This directory contains administrative scripts for managing and maintaining the OPHV2 system. These scripts handle database migrations, system initialization, permission fixes, and other maintenance tasks.

## Available Scripts

### System Initialization

#### `run-system-init.js`
Initializes the system with default data including roles, permissions, and configurations.
```bash
node scripts/run-system-init.js
```

#### `add-owner-user.js`
Creates an initial owner account with full system permissions.
```bash
node scripts/add-owner-user.js --email owner@example.com
```

### Permission Management

#### `fix-permissions.js`
Repairs permission assignments and ensures proper role hierarchy.
```bash
node scripts/fix-permissions.js
```

#### `fix-admin-role.js`
Fixes admin role permissions and hierarchy issues.
```bash
node scripts/fix-admin-role.js
```

#### `fix-owner-permissions.js`
Ensures owner role has all system permissions.
```bash
node scripts/fix-owner-permissions.js
```

#### `fix-role-hierarchy.js`
Corrects role hierarchy values and inheritance.
```bash
node scripts/fix-role-hierarchy.js
```

#### `add-profile-permissions.js`
Adds user profile management permissions to appropriate roles.
```bash
node scripts/add-profile-permissions.js
```

#### `add-forum-permission.js`
Adds forum-related permissions to the system.
```bash
node scripts/add-forum-permission.js
```

### Communications Module

#### `fix-comms-permissions-complete.js`
Sets up all permissions for the communications module.
```bash
node scripts/fix-comms-permissions-complete.js
```

#### `seed-comms-test-data.js`
Populates the database with test communications projects.
```bash
node scripts/seed-comms-test-data.js --count 50
```

#### `debug-seed-comms-projects.js`
Debug version of the seeding script with verbose output.
```bash
node scripts/debug-seed-comms-projects.js
```

#### `fix-projects-structure.js`
Migrates projects to the correct data structure.
```bash
node scripts/fix-projects-structure.js
```

#### `fix-project-deleted-field.js`
Adds or fixes the deleted field on project documents.
```bash
node scripts/fix-project-deleted-field.js
```

#### `fix-region-ids.js`
Standardizes region IDs across all projects.
```bash
node scripts/fix-region-ids.js
```

#### `fix-visibility-values.js`
Corrects project visibility field values.
```bash
node scripts/fix-visibility-values.js
```

### User Management

#### `migrate-user-status.js`
Adds status field to existing users and sets default values.
```bash
node scripts/migrate-user-status.js
```

#### `fix-admin-panel-users.sh`
Shell script to fix admin panel user display issues.
```bash
./scripts/fix-admin-panel-users.sh
```

### Firestore Index Management

#### `create-firestore-indexes.js`
Creates required Firestore indexes programmatically.
```bash
node scripts/create-firestore-indexes.js
```

#### `cleanup-firestore-indexes.js`
Removes unused or duplicate Firestore indexes.
```bash
node scripts/cleanup-firestore-indexes.js
```

#### `fix-firestore-indexes.sh`
Shell script to deploy Firestore index configuration.
```bash
./scripts/fix-firestore-indexes.sh
```

#### `fix-profile-indexes.js`
Creates indexes specifically for user profile queries.
```bash
node scripts/fix-profile-indexes.js
```

### Audit System

#### `setup-audit-logs.js`
Initializes audit log collection with proper indexes.
```bash
node scripts/setup-audit-logs.js
```

#### `quick-cleanup-audit-logs.js`
Performs manual audit log cleanup based on retention policies.
```bash
node scripts/quick-cleanup-audit-logs.js --days 90
```

### Storage Management

#### `apply-cors.js`
Applies CORS configuration to Firebase Storage buckets.
```bash
node scripts/apply-cors.js
```

#### `debug-storage.js`
Tests and debugs storage bucket access and permissions.
```bash
node scripts/debug-storage.js
```

### Debug Utilities

#### `debug-projects.js`
Displays detailed information about projects in the database.
```bash
node scripts/debug-projects.js --limit 10
```

## Usage Guidelines

### Prerequisites

1. **Service Account**: Most scripts require a service account key file:
   ```bash
   export GOOGLE_APPLICATION_CREDENTIALS="path/to/serviceAccountKey.json"
   ```

2. **Node.js**: Ensure Node.js 18+ is installed

3. **Dependencies**: Install required packages:
   ```bash
   npm install
   ```

### Running Scripts Safely

1. **Always backup data** before running migration scripts
2. **Test in development** environment first
3. **Review script output** for any errors or warnings
4. **Run one script at a time** to avoid conflicts

### Common Patterns

Most scripts follow this pattern:
```javascript
const admin = require('firebase-admin');

// Initialize admin SDK
admin.initializeApp();
const db = admin.firestore();

async function main() {
  try {
    // Script logic here
    console.log('✅ Script completed successfully');
  } catch (error) {
    console.error('❌ Script failed:', error);
    process.exit(1);
  }
}

main();
```

## Script Categories

### 🚀 Initialization Scripts
- System setup and initial configuration
- Should only be run once per environment
- Create default data structures

### 🔧 Fix Scripts
- Repair existing data or permissions
- Safe to run multiple times (idempotent)
- Check before making changes

### 🌱 Seed Scripts
- Populate database with test data
- Only for development/testing
- Should not be run in production

### 🔍 Debug Scripts
- Inspect and report on data
- Read-only operations
- Safe to run in any environment

### 🗑️ Cleanup Scripts
- Remove old or unused data
- Implement retention policies
- Use with caution

## Best Practices

1. **Logging**: All scripts should provide clear console output
2. **Error Handling**: Gracefully handle and report errors
3. **Transactions**: Use batch operations for multiple updates
4. **Dry Run**: Implement --dry-run option for destructive operations
5. **Documentation**: Include usage examples in script comments

## Creating New Scripts

When adding new scripts:

1. Follow the naming convention: `action-target.js`
2. Add comprehensive comments explaining purpose
3. Include usage examples
4. Implement proper error handling
5. Update this README with documentation

Example template:
```javascript
/**
 * Script: fix-something.js
 * Purpose: Fixes specific issue with something
 * Usage: node scripts/fix-something.js [--dry-run]
 */

const admin = require('firebase-admin');
const yargs = require('yargs');

const argv = yargs
  .option('dry-run', {
    describe: 'Preview changes without applying them',
    type: 'boolean',
    default: false
  })
  .help()
  .argv;

// Script implementation...
```

## Troubleshooting

### Common Issues

1. **Authentication Error**
   ```
   Error: Could not load the default credentials
   ```
   Solution: Set GOOGLE_APPLICATION_CREDENTIALS environment variable

2. **Permission Denied**
   ```
   Error: Missing or insufficient permissions
   ```
   Solution: Ensure service account has necessary Firestore permissions

3. **Script Hangs**
   - Check for unclosed database connections
   - Add `process.exit(0)` at the end of main()

### Debug Mode

Many scripts support verbose output:
```bash
DEBUG=* node scripts/script-name.js
```

## Security Notes

- Never commit service account keys to version control
- Scripts with write access should validate all inputs
- Use least-privilege service accounts when possible
- Log all administrative actions for audit trail