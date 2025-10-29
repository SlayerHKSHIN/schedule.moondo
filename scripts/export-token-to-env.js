#!/usr/bin/env node

const userStore = require('../utils/userStore');
const fs = require('fs');
const path = require('path');

// Get user by email
const user = userStore.getUserByEmail('haneul96@gmail.com');

if (!user || !user.refreshToken) {
  console.error('❌ No refresh token found for haneul96@gmail.com');
  process.exit(1);
}

console.log('✅ Found refresh token for:', user.email);
console.log('Token expiry:', new Date(user.tokenExpiry).toLocaleString());

// Read current .env file
const envPath = path.join(__dirname, '../.env');
let envContent = fs.readFileSync(envPath, 'utf8');

// Check if GOOGLE_REFRESH_TOKEN is commented or exists
const commentedTokenRegex = /^# GOOGLE_REFRESH_TOKEN=.*/m;
const tokenRegex = /^GOOGLE_REFRESH_TOKEN=.*/m;

if (commentedTokenRegex.test(envContent)) {
  // Replace commented line
  envContent = envContent.replace(
    commentedTokenRegex,
    `GOOGLE_REFRESH_TOKEN=${user.refreshToken}`
  );
  console.log('✅ Uncommented and updated GOOGLE_REFRESH_TOKEN in .env');
} else if (tokenRegex.test(envContent)) {
  // Replace existing line
  envContent = envContent.replace(
    tokenRegex,
    `GOOGLE_REFRESH_TOKEN=${user.refreshToken}`
  );
  console.log('✅ Updated GOOGLE_REFRESH_TOKEN in .env');
} else {
  // Add new line
  envContent += `\nGOOGLE_REFRESH_TOKEN=${user.refreshToken}\n`;
  console.log('✅ Added GOOGLE_REFRESH_TOKEN to .env');
}

// Write back to file
fs.writeFileSync(envPath, envContent);

console.log('\n📝 .env file updated!');
console.log('🔄 Restart the server to use the new token:');
console.log('   pm2 restart schedule-gltr-ous --update-env');
