# 🚨 지금 바로 해야 할 작업

## 1️⃣ 먼저 앱 배포하기 (필수!)

Privacy Policy와 Terms 페이지가 실제로 접근 가능해야 합니다.

```bash
# 1. 변경사항 커밋
cd /home/hyun/schedule-gltr-ous
git add .
git commit -m "Add Privacy Policy and Terms of Service pages for Google OAuth verification"
git push origin main

# 2. 클라이언트 빌드
cd client
npm run build

# 3. 서버 재시작 (배포 환경에서)
pm2 restart schedule-app
```

---

## 2️⃣ Google Search Console에서 도메인 확인

### 지금 바로 하세요:

1. **이 링크 열기:** https://search.google.com/search-console

2. **"속성 추가" 클릭**

3. **도메인 선택하고 입력:**
   ```
   gltr-ous.us
   ```

4. **TXT 레코드 받기 (예시):**
   ```
   google-site-verification=1234567890abcdef...
   ```

5. **DNS 제공업체 (Cloudflare, GoDaddy 등)에 추가:**
   - Type: `TXT`
   - Name: `@`
   - Content: `google-site-verification=YOUR_CODE_HERE`
   - TTL: `Auto` 또는 `3600`

6. **5분 기다린 후 "확인" 클릭**

---

## 3️⃣ Google Cloud Console에서 OAuth 업데이트

### 지금 바로 하세요:

1. **이 링크 열기:** https://console.cloud.google.com

2. **왼쪽 메뉴:** APIs & Services → OAuth consent screen

3. **"EDIT APP" 클릭**

4. **복사해서 붙여넣기:**

   **OAuth Consent Screen 페이지 1:**
   ```
   App name: Schedule GLTR-OUS
   User support email: haneul96@gmail.com
   App logo: (건너뛰기)
   ```

   **OAuth Consent Screen 페이지 2 (App domain):**
   ```
   Application home page: https://schedule.gltr-ous.us
   Application privacy policy link: https://schedule.gltr-ous.us/privacy
   Application terms of service link: https://schedule.gltr-ous.us/terms
   ```

   **Authorized domains:**
   ```
   gltr-ous.us
   ```
   (+ 버튼 클릭해서 추가)

   **Developer contact information:**
   ```
   haneul96@gmail.com
   ```

5. **"SAVE AND CONTINUE" 클릭**

6. **Scopes 페이지:** 그대로 두고 "SAVE AND CONTINUE"

7. **Test users 페이지:** 그대로 두고 "SAVE AND CONTINUE"

8. **Summary 페이지 확인**

---

## 4️⃣ 검증 신청하기

### OAuth consent screen에서:

1. **"PUBLISH APP" 버튼 클릭**

2. **검증 양식이 나타나면 복사해서 붙여넣기:**

   **What is your Application Name?**
   ```
   Schedule GLTR-OUS
   ```

   **Provide a brief description:**
   ```
   Schedule GLTR-OUS is a meeting scheduling application that allows users to book appointments by checking calendar availability and creating events with confirmation emails.
   ```

   **Why do you need access to sensitive scopes?**
   
   Calendar API:
   ```
   We need Calendar API access to check availability slots and create calendar events when users book meetings. This is essential for the scheduling functionality.
   ```
   
   Gmail API:
   ```
   We need Gmail send permission to send confirmation emails with meeting details and Google Meet links when appointments are scheduled.
   ```

   **How will users benefit?**
   ```
   Users can easily schedule meetings without email exchanges, see real-time availability, and receive instant confirmations with calendar invites.
   ```

3. **"SUBMIT FOR VERIFICATION" 클릭**

---

## 5️⃣ 확인 사항

### 제출 전 마지막 체크:

- [ ] `https://schedule.gltr-ous.us` 접속 가능?
- [ ] `https://schedule.gltr-ous.us/privacy` 접속 가능?
- [ ] `https://schedule.gltr-ous.us/terms` 접속 가능?
- [ ] 도메인 소유권 확인 완료?
- [ ] OAuth 동의 화면 모든 필드 입력?

---

## ✅ 완료 후

1. **확인 이메일이 옵니다** (보통 24시간 이내)
2. **추가 정보 요청 시 빠르게 응답**
3. **검증 완료까지 2-6주 소요**

---

## 📱 문제 발생 시

- Privacy/Terms 페이지가 안 보이면: 서버 재시작 필요
- 도메인 확인 실패: DNS 전파 30분 대기
- PUBLISH APP 버튼이 안 보이면: 모든 필수 필드 입력 확인

---

**중요:** 테스트 모드에서도 계속 사용 가능하니 검증 대기 중에도 서비스는 정상 운영됩니다!