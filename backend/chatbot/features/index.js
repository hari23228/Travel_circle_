/**
 * Feature Registry
 * Central registry for all chatbot feature handlers
 */

const weatherHandler = require('./weather/weatherHandler');

class FeatureRegistry {
  constructor() {
    this.handlers = new Map();
    this.registerDefaultHandlers();
  }

  /**
   * Register default feature handlers
   */
  registerDefaultHandlers() {
    this.register('weather', weatherHandler);
    this.register('general', {
      name: 'general',
      handle: async ({ message }) => {
        return {
          text: 'Hello! I\'m your travel planning assistant. I can help you with:\n\n' +
                '🌤️ Weather forecasts and best time to visit\n' +
                '🎯 Activity recommendations based on weather\n' +
                '🎒 Packing suggestions for your trip\n\n' +
                'Just tell me your destination and travel plans!',
          data: {},
          suggestions: [
            'Check weather for my trip',
            'What should I pack?',
            'Best time for outdoor activities'
          ],
          actions: []
        };
      }
    });
  }

  /**
   * Register a new feature handler
   * @param {string} intentType - Intent type this handler responds to
   * @param {Object} handler - Handler object with handle() method
   */
  register(intentType, handler) {
    if (!handler || typeof handler.handle !== 'function') {
      throw new Error(`Handler for ${intentType} must have a handle() method`);
    }
    
    this.handlers.set(intentType, handler);
    console.log(`✓ Registered handler for intent: ${intentType}`);
  }

  /**
   * Get handler for intent type
   * @param {string} intentType - Intent type
   * @returns {Object|null} Handler or null if not found
   */
  getHandler(intentType) {
    return this.handlers.get(intentType) || null;
  }

  /**
   * Unregister a handler
   * @param {string} intentType - Intent type to unregister
   */
  unregister(intentType) {
    this.handlers.delete(intentType);
  }

  /**
   * Get all registered intent types
   * @returns {Array} Array of registered intent types
   */
  getRegisteredIntents() {
    return Array.from(this.handlers.keys());
  }

  /**
   * Check if handler exists for intent
   * @param {string} intentType - Intent type
   * @returns {boolean}
   */
  hasHandler(intentType) {
    return this.handlers.has(intentType);
  }
}

module.exports = new FeatureRegistry();
