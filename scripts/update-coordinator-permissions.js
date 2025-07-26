// scripts/update-coordinator-permissions.js
// Updates permissions to ensure only admin and owner can manage coordinators

const { initializeApp } = require('firebase-admin/app')
const { getFirestore } = require('firebase-admin/firestore')
const { DEFAULT_ROLES } = require('../functions/src/config/defaults')

// Initialize Firebase Admin
initializeApp()
const db = getFirestore()

async function updateCoordinatorPermissions() {
  console.log('Starting coordinator permissions update...')
  
  try {
    // Update admin role to ensure it has manage_comms_coordinators
    const adminRole = DEFAULT_ROLES.find(r => r.id === 'admin')
    if (adminRole) {
      const adminRef = db.collection('roles').doc('admin')
      const adminDoc = await adminRef.get()
      
      if (adminDoc.exists) {
        const currentData = adminDoc.data()
        const currentPermissions = currentData.permissions || []
        
        // Ensure manage_comms_coordinators is in the permissions
        if (!currentPermissions.includes('manage_comms_coordinators')) {
          currentPermissions.push('manage_comms_coordinators')
          await adminRef.update({
            permissions: currentPermissions,
            updatedAt: new Date().toISOString()
          })
          console.log('✅ Added manage_comms_coordinators to admin role')
        } else {
          console.log('✅ Admin role already has manage_comms_coordinators permission')
        }
      }
    }
    
    // Verify owner role has all permissions
    const ownerRef = db.collection('roles').doc('owner')
    const ownerDoc = await ownerRef.get()
    
    if (ownerDoc.exists) {
      console.log('✅ Owner role verified (has all permissions by default)')
    }
    
    // Check user role to ensure it does NOT have manage_comms_coordinators
    const userRef = db.collection('roles').doc('user')
    const userDoc = await userRef.get()
    
    if (userDoc.exists) {
      const userData = userDoc.data()
      const userPermissions = userData.permissions || []
      
      // Remove manage_comms_coordinators if it exists
      const filteredPermissions = userPermissions.filter(p => p !== 'manage_comms_coordinators')
      if (filteredPermissions.length !== userPermissions.length) {
        await userRef.update({
          permissions: filteredPermissions,
          updatedAt: new Date().toISOString()
        })
        console.log('✅ Removed manage_comms_coordinators from user role')
      } else {
        console.log('✅ User role correctly does not have manage_comms_coordinators')
      }
    }
    
    // Create or update coordinator role if needed
    const coordinatorRef = db.collection('roles').doc('coordinator')
    const coordinatorDoc = await coordinatorRef.get()
    
    if (!coordinatorDoc.exists) {
      // Create coordinator role with appropriate permissions
      await coordinatorRef.set({
        id: 'coordinator',
        name: 'Communications Coordinator',
        description: 'Regional communications coordinator',
        hierarchy: 60,
        isSystemRole: false,
        permissions: [
          'view_users', 'view_projects', 'create_projects', 'edit_projects',
          'view_own_profile', 'edit_own_profile', 'view_own_activity', 'manage_own_security', 'upload_avatar',
          'view_forums', 'create_posts', 'edit_posts',
          'view_calendar', 'create_events', 'edit_events',
          // Communications permissions
          'view_comms', 'create_comms_projects', 'edit_comms_projects', 'delete_comms_projects',
          'view_all_regions', 'export_comms_data', 'approve_comms_projects', 'post_comms_messages'
          // Note: NO manage_comms_coordinators permission
        ],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      })
      console.log('✅ Created coordinator role')
    } else {
      // Ensure coordinator role doesn't have manage_comms_coordinators
      const coordData = coordinatorDoc.data()
      const coordPermissions = (coordData.permissions || []).filter(p => p !== 'manage_comms_coordinators')
      
      if (coordPermissions.length !== coordData.permissions.length) {
        await coordinatorRef.update({
          permissions: coordPermissions,
          updatedAt: new Date().toISOString()
        })
        console.log('✅ Updated coordinator role permissions')
      } else {
        console.log('✅ Coordinator role permissions are correct')
      }
    }
    
    console.log('\n✅ Coordinator permissions update completed successfully!')
    console.log('\nPermission Summary:')
    console.log('- Owner: Has all permissions (including manage_comms_coordinators)')
    console.log('- Admin: Has manage_comms_coordinators permission')
    console.log('- User: Does NOT have manage_comms_coordinators permission')
    console.log('- Coordinator: Does NOT have manage_comms_coordinators permission')
    
  } catch (error) {
    console.error('❌ Error updating permissions:', error)
    process.exit(1)
  }
}

// Run the update
updateCoordinatorPermissions()