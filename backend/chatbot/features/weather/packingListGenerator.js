/**
 * Packing List Generator
 * Generates weather-based packing recommendations
 */

class PackingListGenerator {
  constructor() {
    // Packing recommendations based on weather conditions
    this.packingRules = {
      // Temperature-based items
      temperature: [
        { range: [-Infinity, 0], items: ['heavy winter coat', 'thermal underwear', 'winter gloves', 'warm hat', 'scarf', 'insulated boots'] },
        { range: [0, 10], items: ['warm jacket', 'sweater', 'long pants', 'closed shoes', 'light gloves'] },
        { range: [10, 20], items: ['light jacket', 'long-sleeve shirts', 'jeans', 'comfortable shoes'] },
        { range: [20, 28], items: ['t-shirts', 'shorts', 'light pants', 'sandals', 'sun hat'] },
        { range: [28, Infinity], items: ['light breathable clothing', 'shorts', 'tank tops', 'flip-flops', 'sun hat', 'cooling towel'] }
      ],

      // Condition-based items
      conditions: {
        'Rain': ['waterproof jacket', 'umbrella', 'waterproof shoes', 'rain cover for bags'],
        'Thunderstorm': ['waterproof jacket', 'sturdy umbrella', 'waterproof shoes', 'rain cover for bags'],
        'Snow': ['winter boots', 'waterproof pants', 'warm layers', 'waterproof gloves'],
        'Clear': ['sunglasses', 'sunscreen', 'sun hat', 'light clothing'],
        'Clouds': ['light jacket', 'sunglasses (just in case)'],
        'Mist': ['light jacket', 'umbrella (just in case)'],
        'Fog': ['warm layer', 'visibility gear if driving']
      },

      // Activity-specific items
      activities: {
        'hiking': ['hiking boots', 'backpack', 'water bottle', 'trail snacks', 'first aid kit', 'map/GPS'],
        'beach': ['swimsuit', 'beach towel', 'sunscreen', 'beach bag', 'sunglasses', 'flip-flops'],
        'sightseeing': ['comfortable walking shoes', 'day bag', 'camera', 'portable charger', 'water bottle'],
        'museum': ['comfortable shoes', 'light bag', 'camera (check if allowed)', 'notebook'],
        'photography': ['camera equipment', 'extra batteries', 'memory cards', 'lens cloth', 'tripod'],
        'water sports': ['swimsuit', 'water shoes', 'waterproof bag', 'sunscreen', 'towel'],
        'cycling': ['helmet', 'cycling shoes', 'water bottle', 'repair kit', 'comfortable clothing'],
        'shopping': ['comfortable shoes', 'reusable shopping bag', 'wallet', 'portable charger']
      },

      // Always recommended
      essentials: [
        'travel documents',
        'phone charger',
        'medications',
        'personal hygiene items',
        'cash and cards'
      ],

      // Special conditions
      special: {
        highHumidity: ['moisture-wicking clothing', 'extra changes of clothes', 'antifungal powder'],
        highUV: ['sunscreen SPF 50+', 'UV protection clothing', 'lip balm with SPF'],
        highWind: ['windbreaker', 'secure hat', 'protective eyewear'],
        lowVisibility: ['flashlight', 'reflective clothing']
      }
    };
  }

  /**
   * Generate packing list based on weather forecast and activities
   * @param {Array} dailySummaries - Daily weather summaries
   * @param {Array} activities - Planned activities
   * @returns {Object} Categorized packing list
   */
  generatePackingList(dailySummaries, activities = []) {
    const packingList = {
      clothing: new Set(),
      accessories: new Set(),
      activityGear: new Set(),
      essentials: new Set(this.packingRules.essentials),
      special: new Set()
    };

    // Add items based on temperature range
    const temps = dailySummaries.map(d => d.temperature);
    const minTemp = Math.min(...temps.map(t => t.min));
    const maxTemp = Math.max(...temps.map(t => t.max));

    this.packingRules.temperature.forEach(rule => {
      const [min, max] = rule.range;
      if ((minTemp >= min && minTemp < max) || (maxTemp >= min && maxTemp < max)) {
        rule.items.forEach(item => {
          this.categorizeItem(item, packingList);
        });
      }
    });

    // Add items based on weather conditions
    const conditions = [...new Set(dailySummaries.map(d => d.conditions))];
    conditions.forEach(condition => {
      if (this.packingRules.conditions[condition]) {
        this.packingRules.conditions[condition].forEach(item => {
          this.categorizeItem(item, packingList);
        });
      }
    });

    // Add activity-specific items
    activities.forEach(activity => {
      const activityKey = this.findActivityKey(activity);
      if (activityKey && this.packingRules.activities[activityKey]) {
        this.packingRules.activities[activityKey].forEach(item => {
          packingList.activityGear.add(item);
        });
      }
    });

    // Add special condition items
    const avgHumidity = dailySummaries.reduce((sum, d) => sum + d.avgHumidity, 0) / dailySummaries.length;
    if (avgHumidity > 70) {
      this.packingRules.special.highHumidity.forEach(item => packingList.special.add(item));
    }

    const hasHighWind = dailySummaries.some(d => parseFloat(d.avgWindSpeed) > 10);
    if (hasHighWind) {
      this.packingRules.special.highWind.forEach(item => packingList.special.add(item));
    }

    // UV protection for sunny days
    const hasSunnyDays = conditions.includes('Clear');
    if (hasSunnyDays) {
      this.packingRules.special.highUV.forEach(item => packingList.special.add(item));
    }

    // Convert sets to arrays and return
    return {
      clothing: Array.from(packingList.clothing),
      accessories: Array.from(packingList.accessories),
      activityGear: Array.from(packingList.activityGear),
      essentials: Array.from(packingList.essentials),
      special: Array.from(packingList.special),
      summary: this.generateSummary(packingList, dailySummaries)
    };
  }

  /**
   * Categorize item into appropriate list
   */
  categorizeItem(item, packingList) {
    const clothingKeywords = ['coat', 'jacket', 'shirt', 'pants', 'shorts', 'dress', 'sweater', 'underwear', 'clothing'];
    const accessoryKeywords = ['hat', 'sunglasses', 'gloves', 'scarf', 'shoes', 'boots', 'sandals', 'umbrella', 'bag'];

    if (clothingKeywords.some(keyword => item.includes(keyword))) {
      packingList.clothing.add(item);
    } else if (accessoryKeywords.some(keyword => item.includes(keyword))) {
      packingList.accessories.add(item);
    } else {
      packingList.special.add(item);
    }
  }

  /**
   * Find activity key from user input
   */
  findActivityKey(activity) {
    const normalized = activity.toLowerCase().trim();
    
    // Direct match
    if (this.packingRules.activities[normalized]) {
      return normalized;
    }

    // Partial match
    for (const key of Object.keys(this.packingRules.activities)) {
      if (normalized.includes(key) || key.includes(normalized)) {
        return key;
      }
    }

    return null;
  }

  /**
   * Generate packing summary
   */
  generateSummary(packingList, dailySummaries) {
    const totalItems = 
      packingList.clothing.size + 
      packingList.accessories.size + 
      packingList.activityGear.size + 
      packingList.essentials.size +
      packingList.special.size;

    const temps = dailySummaries.map(d => d.temperature);
    const minTemp = Math.min(...temps.map(t => t.min));
    const maxTemp = Math.max(...temps.map(t => t.max));

    const hasRain = dailySummaries.some(d => d.precipitationProbability > 50);
    const conditions = [...new Set(dailySummaries.map(d => d.conditions))];

    return {
      totalItems,
      temperatureRange: `${minTemp}°C to ${maxTemp}°C`,
      weatherVariety: conditions.join(', '),
      rainExpected: hasRain,
      packingTips: this.generatePackingTips(dailySummaries, hasRain, minTemp, maxTemp)
    };
  }

  /**
   * Generate packing tips
   */
  generatePackingTips(dailySummaries, hasRain, minTemp, maxTemp) {
    const tips = [];

    // Temperature variation tip
    if (maxTemp - minTemp > 15) {
      tips.push('Pack layers - temperature varies significantly between day and night');
    }

    // Rain tip
    if (hasRain) {
      tips.push('Don\'t forget rain protection - precipitation is likely during your trip');
    }

    // Cold weather tip
    if (minTemp < 10) {
      tips.push('Bring warm layers for chilly mornings and evenings');
    }

    // Hot weather tip
    if (maxTemp > 30) {
      tips.push('Pack light, breathable fabrics and stay hydrated');
    }

    // Humidity tip
    const avgHumidity = dailySummaries.reduce((sum, d) => sum + d.avgHumidity, 0) / dailySummaries.length;
    if (avgHumidity > 70) {
      tips.push('High humidity expected - pack moisture-wicking clothes and extra changes');
    }

    return tips;
  }

  /**
   * Register custom activity packing items
   */
  registerActivityPacking(activityName, items) {
    this.packingRules.activities[activityName.toLowerCase()] = items;
  }
}

module.exports = new PackingListGenerator();
