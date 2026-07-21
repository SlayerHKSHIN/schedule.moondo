const moment = require('moment-timezone');

function invalidBookingTime(message) {
  const error = new Error(message);
  error.code = 'INVALID_BOOKING_TIME';
  return error;
}

function parseManagedBookingWindow({ date, time, durationMinutes, timezone }) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date || '')) {
    throw invalidBookingTime('A valid booking date is required');
  }
  if (!moment.tz.zone(timezone || '')) {
    throw invalidBookingTime('A valid IANA timezone is required');
  }
  if (![30, 60].includes(durationMinutes)) {
    throw invalidBookingTime('Duration must be 30 or 60 minutes');
  }

  const start = moment.tz(
    `${date} ${time || ''}`,
    ['YYYY-MM-DD HH:mm', 'YYYY-MM-DD h:mm A'],
    true,
    timezone
  );
  if (!start.isValid()) {
    throw invalidBookingTime('A valid booking time is required');
  }

  return {
    start: start.toISOString(),
    end: start.clone().add(durationMinutes, 'minutes').toISOString()
  };
}

module.exports = { parseManagedBookingWindow };
