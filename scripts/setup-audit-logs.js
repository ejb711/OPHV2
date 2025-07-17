// scripts/setup-audit-logs.js
const admin = require('firebase-admin');

// Initialize Firebase Admin
const serviceAccount = require('/workspaces/OPHV2/ophv2_key.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: `https://${serviceAccount.project_id}.firebaseio.com`
});

const db = admin.firestore();

async function setupAuditLogs() {
  console.log('🚀 Setting up OPHV2 Audit Logs Collection...\n');

  try {
    // Create the audit_logs collection with an initial document
    const initialLog = {
      action: 'system_initialized',
      details: {
        message: 'Audit log collection created',
        version: '1.0.0'
      },
      userId: 'system',
      userEmail: 'system@ophv2.app',
      timestamp: admin.firestore.FieldValue.serverTimestamp()
    };

    // Add the initial document
    const docRef = await db.collection('audit_logs').add(initialLog);
    console.log('✅ Created audit_logs collection with initial document:', docRef.id);

    // Create composite index for efficient queries
    console.log('\n📋 Recommended Firestore indexes for audit_logs:');
    console.log('1. Collection: audit_logs');
    console.log('   - Fields: timestamp (Descending), action (Ascending)');
    console.log('2. Collection: audit_logs');
    console.log('   - Fields: userId (Ascending), timestamp (Descending)');
    console.log('3. Collection: audit_logs');
    console.log('   - Fields: action (Ascending), timestamp (Descending)');
    
    console.log('\n💡 Note: You may need to create these indexes manually in the Firebase Console');
    console.log('   or wait for Firestore to suggest them when you run queries.');

    // Add some example audit log types for reference
    const exampleLogs = [
      {
        action: 'user_login',
        details: { method: 'email', ip: '192.168.1.1' },
        userId: 'example-user-id',
        userEmail: 'user@example.com',
        timestamp: admin.firestore.FieldValue.serverTimestamp()
      },
      {
        action: 'user_updated',
        details: {
          userId: 'target-user-id',
          changes: {
            role: { from: 'user', to: 'admin' }
          }
        },
        userId: 'admin-user-id',
        userEmail: 'admin@example.com',
        timestamp: admin.firestore.FieldValue.serverTimestamp()
      },
      {
        action: 'permission_granted',
        details: {
          userId: 'target-user-id',
          permission: 'manage_projects'
        },
        userId: 'admin-user-id',
        userEmail: 'admin@example.com',
        timestamp: admin.firestore.FieldValue.serverTimestamp()
      }
    ];

    console.log('\n📝 Example audit log actions:');
    console.log('- user_login');
    console.log('- user_logout');
    console.log('- user_created');
    console.log('- user_updated');
    console.log('- user_deleted');
    console.log('- role_changed');
    console.log('- permission_granted');
    console.log('- permission_revoked');
    console.log('- bulk_operation');
    console.log('- admin_tab_viewed');
    console.log('- system_error');
    console.log('- security_alert');

    console.log('\n✅ Audit logs collection is ready!');
    console.log('\n🔒 Security Rules to add to firestore.rules:');
    console.log(`
    // Audit logs - read only for admins, write through Cloud Functions only
    match /audit_logs/{document} {
      allow read: if request.auth != null && 
        (request.auth.token.role == 'admin' || 
         request.auth.token.role == 'owner' ||
         hasPermission('view_audit_logs'));
      allow write: if false; // Only allow writes through Cloud Functions
    }
    `);

  } catch (error) {
    console.error('❌ Error setting up audit logs:', error);
  }

  process.exit(0);
}

// Helper function reference for your security rules
function hasPermissionRuleExample() {
  return `
  // Add this function to your firestore.rules file:
  function hasPermission(permission) {
    let userDoc = get(/databases/$(database)/documents/users/$(request.auth.uid));
    let roleDoc = get(/databases/$(database)/documents/roles/$(userDoc.data.role));
    
    return permission in roleDoc.data.permissions ||
           permission in userDoc.data.customPermissions ||
           userDoc.data.role == 'owner';
  }
  `;
}

setupAuditLogs();