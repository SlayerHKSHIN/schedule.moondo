# Google OAuth 앱 프로덕션 등록 가이드

## 문제 상황
- OAuth가 Testing 모드인 경우, refresh token이 **7일 후 만료**
- 7일마다 수동으로 재인증 필요
- 근본적 해결: 앱을 **프로덕션(Published)** 상태로 배포

## 해결 방법: OAuth 앱을 프로덕션으로 등록

### 1단계: Google Cloud Console 접속

1. https://console.cloud.google.com 방문
2. 프로젝트 선택 (Client ID가 `649235071163`인 프로젝트)

### 2단계: OAuth Consent Screen 설정

1. 왼쪽 메뉴에서 **APIs & Services** → **OAuth consent screen** 클릭
2. 현재 상태 확인:
   - **Testing** 상태이면 → 프로덕션으로 변경 필요
   - **Published** 상태이면 → 이미 완료 (refresh token 영구 유효)

### 3단계: OAuth Consent Screen 완성 (Testing → Published 전환 준비)

#### 3-1. App Information (앱 정보)
- **App name**: Schedule GLTR-OUS (또는 원하는 이름)
- **User support email**: haneul96@gmail.com
- **App logo**: (선택사항) 앱 로고 업로드
- **App domain**:
  - Application home page: https://hyun-schedule.moondo.ai
  - Application privacy policy link: https://hyun-schedule.moondo.ai/privacy
  - Application terms of service link: https://hyun-schedule.moondo.ai/terms
- **Authorized domains**: moondo.ai
- **Developer contact email**: haneul96@gmail.com

**저장** 클릭

#### 3-2. Scopes (권한 범위) 확인
1. **Add or Remove Scopes** 클릭
2. 필요한 권한 확인 (이미 설정되어 있어야 함):
   - `https://www.googleapis.com/auth/calendar`
   - `https://www.googleapis.com/auth/calendar.events`

**Update** → **Save and Continue** 클릭

#### 3-3. Test Users (테스트 중인 경우만)
- Testing 상태에서는 추가된 테스트 사용자만 OAuth 사용 가능
- haneul96@gmail.com이 추가되어 있는지 확인

**Save and Continue** 클릭

### 4단계: 프로덕션으로 배포 (Publishing)

#### 방법 1: 개인 사용 (Internal Use Only) - 권장
Google Workspace 계정이 있거나 개인 사용만 하는 경우:

1. OAuth consent screen 페이지 상단에서 **"PUBLISH APP"** 버튼 클릭
2. 확인 창에서 **"Confirm"** 클릭
3. 완료! 이제 refresh token이 **영구적으로 유효**

#### 방법 2: 공개 앱 (Public App) - 검증 필요
불특정 다수가 사용하는 공개 앱인 경우:

1. **"PUBLISH APP"** 클릭
2. Google의 앱 검증(Verification) 프로세스 필요
3. 검증 절차:
   - 개인정보 보호정책 URL 제공
   - 이용약관 URL 제공
   - 앱의 목적과 사용 방식 설명
   - 도메인 인증
   - Google의 검토 (수일~수주 소요)

**대부분의 개인 프로젝트는 방법 1로 충분합니다.**

### 5단계: 프로덕션 전환 후 토큰 재발급

프로덕션으로 전환한 후, **기존 토큰을 한 번 더 재발급**해야 영구 refresh token을 받을 수 있습니다:

1. 서버 중지
2. `.refresh_token.json` 파일 삭제 또는 백업:
   ```bash
   mv .refresh_token.json .refresh_token.json.backup
   ```
3. 서버 재시작:
   ```bash
   npm start
   ```
4. OAuth 인증 URL 방문하여 재인증
5. 새로 발급받은 refresh token이 **영구적으로 유효**

### 6단계: 확인

프로덕션 전환 확인:
1. Google Cloud Console → OAuth consent screen
2. **Publishing status**가 **"Published"** 또는 **"In production"**인지 확인

Refresh token 영구성 확인:
- 프로덕션 상태에서 발급받은 refresh token은 만료되지 않음
- 단, 다음 경우에는 무효화될 수 있음:
  - 사용자가 명시적으로 앱 접근 권한 취소
  - 6개월 이상 사용하지 않음 (사용 안 하면 만료)
  - OAuth 앱의 클라이언트 시크릿 변경

---

## 자주 묻는 질문

### Q1: 프로덕션 전환 시 위험은?
**A**: 개인 사용 앱이라면 위험 없음. 다만 OAuth consent screen의 정보가 사용자에게 표시됩니다.

### Q2: 검증(Verification) 없이 프로덕션 가능?
**A**: 가능. **본인 계정만 사용**하거나 **제한된 사용자만 사용**한다면 검증 없이도 Published 가능.

### Q3: Testing 모드를 유지하면서 토큰 만료를 막을 수 있나?
**A**: 불가능. Testing 모드는 무조건 7일 후 refresh token 만료. 유일한 해결책은 프로덕션 전환.

### Q4: 프로덕션 전환 후 기존 토큰은?
**A**: 기존 토큰도 계속 7일 제한이 있음. 프로덕션 전환 **후에 새로 발급**받은 토큰만 영구 유효.

### Q5: 프로덕션 전환 시 앱 이름/로고 필수?
**A**: 앱 이름과 이메일만 필수. 로고, privacy policy, terms of service는 선택사항 (개인 사용 시).

---

## 현재 프로젝트 설정

**Client ID**: 649235071163-1hgbqjlap880g1mvmp7h8i3ef3ql3jj7.apps.googleusercontent.com
**프로젝트 ID**: 649235071163
**이메일**: haneul96@gmail.com

**다음 단계**:
1. https://console.cloud.google.com/apis/credentials/consent?project=649235071163 방문
2. 현재 Publishing status 확인
3. Testing이라면 → PUBLISH APP 클릭
4. 토큰 재발급 (.refresh_token.json 삭제 후 재인증)

---

## 추가: 자동 토큰 갱신 시스템 (보조 수단)

프로덕션 전환이 근본적 해결책이지만, **추가 안전장치**로 자동 토큰 갱신 시스템도 구현 권장:
- Access token은 여전히 1시간마다 만료
- Refresh token을 사용해 자동으로 access token 갱신
- 백그라운드 cron 작업으로 30분마다 갱신 (이전 계획)

이렇게 하면 **이중 보안**:
1. 프로덕션 모드 → Refresh token 영구 유효
2. 자동 갱신 시스템 → Access token 자동 갱신

---

## 요약

| 방법 | Refresh Token 유효기간 | 구현 난이도 |
|------|------------------------|------------|
| Testing 모드 + 자동 갱신 | 7일 (근본 해결 X) | 중간 |
| **프로덕션 전환** | **영구** | **쉬움** ✅ |
| 프로덕션 + 자동 갱신 | 영구 + 안정성 | 중간 |

**권장사항**: 프로덕션 전환 (필수) + 자동 갱신 시스템 (선택)
