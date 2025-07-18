// scripts/fix-profile-indexes.js
// Quick fix for OPHV2 Profile Features - Firestore Index Setup
const fs = require('fs');
const path = require('path');

console.log('🔥 OPHV2 Profile Features - Index Fix');
console.log('=====================================\n');

// Index configuration for profile features
const indexConfig = {
  indexes: [
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
        { fieldPath: "action", order: "ASCENDING" },
        { fieldPath: "userId", order: "ASCENDING" },
        { fieldPath: "timestamp", order: "DESCENDING" }
      ]
    }
  ],
  fieldOverrides: []
};

try {
  // Write the index configuration file
  const indexPath = path.join(process.cwd(), 'firestore.indexes.json');
  fs.writeFileSync(indexPath, JSON.stringify(indexConfig, null, 2));
  
  console.log('✅ Created firestore.indexes.json');
  console.log(`📁 Location: ${indexPath}\n`);
  
  console.log('🚀 NEXT STEPS:');
  console.log('==============');
  console.log('Choose ONE of these methods:\n');
  
  console.log('METHOD 1: Firebase CLI (Recommended)');
  console.log('-------------------------------------');
  console.log('firebase deploy --only firestore:indexes\n');
  
  console.log('METHOD 2: One-Click Links (Fastest)');
  console.log('------------------------------------');
  console.log('Activity Index:');
  console.log('https://console.firebase.google.com/v1/r/project/ophv2-98d15/firestore/indexes?create_composite=Ck5wcm9qZWN0cy9vcGh2Mi05OGQxNS9kYXRhYmFzZXMvKGRlZmF1bHQpL2NvbGxlY3Rpb25Hcm91cHMvYXVkaXRfbG9ncy9pbmRleGVzL18QARoKCgZ1c2VySWQQARoNCgl0aW1lc3RhbXAQAhoMCghfX25hbWVfXhAC\n');
  
  console.log('Security Index:');
  console.log('https://console.firebase.google.com/v1/r/project/ophv2-98d15/firestore/indexes?create_composite=Ck5wcm9qZWN0cy9vcGh2Mi05OGQxNS9kYXRhYmFzZXMvKGRlZmF1bHQpL2NvbGxlY3Rpb25Hcm91cHMvYXVkaXRfbG9ncy9pbmRleGVzL18QARoKCgZhY3Rpb24QARoKCgZ1c2VySWQQARoNCgl0aW1lc3RhbXAQAhoMCghfX25hbWVfXhAC\n');
  
  console.log('⏱️  TIMELINE:');
  console.log('=============');
  console.log('• Index creation: 5-15 minutes');
  console.log('• Email notification when ready');
  console.log('• Profile features will work immediately with fallbacks');
  console.log('• Full functionality restored when indexes complete\n');
  
  console.log('🎉 Setup complete! Choose a method above to create your indexes.');
  
} catch (error) {
  console.error('❌ Failed to create firestore.indexes.json:', error.message);
  
  console.log('\n📋 MANUAL CREATION:');
  console.log('===================');
  console.log('Create a file named "firestore.indexes.json" in your project root with:');
  console.log(JSON.stringify(indexConfig, null, 2));
}

process.exit(0);