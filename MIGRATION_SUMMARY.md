# 도메인 및 인프라 마이그레이션 완료 요약

## 🎯 변경 사항

### 도메인
- **이전**: `schedule.gltr-ous.us`
- **신규**: `hyun-schedule.moondo.ai`

### 인프라
- **이전**: nginx reverse proxy
- **신규**: Cloudflare Tunnel

---

## ✅ 완료된 작업

### 1. 애플리케이션 설정 업데이트

#### 환경 변수 파일
- ✅ [.env](.env) - Redirect URI 및 NODE_ENV 업데이트
- ✅ [dev/.env.production](dev/.env.production) - Redirect URI 업데이트

#### 서버 설정
- ✅ [server.js](server.js) - CORS origin을 프로덕션 도메인으로 변경
  ```javascript
  origin: process.env.NODE_ENV === 'production'
    ? 'https://hyun-schedule.moondo.ai'
    : true
  ```

### 2. Cloudflare Tunnel 설정

- ✅ [cloudflare-tunnel-config.yml](cloudflare-tunnel-config.yml) 생성
  - Tunnel 이름: `hyun-schedule`
  - 포워딩: `hyun-schedule.moondo.ai` → `localhost:4312`

### 3. 문서 업데이트

#### 신규 가이드 문서
- ✅ [CLOUDFLARE_TUNNEL_SETUP.md](CLOUDFLARE_TUNNEL_SETUP.md) - Cloudflare Tunnel 설정 상세 가이드
- ✅ [GOOGLE_OAUTH_MIGRATION_CHECKLIST.md](GOOGLE_OAUTH_MIGRATION_CHECKLIST.md) - OAuth 설정 변경 체크리스트
- ✅ [PRODUCTION_SETUP_QUICK_GUIDE.md](PRODUCTION_SETUP_QUICK_GUIDE.md) - OAuth 프로덕션 전환 빠른 가이드 (업데이트)
- ✅ [GOOGLE_APP_PRODUCTION_SETUP.md](GOOGLE_APP_PRODUCTION_SETUP.md) - OAuth 프로덕션 설정 상세 가이드 (업데이트)

#### 기존 문서 업데이트
- ✅ [dev/IMMEDIATE_ACTIONS.md](dev/IMMEDIATE_ACTIONS.md) - 모든 도메인 참조 업데이트
- ✅ [dev/VERIFICATION_CHECKLIST.md](dev/VERIFICATION_CHECKLIST.md) - 모든 도메인 참조 업데이트
- ✅ [dev/GOOGLE_APP_VERIFICATION_GUIDE.md](dev/GOOGLE_APP_VERIFICATION_GUIDE.md) - 모든 도메인 참조 업데이트
- ✅ [temp/IMMEDIATE_ACTIONS.md](temp/IMMEDIATE_ACTIONS.md) - dev 버전과 동기화
- ✅ [temp/VERIFICATION_CHECKLIST.md](temp/VERIFICATION_CHECKLIST.md) - dev 버전과 동기화
- ✅ [temp/GOOGLE_APP_VERIFICATION_GUIDE.md](temp/GOOGLE_APP_VERIFICATION_GUIDE.md) - dev 버전과 동기화

### 4. nginx 설정 제거

- ✅ `temp/nginx-updated.conf` 삭제
- ✅ `dev/nginx-updated.conf` 삭제
- ✅ `dev/nginx-dev.conf` 삭제

---

## 📋 다음 단계 (수동 작업 필요)

### 1️⃣ Cloudflare Tunnel 배포

상세 가이드: [CLOUDFLARE_TUNNEL_SETUP.md](CLOUDFLARE_TUNNEL_SETUP.md)

```bash
# 1. cloudflared 설치
wget -q https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-linux-amd64.deb
sudo dpkg -i cloudflared-linux-amd64.deb

# 2. Cloudflare 로그인
cloudflared tunnel login

# 3. Tunnel 생성
cloudflared tunnel create hyun-schedule

# 4. cloudflare-tunnel-config.yml의 credentials-file 경로 업데이트
# (생성된 TUNNEL_ID로 교체)

# 5. DNS 라우팅
cloudflared tunnel route dns hyun-schedule hyun-schedule.moondo.ai

# 6. 테스트 실행
cloudflared tunnel --config cloudflare-tunnel-config.yml run hyun-schedule

# 7. systemd 서비스 등록 (가이드 참조)

# 8. nginx 중지
sudo systemctl stop nginx
sudo systemctl disable nginx
```

---

### 2️⃣ Google OAuth 설정 업데이트

상세 체크리스트: [GOOGLE_OAUTH_MIGRATION_CHECKLIST.md](GOOGLE_OAUTH_MIGRATION_CHECKLIST.md)

#### A. OAuth Consent Screen
https://console.cloud.google.com/apis/credentials/consent?project=649235071163

1. **EDIT APP** 클릭
2. 업데이트:
   - Application home page: `https://hyun-schedule.moondo.ai`
   - Privacy policy: `https://hyun-schedule.moondo.ai/privacy`
   - Terms of service: `https://hyun-schedule.moondo.ai/terms`
   - Authorized domains: `moondo.ai` 추가
3. **SAVE AND CONTINUE**

#### B. OAuth Credentials (Redirect URI)
https://console.cloud.google.com/apis/credentials?project=649235071163

1. Client ID `649235071163-1hgbqjlap880g1mvmp7h8i3ef3ql3jj7` 클릭
2. **Authorized redirect URIs**에 추가:
   ```
   https://hyun-schedule.moondo.ai/api/auth/google/callback
   ```
3. **SAVE**

#### C. Testing → Published 전환 (필수!)
프로덕션 가이드: [PRODUCTION_SETUP_QUICK_GUIDE.md](PRODUCTION_SETUP_QUICK_GUIDE.md)

1. OAuth consent screen에서 **PUBLISH APP** 클릭
2. 확인 팝업에서 **Confirm**

#### D. Refresh Token 재발급
```bash
# 기존 토큰 백업
mv .refresh_token.json .refresh_token.json.backup

# 서버 재시작
npm start

# 콘솔에 나오는 OAuth URL을 브라우저에서 열어 재인증
```

---

### 3️⃣ 테스트 및 검증

```bash
# 앱 접속
curl -I https://hyun-schedule.moondo.ai

# 브라우저에서
# - OAuth 로그인
# - 캘린더 가용시간 조회
# - 예약 생성 테스트
# - 이메일 알림 확인
```

---

## 🔄 아키텍처 비교

### 이전 (nginx)
```
Internet → nginx:80 (schedule.gltr-ous.us)
  ├─ / → 34.56.66.54:4313 (Frontend)
  └─ /api/ → 34.56.66.54:4312 (Backend)
```

### 현재 (Cloudflare Tunnel)
```
Internet → Cloudflare (SSL 자동) → Tunnel (hyun-schedule)
  └─ hyun-schedule.moondo.ai → localhost:4312
     └─ Express가 React 빌드 + API 모두 제공
```

### 장점
- ✅ **SSL/HTTPS 자동** (Cloudflare 제공)
- ✅ **방화벽 불필요** (outbound 연결만 사용)
- ✅ **DDoS 보호** (Cloudflare 네트워크)
- ✅ **단일 포트 관리** (4312만 사용)
- ✅ **nginx 관리 불필요**

---

## 📁 파일 변경 사항 요약

### 생성된 파일
```
cloudflare-tunnel-config.yml
CLOUDFLARE_TUNNEL_SETUP.md
GOOGLE_OAUTH_MIGRATION_CHECKLIST.md
MIGRATION_SUMMARY.md (이 파일)
```

### 수정된 파일
```
.env
dev/.env.production
server.js
dev/IMMEDIATE_ACTIONS.md
dev/VERIFICATION_CHECKLIST.md
dev/GOOGLE_APP_VERIFICATION_GUIDE.md
temp/IMMEDIATE_ACTIONS.md
temp/VERIFICATION_CHECKLIST.md
temp/GOOGLE_APP_VERIFICATION_GUIDE.md
PRODUCTION_SETUP_QUICK_GUIDE.md
GOOGLE_APP_PRODUCTION_SETUP.md
```

### 삭제된 파일
```
temp/nginx-updated.conf
dev/nginx-updated.conf
dev/nginx-dev.conf
```

---

## ⚠️ 중요 사항

### 배포 전 확인
1. ✅ React 앱 빌드: `cd client && npm run build`
2. ✅ `.env`에 `NODE_ENV=production` 설정
3. ✅ 앱이 포트 4312에서 정상 실행 중

### 배포 후 확인
1. ⏳ `https://hyun-schedule.moondo.ai` 접속 확인
2. ⏳ OAuth 로그인 플로우 테스트
3. ⏳ 캘린더 기능 전체 테스트
4. ⏳ 이메일 발송 확인

### Rollback 계획
문제 발생 시:
```bash
# Cloudflare Tunnel 중지
sudo systemctl stop cloudflared-hyun-schedule

# nginx 재시작
sudo systemctl start nginx

# 기존 토큰 복원
mv .refresh_token.json.backup .refresh_token.json
```

---

## 📞 트러블슈팅

### DNS가 적용되지 않음
```bash
# DNS 확인
dig hyun-schedule.moondo.ai

# 5분 대기 후 재시도
```

### OAuth redirect_uri_mismatch 오류
- Google Cloud Console에서 Redirect URI 추가 확인
- `.env` 파일의 `GOOGLE_REDIRECT_URI` 확인

### 502 Bad Gateway
- Node.js 앱이 포트 4312에서 실행 중인지 확인
- Cloudflare Tunnel 로그 확인: `sudo journalctl -u cloudflared-hyun-schedule -f`

---

## 📚 참고 문서

1. **Cloudflare Tunnel 설정**: [CLOUDFLARE_TUNNEL_SETUP.md](CLOUDFLARE_TUNNEL_SETUP.md)
2. **OAuth 마이그레이션**: [GOOGLE_OAUTH_MIGRATION_CHECKLIST.md](GOOGLE_OAUTH_MIGRATION_CHECKLIST.md)
3. **OAuth 프로덕션 전환**: [PRODUCTION_SETUP_QUICK_GUIDE.md](PRODUCTION_SETUP_QUICK_GUIDE.md)

---

## ✅ 최종 체크리스트

### 애플리케이션 레벨 (완료)
- [x] 환경 변수 업데이트
- [x] CORS 설정 업데이트
- [x] 문서 업데이트
- [x] nginx 설정 제거

### 인프라 레벨 (진행 필요)
- [ ] Cloudflare Tunnel 생성 및 배포
- [ ] DNS 라우팅 설정
- [ ] systemd 서비스 등록
- [ ] nginx 서비스 중지

### OAuth 설정 (진행 필요)
- [ ] OAuth Consent Screen 업데이트
- [ ] Redirect URI 추가
- [ ] Testing → Published 전환
- [ ] Refresh token 재발급

### 테스트 (진행 필요)
- [ ] 앱 접속 확인
- [ ] OAuth 플로우 테스트
- [ ] 캘린더 기능 테스트
- [ ] 이메일 알림 테스트

---

**작성일**: 2025-10-28
**마이그레이션 대상**: schedule.gltr-ous.us → hyun-schedule.moondo.ai
**상태**: 애플리케이션 설정 완료, 인프라 배포 대기 중
