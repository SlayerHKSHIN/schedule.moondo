const express = require('express');
const router = express.Router();
const { createEvent } = require('../utils/googleCalendar');
const nodemailer = require('nodemailer');
const { getUniversalTimezoneOffset } = require('../utils/universal-timezone');

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});

router.post('/create', async (req, res) => {
  try {
    const { name, email, additionalEmails, date, time, endTime, timezone, purpose, meetingType } = req.body;

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
    
    // Use universal timezone offset calculation - supports ALL timezones
    const userTzOffset = getUniversalTimezoneOffset(userTimezone, new Date(date));
    
    // ISO 형식으로 시간 생성 (사용자 시간대 포함)
    const startDateTime = new Date(`${date}T${timeString}:00${userTzOffset}`);
    
    // endTime이 제공되면 1시간 미팅, 아니면 30분 기본값
    let endDateTime;
    if (endTime) {
      // 1시간 미팅: 첫 번째 슬롯 시작부터 1시간 후
      endDateTime = new Date(startDateTime);
      endDateTime.setMinutes(endDateTime.getMinutes() + 60); // 1시간 미팅
    } else {
      endDateTime = new Date(startDateTime);
      endDateTime.setMinutes(endDateTime.getMinutes() + 30); // 30 minute meeting default
    }
    
    const startTimeISO = startDateTime.toISOString();
    const endTimeISO = endDateTime.toISOString();
    
    console.log(`[BOOKING] Request received - Name: ${name}, Email: ${email}`);
    console.log(`[BOOKING] User timezone: ${userTimezone}, Selected time: ${time}, Date: ${date}`);
    console.log(`[BOOKING] Timezone offset: ${userTzOffset}`);
    console.log(`[BOOKING] Converted to UTC - Start: ${startTimeISO}, End: ${endTimeISO}`);

    // Get location and timezone information for the meeting date
    const axios = require('axios');
    let locationInfo = null;
    let hostTimezone = 'Asia/Seoul'; // 기본값
    let hostName = 'Hyun'; // 기본 호스트 이름
    try {
      const port = process.env.PORT || 4312;
      const response = await axios.get(`http://localhost:${port}/api/admin/location/${date}`);
      locationInfo = response.data;
      hostTimezone = response.data.timezone || 'Asia/Seoul';
      hostName = response.data.hostName || 'Hyun';
    } catch (err) {
      console.log('Could not fetch location info');
    }

    // Process additional emails
    const allAttendees = [email];
    if (additionalEmails) {
      console.log(`[BOOKING] Processing additional emails: ${additionalEmails}`);
      const additionalEmailList = additionalEmails.split(',').map(e => e.trim()).filter(e => e);
      allAttendees.push(...additionalEmailList);
      console.log(`[BOOKING] All attendees: ${allAttendees.join(', ')}`);
    }

    const eventDetails = {
      summary: `Meeting with ${name}`,
      description: purpose ? `Purpose: ${purpose}\nBooked by: ${name} (${email})` : `Booked by: ${name} (${email})`,
      start: startTimeISO,  // ISO string 그대로 사용
      end: endTimeISO,      // ISO string 그대로 사용
      attendeeEmail: email,
      attendees: allAttendees, // All attendees including additional emails
      meetingType: meetingType || 'video', // default to video
      locationInfo: locationInfo // Pass location info to event creation
    };

    console.log(`[BOOKING] Calling createEvent with details:`, JSON.stringify(eventDetails, null, 2));
    
    const event = await createEvent(eventDetails);
    
    console.log(`[BOOKING] Event created successfully - Event ID: ${event.id}`);
    console.log(`[BOOKING] Event response:`, JSON.stringify(event, null, 2));

    // Google Meet 링크가 이벤트에 있는지 확인
    const meetLink = event.hangoutLink || event.conferenceData?.entryPoints?.[0]?.uri;
    
    // 시간 포맷팅 (사용자의 로컬 시간대로 표시)
    const startDate = new Date(startTimeISO);
    const endDate = new Date(endTimeISO);
    
    // 사용자 시간대 사용 (전달되지 않으면 기본값 사용)
    const displayTimezone = userTimezone || Intl.DateTimeFormat().resolvedOptions().timeZone;
    
    console.log(`Formatting times for email - Timezone: ${displayTimezone}`);
    console.log(`Start time UTC: ${startTimeISO}`);
    console.log(`End time UTC: ${endTimeISO}`);
    
    // 사용자가 선택한 원래 시간을 그대로 사용 (이미 로컬 시간임)
    const formattedStartTime = time; // 예: "8:30 PM"
    
    // 종료 시간 포맷팅
    let formattedEndTime;
    if (endTime) {
      // 1시간 미팅인 경우, 시작 시간에서 1시간 후
      const [timePart, period] = time.split(' ');
      const [hours, mins] = timePart.split(':');
      let endHour = parseInt(hours);
      let endMinute = parseInt(mins || '00');
      let endPeriodFinal = period;
      
      // 1시간 추가
      endHour += 1;
      
      if (endHour === 12 && period === 'AM') {
        endPeriodFinal = 'PM';
      } else if (endHour > 12) {
        endHour -= 12;
        if (endHour === 1 && period === 'AM') {
          endPeriodFinal = 'PM';
        }
      } else if (endHour === 13) {
        endHour = 1;
        endPeriodFinal = 'PM';
      }
      
      formattedEndTime = `${endHour}:${String(endMinute).padStart(2, '0')} ${endPeriodFinal}`;
    } else {
      // 30분 미팅인 경우
      const [timePart, period] = time.split(' ');
      const [hours, mins] = timePart.split(':');
      let endHour = parseInt(hours);
      let endMinute = parseInt(mins || '00') + 30;
      let endPeriodFinal = period;
      
      if (endMinute >= 60) {
        endMinute -= 60;
        endHour += 1;
        if (endHour === 12 && period === 'AM') {
          endPeriodFinal = 'PM';
        } else if (endHour > 12) {
          endHour -= 12;
        }
      }
      
      formattedEndTime = `${endHour}:${String(endMinute).padStart(2, '0')} ${endPeriodFinal}`;
    }
    
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
    
    // Send email to additional guests if any
    if (additionalEmails) {
      const additionalEmailList = additionalEmails.split(',').map(e => e.trim()).filter(e => e);
      for (const additionalEmail of additionalEmailList) {
        const additionalMailOptions = {
          ...mailOptions,
          to: additionalEmail,
          subject: `Meeting Invitation - Schedule with ${hostName}`,
          html: `
            <h2>You've been invited to a meeting!</h2>
            <p>Dear Guest,</p>
            <p>You have been invited to a meeting by ${name}.</p>
            <ul>
              <li><strong>Date:</strong> ${date}</li>
              <li><strong>Time:</strong> ${formattedStartTime} - ${formattedEndTime} (${timezoneName})</li>
              ${purpose ? `<li><strong>Purpose:</strong> ${purpose}</li>` : ''}
              <li><strong>Meeting Type:</strong> ${meetingType === 'video' ? 'Video Call (Google Meet)' : 'In-Person Meeting'}</li>
              ${meetingType === 'video' && meetLink ? `<li><strong>Google Meet Link:</strong> <a href="${meetLink}">${meetLink}</a></li>` : ''}
              ${meetingType === 'in-person' && meetingLocation ? `<li><strong>Location:</strong> ${meetingLocation}</li>` : ''}
            </ul>
            <p>A calendar invitation has been sent to your email.</p>
            ${meetingType === 'video' ? '<p>Please join the meeting using the Google Meet link at the scheduled time.</p>' : ''}
            ${meetingType === 'in-person' && meetingLocation ? `<p>📍 <a href="https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(meetingLocation)}">View location on Google Maps</a></p>` : ''}
            <p>Best regards,<br>${hostName}</p>
          `
        };
        await transporter.sendMail(additionalMailOptions);
      }
    }

    // Generate Google Calendar event link - ensure we have a valid link
    let calendarLink = event.htmlLink;
    if (!calendarLink && event.id) {
      // Fallback: construct the link manually if htmlLink is missing
      const encodedEventId = Buffer.from(event.id).toString('base64').replace(/=/g, '');
      calendarLink = `https://calendar.google.com/calendar/event?eid=${encodedEventId}`;
    }
    
    console.log(`[BOOKING] Event created - htmlLink: ${event.htmlLink}, eventId: ${event.id}`);
    console.log(`[BOOKING] Sending response with calendarLink: ${calendarLink}`);
    
    res.json({ 
      success: true, 
      message: 'Meeting scheduled successfully',
      eventId: event.id,
      email: email,
      calendarLink: calendarLink
    });
  } catch (error) {
    console.error('Error creating booking:', error);
    res.status(500).json({ error: 'Failed to create booking' });
  }
});

module.exports = router;