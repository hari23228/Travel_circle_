/**
 * Chatbot Controller
 * Central hub that receives messages and orchestrates the conversation flow
 * Now uses AI-powered conversation orchestrator with WeatherStack and Gemini integration
 */

const conversationOrchestrator = require('./conversationOrchestrator');
const contextManager = require('./contextManager');
const { logger } = require('../middleware/logger');

class ChatbotController {
  constructor() {
    this.contextManager = contextManager;
    this.orchestrator = conversationOrchestrator;
    logger.info('✓ Chatbot Controller initialized with AI orchestration');
  }

  /**
   * Main entry point for processing user messages
   * Now uses the conversation orchestrator for intelligent flow management
   * @param {Object} params
   * @param {string} params.userId - User identifier
   * @param {string} params.message - User's message
   * @param {Object} params.metadata - Additional context (destination, dates, activities, etc.)
   * @returns {Object} Structured response ready for UI
   */
  async processMessage({ userId, message, metadata = {} }) {
    try {
      logger.info(`[Controller] Processing message from user ${userId}: ${message}`);

      // Use the conversation orchestrator to handle the entire flow
      const response = await this.orchestrator.orchestrate({
        userId,
        message,
        metadata
      });

      return response;

    } catch (error) {
      logger.error('[Controller] Error processing chatbot message:', error);
      return this.createErrorResponse('Sorry, I encountered an error. Please try again.');
    }
  }

  /**
   * Format response for UI consumption
   */
  formatResponse(featureResponse, intent, context) {
    return {
      success: true,
      intent: intent.type,
      confidence: intent.confidence,
      response: {
        text: featureResponse.text,
        data: featureResponse.data || {},
        suggestions: featureResponse.suggestions || [],
        actions: featureResponse.actions || []
      },
      context: {
        destination: context.destination,
        travelDates: context.travelDates,
        activities: context.activities
      },
      timestamp: new Date().toISOString()
    };
  }

  /**
   * Create error response
   */
  createErrorResponse(message) {
    return {
      success: false,
      response: {
        text: message,
        data: {},
        suggestions: [],
        actions: []
      },
      timestamp: new Date().toISOString()
    };
  }

  /**
   * Clear conversation context for a user
   */
  async clearContext(userId) {
    await this.contextManager.clearContext(userId);
    return {
      success: true,
      message: 'Conversation context cleared'
    };
  }

  /**
   * Get current conversation context
   */
  async getContext(userId) {
    const context = await this.contextManager.getContext(userId);
    return {
      success: true,
      context
    };
  }
}

module.exports = new ChatbotController();
