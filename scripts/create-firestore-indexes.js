// create-firestore-indexes.js
// Programmatic Firestore index creation for OPHV2
// Run: node create-firestore-indexes.js

const admin = require('firebase-admin');

// Initialize Firebase Admin
let serviceAccount;
try {
  serviceAccount = require('./ophv2_key.json');
} catch (error) {
  console.error('❌ Service account key not found. Please ensure ophv2_key.json exists.');
  console.log('💡 Download it from Firebase Console > Project Settings > Service Accounts');
  process.exit(1);
}

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: `https://${serviceAccount.project_id}.firebaseio.com`
});

const db = admin.firestore();

// Required indexes for OPHV2 audit log cleanup
const REQUIRED_INDEXES = [
  {
    name: 'audit_logs_compressed_timestamp',
    collectionGroup: 'audit_logs',
    fields: [
      { fieldPath: 'compressed', order: 'ASCENDING' },
      { fieldPath: 'timestamp', order: 'ASCENDING' }
    ],
    description: 'For audit log compression queries'
  },
  {
    name: 'audit_logs_timestamp_action',
    collectionGroup: 'audit_logs',
    fields: [
      { fieldPath: 'timestamp', order: 'DESCENDING' },
      { fieldPath: 'action', order: 'ASCENDING' }
    ],
    description: 'For audit log filtering and sorting'
  },
  {
    name: 'audit_logs_userId_timestamp',
    collectionGroup: 'audit_logs',
    fields: [
      { fieldPath: 'userId', order: 'ASCENDING' },
      { fieldPath: 'timestamp', order: 'DESCENDING' }
    ],
    description: 'For user-specific audit log queries'
  },
  {
    name: 'users_role_createdAt',
    collectionGroup: 'users',
    fields: [
      { fieldPath: 'role', order: 'ASCENDING' },
      { fieldPath: 'createdAt', order: 'DESCENDING' }
    ],
    description: 'For user management queries'
  }
];

/**
 * Test if a specific query works (indicates index exists)
 */
async function testQuery(description, queryFunction) {
  try {
    console.log(`🧪 Testing: ${description}`);
    const snapshot = await queryFunction();
    console.log(`✅ Query successful - found ${snapshot.size} documents`);
    return true;
  } catch (error) {
    if (error.code === 9 || error.message.includes('index')) {
      console.log(`❌ Index missing for: ${description}`);
      console.log(`   Error: ${error.message}`);
      return false;
    } else {
      console.log(`⚠️  Other error in ${description}:`, error.message);
      return false;
    }
  }
}

/**
 * Test all critical queries to see which indexes are missing
 */
async function diagnoseIndexes() {
  console.log('\n🔍 Diagnosing Firestore indexes...\n');
  
  const testCases = [
    {
      description: 'Audit log compression query (compressed + timestamp)',
      query: () => db.collection('audit_logs')
        .where('compressed', '==', false)
        .where('timestamp', '<', new Date())
        .limit(1)
        .get()
    },
    {
      description: 'Audit log timestamp + action query',
      query: () => db.collection('audit_logs')
        .orderBy('timestamp', 'desc')
        .where('action', '==', 'user_created')
        .limit(1)
        .get()
    },
    {
      description: 'User role + creation date query',
      query: () => db.collection('users')
        .where('role', '==', 'pending')
        .orderBy('createdAt', 'desc')
        .limit(1)
        .get()
    },
    {
      description: 'User-specific audit logs',
      query: () => db.collection('audit_logs')
        .where('userId', '==', 'test-user')
        .orderBy('timestamp', 'desc')
        .limit(1)
        .get()
    }
  ];
  
  const results = [];
  for (const testCase of testCases) {
    const success = await testQuery(testCase.description, testCase.query);
    results.push({ ...testCase, success });
  }
  
  const failedTests = results.filter(r => !r.success);
  
  if (failedTests.length === 0) {
    console.log('\n🎉 All indexes appear to be working correctly!');
    return true;
  } else {
    console.log(`\n❌ ${failedTests.length} index(es) missing or building...`);
    return false;
  }
}

/**
 * Generate Firebase Console URLs for manual index creation
 */
function generateConsoleUrls(projectId) {
  console.log('\n🔗 Firebase Console URLs for Manual Index Creation:\n');
  
  const baseUrl = `https://console.firebase.google.com/project/${projectId}/firestore/indexes`;
  
  console.log(`📊 Firestore Indexes Dashboard:`);
  console.log(`   ${baseUrl}\n`);
  
  console.log(`🆕 Create New Index (click to auto-fill):`);
  
  // Generate encoded URLs for each required index
  REQUIRED_INDEXES.forEach((index, i) => {
    console.log(`\n${i + 1}. ${index.description}:`);
    console.log(`   Collection: ${index.collectionGroup}`);
    console.log(`   Fields:`);
    index.fields.forEach(field => {
      console.log(`     - ${field.fieldPath} (${field.order})`);
    });
    
    // Manual creation URL
    console.log(`   🌐 Manual: ${baseUrl}?create_composite`);
  });
  
  console.log(`\n📋 Manual Steps:`);
  console.log(`   1. Go to: ${baseUrl}`);
  console.log(`   2. Click "Create Index"`);
  console.log(`   3. Set Collection Group: audit_logs`);
  console.log(`   4. Add fields as shown above`);
  console.log(`   5. Click "Create"`);
  console.log(`   6. Wait 5-30 minutes for index to build`);
}

/**
 * Create firestore.indexes.json file for Firebase CLI deployment
 */
function createIndexesFile() {
  const indexesConfig = {
    indexes: REQUIRED_INDEXES.map(index => ({
      collectionGroup: index.collectionGroup,
      queryScope: "COLLECTION",
      fields: index.fields.map(field => ({
        fieldPath: field.fieldPath,
        order: field.order
      }))
    })),
    fieldOverrides: []
  };
  
  const fs = require('fs');
  fs.writeFileSync('firestore.indexes.json', JSON.stringify(indexesConfig, null, 2));
  
  console.log('📄 Created firestore.indexes.json');
  console.log('🚀 Deploy with: firebase deploy --only firestore:indexes');
}

/**
 * Monitor index creation progress
 */
async function monitorIndexes(projectId) {
  console.log('\n⏱️  Monitoring index creation progress...');
  console.log('   This will check every 30 seconds for up to 10 minutes');
  console.log('   Press Ctrl+C to stop monitoring\n');
  
  let attempts = 0;
  const maxAttempts = 20; // 10 minutes
  
  const interval = setInterval(async () => {
    attempts++;
    console.log(`🔄 Check ${attempts}/${maxAttempts} - Testing indexes...`);
    
    const allWorking = await diagnoseIndexes();
    
    if (allWorking) {
      console.log('\n🎉 All indexes are now working!');
      clearInterval(interval);
      process.exit(0);
    } else if (attempts >= maxAttempts) {
      console.log('\n⏰ Monitoring timeout reached.');
      console.log('   Indexes may still be building. Check Firebase Console for status.');
      clearInterval(interval);
      process.exit(0);
    }
  }, 30000); // Check every 30 seconds
}

/**
 * Main execution function
 */
async function main() {
  console.log('🔧 OPHV2 Firestore Index Creation Tool');
  console.log('=====================================\n');
  
  const projectId = serviceAccount.project_id;
  console.log(`📋 Project: ${projectId}`);
  console.log(`🗂️  Required indexes: ${REQUIRED_INDEXES.length}\n`);
  
  // Show menu
  console.log('Choose an action:');
  console.log('1. 🧪 Diagnose - Test which indexes are missing');
  console.log('2. 📄 Generate - Create firestore.indexes.json file');
  console.log('3. 🌐 URLs - Show Firebase Console URLs');
  console.log('4. ⏱️  Monitor - Watch for index completion');
  console.log('5. 🔄 Full - Diagnose + Generate + URLs\n');
  
  // Get user input (simulate for Node.js environment)
  const readline = require('readline');
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });
  
  rl.question('Select option [1-5]: ', async (choice) => {
    rl.close();
    
    switch (choice.trim()) {
      case '1':
        await diagnoseIndexes();
        break;
        
      case '2':
        createIndexesFile();
        break;
        
      case '3':
        generateConsoleUrls(projectId);
        break;
        
      case '4':
        await monitorIndexes(projectId);
        break;
        
      case '5':
        await diagnoseIndexes();
        createIndexesFile();
        generateConsoleUrls(projectId);
        break;
        
      default:
        console.log('❌ Invalid option');
        process.exit(1);
    }
    
    if (choice !== '4') {
      console.log('\n✅ Operation completed!');
      process.exit(0);
    }
  });
}

// Handle errors gracefully
process.on('unhandledRejection', (error) => {
  console.error('❌ Unhandled error:', error.message);
  process.exit(1);
});

// Run the script
main().catch(error => {
  console.error('❌ Script failed:', error.message);
  process.exit(1);
});