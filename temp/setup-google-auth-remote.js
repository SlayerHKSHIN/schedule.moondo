const { google } = require('googleapis');

const oauth2Client = new google.auth.OAuth2(
  '394624355844-18hoslqe94dr82t3kong03cihtc3bkkj.apps.googleusercontent.com',
  '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',
  'urn:ietf:wg:oauth:2.0:oob'  // 원격 서버용 특수 리다이렉트 URI
);

const scopes = [
  'https://www.googleapis.com/auth/calendar',
  'https://www.googleapis.com/auth/gmail.send'
];

const url = oauth2Client.generateAuthUrl({
  access_type: 'offline',
  scope: scopes,
});

console.log('====================================');
console.log('Google OAuth 인증 설정');
console.log('====================================\n');
console.log('1. 다음 URL을 브라우저에 복사하여 접속하세요:\n');
console.log(url);
console.log('\n2. Google 계정으로 로그인하고 권한을 승인하세요.');
console.log('\n3. 승인 후 표시되는 인증 코드를 복사하세요.');
console.log('\n4. 아래 프롬프트에 인증 코드를 붙여넣고 Enter를 누르세요.\n');
console.log('====================================\n');

const readline = require('readline');
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

rl.question('인증 코드를 입력하세요: ', async (code) => {
  try {
    const { tokens } = await oauth2Client.getToken(code);
    
    console.log('\n====================================');
    console.log('인증 성공!');
    console.log('====================================\n');
    console.log('Refresh Token:', tokens.refresh_token);
    console.log('\n이 토큰을 .env 파일에 GOOGLE_REFRESH_TOKEN으로 추가하세요.');
    console.log('\n예시:');
    console.log('GOOGLE_REFRESH_TOKEN=' + tokens.refresh_token);
    console.log('\n====================================');
    
    rl.close();
  } catch (err) {
    console.error('\n인증 실패:', err.message);
    console.log('\n일반적인 오류 원인:');
    console.log('- 인증 코드가 잘못되었거나 만료됨');
    console.log('- 리다이렉트 URI가 Google Cloud Console 설정과 일치하지 않음');
    console.log('- 클라이언트 ID 또는 시크릿이 잘못됨');
    rl.close();
  }
});