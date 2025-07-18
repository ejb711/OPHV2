// scripts/add-owner-user.js
// OPHV2 - Add Owner User: eric.brooks@la.gov
const admin = require('firebase-admin');

// Initialize Firebase Admin
const serviceAccount = require('/workspaces/OPHV2/ophv2_key.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: `https://${serviceAccount.project_id}.firebaseio.com`
});

const db = admin.firestore();

// User configuration
const NEW_OWNER_USER = {
  email: 'eric.brooks@la.gov',
  password: 'LDH2025!TempPass', // Temporary password - user should change on first login
  displayName: 'Eric Brooks',
  role: 'owner'
};

// Complete permission set for OPHV2 system (28 permissions)
const ALL_PERMISSIONS = [
  // User Management (5)
  'manage_users', 'view_users', 'create_users', 'edit_users', 'delete_users',
  
  // Admin Access (6)
  'access_admin', 'manage_roles', 'manage_permissions', 'view_audit_logs', 
  'manage_system', 'manage_settings',
  
  // Projects (5)
  'manage_projects', 'view_projects', 'create_projects', 'edit_projects', 'delete_projects',
  
  // Forums (6)
  'manage_forums', 'view_forums', 'create_posts', 'edit_posts', 'delete_posts', 'moderate_posts',
  
  // Calendar (5)
  'manage_calendar', 'view_calendar', 'create_events', 'edit_events', 'delete_events',
  
  // Analytics & System (1)
  'view_analytics'
];

async function addOwnerUser() {
  console.log('🚀 OPHV2 - Adding Owner User');
  console.log('===============================\n');
  
  try {
    // Step 1: Check if user already exists
    console.log('🔍 Checking if user already exists...');
    try {
      const existingUser = await admin.auth().getUserByEmail(NEW_OWNER_USER.email);
      console.log(`⚠️  User ${NEW_OWNER_USER.email} already exists with UID: ${existingUser.uid}`);
      
      // Update existing user instead of creating new one
      await updateExistingUser(existingUser.uid);
      return;
    } catch (error) {
      if (error.code === 'auth/user-not-found') {
        console.log('✅ User does not exist, proceeding with creation...\n');
      } else {
        throw error;
      }
    }

    // Step 2: Ensure owner role exists in Firestore
    console.log('🏗️  Setting up owner role...');
    await ensureOwnerRole();

    // Step 3: Create user in Firebase Auth
    console.log('👤 Creating user in Firebase Auth...');
    const userRecord = await admin.auth().createUser({
      email: NEW_OWNER_USER.email,
      password: NEW_OWNER_USER.password,
      displayName: NEW_OWNER_USER.displayName,
      emailVerified: true // Auto-verify for admin-created accounts
    });
    
    console.log(`✅ User created with UID: ${userRecord.uid}`);

    // Step 4: Create user document in Firestore
    console.log('📄 Creating user document in Firestore...');
    const userData = {
      email: NEW_OWNER_USER.email,
      displayName: NEW_OWNER_USER.displayName,
      role: 'owner',
      status: 'active',
      customPermissions: [], // Owner doesn't need custom permissions
      deniedPermissions: [], // Owner can't be denied permissions
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      createdBy: 'system',
      lastActive: admin.firestore.FieldValue.serverTimestamp(),
      loginCount: 0,
      metadata: {
        addedByScript: true,
        initialOwner: true,
        temporaryPassword: true
      }
    };

    await db.collection('users').doc(userRecord.uid).set(userData);
    console.log('✅ User document created in Firestore');

    // Step 5: Set custom claims for immediate access
    console.log('🔐 Setting custom claims...');
    await admin.auth().setCustomUserClaims(userRecord.uid, {
      role: 'owner',
      permissions: ['*'] // Special indicator that owner has all permissions
    });
    console.log('✅ Custom claims set');

    // Step 6: Create audit log entry
    console.log('📝 Creating audit log entry...');
    await createAuditLog('owner_user_created', {
      targetUserId: userRecord.uid,
      targetUserEmail: NEW_OWNER_USER.email,
      role: 'owner',
      createdByScript: true
    });
    console.log('✅ Audit log entry created');

    // Step 7: Display success information
    console.log('\n🎉 SUCCESS! Owner user created successfully');
    console.log('==========================================');
    console.log(`📧 Email: ${NEW_OWNER_USER.email}`);
    console.log(`🆔 UID: ${userRecord.uid}`);
    console.log(`🔑 Temporary Password: ${NEW_OWNER_USER.password}`);
    console.log(`👑 Role: owner (full system access)`);
    console.log(`🔓 Permissions: All ${ALL_PERMISSIONS.length} permissions`);
    
    console.log('\n📋 Next Steps:');
    console.log('1. 🚀 Deploy any pending firestore rules: firebase deploy --only firestore:rules');
    console.log('2. 🌐 User can now log in to the application');
    console.log('3. 🔒 User should change password on first login');
    console.log('4. ✅ User has immediate access to all admin functions');

  } catch (error) {
    console.error('❌ Error creating owner user:', error);
    
    if (error.code === 'auth/email-already-exists') {
      console.log('\n💡 User already exists. Use the update function instead.');
    } else if (error.code === 'auth/invalid-email') {
      console.log('\n💡 Invalid email format provided.');
    } else if (error.code === 'auth/weak-password') {
      console.log('\n💡 Password too weak. Use a stronger password.');
    }
    
    process.exit(1);
  }

  process.exit(0);
}

async function updateExistingUser(uid) {
  console.log('\n🔄 Updating existing user to owner role...');
  
  try {
    // Update Firestore document
    await db.collection('users').doc(uid).update({
      role: 'owner',
      status: 'active',
      customPermissions: [],
      deniedPermissions: [],
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedBy: 'system',
      metadata: {
        upgradedToOwner: true,
        upgradedAt: admin.firestore.FieldValue.serverTimestamp()
      }
    });

    // Update custom claims
    await admin.auth().setCustomUserClaims(uid, {
      role: 'owner',
      permissions: ['*']
    });

    // Create audit log
    await createAuditLog('user_upgraded_to_owner', {
      targetUserId: uid,
      targetUserEmail: NEW_OWNER_USER.email,
      previousRole: 'unknown',
      newRole: 'owner'
    });

    console.log('✅ User successfully updated to owner role');
    console.log('\n📋 User now has full system access with all permissions');
    
  } catch (error) {
    console.error('❌ Error updating existing user:', error);
    throw error;
  }
}

async function ensureOwnerRole() {
  try {
    const ownerRole = {
      name: 'Owner',
      description: 'System owner with unrestricted access to all features',
      permissions: ['*'], // Special permission indicating all permissions
      hierarchy: 100, // Highest level
      isSystemRole: true,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      createdBy: 'system'
    };

    await db.collection('roles').doc('owner').set(ownerRole, { merge: true });
    console.log('✅ Owner role ensured in Firestore');

    // Also ensure admin role exists with proper permissions
    const adminRole = {
      name: 'Admin',
      description: 'System administrator with full permissions except owner-level actions',
      permissions: ALL_PERMISSIONS,
      hierarchy: 90,
      isSystemRole: true,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      createdBy: 'system'
    };

    await db.collection('roles').doc('admin').set(adminRole, { merge: true });
    console.log('✅ Admin role ensured with all permissions');

  } catch (error) {
    console.error('Error setting up roles:', error);
    throw error;
  }
}

async function createAuditLog(action, details) {
  try {
    const auditEntry = {
      action,
      details,
      userId: 'system',
      userEmail: 'system@ophv2.app',
      timestamp: admin.firestore.FieldValue.serverTimestamp(),
      ipAddress: null,
      userAgent: 'OPHV2-Admin-Script'
    };

    await db.collection('audit_logs').add(auditEntry);
  } catch (error) {
    console.warn('Warning: Could not create audit log:', error.message);
    // Don't fail the main operation if audit logging fails
  }
}

// Helper function to verify the setup
async function verifyOwnerUser() {
  console.log('\n🔍 Verifying owner user setup...');
  
  try {
    // Check Firebase Auth
    const userRecord = await admin.auth().getUserByEmail(NEW_OWNER_USER.email);
    console.log(`✅ Auth record exists: ${userRecord.uid}`);

    // Check custom claims
    const user = await admin.auth().getUser(userRecord.uid);
    console.log(`✅ Custom claims:`, user.customClaims);

    // Check Firestore document
    const userDoc = await db.collection('users').doc(userRecord.uid).get();
    if (userDoc.exists) {
      const userData = userDoc.data();
      console.log(`✅ Firestore document exists with role: ${userData.role}`);
    } else {
      console.log('❌ Firestore document missing');
    }

    // Check owner role
    const ownerRoleDoc = await db.collection('roles').doc('owner').get();
    if (ownerRoleDoc.exists) {
      console.log('✅ Owner role exists in Firestore');
    } else {
      console.log('❌ Owner role missing from Firestore');
    }

  } catch (error) {
    console.error('❌ Verification failed:', error);
  }
}

// Command line options
const args = process.argv.slice(2);
if (args.includes('--verify')) {
  verifyOwnerUser();
} else {
  addOwnerUser();
}