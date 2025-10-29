const { google } = require('googleapis');
const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

const oauth2Client = new google.auth.OAuth2(
  '394624355844-18hoslqe94dr82t3kong03cihtc3bkkj.apps.googleusercontent.com',
  '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',
  'urn:ietf:wg:oauth:2.0:oob'  // Manual copy/paste method
);

const scopes = [
  'https://www.googleapis.com/auth/calendar',
  'https://www.googleapis.com/auth/gmail.send'
];

const authorizeUrl = oauth2Client.generateAuthUrl({
  access_type: 'offline',
  scope: scopes.join(' '),
});

console.log('====================================');
console.log('Google OAuth 인증 설정');
console.log('====================================\n');
console.log('1. 다음 URL을 브라우저에 복사하여 접속하세요:\n');
console.log(authorizeUrl);
console.log('\n2. Google 계정으로 로그인하고 권한을 승인하세요.');
console.log('\n3. 승인 후 표시되는 인증 코드를 복사하세요.');
console.log('\n4. 아래 프롬프트에 인증 코드를 붙여넣고 Enter를 누르세요.\n');
console.log('====================================\n');

rl.question('인증 코드를 입력하세요: ', async (code) => {
  try {
    const { tokens } = await oauth2Client.getToken(code);
    
    console.log('\n=== 인증 성공! ===');
    console.log('Refresh Token:', tokens.refresh_token);
    console.log('\n이 refresh token을 .env 파일의 GOOGLE_REFRESH_TOKEN에 추가하세요.');
    
    // .env 파일 업데이트 제안
    console.log('\n.env 파일을 다음과 같이 업데이트하세요:');
    console.log(`GOOGLE_REFRESH_TOKEN=${tokens.refresh_token}`);
    
    rl.close();
    process.exit(0);
  } catch (err) {
    console.error('\n인증 실패:', err.message);
    rl.close();
    process.exit(1);
  }
});