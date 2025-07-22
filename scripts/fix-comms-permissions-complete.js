// scripts/fix-comms-permissions-complete.js
// Complete fix to add Communications permissions to the database

const admin = require('firebase-admin');
const serviceAccount = require('/workspaces/OPHV2/ophv2_key.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

async function fixCommunicationsPermissions() {
  console.log('🔧 Fixing Communications Dashboard Permissions...\n');
  
  try {
    // 1. First, create all Communications permissions in the permissions collection
    console.log('📝 Creating Communications permissions in database...\n');
    
    const commsPermissions = [
      { 
        id: 'manage_comms', 
        name: 'Manage Communications', 
        description: 'Full communications dashboard access', 
        category: 'communications' // Note: using 'communications' to match the pattern
      },
      { 
        id: 'view_comms', 
        name: 'View Communications', 
        description: 'View communications dashboard and projects', 
        category: 'communications' 
      },
      { 
        id: 'create_comms_projects', 
        name: 'Create Communications Projects', 
        description: 'Create new communications projects', 
        category: 'communications' 
      },
      { 
        id: 'edit_comms_projects', 
        name: 'Edit Communications Projects', 
        description: 'Edit communications project details', 
        category: 'communications' 
      },
      { 
        id: 'delete_comms_projects', 
        name: 'Delete Communications Projects', 
        description: 'Delete communications projects', 
        category: 'communications' 
      },
      { 
        id: 'manage_comms_coordinators', 
        name: 'Manage Communications Coordinators', 
        description: 'Assign and manage regional coordinators', 
        category: 'communications' 
      },
      { 
        id: 'view_all_regions', 
        name: 'View All Regions', 
        description: 'View projects from all Louisiana regions', 
        category: 'communications' 
      },
      { 
        id: 'manage_comms_templates', 
        name: 'Manage Communications Templates', 
        description: 'Create and manage project templates', 
        category: 'communications' 
      },
      { 
        id: 'export_comms_data', 
        name: 'Export Communications Data', 
        description: 'Export project data and reports', 
        category: 'communications' 
      },
      { 
        id: 'approve_comms_projects', 
        name: 'Approve Communications Projects', 
        description: 'Approve projects in pending status', 
        category: 'communications' 
      }
    ];
    
    // Create all permissions
    const batch = db.batch();
    
    for (const permission of commsPermissions) {
      const permRef = db.collection('permissions').doc(permission.id);
      batch.set(permRef, {
        ...permission,
        isSystemPermission: true,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
      }, { merge: true });
    }
    
    await batch.commit();
    console.log(`✅ Created ${commsPermissions.length} Communications permissions\n`);
    
    // 2. Update roles with appropriate permissions
    console.log('📝 Updating roles with Communications permissions...\n');
    
    const roleUpdates = {
      owner: {
        // Owner gets all permissions by default, but let's be explicit
        add: commsPermissions.map(p => p.id)
      },
      admin: {
        add: [
          'manage_comms', 'view_comms', 'create_comms_projects', 
          'edit_comms_projects', 'delete_comms_projects',
          'manage_comms_coordinators', 'view_all_regions', 
          'manage_comms_templates', 'export_comms_data', 
          'approve_comms_projects'
        ]
      },
      user: {
        add: ['view_comms', 'create_comms_projects', 'edit_comms_projects']
      },
      viewer: {
        add: ['view_comms']
      }
    };
    
    for (const [roleId, updates] of Object.entries(roleUpdates)) {
      try {
        const roleRef = db.collection('roles').doc(roleId);
        const roleDoc = await roleRef.get();
        
        if (!roleDoc.exists) {
          console.log(`⚠️  Role '${roleId}' not found, skipping...`);
          continue;
        }
        
        const currentPermissions = roleDoc.data().permissions || [];
        const permissionsToAdd = updates.add.filter(p => !currentPermissions.includes(p));
        
        if (permissionsToAdd.length === 0) {
          console.log(`✅ Role '${roleId}' already has all Communications permissions`);
          continue;
        }
        
        const updatedPermissions = [...currentPermissions, ...permissionsToAdd];
        
        await roleRef.update({
          permissions: updatedPermissions,
          updatedAt: admin.firestore.FieldValue.serverTimestamp()
        });
        
        console.log(`✅ Updated role '${roleId}' with ${permissionsToAdd.length} new permissions`);
        
      } catch (error) {
        console.error(`❌ Error updating role '${roleId}':`, error);
      }
    }
    
    // 3. Verify the permissions were created
    console.log('\n🔍 Verifying Communications permissions...\n');
    
    const permissionsSnapshot = await db.collection('permissions')
      .where('category', '==', 'communications')
      .get();
    
    console.log(`✅ Found ${permissionsSnapshot.size} Communications permissions in database`);
    
    if (permissionsSnapshot.size > 0) {
      console.log('\n📋 Communications permissions in database:');
      permissionsSnapshot.forEach(doc => {
        const data = doc.data();
        console.log(`   - ${data.name} (${doc.id})`);
      });
    }
    
    // 4. Check total permissions count
    const allPermissionsSnapshot = await db.collection('permissions').get();
    console.log(`\n📊 Total permissions in database: ${allPermissionsSnapshot.size}`);
    
    console.log('\n✅ Communications permissions fix complete!');
    console.log('\n⚠️  IMPORTANT: Users need to:');
    console.log('   1. Refresh their browser (F5)');
    console.log('   2. Or logout and login again');
    console.log('   3. The Communications menu item should now be visible');
    console.log('   4. The COMMUNICATIONS section should appear in the Permission Matrix');
    
  } catch (error) {
    console.error('❌ Error fixing permissions:', error);
  }
  
  process.exit(0);
}

// Run the fix
fixCommunicationsPermissions();