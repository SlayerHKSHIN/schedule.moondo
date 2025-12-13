import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import axios from 'axios';
import { toast } from 'react-toastify';
import { theme } from '../styles/theme';
import { timezoneOptions } from '../utils/timezones';

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

const TokenWarningBanner = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  background: linear-gradient(135deg, #ff6b6b, #ff8787);
  color: white;
  padding: ${props => props.theme.spacing.lg};
  display: flex;
  align-items: center;
  justify-content: space-between;
  box-shadow: ${props => props.theme.shadows.lg};
  z-index: 9999;
  animation: slideDown 0.5s ease-out;
  flex-wrap: wrap;
  gap: ${props => props.theme.spacing.md};

  @keyframes slideDown {
    from {
      transform: translateY(-100%);
    }
    to {
      transform: translateY(0);
    }
  }
`;

const TokenWarningContent = styled.div`
  flex: 1;
  display: flex;
  align-items: center;
  gap: ${props => props.theme.spacing.md};
  min-width: 250px;
`;

const WarningIcon = styled.div`
  font-size: 2rem;
  animation: pulse 2s ease-in-out infinite;

  @keyframes pulse {
    0%, 100% {
      transform: scale(1);
    }
    50% {
      transform: scale(1.1);
    }
  }
`;

const ReauthButton = styled.button`
  padding: ${props => props.theme.spacing.sm} ${props => props.theme.spacing.lg};
  background: white;
  color: #ff6b6b;
  border-radius: ${props => props.theme.borderRadius.md};
  font-weight: 600;
  transition: all ${props => props.theme.transitions.fast};
  white-space: nowrap;

  &:hover {
    transform: scale(1.05);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
  }
`;

const TokenStatusContent = styled.div`
  display: flex;
  align-items: center;
  gap: ${props => props.theme.spacing.lg};
  flex-wrap: wrap;
`;

const TokenIcon = styled.div`
  font-size: 3rem;
  animation: ${props => props.$checking ? 'spin 1s linear infinite' : 'none'};

  @keyframes spin {
    from {
      transform: rotate(0deg);
    }
    to {
      transform: rotate(360deg);
    }
  }
`;

const TokenInfo = styled.div`
  flex: 1;
  min-width: 200px;
`;

const TokenTitle = styled.h3`
  margin: 0;
  font-size: 1.2rem;
  color: ${props => props.theme.colors.text.primary};
`;

const TokenMessage = styled.p`
  margin: 0.5rem 0 0;
  font-size: 0.9rem;
  color: ${props => props.theme.colors.text.secondary};
`;

const TokenTimestamp = styled.p`
  margin: 0.25rem 0 0;
  font-size: 0.8rem;
  font-style: italic;
  color: ${props => props.theme.colors.text.disabled};
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
  // Generate time options for dropdown
  const generateTimeOptions = () => {
    const times = [];
    for (let hour = 0; hour < 24; hour++) {
      for (let minute of [0, 30]) {
        const h = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour;
        const period = hour < 12 ? 'AM' : 'PM';
        const timeStr = `${h}:${minute === 0 ? '00' : '30'} ${period}`;
        const value = `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`;
        times.push({ label: timeStr, value });
      }
    }
    return times;
  };

  const timeOptions = generateTimeOptions();

  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [password, setPassword] = useState('');
  const [bookings, setBookings] = useState([]);
  const [availability, setAvailability] = useState({
    timezone: 'Asia/Seoul', // Default timezone for availability
    Monday: { enabled: true, start: '08:00', end: '21:00' },
    Tuesday: { enabled: true, start: '08:00', end: '21:00' },
    Wednesday: { enabled: true, start: '08:00', end: '21:00' },
    Thursday: { enabled: true, start: '08:00', end: '21:00' },
    Friday: { enabled: true, start: '08:00', end: '21:00' },
    Saturday: { enabled: true, start: '08:00', end: '21:00' },
    Sunday: { enabled: true, start: '08:00', end: '21:00' }
  });
  const [currentTimezone, setCurrentTimezone] = useState('Asia/Seoul');
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

  // Token status monitoring
  const [tokenStatus, setTokenStatus] = useState({
    status: 'checking', // 'checking' | 'valid' | 'expired' | 'invalid' | 'error'
    message: '',
    lastChecked: null
  });
  const [showTokenWarning, setShowTokenWarning] = useState(false);
  const [reauthUrl, setReauthUrl] = useState('');
  const [manualOauthUrl, setManualOauthUrl] = useState('');
  const [processingOauth, setProcessingOauth] = useState(false);

  useEffect(() => {
    if (isAuthenticated) {
      fetchBookings();
      fetchAvailability();
      fetchLocations();
      detectCurrentTimezone();
    }
  }, [isAuthenticated]);

  const detectCurrentTimezone = () => {
    // Get today's date
    const today = new Date().toISOString().split('T')[0];
    
    // Check if there's a location set for today
    const todayLocation = locations.find(loc => loc.date === today);
    if (todayLocation && todayLocation.timezone) {
      setCurrentTimezone(todayLocation.timezone);
    } else {
      // Default to KST if no location is set
      setCurrentTimezone('Asia/Seoul');
    }
  };

  useEffect(() => {
    detectCurrentTimezone();
  }, [locations]);

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
        toast.error('Invalid password');
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

  const checkTokenStatus = async () => {
    try {
      const response = await axios.get('/api/admin/token-status');
      setTokenStatus({
        ...response.data,
        lastChecked: new Date().toISOString()
      });

      if (response.data.status === 'expired') {
        setShowTokenWarning(true);

        // Get re-auth URL
        try {
          const reauthResponse = await axios.get('/api/admin/reauth-url');
          setReauthUrl(reauthResponse.data.authUrl);
        } catch (urlError) {
          console.error('Failed to get reauth URL:', urlError);
        }

        toast.error('Google Calendar authentication has expired. Please re-authenticate.', {
          autoClose: false,
          closeOnClick: false
        });
      } else if (response.data.status === 'invalid') {
        toast.warning('Token configuration issue detected.', {
          autoClose: 5000
        });
      } else if (response.data.status === 'valid') {
        setShowTokenWarning(false);
      }
    } catch (error) {
      console.error('Failed to check token status:', error);
      setTokenStatus({
        status: 'error',
        message: 'Failed to check token status',
        lastChecked: new Date().toISOString()
      });
    }
  };

  const handleManualOauthSubmit = async (e) => {
    e.preventDefault();
    if (!manualOauthUrl.trim()) {
      toast.error('Please enter the OAuth callback URL');
      return;
    }

    try {
      setProcessingOauth(true);

      // Extract code from URL if it's a full URL, or use it directly if it's just the code
      let code = manualOauthUrl.trim();
      let originalUrl = null;

      // Check if it's a URL
      if (code.includes('http') || code.includes('callback')) {
        try {
          const url = new URL(code);
          const codeParam = url.searchParams.get('code');
          if (codeParam) {
            originalUrl = code; // Save the full original URL
            code = codeParam;   // Extract just the code
          } else {
            toast.error('Could not find authorization code in URL');
            return;
          }
        } catch (urlError) {
          toast.error('Invalid URL format. Please paste the complete callback URL.');
          return;
        }
      }

      // Send both code and original URL to backend for processing
      const response = await axios.post('/api/admin/process-oauth-code', {
        code,
        originalUrl
      });

      if (response.data.success) {
        toast.success('Authentication completed successfully!');
        setManualOauthUrl('');
        setShowTokenWarning(false);

        // Refresh token status
        await checkTokenStatus();
      } else {
        toast.error(response.data.error || 'Authentication failed');
      }
    } catch (error) {
      console.error('OAuth processing error:', error);
      toast.error(error.response?.data?.error || 'Failed to process OAuth code. Please try again.');
    } finally {
      setProcessingOauth(false);
    }
  };

  // Check token status periodically
  useEffect(() => {
    if (isAuthenticated) {
      checkTokenStatus(); // Initial check

      // Check every 5 minutes
      const interval = setInterval(checkTokenStatus, 5 * 60 * 1000);

      return () => clearInterval(interval);
    }
  }, [isAuthenticated]);

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
      {showTokenWarning && (
        <TokenWarningBanner>
          <TokenWarningContent>
            <WarningIcon>⚠️</WarningIcon>
            <div>
              <h3 style={{ margin: 0, fontSize: '1.2rem' }}>
                Google Calendar Authentication Expired
              </h3>
              <p style={{ margin: '0.25rem 0 0', fontSize: '0.9rem', opacity: 0.9 }}>
                Your Google Calendar connection has expired. Please re-authenticate to continue using calendar features.
              </p>
            </div>
          </TokenWarningContent>
          <ReauthButton onClick={() => window.open(reauthUrl, '_blank')}>
            Re-authenticate Now
          </ReauthButton>
        </TokenWarningBanner>
      )}

      <AdminPanel>
        <Header>
          <Title>Admin Dashboard</Title>
          <LogoutButton onClick={handleLogout}>Logout</LogoutButton>
        </Header>

        <Card $delay="0.05s" style={{
          background: tokenStatus.status === 'valid'
            ? theme.colors.pastel.sage
            : tokenStatus.status === 'expired'
            ? theme.colors.pastel.rose
            : theme.colors.background.paper,
          border: `2px solid ${
            tokenStatus.status === 'valid' ? '#4caf50' :
            tokenStatus.status === 'expired' ? '#ff6b6b' :
            theme.colors.border.light
          }`
        }}>
          <SectionTitle>Google Calendar Connection Status</SectionTitle>

          <TokenStatusContent>
            <TokenIcon $checking={tokenStatus.status === 'checking'}>
              {tokenStatus.status === 'checking' && '🔄'}
              {tokenStatus.status === 'valid' && '✅'}
              {tokenStatus.status === 'expired' && '❌'}
              {tokenStatus.status === 'invalid' && '⚠️'}
              {tokenStatus.status === 'error' && '🔴'}
            </TokenIcon>

            <TokenInfo>
              <TokenTitle>
                {tokenStatus.status === 'checking' && 'Checking...'}
                {tokenStatus.status === 'valid' && 'Connected'}
                {tokenStatus.status === 'expired' && 'Authentication Expired'}
                {tokenStatus.status === 'invalid' && 'Configuration Issue'}
                {tokenStatus.status === 'error' && 'Error'}
              </TokenTitle>
              <TokenMessage>{tokenStatus.message}</TokenMessage>
              {tokenStatus.lastChecked && (
                <TokenTimestamp>
                  Last checked: {new Date(tokenStatus.lastChecked).toLocaleString()}
                </TokenTimestamp>
              )}
            </TokenInfo>

            {tokenStatus.status === 'expired' && (
              <Button onClick={() => window.open(reauthUrl, '_blank')}>
                Re-authenticate
              </Button>
            )}

            {tokenStatus.status === 'valid' && (
              <Button
                onClick={checkTokenStatus}
                style={{ background: theme.colors.pastel.lavender }}
              >
                Check Again
              </Button>
            )}
          </TokenStatusContent>

          {tokenStatus.status === 'expired' && (
            <div style={{
              marginTop: '2rem',
              padding: '1.5rem',
              background: theme.colors.background.card,
              borderRadius: theme.borderRadius.md,
              border: `2px solid ${theme.colors.pastel.lavender}`
            }}>
              <h4 style={{
                margin: '0 0 1rem 0',
                color: theme.colors.text.primary,
                fontSize: '1.1rem'
              }}>
                🔗 Manual Authentication
              </h4>
              <p style={{
                margin: '0 0 1rem 0',
                color: theme.colors.text.secondary,
                fontSize: '0.9rem'
              }}>
                After clicking "Re-authenticate" and completing Google's authorization, paste the final callback URL here:
              </p>
              <form onSubmit={handleManualOauthSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <Input
                  type="text"
                  value={manualOauthUrl}
                  onChange={(e) => setManualOauthUrl(e.target.value)}
                  placeholder="Paste the callback URL here (e.g., https://hyun-schedule.moondo.ai/api/auth/google/callback?code=...)"
                  disabled={processingOauth}
                  style={{
                    fontSize: '0.85rem',
                    fontFamily: 'monospace'
                  }}
                />
                <Button
                  type="submit"
                  disabled={processingOauth || !manualOauthUrl.trim()}
                  style={{
                    background: theme.colors.primary,
                    alignSelf: 'flex-start'
                  }}
                >
                  {processingOauth ? <LoadingSpinner /> : 'Complete Authentication'}
                </Button>
              </form>
            </div>
          )}
        </Card>

        <Card $delay="0.1s">
          <SectionTitle>Upcoming Bookings</SectionTitle>
          <p style={{ color: theme.colors.text.secondary, fontSize: '0.95rem', marginBottom: '1rem' }}>
            📅 Your next 3 upcoming meetings from Google Calendar
          </p>
          {bookings.length > 0 ? (
            <BookingsList>
              {bookings.map((booking) => {
                const startDate = new Date(booking.start);
                const endDate = new Date(booking.end);
                const dateStr = startDate.toLocaleDateString('en-US', { 
                  weekday: 'short', 
                  month: 'short', 
                  day: 'numeric' 
                });
                const startTime = startDate.toLocaleTimeString('en-US', { 
                  hour: 'numeric', 
                  minute: '2-digit',
                  hour12: true 
                });
                const endTime = endDate.toLocaleTimeString('en-US', { 
                  hour: 'numeric', 
                  minute: '2-digit',
                  hour12: true 
                });
                
                return (
                  <BookingCard key={booking.id} style={{ background: theme.colors.background.card }}>
                    <BookingHeader>
                      <BookingTitle style={{ fontSize: '1.1rem', fontWeight: 'bold' }}>
                        {booking.summary}
                      </BookingTitle>
                      <BookingDate style={{ color: theme.colors.primary }}>
                        {dateStr}
                      </BookingDate>
                    </BookingHeader>
                    <BookingDetail style={{ marginTop: '10px', fontSize: '0.95rem' }}>
                      🕰️ {startTime} - {endTime}
                    </BookingDetail>
                    {booking.attendees && (
                      <BookingDetail style={{ fontSize: '0.9rem' }}>
                        👥 {booking.attendees}
                      </BookingDetail>
                    )}
                    {booking.location && (
                      <BookingDetail style={{ fontSize: '0.9rem' }}>
                        📍 {booking.location}
                      </BookingDetail>
                    )}
                    {booking.meetLink && (
                      <BookingDetail style={{ fontSize: '0.9rem' }}>
                        <a href={booking.meetLink} target="_blank" rel="noopener noreferrer" 
                           style={{ color: theme.colors.primary, textDecoration: 'none' }}>
                          🎥 Join Google Meet
                        </a>
                      </BookingDetail>
                    )}
                  </BookingCard>
                );
              })}
            </BookingsList>
          ) : (
            <p style={{ color: theme.colors.text.secondary, textAlign: 'center' }}>
              No upcoming meetings found
            </p>
          )}
        </Card>

        <Card $delay="0.2s">
          <SectionTitle>Availability Settings</SectionTitle>
          
          {/* Timezone Selector */}
          <div style={{ 
            marginBottom: '25px', 
            padding: '20px', 
            background: theme.colors.pastel.lavender,
            borderRadius: theme.borderRadius.md,
            border: `2px solid ${theme.colors.primary}`
          }}>
            <h4 style={{ marginBottom: '15px', color: theme.colors.text.primary }}>
              🌍 Select Working Hours Timezone
            </h4>
            <div style={{ display: 'flex', alignItems: 'center', gap: '15px', flexWrap: 'wrap' }}>
              <span style={{ fontWeight: 'bold' }}>Set timezone for availability:</span>
              <select
                value={availability.timezone || 'Asia/Seoul'}
                onChange={(e) => setAvailability(prev => ({ ...prev, timezone: e.target.value }))}
                style={{
                  padding: '10px',
                  borderRadius: '6px',
                  border: '2px solid #ddd',
                  fontSize: '15px',
                  background: 'white',
                  cursor: 'pointer',
                  minWidth: '250px',
                  fontWeight: '500'
                }}
              >
                <optgroup label="Asia">
                  <option value="Asia/Seoul">🇰🇷 Korea (Seoul) - KST</option>
                  <option value="Asia/Tokyo">🇯🇵 Japan (Tokyo) - JST</option>
                  <option value="Asia/Shanghai">🇨🇳 China (Shanghai) - CST</option>
                  <option value="Asia/Singapore">🇸🇬 Singapore - SGT</option>
                  <option value="Asia/Dubai">🇦🇪 Dubai - GST</option>
                </optgroup>
                <optgroup label="Americas">
                  <option value="America/Los_Angeles">🇺🇸 Los Angeles - PST/PDT</option>
                  <option value="America/New_York">🇺🇸 New York - EST/EDT</option>
                  <option value="America/Chicago">🇺🇸 Chicago - CST/CDT</option>
                  <option value="America/Denver">🇺🇸 Denver - MST/MDT</option>
                  <option value="America/Toronto">🇨🇦 Toronto - EST/EDT</option>
                  <option value="America/Mexico_City">🇲🇽 Mexico City - CST</option>
                </optgroup>
                <optgroup label="Europe">
                  <option value="Europe/London">🇬🇧 London - GMT/BST</option>
                  <option value="Europe/Paris">🇫🇷 Paris - CET/CEST</option>
                  <option value="Europe/Berlin">🇩🇪 Berlin - CET/CEST</option>
                  <option value="Europe/Moscow">🇷🇺 Moscow - MSK</option>
                </optgroup>
                <optgroup label="Oceania">
                  <option value="Australia/Sydney">🇦🇺 Sydney - AEST/AEDT</option>
                  <option value="Pacific/Auckland">🇳🇿 Auckland - NZST/NZDT</option>
                </optgroup>
              </select>
            </div>
            <div style={{ 
              fontSize: '0.9rem', 
              color: theme.colors.text.secondary, 
              marginTop: '10px',
              fontStyle: 'italic'
            }}>
              ℹ️ All working hours below will be interpreted in this timezone
            </div>
          </div>
          
          {/* Apply to All Days Section */}
          <div style={{ 
            marginBottom: '30px', 
            padding: '20px', 
            background: theme.colors.pastel.mint,
            borderRadius: theme.borderRadius.md,
            border: `2px solid ${theme.colors.primary}`
          }}>
            <h4 style={{ marginBottom: '15px', color: theme.colors.text.primary }}>
              🔄 Apply to All Days
            </h4>
            <p style={{ 
              fontSize: '0.85rem', 
              color: theme.colors.text.secondary, 
              marginBottom: '15px',
              fontStyle: 'italic'
            }}>
              Note: These times will be interpreted based on your location's timezone for each specific date
            </p>
            <div style={{ display: 'flex', alignItems: 'center', gap: '15px', flexWrap: 'wrap' }}>
              <span style={{ fontWeight: 'bold' }}>Set all days:</span>
              <select
                id="bulk-start-time"
                defaultValue="08:00"
                style={{
                  padding: '8px',
                  borderRadius: '4px',
                  border: '1px solid #ddd',
                  fontSize: '14px',
                  background: 'white',
                  cursor: 'pointer'
                }}
              >
                {timeOptions.map(option => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
              <span>to</span>
              <select
                id="bulk-end-time"
                defaultValue="21:00"
                style={{
                  padding: '8px',
                  borderRadius: '4px',
                  border: '1px solid #ddd',
                  fontSize: '14px',
                  background: 'white',
                  cursor: 'pointer'
                }}
              >
                {timeOptions.map(option => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
              <Button
                onClick={() => {
                  const startTime = document.getElementById('bulk-start-time').value || '08:00';
                  const endTime = document.getElementById('bulk-end-time').value || '21:00';
                  const newAvailability = { ...availability };
                  Object.keys(availability).forEach(day => {
                    if (day !== 'timezone') {
                      newAvailability[day] = {
                        ...availability[day],
                        start: startTime,
                        end: endTime
                      };
                    }
                  });
                  setAvailability(newAvailability);
                  toast.success('Applied to all days!');
                }}
                style={{
                  padding: '8px 20px',
                  background: theme.colors.primary,
                  color: 'white',
                  border: 'none',
                  borderRadius: theme.borderRadius.sm,
                  cursor: 'pointer',
                  fontSize: '14px',
                  fontWeight: 'bold'
                }}
              >
                Apply to All
              </Button>
            </div>
          </div>

          <AvailabilityGrid>
            {Object.entries(availability).filter(([key]) => key !== 'timezone').map(([day, settings]) => {
              // Find if there's a specific timezone for upcoming dates with this day
              const upcomingDates = [];
              const today = new Date();
              for (let i = 0; i < 14; i++) { // Check next 2 weeks
                const date = new Date(today);
                date.setDate(today.getDate() + i);
                const dayName = date.toLocaleDateString('en-US', { weekday: 'long' });
                if (dayName === day) {
                  const dateStr = date.toISOString().split('T')[0];
                  const locationForDate = locations.find(loc => loc.date === dateStr);
                  if (locationForDate && locationForDate.timezone) {
                    upcomingDates.push({ date: dateStr, timezone: locationForDate.timezone });
                  }
                }
              }
              
              return (
              <DayCard key={day}>
                <DayName>
                  <Checkbox
                    type="checkbox"
                    checked={settings.enabled}
                    onChange={(e) => handleAvailabilityChange(day, 'enabled', e.target.checked)}
                  />
                  {day}
                  {upcomingDates.length > 0 && (
                    <span style={{ 
                      fontSize: '0.75rem', 
                      marginLeft: '8px',
                      padding: '2px 6px',
                      background: theme.colors.pastel.peach,
                      borderRadius: theme.borderRadius.sm,
                      color: theme.colors.text.secondary
                    }}>
                      {upcomingDates[0].timezone === 'Asia/Seoul' ? 'KST' : 
                       upcomingDates[0].timezone === 'America/Los_Angeles' ? 'PDT' :
                       upcomingDates[0].timezone === 'America/New_York' ? 'EDT' :
                       upcomingDates[0].timezone === 'Europe/London' ? 'BST' :
                       upcomingDates[0].timezone === 'Asia/Tokyo' ? 'JST' : 'TZ'}
                    </span>
                  )}
                </DayName>
                {settings.enabled && (
                  <TimeSlotInput>
                    {upcomingDates.length > 0 && (
                      <div style={{ 
                        fontSize: '0.75rem', 
                        color: theme.colors.text.secondary,
                        marginBottom: '8px',
                        padding: '4px',
                        background: theme.colors.background.hover,
                        borderRadius: theme.borderRadius.sm
                      }}>
                        📅 {new Date(upcomingDates[0].date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                      </div>
                    )}
                    <div className="time-inputs" style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <span>🕐</span>
                      <select
                        value={settings.start}
                        onChange={(e) => handleAvailabilityChange(day, 'start', e.target.value)}
                        style={{
                          padding: '8px',
                          borderRadius: '4px',
                          border: '1px solid #ddd',
                          fontSize: '14px',
                          background: 'white',
                          cursor: 'pointer'
                        }}
                      >
                        {timeOptions.map(option => (
                          <option key={option.value} value={option.value}>
                            {option.label}
                          </option>
                        ))}
                      </select>
                      <span>→</span>
                      <select
                        value={settings.end}
                        onChange={(e) => handleAvailabilityChange(day, 'end', e.target.value)}
                        style={{
                          padding: '8px',
                          borderRadius: '4px',
                          border: '1px solid #ddd',
                          fontSize: '14px',
                          background: 'white',
                          cursor: 'pointer'
                        }}
                      >
                        {timeOptions.map(option => (
                          <option key={option.value} value={option.value}>
                            {option.label}
                          </option>
                        ))}
                      </select>
                    </div>
                  </TimeSlotInput>
                )}
              </DayCard>
            );
            })}
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
                <optgroup label="Asia-Pacific">
                  {timezoneOptions.Asia.map(tz => (
                    <option key={tz.value} value={tz.value}>
                      {tz.label} ({tz.abbr})
                    </option>
                  ))}
                  {timezoneOptions.Oceania.map(tz => (
                    <option key={tz.value} value={tz.value}>
                      {tz.label} ({tz.abbr})
                    </option>
                  ))}
                </optgroup>
                <optgroup label="Europe & Africa">
                  {timezoneOptions.Europe.map(tz => (
                    <option key={tz.value} value={tz.value}>
                      {tz.label} ({tz.abbr})
                    </option>
                  ))}
                </optgroup>
                <optgroup label="Americas">
                  {timezoneOptions.Americas.map(tz => (
                    <option key={tz.value} value={tz.value}>
                      {tz.label} ({tz.abbr})
                    </option>
                  ))}
                </optgroup>
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
          ) : locations.length > 0 && (() => {
            const futureLocations = locations.filter(loc => {
              // Only show future dates (including today)
              const today = new Date();
              today.setHours(0, 0, 0, 0);
              const locDate = new Date(loc.date + 'T00:00:00');
              return locDate >= today;
            });
            
            return futureLocations.length > 0 ? (
              <div style={{ marginTop: '2rem' }}>
                <h3 style={{ marginBottom: '1rem', color: theme.colors.text.primary }}>Scheduled Locations</h3>
                <BookingsList>
                  {futureLocations.map((loc, index) => (
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
          ) : null;
        })()}
        </Card>
      </AdminPanel>
    </Container>
  );
}

export default Admin;