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

- 🔐 **Hybrid Authentication System**
  - Service Account: Permanent calendar read access
  - OAuth 2.0: Full event creation with attendee invitations

- ⚡ **Automated Everything**
  - Auto-send email notifications to all attendees
  - Automatic timezone detection (Korea/US)
  - Responsive web design for any device

## 🛠 Tech Stack

- **Backend:** Node.js, Express
- **Frontend:** React, React Calendar
- **Authentication:** Hybrid System (Service Account + OAuth 2.0)
- **AI/LLM:** Gemma Model (llm.gltr.app)
- **APIs:** Google Calendar API, Gmail API
- **Database:** Google Calendar (as persistent storage)

## 📦 Installation & Setup

### 1. Install Dependencies
```bash
npm install
cd client && npm install
```

### 2. Environment Configuration
Create a `.env` file:
```
GOOGLE_CALENDAR_ID=your-email@gmail.com
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-app-password
PORT=4312
GOOGLE_REFRESH_TOKEN=your-refresh-token
```

### 3. Authentication Setup

#### Hybrid Authentication System
- **Service Account**: For calendar read operations
  - Place `service-account-key.json` in `service_account_key/` directory
  - Share your Google Calendar with the Service Account email
- **OAuth 2.0**: For creating events with attendee invitations
  - Set `GOOGLE_REFRESH_TOKEN` environment variable
  - Ensures full calendar management capabilities

### 4. Run the Application
```bash
# Development mode
npm run dev

# Production
npm start
```

Access the app at `http://localhost:4312`

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
