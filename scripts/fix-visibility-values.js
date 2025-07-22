#!/usr/bin/env node
// scripts/fix-visibility-values.js
// Fix non-standard visibility values in test data
// Run from client directory: node ../scripts/fix-visibility-values.js

const { initializeApp } = require('firebase/app')
const { 
  getFirestore, 
  collection, 
  getDocs, 
  updateDoc, 
  doc 
} = require('firebase/firestore')
const dotenv = require('dotenv')
const path = require('path')

// Load environment variables from client directory
dotenv.config({ path: path.join(__dirname, '../client/.env') })

// Initialize Firebase
const firebaseConfig = {
  apiKey: process.env.VITE_FIREBASE_API_KEY,
  authDomain: process.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: process.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.VITE_FIREBASE_APP_ID
}

if (!firebaseConfig.apiKey) {
  console.error('Error: Firebase environment variables not found!')
  console.error('Make sure you have a .env file in the client directory')
  process.exit(1)
}

const app = initializeApp(firebaseConfig)
const db = getFirestore(app)

// Mapping of non-standard values to standard values
const visibilityMapping = {
  'private': 'creator',
  'team': 'coordinator',
  'internal': 'admin',
  'everyone': 'public'
}

async function fixVisibilityValues() {
  console.log('Fixing visibility values in comms_projects...')
  console.log('Project:', firebaseConfig.projectId)
  console.log('')
  
  try {
    // Get all projects
    const projectsRef = collection(db, 'comms_projects')
    const snapshot = await getDocs(projectsRef)
    
    let fixedCount = 0
    
    for (const docSnap of snapshot.docs) {
      const data = docSnap.data()
      const currentVisibility = data.visibility
      
      // Check if visibility needs fixing
      if (currentVisibility && visibilityMapping[currentVisibility]) {
        const newVisibility = visibilityMapping[currentVisibility]
        
        console.log(`Fixing project "${data.title}":`)
        console.log(`  - Current visibility: ${currentVisibility}`)
        console.log(`  - New visibility: ${newVisibility}`)
        
        await updateDoc(doc(db, 'comms_projects', docSnap.id), {
          visibility: newVisibility
        })
        
        fixedCount++
      }
    }
    
    console.log(`\n✅ Fixed ${fixedCount} projects`)
    console.log(`📊 Total projects checked: ${snapshot.size}`)
    
  } catch (error) {
    console.error('Error fixing visibility values:', error)
    process.exit(1)
  }
}

// Run the fix
fixVisibilityValues()
  .then(() => {
    console.log('\nVisibility fix complete!')
    process.exit(0)
  })
  .catch(error => {
    console.error('Script failed:', error)
    process.exit(1)
  })