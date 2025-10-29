const { google } = require('googleapis');
const http = require('http');
const url = require('url');
const open = require('open');
const destroyer = require('server-destroy');

const oauth2Client = new google.auth.OAuth2(
  '394624355844-18hoslqe94dr82t3kong03cihtc3bkkj.apps.googleusercontent.com',
  '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',
  'http://localhost:4312'  // 단순한 리다이렉트 URI 사용
);

const scopes = [
  'https://www.googleapis.com/auth/calendar',
  'https://www.googleapis.com/auth/gmail.send'
];

async function authenticate() {
  return new Promise((resolve, reject) => {
    const authorizeUrl = oauth2Client.generateAuthUrl({
      access_type: 'offline',
      scope: scopes.join(' '),
    });
    
    const server = http.createServer(async (req, res) => {
      try {
        if (req.url.indexOf('/') > -1) {
          const qs = new url.URL(req.url, 'http://localhost:4312').searchParams;
          const code = qs.get('code');
          
          res.end('Authentication successful! Please return to the console.');
          server.destroy();
          
          if (code) {
            const { tokens } = await oauth2Client.getToken(code);
            resolve(tokens);
          }
        }
      } catch (e) {
        reject(e);
      }
    }).listen(4312, () => {
      console.log('Visit this URL to authorize the application:');
      console.log(authorizeUrl);
      console.log('\nWaiting for authorization...');
    });
    
    destroyer(server);
  });
}

authenticate()
  .then(tokens => {
    console.log('\n=== Authentication Successful! ===');
    console.log('Refresh Token:', tokens.refresh_token);
    console.log('\nAdd this refresh token to your .env file as GOOGLE_REFRESH_TOKEN');
    process.exit();
  })
  .catch(err => {
    console.error('Authentication failed:', err);
    process.exit(1);
  });