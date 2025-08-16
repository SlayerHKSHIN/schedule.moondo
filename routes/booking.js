const express = require('express');
const router = express.Router();
const { createEvent } = require('../utils/googleCalendar');
const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});

router.post('/create', async (req, res) => {
  try {
    const { name, email, date, time, timezone, purpose, meetingType } = req.body;

    if (!name || !email || !date || !time) {
      return res.status(400).json({ error: 'Name, email, date, and time are required' });
    }

    // Convert time string to start and end times
    // time format: "9:00 AM" or similar
    const [timePart, period] = time.split(' ');
    const [hours, minutes] = timePart.split(':');
    let hour = parseInt(hours);
    
    if (period === 'PM' && hour !== 12) {
      hour += 12;
    } else if (period === 'AM' && hour === 12) {
      hour = 0;
    }
    
    // 사용자 시간대 정보를 사용하여 정확한 UTC 시간 계산
    const userTimezone = timezone || 'Asia/Seoul';
    
    // 사용자 시간대에 맞는 시간 생성
    const timeString = `${String(hour).padStart(2, '0')}:${minutes || '00'}`;
    
    // 사용자 시간대별 오프셋 계산 함수
    const getTimezoneOffset = (tz, dateStr) => {
      if (tz.includes('Seoul') || tz.includes('Asia/Seoul')) {
        return '+09:00'; // KST는 UTC+9
      } else if (tz.includes('Los_Angeles') || tz.includes('America/Los_Angeles')) {
        // PST/PDT 확인
        const testDate = new Date(dateStr);
        const month = testDate.getMonth();
        const isDST = month >= 2 && month <= 10;
        return isDST ? '-07:00' : '-08:00';
      } else if (tz.includes('New_York') || tz.includes('America/New_York')) {
        // EST/EDT 확인
        const testDate = new Date(dateStr);
        const month = testDate.getMonth();
        const isDST = month >= 2 && month <= 10;
        return isDST ? '-04:00' : '-05:00';
      } else if (tz.includes('London') || tz.includes('Europe/London')) {
        // GMT/BST 확인
        const testDate = new Date(dateStr);
        const month = testDate.getMonth();
        const isDST = month >= 2 && month <= 9;
        return isDST ? '+01:00' : '+00:00';
      } else if (tz.includes('Tokyo') || tz.includes('Asia/Tokyo')) {
        return '+09:00'; // JST는 UTC+9
      } else {
        // 기타 시간대는 브라우저 정보 사용
        const d = new Date(dateStr);
        const offset = -d.getTimezoneOffset();
        const hours = Math.floor(Math.abs(offset) / 60);
        const mins = Math.abs(offset) % 60;
        const sign = offset >= 0 ? '+' : '-';
        return `${sign}${String(hours).padStart(2, '0')}:${String(mins).padStart(2, '0')}`;
      }
    };
    
    // 사용자가 보는 시간은 사용자 시간대 기준이지만, 
    // 캘린더에 저장할 때는 호스트 시간대 기준으로 변환 필요
    // 일단 사용자 시간대로 시간 파싱
    const userTzOffset = getTimezoneOffset(userTimezone, date);
    
    // ISO 형식으로 시간 생성 (사용자 시간대 포함)
    const startDateTime = new Date(`${date}T${timeString}:00${userTzOffset}`);
    const endDateTime = new Date(startDateTime);
    endDateTime.setMinutes(endDateTime.getMinutes() + 30); // 30 minute meeting default
    
    const startTime = startDateTime.toISOString();
    const endTime = endDateTime.toISOString();
    
    console.log(`Booking request - User timezone: ${userTimezone}, Selected time: ${time}, Date: ${date}`);
    console.log(`Converted to UTC - Start: ${startTime}, End: ${endTime}`);

    // Get location and timezone information for the meeting date
    const axios = require('axios');
    let locationInfo = null;
    let hostTimezone = 'Asia/Seoul'; // 기본값
    try {
      const port = process.env.PORT || 4312;
      const response = await axios.get(`http://localhost:${port}/api/admin/location/${date}`);
      locationInfo = response.data;
      hostTimezone = response.data.timezone || 'Asia/Seoul';
    } catch (err) {
      console.log('Could not fetch location info');
    }

    const eventDetails = {
      summary: `Meeting with ${name}`,
      description: purpose ? `Purpose: ${purpose}\nBooked by: ${name} (${email})` : `Booked by: ${name} (${email})`,
      start: startTime,  // ISO string 그대로 사용
      end: endTime,      // ISO string 그대로 사용
      attendeeEmail: email,
      meetingType: meetingType || 'video', // default to video
      locationInfo: locationInfo // Pass location info to event creation
    };

    const event = await createEvent(eventDetails);

    // Google Meet 링크가 이벤트에 있는지 확인
    const meetLink = event.hangoutLink || event.conferenceData?.entryPoints?.[0]?.uri;
    
    // 시간 포맷팅 (사용자의 로컬 시간대로 표시)
    const startDate = new Date(startTime);
    const endDate = new Date(endTime);
    
    // 사용자 시간대 사용 (전달되지 않으면 기본값 사용)
    const displayTimezone = userTimezone || Intl.DateTimeFormat().resolvedOptions().timeZone;
    
    console.log(`Formatting times for email - Timezone: ${displayTimezone}`);
    console.log(`Start time UTC: ${startTime}`);
    console.log(`End time UTC: ${endTime}`);
    
    // 사용자가 선택한 원래 시간을 그대로 사용 (이미 로컬 시간임)
    const formattedStartTime = time; // 예: "8:30 PM"
    
    // 종료 시간 계산 (30분 후)
    const [endTimePart, endPeriod] = time.split(' ');
    const [endHours, endMins] = endTimePart.split(':');
    let endHour = parseInt(endHours);
    let endMinute = parseInt(endMins || '00') + 30;
    let endPeriodFinal = endPeriod;
    
    if (endMinute >= 60) {
      endMinute -= 60;
      endHour += 1;
      if (endHour === 12 && period === 'AM') {
        endPeriod = 'PM';
      } else if (endHour > 12) {
        endHour -= 12;
        if (endHour === 12) {
          endPeriod = period === 'AM' ? 'PM' : 'AM';
        }
      }
    }
    
    const formattedEndTime = `${endHour}:${String(endMinute).padStart(2, '0')} ${endPeriod}`;
    
    // 시간대 약어 가져오기
    let timezoneName = '';
    if (displayTimezone.includes('Seoul') || displayTimezone.includes('Asia/Seoul')) {
      timezoneName = 'KST';
    } else if (displayTimezone.includes('Los_Angeles')) {
      const month = startDate.getMonth();
      const isDST = month >= 2 && month <= 10;
      timezoneName = isDST ? 'PDT' : 'PST';
    } else {
      const tzFormatter = new Intl.DateTimeFormat('en-US', {
        timeZoneName: 'short',
        timeZone: displayTimezone
      });
      const tzParts = tzFormatter.formatToParts(startDate);
      timezoneName = tzParts.find(part => part.type === 'timeZoneName')?.value || '';
    }
    
    // Determine which location to show based on meeting time (사용자 시간 기준)
    let meetingLocation = null;
    if (locationInfo) {
      // 원래 선택한 시간 기준으로 판단
      let meetingHour = parseInt(hours);
      if (period === 'PM' && meetingHour !== 12) {
        meetingHour += 12;
      } else if (period === 'AM' && meetingHour === 12) {
        meetingHour = 0;
      }
      
      if (meetingHour < 12 && locationInfo.morning) {
        meetingLocation = locationInfo.morning;
      } else if (meetingHour >= 12 && locationInfo.afternoon) {
        meetingLocation = locationInfo.afternoon;
      } else if (locationInfo.morning && locationInfo.afternoon && locationInfo.morning === locationInfo.afternoon) {
        meetingLocation = locationInfo.morning;
      }
    }
    
    console.log(`Email times - Start: ${formattedStartTime}, End: ${formattedEndTime}, Timezone: ${timezoneName}`);
    
    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: email,
      subject: 'Meeting Confirmation - Schedule with Hyun',
      html: `
        <h2>Meeting Confirmed!</h2>
        <p>Dear ${name},</p>
        <p>Your meeting has been successfully scheduled.</p>
        <ul>
          <li><strong>Date:</strong> ${date}</li>
          <li><strong>Time:</strong> ${formattedStartTime} - ${formattedEndTime} (${timezoneName})</li>
          ${purpose ? `<li><strong>Purpose:</strong> ${purpose}</li>` : ''}
          <li><strong>Meeting Type:</strong> ${meetingType === 'video' ? 'Video Call (Google Meet)' : 'In-Person Meeting'}</li>
          ${meetingType === 'video' && meetLink ? `<li><strong>Google Meet Link:</strong> <a href="${meetLink}">${meetLink}</a></li>` : ''}
          ${meetingType === 'in-person' && meetingLocation ? `<li><strong>Hyun's Location:</strong> ${meetingLocation}</li>` : ''}
        </ul>
        <p>A calendar invitation has been sent to your email.</p>
        ${meetingType === 'video' ? '<p>Please join the meeting using the Google Meet link at the scheduled time.</p>' : ''}
        ${meetingType === 'in-person' && meetingLocation ? `<p>📍 <a href="https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(meetingLocation)}">View location on Google Maps</a></p>` : ''}
        <p>Best regards,<br>Hyun</p>
      `
    };

    await transporter.sendMail(mailOptions);

    res.json({ 
      success: true, 
      message: 'Meeting scheduled successfully',
      eventId: event.id,
      email: email
    });
  } catch (error) {
    console.error('Error creating booking:', error);
    res.status(500).json({ error: 'Failed to create booking' });
  }
});

module.exports = router;