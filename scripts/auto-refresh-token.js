#!/usr/bin/env node

const { google } = require('googleapis');
const fs = require('fs');
const path = require('path');
const readline = require('readline');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const TOKEN_FILE = path.join(__dirname, '../.refresh_token.json');

const oauth2Client = new google.auth.OAuth2(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET,
  process.env.GOOGLE_REDIRECT_URI
);

const SCOPES = [
  'https://www.googleapis.com/auth/calendar',
  'https://www.googleapis.com/auth/calendar.events'
];

async function getAuthUrl() {
  const authUrl = oauth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: SCOPES,
    prompt: 'consent'
  });
  
  console.log('\n===========================================');
  console.log('Visit this URL to authorize the application:');
  console.log('===========================================\n');
  console.log(authUrl);
  console.log('\n');
  
  return authUrl;
}

async function getTokenFromCode(code) {
  try {
    const { tokens } = await oauth2Client.getToken(code);
    
    const tokenData = {
      refresh_token: tokens.refresh_token,
      access_token: tokens.access_token,
      expiry_date: tokens.expiry_date,
      created_at: new Date().toISOString()
    };
    
    // Save to file
    fs.writeFileSync(TOKEN_FILE, JSON.stringify(tokenData, null, 2));
    
    // Also update .env file
    const envPath = path.join(__dirname, '../.env');
    let envContent = fs.readFileSync(envPath, 'utf8');
    
    if (envContent.includes('GOOGLE_REFRESH_TOKEN=')) {
      envContent = envContent.replace(
        /GOOGLE_REFRESH_TOKEN=.*/,
        `GOOGLE_REFRESH_TOKEN=${tokens.refresh_token}`
      );
    } else {
      envContent += `\nGOOGLE_REFRESH_TOKEN=${tokens.refresh_token}`;
    }
    
    fs.writeFileSync(envPath, envContent);
    
    console.log('\n===========================================');
    console.log('✅ Token saved successfully!');
    console.log('===========================================');
    console.log('Token saved to:', TOKEN_FILE);
    console.log('.env file updated with new refresh token');
    
    return tokenData;
  } catch (error) {
    console.error('Error getting tokens:', error);
    throw error;
  }
}

async function checkAndRefreshToken() {
  try {
    if (!fs.existsSync(TOKEN_FILE)) {
      console.log('No token file found. Please run initial setup first.');
      return false;
    }
    
    const tokenData = JSON.parse(fs.readFileSync(TOKEN_FILE, 'utf8'));
    oauth2Client.setCredentials({
      refresh_token: tokenData.refresh_token,
      access_token: tokenData.access_token,
      expiry_date: tokenData.expiry_date
    });
    
    // Check if token needs refresh
    const now = Date.now();
    if (!tokenData.expiry_date || now >= tokenData.expiry_date - 60000) {
      console.log('Token expired or about to expire. Refreshing...');
      
      const { credentials } = await oauth2Client.refreshAccessToken();
      
      const newTokenData = {
        refresh_token: credentials.refresh_token || tokenData.refresh_token,
        access_token: credentials.access_token,
        expiry_date: credentials.expiry_date,
        updated_at: new Date().toISOString()
      };
      
      fs.writeFileSync(TOKEN_FILE, JSON.stringify(newTokenData, null, 2));
      console.log('✅ Token refreshed successfully!');
      return true;
    }
    
    console.log('✅ Token is still valid');
    return true;
  } catch (error) {
    console.error('Error refreshing token:', error);
    return false;
  }
}

async function interactiveSetup() {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });
  
  const question = (query) => new Promise((resolve) => rl.question(query, resolve));
  
  try {
    await getAuthUrl();
    const code = await question('Enter the authorization code from the URL: ');
    await getTokenFromCode(code);
    rl.close();
  } catch (error) {
    console.error('Error during setup:', error);
    rl.close();
    process.exit(1);
  }
}

// Main execution
async function main() {
  const args = process.argv.slice(2);
  
  if (args[0] === 'setup') {
    await interactiveSetup();
  } else if (args[0] === 'check') {
    await checkAndRefreshToken();
  } else {
    console.log('Usage:');
    console.log('  node auto-refresh-token.js setup   - Initial setup with OAuth flow');
    console.log('  node auto-refresh-token.js check   - Check and refresh token if needed');
  }
}

main().catch(console.error);