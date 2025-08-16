import React, { useState } from 'react';
import { Routes, Route, Link } from 'react-router-dom';
import Calendar from 'react-calendar';
import axios from 'axios';
import { ToastContainer, toast } from 'react-toastify';
import PrivacyPolicy from './pages/PrivacyPolicy';
import TermsOfService from './pages/TermsOfService';
import 'react-calendar/dist/Calendar.css';
import 'react-toastify/dist/ReactToastify.css';
import './App.css';

function HomePage() {
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [availableSlots, setAvailableSlots] = useState([]);
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    purpose: '',
    meetingType: 'video' // 'video' or 'in-person'
  });
  const [loading, setLoading] = useState(false);
  const [userTimezone, setUserTimezone] = useState('');
  const [locationInfo, setLocationInfo] = useState(null);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [bookingDetails, setBookingDetails] = useState(null);

  const fetchAvailableSlots = async (date) => {
    try {
      setLoading(true);
      // 로컬 날짜를 YYYY-MM-DD 형식으로 변환
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      const formattedDate = `${year}-${month}-${day}`;
      console.log(`Selected date: ${date}, Formatted: ${formattedDate}`);
      
      // 사용자의 시간대를 함께 전송
      const userTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
      const response = await axios.get(`/api/calendar/available-slots?date=${formattedDate}&timezone=${encodeURIComponent(userTimezone)}`);
      setAvailableSlots(response.data.slots);
      setLocationInfo(response.data.location);
      setSelectedSlot(null);
    } catch (error) {
      toast.error('Failed to fetch available slots');
    } finally {
      setLoading(false);
    }
  };

  const handleDateChange = (date) => {
    setSelectedDate(date);
    fetchAvailableSlots(date);
  };

  const handleSlotSelect = (slot) => {
    setSelectedSlot(slot);
  };

  const handleInputChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!selectedSlot) {
      toast.error('Please select a time slot');
      return;
    }

    try {
      setLoading(true);
      // 로컬 날짜를 YYYY-MM-DD 형식으로 변환
      const year = selectedDate.getFullYear();
      const month = String(selectedDate.getMonth() + 1).padStart(2, '0');
      const day = String(selectedDate.getDate()).padStart(2, '0');
      const formattedDate = `${year}-${month}-${day}`;
      
      // 사용자 시간대 추가
      const userTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
      const bookingData = {
        ...formData,
        date: formattedDate,
        startTime: selectedSlot.start,  // ISO string 그대로 전송
        endTime: selectedSlot.end,      // ISO string 그대로 전송
        meetingType: formData.meetingType,
        userTimezone: userTimezone  // 사용자 시간대 추가
      };

      await axios.post('/api/booking/create', bookingData);
      
      // 예약 상세 정보 저장
      const slotInfo = formatTimeSlot(selectedSlot.start, selectedSlot.end, selectedDate);
      setBookingDetails({
        name: formData.name,
        email: formData.email,
        date: formattedDate,
        time: slotInfo.display,
        meetingType: formData.meetingType,
        purpose: formData.purpose
      });
      
      // 성공 모달 표시
      setShowSuccessModal(true);
      
      // 폼 초기화
      setFormData({ name: '', email: '', purpose: '', meetingType: 'video' });
      setSelectedSlot(null);
      fetchAvailableSlots(selectedDate);
    } catch (error) {
      toast.error('Failed to schedule meeting');
    } finally {
      setLoading(false);
    }
  };

  const formatTime = (dateString, showPeriod = true) => {
    const date = new Date(dateString);
    const options = { 
      hour: 'numeric', 
      minute: '2-digit',
      hour12: true,
      timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone
    };
    
    const timeStr = date.toLocaleTimeString('en-US', options);
    
    if (!showPeriod) {
      // Remove AM/PM
      return timeStr.replace(/\s*(AM|PM)$/i, '');
    }
    
    return timeStr;
  };

  const getTimePeriodColor = (dateString) => {
    const date = new Date(dateString);
    const hour = date.getHours();
    return hour < 12 ? '#4a90e2' : '#e67e22'; // Blue for AM, Orange for PM
  };

  // Format time slot with date if different from selected date
  const formatTimeSlot = (startString, endString, selectedDate) => {
    const start = new Date(startString);
    const end = new Date(endString);
    const selected = new Date(selectedDate);
    const userTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
    
    // Format times in 24-hour format
    const timeOptions = { 
      hour: '2-digit', 
      minute: '2-digit',
      hour12: false,
      timeZone: userTimezone
    };
    
    const startTime = start.toLocaleTimeString('en-US', timeOptions);
    const endTime = end.toLocaleTimeString('en-US', timeOptions);
    
    // Check if date is different from selected date
    const startDateStr = start.toLocaleDateString('en-US', { timeZone: userTimezone });
    const selectedDateStr = selected.toLocaleDateString('en-US', { timeZone: userTimezone });
    const endDateStr = end.toLocaleDateString('en-US', { timeZone: userTimezone });
    
    // Format date if different
    if (startDateStr !== selectedDateStr) {
      const dateOptions = { month: 'short', day: 'numeric' };
      const dateDisplay = start.toLocaleDateString('en-US', { ...dateOptions, timeZone: userTimezone });
      
      if (startDateStr === endDateStr) {
        // Same day but different from selected
        return {
          display: `${dateDisplay}: ${startTime} - ${endTime}`,
          isDifferentDate: true
        };
      } else {
        // Crosses midnight
        const endDateDisplay = end.toLocaleDateString('en-US', { ...dateOptions, timeZone: userTimezone });
        return {
          display: `${dateDisplay} ${startTime} - ${endDateDisplay} ${endTime}`,
          isDifferentDate: true
        };
      }
    }
    
    // Same date as selected
    return {
      display: `${startTime} - ${endTime}`,
      isDifferentDate: false
    };
  };

  // Convert office hours to user's timezone
  const convertOfficeHours = (startTime, endTime, fromTimezone, slots) => {
    try {
      // 서버 시간대에서 사용자 시간대로 변환
      const userTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
      
      // 오늘 날짜 기준으로 서버 근무시간을 계산
      const today = new Date(selectedDate);
      const dateStr = today.toISOString().split('T')[0];
      
      // 서버 시간대의 근무시간을 Date 객체로 변환
      // startTime과 endTime은 "HH:MM" 형식
      const serverStartHour = parseInt(startTime.split(':')[0]);
      const serverStartMin = parseInt(startTime.split(':')[1] || 0);
      const serverEndHour = parseInt(endTime.split(':')[0]);
      const serverEndMin = parseInt(endTime.split(':')[1] || 0);
      
      // 서버 시간대에 맞는 Date 객체 생성
      let serverStart, serverEnd;
      
      if (fromTimezone === 'Asia/Seoul') {
        // KST (UTC+9)
        serverStart = new Date(`${dateStr}T${startTime}:00+09:00`);
        serverEnd = new Date(`${dateStr}T${endTime}:00+09:00`);
      } else {
        // PST/PDT (UTC-8 or UTC-7)
        const month = today.getMonth();
        const isDST = month >= 2 && month <= 10; // 대략적인 DST 기간
        const offset = isDST ? '-07:00' : '-08:00';
        serverStart = new Date(`${dateStr}T${startTime}:00${offset}`);
        serverEnd = new Date(`${dateStr}T${endTime}:00${offset}`);
      }
      
      // 사용자 시간대로 포맷팅 (24시간 형식)
      const formatter = new Intl.DateTimeFormat('en-US', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: false,
        timeZone: userTimezone
      });
      
      const userStart = formatter.format(serverStart);
      const userEnd = formatter.format(serverEnd);
      
      // 사용자 시간대 약어 가져오기
      const tzFormatter = new Intl.DateTimeFormat('en-US', {
        timeZoneName: 'short'
      });
      const tzParts = tzFormatter.formatToParts(new Date());
      const userTimezoneName = tzParts.find(part => part.type === 'timeZoneName')?.value || '';
      
      // 날짜가 변경되는 경우 표시
      const startDay = serverStart.toLocaleDateString('en-US', { timeZone: userTimezone, weekday: 'short' });
      const endDay = serverEnd.toLocaleDateString('en-US', { timeZone: userTimezone, weekday: 'short' });
      
      let timeDisplay = `${userStart} - ${userEnd}`;
      if (startDay !== endDay) {
        // 날짜가 다른 경우 요일 표시
        timeDisplay = `${userStart} (${startDay}) - ${userEnd} (${endDay})`;
      }
      
      return {
        start: userStart,
        end: userEnd,
        display: timeDisplay,
        note: `(${userTimezoneName})`
      };
    } catch (error) {
      console.error('Error converting office hours:', error);
      return { 
        start: startTime, 
        end: endTime,
        display: `${startTime} - ${endTime}`,
        note: `(${fromTimezone === 'Asia/Seoul' ? 'KST' : 'PST/PDT'})`
      };
    }
  };

  // Get user's timezone on component mount
  React.useEffect(() => {
    const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
    const offset = new Date().getTimezoneOffset();
    const offsetHours = Math.floor(Math.abs(offset) / 60);
    const offsetMinutes = Math.abs(offset) % 60;
    const sign = offset > 0 ? '-' : '+';
    const offsetString = `UTC${sign}${offsetHours.toString().padStart(2, '0')}:${offsetMinutes.toString().padStart(2, '0')}`;
    setUserTimezone(`${timezone} (${offsetString})`);
  }, []);

  const tileDisabled = ({ date, view }) => {
    if (view === 'month') {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const threeMonthsLater = new Date(today);
      threeMonthsLater.setMonth(threeMonthsLater.getMonth() + 3);
      
      return date < today || date > threeMonthsLater;
    }
  };

  return (
    <div className="App">
      <header className="App-header">
        <div style={{ position: 'absolute', top: '20px', right: '20px' }}>
          <button
            onClick={() => window.location.href = '/admin'}
            style={{
              padding: '10px 20px',
              backgroundColor: '#4CAF50',
              color: 'white',
              border: 'none',
              borderRadius: '5px',
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: '500',
              transition: 'background-color 0.3s'
            }}
            onMouseEnter={(e) => e.target.style.backgroundColor = '#45a049'}
            onMouseLeave={(e) => e.target.style.backgroundColor = '#4CAF50'}
          >
            Log in
          </button>
        </div>
        <h1>Grab Time with Hyun</h1>
        <p>Select a date and time to book your meeting</p>
        <p className="timezone-info">Your timezone: {userTimezone}</p>
      </header>

      <div className="container">
        <div className="calendar-section">
          <h2>Select Date</h2>
          <Calendar
            onChange={handleDateChange}
            value={selectedDate}
            minDate={new Date()}
            tileDisabled={tileDisabled}
            locale="en-US"
          />
        </div>

        <div className="slots-section">
          <h2>Available Time Slots</h2>
          {locationInfo && (
            <div className="location-info">
              {(locationInfo.morningLocation || locationInfo.afternoonLocation) && (
                <div style={{ marginBottom: '15px' }}>
                  <p style={{ fontSize: '1.1em', fontWeight: 'bold', marginBottom: '10px' }}>
                    📍 Hyun's Location:
                  </p>
                  {locationInfo.morningLocation && locationInfo.afternoonLocation && 
                   locationInfo.morningLocation === locationInfo.afternoonLocation ? (
                    // Same location all day
                    <div style={{ marginBottom: '10px' }}>
                      <p style={{ marginBottom: '5px' }}>
                        <strong>All day:</strong> {locationInfo.morningLocation}
                      </p>
                      <a
                        href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(locationInfo.morningLocation)}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{
                          display: 'inline-block',
                          padding: '6px 12px',
                          backgroundColor: '#4285f4',
                          color: 'white',
                          textDecoration: 'none',
                          borderRadius: '4px',
                          fontSize: '14px',
                          fontWeight: 'normal',
                          transition: 'background-color 0.3s'
                        }}
                        onMouseEnter={(e) => e.target.style.backgroundColor = '#357ae8'}
                        onMouseLeave={(e) => e.target.style.backgroundColor = '#4285f4'}
                      >
                        🗺️ View on Google Maps
                      </a>
                    </div>
                  ) : (
                    // Different locations for morning/afternoon
                    <>
                      {locationInfo.morningLocation && (
                        <div style={{ marginBottom: '10px', padding: '8px', backgroundColor: '#e3f2fd', borderRadius: '4px' }}>
                          <p style={{ marginBottom: '5px' }}>
                            <span style={{ color: '#1976d2', fontWeight: 'bold' }}>
                              {(() => {
                                // 한국 위치인 경우, 한국시간 12시를 사용자 시간대로 변환
                                if (locationInfo && locationInfo.current === 'KR') {
                                  // 오늘 날짜로 한국시간 정오 계산
                                  const today = new Date(selectedDate);
                                  const kstNoon = new Date(today.toISOString().split('T')[0] + 'T03:00:00.000Z'); // 12:00 KST = 03:00 UTC
                                  
                                  // 사용자 시간대로 표시
                                  const userNoonTime = kstNoon.toLocaleTimeString('en-US', {
                                    hour: 'numeric',
                                    hour12: true
                                  });
                                  
                                  return `Morning (until ${userNoonTime} your time)`;
                                } else if (locationInfo && locationInfo.current === 'US') {
                                  // 미국 위치인 경우, 미국시간 12시를 사용자 시간대로 변환 
                                  const today = new Date(selectedDate);
                                  // PDT 12:00 = 19:00 UTC (여름), PST 12:00 = 20:00 UTC (겨울)
                                  const month = today.getMonth();
                                  const isDST = month >= 2 && month <= 10;
                                  const pstNoon = new Date(today.toISOString().split('T')[0] + (isDST ? 'T19:00:00.000Z' : 'T20:00:00.000Z'));
                                  
                                  const userNoonTime = pstNoon.toLocaleTimeString('en-US', {
                                    hour: 'numeric',
                                    hour12: true
                                  });
                                  
                                  return `Morning (until ${userNoonTime} your time)`;
                                }
                                return 'Morning (until 12pm)';
                              })()}:
                            </span> {locationInfo.morningLocation}
                          </p>
                          <a
                            href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(locationInfo.morningLocation)}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            style={{
                              display: 'inline-block',
                              padding: '4px 8px',
                              backgroundColor: '#1976d2',
                              color: 'white',
                              textDecoration: 'none',
                              borderRadius: '4px',
                              fontSize: '12px',
                              transition: 'background-color 0.3s'
                            }}
                            onMouseEnter={(e) => e.target.style.backgroundColor = '#1565c0'}
                            onMouseLeave={(e) => e.target.style.backgroundColor = '#1976d2'}
                          >
                            🗺️ View on Map
                          </a>
                        </div>
                      )}
                      {locationInfo.afternoonLocation && (
                        <div style={{ marginBottom: '10px', padding: '8px', backgroundColor: '#fff3e0', borderRadius: '4px' }}>
                          <p style={{ marginBottom: '5px' }}>
                            <span style={{ color: '#f57c00', fontWeight: 'bold' }}>
                              {(() => {
                                // 한국 위치인 경우, 한국시간 12시를 사용자 시간대로 변환
                                if (locationInfo && locationInfo.current === 'KR') {
                                  // 오늘 날짜로 한국시간 정오 계산
                                  const today = new Date(selectedDate);
                                  const kstNoon = new Date(today.toISOString().split('T')[0] + 'T03:00:00.000Z'); // 12:00 KST = 03:00 UTC
                                  
                                  // 사용자 시간대로 표시
                                  const userNoonTime = kstNoon.toLocaleTimeString('en-US', {
                                    hour: 'numeric',
                                    hour12: true
                                  });
                                  
                                  return `Afternoon (from ${userNoonTime} your time)`;
                                } else if (locationInfo && locationInfo.current === 'US') {
                                  // 미국 위치인 경우, 미국시간 12시를 사용자 시간대로 변환
                                  const today = new Date(selectedDate);
                                  // PDT 12:00 = 19:00 UTC (여름), PST 12:00 = 20:00 UTC (겨울)
                                  const month = today.getMonth();
                                  const isDST = month >= 2 && month <= 10;
                                  const pstNoon = new Date(today.toISOString().split('T')[0] + (isDST ? 'T19:00:00.000Z' : 'T20:00:00.000Z'));
                                  
                                  const userNoonTime = pstNoon.toLocaleTimeString('en-US', {
                                    hour: 'numeric',
                                    hour12: true
                                  });
                                  
                                  return `Afternoon (from ${userNoonTime} your time)`;
                                }
                                return 'Afternoon (from 12pm)';
                              })()}:
                            </span> {locationInfo.afternoonLocation}
                          </p>
                          <a
                            href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(locationInfo.afternoonLocation)}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            style={{
                              display: 'inline-block',
                              padding: '4px 8px',
                              backgroundColor: '#f57c00',
                              color: 'white',
                              textDecoration: 'none',
                              borderRadius: '4px',
                              fontSize: '12px',
                              transition: 'background-color 0.3s'
                            }}
                            onMouseEnter={(e) => e.target.style.backgroundColor = '#ef6c00'}
                            onMouseLeave={(e) => e.target.style.backgroundColor = '#f57c00'}
                          >
                            🗺️ View on Map
                          </a>
                        </div>
                      )}
                    </>
                  )}
                </div>
              )}
              <p>🕐 Office hours: {(() => {
                const converted = convertOfficeHours(
                  locationInfo.workingHours.start,
                  locationInfo.workingHours.end,
                  locationInfo.timezone,
                  availableSlots
                );
                return `${converted.display} ${converted.note || ''}`;
              })()}</p>
            </div>
          )}
          <div className="timezone-notice" style={{ 
            marginTop: '10px', 
            marginBottom: '15px',
            padding: '10px',
            backgroundColor: '#f0f8ff',
            borderRadius: '5px',
            fontSize: '14px',
            color: '#555'
          }}>
            {(() => {
              const tzFormatter = new Intl.DateTimeFormat('en-US', {
                timeZoneName: 'long'
              });
              const tzParts = tzFormatter.formatToParts(new Date());
              const timezoneLong = tzParts.find(part => part.type === 'timeZoneName')?.value || '';
              const tzShortFormatter = new Intl.DateTimeFormat('en-US', {
                timeZoneName: 'short'
              });
              const tzShortParts = tzShortFormatter.formatToParts(new Date());
              const timezoneShort = tzShortParts.find(part => part.type === 'timeZoneName')?.value || '';
              
              // GMT offset 계산
              const offset = new Date().getTimezoneOffset();
              const offsetHours = Math.floor(Math.abs(offset) / 60);
              const offsetMinutes = Math.abs(offset) % 60;
              const sign = offset > 0 ? '-' : '+';
              const gmtOffset = `GMT${sign}${offsetHours}${offsetMinutes > 0 ? ':' + offsetMinutes.toString().padStart(2, '0') : ''}`;
              
              return `All times are displayed in your local timezone: ${timezoneLong} (${gmtOffset})`;
            })()}
          </div>
          {loading ? (
            <p>Loading available slots...</p>
          ) : availableSlots.length > 0 ? (
            <div className="slots-grid">
              {availableSlots.map((slot, index) => {
                const slotInfo = formatTimeSlot(slot.start, slot.end, selectedDate);
                
                return (
                  <button
                    key={index}
                    className={`slot-button ${selectedSlot === slot ? 'selected' : ''} ${slotInfo.isDifferentDate ? 'different-date' : ''}`}
                    onClick={() => handleSlotSelect(slot)}
                    style={{
                      color: slotInfo.isDifferentDate ? '#d35400' : getTimePeriodColor(slot.start),
                      fontWeight: slotInfo.isDifferentDate ? 'bold' : 'normal',
                      border: slotInfo.isDifferentDate ? '2px solid #e67e22' : '1px solid #ddd',
                      backgroundColor: slotInfo.isDifferentDate ? '#fff5ee' : 'white'
                    }}
                  >
                    {slotInfo.display}
                  </button>
                );
              })}
            </div>
          ) : (
            <p>No available slots for this date</p>
          )}
        </div>

        {selectedSlot && (
          <div className="booking-form">
            <h2>Book Your Meeting</h2>
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label htmlFor="name">Name *</label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="email">Email *</label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="purpose">Meeting Purpose (Optional)</label>
                <textarea
                  id="purpose"
                  name="purpose"
                  value={formData.purpose}
                  onChange={handleInputChange}
                  rows="4"
                  placeholder="Please describe the purpose of this meeting (optional)"
                />
              </div>

              <div className="form-group">
                <label>Meeting Type *</label>
                <select
                  name="meetingType"
                  value={formData.meetingType}
                  onChange={handleInputChange}
                  required
                  style={{
                    width: '100%',
                    padding: '10px',
                    fontSize: '16px',
                    border: '1px solid #ddd',
                    borderRadius: '4px'
                  }}
                >
                  <option value="video">Video Call (Google Meet)</option>
                  <option value="in-person">In-Person Meeting</option>
                </select>
              </div>

              <div className="selected-time">
                <p>
                  Selected Time: {(() => {
                    const slotInfo = formatTimeSlot(selectedSlot.start, selectedSlot.end, selectedDate);
                    return slotInfo.display;
                  })()}
                </p>
              </div>

              <button type="submit" className="submit-button" disabled={loading}>
                {loading ? 'Scheduling...' : 'Schedule Meeting'}
              </button>
            </form>
          </div>
        )}
      </div>

      <ToastContainer position="bottom-right" />
      
      {/* Success Modal */}
      {showSuccessModal && bookingDetails && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.7)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 9999
        }}>
          <div style={{
            backgroundColor: 'white',
            padding: '40px',
            borderRadius: '12px',
            maxWidth: '500px',
            width: '90%',
            boxShadow: '0 10px 30px rgba(0, 0, 0, 0.3)',
            textAlign: 'center'
          }}>
            <h2 style={{ color: '#4CAF50', marginBottom: '20px' }}>
              ✅ Meeting Successfully Scheduled!
            </h2>
            
            <div style={{ textAlign: 'left', marginBottom: '30px' }}>
              <p style={{ marginBottom: '10px' }}>
                <strong>Name:</strong> {bookingDetails.name}
              </p>
              <p style={{ marginBottom: '10px' }}>
                <strong>Email:</strong> {bookingDetails.email}
              </p>
              <p style={{ marginBottom: '10px' }}>
                <strong>Date:</strong> {bookingDetails.date}
              </p>
              <p style={{ marginBottom: '10px' }}>
                <strong>Time:</strong> {bookingDetails.time}
              </p>
              <p style={{ marginBottom: '10px' }}>
                <strong>Meeting Type:</strong> {bookingDetails.meetingType === 'video' ? 'Video Call (Google Meet)' : 'In-Person Meeting'}
              </p>
              {bookingDetails.purpose && (
                <p style={{ marginBottom: '10px' }}>
                  <strong>Purpose:</strong> {bookingDetails.purpose}
                </p>
              )}
            </div>
            
            <div style={{
              backgroundColor: '#e3f2fd',
              padding: '20px',
              borderRadius: '8px',
              marginBottom: '20px'
            }}>
              <p style={{ fontSize: '18px', marginBottom: '10px' }}>
                📧 <strong>Please check your email!</strong>
              </p>
              <p style={{ fontSize: '14px', color: '#666' }}>
                We've sent a confirmation email to <strong>{bookingDetails.email}</strong> with all the meeting details
                {bookingDetails.meetingType === 'video' && ' including the Google Meet link'}.
              </p>
            </div>
            
            <button
              onClick={() => setShowSuccessModal(false)}
              style={{
                backgroundColor: '#2196F3',
                color: 'white',
                border: 'none',
                padding: '12px 30px',
                borderRadius: '6px',
                fontSize: '16px',
                cursor: 'pointer',
                transition: 'background-color 0.3s'
              }}
              onMouseEnter={(e) => e.target.style.backgroundColor = '#1976D2'}
              onMouseLeave={(e) => e.target.style.backgroundColor = '#2196F3'}
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function App() {
  return (
    <div>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/privacy" element={<PrivacyPolicy />} />
        <Route path="/terms" element={<TermsOfService />} />
      </Routes>
      
      {/* Footer with legal links */}
      <footer style={{
        marginTop: '50px',
        padding: '20px',
        textAlign: 'center',
        borderTop: '1px solid #e0e0e0',
        backgroundColor: '#f5f5f5'
      }}>
        <Link to="/privacy" style={{ margin: '0 10px' }}>Privacy Policy</Link>
        <Link to="/terms" style={{ margin: '0 10px' }}>Terms of Service</Link>
      </footer>
    </div>
  );
}

export default App;