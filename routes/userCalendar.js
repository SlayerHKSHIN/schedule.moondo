const express = require('express');
const router = express.Router();
const { requireAuth } = require('./auth');
const userCalendar = require('../utils/userCalendar');

// Get available slots for authenticated user
router.get('/available-slots', requireAuth, async (req, res) => {
  try {
    const { date, timezone } = req.query;
    const user = req.user;
    
    if (!date) {
      return res.status(400).json({ error: 'Date is required' });
    }
    
    const slots = await userCalendar.getAvailableSlots(
      user,
      date,
      timezone || 'America/Los_Angeles'
    );
    
    res.json(slots);
  } catch (error) {
    console.error('Error getting available slots:', error);
    res.status(500).json({ error: 'Failed to get available slots' });
  }
});

// Create booking for authenticated user
router.post('/book', requireAuth, async (req, res) => {
  try {
    const user = req.user;
    const { 
      guestName, 
      guestEmail, 
      date, 
      time, 
      purpose, 
      meetingType,
      timezone 
    } = req.body;
    
    // Parse time and create event
    const [timePart, period] = time.split(' ');
    const [hours, minutes] = timePart.split(':');
    let hour = parseInt(hours);
    
    if (period === 'PM' && hour !== 12) {
      hour += 12;
    } else if (period === 'AM' && hour === 12) {
      hour = 0;
    }
    
    const startDate = new Date(date);
    startDate.setHours(hour, parseInt(minutes || '00'), 0, 0);
    
    const endDate = new Date(startDate);
    endDate.setMinutes(endDate.getMinutes() + 30); // 30-minute meeting
    
    const eventDetails = {
      summary: `Meeting with ${guestName}`,
      description: `Purpose: ${purpose}\nGuest: ${guestName} (${guestEmail})`,
      start: startDate.toISOString(),
      end: endDate.toISOString(),
      timezone: timezone || 'America/Los_Angeles',
      meetingType,
      attendees: [{ email: guestEmail }]
    };
    
    const event = await userCalendar.createEvent(user, eventDetails);
    
    res.json({
      success: true,
      event,
      meetLink: event.hangoutLink || event.conferenceData?.entryPoints?.[0]?.uri
    });
    
  } catch (error) {
    console.error('Error creating booking:', error);
    res.status(500).json({ error: 'Failed to create booking' });
  }
});

// Get user's calendars
router.get('/list', requireAuth, async (req, res) => {
  try {
    const user = req.user;
    const calendars = await userCalendar.getCalendarList(user);
    res.json(calendars);
  } catch (error) {
    console.error('Error getting calendar list:', error);
    res.status(500).json({ error: 'Failed to get calendar list' });
  }
});

// Delete event
router.delete('/event/:eventId', requireAuth, async (req, res) => {
  try {
    const user = req.user;
    const { eventId } = req.params;
    
    await userCalendar.deleteEvent(user, eventId);
    res.json({ success: true });
    
  } catch (error) {
    console.error('Error deleting event:', error);
    res.status(500).json({ error: 'Failed to delete event' });
  }
});

module.exports = router;