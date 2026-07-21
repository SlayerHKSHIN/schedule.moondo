const crypto = require('node:crypto');

const TOKEN_PATTERN = /^([0-9a-f-]{36})\.([A-Za-z0-9_-]{43})$/;

function getManagementSecret() {
  const secret = process.env.BOOKING_MANAGEMENT_SECRET;
  if (!secret || secret.length < 32) {
    throw new Error('BOOKING_MANAGEMENT_SECRET must contain at least 32 characters');
  }
  return secret;
}

function assertBookingManagementConfig() {
  getManagementSecret();
}

function signBookingId(bookingId) {
  return crypto
    .createHmac('sha256', getManagementSecret())
    .update(`schedule-moondo-booking:${bookingId}`)
    .digest('base64url');
}

function createManagementToken(bookingId) {
  return `${bookingId}.${signBookingId(bookingId)}`;
}

function verifyManagementToken(token) {
  const match = TOKEN_PATTERN.exec(typeof token === 'string' ? token : '');
  if (!match) {
    return null;
  }

  const [, bookingId, suppliedSignature] = match;
  const expectedSignature = signBookingId(bookingId);
  const supplied = Buffer.from(suppliedSignature);
  const expected = Buffer.from(expectedSignature);

  if (supplied.length !== expected.length || !crypto.timingSafeEqual(supplied, expected)) {
    return null;
  }

  return bookingId;
}

function getManageUrl(token) {
  const origin = (process.env.APP_ORIGIN || 'https://schedule.moondo.ai').replace(/\/$/, '');
  return `${origin}/manage#${token}`;
}

module.exports = {
  assertBookingManagementConfig,
  createManagementToken,
  getManageUrl,
  verifyManagementToken
};
