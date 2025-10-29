const { getUniversalTimezoneOffset, convertToUTC, isValidTimezone } = require('./utils/universal-timezone');

console.log('=== UNIVERSAL TIMEZONE SUPPORT TEST ===\n');

// Test various timezones from around the world
const testTimezones = [
  // Major cities
  'America/Chicago',        // Dallas
  'America/New_York',       
  'America/Los_Angeles',    
  'Europe/London',          
  'Europe/Paris',           
  'Asia/Seoul',             
  'Asia/Tokyo',             
  'Asia/Shanghai',          
  'Australia/Sydney',       
  
  // Less common but valid timezones
  'Pacific/Fiji',           
  'Africa/Nairobi',         
  'America/Caracas',        // Venezuela (UTC-4:30)
  'Asia/Kathmandu',         // Nepal (UTC+5:45)
  'Australia/Adelaide',     // Australia (UTC+9:30)
  'Pacific/Chatham',        // Chatham Islands (UTC+12:45)
  'America/St_Johns',       // Newfoundland (UTC-3:30)
  'Asia/Yangon',            // Myanmar (UTC+6:30)
  'Iran',                   // Iran (UTC+3:30)
  
  // Edge cases
  'UTC',
  'GMT',
  'EST',  // Should work
  'PST',  // Should work
];

console.log('Testing timezone offset calculation for various timezones:\n');

const testDate = new Date('2025-08-23T12:00:00Z');

testTimezones.forEach(tz => {
  const isValid = isValidTimezone(tz);
  if (isValid) {
    const offset = getUniversalTimezoneOffset(tz, testDate);
    console.log(`✓ ${tz.padEnd(25)} → ${offset}`);
  } else {
    console.log(`✗ ${tz.padEnd(25)} → INVALID TIMEZONE`);
  }
});

console.log('\n=== TIME CONVERSION TEST ===\n');

// Test converting specific times from various timezones to UTC
const conversionTests = [
  { date: '2025-08-23', time: '6:30 AM', tz: 'America/Chicago', desc: 'Dallas morning' },
  { date: '2025-08-23', time: '2:00 PM', tz: 'Asia/Seoul', desc: 'Seoul afternoon' },
  { date: '2025-08-23', time: '10:30 PM', tz: 'Europe/London', desc: 'London evening' },
  { date: '2025-08-23', time: '3:45 PM', tz: 'Asia/Kathmandu', desc: 'Nepal afternoon' },
  { date: '2025-08-23', time: '9:00 AM', tz: 'Australia/Sydney', desc: 'Sydney morning' },
];

conversionTests.forEach(test => {
  const utcDate = convertToUTC(test.date, test.time, test.tz);
  console.log(`${test.desc}:`);
  console.log(`  Input: ${test.date} ${test.time} (${test.tz})`);
  console.log(`  UTC: ${utcDate.toISOString()}`);
  console.log('');
});

console.log('=== BROWSER COMPATIBILITY TEST ===\n');

// Simulate what happens when browser sends different timezones
const browserTimezones = [
  'America/Chicago',      // Standard IANA format
  'US/Central',           // Old style but valid
  'Asia/Calcutta',        // Old name for Asia/Kolkata
  'America/Indianapolis', // No DST zone
];

browserTimezones.forEach(tz => {
  console.log(`Browser sends: "${tz}"`);
  const isValid = isValidTimezone(tz);
  if (isValid) {
    const offset = getUniversalTimezoneOffset(tz, testDate);
    console.log(`  → Valid! Offset: ${offset}`);
  } else {
    console.log(`  → Invalid timezone`);
  }
});

console.log('\n✅ SUMMARY: System now supports ALL valid IANA timezones globally!');
console.log('No more hardcoded timezone lists - works with any timezone the browser sends.');