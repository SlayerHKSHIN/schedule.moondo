# 하이브리드 인증 아키텍처

## 개요
Schedule GLTR-OUS는 Google Service Account와 OAuth 2.0을 결합한 하이브리드 인증 시스템을 사용합니다.

## 아키텍처 구조

### 1. Service Account (읽기 전용)
- **용도**: 캘린더 이벤트 읽기, 가용 시간 확인
- **장점**: 
  - 영구 인증 (토큰 갱신 불필요)
  - 안정적인 백그라운드 작업
  - 사용자 개입 없는 자동 처리
- **파일**: `utils/serviceAccountAuth.js`

### 2. OAuth 2.0 (쓰기 작업)
- **용도**: 이벤트 생성, 참석자 초대
- **장점**:
  - 완전한 캘린더 권한
  - 참석자 초대 기능
  - Google Meet 링크 생성
- **파일**: `utils/tokenManager.js`

### 3. 통합 레이어
- **파일**: `utils/googleCalendar.js`
- **함수**:
  - `getCalendarForRead()`: Service Account 사용
  - `getCalendarForCreate()`: OAuth 사용

## 로드맵과의 연결

### Phase 1 (완료) ✅
- LLM 통합으로 자연어 처리 구현
- 하이브리드 인증으로 안정적인 서비스 제공

### Phase 2 (진행 예정)
**MeetSync AI 플랫폼 구현 시 장점:**

1. **양방향 캘린더 접근**
   - Service Account로 상대방 캘린더 읽기
   - OAuth로 양측 모두에게 초대 발송

2. **AI 에이전트 자율성**
   - Service Account의 영구 인증으로 24/7 작동
   - 사용자 개입 없이 일정 협상 가능

3. **확장성**
   - 다중 사용자 지원 용이
   - 각 사용자별 OAuth 토큰 관리
   - 공통 Service Account로 효율적 읽기

### Phase 3 (미래)
**지능형 기능 구현 기반:**
- 참석자 선호도 학습 (Service Account로 히스토리 분석)
- 자동 일정 최적화 (OAuth로 일정 조정)
- 그룹 미팅 조율 (하이브리드 접근)

## 기술적 이점

1. **보안성**
   - Service Account 키는 서버에만 저장
   - OAuth 토큰은 암호화하여 관리
   - 최소 권한 원칙 적용

2. **신뢰성**
   - Service Account 장애 시 OAuth 폴백
   - OAuth 만료 시에도 읽기 가능
   - 이중화된 인증 시스템

3. **성능**
   - 읽기 작업은 Service Account로 빠르게 처리
   - 쓰기 작업만 OAuth 사용으로 토큰 관리 최소화

## 구현 예시

```javascript
// 하이브리드 사용 예시
async function scheduleWithAttendees(eventDetails) {
  // 1. Service Account로 가용 시간 확인
  const calendar = await getCalendarForRead();
  const slots = await checkAvailability(calendar);
  
  // 2. OAuth로 이벤트 생성 및 참석자 초대
  const createCalendar = await getCalendarForCreate();
  const event = await createEvent(createCalendar, {
    ...eventDetails,
    attendees: [...] // OAuth만 가능
  });
  
  return event;
}
```

## 마이그레이션 가이드

기존 OAuth 전용 시스템에서 마이그레이션:
1. Service Account 생성 및 캘린더 공유
2. `googleCalendar.js`에서 하이브리드 모드 활성화
3. 읽기 작업을 Service Account로 전환
4. OAuth는 쓰기 작업에만 사용

## 결론

하이브리드 인증 아키텍처는 Schedule GLTR-OUS가 현재의 안정적인 서비스를 제공하면서도 
미래의 AI 기반 자동 협상 시스템으로 확장할 수 있는 견고한 기반을 제공합니다.