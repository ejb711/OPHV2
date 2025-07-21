// scripts/fix-role-hierarchy.js
// Script to fix incorrect role hierarchy values in the database

const admin = require('firebase-admin');
const path = require('path');

// Initialize Firebase Admin
const serviceAccount = require(path.join(__dirname, '../ophv2_key.json'));

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

// Correct hierarchy values according to documentation
const CORRECT_HIERARCHY = {
  'owner': 100,
  'admin': 90,
  'user': 50,
  'viewer': 20,
  'pending': 10
};

async function fixRoleHierarchy() {
  console.log('🔧 Starting role hierarchy fix...\n');

  try {
    // Get all roles
    const rolesSnapshot = await db.collection('roles').get();
    
    if (rolesSnapshot.empty) {
      console.log('❌ No roles found in database');
      return;
    }

    console.log(`📊 Found ${rolesSnapshot.size} roles to check\n`);

    const batch = db.batch();
    let fixCount = 0;

    // Check each role
    for (const doc of rolesSnapshot.docs) {
      const role = doc.data();
      const roleId = doc.id;
      const currentHierarchy = role.hierarchy || 0;
      const correctHierarchy = CORRECT_HIERARCHY[roleId];

      console.log(`\n🔍 Checking role: ${role.name} (${roleId})`);
      console.log(`   Current hierarchy: ${currentHierarchy}`);
      
      if (correctHierarchy !== undefined && currentHierarchy !== correctHierarchy) {
        console.log(`   ⚠️  Incorrect! Should be: ${correctHierarchy}`);
        console.log(`   ✅ Fixing hierarchy...`);
        
        // Update the role with correct hierarchy
        batch.update(doc.ref, {
          hierarchy: correctHierarchy,
          updatedAt: admin.firestore.FieldValue.serverTimestamp()
        });
        
        fixCount++;
      } else if (correctHierarchy !== undefined) {
        console.log(`   ✅ Hierarchy is correct`);
      } else {
        console.log(`   ℹ️  Custom role - hierarchy: ${currentHierarchy}`);
      }
    }

    if (fixCount > 0) {
      console.log(`\n🚀 Applying ${fixCount} hierarchy fixes...`);
      await batch.commit();
      console.log('✅ All hierarchy values have been fixed!');
      
      // Create audit log
      await createAuditLog('role_hierarchy_fix', {
        fixedCount: fixCount,
        message: `Fixed hierarchy values for ${fixCount} system roles`
      });
    } else {
      console.log('\n✅ All role hierarchies are already correct!');
    }

    // Verify the fix
    console.log('\n🔍 Verifying hierarchy values...');
    await verifyHierarchy();

  } catch (error) {
    console.error('\n❌ Error fixing role hierarchy:', error);
    process.exit(1);
  }
}

async function verifyHierarchy() {
  const rolesSnapshot = await db.collection('roles').get();
  
  console.log('\n📋 Current role hierarchy:');
  console.log('-------------------------');
  
  const roles = [];
  rolesSnapshot.forEach(doc => {
    const role = doc.data();
    roles.push({
      id: doc.id,
      name: role.name,
      hierarchy: role.hierarchy || 0,
      isSystemRole: role.isSystemRole || false
    });
  });

  // Sort by hierarchy descending
  roles.sort((a, b) => b.hierarchy - a.hierarchy);

  roles.forEach(role => {
    const status = role.isSystemRole ? '🔒' : '📝';
    console.log(`${status} ${role.name.padEnd(20)} Level: ${role.hierarchy}`);
  });
}

async function createAuditLog(action, details) {
  try {
    const auditEntry = {
      action,
      details,
      userId: 'system',
      userEmail: 'system@ophv2.app',
      timestamp: admin.firestore.FieldValue.serverTimestamp(),
      ipAddress: null,
      userAgent: 'OPHV2-Hierarchy-Fix-Script'
    };

    await db.collection('audit_logs').add(auditEntry);
    console.log('✅ Audit log created');
  } catch (error) {
    console.warn('⚠️  Warning: Could not create audit log:', error.message);
  }
}

// Display current state if --check flag is used
async function checkOnly() {
  console.log('🔍 Checking current role hierarchy...\n');
  
  try {
    const rolesSnapshot = await db.collection('roles').get();
    
    if (rolesSnapshot.empty) {
      console.log('❌ No roles found in database');
      return;
    }

    let issueCount = 0;

    rolesSnapshot.forEach(doc => {
      const role = doc.data();
      const roleId = doc.id;
      const currentHierarchy = role.hierarchy || 0;
      const correctHierarchy = CORRECT_HIERARCHY[roleId];

      if (correctHierarchy !== undefined && currentHierarchy !== correctHierarchy) {
        console.log(`⚠️  ${role.name} (${roleId}):`);
        console.log(`   Current: ${currentHierarchy}, Should be: ${correctHierarchy}`);
        issueCount++;
      }
    });

    if (issueCount > 0) {
      console.log(`\n❌ Found ${issueCount} roles with incorrect hierarchy values`);
      console.log('Run this script without --check to fix them');
    } else {
      console.log('✅ All system roles have correct hierarchy values');
    }

    await verifyHierarchy();

  } catch (error) {
    console.error('❌ Error checking hierarchy:', error);
    process.exit(1);
  }
}

// Main execution
const args = process.argv.slice(2);

if (args.includes('--help')) {
  console.log(`
OPHV2 Role Hierarchy Fix Script
================================

This script fixes incorrect role hierarchy values in the database.

Usage:
  node fix-role-hierarchy.js [options]

Options:
  --check    Check current hierarchy values without making changes
  --help     Show this help message

Correct hierarchy values:
  Owner:    100
  Admin:     90
  User:      50
  Viewer:    20
  Pending:   10
`);
  process.exit(0);
}

if (args.includes('--check')) {
  checkOnly().then(() => process.exit(0));
} else {
  console.log('⚠️  This script will update role hierarchy values in the database.');
  console.log('Press Ctrl+C to cancel or wait 3 seconds to continue...\n');
  
  setTimeout(() => {
    fixRoleHierarchy().then(() => process.exit(0));
  }, 3000);
}