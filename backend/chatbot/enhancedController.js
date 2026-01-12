/**
 * Enhanced Chatbot Controller with Model Routing
 * Routes weather queries to Gemini and itinerary queries to Groq
 */

const conversationOrchestrator = require('./conversationOrchestrator');
const contextManager = require('./contextManager');
const geminiService = require('./geminiService');
const itineraryGenerator = require('../services/itineraryGenerator');
const { logger } = require('../middleware/logger');

class EnhancedChatbotController {
  constructor() {
    this.contextManager = contextManager;
    this.orchestrator = conversationOrchestrator;
    this.geminiService = geminiService;
    this.itineraryGenerator = itineraryGenerator;
    logger.info('✓ Enhanced Chatbot Controller initialized with dual-model routing');
  }

  /**
   * Main entry point with intelligent model routing
   * @param {Object} params
   * @param {string} params.userId - User identifier
   * @param {string} params.message - User's message
   * @param {string} params.mode - Chat mode: 'weather' or 'itinerary'
   * @param {Object} params.metadata - Additional context
   * @returns {Object} Structured response
   */
  async processMessage({ userId, message, mode, metadata = {} }) {
    try {
      logger.info(`[Enhanced Controller] Processing ${mode} message from user ${userId}`);

      // Route based on mode
      if (mode === 'weather') {
        return await this.handleWeatherQuery({ userId, message, metadata });
      } else if (mode === 'itinerary') {
        return await this.handleItineraryQuery({ userId, message, metadata });
      } else {
        // Fallback to orchestrator for backward compatibility
        return await this.orchestrator.orchestrate({ userId, message, metadata });
      }

    } catch (error) {
      logger.error('[Enhanced Controller] Error processing message:', error);
      return this.createErrorResponse('Sorry, I encountered an error. Please try again.');
    }
  }

  /**
   * Handle weather queries using Gemini AI
   */
  async handleWeatherQuery({ userId, message, metadata }) {
    try {
      logger.info('[Weather Mode] Processing with Gemini AI');

      // Extract location from message
      const location = this.extractLocation(message) || metadata.destination;

      if (!location) {
        return {
          success: true,
          message: "I'd be happy to help with weather information! Please specify a location. For example: 'What's the weather in Paris?' or 'Weather forecast for Tokyo'",
          data: {},
          suggestions: [
            "What's the weather in Paris?",
            "Will it rain in London this week?",
            "Temperature in New York today"
          ]
        };
      }

      // Get weather data using the orchestrator (which has WeatherStack integration)
      const weatherResponse = await this.orchestrator.orchestrate({
        userId,
        message,
        metadata: { ...metadata, destination: location, forceWeather: true }
      });

      // If we got weather data, enhance it with Gemini analysis
      if (weatherResponse.success && weatherResponse.response.data.weather) {
        const weatherData = weatherResponse.response.data.weather;
        
        // Use Gemini to provide intelligent weather insights
        const geminiAnalysis = await this.geminiService.analyzeWeatherForTravel({
          location,
          weatherData,
          userQuery: message
        });

        return {
          success: true,
          message: geminiAnalysis.text || weatherResponse.response.text,
          data: {
            weather: weatherData,
            analysis: geminiAnalysis.data || {}
          },
          suggestions: geminiAnalysis.suggestions || weatherResponse.response.suggestions
        };
      }

      return weatherResponse;

    } catch (error) {
      logger.error('[Weather Mode] Error:', error);
      return this.createErrorResponse('Unable to fetch weather information. Please try again.');
    }
  }

  /**
   * Handle itinerary queries using Groq AI
   */
  async handleItineraryQuery({ userId, message, metadata }) {
    try {
      logger.info('[Itinerary Mode] Processing with Groq AI');
      logger.info('[Itinerary Mode] Metadata received:', metadata);

      // Check if this is a card-based flow request (has days, travelers, budget directly)
      if (metadata.destination && metadata.days && metadata.budget) {
        logger.info('[Itinerary Mode] Card-based flow detected, generating directly');
        
        // Map budget string to actual amount
        const budgetMap = {
          'budget': 25000,
          'moderate': 50000,
          'premium': 100000,
          'luxury': 200000
        };
        
        const totalBudget = budgetMap[metadata.budget] || 50000;
        const travelers = metadata.travelers || 2;
        const days = metadata.days || 5;
        
        // Calculate dates starting from tomorrow
        const startDate = new Date();
        startDate.setDate(startDate.getDate() + 1);
        const endDate = new Date(startDate);
        endDate.setDate(endDate.getDate() + days - 1);
        
        const formatDate = (d) => d.toISOString().split('T')[0];

        // Generate itinerary directly with Groq
        const itinerary = await this.itineraryGenerator.generate({
          destination: metadata.destination,
          startDate: formatDate(startDate),
          endDate: formatDate(endDate),
          interests: ['sightseeing', 'culture', 'food', 'local experiences'],
          totalBudget: totalBudget,
          memberCount: travelers,
          pace: 'moderate',
          creatorId: userId,
          circleId: null,
          memberPreferences: []
        });

        // Format the response
        const formattedItinerary = this.formatItineraryResponse(itinerary);

        return {
          success: true,
          message: formattedItinerary,
          data: {
            itinerary: itinerary,
            destination: metadata.destination,
            budget: {
              total: totalBudget,
              perDay: itinerary.budgetStatus?.perDayBudget || Math.round(totalBudget / days)
            }
          },
          suggestions: [
            "Show me day 1 details",
            "Suggest cheaper alternatives",
            "Add more activities"
          ]
        };
      }

      // Fallback to original extraction logic for text-based queries
      const travelParams = this.extractTravelParameters(message, metadata);

      // Check if we have enough information
      if (!travelParams.destination) {
        return {
          success: true,
          message: "I'd love to help plan your trip! Please tell me:\n\n1. 📍 Where do you want to go?\n2. 📅 When (dates)?\n3. 💰 What's your budget?\n4. 🎯 Any specific interests?",
          data: {},
          suggestions: [
            "Plan a 5-day trip to Paris",
            "Tokyo itinerary for $2000 budget",
            "Weekend getaway to Barcelona"
          ]
        };
      }

      // If we have basic info, ask for missing details
      const missingInfo = [];
      if (!travelParams.startDate) missingInfo.push('travel dates');
      if (!travelParams.totalBudget) missingInfo.push('budget');
      if (!travelParams.interests || travelParams.interests.length === 0) missingInfo.push('interests');

      if (missingInfo.length > 0) {
        const context = await this.contextManager.getContext(userId);
        await this.contextManager.updateContext(userId, {
          ...context,
          destination: travelParams.destination,
          travelDates: travelParams.startDate ? { start: travelParams.startDate, end: travelParams.endDate } : null,
          budget: travelParams.totalBudget || null,
          activities: travelParams.interests || []
        });

        return {
          success: true,
          message: `Great! I'll help you plan a trip to ${travelParams.destination}. To create the perfect itinerary, I need: ${missingInfo.join(', ')}. Please provide these details!`,
          data: { savedDestination: travelParams.destination },
          suggestions: [
            "5 days starting next Monday",
            "Budget is $1500 per person",
            "Interested in culture and food"
          ]
        };
      }

      // We have all required info - generate itinerary with Groq
      logger.info('[Itinerary Mode] Generating with Groq AI:', travelParams);

      const itinerary = await this.itineraryGenerator.generate({
        destination: travelParams.destination,
        startDate: travelParams.startDate,
        endDate: travelParams.endDate,
        interests: travelParams.interests,
        totalBudget: travelParams.totalBudget,
        memberCount: travelParams.memberCount || 1,
        pace: travelParams.pace || 'moderate',
        creatorId: userId,
        circleId: null, // Individual planning
        memberPreferences: []
      });

      // Format the response
      const formattedItinerary = this.formatItineraryResponse(itinerary);

      return {
        success: true,
        message: formattedItinerary,
        data: {
          itinerary: itinerary,
          destination: travelParams.destination,
          budget: {
            total: travelParams.totalBudget,
            perDay: itinerary.budgetStatus?.perDayBudget || 0
          }
        },
        suggestions: [
          "Show me day 1 details",
          "Suggest cheaper alternatives",
          "Add more activities"
        ]
      };

    } catch (error) {
      logger.error('[Itinerary Mode] Error:', error);
      return this.createErrorResponse('Unable to generate itinerary. Please try again with your travel details.');
    }
  }

  /**
   * Extract location from user message
   */
  extractLocation(message) {
    const lowerMessage = message.toLowerCase();
    
    // Simple patterns for location extraction
    const patterns = [
      /weather (?:in|for|at) ([\w\s]+?)(?:\?|$|this|today|tomorrow)/i,
      /(?:in|at|for) ([\w\s]+?) weather/i,
      /([\w\s]+?) weather/i,
      /forecast (?:for|in) ([\w\s]+?)(?:\?|$)/i
    ];

    for (const pattern of patterns) {
      const match = message.match(pattern);
      if (match && match[1]) {
        return match[1].trim();
      }
    }

    // Check for city names (basic list)
    const cities = ['paris', 'london', 'tokyo', 'new york', 'barcelona', 'rome', 'dubai', 'singapore', 'sydney'];
    for (const city of cities) {
      if (lowerMessage.includes(city)) {
        return city.charAt(0).toUpperCase() + city.slice(1);
      }
    }

    return null;
  }

  /**
   * Extract travel parameters from message
   */
  extractTravelParameters(message, metadata) {
    const params = {
      destination: metadata.destination || null,
      startDate: metadata.startDate || null,
      endDate: metadata.endDate || null,
      totalBudget: metadata.budget || null,
      interests: metadata.interests || [],
      memberCount: metadata.memberCount || 1,
      pace: metadata.pace || 'moderate'
    };

    const lowerMessage = message.toLowerCase();

    // Extract destination
    const destPatterns = [
      /trip to ([\w\s]+?)(?:\s|$|for|with)/i,
      /visit ([\w\s]+?)(?:\s|$|for|with)/i,
      /travel to ([\w\s]+?)(?:\s|$|for|with)/i,
      /in (paris|london|tokyo|new york|barcelona|rome|dubai|singapore|sydney|bali|thailand|india|goa)/i
    ];

    for (const pattern of destPatterns) {
      const match = message.match(pattern);
      if (match && match[1]) {
        params.destination = match[1].trim();
        break;
      }
    }

    // Extract budget
    const budgetMatch = message.match(/\$?([\d,]+)\s*(?:dollars|budget|usd)?/i);
    if (budgetMatch) {
      params.totalBudget = parseInt(budgetMatch[1].replace(/,/g, ''));
    }

    // Extract duration
    const durationMatch = message.match(/(\d+)\s*days?/i);
    if (durationMatch && !params.startDate) {
      const days = parseInt(durationMatch[1]);
      params.startDate = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // Default to next week
      params.endDate = new Date(params.startDate.getTime() + (days - 1) * 24 * 60 * 60 * 1000);
    }

    // Extract interests
    const interestKeywords = ['culture', 'food', 'adventure', 'relaxation', 'shopping', 'nightlife', 'nature', 'history', 'art'];
    interestKeywords.forEach(interest => {
      if (lowerMessage.includes(interest)) {
        params.interests.push(interest);
      }
    });

    return params;
  }

  /**
   * Format itinerary response for chat
   */
  formatItineraryResponse(itinerary) {
    let response = `🎉 Your ${itinerary.destination} Itinerary is Ready!\n\n`;
    response += `📅 Duration: ${itinerary.totalDays} days\n`;
    response += `💰 Budget: $${itinerary.budgetStatus?.totalBudget || 0} per person\n`;
    response += `📍 Destination: ${itinerary.destination}\n\n`;

    if (itinerary.plan && itinerary.plan.days) {
      response += `📋 Day-by-Day Plan:\n\n`;
      itinerary.plan.days.slice(0, 2).forEach((day, index) => {
        response += `Day ${index + 1}: ${day.theme || 'Exploration'}\n`;
        if (day.activities && day.activities.length > 0) {
          day.activities.slice(0, 3).forEach(activity => {
            response += `  • ${activity.name || activity.time}\n`;
          });
        }
        response += `\n`;
      });

      if (itinerary.plan.days.length > 2) {
        response += `... and ${itinerary.plan.days.length - 2} more days of amazing experiences!\n\n`;
      }
    }

    response += `✨ This itinerary was generated using Groq AI to optimize your travel experience within your budget.`;

    return response;
  }

  /**
   * Create error response
   */
  createErrorResponse(message) {
    return {
      success: false,
      message: message,
      data: {},
      suggestions: []
    };
  }

  /**
   * Clear conversation context
   */
  async clearContext(userId) {
    await this.contextManager.clearContext(userId);
    return {
      success: true,
      message: 'Conversation context cleared'
    };
  }
}

module.exports = new EnhancedChatbotController();
