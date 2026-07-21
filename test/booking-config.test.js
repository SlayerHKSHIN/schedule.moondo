const assert = require('node:assert/strict');
const test = require('node:test');

const { assertBookingManagementConfig } = require('../utils/bookingAccess');

test('requires a distinct high-entropy booking management secret at startup', () => {
  const original = process.env.BOOKING_MANAGEMENT_SECRET;
  delete process.env.BOOKING_MANAGEMENT_SECRET;

  try {
    assert.throws(
      () => assertBookingManagementConfig(),
      /BOOKING_MANAGEMENT_SECRET must contain at least 32 characters/
    );
    process.env.BOOKING_MANAGEMENT_SECRET = 'valid-test-booking-secret-at-least-32-characters';
    assert.doesNotThrow(() => assertBookingManagementConfig());
  } finally {
    if (original === undefined) {
      delete process.env.BOOKING_MANAGEMENT_SECRET;
    } else {
      process.env.BOOKING_MANAGEMENT_SECRET = original;
    }
  }
});
