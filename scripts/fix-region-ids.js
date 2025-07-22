// scripts/fix-region-ids.js
// Script to fix region IDs in existing test data

const admin = require('firebase-admin');
const serviceAccount = require('/workspaces/OPHV2/ophv2_key.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

async function fixRegionIds() {
  console.log('🔧 Fixing region IDs in Communications projects...\n');
  
  try {
    // Mapping from old IDs to new IDs
    const regionMapping = {
      'region1': '1',  // Southeast Louisiana → Region 1 - Orleans
      'region2': '2',  // Capital Area → Region 2 - Baton Rouge  
      'region3': '3',  // South Central → Region 3 - Houma
      'region4': '4',  // Acadiana → Region 4 - Lafayette
      'region5': '5',  // Southwest → Region 5 - Lake Charles
      'region6': '6',  // Central → Region 6 - Alexandria
      'region7': '7',  // Northwest → Region 7 - Shreveport
      'region8': '8',  // Northeast → Region 8 - Monroe
      'region9': '9',  // Northshore → Region 9 - Hammond
    };
    
    // Get all projects
    const projectsSnapshot = await db.collection('comms_projects').get();
    
    if (projectsSnapshot.empty) {
      console.log('No projects found to update');
      return;
    }
    
    console.log(`Found ${projectsSnapshot.size} projects to check\n`);
    
    // Update each project
    const batch = db.batch();
    let updateCount = 0;
    
    projectsSnapshot.forEach(doc => {
      const data = doc.data();
      const oldRegion = data.region;
      
      if (regionMapping[oldRegion]) {
        const newRegion = regionMapping[oldRegion];
        console.log(`📍 Updating project "${data.title}": ${oldRegion} → ${newRegion}`);
        
        batch.update(doc.ref, { region: newRegion });
        updateCount++;
      } else if (oldRegion && !['1','2','3','4','5','6','7','8','9','central'].includes(oldRegion)) {
        console.log(`⚠️  Unknown region "${oldRegion}" in project "${data.title}"`);
      }
    });
    
    if (updateCount > 0) {
      await batch.commit();
      console.log(`\n✅ Updated ${updateCount} projects with correct region IDs`);
    } else {
      console.log('\n✅ All projects already have correct region IDs');
    }
    
    // Also update coordinators if needed
    console.log('\n🔍 Checking coordinators...');
    const coordinatorsSnapshot = await db.collection('comms_coordinators').get();
    
    if (!coordinatorsSnapshot.empty) {
      const coordBatch = db.batch();
      let coordUpdateCount = 0;
      
      coordinatorsSnapshot.forEach(doc => {
        const data = doc.data();
        const regions = data.regions || [];
        const updatedRegions = regions.map(r => regionMapping[r] || r);
        
        if (JSON.stringify(regions) !== JSON.stringify(updatedRegions)) {
          console.log(`👤 Updating coordinator regions: ${regions.join(', ')} → ${updatedRegions.join(', ')}`);
          coordBatch.update(doc.ref, { regions: updatedRegions });
          coordUpdateCount++;
        }
      });
      
      if (coordUpdateCount > 0) {
        await coordBatch.commit();
        console.log(`✅ Updated ${coordUpdateCount} coordinators`);
      }
    }
    
    console.log('\n🎉 Region ID fix complete!');
    console.log('Refresh your dashboard to see the correct region names.');
    
  } catch (error) {
    console.error('❌ Error:', error);
  }
}

fixRegionIds().then(() => {
  console.log('\n✨ Done!');
  process.exit(0);
});