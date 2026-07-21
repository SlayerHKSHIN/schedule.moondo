const assert = require('node:assert/strict');
const test = require('node:test');

const googleapisPath = require.resolve('googleapis');
const tokenManagerPath = require.resolve('../utils/tokenManager');
const googleCalendarPath = require.resolve('../utils/googleCalendar');

test('sends Calendar updates without logging attendee details or private management links', async (t) => {
  const originals = {
    googleapis: require.cache[googleapisPath],
    tokenManager: require.cache[tokenManagerPath],
    googleCalendar: require.cache[googleCalendarPath],
    consoleLog: console.log
  };
  const insertCalls = [];
  const calendar = {
    events: {
      async list() {
        return { data: { items: [] } };
      },
      async insert(options) {
        insertCalls.push(options);
        return {
          data: {
            id: 'created-event',
            description: options.resource.description,
            attendees: options.resource.attendees
          }
        };
      }
    }
  };
  const logs = [];

  require.cache[googleapisPath] = {
    id: googleapisPath,
    filename: googleapisPath,
    loaded: true,
    exports: { google: { calendar: () => calendar } }
  };
  require.cache[tokenManagerPath] = {
    id: tokenManagerPath,
    filename: tokenManagerPath,
    loaded: true,
    exports: { getValidClient: async () => ({}) }
  };
  delete require.cache[googleCalendarPath];
  console.log = (...args) => logs.push(JSON.stringify(args));

  t.after(() => {
    console.log = originals.consoleLog;
    for (const [path, original] of [
      [googleapisPath, originals.googleapis],
      [tokenManagerPath, originals.tokenManager],
      [googleCalendarPath, originals.googleCalendar]
    ]) {
      if (original) require.cache[path] = original;
      else delete require.cache[path];
    }
  });

  const { createEvent } = require('../utils/googleCalendar');
  await createEvent({
    summary: 'Sensitive booking',
    description: 'Manage this booking: https://schedule.moondo.ai/manage#private-capability-token',
    start: '2026-08-01T09:00:00.000Z',
    end: '2026-08-01T09:30:00.000Z',
    attendees: ['private-booker@example.com'],
    meetingType: 'video',
    privateExtendedProperties: { bookingId: 'private-booking-id' }
  });

  assert.equal(insertCalls.length, 1);
  assert.equal(insertCalls[0].sendUpdates, 'all');
  assert.equal(logs.join('\n').includes('private-capability-token'), false);
  assert.equal(logs.join('\n').includes('private-booker@example.com'), false);
});
