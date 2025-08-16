import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import axios from 'axios';
import { toast } from 'react-toastify';
import { theme } from '../styles/theme';

const Container = styled.div`
  min-height: 100vh;
  background: linear-gradient(135deg, ${props => props.theme.colors.background.default} 0%, ${props => props.theme.colors.beige.light} 100%);
  padding: ${props => props.theme.spacing.md};
  
  @media (min-width: ${props => props.theme.breakpoints.tablet}) {
    padding: ${props => props.theme.spacing.xl};
  }
`;

const LoginCard = styled.div`
  max-width: 400px;
  margin: 10vh auto;
  background: ${props => props.theme.colors.background.paper};
  border-radius: ${props => props.theme.borderRadius.lg};
  padding: ${props => props.theme.spacing.xl};
  box-shadow: ${props => props.theme.shadows.lg};
  animation: slideUp 0.5s ease-out;
`;

const AdminPanel = styled.div`
  max-width: 1200px;
  margin: 0 auto;
`;

const Header = styled.header`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: ${props => props.theme.spacing.xl};
  flex-wrap: wrap;
  gap: ${props => props.theme.spacing.md};
`;

const Title = styled.h1`
  font-size: 2rem;
  color: ${props => props.theme.colors.text.primary};
  font-weight: 600;
  
  @media (min-width: ${props => props.theme.breakpoints.tablet}) {
    font-size: 2.5rem;
  }
`;

const LogoutButton = styled.button`
  padding: ${props => props.theme.spacing.sm} ${props => props.theme.spacing.lg};
  background: ${props => props.theme.colors.pastel.rose};
  color: ${props => props.theme.colors.text.primary};
  border-radius: ${props => props.theme.borderRadius.md};
  font-weight: 500;
  transition: all ${props => props.theme.transitions.fast};
  
  &:hover {
    background: ${props => props.theme.colors.error};
    color: white;
    transform: translateY(-2px);
  }
`;

const Card = styled.div`
  background: ${props => props.theme.colors.background.paper};
  border-radius: ${props => props.theme.borderRadius.lg};
  padding: ${props => props.theme.spacing.lg};
  margin-bottom: ${props => props.theme.spacing.xl};
  box-shadow: ${props => props.theme.shadows.md};
  animation: slideUp 0.5s ease-out;
  animation-delay: ${props => props.$delay || '0s'};
  animation-fill-mode: both;
`;

const SectionTitle = styled.h2`
  font-size: 1.5rem;
  color: ${props => props.theme.colors.text.primary};
  margin-bottom: ${props => props.theme.spacing.lg};
  display: flex;
  align-items: center;
  gap: ${props => props.theme.spacing.sm};
  
  &::before {
    content: '';
    width: 4px;
    height: 24px;
    background: ${props => props.theme.colors.pastel.lavender};
    border-radius: 2px;
  }
`;

const Form = styled.form`
  display: flex;
  flex-direction: column;
  gap: ${props => props.theme.spacing.lg};
`;

const FormGroup = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${props => props.theme.spacing.sm};
`;

const FormRow = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: ${props => props.theme.spacing.lg};
  
  @media (max-width: ${props => props.theme.breakpoints.tablet}) {
    grid-template-columns: 1fr;
  }
`;

const Label = styled.label`
  color: ${props => props.theme.colors.text.primary};
  font-weight: 500;
  font-size: 0.95rem;
`;

const Input = styled.input`
  padding: ${props => props.theme.spacing.md};
  border-radius: ${props => props.theme.borderRadius.md};
  border: 2px solid ${props => props.theme.colors.border.light};
  background: ${props => props.theme.colors.background.card};
  font-size: 1rem;
  transition: all ${props => props.theme.transitions.fast};
  
  &:focus {
    border-color: ${props => props.theme.colors.pastel.lavender};
    background: ${props => props.theme.colors.background.paper};
    outline: none;
    box-shadow: 0 0 0 3px ${props => props.theme.colors.pastel.lavender}33;
  }
`;

const Select = styled.select`
  padding: ${props => props.theme.spacing.md};
  border-radius: ${props => props.theme.borderRadius.md};
  border: 2px solid ${props => props.theme.colors.border.light};
  background: ${props => props.theme.colors.background.card};
  font-size: 1rem;
  transition: all ${props => props.theme.transitions.fast};
  cursor: pointer;
  
  &:focus {
    border-color: ${props => props.theme.colors.pastel.lavender};
    background: ${props => props.theme.colors.background.paper};
    outline: none;
    box-shadow: 0 0 0 3px ${props => props.theme.colors.pastel.lavender}33;
  }
`;

const Button = styled.button`
  padding: ${props => props.theme.spacing.md} ${props => props.theme.spacing.xl};
  background: linear-gradient(135deg, ${props => props.theme.colors.primary}, ${props => props.theme.colors.beige.darker});
  color: white;
  border-radius: ${props => props.theme.borderRadius.md};
  font-size: 1rem;
  font-weight: 600;
  transition: all ${props => props.theme.transitions.normal};
  box-shadow: ${props => props.theme.shadows.md};
  
  &:hover:not(:disabled) {
    transform: translateY(-2px);
    box-shadow: ${props => props.theme.shadows.lg};
  }
  
  &:disabled {
    background: ${props => props.theme.colors.border.light};
    cursor: not-allowed;
  }
`;

const BookingsList = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${props => props.theme.spacing.md};
  max-height: 600px;
  overflow-y: auto;
  padding-right: ${props => props.theme.spacing.sm};
  
  &::-webkit-scrollbar {
    width: 6px;
  }
  
  &::-webkit-scrollbar-thumb {
    background: ${props => props.theme.colors.border.main};
    border-radius: 3px;
  }
`;

const BookingCard = styled.div`
  background: ${props => props.theme.colors.background.card};
  border-radius: ${props => props.theme.borderRadius.md};
  padding: ${props => props.theme.spacing.md};
  border-left: 4px solid ${props => props.theme.colors.pastel.peach};
  transition: all ${props => props.theme.transitions.fast};
  
  &:hover {
    background: ${props => props.theme.colors.background.hover};
    transform: translateX(4px);
  }
`;

const BookingHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: start;
  margin-bottom: ${props => props.theme.spacing.sm};
  flex-wrap: wrap;
  gap: ${props => props.theme.spacing.sm};
`;

const BookingTitle = styled.h3`
  font-size: 1.1rem;
  color: ${props => props.theme.colors.text.primary};
  font-weight: 500;
`;

const BookingDate = styled.span`
  color: ${props => props.theme.colors.text.secondary};
  font-size: 0.9rem;
  background: ${props => props.theme.colors.pastel.sky};
  padding: ${props => props.theme.spacing.xs} ${props => props.theme.spacing.sm};
  border-radius: ${props => props.theme.borderRadius.sm};
`;

const BookingDetail = styled.p`
  color: ${props => props.theme.colors.text.secondary};
  font-size: 0.95rem;
  margin-bottom: ${props => props.theme.spacing.xs};
`;

const CancelButton = styled.button`
  margin-top: ${props => props.theme.spacing.sm};
  padding: ${props => props.theme.spacing.xs} ${props => props.theme.spacing.md};
  background: ${props => props.theme.colors.pastel.rose};
  color: ${props => props.theme.colors.text.primary};
  border-radius: ${props => props.theme.borderRadius.sm};
  font-size: 0.9rem;
  transition: all ${props => props.theme.transitions.fast};
  
  &:hover {
    background: ${props => props.theme.colors.error};
    color: white;
  }
`;

const AvailabilityGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: ${props => props.theme.spacing.lg};
`;

const DayCard = styled.div`
  background: ${props => props.theme.colors.background.card};
  border-radius: ${props => props.theme.borderRadius.md};
  padding: ${props => props.theme.spacing.lg};
  border: 2px solid ${props => props.theme.colors.border.light};
  transition: all ${props => props.theme.transitions.fast};
  
  &:hover {
    border-color: ${props => props.theme.colors.pastel.lavender};
    box-shadow: ${props => props.theme.shadows.sm};
  }
`;

const DayName = styled.h4`
  color: ${props => props.theme.colors.text.primary};
  margin-bottom: ${props => props.theme.spacing.md};
  font-weight: 600;
  font-size: 1.1rem;
`;

const TimeSlotInput = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${props => props.theme.spacing.xs};
  
  .time-inputs {
    display: flex;
    gap: ${props => props.theme.spacing.xs};
    align-items: center;
    
    input {
      padding: ${props => props.theme.spacing.xs};
      border: 1px solid ${props => props.theme.colors.border.light};
      border-radius: ${props => props.theme.borderRadius.sm};
      font-size: 0.85rem;
      width: 70px;
      
      &:focus {
        border-color: ${props => props.theme.colors.pastel.lavender};
        outline: none;
      }
    }
    
    span {
      color: ${props => props.theme.colors.text.secondary};
      font-size: 0.85rem;
    }
  }
  
  .time-display {
    font-size: 0.9rem;
    color: ${props => props.theme.colors.primary};
    font-weight: 500;
    margin-top: ${props => props.theme.spacing.xs};
  }
`;

const Checkbox = styled.input`
  margin-right: ${props => props.theme.spacing.sm};
  accent-color: ${props => props.theme.colors.primary};
`;

const LoadingSpinner = styled.div`
  display: inline-block;
  width: 20px;
  height: 20px;
  border: 3px solid ${props => props.theme.colors.border.light};
  border-top-color: ${props => props.theme.colors.primary};
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin: 0 auto;
  
  @keyframes spin {
    to { transform: rotate(360deg); }
  }
`;

// Helper function to format time (09:00 -> 9AM)
function formatTimeDisplay(time) {
  if (!time) return '';
  const [hours, minutes] = time.split(':');
  const hour = parseInt(hours);
  const period = hour >= 12 ? 'PM' : 'AM';
  const displayHour = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour;
  return minutes === '00' ? `${displayHour}${period}` : `${displayHour}:${minutes}${period}`;
}

function Admin() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [password, setPassword] = useState('');
  const [bookings, setBookings] = useState([]);
  const [availability, setAvailability] = useState({
    Monday: { enabled: true, start: '09:00', end: '17:00' },
    Tuesday: { enabled: true, start: '09:00', end: '17:00' },
    Wednesday: { enabled: true, start: '09:00', end: '17:00' },
    Thursday: { enabled: true, start: '09:00', end: '17:00' },
    Friday: { enabled: true, start: '09:00', end: '17:00' },
    Saturday: { enabled: true, start: '09:00', end: '17:00' },
    Sunday: { enabled: true, start: '09:00', end: '17:00' }
  });
  const [loading, setLoading] = useState(false);
  const [locations, setLocations] = useState([]);
  const [loadingLocations, setLoadingLocations] = useState(false);
  const [locationData, setLocationData] = useState({
    startDate: '',
    endDate: '',
    morningLocation: '',
    afternoonLocation: '',
    timezone: 'Asia/Seoul' // 기본값 KST
  });
  const [editingLocation, setEditingLocation] = useState(null);

  useEffect(() => {
    if (isAuthenticated) {
      fetchBookings();
      fetchAvailability();
      fetchLocations();
    }
  }, [isAuthenticated]);

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      const response = await axios.post('/api/admin/login', { password });
      
      if (response.data.success) {
        setIsAuthenticated(true);
        localStorage.setItem('adminAuth', 'true');
        toast.success('Login successful');
      }
    } catch (error) {
      console.error('Login error:', error.response?.data || error.message);
      if (error.response?.status === 401) {
        toast.error('Invalid password. Default password is: admin123');
      } else {
        toast.error('Login failed. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    localStorage.removeItem('adminAuth');
    toast.info('Logged out successfully');
  };

  const fetchBookings = async () => {
    try {
      const response = await axios.get('/api/admin/bookings');
      setBookings(response.data);
    } catch (error) {
      toast.error('Failed to fetch bookings');
    }
  };

  const fetchAvailability = async () => {
    try {
      const response = await axios.get('/api/admin/availability');
      if (response.data) {
        setAvailability(response.data);
      }
    } catch (error) {
      toast.error('Failed to fetch availability');
    }
  };

  const handleCancelBooking = async (bookingId) => {
    if (!window.confirm('Are you sure you want to cancel this booking?')) {
      return;
    }

    try {
      await axios.delete(`/api/admin/bookings/${bookingId}`);
      toast.success('Booking cancelled successfully');
      fetchBookings();
    } catch (error) {
      toast.error('Failed to cancel booking');
    }
  };

  const handleAvailabilityChange = (day, field, value) => {
    setAvailability(prev => ({
      ...prev,
      [day]: {
        ...prev[day],
        [field]: value
      }
    }));
  };

  const saveAvailability = async () => {
    try {
      setLoading(true);
      await axios.post('/api/admin/availability', availability);
      toast.success('Availability updated successfully');
    } catch (error) {
      toast.error('Failed to update availability');
    } finally {
      setLoading(false);
    }
  };

  const fetchLocations = async () => {
    try {
      setLoadingLocations(true);
      const response = await axios.get('/api/admin/locations');
      const locationsArray = [];
      
      Object.entries(response.data).forEach(([date, location]) => {
        locationsArray.push({
          date,
          morning: location.morning,
          afternoon: location.afternoon,
          timezone: location.timezone || 'Asia/Seoul'
        });
      });
      
      locationsArray.sort((a, b) => new Date(a.date) - new Date(b.date));
      setLocations(locationsArray);
    } catch (error) {
      toast.error('Failed to fetch locations');
    } finally {
      setLoadingLocations(false);
    }
  };

  const handleLocationSubmit = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      
      const payload = {
        startDate: locationData.startDate,
        endDate: locationData.endDate || locationData.startDate,
        morningLocation: locationData.morningLocation,
        afternoonLocation: locationData.afternoonLocation,
        timezone: locationData.timezone
      };
      
      if (editingLocation) {
        await axios.put('/api/admin/locations', payload);
        toast.success('Location updated successfully');
      } else {
        await axios.post('/api/admin/locations', payload);
        toast.success('Location added successfully');
      }
      
      setLocationData({
        startDate: '',
        endDate: '',
        morningLocation: '',
        afternoonLocation: '',
        timezone: 'Asia/Seoul'
      });
      setEditingLocation(null);
      fetchLocations();
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to save location');
    } finally {
      setLoading(false);
    }
  };

  const handleLocationEdit = (location) => {
    setLocationData({
      startDate: location.date,
      endDate: location.date,
      morningLocation: location.morning || '',
      afternoonLocation: location.afternoon || '',
      timezone: location.timezone || 'Asia/Seoul'
    });
    setEditingLocation(location);
  };

  const handleLocationDelete = async (date, period) => {
    if (!window.confirm(`Are you sure you want to delete the ${period} location for ${date}?`)) {
      return;
    }
    
    try {
      await axios.delete(`/api/admin/locations/${date}/${period}`);
      toast.success('Location deleted successfully');
      fetchLocations();
    } catch (error) {
      toast.error('Failed to delete location');
    }
  };

  const handleCancelEdit = () => {
    setLocationData({
      startDate: '',
      endDate: '',
      morningLocation: '',
      afternoonLocation: ''
    });
    setEditingLocation(null);
  };

  if (!isAuthenticated) {
    return (
      <Container>
        <LoginCard>
          <SectionTitle style={{ marginLeft: '-28px' }}>Admin Login</SectionTitle>
          <Form onSubmit={handleLogin}>
            <FormGroup>
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter admin password"
                required
              />
            </FormGroup>
            <Button type="submit" disabled={loading}>
              {loading ? <LoadingSpinner /> : 'Login'}
            </Button>
          </Form>
        </LoginCard>
      </Container>
    );
  }

  return (
    <Container>
      <AdminPanel>
        <Header>
          <Title>Admin Dashboard</Title>
          <LogoutButton onClick={handleLogout}>Logout</LogoutButton>
        </Header>

        <Card $delay="0.1s">
          <SectionTitle>Upcoming Bookings</SectionTitle>
          <p style={{ color: theme.colors.text.secondary, fontSize: '0.95rem', marginBottom: '1rem' }}>
            📅 Meeting bookings will appear here once users schedule meetings through the main page.
          </p>
          {bookings.length > 0 ? (
            <BookingsList>
              {bookings.map((booking) => (
                <BookingCard key={booking.id}>
                  <BookingHeader>
                    <BookingTitle>{booking.name}</BookingTitle>
                    <BookingDate>{booking.date} at {booking.time}</BookingDate>
                  </BookingHeader>
                  <BookingDetail>Email: {booking.email}</BookingDetail>
                  <BookingDetail>Type: {booking.meetingType}</BookingDetail>
                  <BookingDetail>Purpose: {booking.purpose}</BookingDetail>
                  <CancelButton onClick={() => handleCancelBooking(booking.id)}>
                    Cancel Booking
                  </CancelButton>
                </BookingCard>
              ))}
            </BookingsList>
          ) : (
            <p style={{ color: theme.colors.text.secondary, textAlign: 'center' }}>
              No bookings found
            </p>
          )}
        </Card>

        <Card $delay="0.2s">
          <SectionTitle>Availability Settings</SectionTitle>
          <AvailabilityGrid>
            {Object.entries(availability).map(([day, settings]) => (
              <DayCard key={day}>
                <DayName>
                  <Checkbox
                    type="checkbox"
                    checked={settings.enabled}
                    onChange={(e) => handleAvailabilityChange(day, 'enabled', e.target.checked)}
                  />
                  {day}
                </DayName>
                {settings.enabled && (
                  <TimeSlotInput>
                    <div className="time-inputs">
                      <span>🕐</span>
                      <input
                        type="time"
                        value={settings.start}
                        onChange={(e) => handleAvailabilityChange(day, 'start', e.target.value)}
                      />
                      <span>→</span>
                      <input
                        type="time"
                        value={settings.end}
                        onChange={(e) => handleAvailabilityChange(day, 'end', e.target.value)}
                      />
                    </div>
                    <div className="time-display">
                      {formatTimeDisplay(settings.start)} - {formatTimeDisplay(settings.end)}
                    </div>
                  </TimeSlotInput>
                )}
              </DayCard>
            ))}
          </AvailabilityGrid>
          <Button onClick={saveAvailability} disabled={loading} style={{ marginTop: '1.5rem' }}>
            {loading ? <LoadingSpinner /> : 'Save Availability'}
          </Button>
        </Card>

        <Card $delay="0.3s">
          <SectionTitle>{editingLocation ? 'Edit Location' : 'Set Your Location'}</SectionTitle>
          <p style={{ color: theme.colors.text.secondary, fontSize: '0.95rem', marginBottom: '1.5rem' }}>
            📍 Set where you'll be available for meetings on specific dates. You can set different locations for morning (until 12pm) and afternoon (from 12pm).
          </p>
          <Form onSubmit={handleLocationSubmit}>
            <FormRow>
              <FormGroup>
                <Label htmlFor="startDate">Start Date</Label>
                <Input
                  id="startDate"
                  type="date"
                  value={locationData.startDate}
                  onChange={(e) => setLocationData({ ...locationData, startDate: e.target.value })}
                  required
                />
              </FormGroup>
              <FormGroup>
                <Label htmlFor="endDate">End Date (leave empty for single day)</Label>
                <Input
                  id="endDate"
                  type="date"
                  value={locationData.endDate}
                  onChange={(e) => setLocationData({ ...locationData, endDate: e.target.value })}
                  min={locationData.startDate}
                />
              </FormGroup>
            </FormRow>
            
            <FormGroup>
              <Label htmlFor="timezone">Your Timezone for this date</Label>
              <Select
                id="timezone"
                value={locationData.timezone}
                onChange={(e) => setLocationData({ ...locationData, timezone: e.target.value })}
              >
                <option value="Asia/Seoul">Seoul (KST)</option>
                <option value="America/Los_Angeles">Los Angeles (PST/PDT)</option>
                <option value="America/New_York">New York (EST/EDT)</option>
                <option value="Europe/London">London (GMT/BST)</option>
                <option value="Asia/Tokyo">Tokyo (JST)</option>
              </Select>
            </FormGroup>

            <FormGroup>
              <Label htmlFor="morningLocation">Morning Location (until 12pm)</Label>
              <Input
                id="morningLocation"
                type="text"
                value={locationData.morningLocation}
                onChange={(e) => setLocationData({ ...locationData, morningLocation: e.target.value })}
                placeholder="Enter your morning location (leave empty if same all day)"
              />
            </FormGroup>
            
            <FormGroup>
              <Label htmlFor="afternoonLocation">Afternoon Location (from 12pm)</Label>
              <Input
                id="afternoonLocation"
                type="text"
                value={locationData.afternoonLocation}
                onChange={(e) => setLocationData({ ...locationData, afternoonLocation: e.target.value })}
                placeholder="Enter your afternoon location (leave empty if same all day)"
              />
            </FormGroup>
            
            <div style={{ display: 'flex', gap: '1rem' }}>
              <Button type="submit" disabled={loading}>
                {loading ? <LoadingSpinner /> : (editingLocation ? 'Update Location' : 'Add Location')}
              </Button>
              {editingLocation && (
                <Button 
                  type="button" 
                  onClick={handleCancelEdit}
                  style={{ background: theme.colors.text.secondary }}
                >
                  Cancel
                </Button>
              )}
            </div>
          </Form>

          {loadingLocations ? (
            <div style={{ marginTop: '2rem', textAlign: 'center' }}>
              <LoadingSpinner />
              <p style={{ marginTop: '1rem', color: theme.colors.text.secondary }}>Loading locations...</p>
            </div>
          ) : locations.length > 0 && (
            <div style={{ marginTop: '2rem' }}>
              <h3 style={{ marginBottom: '1rem', color: theme.colors.text.primary }}>Scheduled Locations</h3>
              <BookingsList>
                {locations.map((loc, index) => (
                  <BookingCard key={index} style={{ background: theme.colors.background.card }}>
                    <BookingHeader>
                      <BookingTitle>{new Date(loc.date + 'T00:00:00').toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</BookingTitle>
                      <BookingDate style={{ marginLeft: '1rem' }}>
                        {loc.timezone === 'Asia/Seoul' ? 'KST' : 
                         loc.timezone === 'America/Los_Angeles' ? 'PST/PDT' :
                         loc.timezone === 'America/New_York' ? 'EST/EDT' :
                         loc.timezone === 'Europe/London' ? 'GMT/BST' :
                         loc.timezone === 'Asia/Tokyo' ? 'JST' : loc.timezone}
                      </BookingDate>
                    </BookingHeader>
                    {loc.morning && (
                      <div style={{ 
                        display: 'flex', 
                        justifyContent: 'space-between', 
                        alignItems: 'center',
                        marginBottom: '0.5rem',
                        padding: '0.75rem',
                        background: theme.colors.pastel.sky,
                        borderRadius: theme.borderRadius.sm
                      }}>
                        <div>
                          <strong style={{ color: theme.colors.primary }}>Morning:</strong> {loc.morning}
                        </div>
                        <button 
                          onClick={() => handleLocationDelete(loc.date, 'morning')}
                          style={{ 
                            padding: '0.25rem 0.5rem',
                            background: theme.colors.error,
                            color: 'white',
                            border: 'none',
                            borderRadius: theme.borderRadius.sm,
                            cursor: 'pointer',
                            fontSize: '0.85rem'
                          }}
                        >
                          Delete
                        </button>
                      </div>
                    )}
                    {loc.afternoon && (
                      <div style={{ 
                        display: 'flex', 
                        justifyContent: 'space-between', 
                        alignItems: 'center',
                        marginBottom: '0.5rem',
                        padding: '0.75rem',
                        background: theme.colors.pastel.peach,
                        borderRadius: theme.borderRadius.sm
                      }}>
                        <div>
                          <strong style={{ color: theme.colors.beige.darker }}>Afternoon:</strong> {loc.afternoon}
                        </div>
                        <button 
                          onClick={() => handleLocationDelete(loc.date, 'afternoon')}
                          style={{ 
                            padding: '0.25rem 0.5rem',
                            background: theme.colors.error,
                            color: 'white',
                            border: 'none',
                            borderRadius: theme.borderRadius.sm,
                            cursor: 'pointer',
                            fontSize: '0.85rem'
                          }}
                        >
                          Delete
                        </button>
                      </div>
                    )}
                    <div style={{ marginTop: '1rem', textAlign: 'right' }}>
                      <Button 
                        onClick={() => handleLocationEdit(loc)}
                        style={{ 
                          padding: '0.5rem 1rem',
                          background: theme.colors.primary,
                          fontSize: '0.9rem'
                        }}
                      >
                        Edit Day
                      </Button>
                    </div>
                  </BookingCard>
                ))}
              </BookingsList>
            </div>
          )}
        </Card>
      </AdminPanel>
    </Container>
  );
}

export default Admin;