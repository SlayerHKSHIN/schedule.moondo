const express = require('express');
const router = express.Router();
const {
  createEvent,
  attachManagementAccess,
  findEventByBookingId,
  findEventByIdempotencyKey,
  hasEventConflict,
  listBookingEventsByEmail,
  updateManagedEvent
} = require('../utils/googleCalendar');
const crypto = require('node:crypto');
const {
  createManagementToken,
  getManageUrl,
  verifyManagementToken
} = require('../utils/bookingAccess');
const { parseManagedBookingWindow } = require('../utils/bookingTime');

const inFlightBookings = new Map();
const managementLinkRequests = new Map();
const MANAGEMENT_LINK_RESPONSE = {
  message: 'If matching bookings exist, updated Calendar invitations with management links will arrive shortly.'
};

function getPurpose(description = '') {
  const purposeLine = description.split('\n').find((line) => line.startsWith('Purpose: '));
  return purposeLine ? purposeLine.slice('Purpose: '.length) : '';
}

function getBookedByLine(description = '') {
  return description.split('\n').find((line) => line.startsWith('Booked by: ')) || 'Booked through schedule.moondo.ai';
}

function serializeManagedBooking(event) {
  const primaryAttendee = event.attendees?.[0] || {};
  return {
    summary: event.summary || 'Meeting',
    email: primaryAttendee.email || '',
    start: event.start?.dateTime || event.start?.date,
    end: event.end?.dateTime || event.end?.date,
    timezone: event.start?.timeZone || 'Asia/Seoul',
    purpose: getPurpose(event.description),
    meetingType: event.extendedProperties?.private?.bookingMeetingType || (event.hangoutLink ? 'video' : 'in-person'),
    attendeeStatus: primaryAttendee.responseStatus || 'needsAction',
    calendarLink: event.htmlLink || '',
    meetLink: event.hangoutLink || ''
  };
}

function withoutManagementLink(description = '') {
  return description
    .split('\n')
    .filter((line) => !line.startsWith('Manage this booking: '))
    .join('\n')
    .trim();
}

router.post('/manage/lookup', async (req, res) => {
  try {
    const bookingId = verifyManagementToken(req.body?.token);
    const event = bookingId ? await findEventByBookingId(bookingId) : null;
    if (!event || event.status === 'cancelled') {
      return res.status(404).json({ error: 'Booking not found or management link is invalid' });
    }
    return res.json({ booking: serializeManagedBooking(event) });
  } catch (error) {
    console.error('[BOOKING] Managed booking lookup failed:', error.message);
    return res.status(500).json({ error: 'Could not load booking' });
  }
});

router.post('/manage/request-link', async (req, res) => {
  const email = typeof req.body?.email === 'string' ? req.body.email.trim().toLowerCase() : '';
  const emailLooksValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  const emailKey = emailLooksValid
    ? crypto.createHash('sha256').update(email).digest('hex')
    : null;
  const cooldownMs = Number(process.env.BOOKING_LINK_REQUEST_COOLDOWN_MS || 10 * 60 * 1000);
  const now = Date.now();

  if (!emailKey || now - (managementLinkRequests.get(emailKey) || 0) < cooldownMs) {
    return res.status(202).json(MANAGEMENT_LINK_RESPONSE);
  }
  managementLinkRequests.set(emailKey, now);

  try {
    const events = await listBookingEventsByEmail(email);
    for (const event of events.slice(0, 10)) {
      const privateProperties = event.extendedProperties?.private || {};
      const bookingId = privateProperties.bookingId || crypto.randomUUID();
      const manageUrl = getManageUrl(createManagementToken(bookingId));
      const description = `${withoutManagementLink(event.description)}\n\nManage this booking: ${manageUrl}`;
      await attachManagementAccess(event.id, {
        description,
        privateExtendedProperties: {
          ...privateProperties,
          bookingId,
          bookingSource: privateProperties.bookingSource || 'schedule-moondo-legacy-v1',
          bookingMeetingType: privateProperties.bookingMeetingType || (event.hangoutLink ? 'video' : 'in-person')
        }
      });
    }
  } catch (error) {
    console.error('[BOOKING] Management link request failed:', error.message);
  }

  return res.status(202).json(MANAGEMENT_LINK_RESPONSE);
});

router.put('/manage', async (req, res) => {
  try {
    const bookingId = verifyManagementToken(req.body?.token);
    const event = bookingId ? await findEventByBookingId(bookingId) : null;
    if (!event || event.status === 'cancelled') {
      return res.status(404).json({ error: 'Booking not found or management link is invalid' });
    }

    const timezone = req.body?.timezone || event.start?.timeZone || 'Asia/Seoul';
    const { start, end } = parseManagedBookingWindow({
      date: req.body?.date,
      time: req.body?.time,
      durationMinutes: Number(req.body?.durationMinutes),
      timezone
    });
    if (await hasEventConflict(event.id, start, end)) {
      return res.status(409).json({ error: 'That time is no longer available' });
    }
    const purpose = typeof req.body?.purpose === 'string' ? req.body.purpose.trim().slice(0, 1000) : '';
    const manageUrl = getManageUrl(createManagementToken(bookingId));
    const description = `${purpose ? `Purpose: ${purpose}\n` : ''}${getBookedByLine(event.description)}\n\nManage this booking: ${manageUrl}`;
    const updatedEvent = await updateManagedEvent(event.id, {
      description,
      start: { dateTime: start, timeZone: timezone },
      end: { dateTime: end, timeZone: timezone },
      privateExtendedProperties: event.extendedProperties?.private || {}
    });

    return res.json({
      success: true,
      message: 'Booking updated successfully',
      booking: serializeManagedBooking(updatedEvent)
    });
  } catch (error) {
    if (error.code === 'INVALID_BOOKING_TIME') {
      return res.status(400).json({ error: error.message });
    }
    console.error('[BOOKING] Managed booking update failed:', error.message);
    return res.status(500).json({ error: 'Could not update booking' });
  }
});

router.post('/create', async (req, res) => {
  const requestIdempotencyKey = req.body?.idempotencyKey;
  let releaseInFlight = null;

  if (
    requestIdempotencyKey !== undefined &&
    (
      typeof requestIdempotencyKey !== 'string' ||
      !/^[A-Za-z0-9_-]{16,128}$/.test(requestIdempotencyKey)
    )
  ) {
    return res.status(400).json({ error: 'Invalid booking request identity' });
  }

  if (requestIdempotencyKey) {
    const existingInFlight = inFlightBookings.get(requestIdempotencyKey);
    if (existingInFlight) {
      await existingInFlight;
    } else {
      const completion = new Promise((resolve) => {
        releaseInFlight = resolve;
      });
      inFlightBookings.set(requestIdempotencyKey, completion);
    }
  }

  try {
    let { name, email, additionalEmails, date, time, endTime, timezone, purpose, meetingType, idempotencyKey } = req.body;

    if (
      typeof name !== 'string' ||
      typeof email !== 'string' ||
      typeof date !== 'string' ||
      typeof time !== 'string' ||
      !name.trim() ||
      !email.trim() ||
      !date ||
      !time
    ) {
      return res.status(400).json({ error: 'Name, email, date, and time are required' });
    }
    name = name.trim().replace(/[\r\n]+/g, ' ').slice(0, 120);
    email = email.trim().toLowerCase();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return res.status(400).json({ error: 'A valid email address is required' });
    }
    purpose = typeof purpose === 'string' ? purpose.trim().replace(/[\r\n]+/g, ' ').slice(0, 1000) : '';
    meetingType = meetingType === 'in-person' ? 'in-person' : 'video';
    additionalEmails = typeof additionalEmails === 'string' ? additionalEmails : '';

    const userTimezone = timezone || 'Asia/Seoul';
    const { start: startTimeISO, end: endTimeISO } = parseManagedBookingWindow({
      date,
      time,
      durationMinutes: endTime ? 60 : 30,
      timezone: userTimezone
    });
    const bookingIdempotencyKey = idempotencyKey || crypto
      .createHash('sha256')
      .update(`${email.trim().toLowerCase()}|${startTimeISO}|${endTimeISO}`)
      .digest('hex');

    const existingEvent = await findEventByIdempotencyKey(bookingIdempotencyKey);
    if (existingEvent) {
      const existingBookingId = existingEvent.extendedProperties?.private?.bookingId;
      if (!existingBookingId) {
        throw new Error('Existing managed booking is missing its booking identity');
      }

      const existingManageUrl = getManageUrl(createManagementToken(existingBookingId));
      return res.status(200).json({
        success: true,
        replayed: true,
        message: 'Meeting was already scheduled',
        eventId: existingEvent.id,
        email,
        calendarLink: existingEvent.htmlLink,
        manageUrl: existingManageUrl,
        notificationStatus: 'calendar_invite_already_sent'
      });
    }
    if (await hasEventConflict(null, startTimeISO, endTimeISO)) {
      return res.status(409).json({ error: 'That time is no longer available' });
    }

    console.log(`[BOOKING] Request received for ${date} in ${userTimezone}`);

    // Get location and timezone information for the meeting date
    const axios = require('axios');
    let locationInfo = null;
    try {
      const port = process.env.PORT || 4312;
      const response = await axios.get(`http://localhost:${port}/api/admin/location/${date}`);
      locationInfo = response.data;
    } catch (err) {
      console.log('Could not fetch location info');
    }

    // Process additional emails
    const allAttendees = [email];
    if (additionalEmails) {
      const additionalEmailList = additionalEmails.split(',').map(e => e.trim()).filter(e => e);
      allAttendees.push(...additionalEmailList);
    }

    const bookingId = crypto.randomUUID();
    const managementToken = createManagementToken(bookingId);
    const manageUrl = getManageUrl(managementToken);
    const eventDetails = {
      summary: `Meeting with ${name}`,
      description: `${purpose ? `Purpose: ${purpose}\n` : ''}Booked by: ${name} (${email})\n\nManage this booking: ${manageUrl}`,
      start: startTimeISO,  // ISO string 그대로 사용
      end: endTimeISO,      // ISO string 그대로 사용
      attendeeEmail: email,
      attendees: allAttendees, // All attendees including additional emails
      meetingType,
      locationInfo: locationInfo, // Pass location info to event creation
      privateExtendedProperties: {
        bookingId,
        bookingIdempotencyKey,
        bookingSource: 'schedule-moondo-v1',
        bookingMeetingType: meetingType
      }
    };

    console.log(`[BOOKING] Creating managed Calendar event for booking ${bookingId}`);
    const event = await createEvent(eventDetails);
    
    console.log(`[BOOKING] Event created successfully - Event ID: ${event.id}`);

    // Generate Google Calendar event link - ensure we have a valid link
    let calendarLink = event.htmlLink;
    if (!calendarLink && event.id) {
      // Fallback: construct the link manually if htmlLink is missing
      const encodedEventId = Buffer.from(event.id).toString('base64').replace(/=/g, '');
      calendarLink = `https://calendar.google.com/calendar/event?eid=${encodedEventId}`;
    }
    
    console.log(`[BOOKING] Event created - htmlLink: ${event.htmlLink}, eventId: ${event.id}`);
    console.log(`[BOOKING] Sending response with calendarLink: ${calendarLink}`);
    
    res.status(201).json({
      success: true, 
      message: 'Meeting scheduled successfully',
      eventId: event.id,
      email: email,
      calendarLink: calendarLink,
      manageUrl,
      notificationStatus: 'calendar_invite_sent'
    });
  } catch (error) {
    if (error.code === 'INVALID_BOOKING_TIME') {
      return res.status(400).json({ error: error.message });
    }
    console.error('Error creating booking:', error.message);
    res.status(500).json({ error: 'Failed to create booking' });
  } finally {
    if (releaseInFlight) {
      releaseInFlight();
      if (inFlightBookings.get(requestIdempotencyKey)) {
        inFlightBookings.delete(requestIdempotencyKey);
      }
    }
  }
});

module.exports = router;
