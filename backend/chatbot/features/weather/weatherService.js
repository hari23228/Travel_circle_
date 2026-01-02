/**
 * Weather Service
 * Integrates with WeatherStack API to fetch weather data and forecasts
 */

const axios = require('axios');
const { logger } = require('../../../middleware/logger');

class WeatherService {
  constructor() {
    this.apiKey = process.env.WEATHERSTACK_API_KEY;
    this.baseUrl = 'http://api.weatherstack.com';
  }

  /**
   * Get current weather for a location
   * @param {string} location - City name
   * @returns {Object} Current weather data
   */
  async getCurrentWeather(location) {
    try {
      const response = await axios.get(`${this.baseUrl}/current`, {
        params: {
          access_key: this.apiKey,
          query: location,
          units: 'm' // metric units
        }
      });

      if (response.data.error) {
        throw new Error(response.data.error.info || 'Unable to fetch weather data');
      }

      const data = response.data;

      return {
        location: `${data.location.name}, ${data.location.country}`,
        temperature: {
          current: Math.round(data.current.temperature),
          feelsLike: Math.round(data.current.feelslike),
          min: Math.round(data.current.temperature - 3), // WeatherStack doesn't provide min/max for free plan
          max: Math.round(data.current.temperature + 3)
        },
        conditions: {
          main: data.current.weather_descriptions[0],
          description: data.current.weather_descriptions[0].toLowerCase(),
          icon: data.current.weather_icons[0]
        },
        details: {
          humidity: data.current.humidity,
          pressure: data.current.pressure,
          windSpeed: data.current.wind_speed / 3.6, // Convert km/h to m/s
          windDirection: data.current.wind_degree,
          cloudiness: data.current.cloudcover,
          visibility: data.current.visibility
        },
        rain: data.current.precip || 0,
        timestamp: new Date(data.location.localtime)
      };
    } catch (error) {
      logger.error('Error fetching current weather:', error.message);
      throw new Error('Unable to fetch weather. Please check the location or try again later.');
    }
  }

  /**
   * Get forecast data (simulated from current weather for free WeatherStack plan)
   * Note: WeatherStack free plan doesn't include forecast. Upgrade to paid plan for real forecasts.
   * @param {string} location - City name
   * @returns {Array} Forecast data
   */
  async getForecast(location) {
    try {
      // WeatherStack free plan doesn't include forecast
      // We'll generate a basic forecast based on current weather
      const current = await this.getCurrentWeather(location);
      
      const forecasts = [];
      const now = new Date();
      
      // Generate 40 forecast points (5 days * 8 per day) with slight variations
      for (let i = 0; i < 40; i++) {
        const timestamp = new Date(now.getTime() + (i * 3 * 60 * 60 * 1000)); // 3-hour intervals
        const tempVariation = Math.sin(i / 8 * Math.PI) * 5; // Daily temperature variation
        
        forecasts.push({
          timestamp,
          temperature: {
            temp: Math.round(current.temperature.current + tempVariation + (Math.random() - 0.5) * 3),
            feelsLike: Math.round(current.temperature.feelsLike + tempVariation + (Math.random() - 0.5) * 3),
            min: Math.round(current.temperature.min + tempVariation - 2),
            max: Math.round(current.temperature.max + tempVariation + 2)
          },
          conditions: {
            main: current.conditions.main,
            description: current.conditions.description,
            icon: current.conditions.icon
          },
          details: {
            humidity: current.details.humidity + Math.round((Math.random() - 0.5) * 10),
            windSpeed: current.details.windSpeed + (Math.random() - 0.5) * 2,
            cloudiness: current.details.cloudiness + Math.round((Math.random() - 0.5) * 20),
            pop: Math.round(Math.random() * 30) // Random precipitation probability
          },
          rain: current.rain + (Math.random() * 0.5)
        });
      }

      return {
        location: current.location,
        forecasts
      };
    } catch (error) {
      logger.error('Error generating forecast:', error.message);
      throw error;
    }
  }

  /**
   * Get daily summary from forecast data
   * @param {string} location - City name
   * @param {number} days - Number of days (max 5)
   * @returns {Array} Daily summaries
   */
  async getDailySummary(location, days = 5) {
    try {
      const forecastData = await this.getForecast(location);
      const dailyData = {};

      // Group forecasts by day
      forecastData.forecasts.forEach(forecast => {
        const date = forecast.timestamp.toISOString().split('T')[0];
        
        if (!dailyData[date]) {
          dailyData[date] = {
            date,
            temperatures: [],
            conditions: [],
            humidity: [],
            windSpeed: [],
            rain: [],
            pop: []
          };
        }

        dailyData[date].temperatures.push(forecast.temperature.temp);
        dailyData[date].conditions.push(forecast.conditions.main);
        dailyData[date].humidity.push(forecast.details.humidity);
        dailyData[date].windSpeed.push(forecast.details.windSpeed);
        dailyData[date].rain.push(forecast.rain);
        dailyData[date].pop.push(forecast.details.pop);
      });

      // Calculate daily summaries
      const summaries = Object.entries(dailyData)
        .slice(0, days)
        .map(([date, data]) => ({
          date: new Date(date),
          dateString: new Date(date).toLocaleDateString('en-US', { 
            weekday: 'short', 
            month: 'short', 
            day: 'numeric' 
          }),
          temperature: {
            min: Math.round(Math.min(...data.temperatures)),
            max: Math.round(Math.max(...data.temperatures)),
            avg: Math.round(data.temperatures.reduce((a, b) => a + b, 0) / data.temperatures.length)
          },
          conditions: this.getMostCommonCondition(data.conditions),
          avgHumidity: Math.round(data.humidity.reduce((a, b) => a + b, 0) / data.humidity.length),
          avgWindSpeed: (data.windSpeed.reduce((a, b) => a + b, 0) / data.windSpeed.length).toFixed(1),
          totalRain: data.rain.reduce((a, b) => a + b, 0).toFixed(1),
          precipitationProbability: Math.round(Math.max(...data.pop)),
          isSuitable: this.assessDaySuitability(data)
        }));

      return {
        location: forecastData.location,
        dailySummaries: summaries
      };
    } catch (error) {
      logger.error('Error fetching daily summary:', error.message);
      throw error;
    }
  }

  /**
   * Get most common weather condition
   */
  getMostCommonCondition(conditions) {
    const counts = {};
    conditions.forEach(c => counts[c] = (counts[c] || 0) + 1);
    return Object.entries(counts).sort((a, b) => b[1] - a[1])[0][0];
  }

  /**
   * Assess if day is suitable for outdoor activities
   */
  assessDaySuitability(dayData) {
    const avgPop = dayData.pop.reduce((a, b) => a + b, 0) / dayData.pop.length;
    const hasRain = dayData.rain.some(r => r > 0);
    const conditions = this.getMostCommonCondition(dayData.conditions);
    
    if (avgPop > 70 || hasRain || conditions === 'Thunderstorm') {
      return 'poor';
    } else if (avgPop > 40 || conditions === 'Rain') {
      return 'fair';
    } else {
      return 'good';
    }
  }

  /**
   * Get best time of day based on weather
   * @param {Array} forecasts - Array of forecast data
   * @returns {Object} Best time recommendations
   */
  getBestTimeOfDay(forecasts) {
    const timeSlots = {
      morning: [], // 6-12
      afternoon: [], // 12-18
      evening: [] // 18-24
    };

    forecasts.forEach(forecast => {
      const hour = forecast.timestamp.getHours();
      
      if (hour >= 6 && hour < 12) {
        timeSlots.morning.push(forecast);
      } else if (hour >= 12 && hour < 18) {
        timeSlots.afternoon.push(forecast);
      } else if (hour >= 18 && hour < 24) {
        timeSlots.evening.push(forecast);
      }
    });

    // Score each time slot
    const scores = {};
    Object.entries(timeSlots).forEach(([slot, forecasts]) => {
      if (forecasts.length === 0) {
        scores[slot] = 0;
        return;
      }

      const avgTemp = forecasts.reduce((sum, f) => sum + f.temperature.temp, 0) / forecasts.length;
      const avgPop = forecasts.reduce((sum, f) => sum + f.details.pop, 0) / forecasts.length;
      const hasRain = forecasts.some(f => f.rain > 0);

      let score = 100;
      score -= avgPop; // Reduce score by precipitation probability
      if (hasRain) score -= 20;
      if (avgTemp < 10 || avgTemp > 35) score -= 10; // Uncomfortable temperatures

      scores[slot] = Math.max(0, score);
    });

    const bestSlot = Object.entries(scores).sort((a, b) => b[1] - a[1])[0];

    return {
      bestTime: bestSlot[0],
      score: bestSlot[1],
      allScores: scores,
      recommendation: this.getTimeRecommendation(bestSlot[0], scores)
    };
  }

  /**
   * Generate time recommendation text
   */
  getTimeRecommendation(bestTime, scores) {
    const messages = {
      morning: 'Morning is the best time with clearer skies and comfortable temperatures.',
      afternoon: 'Afternoon offers good weather conditions for outdoor activities.',
      evening: 'Evening is ideal for outdoor activities with pleasant weather.'
    };

    return messages[bestTime] || 'Weather conditions vary throughout the day.';
  }
}

module.exports = new WeatherService();
