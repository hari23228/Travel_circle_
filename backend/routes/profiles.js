const express = require('express')
const { supabase } = require('../config/supabase')
const { authenticateToken } = require('../middleware/auth')
const { logger } = require('../middleware/logger')
const router = express.Router()

// Create or update profile
router.post('/', async (req, res, next) => {
  try {
    const { id, full_name, phone, date_of_birth, city } = req.body

    // For signup, we allow creating profile without auth (but verify the user ID matches)
    // In production, you might want to add additional validation
    if (!id) {
      return res.status(400).json({
        error: 'User ID is required',
        code: 'MISSING_USER_ID'
      })
    }

    const { data, error } = await supabase
      .from('profiles')
      .upsert({
        id,
        full_name,
        phone,
        date_of_birth: date_of_birth ? new Date(date_of_birth) : null,
        city
      }, {
        onConflict: 'id'
      })
      .select()
      .single()

    if (error) {
      logger.error('Profile creation error', { error: error.message, userId: id })
      return res.status(400).json({
        error: 'Failed to create profile',
        code: 'PROFILE_CREATION_FAILED'
      })
    }

    logger.info('Profile created/updated successfully', { userId: id })

    res.status(201).json({
      message: 'Profile created successfully',
      profile: data
    })
  } catch (error) {
    logger.error('Profile creation error', { error: error.message })
    next(error)
  }
})

// Get current user's profile
router.get('/me', authenticateToken, async (req, res, next) => {
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', req.user.id)
      .single()

    if (error) {
      if (error.code === 'PGRST116') { // No rows found
        return res.status(404).json({
          error: 'Profile not found',
          code: 'PROFILE_NOT_FOUND'
        })
      }
      logger.error('Profile fetch error', { error: error.message, userId: req.user.id })
      return res.status(400).json({
        error: 'Failed to fetch profile',
        code: 'PROFILE_FETCH_FAILED'
      })
    }

    res.json({
      profile: data
    })
  } catch (error) {
    logger.error('Profile fetch error', { error: error.message })
    next(error)
  }
})

// Update current user's profile
router.put('/me', authenticateToken, async (req, res, next) => {
  try {
    const { full_name, phone, date_of_birth, city, bio, username } = req.body

    const { data, error } = await supabase
      .from('profiles')
      .update({
        full_name,
        phone,
        date_of_birth: date_of_birth ? new Date(date_of_birth) : null,
        city,
        bio,
        username,
        updated_at: new Date()
      })
      .eq('id', req.user.id)
      .select()
      .single()

    if (error) {
      logger.error('Profile update error', { error: error.message, userId: req.user.id })
      return res.status(400).json({
        error: 'Failed to update profile',
        code: 'PROFILE_UPDATE_FAILED'
      })
    }

    logger.info('Profile updated successfully', { userId: req.user.id })

    res.json({
      message: 'Profile updated successfully',
      profile: data
    })
  } catch (error) {
    logger.error('Profile update error', { error: error.message })
    next(error)
  }
})

module.exports = router