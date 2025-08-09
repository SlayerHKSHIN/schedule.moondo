const { google } = require('googleapis');

const oauth2Client = new google.auth.OAuth2(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET,
  process.env.GOOGLE_REDIRECT_URI
);

oauth2Client.setCredentials({
  refresh_token: process.env.GOOGLE_REFRESH_TOKEN
});

const calendar = google.calendar({ version: 'v3', auth: oauth2Client });

// 비행기 일정 관련 키워드
const FLIGHT_KEYWORDS = ['flight', '비행', '✈️', 'airport', '공항', 'boarding', '탑승'];

// 위치 캐시 (날짜별로 캐싱)
const locationCache = new Map();

// 위치 추정 함수
async function detectLocation(date) {
  const dateStr = date.toISOString().split('T')[0];
  
  // 캐시 확인
  if (locationCache.has(dateStr)) {
    return locationCache.get(dateStr);
  }
  try {
    // 일주일 전부터 해당 날짜까지의 이벤트를 조회
    const searchStart = new Date(date);
    searchStart.setDate(searchStart.getDate() - 7);
    
    const events = await calendar.events.list({
      calendarId: 'primary',
      timeMin: searchStart.toISOString(),
      timeMax: new Date(date.getTime() + 24 * 60 * 60 * 1000).toISOString(),
      singleEvents: true,
      orderBy: 'startTime'
    });

    let currentLocation = 'US'; // 기본값: 미국
    const targetDate = new Date(date).getTime();

    // 이벤트를 역순으로 확인하여 가장 최근의 비행 일정 찾기
    const sortedEvents = events.data.items.sort((a, b) => 
      new Date(b.start.dateTime || b.start.date) - new Date(a.start.dateTime || a.start.date)
    );

    for (const event of sortedEvents) {
      const eventDate = new Date(event.start.dateTime || event.start.date).getTime();
      if (eventDate > targetDate) continue;

      const title = (event.summary || '').toLowerCase();
      const description = (event.description || '').toLowerCase();
      const location = (event.location || '').toLowerCase();
      
      // 비행기 일정 감지
      const isFlightEvent = FLIGHT_KEYWORDS.some(keyword => 
        title.includes(keyword.toLowerCase()) || 
        description.includes(keyword.toLowerCase())
      );

      if (isFlightEvent) {
        // 한국행 비행기 감지
        if (title.includes('korea') || title.includes('한국') || 
            title.includes('seoul') || title.includes('서울') ||
            title.includes('icn') || title.includes('인천') ||
            location.includes('korea') || location.includes('seoul')) {
          currentLocation = 'KR';
          break;
        }
        // 미국행 비행기 감지
        else if (title.includes('usa') || title.includes('미국') || 
                 title.includes('america') || title.includes('us') ||
                 location.includes('usa') || location.includes('america')) {
          currentLocation = 'US';
          break;
        }
      }
    }

    // 8월 31일 이전은 한국으로 가정
    const aug31 = new Date('2025-08-31');
    if (date <= aug31) {
      currentLocation = 'KR';
    }

    // 캐시에 저장
    locationCache.set(dateStr, currentLocation);
    return currentLocation;
  } catch (error) {
    console.error('Error detecting location:', error);
    // 오류 시 날짜 기반 기본값 반환
    const aug31 = new Date('2025-08-31');
    const defaultLocation = date <= aug31 ? 'KR' : 'US';
    locationCache.set(dateStr, defaultLocation);
    return defaultLocation;
  }
}

async function getAvailableSlots(date, duration = 30, timeOfDay = 'all', userTimezone = null) {
  try {
    // date를 Date 객체로 변환
    const dateObj = new Date(date);
    
    // 위치 감지
    const location = await detectLocation(dateObj);
    console.log(`Detected location for ${date}: ${location}`);
    console.log(`User timezone: ${userTimezone}`);
    
    // Get recurring breaks (removed for now - was causing delays)

    // 위치에 따른 근무시간 설정
    let workStart, workEnd, timezone;
    
    if (location === 'KR') {
      // 한국 근무시간: 오전 8시 ~ 오후 9시 (KST)
      workStart = 8;
      workEnd = 21;
      timezone = 'Asia/Seoul';
    } else {
      // 미국 근무시간: 오전 8시 ~ 오후 9시 (PST/PDT)
      workStart = 8;
      workEnd = 21;
      timezone = 'America/Los_Angeles';
    }

    // 사용자가 선택한 날짜를 서버 시간대 기준으로 변환
    // 예: 캘리포니아 사용자가 8월 9일 선택 -> 한국 시간으로는 8월 9일-10일에 걸침
    const dateStr = dateObj.toLocaleDateString('en-CA'); // YYYY-MM-DD format
    
    // 오피스 시간을 해당 시간대의 시간으로 설정
    // 예: 한국 오전 8시 = 2025-08-09T08:00:00+09:00
    // 예: 미국 오전 8시 = 2025-08-09T08:00:00-07:00 (PDT)
    
    // 시간대별 오프셋 계산 (분 단위)
    const getTimezoneOffset = (tz, dateToCheck) => {
      if (tz === 'Asia/Seoul') {
        return 540; // UTC+9 = 540 minutes offset from UTC
      } else if (tz === 'America/Los_Angeles') {
        // PST/PDT 확인
        // 8월은 일반적으로 PDT (UTC-7)
        const month = dateToCheck.getMonth();
        // 대략적으로 3월-11월은 DST
        const isDST = month >= 2 && month <= 10;
        return isDST ? -420 : -480; // PDT = UTC-7 (-420), PST = UTC-8 (-480)
      }
      return 0;
    };
    
    const checkDate = new Date(`${dateStr}T12:00:00`);
    const tzOffsetMinutes = getTimezoneOffset(timezone, checkDate);
    
    // 오피스 시간을 UTC로 변환
    const startOfDay = new Date(`${dateStr}T${String(workStart).padStart(2, '0')}:00:00`);
    const endOfDay = new Date(`${dateStr}T${String(workEnd).padStart(2, '0')}:00:00`);
    
    // 시간대 오프셋 적용 (local time -> UTC)
    startOfDay.setMinutes(startOfDay.getMinutes() - tzOffsetMinutes);
    endOfDay.setMinutes(endOfDay.getMinutes() - tzOffsetMinutes);
    
    console.log(`Working hours for ${dateStr} in ${timezone}:`);
    console.log(`- Start: ${startOfDay.toISOString()} (${workStart}:00 local)`);
    console.log(`- End: ${endOfDay.toISOString()} (${workEnd}:00 local)`);

    // 사용자 시간대를 고려하여 캘린더 조회 범위 확장
    // 예: 캘리포니아 사용자가 8월 9일 선택 시, 한국 캘린더는 8월 9일-10일 범위를 조회해야 함
    let calendarSearchStart = new Date(startOfDay);
    let calendarSearchEnd = new Date(endOfDay);
    
    // 사용자와 서버 시간대가 다른 경우, 조회 범위를 하루 더 확장
    if (userTimezone && userTimezone !== timezone) {
      // 앞뒤로 24시간씩 확장하여 시간대 차이 커버
      calendarSearchStart.setHours(calendarSearchStart.getHours() - 24);
      calendarSearchEnd.setHours(calendarSearchEnd.getHours() + 24);
      console.log(`Extended calendar search range for timezone difference:`);
      console.log(`- Search start: ${calendarSearchStart.toISOString()}`);
      console.log(`- Search end: ${calendarSearchEnd.toISOString()}`);
    }

    const events = await calendar.events.list({
      calendarId: 'primary',
      timeMin: calendarSearchStart.toISOString(),
      timeMax: calendarSearchEnd.toISOString(),
      singleEvents: true,
      orderBy: 'startTime',
      timeZone: timezone
    });

    console.log(`Found ${events.data.items.length} events for ${dateStr}:`);
    events.data.items.forEach(event => {
      console.log(`- ${event.summary}: ${event.start.dateTime} to ${event.end.dateTime}`);
    });

    const busySlots = events.data.items.map(event => ({
      start: new Date(event.start.dateTime || event.start.date),
      end: new Date(event.end.dateTime || event.end.date),
      summary: event.summary
    }));

    console.log('Busy slots:');
    busySlots.forEach(slot => {
      console.log(`- ${slot.summary}: ${slot.start.toISOString()} to ${slot.end.toISOString()}`);
    });

    const availableSlots = [];
    let currentTime = new Date(startOfDay);

    let slotCount = 0;
    while (currentTime < endOfDay) {
      const slotEnd = new Date(currentTime.getTime() + duration * 60000);
      
      // 한국 시간으로 8시와 10시30분 슬롯 체크
      const localHour = new Date(currentTime.toLocaleString("en-US", {timeZone: timezone})).getHours();
      const localMinutes = new Date(currentTime.toLocaleString("en-US", {timeZone: timezone})).getMinutes();
      
      if ((localHour === 8 && localMinutes === 0) || (localHour === 10 && localMinutes === 30)) {
        console.log(`\nChecking slot at ${localHour}:${String(localMinutes).padStart(2, '0')} local time:`);
        console.log(`- Current time: ${currentTime.toISOString()}`);
        console.log(`- Slot end: ${slotEnd.toISOString()}`);
      }
      
      const isBlocked = busySlots.some(busy => {
        const blocked = (currentTime >= busy.start && currentTime < busy.end) ||
          (slotEnd > busy.start && slotEnd <= busy.end) ||
          (currentTime <= busy.start && slotEnd >= busy.end);
        
        if ((localHour === 8 && localMinutes === 0) || (localHour === 10 && localMinutes === 30)) {
          console.log(`  Checking against ${busy.summary}: ${busy.start.toISOString()} to ${busy.end.toISOString()}`);
          console.log(`  - currentTime >= busy.start: ${currentTime >= busy.start}`);
          console.log(`  - currentTime < busy.end: ${currentTime < busy.end}`);
          console.log(`  - Blocked: ${blocked}`);
        }
        
        return blocked;
      });

      // 현재 시간 확인 (과거 슬롯 제외)
      const now = new Date();
      const isInPast = slotEnd <= now;
      
      // 디버깅용 로그 (첫 몇 개 슬롯만)
      if (slotCount < 3) {
        console.log(`  Slot ${slotCount + 1}: ${currentTime.toISOString()} to ${slotEnd.toISOString()}`);
        console.log(`    - Now: ${now.toISOString()}`);
        console.log(`    - Is in past? ${isInPast}`);
        console.log(`    - Is blocked? ${isBlocked}`);
      }
      
      if (!isBlocked && slotEnd <= endOfDay && !isInPast) {
        // Check time of day filter
        const slotHour = new Date(currentTime.toLocaleString("en-US", {timeZone: timezone})).getHours();
        
        let includeSlot = true;
        if (timeOfDay === 'morning' && slotHour >= 12) {
          includeSlot = false;
        } else if (timeOfDay === 'afternoon' && slotHour < 12) {
          includeSlot = false;
        }
        
        if (includeSlot) {
          availableSlots.push({
            start: currentTime.toISOString(),
            end: slotEnd.toISOString(),
            location: location,
            timezone: timezone
          });
          slotCount++;
        }
      }

      currentTime = new Date(currentTime.getTime() + 30 * 60000);
    }

    console.log(`Total available slots: ${availableSlots.length}`);
    return availableSlots;
  } catch (error) {
    console.error('Error fetching calendar events:', error);
    throw error;
  }
}

async function createEvent(eventDetails) {
  try {
    // 이벤트 날짜의 위치 감지
    const location = await detectLocation(new Date(eventDetails.start));
    const timezone = location === 'KR' ? 'Asia/Seoul' : 'America/Los_Angeles';

    const event = {
      summary: eventDetails.summary,
      description: eventDetails.description,
      start: {
        dateTime: eventDetails.start,
        timeZone: timezone
      },
      end: {
        dateTime: eventDetails.end,
        timeZone: timezone
      },
      attendees: [
        { email: eventDetails.attendeeEmail }
      ],
      reminders: {
        useDefault: false,
        overrides: [
          { method: 'email', minutes: 24 * 60 },
          { method: 'popup', minutes: 30 }
        ]
      }
    };

    // 화상회의인 경우 Google Meet 추가
    if (eventDetails.meetingType === 'video') {
      event.conferenceData = {
        createRequest: {
          requestId: `meet-${Date.now()}`,
          conferenceSolutionKey: {
            type: 'hangoutsMeet'
          }
        }
      };
    } else if (eventDetails.meetingType === 'in-person' && eventDetails.locationInfo) {
      // 대면 미팅인 경우 위치 정보 추가
      const startHour = new Date(eventDetails.start).getHours();
      let meetingLocation = null;
      
      if (startHour < 12 && eventDetails.locationInfo.morning) {
        meetingLocation = eventDetails.locationInfo.morning;
      } else if (startHour >= 12 && eventDetails.locationInfo.afternoon) {
        meetingLocation = eventDetails.locationInfo.afternoon;
      } else if (eventDetails.locationInfo.morning && eventDetails.locationInfo.afternoon && 
                 eventDetails.locationInfo.morning === eventDetails.locationInfo.afternoon) {
        meetingLocation = eventDetails.locationInfo.morning;
      }
      
      if (meetingLocation) {
        event.location = meetingLocation;
      }
    }

    const response = await calendar.events.insert({
      calendarId: 'primary',
      resource: event,
      sendNotifications: true,
      conferenceDataVersion: eventDetails.meetingType === 'video' ? 1 : 0
    });

    return response.data;
  } catch (error) {
    console.error('Error creating calendar event:', error);
    throw error;
  }
}

module.exports = {
  getAvailableSlots,
  createEvent,
  detectLocation
};