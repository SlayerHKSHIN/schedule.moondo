# Schedule GLTR-OUS

스케줄 예약 서비스 - haneul96@gmail.com 계정과 연동된 미팅 예약 시스템

## 기능

- Google Calendar와 연동된 실시간 예약 가능 시간 확인
- 간편한 미팅 예약 인터페이스
- 예약 확인 이메일 자동 발송
- 반응형 웹 디자인

## 설정 방법

### 1. 환경 변수 설정

`.env.example` 파일을 `.env`로 복사하고 다음 정보를 입력하세요:

```bash
cp .env.example .env
```

필요한 환경 변수:
- `GOOGLE_CLIENT_ID`: Google Cloud Console에서 발급받은 OAuth 2.0 클라이언트 ID
- `GOOGLE_CLIENT_SECRET`: OAuth 2.0 클라이언트 시크릿
- `GOOGLE_REDIRECT_URI`: OAuth 리다이렉트 URI (http://localhost:4312/auth/google/callback)
- `GOOGLE_REFRESH_TOKEN`: Google 계정의 refresh token
- `EMAIL_USER`: haneul96@gmail.com
- `EMAIL_PASS`: Gmail 앱 비밀번호
- `ADMIN_PASSWORD`: 어드민 페이지 비밀번호 (기본값: admin123)

### 2. Google Cloud 설정

1. [Google Cloud Console](https://console.cloud.google.com/)에서 새 프로젝트 생성
2. Google Calendar API 활성화
3. OAuth 2.0 클라이언트 ID 생성
4. 승인된 리다이렉트 URI에 `http://localhost:4312/auth/google/callback` 추가

### 3. Gmail 앱 비밀번호 생성

1. Google 계정 설정 → 보안
2. 2단계 인증 활성화
3. 앱 비밀번호 생성 → "메일" 선택
4. 생성된 16자리 비밀번호를 `EMAIL_PASS`에 입력

### 4. Refresh Token 획득

Google OAuth 2.0 Playground를 사용하거나 별도의 스크립트로 refresh token을 획득해야 합니다.

## 실행 방법

### 개발 환경

1. 백엔드 의존성 설치 및 실행:
```bash
npm install
npm run dev
```

2. 프론트엔드 의존성 설치 및 실행 (새 터미널):
```bash
cd client
npm install
npm start
```

### 프로덕션 빌드

```bash
cd client
npm run build
cd ..
NODE_ENV=production npm start
```

## 배포

### Vercel, Netlify 등을 사용한 배포

1. 프론트엔드와 백엔드를 분리하여 배포
2. 백엔드는 Heroku, Railway, Render 등 사용
3. 환경 변수 설정 필수

### 도메인 연결

1. DNS 설정에서 A 레코드 또는 CNAME 추가
2. SSL 인증서 설정 (Let's Encrypt 권장)

## API 엔드포인트

- `GET /api/calendar/available-slots?date=YYYY-MM-DD` - 예약 가능한 시간대 조회
- `POST /api/booking/create` - 새 예약 생성

## 기술 스택

- Backend: Node.js, Express
- Frontend: React, React Calendar
- APIs: Google Calendar API, Gmail API
- Styling: CSS Grid, Flexbox