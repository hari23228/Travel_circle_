# 🤖 Tripzz AI Chatbot - User Guide

## How to Ask Questions

The Tripzz AI Chatbot is your intelligent travel planning assistant powered by Google Gemini AI and real-time weather data. You can interact with it naturally - just ask questions as you would to a human travel advisor!

---

## ✨ What You Can Ask

### 🌍 Destination Planning

**Example Questions:**
- "I want to go to Goa"
- "I'm planning to visit Paris"
- "Tell me about Bali"
- "What's the best time to visit Tokyo?"
- "Should I go to the Maldives?"

**What the chatbot does:**
- Extracts your destination
- Fetches current weather data
- Provides destination-specific insights

---

### 📅 Travel Dates

**Example Questions:**
- "March 20 - 29"
- "April 10 to April 20"
- "I'm traveling in May"
- "Next month for 2 weeks"
- "When should I visit based on the weather?"

**What the chatbot does:**
- Understands date ranges and months
- Analyzes weather forecasts for your dates
- Recommends optimal travel windows

---

### 🎯 Activities & Interests

**Example Questions:**
- "Beach activities"
- "I want to do sightseeing"
- "Museums and cafes"
- "What can I do in [destination]?"
- "What activities are good for rainy weather?"

**What the chatbot does:**
- Suggests activities based on your interests
- Provides weather-appropriate recommendations
- Creates personalized itineraries

---

### 🌤️ Weather Information

**Example Questions:**
- "How's the weather in Goa?"
- "What's the temperature in Paris right now?"
- "Will it rain during my trip?"
- "Is March a good time to visit?"
- "What's the forecast for next week?"

**What the chatbot does:**
- Fetches real-time weather data
- Provides detailed forecasts
- Analyzes weather suitability for activities
- Identifies potential weather conflicts

---

### 🎒 Packing & Preparation

**Example Questions:**
- "What should I pack for Goa in March?"
- "Do I need warm clothes?"
- "What's the best outfit for this weather?"
- "Will I need an umbrella?"

**What the chatbot does:**
- Creates weather-based packing lists
- Recommends clothing and gear
- Provides temperature-specific advice

---

## 💡 Smart Conversation Features

### Ask Anytime, Anywhere
You **don't** need to follow a strict order! The chatbot is flexible:

```
❌ OLD WAY (Rigid):
Bot: "Where do you want to go?"
You: "How's the weather in Paris?"
Bot: "Please tell me your destination first."

✅ NEW WAY (Flexible):
You: "How's the weather in Paris?"
Bot: "Paris is currently 12°C with light rain..."
```

### Multi-Turn Conversations
The chatbot remembers your conversation context:

```
You: "I want to go to Bali"
Bot: "Great choice! When are you planning to visit?"
You: "What's the weather like there now?"
Bot: "Bali is currently 28°C and sunny..."
You: "Perfect! I'll go in March 15-25"
Bot: "Excellent! March is great for Bali..."
```

### Intelligent Context Understanding
The chatbot can infer missing information:

```
You: "I want to go to Goa"
Bot: "Goa is perfect! When are you planning to visit?"
You: "How's the weather there?"
Bot: [Automatically fetches weather for Goa]
```

---

## 🚀 Quick Start Examples

### Complete Trip Planning
```
You: "I want to plan a trip to Thailand"
Bot: "Thailand is amazing! When are you planning to visit?"
You: "April 10 - 20"
Bot: "Great dates! What activities interest you?"
You: "Beach activities and sightseeing"
Bot: [Provides comprehensive weather analysis and recommendations]
```

### Quick Weather Check
```
You: "What's the weather in Tokyo?"
Bot: [Provides current weather and forecast]
```

### Spontaneous Questions
```
You: "Is it raining in London right now?"
Bot: [Fetches real-time weather data]
```

---

## ⚠️ Known Limitations

### API Rate Limits
- **Gemini AI**: Free tier has daily limits (resets every 24 hours)
- **WeatherStack**: API key configured for moderate usage
- If you see errors, wait a few minutes or try again later

### Weather Data
- Forecasts are based on current simulations (WeatherStack free plan)
- For precise long-term forecasts, upgrade to paid plan

### Destination Recognition
The chatbot works best with:
- City names: "Paris", "Tokyo", "New York"
- Popular destinations: "Bali", "Maldives", "Dubai"
- Country names: "Thailand", "Italy", "Japan"

---

## 🛠️ Troubleshooting

### Chatbot Not Responding
1. Check if backend server is running (port 5001)
2. Verify Gemini API key is valid
3. Check browser console for errors

### Weather Data Unavailable
1. Verify WeatherStack API key in `.env`
2. Check destination spelling
3. Try a major city name instead of small towns

### "Quota Exceeded" Error
- **Cause**: Gemini API daily limit reached
- **Solution**: 
  - Wait 24 hours for reset
  - Generate new API key at [Google AI Studio](https://aistudio.google.com/app/apikey)
  - Enable billing for higher limits

---

## 🎯 Best Practices

### ✅ DO
- Ask specific questions
- Provide city names clearly
- Use date ranges (e.g., "March 10-20")
- Ask follow-up questions naturally
- Request weather information anytime

### ❌ DON'T
- Use very obscure location names
- Expect future weather beyond forecast range
- Spam questions rapidly (rate limits)
- Assume chatbot remembers across sessions (30-min timeout)

---

## 🔧 Technical Details

### Models Used
- **AI**: Google Gemini 2.5 Flash-Lite
- **Weather**: WeatherStack API
- **Context**: 30-minute session memory

### Response Time
- Simple queries: < 1 second
- Weather fetching: 2-4 seconds
- Complex analysis: 3-6 seconds

### Session Management
- Conversations are stored per user
- Context expires after 30 minutes of inactivity
- Starting a new session resets all context

---

## 📞 Support

### Common Issues
- **"The same question is repeated"**: Fixed! Latest version has flexible conversation flow
- **"Destination not recognized"**: Use popular city/country names
- **"Weather unavailable"**: Check API keys or try again later

### Need Help?
- Check the logs at `backend/logs/` for detailed errors
- Verify `.env` configuration
- Restart the backend server

---

## 🎉 Example Conversation Flow

```
You: Hi
Bot: Hi there! 👋 I'm your intelligent travel planning assistant...

You: I want to go to Bali
Bot: Bali is a wonderful destination! Currently 28°C and sunny...

You: What about March 15-25?
Bot: Excellent choice! March is ideal for Bali. Let me analyze the weather...

You: What activities do you recommend?
Bot: Based on the sunny weather, I recommend:
     - Beach activities (perfect conditions!)
     - Surfing at Kuta Beach
     - Temple tours (dry and comfortable)
     - Sunset at Uluwatu

You: What should I pack?
Bot: For Bali in March, pack:
     - Light summer clothes
     - Swimwear
     - Sunscreen (high humidity)
     - Light rain jacket (occasional showers)
```

---

## 📝 Notes

- The chatbot is powered by **Gemini AI** for intelligent understanding
- **Real-time weather** data ensures accurate recommendations
- **Context-aware** conversations remember your trip details
- **Flexible** - ask questions in any order!

---

## 🌟 Pro Tips

1. **Be conversational**: Talk naturally, don't use keywords
2. **Ask follow-ups**: "What about the temperature?" works great
3. **Request specifics**: "What's the rain forecast?" gets detailed data
4. **Explore freely**: Don't feel locked into a sequence
5. **Check weather often**: Data updates frequently

---

**Ready to plan your perfect trip? Start chatting! ✈️**
