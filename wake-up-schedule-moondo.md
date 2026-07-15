# schedule.moondo Wake-up 문서

최종 확인: 2026-07-15 (Asia/Seoul)

이 문서는 새 작업 세션에서 `schedule.moondo.ai`의 현재 구성과 운영 상태를 빠르게 복원하기 위한 인수인계 문서다. 비밀번호, OAuth client secret, refresh token 같은 실제 비밀값은 이 저장소에 기록하지 않는다.

## 1. 현재 상태 요약

| 항목 | 현재 값 |
| --- | --- |
| 공개 주소 | `https://schedule.moondo.ai` |
| 관리자 화면 | `https://schedule.moondo.ai/admin` |
| GitHub 저장소 | `git@github.com:SlayerHKSHIN/schedule.moondo.git` |
| 운영 서버 | Tailscale 장치 `min-work` (`100.113.234.20`) |
| SSH 사용자 | `minho` |
| 서버 저장소 | `/home/minho/schedule.moondo` |
| 실행 서비스 | user systemd `schedule-moondo.service` |
| 애플리케이션 포트 | `4312` |
| 공개 프록시 | 기존 Cloudflare Tunnel → `127.0.0.1:4312` |
| 캘린더 계정 | `h@moondo.ai`의 기본 캘린더 |
| 기본 시간대 | `Asia/Seoul` |
| 기능 기준 커밋 | `0941e29` (`Fix calendar availability timezone calculation`) |

구성 흐름은 다음과 같다.

```text
사용자 브라우저
  → https://schedule.moondo.ai
  → Cloudflare Tunnel
  → min-work:127.0.0.1:4312
  → Express/Node 백엔드 + React 빌드
  → Google Calendar API (h@moondo.ai)
```

## 2. 서버 접속과 서비스 운영

```bash
ssh minho@100.113.234.20
cd /home/minho/schedule.moondo
```

서비스 상태, 재시작, 로그 확인:

```bash
systemctl --user status schedule-moondo.service
systemctl --user restart schedule-moondo.service
journalctl --user -u schedule-moondo.service -f
```

비대화형 SSH에서는 NVM의 Node/npm 경로가 자동으로 잡히지 않을 수 있다. 빌드나 테스트 전에 다음 경로를 추가한다.

```bash
export PATH=/home/minho/.nvm/versions/node/v22.19.0/bin:$PATH
```

현재 서비스는 Node `v22.19.0`을 사용한다. systemd user service가 활성화되어 있어 서버 재부팅 뒤에도 자동 시작된다.

## 3. Google OAuth와 캘린더 연결

Google Cloud 프로젝트는 `moondoor-481719`이며 OAuth 앱 상태는 다음과 같다.

- Publishing status: `In production`
- User type: `External`
- OAuth 사용자 수: 확인 당시 `3 / 100`
- Callback URI: `https://schedule.moondo.ai/api/auth/google/callback`
- 연결된 캘린더 사용자: `h@moondo.ai`

운영 서버의 OAuth 관련 파일:

| 용도 | 서버 경로 | 권한/주의 |
| --- | --- | --- |
| OAuth 환경 변수 | `/home/minho/.config/schedule.moondo/google-oauth.env` | `600`, 저장소 밖 |
| systemd 환경 로드 설정 | `/home/minho/.config/systemd/user/schedule-moondo.service.d/oauth.conf` | user service drop-in |
| Google refresh token | `/home/minho/schedule.moondo/.refresh_token.json` | `600`, Git에 커밋 금지 |

Google access token은 만료 전에 애플리케이션이 refresh token으로 자동 갱신한다. 앱이 `In production`인 상태에서 정상 발급된 refresh token은 테스트 앱의 7일 만료 규칙 때문에 매주 수동 갱신할 필요가 없다.

매주 다시 로그인하라는 화면이 보이면 먼저 아래 만료 종류를 구분한다.

- 사이트 로그인 세션 JWT/cookie: 현재 7일 만료
- 관리자 세션: 현재 8시간 만료
- Google Calendar refresh token: 위 세션과 별개이며 정상 상태에서는 자동 갱신

재인증이 필요할 때는 `GET /api/auth/google`에서 시작한다. 이 흐름은 Google 동의 화면을 다시 열어 refresh token을 발급하도록 `prompt=consent`를 사용한다. 토큰이나 client secret 원문을 터미널 출력, 문서, 이슈, 커밋 메시지에 남기지 않는다.

## 4. Availability 계산 방식

현재 availability의 기준은 `h@moondo.ai` 기본 Google Calendar의 이벤트다.

- 요청한 날짜의 자정부터 다음 날 자정까지를 요청 시간대의 IANA timezone으로 계산한다.
- `busy` 및 `outOfOffice` 이벤트가 있는 시간은 제외한다.
- 취소된 이벤트와 `transparent` 이벤트는 시간을 막지 않는다.
- 임의의 `08:00–21:00` 근무 시간 제한은 실제 슬롯 계산에 사용하지 않는다.
- 슬롯 길이는 30분이다.

확인용 API:

```bash
curl 'https://schedule.moondo.ai/api/calendar/available-slots?date=2026-07-18&timezone=Asia%2FSeoul'
```

2026-07-15에 실제 Google Calendar로 확인한 기준 결과:

- 2026-07-17 금요일: 한국시간 `10:00–22:00`, 30분 슬롯 24개
- 2026-07-18 토요일: 한국시간 `14:00–22:00`, 30분 슬롯 16개

시간대 버그를 다시 확인할 때는 응답의 UTC `Z` 시각을 한국시간으로 한 번만 변환해야 한다. 예를 들어 `2026-07-18T05:00:00.000Z`는 한국시간 `14:00`이다.

## 5. 모바일 스크롤 상태

모바일 페이지는 `html`이 유일한 세로 스크롤 컨테이너이며 `body`, `#root`는 `overflow: visible`을 사용한다. 문서 전체에 걸린 touch/gesture `preventDefault()` 리스너는 제거되어 있다.

iPhone 크기 에뮬레이션에서 캘린더 영역과 여백 영역의 손가락 스크롤, wheel 스크롤을 확인했다. 다시 스크롤이 막히면 아래를 우선 점검한다.

1. 전역 `touchmove`, `gesturestart`, `gesturechange`, `gestureend` 리스너가 추가됐는지
2. `html`, `body`, `#root` 중 둘 이상이 동시에 스크롤 컨테이너가 됐는지
3. 브라우저가 이전 CSS/JS 번들을 캐시하고 있는지

캐시 분리 확인 예시: `https://schedule.moondo.ai/?v=a91b9fe`

## 6. 테스트와 상태 확인

서버 저장소에서 다음 순서로 확인한다.

```bash
export PATH=/home/minho/.nvm/versions/node/v22.19.0/bin:$PATH
cd /home/minho/schedule.moondo

node --test test/*.test.js
CI=true npm --prefix client test -- --watchAll=false
npm run build
git diff --check
curl -I http://127.0.0.1:4312
curl -I https://schedule.moondo.ai
```

마지막 확인 당시 백엔드 테스트는 7/7, 프런트엔드 테스트는 3/3 통과했다. 프런트엔드 빌드에는 `Admin.js`, `HomePage.js`의 기존 unused variable 및 hook dependency 경고가 남아 있지만 빌드는 성공한다.

## 7. 권장 배포 절차

운영 서버의 GitHub SSH 키는 GitHub 사용자 `Kkaemii`로 인증되어 `SlayerHKSHIN/schedule.moondo`에 직접 push 권한이 없다. 따라서 개발/문서 변경은 이 Mac에서 `SlayerHKSHIN` 권한으로 push하고, 서버에서는 pull하는 흐름을 사용한다.

로컬:

```bash
git status
git pull --ff-only origin main
# 변경, 테스트, 커밋
git push origin main
```

운영 서버:

```bash
ssh minho@100.113.234.20
cd /home/minho/schedule.moondo
git pull --ff-only origin main

export PATH=/home/minho/.nvm/versions/node/v22.19.0/bin:$PATH
npm ci
npm run build
systemctl --user restart schedule-moondo.service
systemctl --user status schedule-moondo.service
```

의존성이 바뀌지 않은 단순 문서 변경은 서버 빌드와 서비스 재시작이 필요 없다.

## 8. 알려진 정리 항목

다음은 현재 동작을 막지는 않지만 향후 혼동을 줄이기 위해 정리할 항목이다.

- `utils/tokenManager.js`가 먼저 `users.json`에서 과거 계정 `haneul96@gmail.com`을 찾고, 없으면 `.refresh_token.json`으로 fallback한다. 운영 기준 계정인 `h@moondo.ai`에 맞게 정리해야 한다.
- `/api/calendar/available-slots`가 내부적으로 관리자 availability 설정을 읽으려다 인증이 없어 실패하면 `Asia/Seoul`로 fallback한다. 시간대 설정의 단일 source of truth가 필요하다.
- `data/availability.json`에는 평일 `09:00–17:00`, 주말 비활성 설정이 남아 있지만 현재 실제 슬롯 계산에는 적용되지 않는다.
- 캘린더 API 응답의 `workingHours: 08:00–21:00` 메타데이터는 실제 계산과 맞지 않으며 프런트엔드에서도 사용하지 않는 것으로 확인됐다.
- 관리자 비밀번호는 서비스 환경에만 보관하고 이 문서에는 기록하지 않는다. 분실 시 안전한 운영 채널에서 확인하거나 교체한다.

## 9. 장애 시 빠른 점검 순서

1. `curl -I https://schedule.moondo.ai`로 공개 응답을 확인한다.
2. 서버에서 `curl -I http://127.0.0.1:4312`로 앱 자체 응답을 확인한다.
3. `systemctl --user status schedule-moondo.service`와 journal을 확인한다.
4. `/api/calendar/available-slots`를 직접 호출해 앱 장애와 Google Calendar 장애를 구분한다.
5. OAuth 오류라면 환경 파일 존재/권한, systemd drop-in 로드 여부, refresh token 파일을 확인한다. 비밀값 자체는 출력하지 않는다.
6. 시간대 오류라면 요청의 `timezone`, 선택 날짜의 현지 자정 경계, UTC 변환 횟수를 확인한다.
7. 수정 후 테스트·빌드·로컬/공개 HTTP 확인을 모두 마치고 배포한다.

## 10. 새 세션 재개 체크리스트

- [ ] 이 문서와 최근 Git 로그를 읽는다.
- [ ] 로컬과 `origin/main`, 운영 서버의 HEAD가 같은지 확인한다.
- [ ] `schedule-moondo.service`가 active인지 확인한다.
- [ ] 공개 URL과 availability API가 응답하는지 확인한다.
- [ ] 캘린더 연결 계정이 `h@moondo.ai`인지 확인한다.
- [ ] OAuth 토큰을 출력하거나 새 비밀 파일을 커밋하지 않는다.
- [ ] 변경 후 백엔드 테스트, 프런트엔드 테스트, 빌드, `git diff --check`를 실행한다.
