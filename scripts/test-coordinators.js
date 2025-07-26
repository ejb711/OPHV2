// scripts/test-coordinators.js
// Test script to check coordinator data and fix issues

const { initializeApp } = require('firebase-admin/app')
const { getFirestore } = require('firebase-admin/firestore')

// Initialize Firebase Admin
initializeApp()
const db = getFirestore()

async function testCoordinators() {
  console.log('Testing coordinators data...\n')
  
  try {
    // 1. Check all coordinators in the database
    console.log('1. Fetching all coordinators from comms_coordinators collection:')
    const coordinatorsSnap = await db.collection('comms_coordinators').get()
    
    console.log(`Found ${coordinatorsSnap.size} coordinators:\n`)
    
    const coordinators = []
    coordinatorsSnap.forEach(doc => {
      const data = doc.data()
      coordinators.push({ id: doc.id, ...data })
      
      console.log(`ID: ${doc.id}`)
      console.log(`  displayName: ${data.displayName || 'NOT SET'}`)
      console.log(`  name: ${data.name || 'NOT SET'}`)
      console.log(`  userName: ${data.userName || 'NOT SET'}`)
      console.log(`  email: ${data.email || 'NOT SET'}`)
      console.log(`  userEmail: ${data.userEmail || 'NOT SET'}`)
      console.log(`  userId: ${data.userId || 'NOT SET'}`)
      console.log(`  regions: ${JSON.stringify(data.regions || [])}`)
      console.log(`  primaryRegion: ${data.primaryRegion || 'NOT SET'}`)
      console.log('---')
    })
    
    // 2. Look for test coordinators
    console.log('\n2. Checking for test coordinators:')
    const testCoordinators = coordinators.filter(c => 
      c.id.includes('test') || 
      c.email?.includes('test') ||
      c.name?.includes('test') ||
      c.displayName?.includes('test')
    )
    
    if (testCoordinators.length > 0) {
      console.log(`Found ${testCoordinators.length} test coordinators:`)
      testCoordinators.forEach(c => {
        console.log(`  - ${c.id}: ${c.displayName || c.name || c.email}`)
      })
      
      // Ask if we should delete them
      console.log('\nDeleting test coordinators...')
      for (const coord of testCoordinators) {
        await db.collection('comms_coordinators').doc(coord.id).delete()
        console.log(`  ✅ Deleted ${coord.id}`)
      }
    } else {
      console.log('  ✅ No test coordinators found')
    }
    
    // 3. Fix coordinators with missing displayName
    console.log('\n3. Checking for coordinators with missing displayName:')
    const coordinatorsToFix = coordinators.filter(c => 
      !c.displayName && !testCoordinators.find(t => t.id === c.id)
    )
    
    if (coordinatorsToFix.length > 0) {
      console.log(`Found ${coordinatorsToFix.length} coordinators to fix:`)
      
      for (const coord of coordinatorsToFix) {
        // Try to get user data if we have userId
        let displayName = coord.name || coord.userName || coord.email
        
        if (coord.userId) {
          try {
            const userDoc = await db.collection('users').doc(coord.userId).get()
            if (userDoc.exists) {
              const userData = userDoc.data()
              displayName = userData.displayName || userData.name || displayName
              console.log(`  Found user data for ${coord.id}: ${displayName}`)
            }
          } catch (err) {
            console.log(`  Could not fetch user data for ${coord.id}`)
          }
        }
        
        // Update coordinator with proper displayName
        await db.collection('comms_coordinators').doc(coord.id).update({
          displayName: displayName,
          name: displayName,
          userName: displayName,
          updatedAt: new Date().toISOString()
        })
        
        console.log(`  ✅ Fixed ${coord.id} - set displayName to: ${displayName}`)
      }
    } else {
      console.log('  ✅ All coordinators have displayName set')
    }
    
    // 4. Final check
    console.log('\n4. Final coordinator list:')
    const finalSnap = await db.collection('comms_coordinators').get()
    console.log(`Total coordinators: ${finalSnap.size}`)
    
    finalSnap.forEach(doc => {
      const data = doc.data()
      console.log(`  - ${data.displayName || data.name || doc.id} (${data.email})`)
    })
    
    console.log('\n✅ Coordinator test and cleanup completed!')
    
  } catch (error) {
    console.error('❌ Error:', error)
    process.exit(1)
  }
}

// Run the test
testCoordinators()