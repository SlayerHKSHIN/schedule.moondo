const { google } = require('googleapis');
const userStore = require('./userStore');

// Create OAuth2 client for a specific user
function createUserOAuth2Client(user) {
  const oauth2Client = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    process.env.GOOGLE_REDIRECT_URI || 'http://localhost:4312/api/auth/google/callback'
  );
  
  if (user.refreshToken) {
    oauth2Client.setCredentials({
      refresh_token: user.refreshToken,
      access_token: user.accessToken,
      expiry_date: user.tokenExpiry
    });
  }
  
  return oauth2Client;
}

// Get calendar instance for a user
function getUserCalendar(user) {
  const oauth2Client = createUserOAuth2Client(user);
  return google.calendar({ version: 'v3', auth: oauth2Client });
}

// User-specific calendar functions
const userCalendar = {
  // Get available slots for a user
  async getAvailableSlots(user, date, timezone) {
    try {
      const calendar = getUserCalendar(user);
      
      // Set date range for the selected day
      const startOfDay = new Date(date);
      startOfDay.setHours(0, 0, 0, 0);
      
      const endOfDay = new Date(date);
      endOfDay.setHours(23, 59, 59, 999);
      
      // Get existing events
      const response = await calendar.events.list({
        calendarId: 'primary',
        timeMin: startOfDay.toISOString(),
        timeMax: endOfDay.toISOString(),
        singleEvents: true,
        orderBy: 'startTime',
        timeZone: timezone
      });
      
      const busySlots = response.data.items || [];
      
      // Generate available slots (9 AM to 5 PM by default)
      const slots = [];
      const workStart = 9; // 9 AM
      const workEnd = 17; // 5 PM
      const slotDuration = 30; // 30 minutes
      
      for (let hour = workStart; hour < workEnd; hour++) {
        for (let minute = 0; minute < 60; minute += slotDuration) {
          const slotStart = new Date(date);
          slotStart.setHours(hour, minute, 0, 0);
          
          const slotEnd = new Date(slotStart);
          slotEnd.setMinutes(slotEnd.getMinutes() + slotDuration);
          
          // Check if slot conflicts with existing events
          const isAvailable = !busySlots.some(event => {
            const eventStart = new Date(event.start.dateTime || event.start.date);
            const eventEnd = new Date(event.end.dateTime || event.end.date);
            
            return (slotStart >= eventStart && slotStart < eventEnd) ||
                   (slotEnd > eventStart && slotEnd <= eventEnd) ||
                   (slotStart <= eventStart && slotEnd >= eventEnd);
          });
          
          if (isAvailable) {
            const displayHour = hour > 12 ? hour - 12 : hour === 0 ? 12 : hour;
            const period = hour >= 12 ? 'PM' : 'AM';
            const timeStr = `${displayHour}:${minute.toString().padStart(2, '0')} ${period}`;
            
            slots.push({
              time: timeStr,
              start: slotStart.toISOString(),
              end: slotEnd.toISOString()
            });
          }
        }
      }
      
      return {
        slots,
        timezone,
        date: date
      };
      
    } catch (error) {
      console.error('Error getting available slots:', error);
      throw error;
    }
  },
  
  // Create calendar event for a user
  async createEvent(user, eventDetails) {
    try {
      const calendar = getUserCalendar(user);
      
      const event = {
        summary: eventDetails.summary,
        description: eventDetails.description,
        start: {
          dateTime: eventDetails.start,
          timeZone: eventDetails.timezone || 'America/Los_Angeles'
        },
        end: {
          dateTime: eventDetails.end,
          timeZone: eventDetails.timezone || 'America/Los_Angeles'
        },
        attendees: eventDetails.attendees || [],
        conferenceData: eventDetails.meetingType === 'video' ? {
          createRequest: {
            requestId: Date.now().toString(),
            conferenceSolutionKey: { type: 'hangoutsMeet' }
          }
        } : undefined
      };
      
      const response = await calendar.events.insert({
        calendarId: 'primary',
        resource: event,
        conferenceDataVersion: eventDetails.meetingType === 'video' ? 1 : undefined,
        sendUpdates: 'all'
      });
      
      return response.data;
      
    } catch (error) {
      console.error('Error creating event:', error);
      
      // Check if token expired and try to refresh
      if (error.response?.status === 401) {
        // Token might be expired, try to refresh
        const oauth2Client = createUserOAuth2Client(user);
        const { credentials } = await oauth2Client.refreshAccessToken();
        
        // Save new tokens
        userStore.updateTokens(user.googleId, {
          accessToken: credentials.access_token,
          tokenExpiry: credentials.expiry_date
        });
        
        // Retry with new token
        user.accessToken = credentials.access_token;
        user.tokenExpiry = credentials.expiry_date;
        return this.createEvent(user, eventDetails);
      }
      
      throw error;
    }
  },
  
  // Delete calendar event
  async deleteEvent(user, eventId) {
    try {
      const calendar = getUserCalendar(user);
      
      await calendar.events.delete({
        calendarId: 'primary',
        eventId: eventId
      });
      
      return { success: true };
      
    } catch (error) {
      console.error('Error deleting event:', error);
      throw error;
    }
  },
  
  // Get user's calendar settings
  async getCalendarSettings(user) {
    try {
      const calendar = getUserCalendar(user);
      
      const response = await calendar.settings.list();
      
      return response.data.items;
      
    } catch (error) {
      console.error('Error getting calendar settings:', error);
      throw error;
    }
  },
  
  // Get user's calendar list
  async getCalendarList(user) {
    try {
      const calendar = getUserCalendar(user);
      
      const response = await calendar.calendarList.list();
      
      return response.data.items;
      
    } catch (error) {
      console.error('Error getting calendar list:', error);
      throw error;
    }
  }
};

module.exports = userCalendar;