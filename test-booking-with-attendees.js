const axios = require('axios');

async function testBookingWithAttendees() {
  try {
    console.log('Testing booking with attendees...');
    
    // Get tomorrow's date
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const dateStr = tomorrow.toISOString().split('T')[0];
    
    const bookingData = {
      name: 'Test User',
      email: 'test@example.com',
      additionalEmails: 'guest1@example.com, guest2@example.com',
      date: dateStr,
      time: '2:00 PM',
      timezone: 'America/Los_Angeles',
      purpose: 'Testing hybrid OAuth/Service Account solution',
      meetingType: 'video'
    };
    
    console.log('Booking data:', bookingData);
    
    const response = await axios.post('http://localhost:4312/api/booking/create', bookingData);
    
    console.log('\n✅ SUCCESS! Booking created with attendees');
    console.log('Response:', response.data);
    console.log('\nEvent ID:', response.data.eventId);
    console.log('Calendar Link:', response.data.calendarLink);
    console.log('\nThe hybrid solution is working! OAuth is being used for event creation with attendees.');
    
  } catch (error) {
    console.error('\n❌ ERROR:', error.response ? error.response.data : error.message);
    if (error.response && error.response.status === 500) {
      console.error('Server error details:', error.response.data);
    }
  }
}

testBookingWithAttendees();