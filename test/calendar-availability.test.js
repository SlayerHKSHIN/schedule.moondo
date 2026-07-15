const test = require('node:test');
const assert = require('node:assert/strict');

const { calculateAvailableSlots } = require('../utils/googleCalendar');

const transparentHoliday = {
  summary: '휴일',
  start: { date: '2026-07-17' },
  end: { date: '2026-07-18' },
  transparency: 'transparent',
  status: 'confirmed'
};

const outOfOffice = (start, end) => ({
  summary: '부재중',
  start: { dateTime: start, timeZone: 'Asia/Seoul' },
  end: { dateTime: end, timeZone: 'Asia/Seoul' },
  status: 'confirmed',
  eventType: 'outOfOffice'
});

const calculateFor = (date, events) => calculateAvailableSlots({
  date,
  duration: 30,
  timeOfDay: 'all',
  userTimezone: 'Asia/Seoul',
  serverTimezone: 'Asia/Seoul',
  detectedLocation: 'KR',
  events,
  now: new Date('2026-07-15T00:00:00.000Z')
});

test('returns Friday availability from 10:00 through 22:00 KST', () => {
  const slots = calculateFor('2026-07-17', [
    transparentHoliday,
    outOfOffice('2026-07-17T00:00:00+09:00', '2026-07-17T10:00:00+09:00'),
    outOfOffice('2026-07-17T22:00:00+09:00', '2026-07-18T00:00:00+09:00')
  ]);

  assert.equal(slots.length, 24);
  assert.equal(slots[0].start, '2026-07-17T01:00:00.000Z');
  assert.equal(slots.at(-1).end, '2026-07-17T13:00:00.000Z');
});

test('returns Saturday availability from 14:00 through 22:00 KST', () => {
  const slots = calculateFor('2026-07-18', [
    outOfOffice('2026-07-18T00:00:00+09:00', '2026-07-18T14:00:00+09:00'),
    outOfOffice('2026-07-18T22:00:00+09:00', '2026-07-19T00:00:00+09:00')
  ]);

  assert.equal(slots.length, 16);
  assert.equal(slots[0].start, '2026-07-18T05:00:00.000Z');
  assert.equal(slots.at(-1).end, '2026-07-18T13:00:00.000Z');
});
