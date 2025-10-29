const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const path = require('path');
const cookieParser = require('cookie-parser');
const session = require('express-session');
require('dotenv').config();

const calendarRoutes = require('./routes/calendar');
const bookingRoutes = require('./routes/booking');
const adminRoutes = require('./routes/admin');
const { router: authRoutes } = require('./routes/auth');
const userCalendarRoutes = require('./routes/userCalendar');
const nlpRoutes = require('./routes/nlp');
const tokenManager = require('./utils/tokenManager');

const app = express();
const PORT = process.env.PORT || 4312;

app.use(cors({
  origin: process.env.NODE_ENV === 'production'
    ? 'https://hyun-schedule.moondo.ai'
    : true,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(cookieParser());

// Session configuration
app.use(session({
  secret: process.env.SESSION_SECRET || 'your-session-secret-change-in-production',
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: process.env.NODE_ENV === 'production',
    httpOnly: true,
    maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
  }
}));

app.use('/api/auth', authRoutes);
app.use('/api/user/calendar', userCalendarRoutes); // User-specific calendar routes
app.use('/api/calendar', calendarRoutes); // Legacy/admin calendar routes
app.use('/api/booking', bookingRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/nlp', nlpRoutes); // Natural language processing routes

if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, 'client/build')));
  
  app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'client/build', 'index.html'));
  });
}

// Check and refresh token on server startup
async function startServer() {
  try {
    // Check token validity on startup and auto-refresh if needed
    console.log('Checking OAuth token validity...');
    const client = tokenManager.getClient();

    if (client.credentials && client.credentials.refresh_token) {
      try {
        // Use getValidClient to automatically refresh if expired
        await tokenManager.getValidClient();
        console.log('OAuth token validated and refreshed if needed');
      } catch (error) {
        console.error('Warning: Could not refresh OAuth token:', error.message);
        console.log('Please run: node scripts/auto-refresh-token.js setup');
      }
    } else {
      console.warn('No OAuth refresh token found. Some features may be limited.');
      console.log('To set up OAuth, run: node scripts/auto-refresh-token.js setup');
    }
  } catch (error) {
    console.error('Error during token validation:', error);
  }

  // Start the server
  app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
  });
}

startServer();