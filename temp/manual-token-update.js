const { google } = require('googleapis');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

// 인증 코드를 여기에 입력하세요
const AUTH_CODE = '4/0AVMBsJgZHzrp1Z-esNCfjO9afE1RXoY3wglqw5dwy_tB4zaSEZw7cOsVvQmgYLlz8qa3kw';

const oauth2Client = new google.auth.OAuth2(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET,
  process.env.GOOGLE_REDIRECT_URI
);

async function getAndSaveToken() {
  try {
    const { tokens } = await oauth2Client.getToken(AUTH_CODE);
    
    console.log('\n===========================================');
    console.log('✅ SUCCESS! New refresh token obtained:');
    console.log('===========================================');
    console.log(`GOOGLE_REFRESH_TOKEN=${tokens.refresh_token}`);
    console.log('===========================================\n');
    
    // Save to .refresh_token.json
    const tokenData = {
      refresh_token: tokens.refresh_token,
      access_token: tokens.access_token,
      expiry_date: tokens.expiry_date,
      created_at: new Date().toISOString()
    };
    
    fs.writeFileSync('.refresh_token.json', JSON.stringify(tokenData, null, 2));
    console.log('✅ Token saved to .refresh_token.json');
    
    // Update .env file
    const envPath = path.join(__dirname, '.env');
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
    console.log('✅ .env file updated with new refresh token');
    
    console.log('\n📝 Next steps:');
    console.log('1. Restart the server: node server.js');
    console.log('2. Set up automatic refresh: ./scripts/setup-cron.sh');
    
  } catch (error) {
    console.error('❌ Error getting token:', error);
    console.log('\nMake sure you:');
    console.log('1. Completed the OAuth consent screen');
    console.log('2. Copied the code from the redirect URL (after code= parameter)');
    console.log('3. Pasted it in this script replacing YOUR_AUTH_CODE_HERE');
  }
}

getAndSaveToken();