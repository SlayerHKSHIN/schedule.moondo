# Google OAuth 설정 가이드

이 문서는 Schedule GLTR OUS 애플리케이션의 Google OAuth 인증 설정 방법을 설명합니다.

## ⚠️ 중요 안내
**테스트 모드에서는 Refresh Token이 7일 후 만료됩니다. 매주 재생성이 필요합니다.**

## 사전 요구사항

1. Google Cloud Console 계정
2. Google Calendar API 활성화
3. Gmail API 활성화

## 초기 설정 (처음 한 번만)

### 1. Google Cloud Console 프로젝트 설정

1. [Google Cloud Console](https://console.cloud.google.com/)에 접속
2. 새 프로젝트 생성 또는 기존 프로젝트 선택
3. "API 및 서비스" > "사용 설정된 API 및 서비스"로 이동
4. "+ API 및 서비스 사용 설정" 클릭
5. 다음 API들을 검색하여 활성화:
   - Google Calendar API
   - Gmail API

### 2. OAuth 동의 화면 구성

1. "API 및 서비스" > "OAuth 동의 화면"으로 이동
2. User Type: "외부" 선택
3. 앱 정보 입력:
   - 앱 이름: Schedule GLTR OUS (또는 원하는 이름)
   - 사용자 지원 이메일: 본인 이메일
   - 개발자 연락처: 본인 이메일
4. 범위(Scopes) 추가:
   - `.../auth/calendar`
   - `.../auth/gmail.send`
5. **테스트 사용자 추가 (매우 중요!)**:
   - **반드시 사용할 Google 계정 이메일 추가** (예: haneul96@gmail.com)
   - 테스트 사용자로 추가하지 않으면 인증 시 403 에러 발생

### 3. OAuth 2.0 클라이언트 생성

1. "API 및 서비스" > "사용자 인증 정보"로 이동
2. "+ 사용자 인증 정보 만들기" > "OAuth 클라이언트 ID" 선택
3. 애플리케이션 유형: "웹 애플리케이션" 선택
4. 이름: "Schedule App Client" (원하는 이름)
5. 승인된 리디렉션 URI 추가:
   ```
   http://localhost:4312
   http://localhost:4312/auth/google/callback
   ```
6. "만들기" 클릭
7. 생성된 Client ID와 Client Secret 저장

### 4. 환경 변수 설정

`.env` 파일 생성 및 다음 정보 입력:

```env
PORT=4312
GOOGLE_CLIENT_ID=your_client_id_here
GOOGLE_CLIENT_SECRET=your_client_secret_here
GOOGLE_REDIRECT_URI=http://localhost:4312/auth/google/callback
EMAIL_USER=your_email@gmail.com
EMAIL_PASS=your_app_password
ADMIN_PASSWORD=admin123
```

## Refresh Token 생성 (매주 실행 필요)

### 단계별 가이드

1. **터미널에서 실행**:
   ```bash
   node generate-token.js
   ```

2. **출력된 URL을 브라우저에 복사하여 접속**
   - URL 예시: `https://accounts.google.com/o/oauth2/v2/auth?access_type=offline&scope=...`

3. **Google 계정으로 로그인 및 권한 승인**
   - 사용할 Google 계정으로 로그인
   - "이 앱은 Google에서 확인하지 않았습니다" 경고가 나타나면:
     - "고급" 클릭
     - "안전하지 않음(으)로 이동" 클릭
   - 요청된 권한 모두 승인

4. **승인 후 나타나는 페이지 처리**:
   - ⚠️ "localhost refused to connect" 에러가 나타나는 것이 **정상**입니다
   - 브라우저 주소창의 URL을 확인하세요

5. **URL에서 인증 코드 추출**:
   - 주소창 URL 예시: 
     ```
     http://localhost:4312/auth/google/callback?code=4/0AVMBsJjbSY0jDQWT...&scope=...
     ```
   - `code=` 뒤의 값을 복사 (위 예시에서는 `4/0AVMBsJjbSY0jDQWT...` 부분)
   - `&scope` 앞까지만 복사

6. **터미널에 코드 입력**:
   - 터미널의 "인증 코드를 입력하세요:" 프롬프트에 붙여넣기
   - Enter 키 누르기

7. **생성된 Refresh Token으로 .env 파일 업데이트**:
   ```env
   GOOGLE_REFRESH_TOKEN=1//04VKN5Wbz9EEk...
   ```

8. **서버 재시작**:
   ```bash
   # 기존 서버 중지 (Ctrl+C)
   # 서버 재시작
   npm start
   ```

## 문제 해결

### "Access blocked: has not completed the Google verification process" (403 에러)
**원인**: 테스트 사용자로 등록되지 않은 계정으로 접근
**해결**:
1. Google Cloud Console > OAuth 동의 화면
2. "테스트 사용자" 섹션에서 "+ 사용자 추가"
3. 사용할 이메일 주소 입력 후 저장

### "redirect_uri_mismatch" 에러
**원인**: OAuth 클라이언트에 리디렉션 URI가 등록되지 않음
**해결**:
1. Google Cloud Console > 사용자 인증 정보
2. OAuth 2.0 클라이언트 ID 클릭
3. 승인된 리디렉션 URI에 추가:
   - `http://localhost:4312`
   - `http://localhost:4312/auth/google/callback`

### "Token has been expired or revoked" 에러 (500 에러)
**원인**: Refresh Token이 만료됨
**해결**: 위의 "Refresh Token 생성" 단계를 다시 실행

### "localhost refused to connect" 
**이것은 정상입니다!** URL에서 code 값만 복사하면 됩니다.

### 포트 4312 사용 중 에러
```bash
# 포트 사용 프로세스 확인
lsof -i :4312

# 프로세스 종료
kill <PID>
```

## 토큰 만료 주기

### 테스트 모드 (현재 상태)
- **만료 기간**: 7일
- **대처 방법**: 매주 토큰 재생성 필요
- **알림 설정 권장**: 캘린더에 주간 리마인더 설정

### 프로덕션 모드 (선택사항)
- **만료 기간**: 무기한 (6개월 미사용 시에만 만료)
- **전환 방법**:
  1. Google Cloud Console > OAuth 동의 화면
  2. "앱 게시" 또는 "프로덕션으로 전환" 클릭
  3. Google 검토 제출 (민감한 범위는 추가 검증 필요)
  4. 승인까지 수일~수주 소요

## 보안 주의사항

- `.env` 파일을 절대 Git에 커밋하지 마세요 (`.gitignore`에 추가 필수)
- Refresh Token을 안전하게 보관하세요
- Client Secret을 공개하지 마세요
- 타인과 토큰을 공유하지 마세요

## 자동화 스크립트

매주 토큰 갱신을 잊지 않도록 리마인더 설정:

### macOS/Linux crontab 예시
```bash
# 매주 월요일 오전 9시 알림
0 9 * * 1 echo "Google OAuth Token 갱신 필요!" | mail -s "Token Renewal" your-email@gmail.com
```

### 수동 리마인더
- Google Calendar에 매주 반복 일정 추가
- 스마트폰 리마인더 앱 활용

## 현재 설정 정보 (예시)

```env
PORT=4312
GOOGLE_CLIENT_ID=649235071163-1hgbqjlap880g1mvmp7h8i3ef3ql3jj7.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=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
GOOGLE_REDIRECT_URI=http://localhost:4312/auth/google/callback
GOOGLE_REFRESH_TOKEN=1//04VKN5Wbz9EEkCgYIARAAGAQSNwF-L9IrscJ...
EMAIL_USER=haneul96@gmail.com
EMAIL_PASS=xsvksnwgpjraoclj
ADMIN_PASSWORD=admin123
```

---

*마지막 업데이트: 2025년 8월 9일*
*다음 토큰 갱신 예정일: 2025년 8월 16일*