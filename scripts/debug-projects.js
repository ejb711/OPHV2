// scripts/debug-projects.js
// Run with: node scripts/debug-projects.js

import { initializeApp } from 'firebase/app';
import { getFirestore, collection, query, where, getDocs } from 'firebase/firestore';
import { getAuth, signInWithEmailAndPassword } from 'firebase/auth';
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
const auth = getAuth(app);

async function debugProjects() {
  console.log('\n=== OPHV2 Projects Debug ===\n');
  
  try {
    // 1. Test basic query
    console.log('1. Testing basic projects query...');
    const allProjects = await getDocs(collection(db, 'comms_projects'));
    console.log(`Total projects in collection: ${allProjects.size}`);
    
    // 2. Test with deleted = false
    console.log('\n2. Testing deleted = false query...');
    const notDeletedQuery = query(
      collection(db, 'comms_projects'),
      where('deleted', '==', false)
    );
    const notDeletedDocs = await getDocs(notDeletedQuery);
    console.log(`Projects with deleted = false: ${notDeletedDocs.size}`);
    
    // 3. Show sample project structure
    console.log('\n3. Sample project structure:');
    if (!allProjects.empty) {
      const sample = allProjects.docs[0].data();
      console.log(JSON.stringify({
        id: allProjects.docs[0].id,
        ...sample
      }, null, 2));
    }
    
    // 4. Check field consistency
    console.log('\n4. Field analysis:');
    const fieldAnalysis = {
      hasDeleted: 0,
      hasIsDeleted: 0,
      hasProgress: 0,
      hasVisibility: 0,
      visibilityValues: new Set()
    };
    
    allProjects.docs.forEach(doc => {
      const data = doc.data();
      if ('deleted' in data) fieldAnalysis.hasDeleted++;
      if ('isDeleted' in data) fieldAnalysis.hasIsDeleted++;
      if ('progress' in data) fieldAnalysis.hasProgress++;
      if ('visibility' in data) {
        fieldAnalysis.hasVisibility++;
        fieldAnalysis.visibilityValues.add(data.visibility);
      }
    });
    
    console.log(`Projects with 'deleted' field: ${fieldAnalysis.hasDeleted}`);
    console.log(`Projects with 'isDeleted' field: ${fieldAnalysis.hasIsDeleted}`);
    console.log(`Projects with 'progress' field: ${fieldAnalysis.hasProgress}`);
    console.log(`Projects with 'visibility' field: ${fieldAnalysis.hasVisibility}`);
    console.log(`Visibility values found: ${Array.from(fieldAnalysis.visibilityValues).join(', ')}`);
    
    // 5. Test with authentication (optional)
    if (process.argv[2] && process.argv[3]) {
      console.log('\n5. Testing with authentication...');
      const email = process.argv[2];
      const password = process.argv[3];
      
      try {
        const userCredential = await signInWithEmailAndPassword(auth, email, password);
        console.log(`Signed in as: ${userCredential.user.email}`);
        console.log(`User ID: ${userCredential.user.uid}`);
        
        // Get user document
        const userDoc = await getDocs(query(
          collection(db, 'users'),
          where('__name__', '==', userCredential.user.uid)
        ));
        
        if (!userDoc.empty) {
          const userData = userDoc.docs[0].data();
          console.log(`User role: ${userData.role}`);
          console.log(`Custom permissions: ${userData.customPermissions?.join(', ') || 'none'}`);
        }
      } catch (error) {
        console.error('Auth error:', error.message);
      }
    } else {
      console.log('\n5. To test with auth, run: node scripts/debug-projects.js email@example.com password');
    }
    
  } catch (error) {
    console.error('Error:', error);
  }
  
  process.exit(0);
}

debugProjects();