const express = require('express');
const router = express.Router();
const fs = require('fs').promises;
const path = require('path');
const { google } = require('googleapis');
const { createEvent, detectLocation, getUpcomingEvents } = require('../utils/googleCalendar');
const tokenManager = require('../utils/tokenManager');

// Store recurring break times (in production, use a database)
const recurringBreaks = [];

// File paths for data
const LOCATIONS_FILE = path.join(__dirname, '..', 'data', 'locations.json');
const AVAILABILITY_FILE = path.join(__dirname, '..', 'data', 'availability.json');

// Initialize data from files
let locationData = new Map();
let availabilityData = {};

// Load location data from file on startup
async function loadLocationData() {
  try {
    const data = await fs.readFile(LOCATIONS_FILE, 'utf8');
    const jsonData = JSON.parse(data);
    locationData = new Map(Object.entries(jsonData));
    console.log(`Loaded ${locationData.size} locations from backup`);
  } catch (error) {
    console.log('No existing location data found, starting fresh');
  }
}

// Save location data to file
async function saveLocationData() {
  try {
    const jsonData = Object.fromEntries(locationData);
    await fs.writeFile(LOCATIONS_FILE, JSON.stringify(jsonData, null, 2));
    console.log('Location data saved to backup');
  } catch (error) {
    console.error('Error saving location data:', error);
  }
}

// Load availability data from file on startup
async function loadAvailabilityData() {
  try {
    const data = await fs.readFile(AVAILABILITY_FILE, 'utf8');
    availabilityData = JSON.parse(data);
    console.log('Loaded availability data from backup');
  } catch (error) {
    console.log('No existing availability data found, using defaults');
    // Set default availability
    availabilityData = {
      Monday: { enabled: true, start: '08:00', end: '21:00' },
      Tuesday: { enabled: true, start: '08:00', end: '21:00' },
      Wednesday: { enabled: true, start: '08:00', end: '21:00' },
      Thursday: { enabled: true, start: '08:00', end: '21:00' },
      Friday: { enabled: true, start: '08:00', end: '21:00' },
      Saturday: { enabled: true, start: '08:00', end: '21:00' },
      Sunday: { enabled: true, start: '08:00', end: '21:00' }
    };
  }
}

// Save availability data to file
async function saveAvailabilityData() {
  try {
    await fs.writeFile(AVAILABILITY_FILE, JSON.stringify(availabilityData, null, 2));
    console.log('Availability data saved to backup');
  } catch (error) {
    console.error('Error saving availability data:', error);
  }
}

// Load data on startup
loadLocationData();
loadAvailabilityData();

// Admin authentication
router.post('/login', (req, res) => {
  const { password } = req.body;
  
  if (password === process.env.ADMIN_PASSWORD) {
    res.json({ success: true, message: 'Logged in successfully' });
  } else {
    res.status(401).json({ success: false, message: 'Invalid password' });
  }
});

router.post('/break-time', async (req, res) => {
  try {
    const { date, startTime, endTime, recurring, recurringDays, timezone } = req.body;

    if (recurring && recurringDays.length > 0) {
      // Store recurring breaks with timezone info
      recurringBreaks.push({
        days: recurringDays,
        startTime,
        endTime,
        timezone: timezone || 'America/Los_Angeles'
      });
      
      res.json({ message: 'Recurring break time added successfully' });
    } else if (date) {
      // Create a one-time break event in calendar
      // Detect the location to determine the correct timezone
      const location = await detectLocation(new Date(date));
      const timezone = location === 'KR' ? 'Asia/Seoul' : 'America/Los_Angeles';
      
      // Create Date objects in the detected timezone
      // For Korea (UTC+9), we need to subtract 9 hours from the local time to get UTC
      // For US West Coast (UTC-8/-7), we need to add 8/7 hours to get UTC
      let startDateTime, endDateTime;
      
      if (timezone === 'Asia/Seoul') {
        // Korea time - user enters 12:00, we want it to stay 12:00 KST
        startDateTime = new Date(`${date}T${startTime}:00+09:00`);
        endDateTime = new Date(`${date}T${endTime}:00+09:00`);
      } else {
        // US Pacific time - determine if DST is in effect
        const testDate = new Date(date);
        const jan = new Date(testDate.getFullYear(), 0, 1);
        const jul = new Date(testDate.getFullYear(), 6, 1);
        const isDST = testDate.getTimezoneOffset() < Math.max(jan.getTimezoneOffset(), jul.getTimezoneOffset());
        const offset = isDST ? '-07:00' : '-08:00';
        
        startDateTime = new Date(`${date}T${startTime}:00${offset}`);
        endDateTime = new Date(`${date}T${endTime}:00${offset}`);
      }
      
      // The createEvent function will detect the location and set appropriate timezone
      const event = await createEvent({
        summary: 'Break Time',
        description: 'Personal break time - no meetings',
        start: startDateTime.toISOString(),
        end: endDateTime.toISOString(),
        attendeeEmail: process.env.EMAIL_USER
      });

      res.json({ message: 'Break time added to calendar', event });
    } else {
      res.status(400).json({ error: 'Invalid break time data' });
    }
  } catch (error) {
    console.error('Error adding break time:', error);
    res.status(500).json({ error: 'Failed to add break time' });
  }
});

// Get recurring breaks (for the calendar module to use)
router.get('/recurring-breaks', (req, res) => {
  res.json({ recurringBreaks });
});

// Add location for a specific date or date range
router.post('/locations', async (req, res) => {
  console.log('Location request body:', req.body);
  const { startDate, endDate, morningLocation, afternoonLocation, timezone } = req.body;
  
  if (!startDate || (!morningLocation?.trim() && !afternoonLocation?.trim())) {
    console.log('Validation failed:', { startDate, morningLocation, afternoonLocation });
    return res.status(400).json({ error: 'Start date and at least one location are required' });
  }
  
  // If no end date, treat as single day
  const end = endDate || startDate;
  
  // Store each day in the range
  const start = new Date(startDate);
  const finish = new Date(end);
  
  while (start <= finish) {
    const dateKey = start.toISOString().split('T')[0];
    
    // Get existing data for this date
    const existingData = locationData.get(dateKey) || {};
    
    // Update morning and/or afternoon locations  
    const updatedData = {
      morning: morningLocation?.trim() || existingData.morning || null,
      afternoon: afternoonLocation?.trim() || existingData.afternoon || null,
      timezone: timezone || existingData.timezone || 'Asia/Seoul' // 시간대 저장
    };
    
    locationData.set(dateKey, updatedData);
    
    start.setDate(start.getDate() + 1);
  }
  
  // Save to file after adding
  await saveLocationData();
  
  res.json({ 
    message: 'Location added successfully', 
    startDate, 
    endDate: endDate || startDate, 
    morningLocation,
    afternoonLocation
  });
});

// Update location for a specific date or date range
router.put('/locations', async (req, res) => {
  console.log('Location update request body:', req.body);
  const { startDate, endDate, morningLocation, afternoonLocation, timezone } = req.body;
  
  if (!startDate || (!morningLocation?.trim() && !afternoonLocation?.trim())) {
    console.log('Validation failed:', { startDate, morningLocation, afternoonLocation });
    return res.status(400).json({ error: 'Start date and at least one location are required' });
  }
  
  // If no end date, treat as single day
  const end = endDate || startDate;
  
  // Store each day in the range
  const start = new Date(startDate);
  const finish = new Date(end);
  
  while (start <= finish) {
    const dateKey = start.toISOString().split('T')[0];
    
    // Get existing data for this date
    const existingData = locationData.get(dateKey) || {};
    
    // Update morning and/or afternoon locations  
    const updatedData = {
      morning: morningLocation?.trim() || existingData.morning || null,
      afternoon: afternoonLocation?.trim() || existingData.afternoon || null,
      timezone: timezone || existingData.timezone || 'Asia/Seoul' // 시간대 저장
    };
    
    locationData.set(dateKey, updatedData);
    
    start.setDate(start.getDate() + 1);
  }
  
  // Save to file after updating
  await saveLocationData();
  
  res.json({ 
    message: 'Location updated successfully', 
    startDate, 
    endDate: endDate || startDate, 
    morningLocation,
    afternoonLocation
  });
});

// Get upcoming bookings from Google Calendar
router.get('/bookings', async (req, res) => {
  try {
    // Fetch upcoming events from Google Calendar
    const upcomingEvents = await getUpcomingEvents(10); // Get more events to filter
    
    // Filter to show only the next 3 relevant meetings
    const filteredEvents = upcomingEvents
      .filter(event => {
        // Exclude all-day events and certain types of events
        const hasTime = event.start.includes('T'); // Has specific time (not all-day)
        const excludeKeywords = ['holiday', '휴일', 'birthday', '생일', 'reminder'];
        const isExcluded = excludeKeywords.some(keyword => 
          event.summary.toLowerCase().includes(keyword)
        );
        return hasTime && !isExcluded;
      })
      .slice(0, 3); // Take only first 3
    
    res.json(filteredEvents);
  } catch (error) {
    console.error('Error fetching bookings:', error);
    res.status(500).json({ error: 'Failed to fetch bookings' });
  }
});

// Get availability settings
router.get('/availability', (req, res) => {
  // Return saved availability settings
  res.json(availabilityData);
});

// Save availability settings
router.post('/availability', async (req, res) => {
  try {
    const newAvailability = req.body;
    
    // Validate the data structure
    const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
    for (const day of days) {
      if (!newAvailability[day] || 
          typeof newAvailability[day].enabled !== 'boolean' ||
          !newAvailability[day].start || 
          !newAvailability[day].end) {
        return res.status(400).json({ error: `Invalid availability data for ${day}` });
      }
    }
    
    // Include timezone if provided (default to Asia/Seoul if not)
    if (!newAvailability.timezone) {
      newAvailability.timezone = 'Asia/Seoul';
    }
    
    // Update availability data
    availabilityData = newAvailability;
    
    // Save to file
    await saveAvailabilityData();
    
    res.json({ message: 'Availability settings saved successfully' });
  } catch (error) {
    console.error('Error saving availability:', error);
    res.status(500).json({ error: 'Failed to save availability settings' });
  }
});

// Get all locations
router.get('/locations', (req, res) => {
  // Return the data directly as an object (matching the format expected by frontend)
  const locationsObject = {};
  
  for (const [date, data] of locationData.entries()) {
    // Handle both old and new format
    if (data.location) {
      // Old format
      locationsObject[date] = {
        morning: data.timeOfDay === 'morning' || data.timeOfDay === 'all' ? data.location : null,
        afternoon: data.timeOfDay === 'afternoon' || data.timeOfDay === 'all' ? data.location : null
      };
    } else {
      // New format
      locationsObject[date] = {
        morning: data.morning,
        afternoon: data.afternoon,
        timezone: data.timezone || 'Asia/Seoul'
      };
    }
  }
  
  res.json(locationsObject);
});

// Get location for a specific date
router.get('/location/:date', (req, res) => {
  const { date } = req.params;
  const locationInfo = locationData.get(date);
  
  if (!locationInfo) {
    res.json({ date, morning: null, afternoon: null, timezone: 'Asia/Seoul' });
    return;
  }
  
  // Handle both old and new format
  if (locationInfo.location) {
    // Old format
    res.json({ 
      date, 
      morning: locationInfo.timeOfDay === 'morning' || locationInfo.timeOfDay === 'all' ? locationInfo.location : null,
      afternoon: locationInfo.timeOfDay === 'afternoon' || locationInfo.timeOfDay === 'all' ? locationInfo.location : null
    });
  } else {
    // New format
    res.json({ 
      date, 
      morning: locationInfo.morning || null,
      afternoon: locationInfo.afternoon || null,
      timezone: locationInfo.timezone || 'Asia/Seoul'
    });
  }
});

// Export all location data for backup
router.get('/locations/export', (req, res) => {
  const exportData = Object.fromEntries(locationData);
  res.json({
    exportDate: new Date().toISOString(),
    locationCount: locationData.size,
    locations: exportData
  });
});

// Import location data from backup
router.post('/locations/import', async (req, res) => {
  const { locations } = req.body;
  
  if (!locations || typeof locations !== 'object') {
    return res.status(400).json({ error: 'Invalid import data' });
  }
  
  try {
    // Clear existing data
    locationData.clear();
    
    // Import new data
    Object.entries(locations).forEach(([date, data]) => {
      locationData.set(date, data);
    });
    
    // Save to file
    await saveLocationData();
    
    res.json({
      message: 'Data imported successfully',
      importedCount: locationData.size
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to import data' });
  }
});

// Token health check endpoint
router.get('/token-status', async (req, res) => {
  try {
    const healthCheck = await tokenManager.checkTokenHealth();

    res.json({
      ...healthCheck,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error checking token status:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to check token status',
      error: error.message
    });
  }
});

// Re-authentication URL generator
router.get('/reauth-url', (req, res) => {
  try {
    const oauth2Client = new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET,
      process.env.GOOGLE_REDIRECT_URI
    );

    const scopes = [
      'https://www.googleapis.com/auth/calendar',
      'https://www.googleapis.com/auth/userinfo.email',
      'https://www.googleapis.com/auth/userinfo.profile'
    ];

    const url = oauth2Client.generateAuthUrl({
      access_type: 'offline',
      scope: scopes,
      prompt: 'consent' // Force consent to get refresh token
    });

    res.json({ authUrl: url });
  } catch (error) {
    console.error('Error generating reauth URL:', error);
    res.status(500).json({ error: 'Failed to generate auth URL' });
  }
});

// Delete location for a specific date or date range
router.delete('/location', async (req, res) => {
  const { startDate, endDate, timeOfDay } = req.body;
  
  if (!startDate) {
    return res.status(400).json({ error: 'Start date is required' });
  }
  
  const end = endDate || startDate;
  const start = new Date(startDate);
  const finish = new Date(end);
  let deletedCount = 0;
  
  while (start <= finish) {
    const dateKey = start.toISOString().split('T')[0];
    const existingData = locationData.get(dateKey);
    
    if (existingData) {
      if (timeOfDay === 'morning' || timeOfDay === 'afternoon') {
        // Delete only morning or afternoon
        if (existingData.location) {
          // Old format - convert then delete
          if (existingData.timeOfDay === timeOfDay || existingData.timeOfDay === 'all') {
            locationData.delete(dateKey);
            deletedCount++;
          }
        } else {
          // New format
          existingData[timeOfDay] = null;
          if (!existingData.morning && !existingData.afternoon) {
            locationData.delete(dateKey);
          } else {
            locationData.set(dateKey, existingData);
          }
          deletedCount++;
        }
      } else {
        // Delete entire day
        locationData.delete(dateKey);
        deletedCount++;
      }
    }
    start.setDate(start.getDate() + 1);
  }
  
  // Save to file after deletion
  await saveLocationData();
  
  res.json({ 
    message: `Deleted ${deletedCount} location(s)`, 
    startDate, 
    endDate: endDate || startDate,
    timeOfDay
  });
});

module.exports = router;