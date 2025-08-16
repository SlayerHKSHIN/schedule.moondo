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
    let hostTimezone = 'Asia/Seoul'; // 기본값
    
    try {
      const port = process.env.PORT || 4312;
      const locationResponse = await axios.get(`http://localhost:${port}/api/admin/location/${date}`);
      morningLocation = locationResponse.data.morning;
      afternoonLocation = locationResponse.data.afternoon;
      hostTimezone = locationResponse.data.timezone || 'Asia/Seoul';
    } catch (err) {
      console.log('Could not fetch location data');
    }

    // No filtering by timeOfDay - show all available slots
    // Pass both user timezone and host timezone to getAvailableSlots
    const slots = await getAvailableSlots(date, duration ? parseInt(duration) : 30, 'all', userTimezone, hostTimezone);
    
    // 위치 정보 추가
    const locationInfo = {
      current: hostTimezone === 'Asia/Seoul' ? 'KR' : 'US',
      timezone: hostTimezone,
      workingHours: {
        start: '08:00',
        end: '21:00',
        zone: hostTimezone === 'Asia/Seoul' ? 'KST' : 
              hostTimezone === 'America/Los_Angeles' ? 'PST/PDT' : 
              hostTimezone === 'America/New_York' ? 'EST/EDT' : 'GMT'
      },
      locationData: {
        morning: morningLocation,
        afternoon: afternoonLocation
      },
      hostName: 'Hyun' // 호스트 이름 추가
    };
    
    res.json({ slots, location: locationInfo });
  } catch (error) {
    console.error('Error getting available slots:', error);
    res.status(500).json({ error: 'Failed to fetch available slots' });
  }
});

module.exports = router;