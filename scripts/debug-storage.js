#!/usr/bin/env node
// scripts/debug-storage.js - Debug Firebase Storage configuration
// Run from client directory: cd client && node ../scripts/debug-storage.js

const { initializeApp } = require('firebase/app');
const { getStorage } = require('firebase/storage');
const { getAuth, signInWithEmailAndPassword } = require('firebase/auth');
const dotenv = require('dotenv');
const path = require('path');

// Load environment variables from client directory
dotenv.config({ path: path.join(__dirname, '../client/.env') });

console.log('🔍 Firebase Storage Debug Tool\n');

// Firebase configuration
const firebaseConfig = {
  apiKey: process.env.VITE_FIREBASE_API_KEY,
  authDomain: process.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: process.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.VITE_FIREBASE_APP_ID
};

console.log('📋 Configuration:');
console.log(`Project ID: ${firebaseConfig.projectId}`);
console.log(`Storage Bucket: ${firebaseConfig.storageBucket}`);
console.log(`Auth Domain: ${firebaseConfig.authDomain}\n`);

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const storage = getStorage(app);
const auth = getAuth(app);

console.log('🪣 Storage Information:');
console.log(`Bucket Name: ${storage._bucket || 'Not accessible'}`);
console.log(`Host: ${storage._host}`);
console.log(`Protocol: ${storage._protocol}\n`);

// Check common bucket name variations
const possibleBuckets = [
  `${firebaseConfig.projectId}.firebasestorage.app`,
  `${firebaseConfig.projectId}.appspot.com`,
  firebaseConfig.storageBucket
];

console.log('🔎 Possible bucket names:');
possibleBuckets.forEach(bucket => {
  console.log(`- ${bucket}`);
});

console.log('\n📝 Next Steps:');
console.log('1. Verify the storage bucket name in Firebase Console');
console.log('2. Ensure Storage is enabled in Firebase Console');
console.log('3. Check if Storage rules are deployed');
console.log('4. Verify CORS configuration is applied to the correct bucket');

console.log('\n🔗 Direct Links:');
console.log(`Storage Rules: https://console.firebase.google.com/project/${firebaseConfig.projectId}/storage/rules`);
console.log(`Storage Browser: https://console.firebase.google.com/project/${firebaseConfig.projectId}/storage/files`);

// Test authentication if credentials provided
const testEmail = process.argv[2];
const testPassword = process.argv[3];

async function runTest() {
  if (testEmail && testPassword) {
    console.log('\n🔐 Testing authentication...');
    try {
      const userCredential = await signInWithEmailAndPassword(auth, testEmail, testPassword);
      console.log('✅ Authentication successful');
      console.log(`User ID: ${userCredential.user.uid}`);
      console.log(`Email: ${userCredential.user.email}`);
    } catch (error) {
      console.error('❌ Authentication failed:', error.message);
    }
  }

  console.log('\n✨ Debug complete!');
  process.exit(0);
}

runTest();