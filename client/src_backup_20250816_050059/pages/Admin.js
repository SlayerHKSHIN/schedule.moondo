import React, { useState } from 'react';
import axios from 'axios';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import './Admin.css';

function Admin() {
  const [password, setPassword] = useState('');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [breakData, setBreakData] = useState({
    date: '',
    startTime: '',
    endTime: '',
    recurring: false,
    recurringDays: []
  });
  const [loading, setLoading] = useState(false);
  const [userTimezone, setUserTimezone] = useState('');
  const [locationData, setLocationData] = useState({
    startDate: '',
    endDate: '',
    morningLocation: '',
    afternoonLocation: ''
  });
  const [locations, setLocations] = useState([]);
  const [editingLocation, setEditingLocation] = useState(null);
  const [loadingLocations, setLoadingLocations] = useState(false);

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

  // Fetch locations when authenticated
  React.useEffect(() => {
    if (isAuthenticated) {
      fetchLocations();
    }
  }, [isAuthenticated]);

  const fetchLocations = async () => {
    try {
      setLoadingLocations(true);
      const response = await axios.get('/api/admin/locations');
      console.log('Fetched locations:', response.data.locations);
      setLocations(response.data.locations || []);
    } catch (error) {
      console.error('Error fetching locations:', error);
      toast.error('Failed to fetch locations');
    } finally {
      setLoadingLocations(false);
    }
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    
    try {
      const response = await axios.post('/api/admin/login', { password });
      if (response.data.success) {
        setIsAuthenticated(true);
        toast.success('Logged in successfully!');
      }
    } catch (error) {
      toast.error('Invalid password');
    }
  };

  const handleBreakSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      await axios.post('/api/admin/break-time', {
        ...breakData,
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone
      });
      toast.success('Break time added successfully!');
      setBreakData({
        date: '',
        startTime: '',
        endTime: '',
        recurring: false,
        recurringDays: []
      });
    } catch (error) {
      toast.error('Failed to add break time');
    } finally {
      setLoading(false);
    }
  };

  const handleDayToggle = (day) => {
    setBreakData(prev => ({
      ...prev,
      recurringDays: prev.recurringDays.includes(day)
        ? prev.recurringDays.filter(d => d !== day)
        : [...prev.recurringDays, day]
    }));
  };

  const handleLocationSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      // If editing, delete old location first
      if (editingLocation) {
        await axios.delete('/api/admin/location', {
          data: { 
            startDate: editingLocation.startDate, 
            endDate: editingLocation.endDate 
          }
        });
      }
      
      // Add new/updated location
      await axios.post('/api/admin/location', locationData);
      toast.success(editingLocation ? 'Location updated successfully!' : 'Location added successfully!');
      setLocationData({ startDate: '', endDate: '', morningLocation: '', afternoonLocation: '' });
      setEditingLocation(null);
      await fetchLocations();
    } catch (error) {
      toast.error(editingLocation ? 'Failed to update location' : 'Failed to add location');
    } finally {
      setLoading(false);
    }
  };

  const handleLocationDelete = async (date, timeOfDay) => {
    const timeText = timeOfDay ? ` (${timeOfDay})` : '';
    if (!window.confirm(`Delete location for ${date}${timeText}?`)) {
      return;
    }
    
    try {
      await axios.delete('/api/admin/location', {
        data: { startDate: date, endDate: date, timeOfDay }
      });
      toast.success('Location deleted successfully!');
      await fetchLocations();
    } catch (error) {
      console.error('Delete error:', error);
      toast.error(`Failed to delete location: ${error.response?.data?.error || error.message}`);
    }
  };

  const handleLocationEdit = (loc) => {
    setEditingLocation(loc);
    setLocationData({
      startDate: loc.date,
      endDate: '',
      morningLocation: loc.morning || '',
      afternoonLocation: loc.afternoon || ''
    });
  };

  const handleCancelEdit = () => {
    setEditingLocation(null);
    setLocationData({ startDate: '', endDate: '', morningLocation: '', afternoonLocation: '' });
  };

  if (!isAuthenticated) {
    return (
      <div className="admin-container">
        <div className="login-form">
          <h2>Admin Login</h2>
          <form onSubmit={handleLogin}>
            <input
              type="password"
              placeholder="Enter password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
            <button type="submit">Login</button>
          </form>
        </div>
        <ToastContainer position="bottom-right" />
      </div>
    );
  }

  return (
    <div className="admin-container">
      <h1>Admin Dashboard</h1>
      
      <div className="admin-section">
        <h2>Add Break Time</h2>
        <p style={{ fontSize: '0.9em', color: '#666', marginBottom: '15px' }}>
          Your timezone: {userTimezone} - All times entered will be in this timezone
        </p>
        <form onSubmit={handleBreakSubmit}>
          <div className="form-group">
            <label>
              <input
                type="checkbox"
                checked={breakData.recurring}
                onChange={(e) => setBreakData({ ...breakData, recurring: e.target.checked })}
              />
              Recurring Break
            </label>
          </div>

          {!breakData.recurring ? (
            <div className="form-group">
              <label>Date</label>
              <input
                type="date"
                value={breakData.date}
                onChange={(e) => setBreakData({ ...breakData, date: e.target.value })}
                required
              />
            </div>
          ) : (
            <div className="form-group">
              <label>Select Days</label>
              <div className="days-selector">
                {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'].map(day => (
                  <label key={day} className="day-checkbox">
                    <input
                      type="checkbox"
                      checked={breakData.recurringDays.includes(day)}
                      onChange={() => handleDayToggle(day)}
                    />
                    {day}
                  </label>
                ))}
              </div>
            </div>
          )}

          <div className="time-inputs">
            <div className="form-group">
              <label>Start Time</label>
              <input
                type="time"
                value={breakData.startTime}
                onChange={(e) => setBreakData({ ...breakData, startTime: e.target.value })}
                required
              />
            </div>

            <div className="form-group">
              <label>End Time</label>
              <input
                type="time"
                value={breakData.endTime}
                onChange={(e) => setBreakData({ ...breakData, endTime: e.target.value })}
                required
              />
            </div>
          </div>

          <button type="submit" disabled={loading}>
            {loading ? 'Adding...' : 'Add Break Time'}
          </button>
        </form>
      </div>

      <div className="admin-section">
        <h2>{editingLocation ? 'Edit Location' : 'Set Your Location'}</h2>
        <form onSubmit={handleLocationSubmit}>
          <div className="form-group">
            <label>Start Date</label>
            <input
              type="date"
              value={locationData.startDate}
              onChange={(e) => setLocationData({ ...locationData, startDate: e.target.value })}
              required
            />
          </div>

          <div className="form-group">
            <label>End Date (leave empty for single day)</label>
            <input
              type="date"
              value={locationData.endDate}
              onChange={(e) => setLocationData({ ...locationData, endDate: e.target.value })}
              min={locationData.startDate}
            />
          </div>

          <div className="form-group">
            <label>Morning Location (until 12pm)</label>
            <input
              type="text"
              value={locationData.morningLocation}
              onChange={(e) => setLocationData({ ...locationData, morningLocation: e.target.value })}
              placeholder="Enter your morning location (leave empty if same all day)"
            />
          </div>

          <div className="form-group">
            <label>Afternoon Location (from 12pm)</label>
            <input
              type="text"
              value={locationData.afternoonLocation}
              onChange={(e) => setLocationData({ ...locationData, afternoonLocation: e.target.value })}
              placeholder="Enter your afternoon location (leave empty if same all day)"
            />
          </div>

          <button type="submit" disabled={loading}>
            {loading ? 'Saving...' : (editingLocation ? 'Update Location' : 'Add Location')}
          </button>
          {editingLocation && (
            <button 
              type="button" 
              onClick={handleCancelEdit}
              style={{ marginLeft: '10px', backgroundColor: '#6c757d' }}
            >
              Cancel
            </button>
          )}
        </form>

        {loadingLocations ? (
          <div style={{ marginTop: '30px', textAlign: 'center' }}>
            <p>Loading locations...</p>
          </div>
        ) : locations.length > 0 && (
          <div style={{ marginTop: '30px' }}>
            <h3>Scheduled Locations</h3>
            <ul style={{ listStyle: 'none', padding: 0 }}>
              {locations.map((loc, index) => (
                <li key={index} style={{ 
                  marginBottom: '15px', 
                  padding: '15px', 
                  backgroundColor: '#f5f5f5', 
                  borderRadius: '5px'
                }}>
                  <div style={{ marginBottom: '10px' }}>
                    <strong style={{ fontSize: '16px' }}>{loc.date}</strong>
                  </div>
                  {loc.morning && (
                    <div style={{ 
                      display: 'flex', 
                      justifyContent: 'space-between', 
                      alignItems: 'center',
                      marginBottom: '8px',
                      padding: '8px',
                      backgroundColor: '#e3f2fd',
                      borderRadius: '4px'
                    }}>
                      <div>
                        <span style={{ color: '#1976d2', fontWeight: 'bold' }}>Morning:</span> {loc.morning}
                      </div>
                      <button 
                        onClick={() => handleLocationDelete(loc.date, 'morning')}
                        style={{ 
                          padding: '3px 8px',
                          backgroundColor: '#dc3545',
                          color: 'white',
                          border: 'none',
                          borderRadius: '3px',
                          cursor: 'pointer',
                          fontSize: '12px'
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
                      marginBottom: '8px',
                      padding: '8px',
                      backgroundColor: '#fff3e0',
                      borderRadius: '4px'
                    }}>
                      <div>
                        <span style={{ color: '#f57c00', fontWeight: 'bold' }}>Afternoon:</span> {loc.afternoon}
                      </div>
                      <button 
                        onClick={() => handleLocationDelete(loc.date, 'afternoon')}
                        style={{ 
                          padding: '3px 8px',
                          backgroundColor: '#dc3545',
                          color: 'white',
                          border: 'none',
                          borderRadius: '3px',
                          cursor: 'pointer',
                          fontSize: '12px'
                        }}
                      >
                        Delete
                      </button>
                    </div>
                  )}
                  <div style={{ marginTop: '10px', textAlign: 'right' }}>
                    <button 
                      onClick={() => handleLocationEdit(loc)}
                      style={{ 
                        padding: '5px 15px',
                        backgroundColor: '#007bff',
                        color: 'white',
                        border: 'none',
                        borderRadius: '3px',
                        cursor: 'pointer'
                      }}
                    >
                      Edit Day
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      <div className="logout-section">
        <button onClick={() => setIsAuthenticated(false)} className="logout-button">
          Logout
        </button>
      </div>

      <ToastContainer position="bottom-right" />
    </div>
  );
}

export default Admin;