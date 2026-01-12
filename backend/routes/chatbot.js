/**
 * Chatbot Routes
 * API endpoints for chatbot interactions with enhanced model routing
 */

const express = require('express');
const router = express.Router();
const chatbotController = require('../chatbot/controller');
const enhancedController = require('../chatbot/enhancedController');
const { authenticateToken, optionalAuth } = require('../middleware/auth');
const { logger } = require('../middleware/logger');

/**
 * POST /api/chatbot/message
 * Send a message to the chatbot with model routing support
 * Supports mode: 'weather' (Gemini) or 'itinerary' (Groq)
 */
router.post('/message', optionalAuth, async (req, res) => {
  try {
    const { message, metadata, mode } = req.body;
    const userId = req.user?.id || `guest_${req.ip.replace(/[.:]/g, '_')}`;

    if (!message || typeof message !== 'string') {
      return res.status(400).json({
        success: false,
        error: 'Message is required and must be a string'
      });
    }

    // Use enhanced controller if mode is specified, otherwise use original
    const controller = mode ? enhancedController : chatbotController;

    const response = await controller.processMessage({
      userId,
      message: message.trim(),
      mode,
      metadata: metadata || {}
    });

    res.json(response);
  } catch (error) {
    logger.error('Chatbot message error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to process message'
    });
  }
});

/**
 * GET /api/chatbot/context
 * Get current conversation context
 */
router.get('/context', optionalAuth, async (req, res) => {
  try {
    const userId = req.user?.id || `guest_${req.ip.replace(/[.:]/g, '_')}`;
    const result = await chatbotController.getContext(userId);
    res.json(result);
  } catch (error) {
    logger.error('Get context error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve context'
    });
  }
});

/**
 * POST /api/chatbot/context
 * Update conversation context
 */
router.post('/context', optionalAuth, async (req, res) => {
  try {
    const userId = req.user?.id || `guest_${req.ip.replace(/[.:]/g, '_')}`;
    const { destination, travelDates, activities, preferences } = req.body;

    const contextManager = require('../chatbot/contextManager');
    const context = await contextManager.updateContext(userId, {
      destination,
      travelDates,
      activities,
      preferences
    });

    res.json({
      success: true,
      context
    });
  } catch (error) {
    logger.error('Update context error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update context'
    });
  }
});

/**
 * DELETE /api/chatbot/context
 * Clear conversation context
 */
router.delete('/context', optionalAuth, async (req, res) => {
  try {
    const userId = req.user?.id || `guest_${req.ip.replace(/[.:]/g, '_')}`;
    const result = await chatbotController.clearContext(userId);
    res.json(result);
  } catch (error) {
    logger.error('Clear context error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to clear context'
    });
  }
});

/**
 * GET /api/chatbot/features
 * Get list of available chatbot features
 */
router.get('/features', async (req, res) => {
  try {
    const featureRegistry = require('../chatbot/features');
    const features = featureRegistry.getRegisteredIntents();
    
    res.json({
      success: true,
      features,
      description: {
        weather: 'Get weather forecasts, activity recommendations, and packing suggestions',
        general: 'General conversation and help'
      }
    });
  } catch (error) {
    logger.error('Get features error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve features'
    });
  }
});

module.exports = router;
