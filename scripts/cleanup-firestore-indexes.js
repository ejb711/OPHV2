// scripts/cleanup-firestore-indexes.js
// Firestore Index Cleanup Utility for OPHV2
// This script helps identify and clean up redundant indexes

const admin = require('firebase-admin');
const fs = require('fs');
const path = require('path');

// Initialize Firebase Admin
let serviceAccount;
try {
  serviceAccount = require('../ophv2_key.json');
} catch (error) {
  console.error('❌ Service account key not found.');
  console.log('   Please ensure ophv2_key.json exists in the parent directory.');
  process.exit(1);
}

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: `https://${serviceAccount.project_id}.firebaseio.com`
});

const db = admin.firestore();

// Analyze current query patterns
async function analyzeQueryPatterns() {
  console.log('🔍 Analyzing query patterns in OPHV2...\n');
  
  const queryPatterns = {
    users: new Set(),
    audit_logs: new Set()
  };
  
  // Test actual queries used in the application
  const testQueries = [
    {
      name: 'Audit log compression (REQUIRED)',
      collection: 'audit_logs',
      pattern: 'compressed + timestamp',
      test: () => db.collection('audit_logs')
        .where('compressed', '==', false)
        .where('timestamp', '<', new Date())
        .limit(1)
        .get()
    },
    {
      name: 'User-specific audit logs (REQUIRED)',
      collection: 'audit_logs',
      pattern: 'userId + timestamp',
      test: () => db.collection('audit_logs')
        .where('userId', '==', 'test-user')
        .orderBy('timestamp', 'desc')
        .limit(1)
        .get()
    },
    {
      name: 'Retention tier queries (REQUIRED)',
      collection: 'audit_logs',
      pattern: 'retentionTier + timestamp',
      test: () => db.collection('audit_logs')
        .where('retentionTier', '==', 'full')
        .where('timestamp', '<', new Date())
        .limit(1)
        .get()
    }
  ];
  
  // Test each query
  for (const query of testQueries) {
    try {
      await query.test();
      console.log(`✅ ${query.name} - Index exists and working`);
      queryPatterns[query.collection].add(query.pattern);
    } catch (error) {
      if (error.code === 9 || error.message.includes('index')) {
        console.log(`❌ ${query.name} - Index missing`);
      } else {
        console.log(`⚠️  ${query.name} - Other error: ${error.message}`);
      }
    }
  }
  
  return queryPatterns;
}

// Generate optimized index configuration
function generateOptimizedIndexes() {
  return {
    indexes: [
      // Essential audit log indexes
      {
        collectionGroup: "audit_logs",
        queryScope: "COLLECTION",
        fields: [
          { fieldPath: "compressed", order: "ASCENDING" },
          { fieldPath: "timestamp", order: "ASCENDING" }
        ]
      },
      {
        collectionGroup: "audit_logs",
        queryScope: "COLLECTION",
        fields: [
          { fieldPath: "userId", order: "ASCENDING" },
          { fieldPath: "timestamp", order: "DESCENDING" }
        ]
      },
      {
        collectionGroup: "audit_logs",
        queryScope: "COLLECTION",
        fields: [
          { fieldPath: "retentionTier", order: "ASCENDING" },
          { fieldPath: "timestamp", order: "ASCENDING" }
        ]
      }
      // Users collection doesn't need composite indexes since
      // UserManagement.vue does client-side filtering
    ],
    fieldOverrides: []
  };
}

// Compare current and optimized indexes
async function compareIndexes() {
  console.log('\n📊 Comparing current vs optimized indexes...\n');
  
  // Read current indexes
  let currentIndexes;
  try {
    const indexPath = path.join(process.cwd(), 'firestore.indexes.json');
    currentIndexes = JSON.parse(fs.readFileSync(indexPath, 'utf8'));
  } catch (error) {
    console.error('❌ Could not read firestore.indexes.json');
    return;
  }
  
  const optimizedIndexes = generateOptimizedIndexes();
  
  console.log(`Current indexes: ${currentIndexes.indexes.length}`);
  console.log(`Optimized indexes: ${optimizedIndexes.indexes.length}`);
  console.log(`Indexes to remove: ${currentIndexes.indexes.length - optimizedIndexes.indexes.length}`);
  
  // Show indexes that will be removed
  console.log('\n🗑️  Indexes to remove:');
  currentIndexes.indexes.forEach(index => {
    const isNeeded = optimizedIndexes.indexes.some(opt => 
      opt.collectionGroup === index.collectionGroup &&
      JSON.stringify(opt.fields) === JSON.stringify(index.fields)
    );
    
    if (!isNeeded) {
      console.log(`   - ${index.collectionGroup}: ${index.fields.map(f => f.fieldPath).join(' + ')}`);
    }
  });
}

// Create backup and update indexes
async function updateIndexConfiguration() {
  const indexPath = path.join(process.cwd(), 'firestore.indexes.json');
  const backupPath = path.join(process.cwd(), 'firestore.indexes.backup.json');
  
  // Create backup
  try {
    const currentContent = fs.readFileSync(indexPath, 'utf8');
    fs.writeFileSync(backupPath, currentContent);
    console.log('\n✅ Created backup: firestore.indexes.backup.json');
  } catch (error) {
    console.error('❌ Failed to create backup:', error.message);
    return;
  }
  
  // Write optimized configuration
  const optimizedIndexes = generateOptimizedIndexes();
  try {
    fs.writeFileSync(indexPath, JSON.stringify(optimizedIndexes, null, 2));
    console.log('✅ Updated firestore.indexes.json with optimized configuration');
  } catch (error) {
    console.error('❌ Failed to update indexes:', error.message);
  }
}

// Main execution
async function main() {
  console.log('🧹 OPHV2 Firestore Index Cleanup\n');
  
  // Step 1: Analyze current usage
  await analyzeQueryPatterns();
  
  // Step 2: Compare indexes
  await compareIndexes();
  
  // Step 3: Ask for confirmation
  console.log('\n⚠️  Ready to update firestore.indexes.json');
  console.log('   This will:');
  console.log('   1. Create a backup of current indexes');
  console.log('   2. Update to optimized index configuration');
  console.log('   3. Remove unnecessary indexes for users collection');
  console.log('\n   After updating, run: firebase deploy --only firestore:indexes');
  console.log('\n   Continue? (y/n): ');
  
  // Handle user input
  process.stdin.resume();
  process.stdin.on('data', async (data) => {
    const answer = data.toString().trim().toLowerCase();
    
    if (answer === 'y' || answer === 'yes') {
      await updateIndexConfiguration();
      
      console.log('\n📋 Next steps:');
      console.log('   1. Deploy the new indexes:');
      console.log('      firebase deploy --only firestore:indexes');
      console.log('   2. Monitor index build progress in Firebase Console');
      console.log('   3. Old indexes will be automatically removed');
      console.log('\n✨ Index cleanup complete!');
    } else {
      console.log('\n❌ Index cleanup cancelled');
    }
    
    process.exit(0);
  });
}

// Run the script
main().catch(error => {
  console.error('❌ Script error:', error);
  process.exit(1);
});