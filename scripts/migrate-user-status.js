#!/usr/bin/env node
// scripts/migrate-user-status.js
// One-time migration script to add status field to existing users

const admin = require('firebase-admin')
const fs = require('fs')
const path = require('path')

console.log('🔧 OPHV2 User Status Migration Script')
console.log('=====================================\n')

// Initialize Firebase Admin
let serviceAccount
try {
  // Try multiple locations for service account key
  const keyPaths = [
    './ophv2_key.json',
    '../ophv2_key.json', 
    './functions/ophv2_key.json',
    './scripts/ophv2_key.json'
  ]
  
  for (const keyPath of keyPaths) {
    if (fs.existsSync(keyPath)) {
      serviceAccount = require(path.resolve(keyPath))
      console.log(`✅ Found service account key: ${keyPath}`)
      break
    }
  }
  
  if (!serviceAccount) {
    throw new Error('Service account key not found')
  }
} catch (error) {
  console.error('❌ Service account key not found. Please ensure ophv2_key.json exists.')
  console.log('💡 Download it from Firebase Console > Project Settings > Service Accounts')
  console.log('   Place it in: ./scripts/ophv2_key.json or ./ophv2_key.json')
  process.exit(1)
}

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: `https://${serviceAccount.project_id}.firebaseio.com`
})

const db = admin.firestore()

/**
 * Analyze current user data to understand what needs migration
 */
async function analyzeUsers() {
  console.log('🔍 Analyzing current user data...\n')
  
  try {
    const usersSnapshot = await db.collection('users').get()
    
    const stats = {
      total: 0,
      withStatus: 0,
      withoutStatus: 0,
      byStatus: {},
      byRole: {},
      needsMigration: []
    }
    
    usersSnapshot.docs.forEach(doc => {
      const data = doc.data()
      stats.total++
      
      if (data.status) {
        stats.withStatus++
        stats.byStatus[data.status] = (stats.byStatus[data.status] || 0) + 1
      } else {
        stats.withoutStatus++
        stats.needsMigration.push({
          id: doc.id,
          email: data.email,
          role: data.role,
          createdAt: data.createdAt
        })
      }
      
      stats.byRole[data.role] = (stats.byRole[data.role] || 0) + 1
    })
    
    console.log('📊 Analysis Results:')
    console.log(`   Total users: ${stats.total}`)
    console.log(`   Users with status field: ${stats.withStatus}`)
    console.log(`   Users without status field: ${stats.withoutStatus}`)
    
    if (Object.keys(stats.byStatus).length > 0) {
      console.log('\n📈 Current status distribution:')
      Object.entries(stats.byStatus).forEach(([status, count]) => {
        console.log(`   ${status}: ${count}`)
      })
    }
    
    console.log('\n👥 Role distribution:')
    Object.entries(stats.byRole).forEach(([role, count]) => {
      console.log(`   ${role}: ${count}`)
    })
    
    if (stats.needsMigration.length > 0) {
      console.log('\n⚠️  Users needing migration:')
      stats.needsMigration.forEach(user => {
        console.log(`   ${user.email} (${user.role})`)
      })
    }
    
    return stats
  } catch (error) {
    console.error('❌ Error analyzing users:', error)
    throw error
  }
}

/**
 * Migrate users without status field
 */
async function migrateUsers(dryRun = true) {
  const mode = dryRun ? 'DRY RUN' : 'LIVE MIGRATION'
  console.log(`\n🚀 Starting migration (${mode})...\n`)
  
  try {
    const usersSnapshot = await db.collection('users').where('status', '==', null).get()
    
    if (usersSnapshot.empty) {
      console.log('✅ No users need migration - all users already have status field')
      return { migrated: 0, errors: 0 }
    }
    
    const batch = db.batch()
    const results = { migrated: 0, errors: 0 }
    
    console.log(`Found ${usersSnapshot.docs.length} users to migrate:`)
    
    for (const doc of usersSnapshot.docs) {
      const data = doc.data()
      const userRef = db.collection('users').doc(doc.id)
      
      // Determine appropriate status based on role
      let status = 'active'
      if (data.role === 'pending') {
        status = 'pending'
      } else if (data.role === 'owner' || data.role === 'admin' || data.role === 'user' || data.role === 'viewer') {
        status = 'active'
      }
      
      console.log(`   ${data.email} (${data.role}) -> status: ${status}`)
      
      if (!dryRun) {
        try {
          batch.update(userRef, {
            status: status,
            updatedAt: admin.firestore.FieldValue.serverTimestamp(),
            migratedAt: admin.firestore.FieldValue.serverTimestamp(),
            migrationNote: 'Added status field via migration script'
          })
          results.migrated++
        } catch (error) {
          console.error(`   ❌ Error preparing update for ${data.email}:`, error.message)
          results.errors++
        }
      } else {
        results.migrated++
      }
    }
    
    if (!dryRun && results.migrated > 0) {
      console.log('\n💾 Committing batch update...')
      await batch.commit()
      console.log('✅ Batch update completed successfully')
    }
    
    return results
  } catch (error) {
    console.error('❌ Error during migration:', error)
    throw error
  }
}

/**
 * Verify migration results
 */
async function verifyMigration() {
  console.log('\n🔍 Verifying migration results...\n')
  
  try {
    const stats = await analyzeUsers()
    
    if (stats.withoutStatus === 0) {
      console.log('✅ Migration verification successful!')
      console.log('   All users now have a status field')
      return true
    } else {
      console.log('❌ Migration verification failed!')
      console.log(`   ${stats.withoutStatus} users still missing status field`)
      return false
    }
  } catch (error) {
    console.error('❌ Error verifying migration:', error)
    return false
  }
}

/**
 * Test queries to ensure they work after migration
 */
async function testQueries() {
  console.log('\n🧪 Testing user queries...\n')
  
  const tests = [
    {
      name: 'Load all active users',
      query: () => db.collection('users').where('status', '==', 'active').limit(5).get()
    },
    {
      name: 'Load pending users',
      query: () => db.collection('users').where('status', '==', 'pending').limit(5).get()
    },
    {
      name: 'Load users by role and status',
      query: () => db.collection('users')
        .where('role', '==', 'user')
        .where('status', '==', 'active')
        .limit(5)
        .get()
    },
    {
      name: 'Load users with OR query (admin panel)',
      query: () => db.collection('users')
        .where('status', 'in', ['active', 'pending', 'suspended'])
        .orderBy('createdAt', 'desc')
        .limit(5)
        .get()
    }
  ]
  
  let passed = 0
  let failed = 0
  
  for (const test of tests) {
    try {
      const snapshot = await test.query()
      console.log(`✅ ${test.name}: ${snapshot.size} users found`)
      passed++
    } catch (error) {
      console.log(`❌ ${test.name}: ${error.message}`)
      failed++
    }
  }
  
  console.log(`\n📊 Query test results: ${passed} passed, ${failed} failed`)
  return failed === 0
}

/**
 * Main script execution
 */
async function main() {
  try {
    // Step 1: Analyze current state
    const stats = await analyzeUsers()
    
    if (stats.withoutStatus === 0) {
      console.log('\n✅ All users already have status field. No migration needed.')
      
      // Still run query tests to make sure everything works
      await testQueries()
      return
    }
    
    // Step 2: Show what will happen
    console.log('\n📋 Migration Plan:')
    console.log(`   Will add status field to ${stats.withoutStatus} users`)
    console.log('   Status assignment rules:')
    console.log('     - role: "pending" -> status: "pending"')
    console.log('     - role: "owner", "admin", "user", "viewer" -> status: "active"')
    
    // Step 3: Dry run
    console.log('\n🔄 Running dry run to preview changes...')
    const dryRunResults = await migrateUsers(true)
    
    if (dryRunResults.errors > 0) {
      console.log(`\n❌ Dry run found ${dryRunResults.errors} errors. Aborting.`)
      return
    }
    
    // Step 4: Confirm with user
    console.log(`\n⚠️  Ready to migrate ${dryRunResults.migrated} users.`)
    console.log('   This will add the "status" field to users who don\'t have it.')
    console.log('   This is safe and will not overwrite existing data.')
    
    const readline = require('readline')
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout
    })
    
    const answer = await new Promise(resolve => {
      rl.question('\n❓ Proceed with migration? (yes/no): ', resolve)
    })
    rl.close()
    
    if (answer.toLowerCase() !== 'yes' && answer.toLowerCase() !== 'y') {
      console.log('\n❌ Migration cancelled by user.')
      return
    }
    
    // Step 5: Execute migration
    console.log('\n🚀 Executing migration...')
    const migrationResults = await migrateUsers(false)
    
    console.log('\n📊 Migration Results:')
    console.log(`   Successfully migrated: ${migrationResults.migrated}`)
    console.log(`   Errors: ${migrationResults.errors}`)
    
    if (migrationResults.errors > 0) {
      console.log('\n⚠️  Some users failed to migrate. Check logs above.')
    }
    
    // Step 6: Verify results
    await verifyMigration()
    
    // Step 7: Test queries
    await testQueries()
    
    console.log('\n🎉 Migration completed successfully!')
    console.log('   Users should now appear in the admin panel.')
    
  } catch (error) {
    console.error('\n💥 Migration failed:', error)
    process.exit(1)
  }
}

// Handle command line arguments
const args = process.argv.slice(2)
if (args.includes('--help') || args.includes('-h')) {
  console.log('Usage: node migrate-user-status.js [options]')
  console.log('')
  console.log('Options:')
  console.log('  --analyze-only    Only analyze current data, do not migrate')
  console.log('  --test-queries    Only test queries, do not migrate')
  console.log('  --help, -h        Show this help message')
  console.log('')
  console.log('This script adds a "status" field to users who don\'t have one.')
  console.log('This fixes the issue where users don\'t appear in the admin panel.')
  process.exit(0)
}

if (args.includes('--analyze-only')) {
  analyzeUsers().then(() => process.exit(0)).catch(err => {
    console.error(err)
    process.exit(1)
  })
} else if (args.includes('--test-queries')) {
  testQueries().then(() => process.exit(0)).catch(err => {
    console.error(err)
    process.exit(1)
  })
} else {
  main()
}