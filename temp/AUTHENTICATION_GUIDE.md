# Google Calendar Authentication Guide

## 문제 해결 방법

Google OAuth 인증이 만료되었을 때 다음 단계를 따라 해결하세요:

### 1. 새 Refresh Token 받기

```bash
# 방법 1: 대화형 설정 (권장)
node scripts/auto-refresh-token.js setup

# 방법 2: 기존 스크립트 사용
node get-refresh-token.js
```

브라우저에서 나타나는 URL로 접속하여 Google 계정으로 로그인하고 권한을 승인합니다.

### 2. 인증 코드 입력

URL에서 `code=` 파라미터의 값을 복사하여 터미널에 입력합니다.

### 3. 서버 재시작

```bash
# 기존 서버 종료
pkill -f "node server.js"

# 서버 시작
nohup node server.js > server.log 2>&1 &
```

## 영구적인 해결책

### 자동 토큰 갱신 설정

```bash
# Cron job 설정 (6시간마다 토큰 갱신)
./scripts/setup-cron.sh
```

### Google Cloud Console 설정

1. [Google Cloud Console](https://console.cloud.google.com) 접속
2. OAuth 2.0 클라이언트 설정에서 앱을 "Production" 모드로 변경
3. OAuth 동의 화면에서 필요한 정보 입력:
   - 앱 이름
   - 사용자 지원 이메일
   - 개인정보처리방침 URL
   - 서비스 약관 URL

### 토큰 만료 방지

- **테스트 모드 앱**: 7일마다 토큰 갱신 필요
- **프로덕션 모드 앱**: 6개월까지 유효
- **자동 갱신**: Cron job으로 정기적 갱신

## 문제 해결

### 토큰 상태 확인

```bash
node scripts/auto-refresh-token.js check
```

### 로그 확인

```bash
# 서버 로그
tail -f server.log

# 토큰 갱신 로그
tail -f /var/log/token-refresh.log
```

### 수동 토큰 갱신

```bash
# .refresh_token.json 파일이 있는 경우
node scripts/auto-refresh-token.js check
```

## 중요 파일

- `.env`: 환경 변수 (GOOGLE_REFRESH_TOKEN 포함)
- `.refresh_token.json`: 토큰 정보 저장
- `utils/tokenManager.js`: 토큰 관리 모듈
- `scripts/auto-refresh-token.js`: 토큰 갱신 스크립트
- `scripts/setup-cron.sh`: Cron job 설정 스크립트

## 보안 주의사항

- `.refresh_token.json` 파일을 git에 커밋하지 마세요
- `.env` 파일을 공개 저장소에 업로드하지 마세요
- 정기적으로 토큰 상태를 확인하세요