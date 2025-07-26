const admin = require('firebase-admin');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });

// Initialize admin with service account
const serviceAccount = {
  type: "service_account",
  project_id: process.env.FIREBASE_PROJECT_ID || "ophv2-98d15",
  private_key_id: process.env.FIREBASE_PRIVATE_KEY_ID,
  private_key: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
  client_email: process.env.FIREBASE_CLIENT_EMAIL,
  client_id: process.env.FIREBASE_CLIENT_ID,
  auth_uri: "https://accounts.google.com/o/oauth2/auth",
  token_uri: "https://oauth2.googleapis.com/token",
  auth_provider_x509_cert_url: "https://www.googleapis.com/oauth2/v1/certs",
  client_x509_cert_url: process.env.FIREBASE_CERT_URL
};

// Only initialize if we have the required env vars
if (serviceAccount.private_key && serviceAccount.client_email) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    projectId: process.env.FIREBASE_PROJECT_ID || "ophv2-98d15"
  });
} else {
  console.error('❌ Firebase Admin SDK credentials not found in environment variables');
  console.log('Please ensure FIREBASE_PRIVATE_KEY and FIREBASE_CLIENT_EMAIL are set');
  process.exit(1);
}

const db = admin.firestore();

// Test coordinator emails to remove
const testCoordinatorEmails = [
  'sarah.johnson@la.gov',
  'james.wilson@la.gov',
  'maria.rodriguez@la.gov',
  'michael.chen@la.gov'
];

// Test coordinator names to remove
const testCoordinatorNames = [
  'Sarah Johnson',
  'John Smith',
  'Maria Garcia',
  'Robert Brown',
  'James Wilson',
  'Maria Rodriguez',
  'Michael Chen'
];

async function deleteTestCoordinators() {
  console.log('🔍 Searching for test coordinators to delete...\n');
  
  try {
    const coordinatorsRef = db.collection('comms_coordinators');
    const snapshot = await coordinatorsRef.get();
    
    console.log(`📊 Found ${snapshot.size} total coordinators in database\n`);
    
    const toDelete = [];
    
    snapshot.docs.forEach(doc => {
      const data = doc.data();
      const name = data.displayName || data.name || data.userName || '';
      const email = data.email || data.userEmail || '';
      
      // Check if this is a test coordinator by name or email
      if (testCoordinatorNames.includes(name) || testCoordinatorEmails.includes(email)) {
        toDelete.push({
          id: doc.id,
          name: name,
          email: email
        });
      }
    });
    
    if (toDelete.length === 0) {
      console.log('✅ No test coordinators found in the database\n');
      process.exit(0);
    }
    
    console.log(`🗑️  Found ${toDelete.length} test coordinators to delete:\n`);
    toDelete.forEach(coord => {
      console.log(`   - ${coord.name || 'Unknown'} (${coord.email || 'No email'}) [ID: ${coord.id}]`);
    });
    
    console.log('\n⚠️  Deleting test coordinators in 3 seconds...\n');
    
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    // Delete each coordinator
    let successCount = 0;
    for (const coord of toDelete) {
      try {
        await coordinatorsRef.doc(coord.id).delete();
        console.log(`✅ Deleted: ${coord.name || coord.id}`);
        successCount++;
      } catch (error) {
        console.error(`❌ Failed to delete ${coord.name || coord.id}:`, error.message);
      }
    }
    
    console.log(`\n🎉 Successfully deleted ${successCount} test coordinators!\n`);
    
  } catch (error) {
    console.error('❌ Error:', error);
  }
  
  process.exit(0);
}

// Run the deletion
deleteTestCoordinators();