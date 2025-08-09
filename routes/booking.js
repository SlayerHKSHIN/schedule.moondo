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
    const { name, email, date, startTime, endTime, purpose, meetingType, userTimezone } = req.body;

    if (!name || !email || !date || !startTime || !endTime) {
      return res.status(400).json({ error: 'Name, email, date, and time are required' });
    }

    // Get location information for the meeting date
    const axios = require('axios');
    let locationInfo = null;
    try {
      const response = await axios.get(`http://localhost:4312/api/admin/location/${date}`);
      locationInfo = response.data;
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
    
    const timeFormatter = new Intl.DateTimeFormat('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
      timeZone: displayTimezone
    });
    
    const formattedStartTime = timeFormatter.format(startDate);
    const formattedEndTime = timeFormatter.format(endDate);
    
    // 시간대 약어 가져오기
    const tzFormatter = new Intl.DateTimeFormat('en-US', {
      timeZoneName: 'short',
      timeZone: displayTimezone
    });
    const tzParts = tzFormatter.formatToParts(startDate);
    const timezoneName = tzParts.find(part => part.type === 'timeZoneName')?.value || '';
    
    // Determine which location to show based on meeting time
    let meetingLocation = null;
    if (locationInfo) {
      const meetingHour = startDate.getHours();
      if (meetingHour < 12 && locationInfo.morning) {
        meetingLocation = locationInfo.morning;
      } else if (meetingHour >= 12 && locationInfo.afternoon) {
        meetingLocation = locationInfo.afternoon;
      } else if (locationInfo.morning && locationInfo.afternoon && locationInfo.morning === locationInfo.afternoon) {
        meetingLocation = locationInfo.morning;
      }
    }
    
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
      eventId: event.id 
    });
  } catch (error) {
    console.error('Error creating booking:', error);
    res.status(500).json({ error: 'Failed to create booking' });
  }
});

module.exports = router;