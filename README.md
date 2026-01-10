# Travel_circle_

## AI Configuration for Smart Itinerary Generation

The app supports multiple AI providers for itinerary generation. Choose the one that works best for you:

### 🚀 Groq API (Recommended - Fast & Free Tier Available)

Groq provides the fastest AI inference with Llama models, perfect for real-time itinerary generation.

**Setup:**
1. Go to [Groq Console](https://console.groq.com/)
2. Sign up for a free account
3. Create an API key
   - **TPM (Tokens Per Minute)**: Set to `14400` (free tier limit)
   - **RPM (Requests Per Minute)**: Set to `30` (free tier limit)
4. Add to `backend/.env`:
   ```env
   GROQ_API_KEY=your_groq_api_key_here
   ```

**Test your setup:**
```bash
cd backend
npm run test-groq
```

**Benefits:**
- ⚡ **2-4 second generation** (vs 5-8 seconds with Gemini)
- 💰 **Free tier available** - see pricing details below
- 🧠 **Llama 3.3 70B** model for high-quality responses

**Rate Limits Explained:**
- **TPM (14,400)**: Tokens per minute - enough for ~10-15 detailed itineraries
- **RPM (30)**: Requests per minute - handles normal user traffic
- **Free tier resets daily** - perfect for development and moderate usage

### 💰 Groq API Pricing

**Free Tier (Perfect for Development & Small Apps):**
- ✅ **$0/month** - completely free
- ✅ **14,400 TPM** (Tokens Per Minute)
- ✅ **30 RPM** (Requests Per Minute)
- ✅ **No credit card required**
- ✅ **Daily reset** of usage limits
- ✅ Access to Llama 3.3 70B model

**Paid Tiers (For Production/High Traffic):**
- **Starter**: $10/month - 100K tokens/day
- **Pro**: $25/month - 500K tokens/day
- **Enterprise**: Custom pricing for higher volumes

**Cost Estimate for Travel App:**
- 1 itinerary = ~1,500 tokens
- Free tier supports ~300 itineraries/day
- At $0.10/1K tokens: ~$0.15 per itinerary (if paid)

### 🤖 Google Gemini API (Alternative)

If you prefer Google's Gemini model:

**Setup:**
1. Go to [Google AI Studio](https://makersuite.google.com/app/apikey)
2. Create an API key
3. Add to `backend/.env`:
   ```env
   GEMINI_API_KEY=your_gemini_api_key_here
   ```

### 🔄 Automatic Fallback

The system automatically tries providers in this order:
1. **Groq** (if API key available)
2. **Gemini** (if API key available)
3. **Algorithmic generation** (always works, no API key needed)

### 🎯 Performance Comparison

| Provider | Generation Time | Cost | Quality |
|----------|----------------|------|---------|
| **Groq** | 2-4 seconds | Free | Excellent |
| **Gemini** | 5-8 seconds | Paid | Excellent |
| **Algorithmic** | <1 second | Free | Good |

### 🧪 Testing

Test your AI setup:
```bash
# Backend directory
npm run test-groq  # Test Groq API
```

The itinerary generator will automatically use the best available option!