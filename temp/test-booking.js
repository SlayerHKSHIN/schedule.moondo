const axios = require('axios');

// Test configuration
const API_URL = 'http://localhost:4312/api/booking/create';

// Test scenarios
const testScenarios = [
  {
    name: 'Test 1: Korean user booking for Aug 23 PM',
    data: {
      name: '테스트유저1',
      email: 'test1@example.com',
      date: '2025-08-23',
      time: '8:30 PM',
      timezone: 'Asia/Seoul',
      purpose: 'KST 8월 23일 오후 예약 테스트',
      meetingType: 'video'
    },
    expected: {
      date: '2025-08-23',
      timeUTC: '2025-08-23T11:30:00.000Z'
    }
  },
  {
    name: 'Test 2: Korean user booking for Aug 23 AM',
    data: {
      name: '테스트유저2',
      email: 'test2@example.com',
      date: '2025-08-23',
      time: '10:30 AM',
      timezone: 'Asia/Seoul',
      purpose: 'KST 8월 23일 오전 예약 테스트',
      meetingType: 'video'
    },
    expected: {
      date: '2025-08-23',
      timeUTC: '2025-08-23T01:30:00.000Z'
    }
  },
  {
    name: 'Test 3: US West Coast user booking for Aug 23',
    data: {
      name: 'TestUser3',
      email: 'test3@example.com',
      date: '2025-08-23',
      time: '2:00 PM',
      timezone: 'America/Los_Angeles',
      purpose: 'PDT Aug 23 afternoon booking test',
      meetingType: 'video'
    },
    expected: {
      date: '2025-08-23',
      timeUTC: '2025-08-23T21:00:00.000Z'  // 2PM PDT = 9PM UTC
    }
  },
  {
    name: 'Test 4: Edge case - late night booking',
    data: {
      name: '테스트유저4',
      email: 'test4@example.com',
      date: '2025-08-23',
      time: '11:30 PM',
      timezone: 'Asia/Seoul',
      purpose: 'KST 8월 23일 심야 예약 테스트',
      meetingType: 'video'
    },
    expected: {
      date: '2025-08-23',
      timeUTC: '2025-08-23T14:30:00.000Z'  // 11:30PM KST = 2:30PM UTC
    }
  },
  {
    name: 'Test 5: Edge case - early morning booking',
    data: {
      name: '테스트유저5',
      email: 'test5@example.com',
      date: '2025-08-24',
      time: '12:30 AM',
      timezone: 'Asia/Seoul',
      purpose: 'KST 8월 24일 자정 직후 예약 테스트',
      meetingType: 'in-person'
    },
    expected: {
      date: '2025-08-24',
      timeUTC: '2025-08-23T15:30:00.000Z'  // 12:30AM KST Aug 24 = 3:30PM UTC Aug 23
    }
  }
];

// Function to test date conversion locally
function testDateConversion(dateStr, timeStr, timezone) {
  // Parse time
  const [timePart, period] = timeStr.split(' ');
  const [hours, minutes] = timePart.split(':');
  let hour = parseInt(hours);
  
  if (period === 'PM' && hour !== 12) {
    hour += 12;
  } else if (period === 'AM' && hour === 12) {
    hour = 0;
  }
  
  const timeString = `${String(hour).padStart(2, '0')}:${minutes || '00'}`;
  
  // Get timezone offset
  const getTimezoneOffset = (tz, dateStr) => {
    if (tz.includes('Seoul') || tz.includes('Asia/Seoul')) {
      return '+09:00';
    } else if (tz.includes('Los_Angeles') || tz.includes('America/Los_Angeles')) {
      const testDate = new Date(dateStr);
      const month = testDate.getMonth();
      const isDST = month >= 2 && month <= 10;
      return isDST ? '-07:00' : '-08:00';
    } else if (tz.includes('New_York') || tz.includes('America/New_York')) {
      const testDate = new Date(dateStr);
      const month = testDate.getMonth();
      const isDST = month >= 2 && month <= 10;
      return isDST ? '-04:00' : '-05:00';
    }
    return '+00:00';
  };
  
  const tzOffset = getTimezoneOffset(timezone, dateStr);
  const startDateTime = new Date(`${dateStr}T${timeString}:00${tzOffset}`);
  
  return {
    localTime: `${dateStr} ${timeStr} (${timezone})`,
    utcTime: startDateTime.toISOString(),
    localTimeVerify: startDateTime.toLocaleString('en-US', { timeZone: timezone })
  };
}

// Test date conversions
console.log('=== DATE CONVERSION TESTS ===\n');

testScenarios.forEach(scenario => {
  console.log(`${scenario.name}:`);
  const result = testDateConversion(
    scenario.data.date,
    scenario.data.time,
    scenario.data.timezone
  );
  console.log(`  Input: ${result.localTime}`);
  console.log(`  UTC: ${result.utcTime}`);
  console.log(`  Expected UTC: ${scenario.expected.timeUTC}`);
  console.log(`  Match: ${result.utcTime === scenario.expected.timeUTC ? '✓' : '✗'}`);
  console.log(`  Local verify: ${result.localTimeVerify}`);
  console.log('');
});

// Test with actual API
async function testBookingAPI() {
  console.log('=== API BOOKING TESTS ===\n');
  console.log('Note: These are dry-run tests showing what would be sent to the API\n');
  
  for (const scenario of testScenarios) {
    console.log(`${scenario.name}:`);
    console.log(`  Request payload:`);
    console.log(`    Date: ${scenario.data.date}`);
    console.log(`    Time: ${scenario.data.time}`);
    console.log(`    Timezone: ${scenario.data.timezone}`);
    
    const conversion = testDateConversion(
      scenario.data.date,
      scenario.data.time,
      scenario.data.timezone
    );
    
    console.log(`  Expected result:`);
    console.log(`    UTC time: ${conversion.utcTime}`);
    console.log(`    Calendar entry: ${conversion.localTimeVerify}`);
    console.log('');
  }
}

// Test client-side date formatting
console.log('=== CLIENT-SIDE DATE FORMATTING TEST ===\n');

function testClientDateFormatting(dateObj) {
  // Old method (problematic)
  const oldMethod = dateObj.toISOString().split('T')[0];
  
  // New method (fixed)
  const year = dateObj.getFullYear();
  const month = String(dateObj.getMonth() + 1).padStart(2, '0');
  const day = String(dateObj.getDate()).padStart(2, '0');
  const newMethod = `${year}-${month}-${day}`;
  
  return {
    date: dateObj.toString(),
    oldMethod: oldMethod,
    newMethod: newMethod,
    matches: oldMethod === newMethod
  };
}

// Test different dates in KST
const testDates = [
  new Date('2025-08-23T00:00:00+09:00'), // Aug 23 00:00 KST
  new Date('2025-08-23T09:00:00+09:00'), // Aug 23 09:00 KST  
  new Date('2025-08-23T23:59:59+09:00'), // Aug 23 23:59 KST
  new Date('2025-08-24T00:00:00+09:00'), // Aug 24 00:00 KST
];

testDates.forEach(date => {
  const result = testClientDateFormatting(date);
  console.log(`Date: ${result.date}`);
  console.log(`  Old method (toISOString): ${result.oldMethod}`);
  console.log(`  New method (local date): ${result.newMethod}`);
  console.log(`  Issue: ${!result.matches ? '✗ Different dates!' : '✓ Same date'}`);
  console.log('');
});

// Run API tests
testBookingAPI();