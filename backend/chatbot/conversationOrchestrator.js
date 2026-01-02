/**
 * Conversation Flow Orchestrator
 * Manages the complete chatbot conversation flow:
 * 1. Collect user trip information
 * 2. Fetch weather data from WeatherStack
 * 3. Analyze with Gemini AI
 * 4. Generate intelligent response
 */

const weatherService = require('./features/weather/weatherService');
const geminiService = require('./geminiService');
const contextManager = require('./contextManager');
const { logger } = require('../middleware/logger');

class ConversationOrchestrator {
  constructor() {
    this.stages = {
      GREETING: 'greeting',
      COLLECT_DESTINATION: 'collect_destination',
      COLLECT_DATES: 'collect_dates',
      COLLECT_ACTIVITIES: 'collect_activities',
      FETCH_WEATHER: 'fetch_weather',
      ANALYZE: 'analyze',
      RESPOND: 'respond'
    };
  }

  /**
   * Main orchestration method - Gemini-driven conversation flow
   * @param {Object} params
   * @param {string} params.userId - User identifier
   * @param {string} params.message - User's message
   * @param {Object} params.metadata - Additional context
   * @returns {Object} Complete chatbot response
   */
  async orchestrate({ userId, message, metadata = {} }) {
    try {
      logger.info(`[Orchestrator] Processing message from user ${userId}: ${message}`);

      // Step 1: Get current conversation context
      let context = await contextManager.getContext(userId);
      
      // Update context with any provided metadata
      if (metadata) {
        context = await contextManager.updateContext(userId, metadata);
      }

      // Step 2: Ask Gemini to understand the user's intent and determine what's needed
      const intentAnalysis = await geminiService.analyzeUserIntent({
        message,
        context
      });

      logger.info(`[Orchestrator] Intent analysis: ${JSON.stringify(intentAnalysis, null, 2)}`);

      // Step 3: Extract any information from the message and update context
      if (intentAnalysis.extractedInfo) {
        context = await contextManager.updateContext(userId, intentAnalysis.extractedInfo);
        logger.info(`[Orchestrator] Updated context with extracted info`);
      }

      // Normalize/sanitize context to avoid "I want to go Goa" being stored as destination, etc.
      if (context.destination) {
        const normalizedDestination = geminiService.normalizeDestination
          ? geminiService.normalizeDestination(context.destination)
          : context.destination;
        if (normalizedDestination && normalizedDestination !== context.destination) {
          context = await contextManager.updateContext(userId, { destination: normalizedDestination });
          logger.info('[Orchestrator] Normalized destination in context');
        }
      }

      if (context.activities && !Array.isArray(context.activities)) {
        context = await contextManager.updateContext(userId, { activities: [String(context.activities)] });
      }

      // Step 4: If weather data is needed, fetch it
      let weatherData = null;
      if (intentAnalysis.needsWeather) {
        // Try to get destination from intent analysis first (for questions like "weather in Paris"),
        // fall back to context destination if not specified in the message
        const targetDestination = intentAnalysis.extractedInfo?.destination || context.destination;
        
        if (targetDestination) {
          logger.info(`[Orchestrator] Fetching weather for ${targetDestination}`);
          try {
            const currentWeather = await weatherService.getCurrentWeather(targetDestination);
            const forecast = await weatherService.getDailySummary(targetDestination, 10);
            weatherData = {
              currentWeather,
              forecast: forecast.dailySummaries,
              location: currentWeather.location
            };
            logger.info(`[Orchestrator] Weather data fetched successfully for ${targetDestination}`);
          } catch (error) {
            logger.error('[Orchestrator] Weather fetch error:', error);
            weatherData = { error: 'Could not fetch weather data' };
          }
        } else {
          logger.info('[Orchestrator] Weather requested but no destination available');
          weatherData = { error: 'No destination specified' };
        }
      }

      // Step 5: Generate response using Gemini with all available context
      const response = await geminiService.generateResponse({
        message,
        context,
        weatherData,
        intentAnalysis
      });

      logger.info(`[Orchestrator] Response generated`);

      // Step 6: Update conversation history
      await this.updateConversationHistory(userId, message, response);

      return response;

    } catch (error) {
      logger.error('[Orchestrator] Error:', error);
      return this.createErrorResponse('Sorry, something went wrong. Please try again.');
    }
  }

  /**
   * Determine current conversation stage
   */
  determineStage(context, message) {
    const lowerMessage = message.toLowerCase();

    // Check for greeting
    if (/^(hi|hello|hey|good morning|good afternoon|start|begin)/i.test(message.trim()) && !context.destination) {
      return this.stages.GREETING;
    }

    // Strict step-by-step: collect one piece of information at a time
    const hasDestination = !!context.destination;
    const hasDates = !!(context.travelDates?.start && context.travelDates?.end);
    const hasActivities = context.activities && context.activities.length > 0;

    // Always collect in order: destination -> dates -> activities
    if (!hasDestination) {
      return this.stages.COLLECT_DESTINATION;
    }
    if (!hasDates) {
      return this.stages.COLLECT_DATES;
    }
    if (!hasActivities) {
      return this.stages.COLLECT_ACTIVITIES;
    }

    // All info collected, proceed to analysis
    return this.stages.FETCH_WEATHER;
  }

  /**
   * Handle greeting stage
   */
  async handleGreeting({ message, context, userId }) {
    const greetingText = `Hi there! 👋 I'm your intelligent travel planning assistant.

I'm here to help you plan the perfect trip by:
🌤️ Analyzing real-time weather conditions
🎯 Recommending optimal times for your activities
⚠️ Identifying potential weather conflicts
🎒 Creating personalized packing lists
📅 Suggesting the best days for each activity

I'll guide you step-by-step through the planning process.

**Let's begin!** 

Where would you like to travel? (Please provide a city and country for best results)`;

    return {
      success: true,
      stage: this.stages.GREETING,
      response: {
        text: greetingText,
        data: {},
        suggestions: [
          'Paris, France',
          'Tokyo, Japan',
          'New York, USA',
          'Barcelona, Spain'
        ],
        actions: []
      },
      context: context,
      timestamp: new Date().toISOString()
    };
  }

  /**
   * Handle information collection stages
   */
  async handleInformationCollection({ message, context, userId, stage }) {
    logger.info(`[Orchestrator] Collecting information for stage: ${stage}`);
    logger.info(`[Orchestrator] User message: ${message}`);
    logger.info(`[Orchestrator] Current context: ${JSON.stringify(context, null, 2)}`);

    // Use Gemini to intelligently extract information and ask follow-up questions
    const collectionResult = await geminiService.collectTripInformation({
      message,
      context
    });

    logger.info(`[Orchestrator] Collection result: ${JSON.stringify(collectionResult, null, 2)}`);

    // Update context with extracted data
    if (collectionResult.extractedData) {
      logger.info(`[Orchestrator] Extracted data: ${JSON.stringify(collectionResult.extractedData, null, 2)}`);
      context = await contextManager.updateContext(userId, collectionResult.extractedData);
      logger.info(`[Orchestrator] Updated context: ${JSON.stringify(context, null, 2)}`);
    }

    // Build response text with acknowledgment if available
    let responseText = '';
    if (collectionResult.acknowledgment) {
      responseText = `${collectionResult.acknowledgment}\n\n${collectionResult.questionToAsk}`;
    } else {
      responseText = collectionResult.questionToAsk;
    }

    // Check if we have all information now
    if (collectionResult.hasAllInfo) {
      // Add transition message
      responseText += '\n\n✨ Perfect! I have everything I need. Let me analyze the weather conditions for your trip...';
      
      // Immediately proceed to weather analysis
      return await this.handleWeatherAnalysis({ message, context, userId });
    }

    // Ask for more information
    return {
      success: true,
      stage: stage,
      response: {
        text: responseText,
        data: {
          collected: collectionResult.extractedData,
          missing: this.getMissingFields(context),
          currentStep: this.getStepName(stage)
        },
        suggestions: this.getSuggestionsForStage(stage),
        actions: []
      },
      context: context,
      timestamp: new Date().toISOString()
    };
  }

  /**
   * Get human-readable step name
   */
  getStepName(stage) {
    const stepNames = {
      [this.stages.COLLECT_DESTINATION]: 'Destination',
      [this.stages.COLLECT_DATES]: 'Travel Dates',
      [this.stages.COLLECT_ACTIVITIES]: 'Activities'
    };
    return stepNames[stage] || 'Unknown';
  }

  /**
   * Handle weather fetching and analysis
   */
  async handleWeatherAnalysis({ message, context, userId }) {
    logger.info('[Orchestrator] Starting weather analysis');

    try {
      // Step 1: Fetch weather data from WeatherStack
      logger.info(`[Orchestrator] Fetching weather for ${context.destination}`);
      const currentWeather = await weatherService.getCurrentWeather(context.destination);
      const forecast = await weatherService.getDailySummary(context.destination, 10);

      const weatherData = {
        currentWeather,
        forecast: forecast.dailySummaries,
        location: currentWeather.location
      };

      // Step 2: Analyze with Gemini AI
      logger.info('[Orchestrator] Analyzing with Gemini AI');
      const aiAnalysis = await geminiService.analyzeWeatherForTrip({
        weatherData,
        userContext: context
      });

      // Step 3: Generate conversational response
      logger.info('[Orchestrator] Generating conversational response');
      const conversationalResponse = await geminiService.generateConversationalResponse({
        destination: context.destination,
        currentWeather,
        forecast: forecast.dailySummaries,
        analysis: aiAnalysis,
        activities: context.activities,
        travelDates: context.travelDates
      });

      // Step 4: Compile complete response
      return {
        success: true,
        stage: this.stages.RESPOND,
        response: {
          text: conversationalResponse.text,
          data: {
            currentWeather,
            forecast: forecast.dailySummaries,
            aiAnalysis,
            conflicts: aiAnalysis.conflicts || [],
            recommendations: aiAnalysis.recommendations || [],
            packingList: aiAnalysis.packingList || []
          },
          suggestions: this.generateSmartSuggestions(aiAnalysis, context),
          actions: this.generateActions(aiAnalysis, context)
        },
        context: context,
        timestamp: new Date().toISOString()
      };

    } catch (error) {
      logger.error('[Orchestrator] Weather analysis error:', error);
      
      if (error.message.includes('Location not found')) {
        // Reset destination and ask again
        await contextManager.updateContext(userId, { destination: null });
        
        return {
          success: false,
          stage: this.stages.COLLECT_DESTINATION,
          response: {
            text: `I couldn't find weather information for "${context.destination}". Could you please provide a valid city name? Try including the country name for better results (e.g., "Paris, France").`,
            data: {},
            suggestions: ['Try a major city', 'Include country name'],
            actions: []
          },
          context: context,
          timestamp: new Date().toISOString()
        };
      }

      throw error;
    }
  }

  /**
   * Get missing fields from context
   */
  getMissingFields(context) {
    const missing = [];
    if (!context.destination) missing.push('destination');
    if (!context.travelDates?.start) missing.push('start_date');
    if (!context.travelDates?.end) missing.push('end_date');
    if (!context.activities || context.activities.length === 0) missing.push('activities');
    return missing;
  }

  /**
   * Get suggestions based on current stage
   */
  getSuggestionsForStage(stage) {
    switch (stage) {
      case this.stages.COLLECT_DESTINATION:
        return ['Paris, France', 'Tokyo, Japan', 'New York, USA', 'London, UK'];
      
      case this.stages.COLLECT_DATES:
        return ['Next week', 'Next month', 'This weekend', 'In two weeks'];
      
      case this.stages.COLLECT_ACTIVITIES:
        return ['Sightseeing', 'Hiking', 'Beach', 'Museums', 'Shopping', 'Photography'];
      
      default:
        return [];
    }
  }

  /**
   * Generate smart suggestions based on AI analysis
   */
  generateSmartSuggestions(aiAnalysis, context) {
    const suggestions = [];

    if (aiAnalysis.conflicts && aiAnalysis.conflicts.length > 0) {
      suggestions.push('View alternative activities');
      suggestions.push('See best days for each activity');
    }

    if (aiAnalysis.packingList && aiAnalysis.packingList.length > 0) {
      suggestions.push('View complete packing list');
    }

    suggestions.push('Get detailed forecast');
    suggestions.push('Plan another trip');

    return suggestions.slice(0, 4); // Limit to 4 suggestions
  }

  /**
   * Generate actionable items
   */
  generateActions(aiAnalysis, context) {
    const actions = [];

    if (aiAnalysis.conflicts && aiAnalysis.conflicts.length > 0) {
      actions.push({
        type: 'warning',
        message: `${aiAnalysis.conflicts.length} activity conflict(s) detected`,
        actionText: 'View alternatives'
      });
    }

    if (aiAnalysis.recommendations && aiAnalysis.recommendations.length > 0) {
      actions.push({
        type: 'info',
        message: 'Best times identified for your activities',
        actionText: 'View schedule'
      });
    }

    return actions;
  }

  /**
   * Update conversation history
   */
  async updateConversationHistory(userId, userMessage, botResponse) {
    const context = await contextManager.getContext(userId);
    
    await contextManager.updateContext(userId, {
      conversationHistory: [
        ...(context.conversationHistory || []),
        {
          role: 'user',
          message: userMessage,
          timestamp: new Date()
        },
        {
          role: 'assistant',
          message: botResponse.response?.text || '',
          timestamp: new Date(),
          stage: botResponse.stage
        }
      ].slice(-20) // Keep last 20 messages
    });
  }

  /**
   * Create error response
   */
  createErrorResponse(message) {
    return {
      success: false,
      stage: 'error',
      response: {
        text: message,
        data: {},
        suggestions: ['Try again', 'Start over'],
        actions: []
      },
      context: {},
      timestamp: new Date().toISOString()
    };
  }
}

module.exports = new ConversationOrchestrator();
