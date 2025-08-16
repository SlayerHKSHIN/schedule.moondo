import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import Calendar from 'react-calendar';
import axios from 'axios';
import { toast } from 'react-toastify';
import { theme } from '../styles/theme';
import AuthButton from '../components/AuthButton';
import 'react-calendar/dist/Calendar.css';

const Container = styled.div`
  min-height: 100vh;
  background: linear-gradient(135deg, ${props => props.theme.colors.background.default} 0%, ${props => props.theme.colors.beige.light} 100%);
  padding: ${props => props.theme.spacing.md};
  font-family: ${props => props.theme.typography.fontFamily};
  
  @media (min-width: ${props => props.theme.breakpoints.tablet}) {
    padding: ${props => props.theme.spacing.xl};
  }
`;

const Header = styled.header`
  text-align: center;
  margin-bottom: ${props => props.theme.spacing.xxl};
  animation: fadeIn 0.6s ease-out;
  
  @keyframes fadeIn {
    from {
      opacity: 0;
      transform: translateY(-20px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }
`;

const Title = styled.h1`
  font-family: ${props => props.theme.typography.headingFontFamily};
  font-size: 1.8rem;
  color: ${props => props.theme.colors.text.primary};
  margin-bottom: ${props => props.theme.spacing.sm};
  font-weight: 600;
  letter-spacing: -0.01em;
  
  @media (min-width: 480px) {
    font-size: 1.75rem;
  }
  
  @media (min-width: ${props => props.theme.breakpoints.tablet}) {
    font-size: 2.5rem;
  }
`;

const Subtitle = styled.p`
  font-family: ${props => props.theme.typography.fontFamily};
  color: ${props => props.theme.colors.text.secondary};
  font-size: 1rem;
  font-weight: 400;
  letter-spacing: 0.01em;
`;

const MainContent = styled.main`
  max-width: 1200px;
  margin: 0 auto;
  display: grid;
  gap: ${props => props.theme.spacing.xl};
  
  @media (min-width: ${props => props.theme.breakpoints.desktop}) {
    grid-template-columns: 1fr 1fr;
    align-items: start;
  }
`;

const Card = styled.div`
  background: ${props => props.theme.colors.background.paper};
  border-radius: ${props => props.theme.borderRadius.lg};
  padding: ${props => props.theme.spacing.lg};
  box-shadow: ${props => props.theme.shadows.md};
  transition: all ${props => props.theme.transitions.normal};
  animation: slideUp 0.5s ease-out;
  animation-delay: ${props => props.$delay || '0s'};
  animation-fill-mode: both;
  
  @keyframes slideUp {
    from {
      opacity: 0;
      transform: translateY(30px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }
  
  @media (min-width: ${props => props.theme.breakpoints.tablet}) {
    padding: ${props => props.theme.spacing.xl};
  }
  
  &:hover {
    box-shadow: ${props => props.theme.shadows.lg};
    transform: translateY(-2px);
  }
`;

const CalendarWrapper = styled.div`
  .react-calendar {
    width: 100%;
    border: none;
    border-radius: ${props => props.theme.borderRadius.md};
    background: ${props => props.theme.colors.background.card};
    font-family: inherit;
    padding: ${props => props.theme.spacing.md};
    box-shadow: ${props => props.theme.shadows.sm};
  }
  
  .react-calendar__tile {
    padding: 0.75rem 0.5rem;
    border-radius: ${props => props.theme.borderRadius.sm};
    transition: all ${props => props.theme.transitions.fast};
    
    &:hover {
      background: ${props => props.theme.colors.pastel.peach};
    }
    
    &--active {
      background: ${props => props.theme.colors.primary} !important;
      color: white;
    }
    
    &--now {
      background: ${props => props.theme.colors.pastel.lavender};
    }
  }
  
  .react-calendar__navigation button {
    font-size: 1.1rem;
    color: ${props => props.theme.colors.text.primary};
    
    &:hover {
      background: ${props => props.theme.colors.background.hover};
    }
  }
`;

const SectionTitle = styled.h2`
  font-family: ${props => props.theme.typography.headingFontFamily};
  font-size: 1.4rem;
  color: ${props => props.theme.colors.text.primary};
  margin-bottom: ${props => props.theme.spacing.lg};
  font-weight: 600;
  display: flex;
  align-items: center;
  gap: ${props => props.theme.spacing.sm};
  
  &::before {
    content: '';
    width: 4px;
    height: 24px;
    background: ${props => props.theme.colors.pastel.peach};
    border-radius: 2px;
  }
`;

const TimeSlotGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(120px, 1fr));
  gap: ${props => props.theme.spacing.sm};
  margin-bottom: ${props => props.theme.spacing.xl};
`;

const TimeSlot = styled.button`
  font-family: ${props => props.theme.typography.fontFamily};
  padding: ${props => props.theme.spacing.md};
  border-radius: ${props => props.theme.borderRadius.md};
  background: ${props => props.selected ? props.theme.colors.primary : props.theme.colors.background.card};
  color: ${props => props.selected ? 'white' : props.theme.colors.text.primary};
  border: 2px solid ${props => props.selected ? props.theme.colors.primary : props.theme.colors.border.light};
  font-size: 0.95rem;
  font-weight: 500;
  letter-spacing: 0.02em;
  transition: all ${props => props.theme.transitions.fast};
  
  &:hover:not(:disabled) {
    background: ${props => props.selected ? props.theme.colors.beige.darker : props.theme.colors.pastel.mint};
    border-color: ${props => props.selected ? props.theme.colors.beige.darker : props.theme.colors.pastel.mint};
    transform: scale(1.05);
  }
  
  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
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

const Label = styled.label`
  font-family: ${props => props.theme.typography.fontFamily};
  color: ${props => props.theme.colors.text.primary};
  font-weight: 500;
  font-size: 0.95rem;
  letter-spacing: 0.01em;
`;

const Input = styled.input`
  font-family: ${props => props.theme.typography.fontFamily};
  padding: ${props => props.theme.spacing.md};
  border-radius: ${props => props.theme.borderRadius.md};
  border: 2px solid ${props => props.theme.colors.border.light};
  background: ${props => props.theme.colors.background.card};
  font-size: 1rem;
  letter-spacing: 0.01em;
  transition: all ${props => props.theme.transitions.fast};
  
  &:focus {
    border-color: ${props => props.theme.colors.pastel.lavender};
    background: ${props => props.theme.colors.background.paper};
    outline: none;
    box-shadow: 0 0 0 3px ${props => props.theme.colors.pastel.lavender}33;
  }
`;

const Textarea = styled.textarea`
  padding: ${props => props.theme.spacing.md};
  border-radius: ${props => props.theme.borderRadius.md};
  border: 2px solid ${props => props.theme.colors.border.light};
  background: ${props => props.theme.colors.background.card};
  font-size: 1rem;
  min-height: 100px;
  resize: vertical;
  transition: all ${props => props.theme.transitions.fast};
  
  &:focus {
    border-color: ${props => props.theme.colors.pastel.lavender};
    background: ${props => props.theme.colors.background.paper};
    outline: none;
    box-shadow: 0 0 0 3px ${props => props.theme.colors.pastel.lavender}33;
  }
`;

const RadioGroup = styled.div`
  display: flex;
  gap: ${props => props.theme.spacing.lg};
  flex-wrap: wrap;
`;

const RadioLabel = styled.label`
  display: flex;
  align-items: center;
  gap: ${props => props.theme.spacing.sm};
  cursor: pointer;
  padding: ${props => props.theme.spacing.sm} ${props => props.theme.spacing.md};
  border-radius: ${props => props.theme.borderRadius.md};
  background: ${props => props.checked ? props.theme.colors.pastel.sage : 'transparent'};
  transition: all ${props => props.theme.transitions.fast};
  
  &:hover {
    background: ${props => props.theme.colors.background.hover};
  }
  
  input {
    accent-color: ${props => props.theme.colors.primary};
  }
`;

const SubmitButton = styled.button`
  font-family: ${props => props.theme.typography.fontFamily};
  padding: ${props => props.theme.spacing.md} ${props => props.theme.spacing.xl};
  background: linear-gradient(135deg, ${props => props.theme.colors.primary}, ${props => props.theme.colors.beige.darker});
  color: white;
  border-radius: ${props => props.theme.borderRadius.md};
  font-size: 1.05rem;
  font-weight: 500;
  letter-spacing: 0.02em;
  transition: all ${props => props.theme.transitions.normal};
  box-shadow: ${props => props.theme.shadows.md};
  
  &:hover:not(:disabled) {
    transform: translateY(-2px);
    box-shadow: ${props => props.theme.shadows.lg};
  }
  
  &:active {
    transform: translateY(0);
  }
  
  &:disabled {
    background: ${props => props.theme.colors.border.light};
    cursor: not-allowed;
  }
`;

const LoadingSpinner = styled.div`
  display: inline-block;
  width: 20px;
  height: 20px;
  border: 3px solid ${props => props.theme.colors.border.light};
  border-top-color: ${props => props.theme.colors.primary};
  border-radius: 50%;
  animation: spin 1s linear infinite;
  
  @keyframes spin {
    to { transform: rotate(360deg); }
  }
`;

const SuccessModal = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: ${props => props.theme.spacing.md};
  z-index: 1000;
  animation: fadeIn 0.3s ease-out;
`;

const ModalContent = styled.div`
  background: ${props => props.theme.colors.background.paper};
  border-radius: ${props => props.theme.borderRadius.lg};
  padding: ${props => props.theme.spacing.xl};
  max-width: 500px;
  width: 100%;
  text-align: center;
  animation: slideUp 0.3s ease-out;
`;

const SuccessIcon = styled.div`
  width: 80px;
  height: 80px;
  margin: 0 auto ${props => props.theme.spacing.lg};
  background: ${props => props.theme.colors.pastel.sage};
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 2.5rem;
`;

const Footer = styled.footer`
  margin-top: ${props => props.theme.spacing.xxl};
  padding: ${props => props.theme.spacing.xl} 0;
  text-align: center;
  border-top: 1px solid ${props => props.theme.colors.border.light};
  
  a {
    color: ${props => props.theme.colors.text.secondary};
    margin: 0 ${props => props.theme.spacing.md};
    
    &:hover {
      color: ${props => props.theme.colors.primary};
    }
  }
`;

function HomePage() {
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [availableSlots, setAvailableSlots] = useState([]);
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    purpose: '',
    meetingType: 'video'
  });
  const [loading, setLoading] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [bookingDetails, setBookingDetails] = useState(null);
  const [locationInfo, setLocationInfo] = useState(null);
  const [userTimezone, setUserTimezone] = useState('');
  const [hostName, setHostName] = useState('Hyun'); // 호스트 이름 상태 추가
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState(null);

  // Check authentication status
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const response = await axios.get('/api/auth/user', {
          withCredentials: true
        });
        if (response.data.authenticated) {
          setIsAuthenticated(true);
          setUser(response.data.user);
          setHostName(response.data.user.name || 'Calendar Owner');
        }
      } catch (error) {
        console.error('Auth check error:', error);
      }
    };
    checkAuth();
  }, []);

  const fetchAvailableSlots = async (date) => {
    try {
      setLoading(true);
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      const formattedDate = `${year}-${month}-${day}`;
      
      const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
      setUserTimezone(timezone);
      
      // Use user-specific endpoint if authenticated, otherwise use default
      const endpoint = isAuthenticated 
        ? `/api/user/calendar/available-slots?date=${formattedDate}&timezone=${encodeURIComponent(timezone)}`
        : `/api/calendar/available-slots?date=${formattedDate}&timezone=${encodeURIComponent(timezone)}`;
      
      const response = await axios.get(endpoint, {
        withCredentials: true
      });
      
      // Extract time strings from slot objects
      const slots = response.data.slots || [];
      const timeSlots = slots.map(slot => {
        if (typeof slot === 'string') return slot;
        // Convert UTC time to local time display
        const startTime = new Date(slot.start);
        return startTime.toLocaleTimeString('en-US', { 
          hour: 'numeric', 
          minute: '2-digit',
          hour12: true 
        });
      });
      
      setAvailableSlots(timeSlots);
      setSelectedSlot(null);
      setLocationInfo(response.data.location);
      
      // 호스트 이름 설정
      if (response.data.location?.hostName) {
        setHostName(response.data.location.hostName);
      }
    } catch (error) {
      toast.error('Failed to fetch available slots');
      setAvailableSlots([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAvailableSlots(selectedDate);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedDate, isAuthenticated]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!selectedSlot) {
      toast.error('Please select a time slot');
      return;
    }

    try {
      setLoading(true);
      const userTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
      
      // Use user-specific endpoint if authenticated
      const endpoint = isAuthenticated ? '/api/user/calendar/book' : '/api/booking/create';
      const payload = isAuthenticated 
        ? {
            guestName: formData.name,
            guestEmail: formData.email,
            date: selectedDate.toISOString().split('T')[0],
            time: selectedSlot,
            purpose: formData.purpose,
            meetingType: formData.meetingType,
            timezone: userTimezone
          }
        : {
            ...formData,
            date: selectedDate.toISOString().split('T')[0],
            time: selectedSlot,
            timezone: userTimezone
          };
      
      const response = await axios.post(endpoint, payload, {
        withCredentials: true
      });

      setBookingDetails(response.data);
      setShowSuccessModal(true);
      
      // Reset form
      setFormData({
        name: '',
        email: '',
        purpose: '',
        meetingType: 'video'
      });
      setSelectedSlot(null);
      
      // Refresh available slots
      fetchAvailableSlots(selectedDate);
    } catch (error) {
      toast.error(error.response?.data?.error || 'Booking failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container>
      <AuthButton />
      <Header>
        <Title>Schedule a Meeting with {hostName}</Title>
        <Subtitle>Choose a convenient time for our conversation</Subtitle>
      </Header>

      <MainContent>
        <Card $delay="0.1s">
          <SectionTitle>Select Date</SectionTitle>
          <CalendarWrapper>
            <Calendar
              onChange={setSelectedDate}
              value={selectedDate}
              minDate={new Date()}
              locale="en-US"
            />
          </CalendarWrapper>

          {loading ? (
            <div style={{ textAlign: 'center', padding: '2rem' }}>
              <LoadingSpinner />
            </div>
          ) : availableSlots.length > 0 ? (
            <>
              <SectionTitle style={{ marginTop: '2rem' }}>Available Times</SectionTitle>
              <div style={{ 
                display: 'flex',
                flexDirection: 'column',
                gap: '0.75rem',
                marginBottom: '1.5rem',
                padding: '1rem',
                background: `linear-gradient(135deg, ${theme.colors.pastel.lavender}20, ${theme.colors.pastel.sky}20)`,
                borderRadius: theme.borderRadius.md,
                border: `1px solid ${theme.colors.border.light}`
              }}>
                <div style={{ fontSize: '0.85rem', color: theme.colors.text.secondary }}>
                  📍 Your timezone: <strong>{userTimezone}</strong>
                </div>
                {locationInfo && locationInfo.locationData && (locationInfo.locationData.morning || locationInfo.locationData.afternoon) && (
                  <div style={{ fontSize: '0.85rem', color: theme.colors.text.secondary }}>
                    📌 {hostName}'s location for this date:
                    {locationInfo.locationData.morning && (
                      <div style={{ marginLeft: '1.5rem', marginTop: '0.25rem', fontSize: '0.8rem' }}>
                        <strong>Morning:</strong> {locationInfo.locationData.morning}
                      </div>
                    )}
                    {locationInfo.locationData.afternoon && (
                      <div style={{ marginLeft: '1.5rem', marginTop: '0.25rem', fontSize: '0.8rem' }}>
                        <strong>Afternoon:</strong> {locationInfo.locationData.afternoon}
                      </div>
                    )}
                  </div>
                )}
              </div>
              <TimeSlotGrid>
                {availableSlots.map((slot) => (
                  <TimeSlot
                    key={slot}
                    selected={selectedSlot === slot}
                    onClick={() => setSelectedSlot(slot)}
                    type="button"
                  >
                    {slot}
                  </TimeSlot>
                ))}
              </TimeSlotGrid>
            </>
          ) : (
            <p style={{ textAlign: 'center', color: theme.colors.text.secondary, marginTop: '2rem' }}>
              No available slots for this date
            </p>
          )}
        </Card>

        <Card $delay="0.2s">
          <SectionTitle>Your Information</SectionTitle>
          <Form onSubmit={handleSubmit}>
            <FormGroup>
              <Label htmlFor="name">Name *</Label>
              <Input
                id="name"
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
                placeholder="Your full name"
              />
            </FormGroup>

            <FormGroup>
              <Label htmlFor="email">Email *</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                required
                placeholder="your@email.com"
              />
            </FormGroup>

            <FormGroup>
              <Label>Meeting Type *</Label>
              <RadioGroup>
                <RadioLabel checked={formData.meetingType === 'video'}>
                  <input
                    type="radio"
                    value="video"
                    checked={formData.meetingType === 'video'}
                    onChange={(e) => setFormData({ ...formData, meetingType: e.target.value })}
                  />
                  Video Call
                </RadioLabel>
                <RadioLabel checked={formData.meetingType === 'in-person'}>
                  <input
                    type="radio"
                    value="in-person"
                    checked={formData.meetingType === 'in-person'}
                    onChange={(e) => setFormData({ ...formData, meetingType: e.target.value })}
                  />
                  In-Person
                </RadioLabel>
              </RadioGroup>
            </FormGroup>

            <FormGroup>
              <Label htmlFor="purpose">Meeting Purpose *</Label>
              <Textarea
                id="purpose"
                value={formData.purpose}
                onChange={(e) => setFormData({ ...formData, purpose: e.target.value })}
                required
                placeholder="Please describe the purpose of this meeting..."
              />
            </FormGroup>

            <SubmitButton type="submit" disabled={loading || !selectedSlot}>
              {loading ? <LoadingSpinner /> : 'Book Meeting'}
            </SubmitButton>
          </Form>
        </Card>
      </MainContent>

      {showSuccessModal && (
        <SuccessModal onClick={() => setShowSuccessModal(false)}>
          <ModalContent onClick={(e) => e.stopPropagation()}>
            <SuccessIcon>✓</SuccessIcon>
            <h2>Meeting Booked Successfully!</h2>
            <p style={{ margin: '1rem 0', color: theme.colors.text.secondary }}>
              A confirmation email has been sent to {bookingDetails?.email}
            </p>
            <SubmitButton onClick={() => setShowSuccessModal(false)}>
              Close
            </SubmitButton>
          </ModalContent>
        </SuccessModal>
      )}

      <Footer>
        <a href="/privacy">Privacy Policy</a>
        <a href="/terms">Terms of Service</a>
      </Footer>
    </Container>
  );
}

export default HomePage;