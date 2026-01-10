const express = require('express');
const router = express.Router();
const { supabase, supabaseAdmin } = require('../config/supabase');
const { requireAuth } = require('../middleware/auth');
const itineraryGenerator = require('../services/itineraryGenerator');

/**
 * @route POST /api/itineraries/generate
 * @desc Generate a new itinerary
 * @access Private
 */
router.post('/generate', requireAuth, async (req, res) => {
  try {
    const {
      destination,
      startDate,
      endDate,
      interests,
      totalBudget,
      memberCount,
      pace,
      circleId
    } = req.body;

    // Validate required fields
    if (!destination || !startDate || !endDate || !totalBudget) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: destination, startDate, endDate, totalBudget'
      });
    }

    // Get member preferences if circle
    let memberPreferences = [];
    if (circleId) {
      const { data: prefs } = await supabase
        .from('member_preferences')
        .select('*')
        .eq('circle_id', circleId);
      memberPreferences = prefs || [];
    }

    const itinerary = await itineraryGenerator.generate({
      destination,
      startDate,
      endDate,
      interests: interests || ['culture', 'food', 'nature'],
      totalBudget: parseFloat(totalBudget),
      memberCount: memberCount || 1,
      pace: pace || 'moderate',
      circleId,
      creatorId: req.user.id,
      memberPreferences
    });

    res.json({
      success: true,
      data: itinerary
    });
  } catch (error) {
    console.error('Error generating itinerary:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to generate itinerary'
    });
  }
});

/**
 * @route GET /api/itineraries/:id
 * @desc Get itinerary by ID
 * @access Private
 */
router.get('/:id', requireAuth, async (req, res) => {
  try {
    const { id } = req.params;
    
    const itinerary = await itineraryGenerator.getItineraryById(id);
    
    res.json({
      success: true,
      data: itinerary
    });
  } catch (error) {
    console.error('Error fetching itinerary:', error);
    res.status(404).json({
      success: false,
      error: 'Itinerary not found'
    });
  }
});

/**
 * @route GET /api/itineraries/circle/:circleId
 * @desc Get all itineraries for a circle
 * @access Private
 */
router.get('/circle/:circleId', requireAuth, async (req, res) => {
  try {
    const { circleId } = req.params;
    
    const { data: itineraries, error } = await supabase
      .from('itineraries')
      .select(`
        *,
        profiles:creator_id (full_name, avatar_url)
      `)
      .eq('circle_id', circleId)
      .order('created_at', { ascending: false });

    if (error) throw error;

    res.json({
      success: true,
      data: itineraries
    });
  } catch (error) {
    console.error('Error fetching itineraries:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch itineraries'
    });
  }
});

/**
 * @route GET /api/itineraries/user/my
 * @desc Get all itineraries created by current user
 * @access Private
 */
router.get('/user/my', requireAuth, async (req, res) => {
  try {
    const { data: itineraries, error } = await supabase
      .from('itineraries')
      .select(`
        *,
        travel_circles (name, destination)
      `)
      .eq('creator_id', req.user.id)
      .order('created_at', { ascending: false });

    if (error) throw error;

    res.json({
      success: true,
      data: itineraries
    });
  } catch (error) {
    console.error('Error fetching user itineraries:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch itineraries'
    });
  }
});

/**
 * @route PUT /api/itineraries/:id/status
 * @desc Update itinerary status
 * @access Private
 */
router.put('/:id/status', requireAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const validStatuses = ['draft', 'generated', 'in_review', 'confirmed', 'completed'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid status'
      });
    }

    const client = supabaseAdmin || supabase;
    const { data, error } = await client
      .from('itineraries')
      .update({ status })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    res.json({
      success: true,
      data
    });
  } catch (error) {
    console.error('Error updating itinerary status:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update status'
    });
  }
});

/**
 * @route POST /api/itineraries/:id/preferences
 * @desc Submit member preferences for itinerary
 * @access Private
 */
router.post('/:id/preferences', requireAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const {
      cultureRating,
      foodRating,
      adventureRating,
      natureRating,
      shoppingRating,
      nightlifeRating,
      relaxationRating,
      maxBudget,
      preferredPace,
      restrictions
    } = req.body;

    const preferences = await itineraryGenerator.saveMemberPreferences(id, req.user.id, {
      culture_rating: cultureRating,
      food_rating: foodRating,
      adventure_rating: adventureRating,
      nature_rating: natureRating,
      shopping_rating: shoppingRating,
      nightlife_rating: nightlifeRating,
      relaxation_rating: relaxationRating,
      max_budget: maxBudget,
      preferred_pace: preferredPace,
      dietary_restrictions: restrictions
    });

    res.json({
      success: true,
      data: preferences
    });
  } catch (error) {
    console.error('Error saving preferences:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to save preferences'
    });
  }
});

/**
 * @route POST /api/itineraries/activities/:activityId/vote
 * @desc Vote on an activity
 * @access Private
 */
router.post('/activities/:activityId/vote', requireAuth, async (req, res) => {
  try {
    const { activityId } = req.params;
    const { voteType, comment } = req.body;

    const validVotes = ['upvote', 'downvote', 'neutral'];
    if (!validVotes.includes(voteType)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid vote type'
      });
    }

    const vote = await itineraryGenerator.voteOnActivity(
      activityId,
      req.user.id,
      voteType,
      comment
    );

    res.json({
      success: true,
      data: vote
    });
  } catch (error) {
    console.error('Error voting on activity:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to save vote'
    });
  }
});

/**
 * @route PUT /api/itineraries/days/:dayId/reorder
 * @desc Reorder activities in a day
 * @access Private
 */
router.put('/days/:dayId/reorder', requireAuth, async (req, res) => {
  try {
    const { dayId } = req.params;
    const { activityIds } = req.body;

    if (!Array.isArray(activityIds)) {
      return res.status(400).json({
        success: false,
        error: 'activityIds must be an array'
      });
    }

    await itineraryGenerator.reorderActivities(dayId, activityIds);

    res.json({
      success: true,
      message: 'Activities reordered successfully'
    });
  } catch (error) {
    console.error('Error reordering activities:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to reorder activities'
    });
  }
});

/**
 * @route DELETE /api/itineraries/activities/:activityId
 * @desc Delete an activity
 * @access Private
 */
router.delete('/activities/:activityId', requireAuth, async (req, res) => {
  try {
    const { activityId } = req.params;

    await itineraryGenerator.deleteActivity(activityId);

    res.json({
      success: true,
      message: 'Activity deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting activity:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to delete activity'
    });
  }
});

/**
 * @route POST /api/itineraries/:id/activities
 * @desc Add a custom activity to the itinerary
 * @access Private
 */
router.post('/:id/activities', requireAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const {
      dayId,
      name,
      description,
      category,
      startTime,
      endTime,
      estimatedCost,
      sequenceOrder
    } = req.body;

    const client = supabaseAdmin || supabase;
    
    const duration = calculateDuration(startTime, endTime);
    
    const { data: activity, error } = await client
      .from('itinerary_activities')
      .insert({
        day_id: dayId,
        itinerary_id: id,
        name,
        description,
        category: category || 'custom',
        start_time: startTime,
        end_time: endTime,
        duration_minutes: duration,
        estimated_cost: estimatedCost || 0,
        sequence_order: sequenceOrder || 99,
        is_custom: true
      })
      .select()
      .single();

    if (error) throw error;

    // Update day's planned budget
    await updateDayBudget(dayId);

    res.json({
      success: true,
      data: activity
    });
  } catch (error) {
    console.error('Error adding activity:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to add activity'
    });
  }
});

// Helper functions
function calculateDuration(startTime, endTime) {
  const [startHour, startMin] = startTime.split(':').map(Number);
  const [endHour, endMin] = endTime.split(':').map(Number);
  return (endHour * 60 + endMin) - (startHour * 60 + startMin);
}

async function updateDayBudget(dayId) {
  const { data: activities } = await supabase
    .from('itinerary_activities')
    .select('estimated_cost')
    .eq('day_id', dayId);

  const totalCost = activities?.reduce((sum, a) => sum + (a.estimated_cost || 0), 0) || 0;

  const client = supabaseAdmin || supabase;
  await client
    .from('itinerary_days')
    .update({ planned_budget: totalCost })
    .eq('id', dayId);
}

module.exports = router;
