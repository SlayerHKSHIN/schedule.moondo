# Schedule GLTR-OUS

AI 기반 스마트 미팅 스케줄러 - Google Calendar와 연동된 지능형 예약 시스템

## 🚀 현재 기능

- ✅ **하이브리드 인증 시스템** (Service Account + OAuth)
  - Service Account: 캘린더 읽기 및 영구 인증
  - OAuth: 참석자 초대를 위한 이벤트 생성
- ✅ **LLM 통합 자연어 예약** (Phase 1 완료)
  - 한국어/영어 자연어 처리
  - 날짜 범위 및 시간대 자동 감지
  - AI 기반 대화형 예약 인터페이스
- ✅ Google Calendar 실시간 연동
- ✅ 간편한 미팅 예약 인터페이스
- ✅ 자동 이메일 알림 (모든 참석자)
- ✅ 시간대 자동 감지 (한국/미국)
- ✅ 반응형 웹 디자인

## 🛠 기술 스택

- **Backend:** Node.js, Express
- **Frontend:** React, React Calendar
- **인증:** 하이브리드 시스템 (Service Account + OAuth 2.0)
- **AI/LLM:** Gemma 모델 (llm.gltr.app)
- **APIs:** Google Calendar API, Gmail API
- **Database:** Google Calendar (as persistent storage)

## 📦 설치 및 실행

### 1. 의존성 설치
```bash
npm install
cd client && npm install
```

### 2. 환경 변수 설정
`.env` 파일 생성:
```
GOOGLE_CALENDAR_ID=haneul96@gmail.com
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-app-password
PORT=4312
```

### 3. 인증 설정

#### 하이브리드 인증 시스템
- **Service Account**: 캘린더 읽기 작업용
  - `service_account_key/service-account-key.json` 파일 필요
  - Google Calendar에서 Service Account 이메일과 캘린더 공유 필수
- **OAuth 2.0**: 참석자 초대가 포함된 이벤트 생성용
  - 환경변수 `GOOGLE_REFRESH_TOKEN` 설정 필요

### 4. 실행
```bash
# 개발 모드
npm run dev

# 프로덕션
npm start
```

## 🎯 개발 로드맵

### Phase 1: LLM 통합 ✅ (완료)
**자연어로 미팅 예약하기**
- "다음 주 화요일 오후에 30분 미팅 잡아줘"
- "10월 23일부터 25일 오전 10시-12시 사이 가능한 시간 알려줘"
- 한국어/영어 자연어 처리
- 컨텍스트 이해 및 지능형 제안
- 대화형 예약 인터페이스

### Phase 2: MeetSync AI 플랫폼 (진행 예정)
**AI 에이전트 간 자동 협상 시스템**
```
User A ↔ AI Agent A ↔ 협상 프로토콜 ↔ AI Agent B ↔ User B
                          ↓
                    최적 시간 자동 매칭
```

**하이브리드 인증의 장점:**
- Service Account의 영구 인증으로 안정적인 캘린더 읽기
- OAuth를 통한 완전한 참석자 관리 기능
- Phase 2 구현 시 양방향 캘린더 접근 가능

### Phase 3: 지능형 기능
- 🤖 참석자 선호도 학습
- 📍 이동 시간 자동 계산
- 👥 그룹 미팅 최적화
- 📝 미팅 준비 자료 AI 요약

## 🔮 비전

**"AI가 대신 일정을 잡아주는 세상"**

친구에게 "내일 점심 먹자"고 하면, 양쪽 AI 비서가 자동으로:
1. 가능한 시간 확인
2. 최적 장소 제안
3. 일정 확정 및 알림

## 📁 프로젝트 구조

```
schedule-gltr-ous/
├── server.js           # 메인 서버
├── client/            # React 프론트엔드
│   └── components/    # ChatBot (LLM 인터페이스) 포함
├── routes/            # API 라우트
│   ├── booking.js     # 예약 처리
│   └── nlp.js        # 자연어 처리
├── utils/             # 유틸리티
│   ├── googleCalendar.js  # 하이브리드 인증 시스템
│   ├── serviceAccountAuth.js  # Service Account 인증
│   ├── tokenManager.js    # OAuth 토큰 관리
│   └── llmClient.js      # LLM API 클라이언트
├── service_account_key/  # Google 인증 키
└── temp/              # 임시 파일 및 문서
```

## 🤝 기여하기

이 프로젝트는 오픈소스입니다. 기여를 환영합니다!

1. Fork the repository
2. Create your feature branch
3. Commit your changes
4. Push to the branch
5. Open a Pull Request

## 📄 라이선스

Proprietary License - All Rights Reserved

Copyright (c) 2024 Hyun Shin

이 소프트웨어의 사용, 복사, 수정, 배포는 저작권자의 명시적 허가 없이 금지됩니다.

## 🔗 연락처

- Email: haneul96@gmail.com
- GitHub: [schedule-gltr-ous](https://github.com/yourusername/schedule-gltr-ous)

---

**Built with ❤️ for making scheduling effortless**