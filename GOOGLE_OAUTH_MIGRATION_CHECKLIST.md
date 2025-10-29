# Google OAuth 도메인 변경 체크리스트

## 도메인 변경 사항
- **이전**: `schedule.gltr-ous.us`
- **신규**: `hyun-schedule.moondo.ai`

---

## ✅ 필수 작업 (순서대로 진행)

### 1️⃣ Google Cloud Console OAuth 설정 업데이트

#### 1-1. OAuth Consent Screen 업데이트

**링크**: https://console.cloud.google.com/apis/credentials/consent?project=649235071163

**변경할 항목**:
1. **EDIT APP** 클릭
2. **App domain** 섹션:
   - Application home page: `https://hyun-schedule.moondo.ai`
   - Privacy policy: `https://hyun-schedule.moondo.ai/privacy`
   - Terms of service: `https://hyun-schedule.moondo.ai/terms`
3. **Authorized domains**:
   - 기존 `gltr-ous.us` **제거** (또는 유지)
   - `moondo.ai` **추가**
4. **SAVE AND CONTINUE** 클릭
5. Scopes, Test users 페이지는 그대로 두고 계속 진행
6. Summary 페이지에서 확인 후 완료

---

#### 1-2. OAuth Credentials (Redirect URI) 업데이트

**링크**: https://console.cloud.google.com/apis/credentials?project=649235071163

**변경할 항목**:
1. **OAuth 2.0 Client IDs** 목록에서 해당 Client ID 클릭
   - Client ID: `REMOVED_SECRET`
2. **Authorized redirect URIs** 섹션:
   - **기존 URI 유지** (테스트용):
     ```
     http://localhost:4312/api/auth/google/callback
     ```
   - **새 URI 추가**:
     ```
     https://hyun-schedule.moondo.ai/api/auth/google/callback
     ```
   - (선택) 기존 production URI 제거:
     ```
     https://schedule.gltr-ous.us/api/auth/google/callback
     ```
3. **SAVE** 클릭

---

### 2️⃣ OAuth Token 재발급 (프로덕션 모드 전환 후)

⚠️ **중요**: 프로덕션 모드로 전환한 후 토큰을 재발급해야 refresh token이 영구적으로 유효합니다.

#### 2-1. 현재 Publishing Status 확인
https://console.cloud.google.com/apis/credentials/consent?project=649235071163

- **Testing** 상태 → **PUBLISH APP** 클릭하여 프로덕션 전환 필요
- **Published/In production** 상태 → 이미 완료, 바로 2-2로

#### 2-2. Refresh Token 재발급

**서버에서 실행**:
```bash
# 1. 현재 디렉토리로 이동
cd /home/hyun/schedule-gltr-ous

# 2. 기존 토큰 백업
mv .refresh_token.json .refresh_token.json.backup

# 3. 서버 재시작 (NODE_ENV=production 설정 확인)
npm start

# 또는 pm2 사용 중이라면:
pm2 restart schedule-app --update-env
```

**브라우저에서**:
1. 콘솔에 출력된 OAuth URL 복사
2. 브라우저에서 열기
3. Google 계정 선택: `haneul96@gmail.com`
4. 권한 허용 (확인되지 않은 앱 경고가 나올 수 있음 → "고급" → "계속" 클릭)
5. 리다이렉트 완료 확인

**확인**:
```bash
# 새 토큰 파일 생성 확인
ls -la .refresh_token.json

# 서버 로그에서 "OAuth token saved" 확인
```

---

### 3️⃣ Cloudflare Tunnel 배포 후 테스트

#### 3-1. 앱 접속 확인
```
https://hyun-schedule.moondo.ai
```
- 앱이 정상적으로 로드되는지 확인

#### 3-2. OAuth 로그인 플로우 테스트
1. Admin 페이지 접속: `https://hyun-schedule.moondo.ai/admin`
2. 로그인 시도 (만약 OAuth 로그인이 있다면)
3. Google 인증 진행
4. 콜백 URL로 리다이렉트 확인:
   ```
   https://hyun-schedule.moondo.ai/api/auth/google/callback?code=...
   ```
5. 최종 페이지 로드 확인

#### 3-3. 캘린더 기능 테스트
- [ ] 가용 시간 조회 (Service Account)
- [ ] 예약 생성 (OAuth)
- [ ] 참석자 초대 이메일 발송
- [ ] Google Meet 링크 생성

---

## 📋 전체 작업 순서 요약

1. ✅ **애플리케이션 설정 파일 업데이트** (완료)
   - [x] `.env` 파일
   - [x] `dev/.env.production` 파일
   - [x] `server.js` CORS 설정

2. ✅ **Cloudflare Tunnel 설정** (진행 중)
   - [x] `cloudflare-tunnel-config.yml` 생성
   - [ ] Tunnel 생성 및 DNS 라우팅
   - [ ] systemd 서비스 등록
   - [ ] nginx 중지

3. ⏳ **Google OAuth 설정 업데이트** (다음 단계)
   - [ ] OAuth Consent Screen 도메인 업데이트
   - [ ] Redirect URI 추가
   - [ ] Testing → Published 전환
   - [ ] Refresh token 재발급

4. ⏳ **테스트 및 검증**
   - [ ] 앱 접속 확인
   - [ ] OAuth 플로우 테스트
   - [ ] 캘린더 기능 테스트
   - [ ] 이메일 발송 테스트

---

## 🔄 Rollback Plan (문제 발생 시)

### Cloudflare Tunnel 롤백:
```bash
# Cloudflare Tunnel 중지
sudo systemctl stop cloudflared-hyun-schedule

# nginx 재시작
sudo systemctl start nginx
```

### OAuth 설정 롤백:
1. Google Cloud Console에서 기존 URI 다시 추가
2. 기존 토큰 파일 복원:
   ```bash
   mv .refresh_token.json.backup .refresh_token.json
   ```

---

## ⚠️ 주의사항

### DNS 전파 시간
- Cloudflare DNS 변경 후 최대 5분 소요
- `dig hyun-schedule.moondo.ai` 명령으로 확인

### Token 무효화 조건
- OAuth Client Secret 변경 시
- 사용자가 수동으로 권한 취소 시
- 6개월 이상 미사용 시

### CORS 이슈
- 프로덕션에서는 `origin: 'https://hyun-schedule.moondo.ai'` 사용
- 개발 환경에서는 `origin: true` 유지
- `.env`의 `NODE_ENV=production` 확인 필요

---

## 📞 트러블슈팅

### "redirect_uri_mismatch" 오류
**원인**: Google OAuth Redirect URI가 등록되지 않음
**해결**:
1. Google Cloud Console → Credentials
2. Redirect URI에 `https://hyun-schedule.moondo.ai/api/auth/google/callback` 추가
3. 5분 대기 후 재시도

### "invalid_grant" 오류
**원인**: Refresh token이 무효화됨
**해결**:
1. `.refresh_token.json` 삭제
2. 서버 재시작하여 OAuth 재인증

### OAuth가 localhost로 리다이렉트
**원인**: `.env` 파일의 `GOOGLE_REDIRECT_URI` 설정 오류
**해결**:
```bash
# .env 파일 확인
cat .env | grep REDIRECT

# 올바른 값:
GOOGLE_REDIRECT_URI=https://hyun-schedule.moondo.ai/api/auth/google/callback
```

---

## 완료 시 확인사항

- [ ] `https://hyun-schedule.moondo.ai` 접속 가능
- [ ] OAuth 로그인 정상 작동
- [ ] 캘린더 이벤트 생성 가능
- [ ] 이메일 알림 발송 정상
- [ ] Google OAuth Consent Screen에 새 도메인 표시
- [ ] Refresh token이 영구 유효 (Published 모드)

---

**참고 문서**:
- Cloudflare Tunnel 설정: [CLOUDFLARE_TUNNEL_SETUP.md](./CLOUDFLARE_TUNNEL_SETUP.md)
- OAuth 프로덕션 전환: [PRODUCTION_SETUP_QUICK_GUIDE.md](./PRODUCTION_SETUP_QUICK_GUIDE.md)
