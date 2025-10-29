const { google } = require('googleapis');
const readline = require('readline');

const oauth2Client = new google.auth.OAuth2(
  '394624355844-18hoslqe94dr82t3kong03cihtc3bkkj.apps.googleusercontent.com',
  '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',
  'http://localhost:4312/auth/google/callback'
);

const scopes = [
  'https://www.googleapis.com/auth/calendar',
  'https://www.googleapis.com/auth/gmail.send'
];

const url = oauth2Client.generateAuthUrl({
  access_type: 'offline',
  scope: scopes,
});

console.log('Authorize this app by visiting this url:', url);

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

rl.question('Enter the code from that page here: ', (code) => {
  oauth2Client.getToken(code, (err, token) => {
    if (err) return console.error('Error retrieving access token', err);
    console.log('Your refresh token is:', token.refresh_token);
    console.log('Add this to your .env file as GOOGLE_REFRESH_TOKEN');
    rl.close();
  });
});