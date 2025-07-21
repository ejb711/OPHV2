// scripts/run-system-init.js
// Script to run the system initialization function

const admin = require('firebase-admin');
const serviceAccount = require('/workspaces/OPHV2/ophv2_key.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: `https://ophv2-98d15.firebaseio.com`
});

async function runSystemInitialization() {
  console.log('🚀 Running system initialization to update permissions...\n');
  
  try {
    // Get a reference to the cloud function
    const functions = admin.functions();
    
    // Call the initializeSystemData function
    // Note: This uses the Admin SDK to invoke the function directly
    const result = await admin.firestore()
      .collection('_cloud_functions_')
      .doc('initializeSystemData')
      .set({ trigger: Date.now() });
    
    console.log('✅ System initialization triggered!');
    console.log('\nNote: The cloud function is running in the background.');
    console.log('Check your Firebase Functions logs for detailed results.\n');
    
    // Alternative: Direct database update if cloud function isn't available
    console.log('Running direct database update as backup...\n');
    await directDatabaseUpdate();
    
  } catch (error) {
    console.error('❌ Error running system initialization:', error);
    console.log('\nTrying direct database update instead...\n');
    await directDatabaseUpdate();
  }
}

async function directDatabaseUpdate() {
  const db = admin.firestore();
  
  // Update each role with the new Communications permissions
  const updates = {
    admin: [
      'manage_comms', 'view_comms', 'create_comms_projects', 
      'edit_comms_projects', 'delete_comms_projects',
      'manage_comms_coordinators', 'view_all_regions', 
      'manage_comms_templates', 'export_comms_data', 
      'approve_comms_projects'
    ],
    user: ['view_comms', 'create_comms_projects', 'edit_comms_projects'],
    viewer: ['view_comms']
  };
  
  for (const [roleId, newPermissions] of Object.entries(updates)) {
    try {
      const roleRef = db.collection('roles').doc(roleId);
      const roleDoc = await roleRef.get();
      
      if (!roleDoc.exists) {
        console.log(`❌ Role '${roleId}' not found`);
        continue;
      }
      
      const currentPermissions = roleDoc.data().permissions || [];
      const permissionsToAdd = newPermissions.filter(p => !currentPermissions.includes(p));
      
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
  
  console.log('\n✅ Direct database update complete!');
}

// Run the initialization
runSystemInitialization()
  .then(() => {
    console.log('\n📝 Users need to refresh their browser to see the Communications menu.');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Fatal error:', error);
    process.exit(1);
  });