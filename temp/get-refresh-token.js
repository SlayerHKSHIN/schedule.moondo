const { google } = require('googleapis');
const express = require('express');
require('dotenv').config();

const oauth2Client = new google.auth.OAuth2(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET,
  'http://localhost:4312/api/auth/google/callback'  // Use the same redirect URI from .env
);

const SCOPES = [
  'https://www.googleapis.com/auth/calendar',
  'https://www.googleapis.com/auth/calendar.events'
];

const app = express();
let server;

app.get('/api/auth/google/callback', async (req, res) => {
  const { code } = req.query;
  
  if (!code) {
    res.send('Error: No authorization code received');
    return;
  }

  try {
    const { tokens } = await oauth2Client.getToken(code);
    
    console.log('\n===========================================');
    console.log('SUCCESS! Here is your refresh token:');
    console.log('===========================================');
    console.log(`GOOGLE_REFRESH_TOKEN=${tokens.refresh_token}`);
    console.log('===========================================');
    console.log('\nUpdate your .env file with the above refresh token.');
    console.log('Then restart your server.\n');
    
    res.send(`
      <html>
        <body style="font-family: Arial, sans-serif; padding: 40px; max-width: 600px; margin: 0 auto;">
          <h1 style="color: #28a745;">✅ Success!</h1>
          <h2>Your new refresh token:</h2>
          <div style="background: #f8f9fa; padding: 15px; border-radius: 5px; word-break: break-all; font-family: monospace;">
            ${tokens.refresh_token}
          </div>
          <h3>Next steps:</h3>
          <ol>
            <li>Copy the refresh token above</li>
            <li>Update your .env file's GOOGLE_REFRESH_TOKEN</li>
            <li>Restart your server</li>
          </ol>
          <p style="color: #6c757d; margin-top: 30px;">You can close this window now.</p>
        </body>
      </html>
    `);
    
    // Close the server after successful auth
    setTimeout(() => {
      console.log('Closing server...');
      server.close();
      process.exit(0);
    }, 5000);
    
  } catch (error) {
    console.error('Error getting tokens:', error);
    res.send('Error getting tokens. Check console for details.');
  }
});

// Start server and open auth URL
server = app.listen(4312, () => {
  console.log('Temporary server listening on http://localhost:4312');
  
  const authUrl = oauth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: SCOPES,
    prompt: 'consent' // Force consent screen to ensure we get a refresh token
  });
  
  console.log('\n===========================================');
  console.log('Opening browser for Google authentication...');
  console.log('===========================================\n');
  console.log('If browser doesn\'t open automatically, visit:');
  console.log(authUrl);
  console.log('\n');
  
  // Note: Browser needs to be opened manually
});