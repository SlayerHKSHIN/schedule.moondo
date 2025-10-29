const express = require('express');
const router = express.Router();
const llmClient = require('../utils/llmClient');
const { getAvailableSlots, bookSlot } = require('../utils/googleCalendar');
const moment = require('moment-timezone');

// Natural language scheduling endpoint
router.post('/schedule', async (req, res) => {
  try {
    const { message, timezone = 'America/Los_Angeles', context = {} } = req.body;
    
    console.log('NLP Request:', { message, timezone, context });
    
    // Step 1: Parse user intent with context
    const intent = await llmClient.parseSchedulingIntent(message, context);
    console.log('Parsed intent:', intent);
    
    // Use browser timezone, fallback to intent or default
    const userTimezone = timezone || intent.timezone || 'America/Los_Angeles';
    const isKoreanTime = userTimezone === 'Asia/Seoul' || userTimezone.includes('Seoul');
    
    console.log(`Using timezone: ${userTimezone} (Browser: ${timezone}, Intent: ${intent.timezone})`);
    
    // If asking about Hyun's schedule without specific time request
    if (message.toLowerCase().includes('hyun') && 
        (message.toLowerCase().includes('schedule') || 
         message.toLowerCase().includes('available') ||
         message.toLowerCase().includes('일정') ||
         message.toLowerCase().includes('언제'))) {
      // Show Hyun's availability overview
      console.log('User asking about Hyun\'s schedule');
    }
    
    // Step 2: Handle date/time ranges or single values
    let dates = [];
    if (intent.dateRange) {
      // Generate all dates in range
      const start = moment(intent.dateRange.start);
      const end = moment(intent.dateRange.end);
      for (let m = start; m.diff(end, 'days') <= 0; m.add(1, 'days')) {
        dates.push(m.format('YYYY-MM-DD'));
      }
    } else if (intent.date) {
      dates = [parseDate(intent.date)];
    } else {
      dates = [moment().format('YYYY-MM-DD')];
    }
    
    let timeRange = null;
    let requestedTime = null;
    if (intent.timeRange) {
      timeRange = {
        start: parseTime(intent.timeRange.start),
        end: parseTime(intent.timeRange.end)
      };
    } else if (intent.time) {
      requestedTime = parseTime(intent.time);
    } else {
      requestedTime = '14:00';
    }
    
    const duration = parseDuration(intent.duration || '30분');
    
    // Step 3: Check availability for all dates with proper timezone handling
    let allAvailableSlots = [];
    
    console.log(`Checking availability for dates: ${dates.join(', ')}`);
    console.log(`Duration: ${duration} minutes, User timezone: ${userTimezone}`);
    
    for (const date of dates) {
      // Get Hyun's actual availability
      const slots = await getAvailableSlots(
        date,
        duration,
        'all',
        userTimezone,
        null // Let the system detect Hyun's location automatically
      );
      
      // If Korean time requested, convert slots to KST for display
      const processedSlots = slots.map(slot => {
        if (typeof slot === 'string') {
          return { date, time: slot, timezone: userTimezone };
        }
        return { ...slot, date, timezone: userTimezone };
      });
      
      // Filter by time range if specified
      if (timeRange) {
        const filtered = processedSlots.filter(slot => {
          const slotTime = slot.time || slot;
          const slotHour = parseInt(slotTime.split(':')[0]);
          const startHour = parseInt(timeRange.start.split(':')[0]);
          const endHour = parseInt(timeRange.end.split(':')[0]);
          return slotHour >= startHour && slotHour < endHour;
        });
        allAvailableSlots = allAvailableSlots.concat(filtered);
      } else {
        allAvailableSlots = allAvailableSlots.concat(processedSlots);
      }
    }
    
    // Step 4: Find matching slots or suggest alternatives
    let matchingSlots = [];
    
    if (timeRange) {
      // Already filtered by time range above
      matchingSlots = allAvailableSlots.slice(0, 5);
    } else if (requestedTime) {
      // Find slots matching the requested time
      const matchingSlot = findMatchingSlot(
        allAvailableSlots,
        requestedTime,
        duration
      );
      if (matchingSlot) {
        matchingSlots = [matchingSlot];
      }
    } else {
      matchingSlots = allAvailableSlots.slice(0, 5);
    }
    
    if (matchingSlots.length > 0) {
      // Slots are available
      const response = await llmClient.generateResponse(
        { 
          available: true, 
          slots: matchingSlots,
          dateRange: intent.dateRange,
          timeRange: intent.timeRange || { start: requestedTime, end: requestedTime },
          purpose: intent.purpose,
          timezone: userTimezone,
          language: intent.language
        },
        message
      );
      
      res.json({
        success: true,
        intent,
        available: true,
        slots: matchingSlots,
        message: response,
        confirmationRequired: matchingSlots.length === 1
      });
    } else {
      // Suggest alternatives
      const suggestions = await llmClient.suggestAlternatives(
        { 
          dateRange: intent.dateRange || { start: dates[0], end: dates[dates.length - 1] },
          timeRange: timeRange || { start: requestedTime, end: requestedTime },
          timezone: userTimezone
        },
        allAvailableSlots.slice(0, 10),
        intent.language
      );
      
      res.json({
        success: true,
        intent,
        available: false,
        alternatives: allAvailableSlots.slice(0, 10),
        message: suggestions || (intent.language === 'ko' ? 
          "요청하신 시간대에는 가능한 슬롯이 없습니다. 다른 시간을 선택해주세요." :
          "No slots available in the requested time range. Please choose another time."),
        confirmationRequired: false
      });
    }
  } catch (error) {
    console.error('NLP scheduling error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to process scheduling request',
      message: "죄송합니다. 요청을 처리하는 중 오류가 발생했습니다."
    });
  }
});

// Confirm booking endpoint
router.post('/confirm', async (req, res) => {
  try {
    const { slot, guestEmail, guestName, purpose, timezone } = req.body;
    
    // Create the actual booking
    const booking = await bookSlot(
      slot.date,
      slot.time,
      slot.duration,
      guestEmail,
      guestName,
      purpose,
      timezone
    );
    
    const confirmMessage = `완료! ${guestName}님과의 미팅이 ${slot.date} ${slot.time}에 예약되었습니다. 
확인 이메일이 ${guestEmail}로 발송되었습니다.`;
    
    res.json({
      success: true,
      booking,
      message: confirmMessage
    });
  } catch (error) {
    console.error('Booking confirmation error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to confirm booking',
      message: "예약 확정 중 오류가 발생했습니다."
    });
  }
});

// Chat endpoint for continuous conversation
router.post('/chat', async (req, res) => {
  try {
    const { message, context = {} } = req.body;
    
    // Generate contextual response
    const response = await llmClient.generateResponse(context, message);
    
    res.json({
      success: true,
      message: response,
      context
    });
  } catch (error) {
    console.error('Chat error:', error);
    res.status(500).json({
      success: false,
      error: 'Chat failed',
      message: "대화 처리 중 오류가 발생했습니다."
    });
  }
});

// Helper functions
function parseDate(dateStr) {
  const today = moment();
  const lowerDate = dateStr.toLowerCase();
  
  if (lowerDate.includes('오늘')) {
    return today.format('YYYY-MM-DD');
  } else if (lowerDate.includes('내일')) {
    return today.add(1, 'day').format('YYYY-MM-DD');
  } else if (lowerDate.includes('다음주')) {
    const dayMatch = lowerDate.match(/(월|화|수|목|금|토|일)요일/);
    if (dayMatch) {
      const days = ['일', '월', '화', '수', '목', '금', '토'];
      const targetDay = days.indexOf(dayMatch[1]);
      return today.add(1, 'week').day(targetDay).format('YYYY-MM-DD');
    }
    return today.add(1, 'week').format('YYYY-MM-DD');
  } else if (lowerDate.includes('이번주')) {
    const dayMatch = lowerDate.match(/(월|화|수|목|금|토|일)요일/);
    if (dayMatch) {
      const days = ['일', '월', '화', '수', '목', '금', '토'];
      const targetDay = days.indexOf(dayMatch[1]);
      return today.day(targetDay).format('YYYY-MM-DD');
    }
    return today.format('YYYY-MM-DD');
  }
  
  // Try to parse as actual date
  const parsed = moment(dateStr);
  if (parsed.isValid()) {
    return parsed.format('YYYY-MM-DD');
  }
  
  // Default to tomorrow if can't parse
  return today.add(1, 'day').format('YYYY-MM-DD');
}

function parseTime(timeStr) {
  if (!timeStr) return '14:00'; // Default 2 PM
  
  // Handle object format from LLM (e.g., { start: '13:00', end: '17:00' })
  if (typeof timeStr === 'object' && timeStr.start) {
    return timeStr.start;
  }
  
  const lowerTime = timeStr.toLowerCase();
  
  // Parse Korean time format
  const koreanMatch = lowerTime.match(/(\d{1,2})시/);
  if (koreanMatch) {
    let hour = parseInt(koreanMatch[1]);
    if (lowerTime.includes('오후') && hour < 12) hour += 12;
    return `${hour.toString().padStart(2, '0')}:00`;
  }
  
  // Parse English format
  const englishMatch = lowerTime.match(/(\d{1,2}):?(\d{2})?\s*(am|pm)?/i);
  if (englishMatch) {
    let hour = parseInt(englishMatch[1]);
    const minutes = englishMatch[2] || '00';
    const meridiem = englishMatch[3];
    
    if (meridiem) {
      if (meridiem.toLowerCase() === 'pm' && hour < 12) hour += 12;
      if (meridiem.toLowerCase() === 'am' && hour === 12) hour = 0;
    }
    
    return `${hour.toString().padStart(2, '0')}:${minutes}`;
  }
  
  return '14:00'; // Default
}

function parseDuration(durationStr) {
  if (!durationStr) return 30;
  
  const match = durationStr.match(/(\d+)/);
  if (match) {
    return parseInt(match[1]);
  }
  
  return 30; // Default 30 minutes
}

function findMatchingSlot(availableSlots, requestedTime, duration) {
  if (!availableSlots || availableSlots.length === 0) return null;
  
  // Normalize slot data - handle both string and object formats
  const normalizedSlots = availableSlots.map(slot => {
    if (typeof slot === 'string') {
      return { time: slot, duration: 30 }; // Default 30 min for string slots
    }
    return slot;
  });
  
  // Find exact match first
  const exactMatch = normalizedSlots.find(slot => {
    const slotTime = slot.time || slot;
    return slotTime === requestedTime && (slot.duration || 30) >= duration;
  });
  
  if (exactMatch) return exactMatch;
  
  // Find closest time
  const requestedHour = parseInt(requestedTime.split(':')[0]);
  const closestSlot = normalizedSlots.reduce((prev, curr) => {
    const prevTime = typeof prev === 'string' ? prev : (prev.time || prev);
    const currTime = typeof curr === 'string' ? curr : (curr.time || curr);
    
    // Ensure we have valid time strings
    if (typeof prevTime !== 'string' || typeof currTime !== 'string') {
      return curr;
    }
    
    const prevHour = parseInt(prevTime.split(':')[0]);
    const currHour = parseInt(currTime.split(':')[0]);
    const prevDiff = Math.abs(prevHour - requestedHour);
    const currDiff = Math.abs(currHour - requestedHour);
    return currDiff < prevDiff ? curr : prev;
  });
  
  if (!closestSlot) return null;
  
  // Only return if within 2 hours of requested time
  const closestTime = typeof closestSlot === 'string' ? closestSlot : (closestSlot.time || closestSlot);
  
  // Check if closestTime is a valid string
  if (typeof closestTime !== 'string' || !closestTime.includes(':')) {
    return null;
  }
  
  const closestHour = parseInt(closestTime.split(':')[0]);
  if (Math.abs(closestHour - requestedHour) <= 2) {
    return closestSlot;
  }
  
  return null;
}

module.exports = router;