// scripts/fix-projects-structure.js
// Run with: node scripts/fix-projects-structure.js

import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs, updateDoc, doc } from 'firebase/firestore';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables
dotenv.config({ path: join(__dirname, '../client/.env') });

// Initialize Firebase
const firebaseConfig = {
  apiKey: process.env.VITE_FIREBASE_API_KEY,
  authDomain: process.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: process.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.VITE_FIREBASE_APP_ID
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function fixProjectsStructure() {
  console.log('\n=== Fixing OPHV2 Projects Structure ===\n');
  
  try {
    // Get all projects
    const projectsSnapshot = await getDocs(collection(db, 'comms_projects'));
    console.log(`Found ${projectsSnapshot.size} projects to check`);
    
    let updated = 0;
    
    for (const projectDoc of projectsSnapshot.docs) {
      const data = projectDoc.data();
      const updates = {};
      
      // Check and add missing fields
      if (!('progress' in data)) {
        updates.progress = 0;
        console.log(`Adding progress field to project ${projectDoc.id}`);
      }
      
      if (!('deleted' in data) && !('isDeleted' in data)) {
        updates.deleted = false;
        console.log(`Adding deleted field to project ${projectDoc.id}`);
      }
      
      // If project has isDeleted but not deleted, migrate it
      if ('isDeleted' in data && !('deleted' in data)) {
        updates.deleted = data.isDeleted;
        console.log(`Migrating isDeleted to deleted for project ${projectDoc.id}`);
      }
      
      // Ensure visibility is set
      if (!('visibility' in data)) {
        updates.visibility = 'owner'; // Default to owner visibility
        console.log(`Adding visibility field to project ${projectDoc.id}`);
      }
      
      // Update if there are changes
      if (Object.keys(updates).length > 0) {
        await updateDoc(doc(db, 'comms_projects', projectDoc.id), updates);
        updated++;
        console.log(`Updated project ${projectDoc.id}`);
      }
    }
    
    console.log(`\nFixed ${updated} projects`);
    
    // Verify the fix
    console.log('\nVerifying structure...');
    const verifyQuery = await getDocs(collection(db, 'comms_projects'));
    const fieldCounts = {
      total: verifyQuery.size,
      hasDeleted: 0,
      hasProgress: 0,
      hasVisibility: 0
    };
    
    verifyQuery.docs.forEach(doc => {
      const data = doc.data();
      if ('deleted' in data) fieldCounts.hasDeleted++;
      if ('progress' in data) fieldCounts.hasProgress++;
      if ('visibility' in data) fieldCounts.hasVisibility++;
    });
    
    console.log('\nField counts after fix:');
    console.log(`Total projects: ${fieldCounts.total}`);
    console.log(`Projects with 'deleted' field: ${fieldCounts.hasDeleted}`);
    console.log(`Projects with 'progress' field: ${fieldCounts.hasProgress}`);
    console.log(`Projects with 'visibility' field: ${fieldCounts.hasVisibility}`);
    
  } catch (error) {
    console.error('Error:', error);
  }
  
  process.exit(0);
}

// Run the fix
fixProjectsStructure();