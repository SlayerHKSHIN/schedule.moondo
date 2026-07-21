# Schedule GLTR-OUS

AI-Powered Smart Meeting Scheduler - Intelligent booking system integrated with Google Calendar

## 💡 What Makes This Special

**Stop the back-and-forth emails. Just talk to an AI.**

Traditional scheduling requires endless conversations:
- "Are you free next Tuesday?"
- "What time works for you?"
- "How about 2pm instead?"

**Schedule GLTR-OUS changes that.** Simply tell the AI agent what you need in natural language, and it handles everything - checking availability, finding optimal times, and booking meetings automatically.

## ✨ Key Features

- 🤖 **AI-Powered Natural Language Booking**
  - Just say: "Schedule a 30-minute meeting next Tuesday afternoon"
  - Or ask: "When am I available between Oct 23-25, 10am-12pm?"
  - Supports both English and Korean
  - Conversational interface that understands context

- 📅 **Smart Calendar Integration**
  - Real-time sync with Google Calendar
  - Automatic conflict detection
  - Instant availability checking
  - Private self-service links for viewing and updating existing bookings

- 🔐 **Hybrid Authentication System**
  - Service Account: Permanent calendar read access
  - OAuth 2.0: Full event creation with attendee invitations

- ⚡ **Automated Everything**
  - Google Calendar invitations and update notifications for all attendees
  - Automatic timezone detection (Korea/US)
  - Responsive web design for any device

## 🛠 Tech Stack

- **Backend:** Node.js, Express
- **Frontend:** React, React Calendar
- **Authentication:** Hybrid System (Service Account + OAuth 2.0)
- **AI/LLM:** Gemma Model (llm.gltr.app)
- **APIs:** Google Calendar API
- **Database:** Google Calendar (as persistent storage)

## 📦 Installation & Setup

### 1. Clone the Repository
```bash
git clone https://github.com/SlayerHKSHIN/schedule.moondo.git
cd schedule.moondo
```

### 2. Install Dependencies
```bash
# Install backend dependencies
npm install

# Install frontend dependencies
cd client && npm install && cd ..
```

### 3. Environment Configuration

#### Backend Environment (.env)
Copy the example file and configure:
```bash
cp .env.example .env
```

Edit `.env` with your credentials:
```env
PORT=4312
NODE_ENV=production
APP_ORIGIN=https://schedule.moondo.ai

# Google OAuth Credentials (from Google Cloud Console)
GOOGLE_CLIENT_ID=your-google-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your-google-client-secret
GOOGLE_REDIRECT_URI=https://your-domain.com/api/auth/google/callback

# Google Calendar
GOOGLE_CALENDAR_ID=your-email@gmail.com

# Admin Password
ADMIN_PASSWORD=your-secure-admin-password

# Stable secret used to sign private booking-management links.
# Do not rotate it unless all existing links should be invalidated.
BOOKING_MANAGEMENT_SECRET=your-distinct-random-secret-of-at-least-32-characters

# Encryption Key (generate using the command below)
ENCRYPTION_KEY=your-64-character-hex-key
```

**Generate encryption key:**
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

Generate `BOOKING_MANAGEMENT_SECRET` independently with the same command. Do
not reuse `ENCRYPTION_KEY`, `SESSION_SECRET`, or another application secret.

#### Frontend Environment (client/.env)
```bash
cd client
cp .env.example .env
cd ..
```

#### Data Files Setup
Create the data files from examples:
```bash
cp data/users.json.example data/users.json
cp data/availability.json.example data/availability.json
```

Edit `data/availability.json` to set your default availability schedule and timezone.

### 4. Google Cloud Setup

#### Step 1: Create Google Cloud Project
1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Create a new project
3. Enable these APIs:
   - Google Calendar API

#### Step 2: Service Account Setup (for Calendar Reading)
1. Navigate to "IAM & Admin" > "Service Accounts"
2. Create a new service account
3. Download the JSON key file
4. Save it as `service_account_key/service-account-key.json`
5. Share your Google Calendar with the service account email (found in the JSON file)

#### Step 3: OAuth 2.0 Setup (for Event Creation)
1. Go to "APIs & Services" > "Credentials"
2. Create OAuth 2.0 Client ID (Web application)
3. Add authorized redirect URIs:
   - `http://localhost:4312/api/auth/google/callback` (development)
   - `https://your-domain.com/api/auth/google/callback` (production)
4. Copy the Client ID and Client Secret to `.env`

### 5. Build Frontend
```bash
cd client
npm run build
cd ..
```

### 6. Run the Application

**Development mode:**
```bash
# Terminal 1 - Backend
npm run dev

# Terminal 2 - Frontend (optional, if not using build)
cd client && npm start
```

**Production mode:**
```bash
npm start
```

Access the app at `http://localhost:4312`

Existing attendees can visit `/manage` and enter the email used for booking.
For matching events, Google Calendar sends an updated invitation containing a
private management link. The link token is kept in the URL fragment (after
`#`) and must be treated like a password.

### 7. Initial OAuth Setup
1. Start the server
2. Go to `http://localhost:4312/admin`
3. Login with your admin password
4. Click "Authorize with Google" to complete OAuth setup
5. The refresh token will be automatically saved

## 🎯 Development Roadmap

### Phase 1: LLM Integration ✅ (Completed)
**Natural Language Meeting Booking**
- "Schedule a 30-minute meeting next Tuesday afternoon"
- "Show me available slots between Oct 23-25, 10am-12pm"
- Korean/English natural language processing
- Context-aware intelligent suggestions
- Conversational booking interface

### Phase 2: MeetSync AI Platform (Planned)
**AI Agent-to-Agent Automated Negotiation**
```
User A ↔ AI Agent A ↔ Negotiation Protocol ↔ AI Agent B ↔ User B
                          ↓
                    Automatic Optimal Time Matching
```

**Benefits of Hybrid Authentication:**
- Stable calendar reading with Service Account's permanent auth
- Complete attendee management via OAuth
- Bidirectional calendar access ready for Phase 2

### Phase 3: Intelligent Features
- 🤖 Learn attendee preferences
- 📍 Automatic travel time calculation
- 👥 Group meeting optimization
- 📝 AI-powered meeting prep summaries

## 🔮 Vision

**"A world where AI schedules meetings for you"**

Imagine saying "Let's have lunch tomorrow" to a friend, and both AI assistants automatically:
1. Check available times
2. Suggest optimal locations
3. Confirm and send notifications

No more scheduling friction. Just seamless coordination.

## 📁 Project Structure

```
schedule-gltr-ous/
├── server.js           # Main server
├── client/            # React frontend
│   └── components/    # Including ChatBot (LLM interface)
├── routes/            # API routes
│   ├── booking.js     # Booking handler
│   └── nlp.js        # Natural language processing
├── utils/             # Utilities
│   ├── googleCalendar.js  # Hybrid auth system
│   ├── serviceAccountAuth.js  # Service Account auth
│   ├── tokenManager.js    # OAuth token management
│   └── llmClient.js      # LLM API client
├── service_account_key/  # Google auth keys
└── temp/              # Temporary files and docs
```

## 🤝 Contributing

This project is open source. Contributions are welcome!

1. Fork the repository
2. Create your feature branch
3. Commit your changes
4. Push to the branch
5. Open a Pull Request

## 📄 License

Proprietary License - All Rights Reserved

Copyright (c) 2024 Hyun Shin

Use, copying, modification, and distribution of this software is prohibited without explicit permission from the copyright holder.

## 🔗 Contact

- Email: haneul96@gmail.com
- GitHub: [schedule-gltr-ous](https://github.com/SlayerHKSHIN/schedule.gltr-ous.us)

---

**Built with ❤️ for making scheduling effortless**
