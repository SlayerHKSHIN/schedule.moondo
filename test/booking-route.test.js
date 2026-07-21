const assert = require('node:assert/strict');
const http = require('node:http');
const test = require('node:test');
const express = require('express');
const packageJson = require('../package.json');

const googleCalendarPath = require.resolve('../utils/googleCalendar');
const bookingRoutePath = require.resolve('../routes/booking');

function requestJson(port, path, { method = 'GET', body } = {}) {
  return new Promise((resolve, reject) => {
    const payload = body ? JSON.stringify(body) : undefined;
    const request = http.request(
      {
        hostname: '127.0.0.1',
        port,
        path,
        method,
        headers: payload
          ? {
              'Content-Type': 'application/json',
              'Content-Length': Buffer.byteLength(payload)
            }
          : {}
      },
      (response) => {
        const chunks = [];
        response.on('data', (chunk) => chunks.push(chunk));
        response.on('end', () => {
          const text = Buffer.concat(chunks).toString('utf8');
          let parsedBody = null;
          if (text) {
            try {
              parsedBody = JSON.parse(text);
            } catch {
              parsedBody = text;
            }
          }
          resolve({
            statusCode: response.statusCode,
            body: parsedBody
          });
        });
      }
    );

    request.on('error', reject);
    request.end(payload);
  });
}

function createCalendarDouble({ createDelayMs = 0, conflict = false } = {}) {
  const events = [];
  const createCalls = [];
  const updateCalls = [];
  const attachAccessCalls = [];

  return {
    events,
    createCalls,
    updateCalls,
    attachAccessCalls,
    async createEvent(eventDetails) {
      createCalls.push(eventDetails);
      if (createDelayMs > 0) {
        await new Promise((resolve) => setTimeout(resolve, createDelayMs));
      }
      const event = {
        id: `calendar-event-${events.length + 123}`,
        status: 'confirmed',
        summary: eventDetails.summary,
        description: eventDetails.description,
        htmlLink: 'https://calendar.google.com/calendar/event?eid=example',
        hangoutLink: 'https://meet.google.com/example',
        start: { dateTime: eventDetails.start, timeZone: 'Asia/Seoul' },
        end: { dateTime: eventDetails.end, timeZone: 'Asia/Seoul' },
        attendees: (eventDetails.attendees || []).map((email) => ({
          email,
          responseStatus: 'needsAction'
        })),
        extendedProperties: {
          private: { ...(eventDetails.privateExtendedProperties || {}) }
        }
      };
      events.push(event);
      return event;
    },
    async findEventByIdempotencyKey(idempotencyKey) {
      return events.find((event) => (
        event.extendedProperties.private.bookingIdempotencyKey === idempotencyKey
      )) || null;
    },
    async findEventByBookingId(bookingId) {
      return events.find((event) => (
        event.extendedProperties.private.bookingId === bookingId
      )) || null;
    },
    async hasEventConflict(eventId, start, end) {
      return typeof conflict === 'function'
        ? conflict({ eventId, start, end, events })
        : conflict;
    },
    async updateManagedEvent(eventId, changes) {
      updateCalls.push({ eventId, changes });
      const event = events.find((candidate) => candidate.id === eventId);
      Object.assign(event, {
        description: changes.description,
        start: changes.start,
        end: changes.end,
        extendedProperties: {
          private: {
            ...event.extendedProperties.private,
            ...(changes.privateExtendedProperties || {})
          }
        }
      });
      return event;
    },
    async listBookingEventsByEmail(email) {
      return events.filter((event) => (
        event.status === 'confirmed' &&
        event.attendees.some((attendee) => attendee.email.toLowerCase() === email.toLowerCase()) &&
        event.description.includes('Booked by:')
      ));
    },
    async attachManagementAccess(eventId, changes) {
      attachAccessCalls.push({ eventId, changes });
      const event = events.find((candidate) => candidate.id === eventId);
      event.description = changes.description;
      event.extendedProperties.private = {
        ...event.extendedProperties.private,
        ...changes.privateExtendedProperties
      };
      return event;
    }
  };
}

async function startBookingServer(t, options = {}) {
  const originalGoogleCalendar = require.cache[googleCalendarPath];
  const calendarDouble = createCalendarDouble(options);

  process.env.BOOKING_MANAGEMENT_SECRET = 'test-booking-management-secret-at-least-32-bytes';
  process.env.APP_ORIGIN = 'https://schedule.moondo.ai';

  require.cache[googleCalendarPath] = {
    id: googleCalendarPath,
    filename: googleCalendarPath,
    loaded: true,
    exports: calendarDouble
  };
  delete require.cache[bookingRoutePath];

  t.after(() => {
    delete require.cache[bookingRoutePath];
    if (originalGoogleCalendar) {
      require.cache[googleCalendarPath] = originalGoogleCalendar;
    } else {
      delete require.cache[googleCalendarPath];
    }
  });

  const bookingRouter = require('../routes/booking');
  const app = express();
  app.use(express.json());
  app.get('/api/admin/location/:date', (req, res) => {
    res.json({ timezone: 'Asia/Seoul', hostName: 'Hyun' });
  });
  app.use('/api/booking', bookingRouter);

  const server = http.createServer(app);
  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
  t.after(() => new Promise((resolve) => server.close(resolve)));
  return { port: server.address().port, calendarDouble };
}

test('returns booking success after Calendar creation without legacy SMTP credentials', async (t) => {
  const { port } = await startBookingServer(t);

  const response = await requestJson(port, '/api/booking/create', {
    method: 'POST',
    body: {
      name: 'Test Booker',
      email: 'booker@example.com',
      date: '2026-07-28',
      time: '2:30 PM',
      timezone: 'Asia/Seoul',
      purpose: 'Regression test',
      meetingType: 'video'
    }
  });

  assert.equal(response.statusCode, 201);
  assert.equal(response.body.success, true);
  assert.equal(response.body.eventId, 'calendar-event-123');
});

test('creates a non-leaking management link and stores its booking identity on the Calendar event', async (t) => {
  const { port, calendarDouble } = await startBookingServer(t);

  const response = await requestJson(port, '/api/booking/create', {
    method: 'POST',
    body: {
      name: 'Managed Booker',
      email: 'managed@example.com',
      date: '2026-07-29',
      time: '7:30 PM',
      timezone: 'Asia/Seoul',
      purpose: 'Managed booking',
      meetingType: 'video',
      idempotencyKey: 'browser-request-12345678'
    }
  });

  assert.equal(response.statusCode, 201);
  assert.match(response.body.manageUrl, /^https:\/\/schedule\.moondo\.ai\/manage#[a-f0-9-]+\.[A-Za-z0-9_-]+$/);
  assert.equal(response.body.manageUrl.includes('?'), false);

  const [created] = calendarDouble.createCalls;
  assert.match(created.privateExtendedProperties.bookingId, /^[a-f0-9-]{36}$/);
  assert.equal(created.privateExtendedProperties.bookingIdempotencyKey, 'browser-request-12345678');
  assert.match(created.description, /Manage this booking: https:\/\/schedule\.moondo\.ai\/manage#/);
});

test('replays the same idempotency key without creating a duplicate Calendar event', async (t) => {
  const { port, calendarDouble } = await startBookingServer(t);
  const body = {
    name: 'Retry Booker',
    email: 'retry@example.com',
    date: '2026-07-30',
    time: '10:00 AM',
    timezone: 'Asia/Seoul',
    purpose: 'Idempotency regression',
    meetingType: 'video',
    idempotencyKey: 'retry-request-12345678'
  };

  const first = await requestJson(port, '/api/booking/create', { method: 'POST', body });
  const replay = await requestJson(port, '/api/booking/create', { method: 'POST', body });

  assert.equal(first.statusCode, 201);
  assert.equal(replay.statusCode, 200);
  assert.equal(replay.body.replayed, true);
  assert.equal(replay.body.eventId, first.body.eventId);
  assert.equal(replay.body.manageUrl, first.body.manageUrl);
  assert.equal(calendarDouble.createCalls.length, 1);
});

test('coalesces concurrent requests with the same idempotency key', async (t) => {
  const { port, calendarDouble } = await startBookingServer(t, { createDelayMs: 50 });
  const body = {
    name: 'Concurrent Booker',
    email: 'concurrent@example.com',
    date: '2026-07-30',
    time: '11:00 AM',
    timezone: 'Asia/Seoul',
    purpose: 'Concurrent retry regression',
    meetingType: 'video',
    idempotencyKey: 'concurrent-request-12345678'
  };

  const [first, second] = await Promise.all([
    requestJson(port, '/api/booking/create', { method: 'POST', body }),
    requestJson(port, '/api/booking/create', { method: 'POST', body })
  ]);

  assert.deepEqual([first.statusCode, second.statusCode].sort(), [200, 201]);
  assert.equal(first.body.eventId, second.body.eventId);
  assert.equal(calendarDouble.createCalls.length, 1);
});

test('looks up a booking only with its valid capability token', async (t) => {
  const { port } = await startBookingServer(t);
  const created = await requestJson(port, '/api/booking/create', {
    method: 'POST',
    body: {
      name: 'Lookup Booker',
      email: 'lookup@example.com',
      date: '2026-07-31',
      time: '4:00 PM',
      timezone: 'Asia/Seoul',
      purpose: 'Lookup purpose',
      meetingType: 'video',
      idempotencyKey: 'lookup-request-12345678'
    }
  });
  const token = created.body.manageUrl.split('#')[1];

  const lookup = await requestJson(port, '/api/booking/manage/lookup', {
    method: 'POST',
    body: { token }
  });
  const tampered = await requestJson(port, '/api/booking/manage/lookup', {
    method: 'POST',
    body: { token: `${token.slice(0, -1)}x` }
  });

  assert.equal(lookup.statusCode, 200);
  assert.deepEqual(lookup.body.booking, {
    summary: 'Meeting with Lookup Booker',
    email: 'lookup@example.com',
    start: '2026-07-31T07:00:00.000Z',
    end: '2026-07-31T07:30:00.000Z',
    timezone: 'Asia/Seoul',
    purpose: 'Lookup purpose',
    meetingType: 'video',
    attendeeStatus: 'needsAction',
    calendarLink: 'https://calendar.google.com/calendar/event?eid=example',
    meetLink: 'https://meet.google.com/example'
  });
  assert.equal(tampered.statusCode, 404);
  assert.equal(tampered.body.error, 'Booking not found or management link is invalid');
});

test('updates the same Calendar event through a valid management token', async (t) => {
  const { port, calendarDouble } = await startBookingServer(t);
  const created = await requestJson(port, '/api/booking/create', {
    method: 'POST',
    body: {
      name: 'Update Booker',
      email: 'update@example.com',
      date: '2026-07-31',
      time: '4:00 PM',
      timezone: 'Asia/Seoul',
      purpose: 'Original purpose',
      meetingType: 'video',
      idempotencyKey: 'update-request-12345678'
    }
  });
  const token = created.body.manageUrl.split('#')[1];

  const updated = await requestJson(port, '/api/booking/manage', {
    method: 'PUT',
    body: {
      token,
      date: '2026-08-01',
      time: '18:30',
      durationMinutes: 60,
      timezone: 'Asia/Seoul',
      purpose: 'Updated purpose'
    }
  });

  assert.equal(updated.statusCode, 200);
  assert.equal(updated.body.booking.start, '2026-08-01T09:30:00.000Z');
  assert.equal(updated.body.booking.end, '2026-08-01T10:30:00.000Z');
  assert.equal(updated.body.booking.purpose, 'Updated purpose');
  assert.equal(calendarDouble.events.length, 1);
  assert.equal(calendarDouble.updateCalls.length, 1);
  assert.equal(calendarDouble.updateCalls[0].eventId, created.body.eventId);
});

test('preserves the original booking when the requested replacement time conflicts', async (t) => {
  const { port, calendarDouble } = await startBookingServer(t, {
    conflict: ({ eventId }) => Boolean(eventId)
  });
  const created = await requestJson(port, '/api/booking/create', {
    method: 'POST',
    body: {
      name: 'Conflict Booker',
      email: 'conflict@example.com',
      date: '2026-07-31',
      time: '4:00 PM',
      timezone: 'Asia/Seoul',
      purpose: 'Original purpose',
      meetingType: 'video',
      idempotencyKey: 'conflict-request-12345678'
    }
  });
  const token = created.body.manageUrl.split('#')[1];

  const response = await requestJson(port, '/api/booking/manage', {
    method: 'PUT',
    body: {
      token,
      date: '2026-08-01',
      time: '18:30',
      durationMinutes: 60,
      timezone: 'Asia/Seoul',
      purpose: 'Should not be saved'
    }
  });

  assert.equal(response.statusCode, 409);
  assert.equal(response.body.error, 'That time is no longer available');
  assert.equal(calendarDouble.updateCalls.length, 0);
  assert.equal(calendarDouble.events[0].description.includes('Original purpose'), true);
});

test('sends an existing attendee a secure management link through a Calendar update', async (t) => {
  const { port, calendarDouble } = await startBookingServer(t);
  calendarDouble.events.push({
    id: 'legacy-calendar-event',
    status: 'confirmed',
    summary: 'Meeting with Existing Booker',
    description: 'Purpose: Existing booking\nBooked by: Existing Booker (existing@example.com)',
    htmlLink: 'https://calendar.google.com/calendar/event?eid=legacy',
    hangoutLink: 'https://meet.google.com/legacy',
    start: { dateTime: '2026-08-02T10:00:00+09:00', timeZone: 'Asia/Seoul' },
    end: { dateTime: '2026-08-02T10:30:00+09:00', timeZone: 'Asia/Seoul' },
    attendees: [{ email: 'existing@example.com', responseStatus: 'needsAction' }],
    extendedProperties: { private: {} }
  });

  const response = await requestJson(port, '/api/booking/manage/request-link', {
    method: 'POST',
    body: { email: 'existing@example.com' }
  });

  assert.equal(response.statusCode, 202);
  assert.deepEqual(response.body, {
    message: 'If matching bookings exist, updated Calendar invitations with management links will arrive shortly.'
  });
  assert.equal(calendarDouble.attachAccessCalls.length, 1);
  assert.equal(calendarDouble.attachAccessCalls[0].eventId, 'legacy-calendar-event');
  assert.match(
    calendarDouble.attachAccessCalls[0].changes.description,
    /Manage this booking: https:\/\/schedule\.moondo\.ai\/manage#[a-f0-9-]+\.[A-Za-z0-9_-]+/
  );
  assert.match(
    calendarDouble.attachAccessCalls[0].changes.privateExtendedProperties.bookingId,
    /^[a-f0-9-]{36}$/
  );
});

test('rejects a newly requested time that became busy before Calendar creation', async (t) => {
  const { port, calendarDouble } = await startBookingServer(t, { conflict: true });

  const response = await requestJson(port, '/api/booking/create', {
    method: 'POST',
    body: {
      name: 'Race Booker',
      email: 'race@example.com',
      date: '2026-08-03',
      time: '9:00 AM',
      timezone: 'Asia/Seoul',
      purpose: 'Race condition regression',
      meetingType: 'video',
      idempotencyKey: 'race-request-12345678'
    }
  });

  assert.equal(response.statusCode, 409);
  assert.equal(response.body.error, 'That time is no longer available');
  assert.equal(calendarDouble.createCalls.length, 0);
});

test('uses the Google Calendar invitation as the single notification channel', async (t) => {
  const { port } = await startBookingServer(t);

  const response = await requestJson(port, '/api/booking/create', {
    method: 'POST',
    body: {
      name: 'Calendar Only Booker',
      email: 'calendar-only@example.com',
      date: '2026-08-04',
      time: '9:00 AM',
      timezone: 'Asia/Seoul',
      purpose: 'Single notification channel',
      meetingType: 'video',
      idempotencyKey: 'calendar-only-request-12345678'
    }
  });

  assert.equal(response.statusCode, 201);
  assert.equal(response.body.notificationStatus, 'calendar_invite_sent');
  assert.equal(packageJson.dependencies.nodemailer, undefined);
});

test('rejects malformed client idempotency keys before touching Calendar', async (t) => {
  const { port, calendarDouble } = await startBookingServer(t);

  const response = await requestJson(port, '/api/booking/create', {
    method: 'POST',
    body: {
      name: 'Invalid Key Booker',
      email: 'invalid-key@example.com',
      date: '2026-08-04',
      time: '10:00 AM',
      timezone: 'Asia/Seoul',
      meetingType: 'video',
      idempotencyKey: 'short'
    }
  });

  assert.equal(response.statusCode, 400);
  assert.equal(response.body.error, 'Invalid booking request identity');
  assert.equal(calendarDouble.createCalls.length, 0);
});

test('rejects malformed attendee email addresses before touching Calendar', async (t) => {
  const { port, calendarDouble } = await startBookingServer(t);

  const response = await requestJson(port, '/api/booking/create', {
    method: 'POST',
    body: {
      name: 'Invalid Email Booker',
      email: 'not-an-email',
      date: '2026-08-04',
      time: '10:00 AM',
      timezone: 'Asia/Seoul',
      meetingType: 'video',
      idempotencyKey: 'invalid-email-request-1234'
    }
  });

  assert.equal(response.statusCode, 400);
  assert.equal(response.body.error, 'A valid email address is required');
  assert.equal(calendarDouble.createCalls.length, 0);
});
