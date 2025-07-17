// scripts/fix-permissions.js
const admin = require('firebase-admin');

// Initialize Firebase Admin
const serviceAccount = require('/workspaces/OPHV2/ophv2_key.json'); // See note below

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: `https://${serviceAccount.project_id}.firebaseio.com`
});

const db = admin.firestore();

async function fixPermissions() {
  console.log('🚀 Starting OPHV2 Permission Fix...\n');

  // All permissions that should exist
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
    { id: 'delete_posts', name: 'Delete Posts', description: 'Remove forum posts', category: 'forums' },
    { id: 'moderate_posts', name: 'Moderate Posts', description: 'Moderate forum content', category: 'forums' },
    
    // Calendar
    { id: 'manage_calendar', name: 'Manage Calendar', description: 'Full calendar control', category: 'calendar' },
    { id: 'view_calendar', name: 'View Calendar', description: 'View calendar events', category: 'calendar' },
    { id: 'create_events', name: 'Create Events', description: 'Create calendar events', category: 'calendar' },
    { id: 'edit_events', name: 'Edit Events', description: 'Edit calendar events', category: 'calendar' },
    { id: 'delete_events', name: 'Delete Events', description: 'Remove calendar events', category: 'calendar' },
    
    // Analytics
    { id: 'view_analytics', name: 'View Analytics', description: 'View system analytics', category: 'analytics' }
  ];

  try {
    // Step 1: Fix YOUR user's deniedPermissions
    console.log('📝 Enter your user email to fix denied permissions:');
    const userEmail = 'test@example.com'; // CHANGE THIS TO YOUR EMAIL!
    
    const usersSnapshot = await db.collection('users').where('email', '==', userEmail).get();
    if (!usersSnapshot.empty) {
      const userDoc = usersSnapshot.docs[0];
      await userDoc.ref.update({
        deniedPermissions: []
      });
      console.log(`✅ Fixed denied permissions for ${userEmail}\n`);
    } else {
      console.log(`⚠️ User ${userEmail} not found. Update the email in the script.\n`);
    }

    // Step 2: Create all permission documents
    console.log('📝 Creating permission documents...\n');
    const batch = db.batch();
    
    for (const perm of allPermissions) {
      const permRef = db.collection('permissions').doc(perm.id);
      batch.set(permRef, {
        name: perm.name,
        description: perm.description,
        category: perm.category,
        isSystemPermission: true,
        createdAt: admin.firestore.FieldValue.serverTimestamp()
      }, { merge: true });
    }
    
    await batch.commit();
    console.log(`✅ Created/updated ${allPermissions.length} permission documents\n`);

    // Step 3: Verify the fix
    console.log('🔍 Verifying...\n');
    const permissionsCount = await db.collection('permissions').get();
    console.log(`✅ Total permissions in database: ${permissionsCount.size}`);
    
    console.log('\n🎉 SUCCESS! Your permissions are fixed!');
    console.log('👉 Now refresh your OPHV2 app in the browser');
    
  } catch (error) {
    console.error('❌ Error:', error);
  }
  
  process.exit(0);
}

// Run the fix
fixPermissions();