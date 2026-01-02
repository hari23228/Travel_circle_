/**
 * Intent Detector
 * Analyzes user messages to determine intent and extract entities
 */

class IntentDetector {
  constructor() {
    // Intent patterns with keywords and regex
    this.intentPatterns = {
      weather: {
        keywords: ['weather', 'temperature', 'rain', 'forecast', 'climate', 'sunny', 'hot', 'cold', 'best time', 'when to visit'],
        patterns: [
          /what'?s?\s+the\s+weather/i,
          /how'?s?\s+the\s+weather/i,
          /weather\s+in/i,
          /best\s+time\s+to\s+(visit|go|travel)/i,
          /should\s+i\s+bring\s+(umbrella|jacket|sunscreen)/i,
          /will\s+it\s+rain/i,
          /what\s+to\s+pack/i
        ]
      },
      activity: {
        keywords: ['activity', 'activities', 'things to do', 'visit', 'attractions', 'sightseeing'],
        patterns: [
          /what\s+can\s+i\s+do/i,
          /things\s+to\s+do/i,
          /activities\s+in/i,
          /places\s+to\s+visit/i
        ]
      },
      accommodation: {
        keywords: ['hotel', 'accommodation', 'stay', 'lodge', 'hostel', 'resort'],
        patterns: [
          /where\s+to\s+stay/i,
          /hotel\s+in/i,
          /accommodation/i
        ]
      },
      transport: {
        keywords: ['transport', 'flight', 'train', 'bus', 'car', 'taxi', 'how to get'],
        patterns: [
          /how\s+to\s+get\s+to/i,
          /transport\s+to/i,
          /flights?\s+to/i
        ]
      },
      general: {
        keywords: ['hello', 'hi', 'help', 'thanks', 'thank you'],
        patterns: [
          /^(hello|hi|hey)/i,
          /help\s+me/i,
          /thank/i
        ]
      }
    };
  }

  /**
   * Detect intent from user message
   * @param {string} message - User's message
   * @param {Object} context - Conversation context
   * @returns {Object} Intent object with type and confidence
   */
  async detectIntent(message, context) {
    const normalized = message.toLowerCase().trim();
    const scores = {};

    // Score each intent type
    for (const [intentType, config] of Object.entries(this.intentPatterns)) {
      let score = 0;

      // Check keywords
      for (const keyword of config.keywords) {
        if (normalized.includes(keyword)) {
          score += 1;
        }
      }

      // Check patterns
      for (const pattern of config.patterns) {
        if (pattern.test(message)) {
          score += 2; // Patterns have higher weight
        }
      }

      scores[intentType] = score;
    }

    // Get highest scoring intent
    const sortedIntents = Object.entries(scores)
      .sort(([, a], [, b]) => b - a);

    const [topIntent, topScore] = sortedIntents[0];

    // Extract entities from message
    const entities = this.extractEntities(message, context);

    // Calculate confidence
    const confidence = this.calculateConfidence(topScore, sortedIntents);

    // If no clear intent and context exists, default to weather
    const finalIntent = topScore === 0 && context.destination ? 'weather' : topIntent;

    return {
      type: finalIntent || 'general',
      confidence,
      entities,
      scores,
      rawMessage: message
    };
  }

  /**
   * Extract entities from message (dates, locations, etc.)
   */
  extractEntities(message, context) {
    const entities = {};

    // Extract location
    const locationMatch = message.match(/in\s+([A-Z][a-zA-Z\s]+?)(?:\s+on|\s+during|\?|$)/);
    if (locationMatch) {
      entities.location = locationMatch[1].trim();
    }

    // Extract dates (simple patterns)
    const datePatterns = [
      /tomorrow/i,
      /next\s+week/i,
      /this\s+weekend/i,
      /(january|february|march|april|may|june|july|august|september|october|november|december)/i
    ];

    for (const pattern of datePatterns) {
      const match = message.match(pattern);
      if (match) {
        entities.timeReference = match[0];
        break;
      }
    }

    // Extract activities mentioned
    const activityKeywords = ['hiking', 'sightseeing', 'beach', 'museum', 'shopping', 'dining', 'nightlife'];
    entities.activities = activityKeywords.filter(activity => 
      message.toLowerCase().includes(activity)
    );

    return entities;
  }

  /**
   * Calculate confidence score
   */
  calculateConfidence(topScore, sortedIntents) {
    if (topScore === 0) return 0.3; // Low confidence

    const [, secondScore] = sortedIntents[1] || [null, 0];
    const diff = topScore - secondScore;

    if (diff >= 2) return 0.9; // High confidence
    if (diff >= 1) return 0.7; // Medium-high confidence
    return 0.5; // Medium confidence
  }

  /**
   * Add custom intent pattern dynamically
   */
  registerIntent(intentName, config) {
    this.intentPatterns[intentName] = config;
  }
}

module.exports = new IntentDetector();
