const { google } = require('googleapis');
const moment = require('moment-timezone');
const tokenManager = require('./tokenManager');
const serviceAuth = require('./serviceAccountAuth');

// Use the connected OAuth account for reading by default.
const USE_SERVICE_ACCOUNT_FOR_READ = process.env.GOOGLE_CALENDAR_USE_SERVICE_ACCOUNT === 'true';
const USE_OAUTH_FOR_CREATE = true; // Always use OAuth for event creation to support attendees

// Calendar ID used for availability and upcoming-event reads.
const CALENDAR_ID = process.env.GOOGLE_CALENDAR_ID || 'h@moondo.ai';

const getCalendarReadConfig = () => ({
  calendarId: CALENDAR_ID,
  useServiceAccount: USE_SERVICE_ACCOUNT_FOR_READ
});

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
      calendarId: CALENDAR_ID,
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

function calculateAvailableSlots({
  date,
  duration = 30,
  timeOfDay = 'all',
  userTimezone,
  serverTimezone,
  detectedLocation,
  events = [],
  now = new Date()
}) {
  const effectiveUserTimezone = userTimezone || serverTimezone;
  const dayStart = moment.tz(date, 'YYYY-MM-DD', true, effectiveUserTimezone).startOf('day');

  if (!dayStart.isValid()) {
    throw new Error(`Invalid calendar date: ${date}`);
  }

  const dayEnd = dayStart.clone().add(1, 'day');
  const busySlots = events
    .filter(event => event.status !== 'cancelled' && event.transparency !== 'transparent')
    .map(event => ({
      start: event.start.dateTime
        ? moment.parseZone(event.start.dateTime)
        : moment.tz(event.start.date, 'YYYY-MM-DD', true, serverTimezone),
      end: event.end.dateTime
        ? moment.parseZone(event.end.dateTime)
        : moment.tz(event.end.date, 'YYYY-MM-DD', true, serverTimezone)
    }))
    .filter(slot => slot.start.isValid() && slot.end.isValid());

  const availableSlots = [];
  const currentTime = dayStart.clone();

  while (currentTime.clone().add(duration, 'minutes').isSameOrBefore(dayEnd)) {
    const slotEnd = currentTime.clone().add(duration, 'minutes');
    const isBlocked = busySlots.some(busy =>
      currentTime.isBefore(busy.end) && slotEnd.isAfter(busy.start)
    );
    const isInPast = slotEnd.valueOf() <= now.getTime();
    const slotHour = currentTime.clone().tz(effectiveUserTimezone).hour();
    const matchesTimeOfDay =
      timeOfDay === 'all' ||
      (timeOfDay === 'morning' && slotHour < 12) ||
      (timeOfDay === 'afternoon' && slotHour >= 12);

    if (!isBlocked && !isInPast && matchesTimeOfDay) {
      availableSlots.push({
        start: currentTime.toISOString(),
        end: slotEnd.toISOString(),
        location: detectedLocation,
        timezone: serverTimezone
      });
    }

    currentTime.add(30, 'minutes');
  }

  return availableSlots;
}

async function getAvailableSlots(date, duration = 30, timeOfDay = 'all', userTimezone = null, hostTimezone = null) {
  try {
    const dateAtNoonUTC = new Date(`${date}T12:00:00.000Z`);
    const detectedLocation = hostTimezone
      ? (hostTimezone.includes('Seoul') ? 'KR' : 'US')
      : await detectLocation(dateAtNoonUTC);
    const serverTimezone = hostTimezone || (detectedLocation === 'KR'
      ? 'Asia/Seoul'
      : 'America/Los_Angeles');
    const effectiveUserTimezone = userTimezone || serverTimezone;
    const dayStart = moment.tz(date, 'YYYY-MM-DD', true, effectiveUserTimezone).startOf('day');

    if (!dayStart.isValid()) {
      throw new Error(`Invalid calendar date: ${date}`);
    }

    const dayEnd = dayStart.clone().add(1, 'day');
    const calendar = await getCalendarForRead();
    const response = await calendar.events.list({
      calendarId: CALENDAR_ID,
      timeMin: dayStart.toISOString(),
      timeMax: dayEnd.toISOString(),
      singleEvents: true,
      orderBy: 'startTime',
      timeZone: serverTimezone
    });

    const slots = calculateAvailableSlots({
      date,
      duration,
      timeOfDay,
      userTimezone: effectiveUserTimezone,
      serverTimezone,
      detectedLocation,
      events: response.data.items || []
    });

    console.log(`Found ${slots.length} available slots for ${date} in ${effectiveUserTimezone}`);
    return slots;
  } catch (error) {
    console.error('Error fetching calendar events:', error.message);
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
      calendarId: CALENDAR_ID,
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
  getCalendarReadConfig,
  calculateAvailableSlots,
  getAvailableSlots,
  createEvent,
  detectLocation,
  getUpcomingEvents
};
