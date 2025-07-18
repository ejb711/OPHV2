const admin = require('firebase-admin');
const serviceAccount = require('../ophv2_key.json');

admin.initializeApp({ 
  credential: admin.credential.cert(serviceAccount) 
});

const db = admin.firestore();

async function addProfilePermissions() {
  console.log('🚀 Adding Profile Permissions to OPHV2...\n');
  
  const profilePermissions = [
    { id: 'view_own_profile', name: 'View Own Profile', description: 'View own profile information', category: 'profile' },
    { id: 'edit_own_profile', name: 'Edit Own Profile', description: 'Edit own profile information', category: 'profile' },
    { id: 'view_own_activity', name: 'View Own Activity', description: 'View own activity history', category: 'profile' },
    { id: 'manage_own_security', name: 'Manage Own Security', description: 'Change password and security settings', category: 'profile' },
    { id: 'upload_avatar', name: 'Upload Avatar', description: 'Upload and change profile photo', category: 'profile' }
  ];

  try {
    console.log('📝 Creating profile permissions...');
    const batch = db.batch();
    
    for (const perm of profilePermissions) {
      const permRef = db.collection('permissions').doc(perm.id);
      batch.set(permRef, {
        ...perm,
        isSystemPermission: true,
        createdAt: admin.firestore.FieldValue.serverTimestamp()
      });
    }
    
    await batch.commit();
    console.log('✅ Profile permissions created!\n');

    console.log('🔧 Updating roles...');
    
    await db.collection('roles').doc('admin').update({
      permissions: admin.firestore.FieldValue.arrayUnion(
        'view_own_profile', 'edit_own_profile', 'view_own_activity', 
        'manage_own_security', 'upload_avatar'
      )
    });
    
    await db.collection('roles').doc('user').update({
      permissions: admin.firestore.FieldValue.arrayUnion(
        'view_own_profile', 'edit_own_profile', 'view_own_activity', 
        'manage_own_security', 'upload_avatar'
      )
    });
    
    await db.collection('roles').doc('viewer').update({
      permissions: admin.firestore.FieldValue.arrayUnion(
        'view_own_profile', 'view_own_activity'
      )
    });
    
    console.log('✅ Roles updated!\n');
    console.log('🎉 SUCCESS! Refresh your browser and check /profile');
    
  } catch (error) {
    console.error('❌ Error:', error);
  }
  
  process.exit(0);
}

addProfilePermissions();