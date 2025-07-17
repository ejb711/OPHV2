// functions/index.js
const functions = require('firebase-functions/v1')
const admin     = require('firebase-admin')

admin.initializeApp()

// Existing function...
exports.onNewUser = functions.auth.user().onCreate(async (user) => {
  await admin.firestore().doc(`users/${user.uid}`).set({
    email     : user.email,
    role      : 'pending',
    createdAt : admin.firestore.FieldValue.serverTimestamp(),
  })
  
  await admin.auth().setCustomUserClaims(user.uid, { role: 'pending' })
})

// NEW: Update custom claims when Firestore role changes
exports.onUserRoleChange = functions.firestore
  .document('users/{uid}')
  .onUpdate(async (change, context) => {
    const uid = context.params.uid
    const before = change.before.data()
    const after = change.after.data()
    
    // Only update if role actually changed
    if (before.role !== after.role) {
      console.log(`Updating custom claims for ${uid}: ${before.role} → ${after.role}`)
      await admin.auth().setCustomUserClaims(uid, { role: after.role })
    }
  })