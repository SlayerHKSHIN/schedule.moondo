# Cloudflare Tunnel 설정 가이드

## 목표
nginx를 제거하고 Cloudflare Tunnel로 `hyun-schedule.moondo.ai`를 `localhost:4312`로 포워딩합니다.

---

## 사전 요구사항

- Cloudflare 계정 (moondo.ai 도메인 관리)
- 서버 SSH 접근 권한
- Node.js 앱이 포트 4312에서 실행 중

---

## 1단계: cloudflared 설치

### Ubuntu/Debian:
```bash
# 최신 버전 다운로드 (예: Linux AMD64)
wget -q https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-linux-amd64.deb

# 설치
sudo dpkg -i cloudflared-linux-amd64.deb

# 버전 확인
cloudflared --version
```

### 다른 OS:
https://developers.cloudflare.com/cloudflare-one/connections/connect-apps/install-and-setup/installation/

---

## 2단계: Cloudflare 로그인

```bash
cloudflared tunnel login
```

이 명령은 브라우저를 열고 Cloudflare 인증을 요청합니다:
1. 브라우저에서 Cloudflare 계정으로 로그인
2. **moondo.ai** 도메인 선택
3. "Authorize" 클릭

완료되면 인증 파일이 생성됩니다:
```
~/.cloudflared/cert.pem
```

---

## 3단계: Tunnel 생성

```bash
cloudflared tunnel create hyun-schedule
```

출력 예시:
```
Tunnel credentials written to /home/hyun/.cloudflared/<TUNNEL_ID>.json
Created tunnel hyun-schedule with id <TUNNEL_ID>
```

**중요**: `TUNNEL_ID`를 기록해두세요!

---

## 4단계: Tunnel 설정 파일 구성

이미 프로젝트에 `cloudflare-tunnel-config.yml` 파일이 생성되어 있습니다.

### 설정 파일 위치 확인:
```bash
cat /home/hyun/schedule-gltr-ous/cloudflare-tunnel-config.yml
```

### credentials-file 경로 업데이트:

파일을 열어서 `credentials-file` 경로를 실제 Tunnel ID로 업데이트하세요:

```yaml
tunnel: hyun-schedule
credentials-file: /home/hyun/.cloudflared/<YOUR_TUNNEL_ID>.json
```

`<YOUR_TUNNEL_ID>`를 3단계에서 받은 실제 ID로 교체합니다.

---

## 5단계: DNS 라우팅 설정

Cloudflare DNS에 터널을 연결합니다:

```bash
cloudflared tunnel route dns hyun-schedule hyun-schedule.moondo.ai
```

출력:
```
Added CNAME hyun-schedule.moondo.ai which will route to tunnel <TUNNEL_ID>
```

이 명령은 Cloudflare DNS에 자동으로 CNAME 레코드를 추가합니다:
- **Name**: `hyun-schedule`
- **Type**: `CNAME`
- **Target**: `<TUNNEL_ID>.cfargotunnel.com`

---

## 6단계: Tunnel 테스트 실행

### 수동 테스트:
```bash
cd /home/hyun/schedule-gltr-ous
cloudflared tunnel --config cloudflare-tunnel-config.yml run hyun-schedule
```

출력에서 다음을 확인:
```
INF Connection registered connIndex=0 location=<LOCATION>
INF +--------------------------------------------------------------------------------------------+
INF |  Your quick Tunnel has been created! Visit it at (it may take some time to be reachable):  |
INF |  https://hyun-schedule.moondo.ai                                                            |
INF +--------------------------------------------------------------------------------------------+
```

### 브라우저에서 테스트:
```
https://hyun-schedule.moondo.ai
```

앱이 정상적으로 로드되면 성공! ✅

Ctrl+C로 중지.

---

## 7단계: systemd 서비스로 등록 (자동 시작)

### 서비스 파일 생성:
```bash
sudo nano /etc/systemd/system/cloudflared-hyun-schedule.service
```

### 내용 입력:
```ini
[Unit]
Description=Cloudflare Tunnel for hyun-schedule.moondo.ai
After=network.target

[Service]
Type=simple
User=hyun
WorkingDirectory=/home/hyun/schedule-gltr-ous
ExecStart=/usr/bin/cloudflared tunnel --config /home/hyun/schedule-gltr-ous/cloudflare-tunnel-config.yml run hyun-schedule
Restart=on-failure
RestartSec=5s

[Install]
WantedBy=multi-user.target
```

### 서비스 활성화 및 시작:
```bash
# Reload systemd
sudo systemctl daemon-reload

# 서비스 활성화 (부팅 시 자동 시작)
sudo systemctl enable cloudflared-hyun-schedule

# 서비스 시작
sudo systemctl start cloudflared-hyun-schedule

# 상태 확인
sudo systemctl status cloudflared-hyun-schedule
```

출력에서 "active (running)" 확인:
```
● cloudflared-hyun-schedule.service - Cloudflare Tunnel for hyun-schedule.moondo.ai
     Loaded: loaded (/etc/systemd/system/cloudflared-hyun-schedule.service; enabled)
     Active: active (running)
```

---

## 8단계: nginx 중지 및 제거

### nginx 서비스 중지:
```bash
sudo systemctl stop nginx
sudo systemctl disable nginx
```

### nginx 설정 파일 백업 (선택사항):
```bash
mkdir -p /home/hyun/schedule-gltr-ous/backups
sudo cp -r /etc/nginx /home/hyun/schedule-gltr-ous/backups/nginx-backup
```

### 프로젝트 내 nginx 파일 제거:
```bash
cd /home/hyun/schedule-gltr-ous
rm -f temp/nginx-updated.conf
rm -f dev/nginx-updated.conf
rm -f dev/nginx-dev.conf
```

---

## 9단계: 최종 확인

### 서비스 상태 확인:
```bash
# Cloudflare Tunnel 상태
sudo systemctl status cloudflared-hyun-schedule

# Node.js 앱 상태 (pm2 사용 중이라면)
pm2 status

# 또는 프로세스 확인
ps aux | grep node
```

### 웹 접속 테스트:
```bash
curl -I https://hyun-schedule.moondo.ai
```

출력:
```
HTTP/2 200
server: cloudflare
...
```

### OAuth 콜백 테스트:
브라우저에서:
```
https://hyun-schedule.moondo.ai/api/auth/google/callback
```

404 또는 에러가 정상 (OAuth 플로우 없이 직접 접근했으므로)

---

## 10단계: Google OAuth 업데이트

Google Cloud Console에서 Redirect URI 업데이트 필요:

1. https://console.cloud.google.com 접속
2. APIs & Services → Credentials
3. OAuth 2.0 Client ID 선택
4. **Authorized redirect URIs** 추가:
   ```
   https://hyun-schedule.moondo.ai/api/auth/google/callback
   ```
5. **Save** 클릭

---

## 유용한 명령어

### Tunnel 상태 확인:
```bash
cloudflared tunnel info hyun-schedule
```

### 로그 확인:
```bash
# systemd 서비스 로그
sudo journalctl -u cloudflared-hyun-schedule -f

# 최근 50줄
sudo journalctl -u cloudflared-hyun-schedule -n 50
```

### Tunnel 재시작:
```bash
sudo systemctl restart cloudflared-hyun-schedule
```

### Tunnel 중지:
```bash
sudo systemctl stop cloudflared-hyun-schedule
```

---

## 트러블슈팅

### 문제: "tunnel not found"
**해결**:
```bash
cloudflared tunnel list
```
Tunnel이 목록에 있는지 확인. 없다면 3단계부터 다시.

### 문제: "connection refused"
**해결**:
- Node.js 앱이 포트 4312에서 실행 중인지 확인
- `netstat -tlnp | grep 4312`
- 앱 재시작: `pm2 restart schedule-app` 또는 `npm start`

### 문제: "502 Bad Gateway"
**해결**:
- Cloudflare Tunnel 로그 확인
- Node.js 앱 로그 확인
- 설정 파일의 포트 번호 확인 (4312)

### 문제: DNS 변경이 적용되지 않음
**해결**:
- DNS 전파 시간 대기 (최대 5분)
- `dig hyun-schedule.moondo.ai` 명령으로 확인
- Cloudflare 대시보드에서 CNAME 레코드 확인

---

## 참고 자료

- Cloudflare Tunnel 공식 문서: https://developers.cloudflare.com/cloudflare-one/connections/connect-apps/
- Tunnel 관리: https://dash.cloudflare.com/ (Zero Trust → Access → Tunnels)

---

## 완료 체크리스트

- [ ] cloudflared 설치 완료
- [ ] Cloudflare 로그인 및 도메인 인증
- [ ] Tunnel 생성 (hyun-schedule)
- [ ] 설정 파일 구성 (cloudflare-tunnel-config.yml)
- [ ] DNS 라우팅 설정
- [ ] 수동 테스트 성공
- [ ] systemd 서비스 등록 및 시작
- [ ] nginx 중지 및 제거
- [ ] https://hyun-schedule.moondo.ai 접속 확인
- [ ] Google OAuth Redirect URI 업데이트
- [ ] OAuth 로그인 플로우 테스트

---

**마이그레이션 완료!** 🎉

이제 앱이 Cloudflare Tunnel을 통해 `hyun-schedule.moondo.ai`에서 안전하게 제공됩니다.
SSL은 Cloudflare가 자동으로 처리합니다.
