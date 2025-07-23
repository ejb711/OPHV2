#!/usr/bin/env node
// scripts/apply-cors.js - Apply CORS configuration to Firebase Storage
// Run with: node scripts/apply-cors.js

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🔧 Applying CORS configuration to Firebase Storage...\n');

// CORS configuration
const corsConfig = [
  {
    origin: [
      "http://localhost:5173",
      "http://localhost:5174", 
      "https://*.app.github.dev",
      "https://*.firebaseapp.com",
      "https://*.web.app"
    ],
    method: ["GET", "POST", "PUT", "DELETE", "HEAD", "OPTIONS"],
    responseHeader: [
      "Content-Type",
      "Authorization", 
      "Content-Length",
      "User-Agent",
      "x-goog-resumable"
    ],
    maxAgeSeconds: 3600
  }
];

// Write CORS config to temporary file
const corsFile = path.join(__dirname, '../cors-temp.json');
fs.writeFileSync(corsFile, JSON.stringify(corsConfig, null, 2));

// Get storage bucket from environment or use default
const storageBucket = process.env.VITE_FIREBASE_STORAGE_BUCKET || 'oophv2-98d15.firebasestorage.app';

console.log(`📦 Storage Bucket: gs://${storageBucket}\n`);

try {
  // Check if gsutil is available
  try {
    execSync('gsutil version', { stdio: 'ignore' });
    console.log('✅ gsutil found\n');
  } catch (error) {
    console.error('❌ gsutil not found!\n');
    console.log('To fix this:');
    console.log('1. Install Google Cloud SDK: https://cloud.google.com/sdk/docs/install');
    console.log('2. Or try the manual method below\n');
    
    // Clean up temp file
    fs.unlinkSync(corsFile);
    process.exit(1);
  }

  // Apply CORS configuration
  console.log('🚀 Applying CORS configuration...');
  execSync(`gsutil cors set ${corsFile} gs://${storageBucket}`, { stdio: 'inherit' });
  
  console.log('\n✅ CORS configuration applied successfully!\n');
  
  // Show current configuration
  console.log('📝 Current CORS configuration:');
  execSync(`gsutil cors get gs://${storageBucket}`, { stdio: 'inherit' });
  
} catch (error) {
  console.error('\n❌ Failed to apply CORS configuration:', error.message);
  
  console.log('\n📋 Manual Alternative:');
  console.log('1. Go to Google Cloud Console: https://console.cloud.google.com');
  console.log(`2. Select your project: ${storageBucket.replace('.firebasestorage.app', '')}`);
  console.log('3. Go to Storage > Browser');
  console.log('4. Click on your bucket');
  console.log('5. Go to "Configuration" tab');
  console.log('6. Edit CORS configuration and paste the JSON from cors.json\n');
  
  process.exit(1);
} finally {
  // Clean up temp file
  if (fs.existsSync(corsFile)) {
    fs.unlinkSync(corsFile);
  }
}

console.log('\n✨ Done! Your Firebase Storage should now accept requests from GitHub Codespaces.');