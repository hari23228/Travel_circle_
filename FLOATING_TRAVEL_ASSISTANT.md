# 🤖 Floating Travel Assistant - Dual AI Model System

## Overview
The Floating Travel Assistant is an intelligent chatbot positioned at the bottom-right corner of the application, accessible across all pages. It features a unique dual-model architecture that routes queries to specialized AI models based on user intent.

## 🎯 Key Features

### 1. **Dual AI Model Routing**
- **Weather Forecast Mode** → Powered by **Gemini AI**
  - Real-time weather data from WeatherStack API
  - Intelligent weather analysis and travel advice
  - Packing recommendations based on conditions
  - Best times for outdoor activities

- **Itinerary Planning Mode** → Powered by **Groq AI**
  - Personalized travel itinerary generation
  - Budget-optimized planning
  - Day-by-day activity scheduling
  - Interest-based recommendations

### 2. **User Experience**
- ✨ Floating button with pulse indicator (bottom-right corner)
- 🎨 Beautiful gradient UI with smooth animations
- 📱 Responsive design (96px × 600px chat window)
- 🔄 Easy mode switching with back navigation
- 💬 Conversational interface with message history
- ⚡ Real-time responses with loading indicators

### 3. **Smart Context Management**
- Maintains conversation context per user
- Extracts travel parameters from natural language
- Suggests follow-up questions
- Preserves context between messages

## 🏗️ Architecture

### Frontend Components

#### `FloatingTravelAssistant` Component
**Location:** `/frontend/components/floating-travel-assistant.tsx`

**Features:**
- Mode selection screen (Weather vs Itinerary)
- Chat interface with message history
- Input handling with keyboard shortcuts
- Auto-scroll to latest messages
- Model-specific branding (Gemini/Groq badges)

**States:**
- `isOpen`: Controls chatbot visibility
- `chatMode`: 'selection' | 'weather' | 'itinerary'
- `messages`: Array of conversation messages
- `isLoading`: Loading state for API calls

### Backend Controllers

#### `EnhancedChatbotController`
**Location:** `/backend/chatbot/enhancedController.js`

**Responsibilities:**
- Routes queries to appropriate AI model
- Extracts parameters from user messages
- Manages conversation flow
- Formats responses for UI consumption

**Key Methods:**
- `handleWeatherQuery()`: Processes weather requests via Gemini
- `handleItineraryQuery()`: Processes itinerary requests via Groq
- `extractLocation()`: NLP for location extraction
- `extractTravelParameters()`: Parses travel details from text

#### `GeminiService` (Enhanced)
**Location:** `/backend/chatbot/geminiService.js`

**New Method:**
- `analyzeWeatherForTravel()`: AI-powered weather analysis
  - Provides conversational responses
  - Travel-specific advice
  - Packing recommendations
  - Activity suggestions

### API Routes

#### `POST /api/chatbot/message`
**Location:** `/backend/routes/chatbot.js`

**Request:**
```json
{
  "message": "What's the weather in Paris?",
  "mode": "weather",
  "metadata": {
    "destination": "Paris",
    "userName": "John"
  }
}
```

**Response:**
```json
{
  "success": true,
  "message": "🌤️ The weather in Paris is pleasant...",
  "data": {
    "weather": { ... },
    "analysis": { ... }
  },
  "suggestions": [
    "What should I pack?",
    "Best time to visit?"
  ]
}
```

## 🔧 Configuration

### Environment Variables
```env
# Gemini AI (Weather Analysis)
GEMINI_API_KEY=your_gemini_api_key

# Groq AI (Itinerary Planning)
GROQ_API_KEY=your_groq_api_key

# WeatherStack API (Weather Data)
WEATHERSTACK_API_KEY=your_weatherstack_api_key
```

### Model Selection Logic
```javascript
// Weather queries → Gemini
mode === 'weather' → enhancedController.handleWeatherQuery()

// Itinerary queries → Groq
mode === 'itinerary' → enhancedController.handleItineraryQuery()

// No mode specified → Original orchestrator (backward compatible)
!mode → conversationOrchestrator.orchestrate()
```

## 💡 Usage Examples

### Weather Forecast
**User clicks:** Weather Forecast button
**Bot activates:** Gemini AI mode
**User asks:** "What's the weather like in Tokyo next week?"
**Response:** AI-analyzed weather with travel advice

### Itinerary Planning
**User clicks:** Itinerary Planning button
**Bot activates:** Groq AI mode
**User asks:** "Plan a 5-day trip to Barcelona with $2000 budget"
**Response:** Detailed day-by-day itinerary with budget breakdown

## 🎨 UI/UX Design

### Floating Button (Closed State)
- Size: 64px × 64px
- Position: fixed bottom-6 right-6
- Gradient: primary to primary/80
- Pulse indicator: Green dot (top-right)
- Hover effect: Scale animation

### Chat Window (Open State)
- Size: 384px × 600px
- Rounded corners with shadow
- Header: Gradient with mode indicator
- Scrollable message area
- Fixed input at bottom

### Mode Selection Screen
- Two large feature cards
- Weather: Blue-cyan gradient
- Itinerary: Purple-pink gradient
- Model badges (Gemini/Groq)
- Help tip at bottom

## 🚀 Integration Points

### Layout Integration
**File:** `/frontend/app/layout.tsx`
- Dynamically imported (client-side only)
- Wrapped in authentication context
- Globally accessible across all pages

### Dashboard Integration
- Removed duplicate AI Features card
- Added "Travel Assistant" link to header
- Redirects to dedicated `/travel-assistant` page

### Travel Assistant Page
- Removed embedded chatbot
- Added info card directing to floating assistant
- Shows AI feature grid for navigation

## 🧪 Testing

### Test Weather Mode
1. Click floating chat button
2. Select "Weather Forecast"
3. Ask: "What's the weather in London?"
4. Verify Gemini AI response

### Test Itinerary Mode
1. Click floating chat button
2. Select "Itinerary Planning"
3. Ask: "Plan a 3-day trip to Paris with $1000"
4. Verify Groq AI generates itinerary

### Test Context Preservation
1. Start conversation in weather mode
2. Ask follow-up questions
3. Verify context is maintained

## 📊 Performance Optimizations

- **Dynamic Import:** Floating assistant loaded only on client
- **Conditional Rendering:** Hidden for unauthenticated users
- **Auto-scroll:** Smooth scroll to latest messages
- **Lazy Loading:** Components loaded on demand
- **Message Batching:** Efficient state updates

## 🔒 Security

- **Authentication:** Uses optionalAuth middleware
- **User Identification:** Authenticated user ID or guest session
- **Input Validation:** Message type and content checks
- **Error Handling:** Graceful fallbacks for API failures
- **Rate Limiting:** Prevents API abuse

## 📝 Future Enhancements

- [ ] Add conversation history persistence
- [ ] Multi-language support
- [ ] Voice input/output
- [ ] Image/file uploads for context
- [ ] Integration with booking systems
- [ ] Sentiment analysis for better responses
- [ ] Offline mode with cached responses
- [ ] Advanced NLP for better parameter extraction

## 🐛 Troubleshooting

### Issue: Chatbot doesn't open
- **Check:** User authentication status
- **Solution:** Ensure user is logged in

### Issue: Weather data not loading
- **Check:** WEATHERSTACK_API_KEY in .env
- **Solution:** Verify API key is valid

### Issue: Itinerary not generating
- **Check:** GROQ_API_KEY in .env
- **Solution:** Check Groq API credits and rate limits

### Issue: Wrong model responses
- **Check:** Mode parameter in API call
- **Solution:** Ensure mode is 'weather' or 'itinerary'

## 📚 Dependencies

### Frontend
- React 18+
- Next.js 16+
- Lucide React (icons)
- Tailwind CSS (styling)

### Backend
- Express.js
- Google Generative AI (Gemini)
- Groq SDK
- WeatherStack API

## 🎓 Developer Notes

- Both controllers (original + enhanced) are maintained for backward compatibility
- Enhanced controller is used when `mode` parameter is present
- Original orchestrator handles legacy requests
- Context manager is shared across both controllers
- Error responses are standardized across all modes

---

**Created:** January 2026
**Version:** 1.0.0
**Status:** ✅ Production Ready
