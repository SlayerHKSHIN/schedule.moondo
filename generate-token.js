const { google } = require('googleapis');
const readline = require('readline');
require('dotenv').config();

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

// 새로운 Client ID와 Secret 사용
const oauth2Client = new google.auth.OAuth2(
  '649235071163-1hgbqjlap880g1mvmp7h8i3ef3ql3jj7.apps.googleusercontent.com',
  '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',
  'http://localhost:4312/auth/google/callback'
);

const scopes = [
  'https://www.googleapis.com/auth/calendar',
  'https://www.googleapis.com/auth/gmail.send'
];

const authorizeUrl = oauth2Client.generateAuthUrl({
  access_type: 'offline',
  scope: scopes.join(' '),
  prompt: 'consent'  // 강제로 동의 화면 표시
});

console.log('\n====================================');
console.log('Google OAuth 인증 설정');
console.log('====================================\n');
console.log('1. 다음 URL을 브라우저에 복사하여 접속하세요:\n');
console.log(authorizeUrl);
console.log('\n2. Google 계정으로 로그인하고 권한을 승인하세요.');
console.log('\n3. 승인 후 리다이렉트되는 URL에서 "code=" 뒤의 값을 복사하세요.');
console.log('   예: http://localhost:4312/auth/google/callback?code=4/0AeanS0a... 에서');
console.log('   "4/0AeanS0a..." 부분을 복사');
console.log('\n4. 아래 프롬프트에 인증 코드를 붙여넣고 Enter를 누르세요.\n');
console.log('====================================\n');

rl.question('인증 코드를 입력하세요: ', async (code) => {
  try {
    const { tokens } = await oauth2Client.getToken(decodeURIComponent(code));
    
    console.log('\n=== 인증 성공! ===');
    console.log('Refresh Token:', tokens.refresh_token);
    console.log('\n다음 단계:');
    console.log('1. .env 파일을 열어서 GOOGLE_REFRESH_TOKEN을 다음 값으로 교체하세요:');
    console.log(`\nGOOGLE_REFRESH_TOKEN=${tokens.refresh_token}\n`);
    console.log('2. 서버를 재시작하세요.');
    
    rl.close();
    process.exit(0);
  } catch (err) {
    console.error('\n인증 실패:', err.message);
    console.error('에러 상세:', err);
    rl.close();
    process.exit(1);
  }
});