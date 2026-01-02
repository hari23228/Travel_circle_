/**
 * Gemini AI Service
 * Integrates with Google Gemini API for intelligent trip planning and analysis
 */

const { GoogleGenerativeAI } = require('@google/generative-ai');
const { logger } = require('../middleware/logger');

class GeminiService {
  constructor() {
    this.apiKey = process.env.GEMINI_API_KEY;
    if (!this.apiKey) {
      logger.warn('GEMINI_API_KEY not set. Gemini features will be disabled.');
      this.enabled = false;
      return;
    }
    
    this.genAI = new GoogleGenerativeAI(this.apiKey);
    // Use gemini-2.5-flash-lite which has higher rate limits
    this.model = this.genAI.getGenerativeModel({ model: 'gemini-2.5-flash-lite' });
    this.modelName = 'gemini-2.5-flash-lite';
    this.enabled = true;
    logger.info(`✓ Gemini AI service initialized with model: gemini-2.5-flash-lite`);
  }

  titleCase(text) {
    return String(text || '')
      .trim()
      .split(/\s+/)
      .filter(Boolean)
      .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(' ');
  }

  normalizeDestination(rawDestination) {
    if (!rawDestination) return null;
    let cleaned = String(rawDestination)
      .replace(/[\n\r\t]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();

    cleaned = cleaned.replace(/[.,!?]+$/g, '').trim();

    // Strip common leading phrases (prevents "I want to go Goa" becoming the destination)
    cleaned = cleaned.replace(
      /^(?:i\s*(?:want|would\s+like)\s*(?:to\s+)?)?(?:go|going|travel|travelling|visit|visiting)\s*(?:to\s+)?/i,
      ''
    );

    cleaned = cleaned.replace(/[.,!?]+$/g, '').trim();
    if (!cleaned) return null;

    // If it still looks like a sentence, take the last 1-3 words.
    const lower = cleaned.toLowerCase();
    const suspicious = ['want', 'would', 'like', 'going', 'travel', 'visit', 'planning'];
    if (suspicious.some(t => lower.includes(` ${t} `)) || cleaned.split(' ').length > 4) {
      const parts = cleaned.split(' ').filter(Boolean);
      cleaned = parts.slice(-3).join(' ');
    }

    return this.titleCase(cleaned);
  }

  extractDestinationFromMessage(message) {
    const text = String(message || '').trim();
    if (!text) return null;

    // Special case: "I want to goa" (user typed destination attached to verb)
    // Match patterns like "want to goa", "go to paris", "going goa", etc.
    const attachedPattern = text.match(/(?:want(?:\s+to)?|go(?:ing)?(?:\s+to)?|visit(?:ing)?(?:\s+to)?|travel(?:ling?)?(?:\s+to)?)\s*([a-zA-Z][a-zA-Z\s]{1,30})$/i);
    if (attachedPattern?.[1]) {
      const candidate = attachedPattern[1].trim();
      // Avoid extracting common words
      if (!/^(to|the|a|an|there|here|now|soon|today|tomorrow)$/i.test(candidate)) {
        return this.normalizeDestination(candidate);
      }
    }

    // Destination at end: "... to Goa"
    const tail = text.match(/\bto\s+([a-zA-Z][a-zA-Z\s]{1,30})$/i);
    if (tail?.[1]) {
      const candidate = tail[1].trim();
      if (!/^(the|a|an|there|here)$/i.test(candidate)) {
        return this.normalizeDestination(candidate);
      }
    }

    // If it's short and doesn't look like a sentence, treat as destination.
    const looksSentencey = /\b(i|want|would|like|go|going|visit|travel|planning)\b/i.test(text);
    const wordCount = text.split(/\s+/).filter(Boolean).length;
    if (!looksSentencey && wordCount <= 4) {
      return this.normalizeDestination(text);
    }

    return null;
  }

  extractActivitiesFromMessage(message) {
    const text = String(message || '').trim();
    if (!text) return [];

    const lower = text.toLowerCase();
    if (/weather|temperature|forecast|rain/i.test(lower)) return [];

    // Common UI quick picks
    const known = ['sightseeing', 'beach activities', 'museums and cafes'];
    const direct = known.find(k => lower === k);
    if (direct) return [this.titleCase(direct)];

    const parts = text
      .split(/,|\band\b|\&|\+|\//i)
      .map(p => p.trim())
      .filter(Boolean);

    const activities = (parts.length ? parts : [text])
      .filter(p => p.length >= 3)
      .map(p => this.titleCase(p));

    return Array.from(new Set(activities)).slice(0, 5);
  }

  /**
   * Analyze user intent and determine what information/actions are needed
   * @param {Object} params
   * @param {string} params.message - User's message
   * @param {Object} params.context - Current conversation context
   * @returns {Object} Intent analysis with extracted info and requirements
   */
  async analyzeUserIntent({ message, context }) {
    if (!this.enabled) {
      return this.getFallbackIntent(message, context);
    }

    try {
      const prompt = this.buildIntentAnalysisPrompt(message, context);
      
      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();
      
      logger.info(`[Gemini] Intent analysis response: ${text}`);
      
      return this.parseIntentResponse(text, message, context);
      
    } catch (error) {
      logger.error('Gemini API error in intent analysis:', error);
      return this.getFallbackIntent(message, context);
    }
  }

  /**
   * Generate final conversational response based on intent and available data
   * @param {Object} params
   * @param {string} params.message - User's message
   * @param {Object} params.context - Conversation context
   * @param {Object} params.weatherData - Weather data (if fetched)
   * @param {Object} params.intentAnalysis - Intent analysis results
   * @returns {Object} Complete chatbot response
   */
  async generateResponse({ message, context, weatherData, intentAnalysis }) {
    if (!this.enabled) {
      return this.getFallbackResponse({ message, context, weatherData });
    }

    try {
      const prompt = this.buildResponsePrompt(message, context, weatherData, intentAnalysis);
      
      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();
      
      logger.info(`[Gemini] Generated response length: ${text.length} chars`);
      
      return {
        success: true,
        response: {
          text: text.trim(),
          data: weatherData || {},
          suggestions: this.extractSuggestions(text),
          actions: []
        },
        context: context,
        timestamp: new Date().toISOString()
      };
      
    } catch (error) {
      logger.error('Gemini API error in response generation:', error);
      return this.getFallbackResponse({ message, context, weatherData });
    }
  }

  /**
   * Analyze weather data and provide intelligent recommendations
   * @param {Object} params
   * @param {Object} params.weatherData - Weather data from WeatherStack
   * @param {Object} params.userContext - User's trip context (destination, dates, activities)
   * @returns {Object} AI-generated insights and recommendations
   */
  async analyzeWeatherForTrip({ weatherData, userContext }) {
    if (!this.enabled) {
      return this.getFallbackAnalysis(weatherData, userContext);
    }

    try {
      const prompt = this.buildWeatherAnalysisPrompt(weatherData, userContext);
      
      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();
      
      // Parse AI response into structured data
      return this.parseWeatherAnalysis(text, weatherData, userContext);
      
    } catch (error) {
      logger.error('Gemini API error:', error);
      return this.getFallbackAnalysis(weatherData, userContext);
    }
  }

  /**
   * Collect missing trip information from user
   * @param {Object} params
   * @param {string} params.message - User's message
   * @param {Object} params.context - Current conversation context
   * @returns {Object} Response with questions to collect information
   */
  async collectTripInformation({ message, context }) {
    if (!this.enabled) {
      logger.warn('[Gemini] Service disabled, using fallback');
      return this.getFallbackQuestions(context, message);
    }

    try {
      const prompt = this.buildInformationCollectionPrompt(message, context);
      logger.info('[Gemini] Sending prompt for information collection');
      logger.info(`[Gemini] User message: ${message}`);
      
      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();
      
      logger.info(`[Gemini] Raw response: ${text}`);
      
      const parsed = this.parseInformationResponse(text, context, message);
      logger.info(`[Gemini] Parsed response: ${JSON.stringify(parsed, null, 2)}`);
      
      return parsed;
      
    } catch (error) {
      logger.error('Gemini API error:', error);
      return this.getFallbackQuestions(context, message);
    }
  }

  /**
   * Generate conversational response with activity recommendations
   * @param {Object} analysisData - Complete analysis including weather and activities
   * @returns {Object} Natural language response
   */
  async generateConversationalResponse(analysisData) {
    if (!this.enabled) {
      return this.getFallbackResponse(analysisData);
    }

    try {
      const prompt = this.buildConversationalPrompt(analysisData);
      
      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();
      
      return {
        text: text.trim(),
        tone: 'friendly',
        isAiGenerated: true
      };
      
    } catch (error) {
      logger.error('Gemini API error:', error);
      return this.getFallbackResponse(analysisData);
    }
  }

  /**
   * Build prompt for intent analysis
   */
  buildIntentAnalysisPrompt(message, context) {
    const currentYear = new Date().getFullYear();
    const currentMonth = new Date().getMonth();
    return `You are a flexible, intelligent travel planning assistant. You can answer questions at ANY point in the conversation - you don't need complete trip details to be helpful.

**User's Message:** "${message}"

**Current Context:**
- Destination: ${context.destination || 'Not provided'}
- Travel Dates: ${context.travelDates?.start ? `${context.travelDates.start} to ${context.travelDates.end}` : 'Not provided'}
- Activities: ${context.activities?.length > 0 ? context.activities.join(', ') : 'Not provided'}
- Conversation History: ${context.conversationHistory?.slice(-3).map(h => h.role + ': ' + h.message).join(' | ') || 'None'}
- Current Date: ${new Date().toISOString().split('T')[0]}

**Your Task:**
1. FIRST: Determine if this is a QUESTION (weather, activities, best time, recommendations) or INFO (providing destination/dates/activities)
2. If it's a QUESTION: Extract what you can from the message itself (e.g., "How's the weather in Goa?" → extract "Goa" even if context.destination is empty)
3. If it's INFO: Extract travel details (destination, dates, activities)
4. Determine if weather data would help answer their question
5. Be flexible - don't force a linear flow

**Date Extraction Rules:**
- If user says just a month (e.g., "march", "april"): Do NOT create dates, instead mark needsMoreDateInfo: true
- If user provides specific dates or date range, extract them in YYYY-MM-DD format
- Assume current year (${currentYear}) unless specified otherwise
- If month is earlier than current month (${currentMonth + 1}), assume next year
- Handle formats like: "April 10 - 20", "April 10-20", "April 10 to 20", "10-20 April"
- For same-month ranges (e.g., "April 10 - 20"), use the month for both start and end dates

**Respond in JSON format:**
{
  "intent": "greeting|provide_info|ask_weather|ask_activity|ask_general|other",
  "extractedInfo": {
    "destination": "city name or null",
    "travelDates": {"start": "YYYY-MM-DD", "end": "YYYY-MM-DD"} or null,
    "activities": ["activity1", "activity2"] or null,
    "partialDateInfo": "month name if only month mentioned, else null"
  },
  "needsWeather": true|false,
  "needsMoreDateInfo": true|false,
  "responseType": "conversational|detailed_weather|quick_answer|ask_for_info"
}

**Examples:**
- "Goa" → {"intent": "provide_info", "extractedInfo": {"destination": "Goa"}, "needsWeather": false, "needsMoreDateInfo": false, "responseType": "ask_for_info"}
- "march" → {"intent": "provide_info", "extractedInfo": {"partialDateInfo": "march"}, "needsWeather": false, "needsMoreDateInfo": true, "responseType": "ask_for_info"}
- "March 15-20" → {"intent": "provide_info", "extractedInfo": {"travelDates": {"start": "${currentYear}-03-15", "end": "${currentYear}-03-20"}}, "needsWeather": false, "needsMoreDateInfo": false, "responseType": "ask_for_info"}
- "April 10 - 20" → {"intent": "provide_info", "extractedInfo": {"travelDates": {"start": "${currentYear}-04-10", "end": "${currentYear}-04-20"}}, "needsWeather": false, "needsMoreDateInfo": false, "responseType": "ask_for_info"}
- "April 10 to April 15" → {"intent": "provide_info", "extractedInfo": {"travelDates": {"start": "${currentYear}-04-10", "end": "${currentYear}-04-15"}}, "needsWeather": false, "needsMoreDateInfo": false, "responseType": "ask_for_info"}
- "What's the weather like?" → {"intent": "ask_weather", "extractedInfo": {}, "needsWeather": true, "needsMoreDateInfo": false, "responseType": "detailed_weather"}
- "Hi" → {"intent": "greeting", "extractedInfo": {}, "needsWeather": false, "needsMoreDateInfo": false, "responseType": "conversational"}`;
  }

  /**
   * Build prompt for response generation
   */
  buildResponsePrompt(message, context, weatherData, intentAnalysis) {
    const hasDestination = !!context.destination;
    const hasDates = !!(context.travelDates?.start && context.travelDates?.end);
    const hasActivities = context.activities && context.activities.length > 0;
    const hasAllInfo = hasDestination && hasDates && hasActivities;
    const hasPartialDateInfo = intentAnalysis.extractedInfo?.partialDateInfo;

    let prompt = `You are a friendly, knowledgeable travel planning assistant. Generate a natural, helpful response.

**User's Message:** "${message}"

**What You Know:**
- Destination: ${context.destination || 'Not mentioned yet'}
- Travel Dates: ${hasDates ? `${context.travelDates.start} to ${context.travelDates.end}` : (hasPartialDateInfo ? `Partial: ${hasPartialDateInfo}` : 'Not mentioned yet')}
- Activities: ${hasActivities ? context.activities.join(', ') : 'Not mentioned yet'}

**Intent:** ${intentAnalysis.intent || 'general'}
**Needs More Date Info:** ${intentAnalysis.needsMoreDateInfo || false}
`;

    if (weatherData && !weatherData.error) {
      prompt += `
**Current Weather Data for ${context.destination}:**
- Temperature: ${weatherData.currentWeather.temperature.current}°C (Feels like ${weatherData.currentWeather.temperature.feelsLike}°C)
- Conditions: ${weatherData.currentWeather.conditions.description}
- Humidity: ${weatherData.currentWeather.details.humidity}%
- Wind: ${weatherData.currentWeather.details.windSpeed} m/s
- Rain: ${weatherData.currentWeather.rain}mm

**5-Day Forecast:**
${weatherData.forecast.slice(0, 5).map((day, i) => `Day ${i + 1}: ${day.temperature.min}°C-${day.temperature.max}°C, ${day.conditions}, Rain: ${day.precipitationProbability}%`).join('\n')}
`;
    }

    prompt += `
**Instructions - BE FLEXIBLE AND HELPFUL:**
1. Answer the user's ACTUAL question first, even if you don't have complete trip details
2. If they're asking about weather/activities/best time: Answer based on what you know (from context OR from their message)
3. If you have weather data, provide specific, actionable insights
4. Only ask follow-up questions if absolutely needed for their request
5. Don't force a linear "destination→dates→activities" flow - be conversational
6. Use emojis sparingly and naturally
7. Keep responses helpful and concise (150-300 words for questions, longer for complete trip plans)

**Response Guidelines:**
- **Weather Question** ("How's the weather in Goa?"): Answer immediately with weather data, don't ask for dates first
- **Best Time Question** ("When should I visit?"): Provide recommendations, mention you can give more specific advice if they share dates
- **Activity Question** ("What can I do there?"): Suggest activities, optionally ask what they're interested in
- **New Info** (destination/dates/activities): Acknowledge warmly, maybe share a quick insight, ask ONE follow-up if helpful
- **Greeting**: Welcome warmly, ask how you can help with their travel plans
- **Complete Info**: Provide comprehensive weather-based trip planning

**IMPORTANT:** 
- Answer questions FIRST before collecting more info
- If they mention a destination in their question ("weather in Paris"), use that for weather lookup even if context.destination is different
- Be genuinely helpful, not a rigid form

Generate your response (plain text, conversational tone):`;

    return prompt;
  }

  /**
   * Build prompt for weather analysis
   */
  buildWeatherAnalysisPrompt(weatherData, userContext) {
    const { currentWeather, forecast } = weatherData;
    const { destination, activities, travelDates } = userContext;

    return `You are a travel planning assistant. Analyze the weather data and provide intelligent recommendations.

**Destination:** ${destination}
**Travel Dates:** ${travelDates?.start || 'Not specified'} to ${travelDates?.end || 'Not specified'}
**Planned Activities:** ${activities?.length > 0 ? activities.join(', ') : 'None specified'}

**Current Weather:**
- Temperature: ${currentWeather.temperature.current}°C (Feels like ${currentWeather.temperature.feelsLike}°C)
- Conditions: ${currentWeather.conditions.description}
- Humidity: ${currentWeather.details.humidity}%
- Wind Speed: ${currentWeather.details.windSpeed} m/s
- Rain: ${currentWeather.rain}mm

**Forecast Summary (Next 5 Days):**
${forecast.slice(0, 5).map((day, i) => `
Day ${i + 1} (${day.dateString}):
- Temp: ${day.temperature.min}°C - ${day.temperature.max}°C
- Conditions: ${day.conditions}
- Rain Probability: ${day.precipitationProbability}%
- Suitability: ${day.isSuitable}
`).join('\n')}

**Analysis Required:**
1. Identify any weather-related conflicts with planned activities
2. Recommend best days/times for each activity
3. Suggest alternative activities if weather conflicts exist
4. Provide packing recommendations
5. Give overall trip feasibility assessment

Respond in JSON format:
{
  "conflicts": [{"activity": "...", "issue": "...", "severity": "high|medium|low"}],
  "recommendations": [{"activity": "...", "bestTime": "...", "reason": "..."}],
  "alternatives": [{"original": "...", "suggested": "...", "reason": "..."}],
  "packingList": ["item1", "item2", ...],
  "overallAssessment": "...",
  "confidence": 0.0-1.0
}`;
  }

  /**
   * Build prompt for information collection
   */
  buildInformationCollectionPrompt(message, context) {
    const missing = [];
    if (!context.destination) missing.push('destination');
    if (!context.travelDates?.start) missing.push('travel dates');
    if (!context.activities || context.activities.length === 0) missing.push('planned activities');

    // Determine what to ask for next (one thing at a time)
    let whatToAskFor = '';
    let example = '';
    
    if (!context.destination) {
      whatToAskFor = 'destination (city and country)';
      example = 'e.g., "Paris, France" or "Tokyo, Japan"';
    } else if (!context.travelDates?.start) {
      whatToAskFor = 'travel dates (start and end dates)';
      example = 'e.g., "from April 10 to April 15" or "March 15-22"';
    } else if (!context.activities || context.activities.length === 0) {
      whatToAskFor = 'planned activities';
      example = 'e.g., "sightseeing, museums, hiking" or "beach activities and water sports"';
    }

    return `You are a friendly, conversational travel assistant. Your job is to collect trip information ONE STEP AT A TIME.

**User's Message:** "${message}"

**Current Context:**
- Destination: ${context.destination || 'Not provided yet'}
- Travel Dates: ${context.travelDates?.start ? `${context.travelDates.start} to ${context.travelDates.end}` : 'Not provided yet'}
- Activities: ${context.activities?.length > 0 ? context.activities.join(', ') : 'Not provided yet'}

**What You Should Collect Next:** ${whatToAskFor}
**Example Format:** ${example}

**Instructions:**
1. Analyze the user's message and extract ONLY the information relevant to the current step
2. If the user provided the information you need, acknowledge it warmly and ask for the NEXT piece of information
3. If they didn't provide what you need, politely ask for it again with helpful examples
4. Keep responses conversational, friendly, and encouraging
5. DO NOT skip ahead - collect information in order: destination → dates → activities

Respond in JSON format:
{
  "extractedData": {
    "destination": "city, country or null",
    "travelDates": {"start": "YYYY-MM-DD", "end": "YYYY-MM-DD"} or null,
    "activities": ["activity1", "activity2"] or null
  },
  "questionToAsk": "Your friendly follow-up question (be specific and helpful)",
  "hasAllInfo": true|false,
  "acknowledgment": "Brief acknowledgment of what they just told you (if anything)"
}

Example Responses:
- If they said "Paris": {"extractedData": {"destination": "Paris, France"}, "questionToAsk": "Excellent choice! Paris is beautiful. When are you planning to visit? Please provide your travel dates.", "hasAllInfo": false, "acknowledgment": "Great! You want to visit Paris."}
- If they said "April 10-15": {"extractedData": {"travelDates": {"start": "2026-04-10", "end": "2026-04-15"}}, "questionToAsk": "Perfect! April 10-15 it is. Now, what activities are you planning to do during your trip?", "hasAllInfo": false, "acknowledgment": "Got it - you'll be traveling from April 10 to April 15."}`;
  }

  /**
   * Build prompt for conversational response
   */
  buildConversationalPrompt(analysisData) {
    return `You are a friendly, knowledgeable travel assistant. Generate a natural, conversational response based on this analysis:

**Analysis Data:**
${JSON.stringify(analysisData, null, 2)}

**Requirements:**
- Be warm, enthusiastic, and encouraging
- Start with a brief overview and excitement about their trip
- Organize information clearly with sections (use **bold** for headers)
- Provide detailed insights for each aspect:
  • Current weather conditions
  • Day-by-day forecast highlights
  • Activity-specific recommendations with best times
  • Any weather conflicts or concerns
  • Alternative suggestions if needed
  • Complete packing list tailored to their trip
  • Overall trip assessment and confidence level
- Use emojis appropriately to enhance readability
- Make it comprehensive (400-600 words) - this is important travel planning information
- Be specific with temperatures, dates, and conditions
- End with encouragement and offer to help with more details

Generate a natural, detailed conversation response (plain text, not JSON):`;
  }

  /**
   * Parse weather analysis response from Gemini
   */
  parseWeatherAnalysis(text, weatherData, userContext) {
    try {
      // Extract JSON from response (Gemini might wrap it in markdown)
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        return {
          ...parsed,
          rawResponse: text,
          isAiGenerated: true
        };
      }
    } catch (error) {
      logger.warn('Failed to parse Gemini JSON response, using fallback');
    }
    
    return this.getFallbackAnalysis(weatherData, userContext);
  }

  /**
   * Parse information collection response
   */
  parseInformationResponse(text, context, message = '') {
    try {
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        logger.info(`[Gemini] Extracted JSON: ${jsonMatch[0]}`);
        const parsed = JSON.parse(jsonMatch[0]);
        logger.info(`[Gemini] Successfully parsed JSON`);
        return parsed;
      } else {
        logger.warn('[Gemini] No JSON found in response');
      }
    } catch (error) {
      logger.warn('[Gemini] Failed to parse Gemini information response:', error.message);
      logger.warn(`[Gemini] Raw text: ${text}`);
    }
    
    logger.info('[Gemini] Using fallback questions');
    return this.getFallbackQuestions(context, message);
  }

  /**
   * Fallback analysis when Gemini is unavailable
   */
  getFallbackAnalysis(weatherData, userContext) {
    const { currentWeather, forecast } = weatherData;
    const { activities = [] } = userContext;

    // Basic rule-based analysis
    const conflicts = activities
      .filter(activity => {
        const isOutdoor = ['hiking', 'beach', 'sightseeing', 'cycling'].includes(activity.toLowerCase());
        return isOutdoor && (currentWeather.rain > 5 || currentWeather.conditions.main.includes('Rain'));
      })
      .map(activity => ({
        activity,
        issue: 'High chance of rain',
        severity: 'medium'
      }));

    const packingList = this.generateBasicPackingList(currentWeather, forecast);

    return {
      conflicts,
      recommendations: [],
      alternatives: [],
      packingList,
      overallAssessment: conflicts.length > 0 
        ? 'Some weather challenges expected. Review alternatives.' 
        : 'Weather conditions are generally favorable.',
      confidence: 0.7,
      isAiGenerated: false
    };
  }

  /**
   * Fallback questions when Gemini is unavailable
   * This also attempts basic extraction from user message
   */
  getFallbackQuestions(context, message = '') {
    const lowerMessage = message.toLowerCase();
    
    // Basic destination extraction patterns
    if (!context.destination && message) {
      const extractedDestination = this.extractDestinationFromMessage(message);
      if (extractedDestination) {
        logger.info(`[Gemini Fallback] Extracted destination: ${extractedDestination}`);
        return {
          extractedData: { destination: extractedDestination },
          questionToAsk: `Great! You want to visit ${extractedDestination}. When are you planning to travel? (Please provide start and end dates)`,
          hasAllInfo: false,
          acknowledgment: `Perfect! ${extractedDestination} it is.`,
          nextStep: 'collect_dates'
        };
      }
    }
    
    // Check for date/month responses when waiting for dates
    if (context.destination && !context.travelDates?.start && message) {
      // FIRST: Try to extract date ranges (check for specific dates before just month)
      const monthMap = {
        'january': '01', 'jan': '01',
        'february': '02', 'feb': '02',
        'march': '03', 'mar': '03',
        'april': '04', 'apr': '04',
        'may': '05',
        'june': '06', 'jun': '06',
        'july': '07', 'jul': '07',
        'august': '08', 'aug': '08',
        'september': '09', 'sep': '09', 'sept': '09',
        'october': '10', 'oct': '10',
        'november': '11', 'nov': '11',
        'december': '12', 'dec': '12'
      };
      
      const datePatterns = [
        /(\w+)\s+(\d{1,2})\s*-\s*(\d{1,2})/i, // "March 15-20" or "April 10 - 20"
        /(\w+)\s+(\d{1,2})\s+to\s+(\d{1,2})/i, // "March 15 to 20"
        /(\w+)\s+(\d{1,2})\s+to\s+(\w+)\s+(\d{1,2})/i, // "March 15 to April 20"
        /(\d{1,2})\s*-\s*(\d{1,2})\s+(\w+)/i, // "15-20 March"
      ];
      
      for (const pattern of datePatterns) {
        const match = message.match(pattern);
        if (match) {
          const currentYear = new Date().getFullYear();
          let startDate, endDate;
          
          // Pattern 1 & 2: "April 10 - 20" or "April 10 to 20"
          if (match[1] && match[2] && match[3] && !match[4]) {
            const monthName = match[1].toLowerCase();
            const monthNum = monthMap[monthName];
            if (monthNum) {
              const startDay = match[2].padStart(2, '0');
              const endDay = match[3].padStart(2, '0');
              startDate = `${currentYear}-${monthNum}-${startDay}`;
              endDate = `${currentYear}-${monthNum}-${endDay}`;
              
              logger.info(`[Gemini Fallback] Extracted dates: ${startDate} to ${endDate}`);
              
              return {
                extractedData: {
                  travelDates: {
                    start: startDate,
                    end: endDate
                  }
                },
                questionToAsk: `Perfect! You'll be traveling from ${match[1]} ${match[2]} to ${match[1]} ${match[3]}. What activities are you planning to do during your trip?`,
                hasAllInfo: false,
                acknowledgment: `Got it! ${match[1]} ${match[2]}-${match[3]}, ${currentYear}.`,
                nextStep: 'collect_activities'
              };
            }
          }
          
          // If we couldn't parse it properly, ask for confirmation
          logger.info(`[Gemini Fallback] Potential date match found but couldn't parse: ${match[0]}`);
          
          return {
            extractedData: {},
            questionToAsk: `I see you mentioned dates. To make sure I have it right, could you confirm the exact dates in a format like "March 15 to March 20" or "April 10-20"?`,
            hasAllInfo: false,
            acknowledgment: null,
            nextStep: 'collect_dates'
          };
        }
      }
      
      // SECOND: If no date pattern matched, check if user just mentioned a month
      const monthNames = ['january', 'february', 'march', 'april', 'may', 'june', 
                          'july', 'august', 'september', 'october', 'november', 'december'];
      
      const monthMatch = monthNames.find(month => lowerMessage.includes(month));
      if (monthMatch) {
        const monthCapitalized = monthMatch.charAt(0).toUpperCase() + monthMatch.slice(1);
        return {
          extractedData: { partialDateInfo: monthCapitalized },
          questionToAsk: `Great! You're thinking of ${monthCapitalized}. Could you provide specific dates? For example, \"${monthCapitalized} 15-20\" or \"${monthCapitalized} 10 to ${monthCapitalized} 15\"?`,
          hasAllInfo: false,
          acknowledgment: `Perfect! ${monthCapitalized} is a good time to travel.`,
          nextStep: 'collect_dates'
        };
      }
    }
    
    // No extraction successful - ask for destination
    if (!context.destination) {
      return {
        extractedData: {},
        questionToAsk: 'Where are you planning to travel? (Please provide a city or destination)',
        hasAllInfo: false,
        acknowledgment: null,
        nextStep: 'collect_destination'
      };
    }
    
    if (!context.travelDates?.start) {
      return {
        extractedData: {},
        questionToAsk: 'When are you planning to visit? (Please provide your travel dates, e.g., "April 10 to 15")',
        hasAllInfo: false,
        acknowledgment: null,
        nextStep: 'collect_dates'
      };
    }
    
    if (!context.activities || context.activities.length === 0) {
      const extractedActivities = this.extractActivitiesFromMessage(message);
      if (extractedActivities.length > 0) {
        return {
          extractedData: { activities: extractedActivities },
          questionToAsk: 'Great! Want a quick weather summary and best-day recommendations for those activities?',
          hasAllInfo: false,
          acknowledgment: `Noted: ${extractedActivities.join(', ')}.`,
          nextStep: 'analyze'
        };
      }
      return {
        extractedData: {},
        questionToAsk: 'What activities are you planning to do? (e.g., sightseeing, beach activities, hiking)',
        hasAllInfo: false,
        acknowledgment: null,
        nextStep: 'collect_activities'
      };
    }
    
    return {
      extractedData: context,
      questionToAsk: null,
      hasAllInfo: true,
      acknowledgment: null,
      nextStep: 'analyze'
    };
  }

  /**
   * Fallback response generator when Gemini is unavailable
   */
  getFallbackResponse(params) {
    // Handle both old signature (analysisData) and new signature ({ message, context, weatherData })
    const message = params.message || '';
    const context = params.context || params;
    const weatherData = params.weatherData || { currentWeather: params.currentWeather };
    
    const hasDestination = !!context.destination;
    const hasDates = !!(context.travelDates?.start && context.travelDates?.end);
    const hasActivities = context.activities && context.activities.length > 0;
    
    let responseText = '';
    
    // Greeting
    if (/^(hi|hello|hey)/i.test(message)) {
      responseText = `Hi there! 👋 I'm your travel planning assistant. I can help you plan your trip with real-time weather insights and personalized recommendations.\n\nWhere would you like to travel?`;
    }
    // Just got destination
    else if (hasDestination && !hasDates) {
      responseText = `Great choice! ${context.destination} `;
      if (weatherData && weatherData.currentWeather && !weatherData.error) {
        responseText += `is currently ${weatherData.currentWeather.temperature.current}°C with ${weatherData.currentWeather.conditions.description}. `;
      }
      responseText += `\n\nWhen are you planning to visit? Please provide your travel dates.`;
    }
    // Has destination and dates
    else if (hasDestination && hasDates && !hasActivities) {
      responseText = `Perfect! You're visiting ${context.destination} from ${context.travelDates.start} to ${context.travelDates.end}.\n\nWhat activities are you planning to do during your trip?`;
    }
    // Has everything but weather may or may not be available
    else if (hasDestination && hasDates && hasActivities) {
      responseText = `Awesome — you're visiting ${context.destination} from ${context.travelDates.start} to ${context.travelDates.end} and you’re planning: ${context.activities.join(', ')}. `;
      if (weatherData && weatherData.currentWeather && !weatherData.error) {
        responseText += `\n\nRight now it’s ${weatherData.currentWeather.temperature.current}°C with ${weatherData.currentWeather.conditions.description}. `;
        responseText += `Want a day-by-day suggestion for the best time to do each activity?`;
      } else {
        responseText += `\n\nI can generate a trip plan now, and if you enable WeatherStack (or try again later), I can also add real-time weather-based recommendations.`;
      }
    }
    // Has everything - old format compatibility
    else if (context.destination && weatherData.currentWeather) {
      responseText = `Based on current weather conditions in ${context.destination}, the temperature is ${weatherData.currentWeather.temperature.current}°C with ${weatherData.currentWeather.conditions.description}. I've analyzed your planned activities and prepared recommendations for you.`;
    }
    // Default
    else {
      responseText = `I'm here to help you plan your trip! To get started, please tell me where you'd like to travel.`;
    }
    
    // Return format depends on signature
    if (params.message !== undefined) {
      return {
        success: true,
        response: {
          text: responseText,
          data: weatherData || {},
          suggestions: this.extractSuggestions(responseText),
          actions: []
        },
        context: context,
        timestamp: new Date().toISOString()
      };
    } else {
      // Old signature return format
      return {
        text: responseText,
        tone: 'informative',
        isAiGenerated: false
      };
    }
  }

  /**
   * Parse intent analysis response
   */
  parseIntentResponse(text, message, context) {
    try {
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);

        if (parsed?.extractedInfo?.destination) {
          const normalized = this.normalizeDestination(parsed.extractedInfo.destination);
          if (normalized) parsed.extractedInfo.destination = normalized;
          else delete parsed.extractedInfo.destination;
        }

        if (parsed?.extractedInfo?.activities && !Array.isArray(parsed.extractedInfo.activities)) {
          parsed.extractedInfo.activities = this.extractActivitiesFromMessage(parsed.extractedInfo.activities);
        }

        logger.info(`[Gemini] Parsed intent: ${parsed.intent}`);
        return parsed;
      }
    } catch (error) {
      logger.warn('[Gemini] Failed to parse intent response:', error.message);
    }
    
    return this.getFallbackIntent(message, context);
  }

  /**
   * Fallback intent analysis
   */
  getFallbackIntent(message, context) {
    const lowerMessage = message.toLowerCase();
    
    // Basic pattern matching
    if (/^(hi|hello|hey)/i.test(message)) {
      return {
        intent: 'greeting',
        extractedInfo: {},
        needsWeather: false,
        needsMoreDateInfo: false,
        responseType: 'conversational'
      };
    }
    
    // Try to extract destination (avoid capturing full sentences like "I want to go GOA")
    if (!context.destination) {
      const extractedDestination = this.extractDestinationFromMessage(message);
      if (extractedDestination) {
        return {
          intent: 'provide_info',
          extractedInfo: { destination: extractedDestination },
          needsWeather: true,
          needsMoreDateInfo: false,
          responseType: 'ask_for_info'
        };
      }
    }

    // If destination + dates are known but activities are missing, treat the message as activities input
    const hasDates = !!(context.travelDates?.start && context.travelDates?.end);
    const hasActivities = Array.isArray(context.activities) && context.activities.length > 0;
    if (context.destination && hasDates && !hasActivities && message && !/weather|temperature|rain|forecast/i.test(message)) {
      const activities = this.extractActivitiesFromMessage(message);
      if (activities.length > 0) {
        return {
          intent: 'provide_info',
          extractedInfo: { activities },
          needsWeather: true,
          needsMoreDateInfo: false,
          responseType: 'conversational'
        };
      }
    }
    
    // Check for date responses when waiting for dates
    if (context.destination && !context.travelDates?.start) {
      // FIRST: Try to extract date ranges
      const monthMap = {
        'january': '01', 'jan': '01',
        'february': '02', 'feb': '02',
        'march': '03', 'mar': '03',
        'april': '04', 'apr': '04',
        'may': '05',
        'june': '06', 'jun': '06',
        'july': '07', 'jul': '07',
        'august': '08', 'aug': '08',
        'september': '09', 'sep': '09', 'sept': '09',
        'october': '10', 'oct': '10',
        'november': '11', 'nov': '11',
        'december': '12', 'dec': '12'
      };
      
      const datePattern = /(\w+)\s+(\d{1,2})\s*-\s*(\d{1,2})/i; // "April 10 - 20"
      const match = message.match(datePattern);
      
      if (match) {
        const monthName = match[1].toLowerCase();
        const monthNum = monthMap[monthName];
        if (monthNum) {
          const currentYear = new Date().getFullYear();
          const startDay = match[2].padStart(2, '0');
          const endDay = match[3].padStart(2, '0');
          const startDate = `${currentYear}-${monthNum}-${startDay}`;
          const endDate = `${currentYear}-${monthNum}-${endDay}`;
          
          return {
            intent: 'provide_info',
            extractedInfo: { 
              travelDates: {
                start: startDate,
                end: endDate
              }
            },
            needsWeather: false,
            needsMoreDateInfo: false,
            responseType: 'ask_for_info'
          };
        }
      }
      
      // SECOND: Check for month-only response
      const monthNames = ['january', 'february', 'march', 'april', 'may', 'june', 
                          'july', 'august', 'september', 'october', 'november', 'december'];
      const monthMatch = monthNames.find(month => lowerMessage.includes(month));
      
      if (monthMatch) {
        const monthCapitalized = monthMatch.charAt(0).toUpperCase() + monthMatch.slice(1);
        return {
          intent: 'provide_info',
          extractedInfo: { partialDateInfo: monthCapitalized },
          needsWeather: false,
          needsMoreDateInfo: true,
          responseType: 'ask_for_info'
        };
      }
    }
    
    // Weather question
    if (/weather|temperature|rain|forecast/i.test(message)) {
      return {
        intent: 'ask_weather',
        extractedInfo: {},
        needsWeather: true,
        needsMoreDateInfo: false,
        responseType: 'detailed_weather'
      };
    }
    
    return {
      intent: 'other',
      extractedInfo: {},
      needsWeather: !!context.destination,
      needsMoreDateInfo: false,
      responseType: 'conversational'
    };
  }

  /**
   * Extract suggestions from response text
   */
  extractSuggestions(text) {
    // Look for common destination patterns in responses
    const suggestions = [];
    
    if (text.includes('destination') || text.includes('where')) {
      suggestions.push('Paris, France', 'Tokyo, Japan', 'New York, USA');
    }
    
    if (text.includes('dates') || text.includes('when')) {
      suggestions.push('Next week', 'March 15-20', 'This weekend');
    }
    
    if (text.includes('activities') || text.includes('do')) {
      suggestions.push('Sightseeing', 'Beach activities', 'Museums and cafes');
    }
    
    return suggestions.slice(0, 3);
  }

  /**
   * Generate basic packing list
   */
  generateBasicPackingList(currentWeather, forecast) {
    const items = ['Comfortable walking shoes', 'Phone charger', 'Travel documents'];
    
    if (currentWeather.temperature.current < 15) {
      items.push('Warm jacket', 'Long pants', 'Sweater');
    }
    if (currentWeather.temperature.current > 25) {
      items.push('Sunscreen', 'Sunglasses', 'Light clothing');
    }
    if (currentWeather.rain > 0 || currentWeather.details.humidity > 70) {
      items.push('Umbrella', 'Rain jacket', 'Waterproof bag');
    }
    
    return items;
  }
}

module.exports = new GeminiService();
