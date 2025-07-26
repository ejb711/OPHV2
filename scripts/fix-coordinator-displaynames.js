// scripts/fix-coordinator-displaynames.js
// Fix coordinator documents to ensure they have proper displayName

const admin = require('firebase-admin')
const { initializeApp } = require('firebase-admin/app')
const { getFirestore } = require('firebase-admin/firestore')

// Initialize Firebase Admin with emulator settings
process.env.FIRESTORE_EMULATOR_HOST = 'localhost:8080'
initializeApp()
const db = getFirestore()

async function fixCoordinatorDisplayNames() {
  console.log('Fixing coordinator display names...\n')
  
  try {
    // 1. Fetch all coordinators
    const coordinatorsSnap = await db.collection('comms_coordinators').get()
    console.log(`Found ${coordinatorsSnap.size} coordinators\n`)
    
    let fixedCount = 0
    
    for (const doc of coordinatorsSnap.docs) {
      const data = doc.data()
      const coordinatorId = doc.id
      
      console.log(`Checking coordinator ${coordinatorId}:`)
      console.log(`  Current displayName: ${data.displayName || 'NOT SET'}`)
      console.log(`  Current name: ${data.name || 'NOT SET'}`)
      console.log(`  Current email: ${data.email || 'NOT SET'}`)
      console.log(`  userId: ${data.userId || 'NOT SET'}`)
      
      // If coordinator has a userId but no displayName, fetch from users collection
      if (data.userId && !data.displayName) {
        try {
          const userDoc = await db.collection('users').doc(data.userId).get()
          
          if (userDoc.exists) {
            const userData = userDoc.data()
            const displayName = userData.displayName || userData.name || userData.email?.split('@')[0]
            
            console.log(`  Found user data - displayName: ${displayName}`)
            
            // Update coordinator document
            await db.collection('comms_coordinators').doc(coordinatorId).update({
              displayName: displayName,
              name: displayName,
              userName: displayName,
              email: userData.email || data.email,
              userEmail: userData.email || data.email,
              updatedAt: new Date().toISOString()
            })
            
            console.log(`  ✅ Updated coordinator with displayName: ${displayName}`)
            fixedCount++
          } else {
            console.log(`  ⚠️ User document not found for userId: ${data.userId}`)
          }
        } catch (err) {
          console.error(`  ❌ Error fetching user data:`, err.message)
        }
      } else if (data.displayName) {
        console.log(`  ✅ Already has displayName`)
      }
      
      console.log('---')
    }
    
    console.log(`\n✅ Fixed ${fixedCount} coordinator documents`)
    console.log('\nFinal coordinator list:')
    
    // Re-fetch to show updated data
    const finalSnap = await db.collection('comms_coordinators').get()
    finalSnap.forEach(doc => {
      const data = doc.data()
      console.log(`  - ${data.displayName || 'NO NAME'} (${data.email}) [ID: ${doc.id}]`)
    })
    
  } catch (error) {
    console.error('❌ Error:', error)
    process.exit(1)
  }
}

// Run the fix
fixCoordinatorDisplayNames()