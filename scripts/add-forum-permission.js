// scripts/add-forum-permission.js
// Script to add the post_comms_messages permission and assign it to roles

const admin = require('firebase-admin');
const path = require('path');

// Initialize Firebase Admin
const serviceAccount = require(path.join(__dirname, '../ophv2_key.json'));
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

async function addForumPermission() {
  console.log('🔧 Adding forum posting permission...\n');
  
  try {
    // 1. Add the permission to the permissions collection
    const permissionData = {
      id: 'post_comms_messages',
      name: 'Post Communications Messages',
      description: 'Post messages in project discussions',
      category: 'communications',
      isSystemPermission: true,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    };
    
    await db.collection('permissions').doc('post_comms_messages').set(permissionData, { merge: true });
    console.log('✅ Added post_comms_messages permission to database\n');
    
    // 2. Get all roles to update
    const rolesSnapshot = await db.collection('roles').get();
    const batch = db.batch();
    
    console.log('📝 Updating roles with new permission...\n');
    
    for (const roleDoc of rolesSnapshot.docs) {
      const role = roleDoc.data();
      const roleId = roleDoc.id;
      const currentPermissions = role.permissions || [];
      
      // Determine if this role should have the permission
      let shouldHavePermission = false;
      let reason = '';
      
      switch(roleId) {
        case 'owner':
        case 'admin':
          shouldHavePermission = true;
          reason = 'Full system access';
          break;
        case 'user':
          // User role gets posting permission
          shouldHavePermission = true;
          reason = 'Standard user participation';
          break;
        case 'viewer':
          // Viewer role gets posting permission too (you can change this if needed)
          shouldHavePermission = true;
          reason = 'Can participate in discussions';
          break;
        case 'pending':
          // Pending users don't get posting permission
          shouldHavePermission = false;
          reason = 'Awaiting approval';
          break;
        default:
          // For custom roles, add it if they have view_comms
          if (currentPermissions.includes('view_comms')) {
            shouldHavePermission = true;
            reason = 'Has view_comms permission';
          }
      }
      
      // Update the role if needed
      if (shouldHavePermission && !currentPermissions.includes('post_comms_messages')) {
        const updatedPermissions = [...currentPermissions, 'post_comms_messages'];
        batch.update(roleDoc.ref, { 
          permissions: updatedPermissions,
          updatedAt: admin.firestore.FieldValue.serverTimestamp()
        });
        console.log(`✅ ${role.name} (${roleId}): Added permission - ${reason}`);
      } else if (!shouldHavePermission && currentPermissions.includes('post_comms_messages')) {
        const updatedPermissions = currentPermissions.filter(p => p !== 'post_comms_messages');
        batch.update(roleDoc.ref, { 
          permissions: updatedPermissions,
          updatedAt: admin.firestore.FieldValue.serverTimestamp()
        });
        console.log(`❌ ${role.name} (${roleId}): Removed permission - ${reason}`);
      } else {
        console.log(`➖ ${role.name} (${roleId}): No change needed - ${reason}`);
      }
    }
    
    // 3. Commit all role updates
    await batch.commit();
    console.log('\n✅ All roles updated successfully!\n');
    
    // 4. Show summary
    console.log('📊 Summary:');
    console.log('- Permission added: post_comms_messages');
    console.log('- Roles with permission: Owner, Admin, User, Viewer');
    console.log('- Roles without permission: Pending');
    console.log('\n🎉 Forum posting permission setup complete!');
    console.log('Users can now post messages in project discussions.');
    
  } catch (error) {
    console.error('❌ Error adding forum permission:', error);
  } finally {
    process.exit();
  }
}

// Run the script
addForumPermission();