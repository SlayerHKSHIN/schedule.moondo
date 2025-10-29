# 🚀 OAuth 프로덕션 전환 - 빠른 가이드

## 📍 1단계: Google Cloud Console OAuth 설정 페이지 접속

**바로 가기 링크** (클릭하여 브라우저에서 열기):
```
https://console.cloud.google.com/apis/credentials/consent?project=649235071163
```

또는 수동으로:
1. https://console.cloud.google.com 접속
2. 프로젝트 선택: `649235071163`
3. 왼쪽 메뉴: **APIs & Services** → **OAuth consent screen**

---

## 📍 2단계: 현재 Publishing Status 확인

페이지 상단에서 **Publishing status** 확인:

### ✅ 이미 "Published" 또는 "In production" 상태인 경우
→ **이미 완료!** 3단계로 이동 (토큰 재발급만 필요)

### ⚠️ "Testing" 상태인 경우
→ 아래 3단계의 A 과정 먼저 진행

---

## 📍 3단계-A: Testing → Published 전환 (Testing인 경우만)

### 필수 정보 입력 확인

**App Information**에 다음 정보가 입력되어 있는지 확인:
- ✅ **App name**: Schedule GLTR-OUS (또는 아무 이름)
- ✅ **App home page**: https://hyun-schedule.moondo.ai
- ✅ **User support email**: haneul96@gmail.com
- ✅ **Developer contact information**: haneul96@gmail.com
- ✅ **Authorized domains**: moondo.ai

이것만 있으면 충분합니다! (로고, privacy policy 등은 선택사항)

### Publishing

1. 페이지 상단 또는 하단에서 **"PUBLISH APP"** 버튼 찾기
2. 클릭!
3. 확인 팝업에서 **"Confirm"** 또는 **"계속"** 클릭
4. 완료!

**주의**: "제한된 범위" 또는 "민감한 범위" 경고가 나올 수 있지만, 개인 사용이므로 무시하고 진행해도 됩니다.

---

## 📍 3단계-B: 토큰 재발급 (필수!)

프로덕션으로 전환했어도, **기존 토큰은 여전히 7일 제한**이 있습니다.
**새로 발급받은 토큰만 영구 유효**하므로 반드시 재발급 필요!

### 서버에서 실행:

```bash
# 1. 현재 디렉토리 확인
pwd
# 출력: /home/hyun/schedule-gltr-ous

# 2. 서버 중지 (실행 중이라면)
# Ctrl+C 또는 프로세스 종료

# 3. 기존 토큰 백업 (안전을 위해)
mv .refresh_token.json .refresh_token.json.backup

# 4. 서버 재시작
npm start

# 5. 콘솔에 출력되는 OAuth URL 확인
# "Please visit this URL to authorize: https://accounts.google.com/..."
```

### 브라우저에서:

1. 콘솔에 출력된 OAuth URL을 브라우저에서 열기
2. Google 계정 선택: `haneul96@gmail.com`
3. 권한 허용
   - "Google이 확인하지 않은 앱" 경고가 나올 수 있음
   - **"고급"** 또는 **"계속"** 클릭
   - **"Schedule GLTR-OUS(으)로 이동(안전하지 않음)"** 클릭
   - 권한 허용
4. 리다이렉트되면 완료!

### 확인:

```bash
# 새 토큰 파일 생성 확인
ls -la .refresh_token.json

# 서버 로그에서 "OAuth token saved" 메시지 확인
```

---

## 📍 4단계: 완료 확인

### ✅ 성공 확인 방법

1. **Google Cloud Console**에서:
   - Publishing status: **"Published"** 또는 **"In production"**

2. **서버 로그**에서:
   - `OAuth token saved successfully` 메시지 확인

3. **토큰 파일**:
   ```bash
   cat .refresh_token.json
   ```
   - `refresh_token` 필드에 새 토큰 값이 있어야 함

### 🎉 이제 Refresh Token이 영구적으로 유효합니다!

- ✅ 더 이상 7일마다 만료되지 않음
- ✅ 서버가 자동으로 access token 갱신 (1시간마다)
- ✅ 수동 재인증 불필요

**단, 다음 경우에는 무효화될 수 있음**:
- 사용자가 앱 권한 수동으로 취소
- 6개월 이상 사용하지 않음
- OAuth client secret 변경

---

## 🔧 문제 해결

### "PUBLISH APP 버튼이 없어요"
→ 이미 Published 상태일 수 있습니다. Status를 확인하세요.

### "Google 확인 필요" 경고
→ 개인 사용이라면 무시하고 "고급" → "계속" 클릭

### "리다이렉트 URI 불일치" 오류
→ `.env` 파일의 `GOOGLE_REDIRECT_URI` 확인:
```
GOOGLE_REDIRECT_URI=http://localhost:4312/api/auth/google/callback
```
서버 포트가 4312인지 확인

### "토큰 갱신 실패" 오류
→
1. `.refresh_token.json` 삭제
2. 서버 재시작
3. OAuth 재인증

---

## 📞 다음 단계

프로덕션 전환 완료 후:
1. ✅ 안드로이드 스크롤 문제 수정
2. ✅ (선택) 자동 토큰 갱신 시스템 추가 (추가 안정성)

---

**시작하세요!**
👉 https://console.cloud.google.com/apis/credentials/consent?project=649235071163
