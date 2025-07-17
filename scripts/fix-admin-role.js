const admin = require('firebase-admin');
const serviceAccount = require('/workspaces/OPHV2/ophv2_key.json');

admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });
const db = admin.firestore();

async function fixAdminRole() {
  const adminPermissions = [
    'manage_users', 'access_admin', 'view_users', 'create_users', 'edit_users', 'delete_users',
    'manage_roles', 'manage_permissions', 'view_audit_logs', 'manage_projects', 'view_projects',
    'create_projects', 'edit_projects', 'delete_projects', 'manage_forums', 'view_forums',
    'create_posts', 'edit_posts', 'delete_posts', 'moderate_posts', 'manage_calendar',
    'view_calendar', 'create_events', 'edit_events', 'delete_events', 'view_analytics',
    'manage_system', 'manage_settings'
  ];
  
  await db.collection('roles').doc('admin').update({
    permissions: adminPermissions
  });
  
  console.log('✅ Fixed! Admin role now has 28 permissions');
}

fixAdminRole();