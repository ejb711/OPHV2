// scripts/quick-cleanup-audit-logs.js - Immediate fix for malformed logs
const admin = require('firebase-admin');

// Initialize Firebase Admin (adjust path as needed)
const serviceAccount = require('/workspaces/OPHV2/ophv2_key.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: `https://${serviceAccount.project_id}.firebaseio.com`
});

const db = admin.firestore();

async function quickCleanup() {
  console.log('🧹 Quick cleanup of malformed audit logs...\n');

  try {
    const auditLogsRef = db.collection('audit_logs');
    const snapshot = await auditLogsRef.orderBy('timestamp', 'desc').limit(200).get();
    
    console.log(`Analyzing ${snapshot.size} recent audit logs...`);

    const batch = db.batch();
    let deleteCount = 0;
    let fixCount = 0;

    snapshot.docs.forEach(doc => {
      const data = doc.data();
      
      // Check for malformed logs
      if (!data.action || data.action === 'unknown_action' || typeof data.action !== 'string') {
        
        // Try to fix if it looks like admin_tab_viewed
        if (data.details && data.details.tab && typeof data.details.tab === 'string') {
          batch.update(doc.ref, {
            action: 'admin_tab_viewed'
          });
          fixCount++;
        } 
        // Delete entries with no recoverable data
        else if (!data.details || Object.keys(data.details).length === 0) {
          batch.delete(doc.ref);
          deleteCount++;
        }
        // Keep entries with details but mark them properly
        else {
          batch.update(doc.ref, {
            action: 'system_activity'
          });
          fixCount++;
        }
      }
    });

    if (deleteCount > 0 || fixCount > 0) {
      await batch.commit();
      console.log(`✅ Cleanup complete:`);
      console.log(`- Fixed: ${fixCount} logs`);
      console.log(`- Deleted: ${deleteCount} empty logs`);
    } else {
      console.log('✅ No malformed logs found!');
    }

  } catch (error) {
    console.error('❌ Error during cleanup:', error);
  }

  process.exit(0);
}

quickCleanup();