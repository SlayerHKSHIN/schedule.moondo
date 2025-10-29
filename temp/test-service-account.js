const { google } = require('googleapis');
const path = require('path');

async function testServiceAccount() {
  try {
    // Service Account 인증
    const auth = new google.auth.GoogleAuth({
      keyFile: path.join(__dirname, 'service_account_key/service-account-key.json'),
      scopes: [
        'https://www.googleapis.com/auth/calendar',
        'https://www.googleapis.com/auth/calendar.events'
      ]
    });

    const authClient = await auth.getClient();
    const calendar = google.calendar({ version: 'v3', auth: authClient });
    
    console.log('Service Account authentication successful');
    
    // 캘린더 목록 가져오기
    console.log('\nTrying to list calendars...');
    const calendarList = await calendar.calendarList.list();
    console.log('Available calendars:', calendarList.data.items);
    
    // 직접 접근 시도
    console.log('\nTrying direct access to haneul96@gmail.com calendar...');
    const events = await calendar.events.list({
      calendarId: 'haneul96@gmail.com',
      timeMin: new Date().toISOString(),
      maxResults: 10,
      singleEvents: true,
      orderBy: 'startTime'
    });
    
    console.log('Successfully accessed calendar!');
    console.log('Found', events.data.items.length, 'events');
    
  } catch (error) {
    console.error('Error:', error.message);
    if (error.response) {
      console.error('Response data:', JSON.stringify(error.response.data, null, 2));
    }
  }
}

testServiceAccount();