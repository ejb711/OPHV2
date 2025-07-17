// functions/index.js  (Node 18 runtime)
const functions = require('firebase-functions/v1')   // gen-1 namespace
const admin     = require('firebase-admin')

admin.initializeApp()

/**
 * onNewUser
 * ----------
 * ①  create a Firestore profile document
 * ②  attach a custom claim { role:'pending' }
 *
 * Any admin can later change the claim to 'admin' | 'editor' | 'viewer'
 * and update the corresponding `/users/{uid}` document.
 */
exports.onNewUser = functions.auth.user().onCreate(async (user) => {
  // ① Firestore doc
  await admin.firestore().doc(`users/${user.uid}`).set({
    email     : user.email,
    role      : 'pending',
    createdAt : admin.firestore.FieldValue.serverTimestamp(),
  })

  // ② JWT custom claim (read instantly via getTokenResult / authState)
  await admin.auth().setCustomUserClaims(user.uid, { role: 'pending' })
})
