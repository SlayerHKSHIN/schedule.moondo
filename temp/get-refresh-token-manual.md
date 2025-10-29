# Google OAuth Refresh Token 수동 획득 방법

원격 서버에서 OAuth 인증을 수행하려면 다음 방법 중 하나를 선택하세요:

## 방법 1: Google OAuth Playground 사용 (가장 간단)

1. https://developers.google.com/oauthplayground 접속

2. 왼쪽 목록에서 다음 API 선택:
   - Google Calendar API v3
     - https://www.googleapis.com/auth/calendar
     - https://www.googleapis.com/auth/calendar.events

3. 우측 상단 톱니바퀴 아이콘 클릭 → "Use your own OAuth credentials" 체크

4. 다음 정보 입력:
   - OAuth Client ID: `649235071163-1hgbqjlap880g1mvmp7h8i3ef3ql3jj7.apps.googleusercontent.com`
   - OAuth Client secret: `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`

5. "Authorize APIs" 클릭 후 Google 계정으로 로그인 및 권한 승인

6. Step 2에서 "Exchange authorization code for tokens" 클릭

7. **Refresh token** 값을 복사 (이것이 필요한 토큰입니다!)

## 방법 2: 로컬에서 실행 후 토큰 복사

1. 로컬 맥북에서 다음 스크립트 실행:

```javascript
// local-get-token.js
const { google } = require('googleapis');
const express = require('express');
const open = require('open');

const oauth2Client = new google.auth.OAuth2(
  '649235071163-1hgbqjlap880g1mvmp7h8i3ef3ql3jj7.apps.googleusercontent.com',
  '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',
  'http://localhost:3000/callback'
);

const SCOPES = [
  'https://www.googleapis.com/auth/calendar',
  'https://www.googleapis.com/auth/calendar.events'
];

const app = express();

app.get('/callback', async (req, res) => {
  const { code } = req.query;
  
  try {
    const { tokens } = await oauth2Client.getToken(code);
    console.log('REFRESH TOKEN:', tokens.refresh_token);
    res.send(`<h1>Success!</h1><p>Refresh Token: ${tokens.refresh_token}</p>`);
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    res.send('Error getting token');
  }
});

app.listen(3000, () => {
  const authUrl = oauth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: SCOPES,
    prompt: 'consent'
  });
  
  console.log('Opening browser...');
  console.log(authUrl);
  open(authUrl);
});
```

2. 로컬에서 실행:
```bash
npm install googleapis express open
node local-get-token.js
```

3. 브라우저에서 인증 완료 후 표시되는 refresh token 복사

## 방법 3: SSH 포트 포워딩 사용

맥북 터미널에서:
```bash
ssh -L 4312:localhost:4312 [your-server-username]@[your-server-ip]
```

그 다음 브라우저에서 http://localhost:4312 로 접속

## 획득한 Refresh Token 사용하기

.env 파일의 GOOGLE_REFRESH_TOKEN을 업데이트:
```
GOOGLE_REFRESH_TOKEN=[새로운 refresh token]
```

서버 재시작:
```bash
npm run dev
```