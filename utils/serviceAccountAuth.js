const { google } = require('googleapis');
const path = require('path');

// Service Account를 사용한 영구 인증
// 1. Google Cloud Console에서 Service Account 생성
// 2. 키 파일(.json) 다운로드
// 3. 캘린더를 Service Account 이메일과 공유

class ServiceAccountAuth {
  constructor() {
    // Service Account 키 파일 경로
    this.keyFile = path.join(__dirname, '../service_account_key/service-account-key.json');
    this.auth = null;
    this.calendar = null;
  }

  async initialize() {
    try {
      // Service Account 인증
      this.auth = new google.auth.GoogleAuth({
        keyFile: this.keyFile,
        scopes: [
          'https://www.googleapis.com/auth/calendar',
          'https://www.googleapis.com/auth/calendar.events',
          'https://www.googleapis.com/auth/calendar.settings.readonly'
        ]
      });

      const authClient = await this.auth.getClient();
      
      // Service Account가 캘린더 소유자를 대신하여 행동하도록 설정
      // subject를 설정하면 해당 사용자를 impersonate합니다
      // 단, 이는 Google Workspace 도메인에서만 작동합니다
      // 개인 Gmail 계정에서는 이 방법을 사용할 수 없습니다
      
      this.calendar = google.calendar({ version: 'v3', auth: authClient });
      
      console.log('Service Account authentication successful');
      return this.calendar;
    } catch (error) {
      console.error('Service Account authentication failed:', error);
      throw error;
    }
  }

  getCalendar() {
    if (!this.calendar) {
      throw new Error('Calendar not initialized. Call initialize() first.');
    }
    return this.calendar;
  }
}

module.exports = new ServiceAccountAuth();

/* 
설정 방법:
1. Google Cloud Console에서:
   - APIs & Services → Credentials
   - Create Credentials → Service Account
   - 이름 입력 후 Create
   - Keys 탭 → Add Key → Create new key → JSON
   - 다운로드한 파일을 service-account-key.json으로 저장

2. Google Calendar에서:
   - 설정 → 특정 캘린더 설정
   - "특정 사용자와 공유" 섹션
   - Service Account 이메일 추가 (xxx@project-id.iam.gserviceaccount.com)
   - "일정 변경" 권한 부여

3. 이 모듈 사용:
   const serviceAuth = require('./serviceAccountAuth');
   await serviceAuth.initialize();
   const calendar = serviceAuth.getCalendar();
*/