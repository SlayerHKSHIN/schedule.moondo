// Simulate browser environment with different timezones
console.log('=== BROWSER DATE SELECTION SIMULATION ===\n');

// Simulate user selecting Aug 23, 2025 in calendar
function simulateDateSelection(year, month, day, userTimezone) {
  // In browser, when user clicks on Aug 23, JavaScript creates:
  // new Date(2025, 7, 23) - month is 0-indexed, so 7 = August
  // This creates date in LOCAL timezone
  
  // Simulate browser creating date object
  const selectedDate = new Date(year, month - 1, day);
  
  console.log(`User in ${userTimezone} selects: ${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`);
  console.log(`  Browser Date object: ${selectedDate}`);
  console.log(`  getFullYear(): ${selectedDate.getFullYear()}`);
  console.log(`  getMonth(): ${selectedDate.getMonth() + 1}`);
  console.log(`  getDate(): ${selectedDate.getDate()}`);
  
  // Old problematic method
  const oldMethod = selectedDate.toISOString().split('T')[0];
  
  // New fixed method
  const newYear = selectedDate.getFullYear();
  const newMonth = String(selectedDate.getMonth() + 1).padStart(2, '0');
  const newDay = String(selectedDate.getDate()).padStart(2, '0');
  const newMethod = `${newYear}-${newMonth}-${newDay}`;
  
  console.log(`  Old method sends to server: ${oldMethod}`);
  console.log(`  New method sends to server: ${newMethod}`);
  console.log(`  Problem fixed: ${oldMethod !== newMethod ? '✓ Yes' : '✗ No'}`);
  console.log('');
  
  return {
    selectedDate,
    oldMethod,
    newMethod
  };
}

// Test Case 1: Korean user selects Aug 23
console.log('Test 1: Korean user (KST/UTC+9)');
process.env.TZ = 'Asia/Seoul';
simulateDateSelection(2025, 8, 23, 'Asia/Seoul');

// Test Case 2: When it's already Aug 23 in Korea but still Aug 22 in UTC
console.log('Test 2: Edge case - Aug 23 early morning in Korea');
// At Aug 23 08:00 KST, it's still Aug 22 23:00 UTC
const kstMorning = new Date('2025-08-23T08:00:00+09:00');
console.log(`  Current time: ${kstMorning}`);
console.log(`  ISO String: ${kstMorning.toISOString()}`);
console.log(`  Date in KST: 2025-08-23`);
console.log(`  toISOString().split('T')[0]: ${kstMorning.toISOString().split('T')[0]}`);
console.log(`  Problem: Shows Aug 22 instead of Aug 23!`);
console.log('');

// Test Case 3: US user selects Aug 23
console.log('Test 3: US West Coast user (PDT/UTC-7)');
process.env.TZ = 'America/Los_Angeles';
simulateDateSelection(2025, 8, 23, 'America/Los_Angeles');

// Real-world scenario simulation
console.log('=== REAL-WORLD BOOKING SCENARIO ===\n');

function simulateBooking(dateStr, timeStr, timezone) {
  console.log(`Scenario: User in ${timezone}`);
  console.log(`  Wants to book: ${dateStr} at ${timeStr}`);
  
  // Parse the date parts
  const [year, month, day] = dateStr.split('-').map(Number);
  
  // Create date object (as browser would)
  const selectedDate = new Date(year, month - 1, day);
  
  // Old method
  const oldDateStr = selectedDate.toISOString().split('T')[0];
  
  // New method  
  const newDateStr = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
  
  console.log(`  Old method would send: ${oldDateStr} ${timeStr}`);
  console.log(`  New method sends: ${newDateStr} ${timeStr}`);
  console.log(`  Correct date preserved: ${oldDateStr === newDateStr ? '✗ No' : '✓ Yes'}`);
  console.log('');
}

// Problematic scenarios
simulateBooking('2025-08-23', '8:30 PM', 'Asia/Seoul');
simulateBooking('2025-08-23', '10:00 AM', 'Asia/Seoul');
simulateBooking('2025-08-24', '1:00 AM', 'Asia/Seoul');

console.log('=== SUMMARY ===\n');
console.log('The problem occurs because:');
console.log('1. User selects a date in their local timezone (e.g., Aug 23 in Korea)');
console.log('2. JavaScript Date object is created in local time');
console.log('3. toISOString() converts to UTC, potentially changing the date');
console.log('4. For users in timezones ahead of UTC (like Korea), dates can shift backward');
console.log('');
console.log('The fix:');
console.log('- Use getFullYear(), getMonth(), getDate() to extract local date components');
console.log('- Format as YYYY-MM-DD without timezone conversion');
console.log('- This preserves the date the user actually selected');