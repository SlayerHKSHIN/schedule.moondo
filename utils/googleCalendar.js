const { google } = require('googleapis');
const tokenManager = require('./tokenManager');
const serviceAuth = require('./serviceAccountAuth');

// Use Service Account for reading, OAuth for creating events with attendees
const USE_SERVICE_ACCOUNT_FOR_READ = true;
const USE_OAUTH_FOR_CREATE = true; // Always use OAuth for event creation to support attendees

// Calendar ID to use (needed for Service Account)
const CALENDAR_ID = 'haneul96@gmail.com';

// Initialize Service Account if enabled
let serviceAccountInitialized = false;

const initializeServiceAccount = async () => {
  if (USE_SERVICE_ACCOUNT_FOR_READ && !serviceAccountInitialized) {
    try {
      await serviceAuth.initialize();
      serviceAccountInitialized = true;
      console.log('Service Account authentication initialized for reading');
    } catch (error) {
      console.error('Failed to initialize Service Account, falling back to OAuth:', error);
      return false;
    }
  }
  return serviceAccountInitialized;
};

// Get calendar instance for reading operations
const getCalendarForRead = async () => {
  if (USE_SERVICE_ACCOUNT_FOR_READ) {
    await initializeServiceAccount();
    if (serviceAccountInitialized) {
      return serviceAuth.getCalendar();
    }
  }
  // Fallback to OAuth
  const oauth2Client = await tokenManager.getValidClient();
  return google.calendar({ version: 'v3', auth: oauth2Client });
};

// Get calendar instance for creating events (try OAuth first, fallback to service account)
const getCalendarForCreate = async () => {
  try {
    // Try OAuth first for attendee support
    const oauth2Client = await tokenManager.getValidClient();
    // OAuth client is already validated and refreshed if needed
    return google.calendar({ version: 'v3', auth: oauth2Client });
  } catch (error) {
    console.log('OAuth failed, falling back to Service Account for event creation:', error.message);
    // Fallback to Service Account
    await initializeServiceAccount();
    if (serviceAccountInitialized) {
      return serviceAuth.getCalendar();
    }
    throw new Error('Both OAuth and Service Account authentication failed');
  }
};

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
    
    const calendar = await getCalendarForRead();
    const events = await calendar.events.list({
      calendarId: USE_SERVICE_ACCOUNT_FOR_READ ? CALENDAR_ID : 'primary',
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

    // 2024년 8월 31일 이전은 한국으로 가정
    const aug31 = new Date('2024-08-31');
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

async function getAvailableSlots(date, duration = 30, timeOfDay = 'all', userTimezone = null, hostTimezone = null) {
  try {
    // date를 Date 객체로 변환
    const dateObj = new Date(date);
    
    // hostTimezone이 제공되면 사용, 아니면 위치 감지
    let workStart, workEnd, serverTimezone;
    
    let detectedLocation;
    if (hostTimezone) {
      // 호스트가 설정한 시간대 사용
      serverTimezone = hostTimezone;
      workStart = 8;
      workEnd = 21;
      detectedLocation = hostTimezone.includes('Seoul') ? 'KR' : 'US';
      console.log(`Using host timezone: ${hostTimezone}`);
    } else {
      // 위치 감지 (fallback)
      detectedLocation = await detectLocation(dateObj);
      console.log(`Detected location for ${date}: ${detectedLocation}`);
      
      if (detectedLocation === 'KR') {
        // 한국 근무시간: 오전 8시 ~ 오후 9시 (KST)
        workStart = 8;
        workEnd = 21;
        serverTimezone = 'Asia/Seoul';
      } else {
        // 미국 근무시간: 오전 8시 ~ 오후 9시 (PST/PDT)
        workStart = 8;
        workEnd = 21;
        serverTimezone = 'America/Los_Angeles';
      }
    }
    
    console.log(`User timezone: ${userTimezone}`);

    // 사용자 시간대가 제공되지 않으면 서버 시간대를 사용
    const effectiveUserTimezone = userTimezone || serverTimezone;
    
    // 사용자가 선택한 날짜를 사용자 시간대 기준으로 설정
    const dateStr = dateObj.toLocaleDateString('en-CA'); // YYYY-MM-DD format
    
    // 사용자가 선택한 날짜에 대해, 사용자 시간대 기준으로 하루의 시작과 끝을 계산
    const userDayStart = new Date(`${dateStr}T00:00:00`);
    const userDayEnd = new Date(`${dateStr}T23:59:59`);
    
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
    
    // 사용자 시간대 오프셋 계산
    const userTzOffset = getTimezoneOffset(effectiveUserTimezone, userDayStart);
    const serverTzOffset = getTimezoneOffset(serverTimezone, userDayStart);
    
    // 사용자가 선택한 날짜를 UTC로 변환
    const userDayStartUTC = new Date(userDayStart);
    userDayStartUTC.setMinutes(userDayStartUTC.getMinutes() - userTzOffset);
    const userDayEndUTC = new Date(userDayEnd);
    userDayEndUTC.setMinutes(userDayEndUTC.getMinutes() - userTzOffset);
    
    // 서버(현 위치)의 근무시간을 서버 시간대 기준으로 설정
    // 며칠에 걸쳐 있을 수 있으므로, 사용자 날짜 범위를 커버하는 서버 날짜 범위 계산
    const serverSearchStart = new Date(userDayStartUTC);
    serverSearchStart.setHours(serverSearchStart.getHours() - 24);
    const serverSearchEnd = new Date(userDayEndUTC);
    serverSearchEnd.setHours(serverSearchEnd.getHours() + 24);
    
    // 서버 근무시간을 UTC로 변환
    const serverWorkingSlots = [];
    const currentDate = new Date(serverSearchStart);
    currentDate.setHours(0, 0, 0, 0);
    
    while (currentDate <= serverSearchEnd) {
      const dayStr = currentDate.toISOString().split('T')[0];
      const dayStart = new Date(`${dayStr}T${String(workStart).padStart(2, '0')}:00:00`);
      const dayEnd = new Date(`${dayStr}T${String(workEnd).padStart(2, '0')}:00:00`);
      
      // 서버 시간대로 UTC 변환
      dayStart.setMinutes(dayStart.getMinutes() - serverTzOffset);
      dayEnd.setMinutes(dayEnd.getMinutes() - serverTzOffset);
      
      serverWorkingSlots.push({ start: dayStart, end: dayEnd });
      currentDate.setDate(currentDate.getDate() + 1);
    }
    
    console.log(`User selected date: ${dateStr} in ${effectiveUserTimezone}`);
    console.log(`Server working hours in ${serverTimezone}:`);
    serverWorkingSlots.forEach(slot => {
      console.log(`- ${slot.start.toISOString()} to ${slot.end.toISOString()}`);
    });

    // 캘린더 조회 범위는 서버 근무시간 범위 전체
    const calendarSearchStart = serverSearchStart;
    const calendarSearchEnd = serverSearchEnd;
    console.log(`Calendar search range:`);
    console.log(`- Search start: ${calendarSearchStart.toISOString()}`);
    console.log(`- Search end: ${calendarSearchEnd.toISOString()}`);

    const calendar = await getCalendarForRead();
    const events = await calendar.events.list({
      calendarId: USE_SERVICE_ACCOUNT_FOR_READ ? CALENDAR_ID : 'primary',
      timeMin: calendarSearchStart.toISOString(),
      timeMax: calendarSearchEnd.toISOString(),
      singleEvents: true,
      orderBy: 'startTime',
      timeZone: serverTimezone
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
    
    // 모든 서버 근무시간 슬롯에 대해 처리
    for (const workingSlot of serverWorkingSlots) {
      let currentTime = new Date(workingSlot.start);
      
      while (currentTime < workingSlot.end) {
      const slotEnd = new Date(currentTime.getTime() + duration * 60000);
      
        // 서버 시간으로 8시와 10시30분 슬롯 체크
        const localHour = new Date(currentTime.toLocaleString("en-US", {timeZone: serverTimezone})).getHours();
        const localMinutes = new Date(currentTime.toLocaleString("en-US", {timeZone: serverTimezone})).getMinutes();
      
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
        
        // 슬롯이 사용자가 선택한 날짜 범위에 포함되는지 확인
        const slotInUserDay = (currentTime >= userDayStartUTC && currentTime < userDayEndUTC) ||
                             (slotEnd > userDayStartUTC && slotEnd <= userDayEndUTC);
        
        if (!isBlocked && slotEnd <= workingSlot.end && !isInPast && slotInUserDay) {
          // Check time of day filter
          const slotHour = new Date(currentTime.toLocaleString("en-US", {timeZone: serverTimezone})).getHours();
        
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
              location: detectedLocation,
              timezone: serverTimezone
            });
          }
        }

        currentTime = new Date(currentTime.getTime() + 30 * 60000);
      }
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
    console.log(`[CREATE_EVENT] Starting event creation with details:`, JSON.stringify(eventDetails, null, 2));
    
    // 이벤트 날짜의 위치 감지
    const location = await detectLocation(new Date(eventDetails.start));
    const timezone = location === 'KR' ? 'Asia/Seoul' : 'America/Los_Angeles';
    
    console.log(`[CREATE_EVENT] Detected location: ${location}, Timezone: ${timezone}`);

    // ISO string이 이미 UTC 시간대를 포함하고 있으므로,
    // 그대로 사용하되 timeZone은 표시용으로만 사용
    
    // Always use OAuth for event creation to support attendees
    const event = {
      summary: eventDetails.summary,
      description: eventDetails.description,
      start: {
        dateTime: eventDetails.start
      },
      end: {
        dateTime: eventDetails.end
      },
      attendees: eventDetails.attendees 
        ? eventDetails.attendees.map(email => ({ email }))
        : [{ email: eventDetails.attendeeEmail }],
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

    console.log(`[CREATE_EVENT] Calling Google Calendar API with event:`, JSON.stringify(event, null, 2));
    console.log(`[CREATE_EVENT] Getting calendar client for event creation`);

    const calendar = await getCalendarForCreate();
    // Determine calendar ID based on which auth method is being used
    const isUsingServiceAccount = serviceAccountInitialized;
    const calendarId = isUsingServiceAccount ? CALENDAR_ID : 'primary';
    console.log(`[CREATE_EVENT] Using ${isUsingServiceAccount ? 'Service Account' : 'OAuth'} for event creation with calendar ID: ${calendarId}`);

    const response = await calendar.events.insert({
      calendarId: calendarId,
      resource: event,
      sendNotifications: true,
      conferenceDataVersion: eventDetails.meetingType === 'video' ? 1 : 0
    });
    
    console.log(`[CREATE_EVENT] Google Calendar API response:`, JSON.stringify(response.data, null, 2));

    return response.data;
  } catch (error) {
    console.error('Error creating calendar event:', error);
    throw error;
  }
}

// Get upcoming events from Google Calendar
async function getUpcomingEvents(limit = 3) {
  try {
    const now = new Date();
    const calendar = await getCalendarForRead();
    const response = await calendar.events.list({
      calendarId: USE_SERVICE_ACCOUNT_FOR_READ ? CALENDAR_ID : 'primary',
      timeMin: now.toISOString(),
      maxResults: limit,
      singleEvents: true,
      orderBy: 'startTime'
    });

    const events = response.data.items;
    if (!events || events.length === 0) {
      return [];
    }

    return events.map(event => {
      const start = event.start.dateTime || event.start.date;
      const end = event.end.dateTime || event.end.date;
      
      // Parse attendees
      const attendees = event.attendees || [];
      const attendeeNames = attendees
        .filter(a => !a.self)
        .map(a => a.displayName || a.email)
        .join(', ');

      return {
        id: event.id,
        summary: event.summary || 'No title',
        start: start,
        end: end,
        location: event.location || '',
        description: event.description || '',
        attendees: attendeeNames,
        meetLink: event.hangoutLink || '',
        status: event.status
      };
    });
  } catch (error) {
    console.error('Error fetching upcoming events:', error);
    return [];
  }
}

module.exports = {
  getAvailableSlots,
  createEvent,
  detectLocation,
  getUpcomingEvents
};