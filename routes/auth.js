const express = require('express');
const router = express.Router();
const { google } = require('googleapis');
const jwt = require('jsonwebtoken');
const userStore = require('../utils/userStore');
const tokenManager = require('../utils/tokenManager');

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

// Create OAuth2 client
function createOAuth2Client() {
  return new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    process.env.GOOGLE_REDIRECT_URI || 'http://localhost:4312/api/auth/google/callback'
  );
}

// Generate OAuth URL
router.get('/google', (req, res) => {
  const oauth2Client = createOAuth2Client();
  
  const scopes = [
    'https://www.googleapis.com/auth/calendar',
    'https://www.googleapis.com/auth/userinfo.email',
    'https://www.googleapis.com/auth/userinfo.profile'
  ];
  
  const url = oauth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: scopes,
    prompt: 'consent' // Force consent screen to get refresh token
  });
  
  res.json({ authUrl: url });
});

// Handle OAuth callback
router.get('/google/callback', async (req, res) => {
  const { code } = req.query;
  
  if (!code) {
    return res.redirect('/login?error=no_code');
  }
  
  try {
    const oauth2Client = createOAuth2Client();
    const { tokens } = await oauth2Client.getToken(code);
    oauth2Client.setCredentials(tokens);

    // Get user info - try with fallback
    let userInfo;
    try {
      const oauth2 = google.oauth2({ version: 'v2', auth: oauth2Client });
      const { data } = await oauth2.userinfo.get();
      userInfo = data;
    } catch (userInfoError) {
      console.warn('Could not fetch userinfo, using calendar email instead:', userInfoError.message);
      // Fallback: use calendar email as user identifier
      userInfo = {
        id: process.env.GOOGLE_CALENDAR_ID,
        email: process.env.GOOGLE_CALENDAR_ID,
        name: 'Calendar User',
        picture: null
      };
    }
    
    // Save user to store
    const userData = {
      googleId: userInfo.id,
      email: userInfo.email,
      name: userInfo.name,
      picture: userInfo.picture,
      refreshToken: tokens.refresh_token,
      accessToken: tokens.access_token,
      tokenExpiry: tokens.expiry_date,
      lastLogin: new Date().toISOString()
    };
    
    const savedUser = userStore.saveUser(userData);

    // Also sync tokens to TokenManager for calendar operations
    try {
      tokenManager.saveToken({
        refresh_token: tokens.refresh_token,
        access_token: tokens.access_token,
        expiry_date: tokens.expiry_date
      });
      console.log('Tokens synced to TokenManager');
    } catch (syncError) {
      console.warn('Could not sync tokens to TokenManager:', syncError.message);
      // Non-critical, continue
    }

    // Create JWT token for session
    const sessionToken = jwt.sign(
      { 
        userId: userInfo.id,
        email: userInfo.email,
        name: userInfo.name
      },
      JWT_SECRET,
      { expiresIn: '7d' }
    );
    
    // Set cookie and redirect
    res.cookie('session', sessionToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
    });
    
    // Redirect to frontend with success
    res.redirect('/?login=success');
    
  } catch (error) {
    console.error('OAuth callback error:', error);
    res.redirect('/login?error=oauth_failed');
  }
});

// Get current user info
router.get('/user', (req, res) => {
  const token = req.cookies?.session;
  
  if (!token) {
    return res.json({ authenticated: false });
  }
  
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    const user = userStore.getUser(decoded.userId);
    
    if (!user) {
      return res.json({ authenticated: false });
    }
    
    // Don't send sensitive tokens to frontend
    const { refreshToken, accessToken, ...safeUser } = user;
    
    res.json({
      authenticated: true,
      user: safeUser
    });
  } catch (error) {
    res.json({ authenticated: false });
  }
});

// Logout
router.post('/logout', (req, res) => {
  res.clearCookie('session');
  res.json({ success: true });
});

// Check if user is authenticated (middleware)
function requireAuth(req, res, next) {
  const token = req.cookies?.session;
  
  if (!token) {
    return res.status(401).json({ error: 'Not authenticated' });
  }
  
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    const user = userStore.getUser(decoded.userId);
    
    if (!user) {
      return res.status(401).json({ error: 'User not found' });
    }
    
    req.user = user;
    next();
  } catch (error) {
    res.status(401).json({ error: 'Invalid session' });
  }
}

// Export router and middleware
module.exports = { router, requireAuth };