/**
 * Universal timezone support using Intl API
 * Supports ALL timezones globally without hardcoding
 */

/**
 * Get timezone offset for ANY timezone in the world
 * @param {string} timezone - IANA timezone string (e.g., 'America/Chicago', 'Europe/Berlin')
 * @param {Date} date - Date to check for DST
 * @returns {string} Offset string (e.g., '-05:00', '+09:00')
 */
const getUniversalTimezoneOffset = (timezone, date = new Date()) => {
  try {
    // Create a date formatter for the specific timezone
    const formatter = new Intl.DateTimeFormat('en-US', {
      timeZone: timezone,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false,
      timeZoneName: 'longOffset'
    });

    // Format the date in the target timezone
    const parts = formatter.formatToParts(date);
    
    // Extract the timezone offset
    const offsetPart = parts.find(part => part.type === 'timeZoneName');
    if (offsetPart && offsetPart.value) {
      // Extract offset from strings like "GMT-05:00" or "GMT+09:00"
      const match = offsetPart.value.match(/GMT([+-]\d{2}:\d{2})/);
      if (match) {
        return match[1];
      }
    }

    // Fallback: Calculate offset manually
    // Create same date in UTC and target timezone
    const utcDate = new Date(date.toLocaleString('en-US', { timeZone: 'UTC' }));
    const tzDate = new Date(date.toLocaleString('en-US', { timeZone: timezone }));
    
    // Calculate difference in minutes
    const offsetMinutes = (utcDate - tzDate) / 60000;
    
    // Format as ±HH:MM
    const sign = offsetMinutes >= 0 ? '+' : '-';
    const absMinutes = Math.abs(offsetMinutes);
    const hours = Math.floor(absMinutes / 60);
    const minutes = absMinutes % 60;
    
    return `${sign}${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
  } catch (error) {
    console.error(`Error getting offset for timezone ${timezone}:`, error);
    // If timezone is invalid, return UTC
    return '+00:00';
  }
};

/**
 * Validate if a timezone string is valid
 * @param {string} timezone - Timezone to validate
 * @returns {boolean} True if valid
 */
const isValidTimezone = (timezone) => {
  try {
    new Intl.DateTimeFormat('en-US', { timeZone: timezone });
    return true;
  } catch (error) {
    return false;
  }
};

/**
 * Get all available timezones (for dropdown if needed)
 * Note: This returns a subset of common timezones for UI purposes
 * but the system supports ALL IANA timezones
 */
const getCommonTimezones = () => {
  // This is just for UI dropdown - system accepts ANY valid IANA timezone
  return Intl.supportedValuesOf('timeZone');
};

/**
 * Convert local time to UTC
 * @param {string} dateStr - Date in YYYY-MM-DD format
 * @param {string} timeStr - Time like "2:30 PM"
 * @param {string} timezone - Any IANA timezone
 * @returns {Date} UTC Date object
 */
const convertToUTC = (dateStr, timeStr, timezone) => {
  // Parse time
  const [timePart, period] = timeStr.split(' ');
  const [hours, minutes] = timePart.split(':');
  let hour = parseInt(hours);
  
  if (period === 'PM' && hour !== 12) {
    hour += 12;
  } else if (period === 'AM' && hour === 12) {
    hour = 0;
  }
  
  // Get timezone offset
  const timeString = `${String(hour).padStart(2, '0')}:${minutes || '00'}:00`;
  const dateTimeStr = `${dateStr}T${timeString}`;
  
  // Get offset for this specific date (handles DST)
  const offset = getUniversalTimezoneOffset(timezone, new Date(dateTimeStr));
  
  // Create ISO string with offset
  const isoString = `${dateTimeStr}${offset}`;
  
  // Return Date object (will be in UTC)
  return new Date(isoString);
};

/**
 * Format UTC time for display in user's timezone
 * @param {Date|string} utcDate - UTC date
 * @param {string} timezone - Target timezone
 * @returns {string} Formatted date/time string
 */
const formatInTimezone = (utcDate, timezone) => {
  const date = new Date(utcDate);
  return date.toLocaleString('en-US', {
    timeZone: timezone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true
  });
};

// Export for CommonJS
module.exports = {
  getUniversalTimezoneOffset,
  isValidTimezone,
  getCommonTimezones,
  convertToUTC,
  formatInTimezone
};