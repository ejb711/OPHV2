// scripts/fix-owner-permissions.js
// Quick fix for owner role permissions issue
const admin = require('firebase-admin');

// Initialize Firebase Admin
const serviceAccount = require('/workspaces/OPHV2/ophv2_key.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: `https://${serviceAccount.project_id}.firebaseio.com`
});

const db = admin.firestore();

async function fixOwnerPermissions() {
  console.log('🔧 OPHV2 - Fixing Owner Role Permissions\n');

  try {
    // 1. Ensure owner role document exists with proper structure
    console.log('1️⃣ Setting up owner role document...');
    
    const ownerRole = {
      name: 'Owner',
      description: 'System owner with unrestricted access to all features',
      permissions: ['*'], // Special permission indicating all permissions
      hierarchy: 100,
      isSystemRole: true,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    };

    await db.collection('roles').doc('owner').set(ownerRole, { merge: true });
    console.log('✅ Owner role document created/updated');

    // 2. Also ensure all individual permissions exist (for proper UI display)
    console.log('\n2️⃣ Ensuring all permissions exist...');
    
    const allPermissions = [
      // User Management
      { id: 'manage_users', name: 'Manage Users', description: 'Create, edit, delete users', category: 'users' },
      { id: 'view_users', name: 'View Users', description: 'View user list and details', category: 'users' },
      { id: 'create_users', name: 'Create Users', description: 'Create new user accounts', category: 'users' },
      { id: 'edit_users', name: 'Edit Users', description: 'Edit user information', category: 'users' },
      { id: 'delete_users', name: 'Delete Users', description: 'Remove user accounts', category: 'users' },
      
      // Admin Access
      { id: 'access_admin', name: 'Access Admin Panel', description: 'Access administrative interface', category: 'admin' },
      { id: 'manage_roles', name: 'Manage Roles', description: 'Create and modify roles', category: 'admin' },
      { id: 'manage_permissions', name: 'Manage Permissions', description: 'Assign and revoke permissions', category: 'admin' },
      { id: 'view_audit_logs', name: 'View Audit Logs', description: 'View system activity logs', category: 'admin' },
      { id: 'manage_system', name: 'Manage System', description: 'System-wide configuration', category: 'admin' },
      { id: 'manage_settings', name: 'Manage Settings', description: 'Application settings', category: 'admin' },
      
      // Projects
      { id: 'manage_projects', name: 'Manage Projects', description: 'Full project control', category: 'projects' },
      { id: 'view_projects', name: 'View Projects', description: 'View project list and details', category: 'projects' },
      { id: 'create_projects', name: 'Create Projects', description: 'Create new projects', category: 'projects' },
      { id: 'edit_projects', name: 'Edit Projects', description: 'Edit project information', category: 'projects' },
      { id: 'delete_projects', name: 'Delete Projects', description: 'Remove projects', category: 'projects' },
      
      // Forums
      { id: 'manage_forums', name: 'Manage Forums', description: 'Full forum control', category: 'forums' },
      { id: 'view_forums', name: 'View Forums', description: 'View forum content', category: 'forums' },
      { id: 'create_posts', name: 'Create Posts', description: 'Create forum posts', category: 'forums' },
      { id: 'edit_posts', name: 'Edit Posts', description: 'Edit forum posts', category: 'forums' },
      { id: 'delete_posts', name: 'Delete Posts', description: 'Delete forum posts', category: 'forums' },
      { id: 'moderate_posts', name: 'Moderate Posts', description: 'Moderate forum content', category: 'forums' },
      
      // Calendar
      { id: 'manage_calendar', name: 'Manage Calendar', description: 'Full calendar control', category: 'calendar' },
      { id: 'view_calendar', name: 'View Calendar', description: 'View calendar events', category: 'calendar' },
      { id: 'create_events', name: 'Create Events', description: 'Create calendar events', category: 'calendar' },
      { id: 'edit_events', name: 'Edit Events', description: 'Edit calendar events', category: 'calendar' },
      { id: 'delete_events', name: 'Delete Events', description: 'Delete calendar events', category: 'calendar' },
      
      // Analytics
      { id: 'view_analytics', name: 'View Analytics', description: 'View system analytics', category: 'analytics' }
    ];

    // Create all permission documents
    const batch = db.batch();
    allPermissions.forEach(permission => {
      const permRef = db.collection('permissions').doc(permission.id);
      batch.set(permRef, {
        ...permission,
        createdAt: admin.firestore.FieldValue.serverTimestamp()
      }, { merge: true });
    });

    await batch.commit();
    console.log(`✅ ${allPermissions.length} permissions ensured`);

    // 3. Verify eric.brooks@la.gov user setup
    console.log('\n3️⃣ Verifying eric.brooks@la.gov setup...');
    
    try {
      const userRecord = await admin.auth().getUserByEmail('eric.brooks@la.gov');
      console.log(`✅ User exists: ${userRecord.uid}`);

      // Check Firestore document
      const userDoc = await db.collection('users').doc(userRecord.uid).get();
      if (userDoc.exists) {
        const userData = userDoc.data();
        console.log(`✅ Firestore document exists with role: ${userData.role}`);
        
        if (userData.role !== 'owner') {
          console.log('🔧 Updating user role to owner...');
          await db.collection('users').doc(userRecord.uid).update({
            role: 'owner',
            updatedAt: admin.firestore.FieldValue.serverTimestamp()
          });
          console.log('✅ User role updated to owner');
        }
      } else {
        console.log('❌ Firestore document missing, creating...');
        await db.collection('users').doc(userRecord.uid).set({
          email: 'eric.brooks@la.gov',
          displayName: 'Eric Brooks',
          role: 'owner',
          status: 'active',
          customPermissions: [],
          deniedPermissions: [],
          createdAt: admin.firestore.FieldValue.serverTimestamp(),
          createdBy: 'system'
        });
        console.log('✅ Firestore document created');
      }

      // Update custom claims
      await admin.auth().setCustomUserClaims(userRecord.uid, {
        role: 'owner',
        permissions: ['*']
      });
      console.log('✅ Custom claims updated');

    } catch (userError) {
      console.error('❌ Error with user setup:', userError);
    }

    // 4. Create audit log
    console.log('\n4️⃣ Creating audit log...');
    await db.collection('audit_logs').add({
      action: 'owner_permissions_fixed',
      details: {
        message: 'Owner role permissions and user setup verified',
        permissionsCount: allPermissions.length,
        fixedBy: 'admin-script'
      },
      userId: 'system',
      userEmail: 'system@ophv2.app',
      timestamp: admin.firestore.FieldValue.serverTimestamp()
    });
    console.log('✅ Audit log created');

    console.log('\n🎉 SUCCESS! Owner permissions fixed');
    console.log('=====================================');
    console.log('📋 What was fixed:');
    console.log('• Owner role document with proper permissions');
    console.log('• All 28 individual permissions in Firestore');
    console.log('• Eric Brooks user role and custom claims');
    console.log('• Audit log entry created');
    
    console.log('\n🔄 Next steps:');
    console.log('1. 🌐 Refresh the browser (hard refresh: Ctrl+Shift+R)');
    console.log('2. 🔍 Check that Admin button now appears');
    console.log('3. ✅ Eric should have full access to admin panel');

  } catch (error) {
    console.error('❌ Error fixing owner permissions:', error);
    process.exit(1);
  }

  process.exit(0);
}

fixOwnerPermissions();