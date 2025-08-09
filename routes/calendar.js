const express = require('express');
const router = express.Router();
const { getAvailableSlots, detectLocation } = require('../utils/googleCalendar');

router.get('/available-slots', async (req, res) => {
  try {
    const { date, duration, timezone: userTimezone } = req.query;
    
    if (!date) {
      return res.status(400).json({ error: 'Date is required' });
    }

    // Get location information for the date
    const axios = require('axios');
    let morningLocation = null;
    let afternoonLocation = null;
    
    try {
      const locationResponse = await axios.get(`http://localhost:4312/api/admin/location/${date}`);
      morningLocation = locationResponse.data.morning;
      afternoonLocation = locationResponse.data.afternoon;
    } catch (err) {
      console.log('Could not fetch location data');
    }

    // No filtering by timeOfDay - show all available slots
    // Pass user timezone to getAvailableSlots
    const slots = await getAvailableSlots(date, duration ? parseInt(duration) : 30, 'all', userTimezone);
    const location = await detectLocation(new Date(date));
    
    // 위치 정보 추가
    const locationInfo = {
      current: location,
      timezone: location === 'KR' ? 'Asia/Seoul' : 'America/Los_Angeles',
      workingHours: location === 'KR' 
        ? { start: '08:00', end: '21:00', zone: 'KST' }
        : { start: '08:00', end: '21:00', zone: 'PST/PDT' },
      morningLocation: morningLocation,
      afternoonLocation: afternoonLocation
    };
    
    res.json({ slots, location: locationInfo });
  } catch (error) {
    console.error('Error getting available slots:', error);
    res.status(500).json({ error: 'Failed to fetch available slots' });
  }
});

module.exports = router;