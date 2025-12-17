const express = require('express')
const { supabase } = require('../config/supabase')
const { authenticateToken } = require('../middleware/auth')
const { validateUpdateProfile, validatePagination } = require('../middleware/validation')
const { logger } = require('../middleware/logger')
const router = express.Router()

// Get user profile
router.get('/profile', authenticateToken, async (req, res, next) => {
  try {
    const { data: profile, error } = await supabase
      .from('user_dashboard_stats')
      .select('*')
      .eq('id', req.userId)
      .single()

    if (error) {
      logger.error('Profile fetch error', { error: error.message, userId: req.userId })
      return res.status(404).json({
        error: 'Profile not found',
        code: 'PROFILE_NOT_FOUND'
      })
    }

    res.json({ profile })

  } catch (error) {
    next(error)
  }
})

// Update user profile
router.put('/profile', authenticateToken, validateUpdateProfile, async (req, res, next) => {
  try {
    const updates = req.body

    // Update profile
    const { data: profile, error } = await supabase
      .from('profiles')
      .update({
        ...updates,
        updated_at: new Date().toISOString()
      })
      .eq('id', req.userId)
      .select()
      .single()

    if (error) {
      logger.error('Profile update error', { error: error.message, userId: req.userId })
      
      if (error.code === '23505') {
        return res.status(409).json({
          error: 'Username or phone already taken',
          code: 'DUPLICATE_PROFILE_DATA'
        })
      }
      
      return res.status(400).json({
        error: 'Failed to update profile',
        code: 'PROFILE_UPDATE_FAILED'
      })
    }

    logger.info('Profile updated successfully', { userId: req.userId })

    res.json({
      message: 'Profile updated successfully',
      profile
    })

  } catch (error) {
    next(error)
  }
})

// Get user's circles
router.get('/circles', authenticateToken, validatePagination, async (req, res, next) => {
  try {
    const { page, limit, sort, order } = req.query
    const offset = (page - 1) * limit

    const { data: circles, error, count } = await supabase
      .from('circle_details')
      .select(`
        *,
        circle_memberships!inner(role, contribution_amount, joined_at)
      `, { count: 'exact' })
      .eq('circle_memberships.user_id', req.userId)
      .eq('circle_memberships.is_active', true)
      .order(sort, { ascending: order === 'asc' })
      .range(offset, offset + limit - 1)

    if (error) {
      logger.error('User circles fetch error', { error: error.message, userId: req.userId })
      return res.status(500).json({
        error: 'Failed to fetch circles',
        code: 'CIRCLES_FETCH_FAILED'
      })
    }

    const totalPages = Math.ceil(count / limit)

    res.json({
      circles,
      pagination: {
        page,
        limit,
        total: count,
        pages: totalPages,
        hasNext: page < totalPages,
        hasPrev: page > 1
      }
    })

  } catch (error) {
    next(error)
  }
})

// Get user's travel goals
router.get('/goals', authenticateToken, validatePagination, async (req, res, next) => {
  try {
    const { page, limit, sort, order } = req.query
    const offset = (page - 1) * limit

    const { data: goals, error, count } = await supabase
      .from('travel_goals')
      .select('*', { count: 'exact' })
      .eq('user_id', req.userId)
      .order(sort, { ascending: order === 'asc' })
      .range(offset, offset + limit - 1)

    if (error) {
      logger.error('User goals fetch error', { error: error.message, userId: req.userId })
      return res.status(500).json({
        error: 'Failed to fetch goals',
        code: 'GOALS_FETCH_FAILED'
      })
    }

    const totalPages = Math.ceil(count / limit)

    res.json({
      goals,
      pagination: {
        page,
        limit,
        total: count,
        pages: totalPages,
        hasNext: page < totalPages,
        hasPrev: page > 1
      }
    })

  } catch (error) {
    next(error)
  }
})

// Get user's bookings
router.get('/bookings', authenticateToken, validatePagination, async (req, res, next) => {
  try {
    const { page, limit, sort, order } = req.query
    const { status, booking_type } = req.query
    const offset = (page - 1) * limit

    let query = supabase
      .from('bookings')
      .select(`
        *,
        travel_circles(name, destination)
      `, { count: 'exact' })
      .eq('user_id', req.userId)

    // Apply filters
    if (status) {
      query = query.eq('status', status)
    }
    
    if (booking_type) {
      query = query.eq('booking_type', booking_type)
    }

    const { data: bookings, error, count } = await query
      .order(sort, { ascending: order === 'asc' })
      .range(offset, offset + limit - 1)

    if (error) {
      logger.error('User bookings fetch error', { error: error.message, userId: req.userId })
      return res.status(500).json({
        error: 'Failed to fetch bookings',
        code: 'BOOKINGS_FETCH_FAILED'
      })
    }

    const totalPages = Math.ceil(count / limit)

    res.json({
      bookings,
      pagination: {
        page,
        limit,
        total: count,
        pages: totalPages,
        hasNext: page < totalPages,
        hasPrev: page > 1
      }
    })

  } catch (error) {
    next(error)
  }
})

// Get user's notifications
router.get('/notifications', authenticateToken, validatePagination, async (req, res, next) => {
  try {
    const { page, limit, sort, order } = req.query
    const { is_read, category } = req.query
    const offset = (page - 1) * limit

    let query = supabase
      .from('notifications')
      .select('*', { count: 'exact' })
      .eq('user_id', req.userId)

    // Apply filters
    if (is_read !== undefined) {
      query = query.eq('is_read', is_read === 'true')
    }
    
    if (category) {
      query = query.eq('category', category)
    }

    const { data: notifications, error, count } = await query
      .order(sort, { ascending: order === 'asc' })
      .range(offset, offset + limit - 1)

    if (error) {
      logger.error('User notifications fetch error', { error: error.message, userId: req.userId })
      return res.status(500).json({
        error: 'Failed to fetch notifications',
        code: 'NOTIFICATIONS_FETCH_FAILED'
      })
    }

    const totalPages = Math.ceil(count / limit)

    res.json({
      notifications,
      pagination: {
        page,
        limit,
        total: count,
        pages: totalPages,
        hasNext: page < totalPages,
        hasPrev: page > 1
      }
    })

  } catch (error) {
    next(error)
  }
})

// Mark notification as read
router.patch('/notifications/:id/read', authenticateToken, async (req, res, next) => {
  try {
    const { id } = req.params

    const { data: notification, error } = await supabase
      .from('notifications')
      .update({ is_read: true })
      .eq('id', id)
      .eq('user_id', req.userId)
      .select()
      .single()

    if (error) {
      logger.error('Notification update error', { error: error.message, notificationId: id, userId: req.userId })
      return res.status(400).json({
        error: 'Failed to update notification',
        code: 'NOTIFICATION_UPDATE_FAILED'
      })
    }

    if (!notification) {
      return res.status(404).json({
        error: 'Notification not found',
        code: 'NOTIFICATION_NOT_FOUND'
      })
    }

    res.json({
      message: 'Notification marked as read',
      notification
    })

  } catch (error) {
    next(error)
  }
})

// Mark all notifications as read
router.patch('/notifications/read-all', authenticateToken, async (req, res, next) => {
  try {
    const { data, error } = await supabase
      .from('notifications')
      .update({ is_read: true })
      .eq('user_id', req.userId)
      .eq('is_read', false)

    if (error) {
      logger.error('Bulk notification update error', { error: error.message, userId: req.userId })
      return res.status(400).json({
        error: 'Failed to update notifications',
        code: 'NOTIFICATIONS_UPDATE_FAILED'
      })
    }

    logger.info('All notifications marked as read', { userId: req.userId })

    res.json({
      message: 'All notifications marked as read'
    })

  } catch (error) {
    next(error)
  }
})

// Get user statistics/dashboard data
router.get('/stats', authenticateToken, async (req, res, next) => {
  try {
    const { data: stats, error } = await supabase
      .from('user_dashboard_stats')
      .select('*')
      .eq('id', req.userId)
      .single()

    if (error) {
      logger.error('User stats fetch error', { error: error.message, userId: req.userId })
      return res.status(500).json({
        error: 'Failed to fetch user statistics',
        code: 'STATS_FETCH_FAILED'
      })
    }

    // Get recent activities
    const { data: recentContributions, error: contributionsError } = await supabase
      .from('circle_contributions')
      .select(`
        *,
        travel_circles(name, destination)
      `)
      .eq('user_id', req.userId)
      .eq('status', 'confirmed')
      .order('contribution_date', { ascending: false })
      .limit(5)

    if (contributionsError) {
      logger.error('Recent contributions fetch error', { error: contributionsError.message, userId: req.userId })
    }

    res.json({
      stats,
      recent_contributions: recentContributions || []
    })

  } catch (error) {
    next(error)
  }
})

module.exports = router
