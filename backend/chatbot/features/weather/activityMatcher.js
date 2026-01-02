/**
 * Activity Matcher
 * Matches activities with weather conditions and provides recommendations
 */

class ActivityMatcher {
  constructor() {
    // Activity-Weather compatibility matrix
    this.activityMatrix = {
      // Outdoor activities
      'hiking': {
        idealConditions: ['Clear', 'Clouds'],
        avoidConditions: ['Rain', 'Thunderstorm', 'Snow'],
        idealTemp: { min: 15, max: 28 },
        maxWindSpeed: 20,
        maxPrecipitation: 10,
        category: 'outdoor'
      },
      'sightseeing': {
        idealConditions: ['Clear', 'Clouds'],
        avoidConditions: ['Thunderstorm', 'Snow'],
        idealTemp: { min: 10, max: 30 },
        maxWindSpeed: 25,
        maxPrecipitation: 30,
        category: 'outdoor'
      },
      'beach': {
        idealConditions: ['Clear'],
        avoidConditions: ['Rain', 'Thunderstorm', 'Clouds'],
        idealTemp: { min: 22, max: 35 },
        maxWindSpeed: 15,
        maxPrecipitation: 5,
        category: 'outdoor'
      },
      'photography': {
        idealConditions: ['Clear', 'Clouds'],
        avoidConditions: ['Rain', 'Thunderstorm', 'Fog'],
        idealTemp: { min: 5, max: 32 },
        maxWindSpeed: 30,
        maxPrecipitation: 20,
        category: 'outdoor'
      },
      'cycling': {
        idealConditions: ['Clear', 'Clouds'],
        avoidConditions: ['Rain', 'Thunderstorm', 'Snow'],
        idealTemp: { min: 12, max: 28 },
        maxWindSpeed: 25,
        maxPrecipitation: 10,
        category: 'outdoor'
      },
      'water sports': {
        idealConditions: ['Clear'],
        avoidConditions: ['Thunderstorm', 'Rain'],
        idealTemp: { min: 20, max: 35 },
        maxWindSpeed: 20,
        maxPrecipitation: 5,
        category: 'outdoor'
      },
      'picnic': {
        idealConditions: ['Clear', 'Clouds'],
        avoidConditions: ['Rain', 'Thunderstorm'],
        idealTemp: { min: 18, max: 30 },
        maxWindSpeed: 20,
        maxPrecipitation: 10,
        category: 'outdoor'
      },

      // Indoor activities
      'museum': {
        idealConditions: ['Rain', 'Clouds', 'Clear'],
        avoidConditions: [],
        idealTemp: { min: -10, max: 40 },
        maxWindSpeed: 100,
        maxPrecipitation: 100,
        category: 'indoor'
      },
      'shopping': {
        idealConditions: ['Rain', 'Clouds', 'Clear'],
        avoidConditions: [],
        idealTemp: { min: -10, max: 40 },
        maxWindSpeed: 100,
        maxPrecipitation: 100,
        category: 'indoor'
      },
      'indoor dining': {
        idealConditions: ['Rain', 'Clouds', 'Clear'],
        avoidConditions: [],
        idealTemp: { min: -10, max: 40 },
        maxWindSpeed: 100,
        maxPrecipitation: 100,
        category: 'indoor'
      },
      'spa': {
        idealConditions: ['Rain', 'Clouds', 'Clear'],
        avoidConditions: [],
        idealTemp: { min: -10, max: 40 },
        maxWindSpeed: 100,
        maxPrecipitation: 100,
        category: 'indoor'
      },
      'art gallery': {
        idealConditions: ['Rain', 'Clouds', 'Clear'],
        avoidConditions: [],
        idealTemp: { min: -10, max: 40 },
        maxWindSpeed: 100,
        maxPrecipitation: 100,
        category: 'indoor'
      },
      'theater': {
        idealConditions: ['Rain', 'Clouds', 'Clear'],
        avoidConditions: [],
        idealTemp: { min: -10, max: 40 },
        maxWindSpeed: 100,
        maxPrecipitation: 100,
        category: 'indoor'
      },
      'cinema': {
        idealConditions: ['Rain', 'Clouds', 'Clear'],
        avoidConditions: [],
        idealTemp: { min: -10, max: 40 },
        maxWindSpeed: 100,
        maxPrecipitation: 100,
        category: 'indoor'
      },

      // Mixed activities
      'city tour': {
        idealConditions: ['Clear', 'Clouds'],
        avoidConditions: ['Thunderstorm', 'Snow'],
        idealTemp: { min: 10, max: 30 },
        maxWindSpeed: 30,
        maxPrecipitation: 30,
        category: 'mixed'
      },
      'restaurant hopping': {
        idealConditions: ['Clear', 'Clouds'],
        avoidConditions: ['Thunderstorm'],
        idealTemp: { min: 5, max: 35 },
        maxWindSpeed: 35,
        maxPrecipitation: 40,
        category: 'mixed'
      }
    };
  }

  /**
   * Check if activity is suitable for given weather
   * @param {string} activity - Activity name
   * @param {Object} weather - Weather data
   * @returns {Object} Suitability assessment
   */
  assessActivity(activity, weather) {
    const activityKey = this.findActivityKey(activity);
    
    if (!activityKey) {
      return {
        activity,
        suitable: 'unknown',
        score: 50,
        reason: 'Activity not recognized',
        recommendations: []
      };
    }

    const config = this.activityMatrix[activityKey];
    let score = 100;
    const issues = [];
    const recommendations = [];

    // Check weather conditions
    if (config.avoidConditions.includes(weather.conditions.main)) {
      score -= 40;
      issues.push(`${weather.conditions.main.toLowerCase()} weather`);
      recommendations.push(`Consider rescheduling or choosing an indoor alternative`);
    }

    // Check temperature
    if (weather.temperature.current < config.idealTemp.min) {
      score -= 20;
      issues.push(`temperature too low (${weather.temperature.current}°C)`);
      recommendations.push(`Dress warmly or wait for warmer weather`);
    } else if (weather.temperature.current > config.idealTemp.max) {
      score -= 20;
      issues.push(`temperature too high (${weather.temperature.current}°C)`);
      recommendations.push(`Stay hydrated and seek shade regularly`);
    }

    // Check wind speed
    if (weather.details.windSpeed > config.maxWindSpeed) {
      score -= 15;
      issues.push(`high winds (${weather.details.windSpeed} m/s)`);
      recommendations.push(`Wind may affect comfort and safety`);
    }

    // Check precipitation probability (if available)
    if (weather.details.pop && weather.details.pop > config.maxPrecipitation) {
      score -= 25;
      issues.push(`high chance of rain (${weather.details.pop}%)`);
      recommendations.push(`Bring rain gear or choose an indoor activity`);
    }

    // Determine suitability
    let suitable;
    if (score >= 70) suitable = 'excellent';
    else if (score >= 50) suitable = 'good';
    else if (score >= 30) suitable = 'fair';
    else suitable = 'poor';

    return {
      activity,
      suitable,
      score: Math.max(0, score),
      category: config.category,
      issues,
      recommendations,
      weatherCondition: weather.conditions.main
    };
  }

  /**
   * Find activity key from user input
   */
  findActivityKey(activity) {
    const normalized = activity.toLowerCase().trim();
    
    // Direct match
    if (this.activityMatrix[normalized]) {
      return normalized;
    }

    // Partial match
    for (const key of Object.keys(this.activityMatrix)) {
      if (normalized.includes(key) || key.includes(normalized)) {
        return key;
      }
    }

    return null;
  }

  /**
   * Suggest alternative activities based on weather
   * @param {Object} weather - Weather data
   * @param {Array} plannedActivities - User's planned activities
   * @returns {Array} Alternative suggestions
   */
  suggestAlternatives(weather, plannedActivities = []) {
    const alternatives = [];

    // Assess current weather
    const isRainy = ['Rain', 'Thunderstorm'].includes(weather.conditions.main);
    const isCold = weather.temperature.current < 10;
    const isHot = weather.temperature.current > 30;

    if (isRainy) {
      // Suggest indoor activities
      alternatives.push(
        { activity: 'museum', reason: 'Perfect for rainy weather' },
        { activity: 'shopping', reason: 'Stay dry while exploring' },
        { activity: 'art gallery', reason: 'Cultural indoor experience' },
        { activity: 'spa', reason: 'Relax and unwind indoors' }
      );
    } else if (weather.conditions.main === 'Clear') {
      // Suggest outdoor activities
      if (!isHot && !isCold) {
        alternatives.push(
          { activity: 'hiking', reason: 'Perfect weather for outdoor exploration' },
          { activity: 'sightseeing', reason: 'Great visibility and comfort' },
          { activity: 'photography', reason: 'Excellent lighting conditions' },
          { activity: 'picnic', reason: 'Ideal conditions for outdoor dining' }
        );
      } else if (isHot) {
        alternatives.push(
          { activity: 'beach', reason: 'Hot weather perfect for water activities' },
          { activity: 'water sports', reason: 'Cool off with water activities' }
        );
      }
    }

    // Filter out already planned activities
    return alternatives.filter(alt => 
      !plannedActivities.some(planned => 
        planned.toLowerCase().includes(alt.activity)
      )
    ).slice(0, 4);
  }

  /**
   * Find best day for specific activity
   * @param {string} activity - Activity name
   * @param {Array} dailySummaries - Array of daily weather summaries
   * @returns {Object} Best day recommendation
   */
  findBestDayForActivity(activity, dailySummaries) {
    const activityKey = this.findActivityKey(activity);
    
    if (!activityKey) {
      return {
        activity,
        bestDay: null,
        reason: 'Activity not recognized'
      };
    }

    const config = this.activityMatrix[activityKey];
    const scoredDays = dailySummaries.map(day => {
      let score = 100;

      // Check conditions
      if (config.avoidConditions.includes(day.conditions)) {
        score -= 40;
      }
      if (!config.idealConditions.includes(day.conditions)) {
        score -= 10;
      }

      // Check temperature
      if (day.temperature.avg < config.idealTemp.min || 
          day.temperature.avg > config.idealTemp.max) {
        score -= 20;
      }

      // Check precipitation
      if (day.precipitationProbability > config.maxPrecipitation) {
        score -= 30;
      }

      return {
        ...day,
        score: Math.max(0, score)
      };
    });

    const bestDay = scoredDays.sort((a, b) => b.score - a.score)[0];

    return {
      activity,
      bestDay: bestDay.dateString,
      score: bestDay.score,
      conditions: bestDay.conditions,
      temperature: bestDay.temperature,
      reason: this.getBestDayReason(bestDay, config)
    };
  }

  /**
   * Generate reason for best day recommendation
   */
  getBestDayReason(day, config) {
    const reasons = [];

    if (config.idealConditions.includes(day.conditions)) {
      reasons.push(`${day.conditions.toLowerCase()} weather`);
    }

    if (day.temperature.avg >= config.idealTemp.min && 
        day.temperature.avg <= config.idealTemp.max) {
      reasons.push('comfortable temperature');
    }

    if (day.precipitationProbability <= 30) {
      reasons.push('low chance of rain');
    }

    return reasons.length > 0 
      ? `Best conditions: ${reasons.join(', ')}`
      : 'Most suitable based on forecast';
  }

  /**
   * Register custom activity
   */
  registerActivity(activityName, config) {
    this.activityMatrix[activityName.toLowerCase()] = config;
  }

  /**
   * Get all registered activities
   */
  getActivities() {
    return Object.keys(this.activityMatrix);
  }
}

module.exports = new ActivityMatcher();
