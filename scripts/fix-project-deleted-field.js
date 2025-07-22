// scripts/fix-project-deleted-field.js
// Script to add deleted: false to all comms_projects documents

const admin = require('firebase-admin');

// Initialize Firebase Admin
const serviceAccount = require('/workspaces/OPHV2/ophv2_key.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

async function fixDeletedField() {
  console.log('🔧 Adding deleted field to all projects...\n');
  
  try {
    // Get all projects
    const snapshot = await db.collection('comms_projects').get();
    
    if (snapshot.empty) {
      console.log('❌ No projects found in comms_projects collection');
      return;
    }
    
    console.log(`📊 Found ${snapshot.size} projects to update\n`);
    
    // Create batch for efficient updates
    const batch = db.batch();
    let updateCount = 0;
    
    snapshot.forEach((doc) => {
      const data = doc.data();
      
      // Only update if deleted field is missing
      if (data.deleted === undefined) {
        batch.update(doc.ref, { 
          deleted: false,
          updatedAt: admin.firestore.FieldValue.serverTimestamp()
        });
        updateCount++;
        console.log(`  ✓ Updating project: ${data.title || doc.id}`);
      } else {
        console.log(`  - Skipping project: ${data.title || doc.id} (already has deleted field)`);
      }
    });
    
    if (updateCount > 0) {
      // Commit the batch
      await batch.commit();
      console.log(`\n✅ Successfully updated ${updateCount} projects with deleted: false`);
    } else {
      console.log('\n✅ All projects already have the deleted field');
    }
    
    // Verify the update
    console.log('\n🔍 Verifying updates...');
    const verifySnapshot = await db.collection('comms_projects')
      .where('deleted', '==', false)
      .get();
    
    console.log(`✅ ${verifySnapshot.size} projects now have deleted: false`);
    
  } catch (error) {
    console.error('❌ Error updating projects:', error);
  }
}

// Run the fix
fixDeletedField()
  .then(() => {
    console.log('\n✨ Script completed');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Script failed:', error);
    process.exit(1);
  });