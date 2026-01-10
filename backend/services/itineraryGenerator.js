const { supabase, supabaseAdmin } = require('../config/supabase');
const Groq = require('groq-sdk');
const { GoogleGenerativeAI } = require('@google/generative-ai');

// Initialize AI services
const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY || 'demo-key',
});

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || 'demo-key');

// In-memory storage for temporary itineraries (when database tables don't exist)
const tempItineraryStorage = new Map();

class ItineraryGenerator {
  constructor() {
    this.preferredModel = process.env.GROQ_API_KEY ? 'groq' : (process.env.GEMINI_API_KEY ? 'gemini' : 'algorithmic');
    this.groqModel = 'llama-3.3-70b-versatile';
    this.geminiModel = genAI.getGenerativeModel({ model: 'gemini-pro' });
  }

  /**
   * Main generation flow - Budget-First approach
   */
  async generate(params) {
    const {
      destination,
      startDate,
      endDate,
      interests,
      totalBudget,
      memberCount,
      pace = 'moderate',
      circleId,
      creatorId,
      memberPreferences = []
    } = params;

    // Calculate days
    const start = new Date(startDate);
    const end = new Date(endDate);
    const totalDays = Math.ceil((end - start) / (1000 * 60 * 60 * 24)) + 1;

    // Budget calculations (DIFFERENTIATOR #1: Budget-First)
    const perPersonBudget = totalBudget / memberCount;
    const perDayBudget = perPersonBudget / totalDays;

    // Aggregate member preferences (DIFFERENTIATOR #2: Circle Consensus)
    const aggregatedInterests = this.aggregatePreferences(interests, memberPreferences);

    // Get attractions for destination
    const attractions = await this.fetchAttractions(destination, aggregatedInterests);

    // Generate AI-powered itinerary
    const itineraryPlan = await this.generateWithAI({
      destination,
      totalDays,
      perDayBudget,
      totalBudget: perPersonBudget,
      interests: aggregatedInterests,
      pace,
      attractions
    });

    // Try to save to database, but return AI result even if database fails
    try {
      const itinerary = await this.saveItinerary({
        circleId,
        creatorId,
        destination,
        startDate,
        endDate,
        totalDays,
        totalBudget,
        perPersonBudget,
        perDayBudget,
        interests: aggregatedInterests,
        pace,
        plan: itineraryPlan
      });
      return itinerary;
    } catch (dbError) {
      console.warn('⚠️ Database save failed, returning AI-generated itinerary without persistence:', dbError.message);
      
      // Return the AI-generated itinerary directly without database
      const tempId = `temp-${Date.now()}`;
      
      // Calculate budget status
      const plannedSpend = itineraryPlan.budgetSummary?.plannedSpend || 0;
      const budgetStatus = {
        totalBudget: perPersonBudget,
        plannedSpend: plannedSpend,
        remaining: perPersonBudget - plannedSpend,
        isUnderBudget: plannedSpend <= perPersonBudget,
        percentUsed: ((plannedSpend / perPersonBudget) * 100).toFixed(1)
      };
      
      const tempItinerary = {
        id: tempId,
        title: `${destination} Adventure`,
        destination,
        start_date: startDate,
        end_date: endDate,
        total_days: totalDays,
        total_budget: totalBudget,
        per_person_budget: perPersonBudget,
        per_day_budget: perDayBudget,
        interests: aggregatedInterests,
        pace,
        status: 'generated',
        ai_model_used: this.preferredModel,
        planned_spend: plannedSpend,
        currency: 'INR',
        budgetStatus: budgetStatus,
        memberPreferences: memberPreferences || [],
        days: itineraryPlan.days?.map((day, idx) => {
          const dayDate = new Date(new Date(startDate).getTime() + idx * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
          return {
            id: `temp-day-${idx + 1}`,
            day_number: day.dayNumber || idx + 1,
            date: dayDate,
            theme: day.theme || 'Explore',
            planned_budget: day.dailyBudget || perDayBudget,
            actual_spend: 0,
            notes: day.notes || '',
            itinerary_activities: day.activities?.map((act, actIdx) => ({
              id: `temp-act-${idx + 1}-${actIdx + 1}`,
              sequence_order: actIdx + 1,
              title: act.name || act.title || 'Activity',
              name: act.name || act.title || 'Activity',
              description: act.description || '',
              category: act.category || 'activity',
              start_time: act.startTime || act.start_time || '09:00',
              end_time: act.endTime || act.end_time || '10:00',
              duration_minutes: act.durationMinutes || act.duration_minutes || 60,
              estimated_cost: act.estimatedCost || act.estimated_cost || 0,
              cost_category: this.getCostCategory(act.estimatedCost || act.estimated_cost || 0),
              tips: act.tips || '',
              is_buffer_time: act.isBuffer || false,
              rating: act.rating || 4.0
            })) || []
          };
        }) || [],
        budget_summary: itineraryPlan.budgetSummary,
        created_at: new Date().toISOString()
      };
      
      // Store in memory for later retrieval
      tempItineraryStorage.set(tempId, tempItinerary);
      console.log(`📦 Stored temporary itinerary: ${tempId}`);
      
      return tempItinerary;
    }
  }

  /**
   * Aggregate preferences from all circle members
   * DIFFERENTIATOR #2: Circle Consensus Builder
   */
  aggregatePreferences(defaultInterests, memberPreferences) {
    if (!memberPreferences || memberPreferences.length === 0) {
      return defaultInterests;
    }

    // Calculate weighted average for each interest
    const interestScores = {
      culture: 0,
      food: 0,
      adventure: 0,
      nature: 0,
      shopping: 0,
      nightlife: 0,
      relaxation: 0
    };

    memberPreferences.forEach(pref => {
      interestScores.culture += pref.culture_rating || 3;
      interestScores.food += pref.food_rating || 3;
      interestScores.adventure += pref.adventure_rating || 3;
      interestScores.nature += pref.nature_rating || 3;
      interestScores.shopping += pref.shopping_rating || 3;
      interestScores.nightlife += pref.nightlife_rating || 3;
      interestScores.relaxation += pref.relaxation_rating || 3;
    });

    const memberCount = memberPreferences.length;
    
    // Normalize and rank interests
    const rankedInterests = Object.entries(interestScores)
      .map(([interest, score]) => ({
        interest,
        avgScore: score / memberCount
      }))
      .sort((a, b) => b.avgScore - a.avgScore)
      .filter(item => item.avgScore >= 3) // Only include interests with avg 3+
      .map(item => item.interest);

    return rankedInterests.length > 0 ? rankedInterests : defaultInterests;
  }

  /**
   * Fetch attractions from database or API
   */
  async fetchAttractions(destination, interests) {
    // Try to get from our attractions database first
    const { data: localAttractions, error } = await supabase
      .from('attractions')
      .select('*')
      .ilike('destination', `%${destination}%`)
      .in('category', this.mapInterestsToCategories(interests))
      .order('popularity_score', { ascending: false })
      .limit(50);

    if (localAttractions && localAttractions.length > 10) {
      return localAttractions;
    }

    // If not enough local data, generate sample attractions
    // In production, this would call Google Places API
    return this.generateSampleAttractions(destination, interests);
  }

  /**
   * Map user interests to attraction categories
   */
  mapInterestsToCategories(interests) {
    const mapping = {
      culture: ['attraction', 'museum', 'temple', 'historical'],
      food: ['restaurant', 'cafe', 'street_food', 'market'],
      adventure: ['activity', 'outdoor', 'sports', 'adventure'],
      nature: ['park', 'beach', 'nature', 'garden'],
      shopping: ['shopping', 'market', 'mall'],
      nightlife: ['nightlife', 'bar', 'club'],
      relaxation: ['spa', 'beach', 'park', 'cafe']
    };

    const categories = new Set();
    interests.forEach(interest => {
      const cats = mapping[interest] || [interest];
      cats.forEach(cat => categories.add(cat));
    });

    return Array.from(categories);
  }

  /**
   * Generate sample attractions for demo purposes
   */
  generateSampleAttractions(destination, interests) {
    const attractionTemplates = {
      culture: [
        { name: 'Historical Museum', duration: 120, cost: 500, category: 'attraction' },
        { name: 'Ancient Temple', duration: 90, cost: 200, category: 'attraction' },
        { name: 'Art Gallery', duration: 90, cost: 300, category: 'attraction' },
        { name: 'Heritage Walk', duration: 150, cost: 800, category: 'activity' }
      ],
      food: [
        { name: 'Local Food Tour', duration: 180, cost: 1500, category: 'activity' },
        { name: 'Street Food Market', duration: 90, cost: 500, category: 'restaurant' },
        { name: 'Traditional Restaurant', duration: 90, cost: 1200, category: 'restaurant' },
        { name: 'Cooking Class', duration: 180, cost: 2000, category: 'activity' }
      ],
      adventure: [
        { name: 'Trekking Trail', duration: 240, cost: 1000, category: 'activity' },
        { name: 'Water Sports', duration: 180, cost: 2500, category: 'activity' },
        { name: 'Cycling Tour', duration: 180, cost: 800, category: 'activity' },
        { name: 'Rock Climbing', duration: 150, cost: 1500, category: 'activity' }
      ],
      nature: [
        { name: 'Botanical Garden', duration: 120, cost: 300, category: 'park' },
        { name: 'Scenic Viewpoint', duration: 60, cost: 0, category: 'nature' },
        { name: 'Beach Visit', duration: 180, cost: 0, category: 'beach' },
        { name: 'Nature Reserve', duration: 240, cost: 500, category: 'nature' }
      ],
      shopping: [
        { name: 'Local Market', duration: 120, cost: 0, category: 'shopping' },
        { name: 'Handicraft Village', duration: 150, cost: 0, category: 'shopping' },
        { name: 'Shopping Mall', duration: 180, cost: 0, category: 'shopping' }
      ],
      relaxation: [
        { name: 'Spa & Wellness', duration: 120, cost: 2500, category: 'spa' },
        { name: 'Sunset Point', duration: 60, cost: 0, category: 'nature' },
        { name: 'Garden Cafe', duration: 90, cost: 500, category: 'cafe' }
      ]
    };

    const attractions = [];
    let id = 1;

    interests.forEach(interest => {
      const templates = attractionTemplates[interest] || attractionTemplates.culture;
      templates.forEach(template => {
        attractions.push({
          id: `sample-${id++}`,
          name: `${template.name} - ${destination}`,
          description: `Experience ${template.name.toLowerCase()} in beautiful ${destination}`,
          destination,
          category: template.category,
          estimated_cost: template.cost,
          typical_duration_minutes: template.duration,
          cost_category: this.getCostCategory(template.cost),
          rating: 4.0 + Math.random(),
          latitude: 0,
          longitude: 0
        });
      });
    });

    return attractions;
  }

  getCostCategory(cost) {
    if (cost === 0) return 'free';
    if (cost < 500) return 'budget';
    if (cost < 1500) return 'medium';
    return 'expensive';
  }

  /**
   * Generate itinerary using AI (Google Gemini)
   * BUDGET-FIRST: AI plans within budget constraints
   */
  async generateWithAI(params) {
    const { destination, totalDays, perDayBudget, totalBudget, interests, pace, attractions } = params;

    const paceConfig = {
      relaxed: { activitiesPerDay: 3, bufferMinutes: 60 },
      moderate: { activitiesPerDay: 4, bufferMinutes: 45 },
      packed: { activitiesPerDay: 6, bufferMinutes: 30 }
    };

    const config = paceConfig[pace];

    // Prepare attractions list for AI
    const attractionsList = attractions.slice(0, 30).map(a => ({
      name: a.name,
      category: a.category,
      cost: a.estimated_cost,
      duration: a.typical_duration_minutes,
      rating: a.rating
    }));

    const prompt = `
You are a travel itinerary planner. Create a ${totalDays}-day itinerary for ${destination}.

CRITICAL CONSTRAINTS (Budget-First Planning):
- Total budget per person: ₹${totalBudget}
- Daily budget per person: ₹${perDayBudget}
- The itinerary MUST stay within budget
- Balance expensive days with cheaper days

User preferences:
- Interests: ${interests.join(', ')}
- Pace: ${pace} (${config.activitiesPerDay} activities per day)

Available attractions (with costs in INR):
${JSON.stringify(attractionsList, null, 2)}

Create a JSON response with this exact structure:
{
  "days": [
    {
      "dayNumber": 1,
      "theme": "Theme for the day",
      "activities": [
        {
          "name": "Activity name",
          "description": "Brief description",
          "category": "attraction/restaurant/activity",
          "startTime": "09:00",
          "endTime": "11:00",
          "durationMinutes": 120,
          "estimatedCost": 500,
          "tips": "Pro tip for this activity"
        }
      ],
      "dailyBudget": 2000,
      "notes": "Day summary"
    }
  ],
  "totalPlannedCost": 8000,
  "budgetSummary": {
    "totalBudget": ${totalBudget},
    "plannedSpend": 8000,
    "buffer": 2000
  }
}

Rules:
1. Start each day at 9 AM, end by 9 PM
2. Include meal breaks (breakfast, lunch, dinner)
3. Add 30-45 minutes buffer between activities
4. Group nearby attractions on the same day
5. Mix free and paid activities to stay within budget
6. Include one "splurge" activity and balance with budget-friendly options
7. Each day should have a clear theme

Return ONLY valid JSON, no markdown or explanations.
`;

    // Try Groq first (fastest)
    if (this.preferredModel === 'groq' || this.preferredModel === 'algorithmic') {
      try {
        console.log('🔄 Generating itinerary with Groq AI...');
        const chatCompletion = await groq.chat.completions.create({
          messages: [
            {
              role: 'user',
              content: prompt
            }
          ],
          model: this.groqModel,
          temperature: 0.7,
          max_tokens: 2048,
          top_p: 1,
          stream: false,
        });

        const text = chatCompletion.choices[0]?.message?.content || '';

        // Clean and parse JSON from response
        let cleanedText = text.trim();
        
        // Remove markdown code blocks if present
        cleanedText = cleanedText.replace(/```json\s*/g, '').replace(/```\s*/g, '');
        
        // Find the JSON object
        const jsonMatch = cleanedText.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          try {
            // Clean up common JSON issues
            let jsonStr = jsonMatch[0];
            
            // Fix trailing commas before closing brackets
            jsonStr = jsonStr.replace(/,(\s*[}\]])/g, '$1');
            
            // Parse and validate
            const parsed = JSON.parse(jsonStr);
            console.log('✅ Groq AI generation successful');
            return parsed;
          } catch (parseError) {
            console.warn('⚠️ Groq JSON parsing failed:', parseError.message);
            throw parseError;
          }
        }
      } catch (error) {
        console.warn('⚠️ Groq AI failed, trying Gemini...', error.message);
      }
    }

    // Try Gemini as fallback
    if (this.preferredModel === 'gemini' || this.preferredModel === 'algorithmic') {
      try {
        console.log('🔄 Generating itinerary with Gemini AI...');
        const result = await this.geminiModel.generateContent(prompt);
        const response = await result.response;
        const text = response.text();

        // Clean and parse JSON from response
        let cleanedText = text.trim();
        
        // Remove markdown code blocks if present
        cleanedText = cleanedText.replace(/```json\s*/g, '').replace(/```\s*/g, '');
        
        // Find the JSON object
        const jsonMatch = cleanedText.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          try {
            // Clean up common JSON issues
            let jsonStr = jsonMatch[0];
            
            // Fix trailing commas before closing brackets
            jsonStr = jsonStr.replace(/,(\s*[}\]])/g, '$1');
            
            // Parse and validate
            const parsed = JSON.parse(jsonStr);
            console.log('✅ Gemini AI generation successful');
            return parsed;
          } catch (parseError) {
            console.warn('⚠️ Gemini JSON parsing failed:', parseError.message);
            throw parseError;
          }
        }
      } catch (error) {
        console.warn('⚠️ Gemini AI failed, using algorithmic generation...', error.message);
      }
    }

    // Final fallback to algorithmic generation
    console.log('🔄 Using algorithmic generation as final fallback...');
    return this.generateAlgorithmically(params, attractions, config);
  }

  /**
   * Fallback algorithm-based generation if AI fails
   */
  generateAlgorithmically(params, attractions, config) {
    const { totalDays, perDayBudget, totalBudget, interests } = params;
    
    const days = [];
    let totalPlannedCost = 0;
    const usedAttractions = new Set();

    // Day themes based on interests
    const themes = [
      'Cultural Exploration',
      'Local Food & Markets',
      'Nature & Relaxation',
      'Adventure Day',
      'Shopping & Leisure'
    ];

    for (let dayNum = 1; dayNum <= totalDays; dayNum++) {
      const dayActivities = [];
      let dayBudget = 0;
      let currentTime = 9 * 60; // Start at 9 AM in minutes
      const endTime = 21 * 60; // End at 9 PM

      // Add breakfast
      dayActivities.push({
        name: 'Breakfast',
        category: 'restaurant',
        startTime: this.formatTime(currentTime),
        endTime: this.formatTime(currentTime + 60),
        durationMinutes: 60,
        estimatedCost: 300,
        description: 'Start your day with a hearty breakfast',
        isBuffer: false
      });
      dayBudget += 300;
      currentTime += 60 + config.bufferMinutes;

      // Add main activities
      const availableAttractions = attractions.filter(a => !usedAttractions.has(a.id));
      
      for (let i = 0; i < config.activitiesPerDay - 2 && currentTime < endTime - 180; i++) {
        // Find best attraction within budget
        const budgetLeft = perDayBudget - dayBudget;
        const suitable = availableAttractions
          .filter(a => a.estimated_cost <= budgetLeft && !usedAttractions.has(a.id))
          .sort((a, b) => (b.rating || 0) - (a.rating || 0));

        if (suitable.length === 0) break;

        const attraction = suitable[0];
        usedAttractions.add(attraction.id);

        dayActivities.push({
          name: attraction.name,
          category: attraction.category,
          startTime: this.formatTime(currentTime),
          endTime: this.formatTime(currentTime + attraction.typical_duration_minutes),
          durationMinutes: attraction.typical_duration_minutes,
          estimatedCost: attraction.estimated_cost,
          description: attraction.description || `Visit ${attraction.name}`,
          costCategory: attraction.cost_category,
          rating: attraction.rating
        });

        dayBudget += attraction.estimated_cost;
        currentTime += attraction.typical_duration_minutes + config.bufferMinutes;

        // Add lunch after 2nd activity
        if (i === 1 && currentTime < 15 * 60) {
          dayActivities.push({
            name: 'Lunch Break',
            category: 'restaurant',
            startTime: this.formatTime(currentTime),
            endTime: this.formatTime(currentTime + 90),
            durationMinutes: 90,
            estimatedCost: 600,
            description: 'Enjoy local cuisine for lunch',
            isBuffer: false
          });
          dayBudget += 600;
          currentTime += 90 + config.bufferMinutes;
        }
      }

      // Add dinner
      dayActivities.push({
        name: 'Dinner',
        category: 'restaurant',
        startTime: this.formatTime(Math.max(currentTime, 19 * 60)),
        endTime: this.formatTime(Math.max(currentTime, 19 * 60) + 90),
        durationMinutes: 90,
        estimatedCost: 800,
        description: 'End your day with a delicious dinner',
        isBuffer: false
      });
      dayBudget += 800;

      totalPlannedCost += dayBudget;

      days.push({
        dayNumber: dayNum,
        theme: themes[(dayNum - 1) % themes.length],
        activities: dayActivities,
        dailyBudget: dayBudget,
        notes: `Day ${dayNum} focuses on ${themes[(dayNum - 1) % themes.length].toLowerCase()}`
      });
    }

    return {
      days,
      totalPlannedCost,
      budgetSummary: {
        totalBudget,
        plannedSpend: totalPlannedCost,
        buffer: totalBudget - totalPlannedCost,
        isUnderBudget: totalPlannedCost <= totalBudget
      }
    };
  }

  formatTime(minutes) {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`;
  }

  /**
   * Save itinerary to database
   */
  async saveItinerary(data) {
    const {
      circleId,
      creatorId,
      destination,
      startDate,
      endDate,
      totalDays,
      totalBudget,
      perPersonBudget,
      perDayBudget,
      interests,
      pace,
      plan
    } = data;

    const client = supabaseAdmin || supabase;

    // Create main itinerary record
    const { data: itinerary, error: itineraryError } = await client
      .from('itineraries')
      .insert({
        circle_id: circleId,
        creator_id: creatorId,
        title: `${destination} Adventure`,
        destination,
        start_date: startDate,
        end_date: endDate,
        total_days: totalDays,
        total_budget: totalBudget,
        per_person_budget: perPersonBudget,
        per_day_budget: perDayBudget,
        planned_spend: plan.totalPlannedCost,
        interests,
        pace,
        status: 'generated'
      })
      .select()
      .single();

    if (itineraryError) {
      console.error('Error creating itinerary:', itineraryError);
      throw new Error('Failed to create itinerary');
    }

    // Create days and activities
    for (const day of plan.days) {
      const dayDate = new Date(startDate);
      dayDate.setDate(dayDate.getDate() + day.dayNumber - 1);

      const { data: dayRecord, error: dayError } = await client
        .from('itinerary_days')
        .insert({
          itinerary_id: itinerary.id,
          day_number: day.dayNumber,
          date: dayDate.toISOString().split('T')[0],
          theme: day.theme,
          planned_budget: day.dailyBudget,
          notes: day.notes
        })
        .select()
        .single();

      if (dayError) {
        console.error('Error creating day:', dayError);
        continue;
      }

      // Create activities
      for (let i = 0; i < day.activities.length; i++) {
        const activity = day.activities[i];
        
        await client
          .from('itinerary_activities')
          .insert({
            day_id: dayRecord.id,
            itinerary_id: itinerary.id,
            sequence_order: i + 1,
            name: activity.name,
            description: activity.description,
            category: activity.category,
            start_time: activity.startTime,
            end_time: activity.endTime,
            duration_minutes: activity.durationMinutes,
            estimated_cost: activity.estimatedCost,
            cost_category: activity.costCategory || 'medium',
            tips: activity.tips,
            is_buffer_time: activity.isBuffer || false,
            rating: activity.rating
          });
      }
    }

    // Fetch complete itinerary with all relations
    return this.getItineraryById(itinerary.id);
  }

  /**
   * Get itinerary by ID with all related data
   */
  async getItineraryById(itineraryId) {
    // Check if it's a temporary itinerary first
    if (itineraryId.startsWith('temp-')) {
      const tempItinerary = tempItineraryStorage.get(itineraryId);
      if (tempItinerary) {
        console.log(`📦 Retrieved temporary itinerary: ${itineraryId}`);
        return tempItinerary;
      }
      throw new Error('Temporary itinerary expired or not found');
    }
    
    const { data: itinerary, error } = await supabase
      .from('itineraries')
      .select(`
        *,
        travel_circles (id, name, destination, current_amount, target_amount),
        profiles:creator_id (id, full_name, avatar_url)
      `)
      .eq('id', itineraryId)
      .single();

    if (error) {
      throw new Error('Itinerary not found');
    }

    // Get days with activities
    const { data: days } = await supabase
      .from('itinerary_days')
      .select(`
        *,
        itinerary_activities (
          *,
          activity_votes (
            id,
            vote_type,
            user_id,
            profiles:user_id (full_name, avatar_url)
          )
        )
      `)
      .eq('itinerary_id', itineraryId)
      .order('day_number', { ascending: true });

    // Get member preferences if circle
    let memberPreferences = [];
    if (itinerary.circle_id) {
      const { data: prefs } = await supabase
        .from('member_preferences')
        .select(`
          *,
          profiles:user_id (full_name, avatar_url)
        `)
        .eq('itinerary_id', itineraryId);
      
      memberPreferences = prefs || [];
    }

    return {
      ...itinerary,
      days: days || [],
      memberPreferences,
      budgetStatus: {
        totalBudget: itinerary.total_budget,
        plannedSpend: itinerary.planned_spend,
        remaining: itinerary.total_budget - itinerary.planned_spend,
        isUnderBudget: itinerary.planned_spend <= itinerary.total_budget,
        percentUsed: ((itinerary.planned_spend / itinerary.total_budget) * 100).toFixed(1)
      }
    };
  }

  /**
   * Update activity order (for customization)
   */
  async reorderActivities(dayId, activityIds) {
    const client = supabaseAdmin || supabase;
    
    for (let i = 0; i < activityIds.length; i++) {
      await client
        .from('itinerary_activities')
        .update({ sequence_order: i + 1 })
        .eq('id', activityIds[i]);
    }
  }

  /**
   * Delete activity
   */
  async deleteActivity(activityId) {
    const client = supabaseAdmin || supabase;
    
    await client
      .from('itinerary_activities')
      .delete()
      .eq('id', activityId);
  }

  /**
   * Add vote for activity (Circle Consensus)
   */
  async voteOnActivity(activityId, userId, voteType, comment) {
    const client = supabaseAdmin || supabase;
    
    const { data, error } = await client
      .from('activity_votes')
      .upsert({
        activity_id: activityId,
        user_id: userId,
        vote_type: voteType,
        comment
      }, {
        onConflict: 'activity_id,user_id'
      })
      .select()
      .single();

    return data;
  }

  /**
   * Save member preferences
   */
  async saveMemberPreferences(itineraryId, userId, preferences) {
    const client = supabaseAdmin || supabase;
    
    const { data, error } = await client
      .from('member_preferences')
      .upsert({
        itinerary_id: itineraryId,
        user_id: userId,
        ...preferences
      }, {
        onConflict: 'itinerary_id,user_id'
      })
      .select()
      .single();

    return data;
  }
}

module.exports = new ItineraryGenerator();
