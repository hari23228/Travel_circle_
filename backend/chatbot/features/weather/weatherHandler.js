/**
 * Weather Feature Handler
 * Main handler for weather-related queries
 */

const weatherService = require('./weatherService');
const activityMatcher = require('./activityMatcher');
const packingListGenerator = require('./packingListGenerator');
const { logger } = require('../../../middleware/logger');

class WeatherHandler {
  constructor() {
    this.name = 'weather';
  }

  /**
   * Handle weather-related requests
   * @param {Object} params
   * @param {string} params.message - User message
   * @param {Object} params.intent - Detected intent
   * @param {Object} params.context - Conversation context
   * @param {string} params.userId - User ID
   * @returns {Object} Handler response
   */
  async handle({ message, intent, context, userId }) {
    try {
      // Determine destination
      const destination = intent.entities.location || context.destination;
      
      if (!destination) {
        return this.askForDestination();
      }

      // Get weather data
      const currentWeather = await weatherService.getCurrentWeather(destination);
      const dailySummary = await weatherService.getDailySummary(destination, 10);
      const forecastData = await weatherService.getForecast(destination);

      // Get best time of day
      const bestTime = weatherService.getBestTimeOfDay(forecastData.forecasts);

      // Analyze activities if provided
      const activities = context.activities || [];
      const activityAnalysis = this.analyzeActivities(
        activities, 
        currentWeather, 
        dailySummary.dailySummaries
      );

      // Generate packing list
      const packingList = packingListGenerator.generatePackingList(
        dailySummary.dailySummaries,
        activities
      );

      // Build response
      const responseText = this.buildResponseText({
        destination: currentWeather.location,
        currentWeather,
        dailySummary,
        bestTime,
        activityAnalysis,
        packingList
      });

      return {
        text: responseText,
        data: {
          currentWeather,
          forecast: dailySummary.dailySummaries,
          bestTimeOfDay: bestTime,
          activityRecommendations: activityAnalysis,
          packingList
        },
        suggestions: this.generateSuggestions(activityAnalysis, currentWeather),
        actions: this.generateActions(activityAnalysis, destination)
      };

    } catch (error) {
      logger.error('Weather handler error:', error);
      
      if (error.message.includes('Location not found')) {
        return {
          text: `I couldn't find weather information for that location. Could you provide the city name or check the spelling?`,
          data: {},
          suggestions: ['Try a major city nearby', 'Check spelling'],
          actions: []
        };
      }

      throw error;
    }
  }

  /**
   * Analyze planned activities against weather
   */
  analyzeActivities(activities, currentWeather, dailySummaries) {
    if (!activities || activities.length === 0) {
      return {
        hasActivities: false,
        assessments: [],
        conflicts: [],
        alternatives: activityMatcher.suggestAlternatives(currentWeather, [])
      };
    }

    const assessments = activities.map(activity => {
      const assessment = activityMatcher.assessActivity(activity, currentWeather);
      const bestDay = activityMatcher.findBestDayForActivity(activity, dailySummaries);
      
      return {
        ...assessment,
        bestDay: bestDay.bestDay,
        bestDayScore: bestDay.score
      };
    });

    // Find conflicts (poor suitability)
    const conflicts = assessments.filter(a => a.suitable === 'poor' || a.suitable === 'fair');

    // Get alternatives for conflicted activities
    const alternatives = conflicts.length > 0 
      ? activityMatcher.suggestAlternatives(currentWeather, activities)
      : [];

    return {
      hasActivities: true,
      assessments,
      conflicts,
      alternatives,
      summary: this.summarizeActivityAnalysis(assessments)
    };
  }

  /**
   * Summarize activity analysis
   */
  summarizeActivityAnalysis(assessments) {
    const excellent = assessments.filter(a => a.suitable === 'excellent').length;
    const good = assessments.filter(a => a.suitable === 'good').length;
    const fair = assessments.filter(a => a.suitable === 'fair').length;
    const poor = assessments.filter(a => a.suitable === 'poor').length;

    return {
      total: assessments.length,
      excellent,
      good,
      fair,
      poor,
      overallSuitability: poor > 0 ? 'poor' : fair > 0 ? 'fair' : good > 0 ? 'good' : 'excellent'
    };
  }

  /**
   * Build human-readable response text
   */
  buildResponseText({ destination, currentWeather, dailySummary, bestTime, activityAnalysis, packingList }) {
    let text = `**Weather Report for ${destination}**\n\n`;

    // Current weather
    text += `📍 **Current Conditions**\n`;
    text += `Temperature: ${currentWeather.temperature.current}°C (feels like ${currentWeather.temperature.feelsLike}°C)\n`;
    text += `Conditions: ${currentWeather.conditions.description}\n`;
    text += `Humidity: ${currentWeather.details.humidity}%\n`;
    text += `Wind: ${currentWeather.details.windSpeed} m/s\n\n`;

    // Forecast summary
    text += `📅 **10-Day Forecast Summary**\n`;
    dailySummary.dailySummaries.slice(0, 5).forEach(day => {
      text += `${day.dateString}: ${day.temperature.min}-${day.temperature.max}°C, ${day.conditions}`;
      if (day.precipitationProbability > 30) {
        text += ` (${day.precipitationProbability}% rain)`;
      }
      text += `\n`;
    });
    text += `\n`;

    // Best time of day
    text += `⏰ **Best Time for Outdoor Activities**\n`;
    text += `${bestTime.recommendation}\n\n`;

    // Activity analysis
    if (activityAnalysis.hasActivities) {
      text += `🎯 **Your Planned Activities Analysis**\n`;
      
      activityAnalysis.assessments.forEach(activity => {
        const emoji = activity.suitable === 'excellent' ? '✅' : 
                     activity.suitable === 'good' ? '👍' : 
                     activity.suitable === 'fair' ? '⚠️' : '❌';
        
        text += `${emoji} **${activity.activity}**: ${activity.suitable}\n`;
        
        if (activity.issues.length > 0) {
          text += `   Issues: ${activity.issues.join(', ')}\n`;
        }
        
        if (activity.recommendations.length > 0) {
          text += `   Tip: ${activity.recommendations[0]}\n`;
        }
        
        if (activity.bestDay) {
          text += `   Best day: ${activity.bestDay}\n`;
        }
        
        text += `\n`;
      });

      // Alternative suggestions
      if (activityAnalysis.alternatives.length > 0) {
        text += `💡 **Alternative Activity Suggestions**\n`;
        activityAnalysis.alternatives.forEach(alt => {
          text += `• ${alt.activity}: ${alt.reason}\n`;
        });
        text += `\n`;
      }
    }

    // Packing recommendations
    text += `🎒 **Packing Recommendations**\n`;
    if (packingList.summary.packingTips.length > 0) {
      packingList.summary.packingTips.forEach(tip => {
        text += `• ${tip}\n`;
      });
    }
    text += `\nEssential items: ${packingList.essentials.slice(0, 3).join(', ')}`;
    if (packingList.clothing.length > 0) {
      text += `\nClothing: ${packingList.clothing.slice(0, 3).join(', ')}`;
    }
    if (packingList.special.length > 0) {
      text += `\nDon't forget: ${packingList.special.slice(0, 3).join(', ')}`;
    }

    return text;
  }

  /**
   * Generate quick suggestions
   */
  generateSuggestions(activityAnalysis, currentWeather) {
    const suggestions = [];

    if (activityAnalysis.conflicts.length > 0) {
      suggestions.push('Reschedule outdoor activities');
      suggestions.push('View alternative activities');
    }

    if (currentWeather.details.pop && currentWeather.details.pop > 50) {
      suggestions.push('Get rain gear recommendations');
    }

    suggestions.push('See full 10-day forecast');
    suggestions.push('Get detailed packing list');

    return suggestions;
  }

  /**
   * Generate action buttons
   */
  generateActions(activityAnalysis, destination) {
    const actions = [];

    actions.push({
      type: 'view_forecast',
      label: 'View Full Forecast',
      data: { destination }
    });

    if (activityAnalysis.conflicts.length > 0) {
      actions.push({
        type: 'reschedule_activities',
        label: 'Reschedule Activities',
        data: { conflicts: activityAnalysis.conflicts }
      });
    }

    actions.push({
      type: 'view_packing_list',
      label: 'View Packing List',
      data: { destination }
    });

    return actions;
  }

  /**
   * Ask for destination
   */
  askForDestination() {
    return {
      text: 'I can help you with weather information! Which destination would you like to know about?',
      data: {},
      suggestions: ['Paris', 'Tokyo', 'New York', 'London'],
      actions: []
    };
  }
}

module.exports = new WeatherHandler();
