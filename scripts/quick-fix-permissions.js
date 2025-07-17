// scripts/quick-fix-permissions.js
// Quick fix for permission issues
const admin = require('firebase-admin');

// Initialize Firebase Admin
const serviceAccount = require('/workspaces/OPHV2/ophv2_key.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: `https://${serviceAccount.project_id}.firebaseio.com`
});

const db = admin.firestore();

async function quickFix() {
  console.log('🚀 OPHV2 Quick Permission Fix\n');

  try {
    // 1. Ensure admin role has all permissions
    const adminPermissions = [
      'manage_users', 'access_admin', 'view_users', 'create_users', 
      'edit_users', 'delete_users', 'manage_roles', 'manage_permissions', 
      'view_audit_logs', 'manage_projects', 'view_projects', 'create_projects', 
      'edit_projects', 'delete_projects', 'manage_forums', 'view_forums',
      'create_posts', 'edit_posts', 'delete_posts', 'moderate_posts', 
      'manage_calendar', 'view_calendar', 'create_events', 'edit_events', 
      'delete_events', 'view_analytics', 'manage_system', 'manage_settings'
    ];
    
    await db.collection('roles').doc('admin').set({
      name: 'Admin',
      description: 'System administrator with full permissions',
      permissions: adminPermissions,
      hierarchy: 90
    }, { merge: true });
    
    console.log('✅ Admin role updated with all permissions');
    
    // 2. Update admin user custom claims
    const adminUsers = await db.collection('users')
      .where('role', '==', 'admin')
      .get();
    
    for (const userDoc of adminUsers.docs) {
      await admin.auth().setCustomUserClaims(userDoc.id, {
        role: 'admin',
        permissions: []  // Clear custom permissions, role has them all
      });
      console.log(`✅ Updated claims for admin: ${userDoc.data().email}`);
    }
    
    // 3. Create audit_logs collection if needed
    const auditLog = {
      action: 'permissions_fixed',
      details: { message: 'Quick fix applied to permissions' },
      userId: 'system',
      userEmail: 'system@ophv2.app',
      timestamp: admin.firestore.FieldValue.serverTimestamp()
    };
    
    await db.collection('audit_logs').add(auditLog);
    console.log('✅ Audit logs collection verified');
    
    // 4. Ensure owner role exists
    await db.collection('roles').doc('owner').set({
      name: 'Owner',
      description: 'System owner with unrestricted access',
      permissions: ['*'],  // Special permission indicating all
      hierarchy: 100
    }, { merge: true });
    
    console.log('✅ Owner role verified');
    
    console.log('\n🎉 Permission fix complete!');
    console.log('\n📋 Next steps:');
    console.log('1. Deploy firestore rules: firebase deploy --only firestore:rules');
    console.log('2. Refresh your browser and force reload (Ctrl+Shift+R)');
    console.log('3. You should now be able to edit users!');
    
  } catch (error) {
    console.error('❌ Error:', error);
  }

  process.exit(0);
}

quickFix();