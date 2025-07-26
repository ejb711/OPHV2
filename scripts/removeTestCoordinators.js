// Script to remove test communications coordinators
import { initializeApp } from 'firebase/app'
import { getFirestore, collection, query, where, getDocs, deleteDoc, doc } from 'firebase/firestore'
import { getAuth } from 'firebase/auth'
import dotenv from 'dotenv'
import { fileURLToPath } from 'url'
import { dirname, resolve } from 'path'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

// Load environment variables from client directory
dotenv.config({ path: resolve(__dirname, '../client/.env') })

// Firebase configuration
const firebaseConfig = {
  apiKey: process.env.VITE_FIREBASE_API_KEY,
  authDomain: process.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: process.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.VITE_FIREBASE_APP_ID
}

// Initialize Firebase
const app = initializeApp(firebaseConfig)
const db = getFirestore(app)
const auth = getAuth(app)

// Test coordinator names to remove
const testCoordinatorNames = [
  'Sarah Johnson',
  'John Smith',
  'Maria Garcia',
  'Robert Brown'
]

async function removeTestCoordinators() {
  console.log('🔍 Searching for test coordinators to remove...')
  
  try {
    // Get all coordinators
    const coordinatorsRef = collection(db, 'comms_coordinators')
    const snapshot = await getDocs(coordinatorsRef)
    
    console.log(`📊 Found ${snapshot.size} total coordinators`)
    
    const toDelete = []
    
    snapshot.docs.forEach(doc => {
      const data = doc.data()
      const name = data.displayName || data.name || data.userName || ''
      
      // Check if this is a test coordinator
      if (testCoordinatorNames.includes(name)) {
        toDelete.push({
          id: doc.id,
          name: name,
          email: data.email
        })
      }
    })
    
    if (toDelete.length === 0) {
      console.log('✅ No test coordinators found to remove')
      return
    }
    
    console.log(`\n🗑️  Found ${toDelete.length} test coordinators to remove:`)
    toDelete.forEach(coord => {
      console.log(`   - ${coord.name} (${coord.email}) [ID: ${coord.id}]`)
    })
    
    console.log('\n⚠️  This will permanently delete these coordinators.')
    console.log('Press Ctrl+C to cancel, or wait 5 seconds to continue...')
    
    // Wait 5 seconds before proceeding
    await new Promise(resolve => setTimeout(resolve, 5000))
    
    // Delete each coordinator
    for (const coord of toDelete) {
      try {
        await deleteDoc(doc(db, 'comms_coordinators', coord.id))
        console.log(`✅ Deleted ${coord.name}`)
      } catch (error) {
        console.error(`❌ Failed to delete ${coord.name}:`, error.message)
      }
    }
    
    console.log('\n🎉 Test coordinators removal complete!')
    
  } catch (error) {
    console.error('❌ Error:', error)
  }
  
  process.exit(0)
}

// Run the script
removeTestCoordinators()