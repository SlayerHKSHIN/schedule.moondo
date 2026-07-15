const test = require('node:test');
const assert = require('node:assert/strict');

const { getCalendarReadConfig } = require('../utils/googleCalendar');

test('reads the h@moondo.ai calendar through OAuth by default', () => {
  assert.deepEqual(getCalendarReadConfig(), {
    calendarId: 'h@moondo.ai',
    useServiceAccount: false
  });
});
