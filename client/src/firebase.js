// client/src/firebase.js
import { initializeApp } from "firebase/app";
import { getFirestore }  from 'firebase/firestore';
import { getAuth, setPersistence, browserSessionPersistence }         from 'firebase/auth'
import { getFunctions }    from 'firebase/functions'


const firebaseConfig = {
  apiKey:            import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain:        import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId:         import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket:     import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId:             import.meta.env.VITE_FIREBASE_APP_ID,
  // measurementId is OPTIONAL – only needed if you enable Google Analytics
  // measurementId:   import.meta.env.VITE_FIREBASE_MEASUREMENT_ID,
};

// Initialize Firebase
export const firebaseApp = initializeApp(firebaseConfig);
export const db = getFirestore(firebaseApp);
export const auth = getAuth(firebaseApp);
export const functions = getFunctions(firebaseApp);

// Set session persistence - users will be logged out when browser/tab closes
setPersistence(auth, browserSessionPersistence)
  .then(() => {
    console.log('[firebase] Session persistence configured - users will be logged out on browser close')
  })
  .catch((error) => {
    console.error('[firebase] Error setting session persistence:', error)
  });