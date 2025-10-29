# 영구 인증 솔루션 가이드

## 현재 상황
- **OAuth with Refresh Token**: 테스트 모드에서 7일마다 만료
- **문제점**: 매주 수동으로 토큰 재발급 필요

## 영구적인 해결 방법

### 방법 1: Production 모드 전환 (추천) ⭐
**장점**: 현재 코드 그대로 사용 가능
**단점**: 앱 검증 과정 필요할 수 있음

1. [Google Cloud Console](https://console.cloud.google.com) 접속
2. **APIs & Services** → **OAuth consent screen**
3. **Publishing status** 섹션에서 **"PUBLISH APP"** 클릭
4. 필요한 정보 입력:
   - 앱 설명
   - 개인정보처리방침 URL (필수)
   - 서비스 약관 URL (선택)
5. 승인 후 refresh token이 6개월 이상 유효

### 방법 2: Service Account 사용 (완전 영구) 🔐
**장점**: 토큰 갱신 불필요, 완전 자동화
**단점**: 초기 설정 복잡

#### Service Account 설정:
```bash
# 1. Google Cloud Console에서 Service Account 생성
# 2. JSON 키 파일 다운로드
# 3. 파일을 service-account-key.json으로 저장

# 4. 코드 수정
# utils/googleCalendar.js에서:
const serviceAuth = require('./serviceAccountAuth');
await serviceAuth.initialize();
const calendar = serviceAuth.getCalendar();
```

#### Google Calendar 공유:
1. Google Calendar 설정 열기
2. "특정 사용자와 공유" 클릭
3. Service Account 이메일 추가
4. "일정 변경" 권한 부여

### 방법 3: 하이브리드 접근 (임시) 🔄
**현재 구현된 방식**
- 6시간마다 토큰 자동 체크
- 매주 한 번만 수동 갱신 필요
- Cron job으로 자동화

## 권장 사항

### 단기 (지금 당장):
✅ 현재 시스템 유지 (자동 갱신 + 주 1회 수동)

### 장기 (영구 해결):
1. **개인 사용**: Service Account 설정
2. **공개 서비스**: Production 모드 전환

## 현재 자동화 상태

```bash
# 설정된 Cron Jobs:
0 */6 * * *  # 6시간마다 토큰 체크
*/5 * * * *  # 5분마다 서버 상태 체크

# 수동 갱신 필요시:
node scripts/auto-refresh-token.js setup
```

## 테스트 모드 제한사항
- Refresh token 7일 만료
- 사용자 100명 제한
- "테스트 중" 경고 표시

## Production 모드 혜택
- Refresh token 6개월+ 유효
- 무제한 사용자
- 경고 메시지 없음

## 결론
**테스트 모드에서는 완전한 영구 인증 불가능**
→ Production 모드 또는 Service Account 필요