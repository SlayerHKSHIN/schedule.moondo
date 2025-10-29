# Multi-User Google Calendar Integration Plan

## Current State
- Single Google account hardcoded (Hyun's account)
- All users share the same calendar
- No user authentication system

## Target Architecture

### 1. User Authentication Flow
```
User visits site → Click "Connect Google Calendar" → OAuth flow → Store user tokens → Use individual calendar
```

### 2. Database Schema Needed
```javascript
// User Model
{
  id: string,
  email: string,
  googleId: string,
  refreshToken: string (encrypted),
  accessToken: string (encrypted),
  tokenExpiry: Date,
  displayName: string,
  profileUrl: string,
  createdAt: Date,
  lastLogin: Date
}

// Session Model
{
  id: string,
  userId: string,
  token: string,
  expiresAt: Date
}
```

### 3. Required Endpoints

#### Authentication
- `GET /api/auth/google` - Initiate OAuth flow
- `GET /api/auth/google/callback` - Handle OAuth callback
- `GET /api/auth/logout` - Logout user
- `GET /api/auth/status` - Check auth status

#### Calendar (User-specific)
- `GET /api/calendar/available-slots` - Get user's available slots
- `POST /api/booking/create` - Create booking in user's calendar
- `GET /api/admin/location/:date` - Get user's location for date

### 4. Implementation Steps

#### Phase 1: Database Setup
1. Install MongoDB or SQLite
2. Create User and Session models
3. Set up database connection

#### Phase 2: OAuth Implementation
1. Update Google OAuth credentials for multi-user
2. Implement OAuth flow endpoints
3. Store user tokens securely

#### Phase 3: Session Management
1. Implement JWT or session-based auth
2. Add auth middleware
3. Protect calendar endpoints

#### Phase 4: Update Calendar Functions
1. Modify `googleCalendar.js` to accept user tokens
2. Update all calendar operations for multi-user
3. Add user context to all requests

#### Phase 5: Frontend Updates
1. Add login/logout UI
2. Show user status
3. Handle auth redirects

### 5. Security Considerations
- Encrypt tokens in database
- Use secure sessions
- Implement CSRF protection
- Add rate limiting
- Validate all inputs

### 6. Migration Strategy
1. Keep existing functionality for admin
2. Add multi-user as optional feature
3. Gradual rollout with feature flag

## Quick Start Implementation

For a minimal viable implementation:

1. **Use JSON file for user storage** (no database initially)
2. **Implement basic OAuth flow**
3. **Store tokens in encrypted file**
4. **Use session cookies for auth**

This can be upgraded to a full database solution later.