# Google OAuth App Verification Checklist

## 🚀 즉시 실행 가능한 단계별 가이드

### Step 1: 도메인 소유권 확인 (Google Search Console)

1. **Google Search Console 접속**
   - https://search.google.com/search-console 방문
   - Google 계정으로 로그인

2. **속성 추가**
   - "속성 추가" 클릭
   - **도메인** 선택
   - `moondo.ai` 입력

3. **DNS 레코드 추가**
   - Google이 제공하는 TXT 레코드 복사
   - 예시: `google-site-verification=abcd1234...`
   
4. **DNS 제공업체에서 TXT 레코드 추가**
   ```
   Type: TXT
   Name: @ (또는 빈칸)
   Value: google-site-verification=YOUR_VERIFICATION_CODE
   TTL: 3600
   ```

5. **확인**
   - DNS 전파 대기 (5-30분)
   - Google Search Console에서 "확인" 클릭

---

### Step 2: Google Cloud Console에서 OAuth 동의 화면 업데이트

1. **Google Cloud Console 접속**
   - https://console.cloud.google.com
   - 프로젝트 선택

2. **OAuth 동의 화면 수정**
   - 왼쪽 메뉴: "APIs & Services" > "OAuth consent screen"
   - "EDIT APP" 클릭

3. **앱 정보 업데이트**
   ```
   앱 이름: Schedule GLTR-OUS
   사용자 지원 이메일: haneul96@gmail.com
   앱 로고: (선택사항)
   ```

4. **앱 도메인 설정**
   ```
   애플리케이션 홈페이지: https://hyun-schedule.moondo.ai
   애플리케이션 개인정보처리방침: https://hyun-schedule.moondo.ai/privacy
   애플리케이션 서비스 약관: https://hyun-schedule.moondo.ai/terms
   ```

5. **승인된 도메인 추가**
   ```
   moondo.ai
   ```

6. **개발자 연락처**
   ```
   이메일: haneul96@gmail.com
   ```

7. **저장 후 계속**

---

### Step 3: 범위(Scopes) 확인 및 정당성 설명

1. **현재 범위 확인**
   - `.../auth/calendar` ✓
   - `.../auth/gmail.send` ✓

2. **각 범위에 대한 정당성 (검증 양식용)**
   
   **Calendar API 정당성:**
   ```
   Our application needs access to Google Calendar to:
   - Check user's calendar availability for scheduling
   - Create calendar events when meetings are booked
   - Prevent double-booking by reading existing events
   This is core functionality required for our scheduling service.
   ```
   
   **Gmail API 정당성:**
   ```
   Our application needs Gmail send permission to:
   - Send confirmation emails when meetings are scheduled
   - Include meeting details and Google Meet links
   - Provide calendar invitations to attendees
   Users expect email confirmations for their bookings.
   ```

---

### Step 4: 검증 신청 제출

1. **OAuth 동의 화면에서**
   - 모든 정보 저장 확인
   - "PUBLISH APP" 버튼 클릭

2. **검증 양식 작성**
   
   **Application Name:**
   ```
   Schedule GLTR-OUS
   ```
   
   **Application Description:**
   ```
   Schedule GLTR-OUS is a meeting scheduling application that allows users 
   to book appointments with calendar owners. The app checks Google Calendar 
   availability and creates events with Google Meet links for confirmed bookings.
   ```
   
   **Scopes Justification:**
   위의 Step 3 내용 사용
   
   **How users benefit:**
   ```
   Users can easily schedule meetings without back-and-forth emails. 
   They see real-time availability and receive instant confirmations 
   with calendar invites and meeting links.
   ```
   
   **Link to Privacy Policy:**
   ```
   https://hyun-schedule.moondo.ai/privacy
   ```
   
   **YouTube Demo Video:** (선택사항이지만 권장)
   - OAuth 플로우 시연
   - 앱 기능 데모

3. **제출 전 체크리스트**
   - [ ] 도메인 소유권 확인 완료
   - [ ] Privacy Policy 페이지 접근 가능
   - [ ] Terms of Service 페이지 접근 가능  
   - [ ] OAuth 동의 화면 모든 필드 입력
   - [ ] 앱이 프로덕션 URL에서 작동
   - [ ] 테스트 계정으로 전체 플로우 테스트 완료

---

### Step 5: 검증 대기 중 할 일

1. **이메일 모니터링**
   - Google에서 추가 정보 요청 가능
   - 보통 3-5일 내 첫 응답

2. **추가 요청 가능한 사항**
   - 스크린샷 제공
   - 비디오 데모
   - 보안 평가 (민감한 범위의 경우)

3. **준비 사항**
   - OAuth 플로우 스크린샷
   - 앱 사용 스크린샷
   - 데모 비디오 (있으면 좋음)

---

## 📸 필요한 스크린샷

1. **OAuth 동의 화면**
   - 사용자가 권한 부여하는 화면

2. **메인 앱 화면**
   - 캘린더와 예약 가능 시간

3. **예약 완료 화면**
   - 성공 메시지와 확인 이메일 안내

4. **받은 이메일**
   - 예약 확인 이메일 예시

---

## ⚠️ 중요 사항

1. **테스트 모드 유지 가능**
   - 검증 대기 중에도 앱 사용 가능
   - 테스트 사용자는 계속 사용 가능

2. **검증 실패 시**
   - 피드백에 따라 수정
   - 재제출 가능

3. **예상 소요 시간**
   - 일반적으로 2-6주
   - 민감한 범위는 더 오래 걸림

---

## 🎯 다음 단계

1. DNS TXT 레코드 추가 (도메인 소유권 확인)
2. OAuth 동의 화면 정보 업데이트
3. PUBLISH APP 클릭하여 검증 신청
4. Google의 응답 대기

---

## 📧 지원 연락처

문제 발생 시:
- Google Cloud Support: https://cloud.google.com/support
- OAuth 검증 FAQ: https://support.google.com/cloud/answer/9110914

---

마지막 업데이트: 2025년 8월 13일