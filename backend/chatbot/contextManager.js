/**
 * Context Manager
 * Manages conversation state and user context across chatbot interactions
 */

class ContextManager {
  constructor() {
    // In-memory storage (replace with Redis/Database for production)
    this.contexts = new Map();
    this.contextTimeout = 30 * 60 * 1000; // 30 minutes
  }

  /**
   * Get conversation context for a user
   * @param {string} userId
   * @returns {Object} User context
   */
  async getContext(userId) {
    const existing = this.contexts.get(userId);
    
    if (existing && !this.isExpired(existing)) {
      existing.lastAccessed = Date.now();
      return existing.data;
    }

    // Create new context
    const newContext = this.createDefaultContext();
    this.contexts.set(userId, {
      data: newContext,
      createdAt: Date.now(),
      lastAccessed: Date.now()
    });

    return newContext;
  }

  /**
   * Update context with new data
   * @param {string} userId
   * @param {Object} updates - Context updates
   * @returns {Object} Updated context
   */
  async updateContext(userId, updates) {
    const current = await this.getContext(userId);
    
    const updated = {
      ...current,
      ...updates,
      updatedAt: new Date()
    };

    this.contexts.set(userId, {
      data: updated,
      createdAt: this.contexts.get(userId)?.createdAt || Date.now(),
      lastAccessed: Date.now()
    });

    return updated;
  }

  /**
   * Clear context for a user
   * @param {string} userId
   */
  async clearContext(userId) {
    this.contexts.delete(userId);
  }

  /**
   * Create default context structure
   */
  createDefaultContext() {
    return {
      destination: null,
      travelDates: {
        start: null,
        end: null
      },
      partialDateInfo: null, // Store month or partial date information
      activities: [],
      preferences: {
        budget: null,
        travelStyle: null
      },
      conversationHistory: [],
      extractedInfo: {},
      lastIntent: null,
      lastResponse: null,
      createdAt: new Date(),
      updatedAt: new Date()
    };
  }

  /**
   * Check if context is expired
   */
  isExpired(contextWrapper) {
    return (Date.now() - contextWrapper.lastAccessed) > this.contextTimeout;
  }

  /**
   * Clean up expired contexts (run periodically)
   */
  cleanExpiredContexts() {
    const now = Date.now();
    for (const [userId, wrapper] of this.contexts.entries()) {
      if (this.isExpired(wrapper)) {
        this.contexts.delete(userId);
      }
    }
  }
}

// Clean up expired contexts every 10 minutes
const contextManager = new ContextManager();
setInterval(() => contextManager.cleanExpiredContexts(), 10 * 60 * 1000);

module.exports = contextManager;
