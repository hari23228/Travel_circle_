const jwt = require('jsonwebtoken')
const { supabase } = require('../config/supabase')
const config = require('../config')

// Middleware to verify JWT token
const authenticateToken = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization
    const token = authHeader && authHeader.split(' ')[1] // Bearer TOKEN

    if (!token) {
      return res.status(401).json({ 
        error: 'Access token required',
        code: 'NO_TOKEN' 
      })
    }

    // Verify the token with Supabase
    const { data: { user }, error } = await supabase.auth.getUser(token)
    
    if (error || !user) {
      return res.status(403).json({ 
        error: 'Invalid or expired token',
        code: 'INVALID_TOKEN' 
      })
    }

    // Attach user info to request
    req.user = user
    req.userId = user.id
    
    next()
  } catch (error) {
    console.error('Authentication error:', error)
    return res.status(403).json({ 
      error: 'Token verification failed',
      code: 'TOKEN_VERIFICATION_FAILED' 
    })
  }
}

// Middleware to optionally authenticate (for public endpoints that can benefit from user context)
const optionalAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization
    const token = authHeader && authHeader.split(' ')[1]

    if (token) {
      const { data: { user }, error } = await supabase.auth.getUser(token)
      if (!error && user) {
        req.user = user
        req.userId = user.id
      }
    }
    
    next()
  } catch (error) {
    // Don't fail, just continue without user context
    next()
  }
}

// Middleware to check if user has specific role in a circle
const checkCircleRole = (allowedRoles = ['admin', 'moderator']) => {
  return async (req, res, next) => {
    try {
      const circleId = req.params.circleId || req.params.id
      const userId = req.userId

      if (!userId || !circleId) {
        return res.status(400).json({ 
          error: 'User ID and Circle ID required',
          code: 'MISSING_PARAMS' 
        })
      }

      // Check user's role in the circle
      const { data: membership, error } = await supabase
        .from('circle_memberships')
        .select('role, is_active')
        .eq('circle_id', circleId)
        .eq('user_id', userId)
        .single()

      if (error || !membership) {
        return res.status(404).json({ 
          error: 'Circle membership not found',
          code: 'NOT_MEMBER' 
        })
      }

      if (!membership.is_active) {
        return res.status(403).json({ 
          error: 'Circle membership is inactive',
          code: 'INACTIVE_MEMBER' 
        })
      }

      if (!allowedRoles.includes(membership.role)) {
        return res.status(403).json({ 
          error: 'Insufficient permissions for this action',
          code: 'INSUFFICIENT_PERMISSIONS',
          required: allowedRoles,
          current: membership.role
        })
      }

      req.circleRole = membership.role
      next()
    } catch (error) {
      console.error('Circle role check error:', error)
      return res.status(500).json({ 
        error: 'Failed to verify circle permissions',
        code: 'PERMISSION_CHECK_FAILED' 
      })
    }
  }
}

// Middleware to check if user is circle member (any role)
const checkCircleMember = async (req, res, next) => {
  try {
    const circleId = req.params.circleId || req.params.id
    const userId = req.userId

    if (!userId || !circleId) {
      return res.status(400).json({ 
        error: 'User ID and Circle ID required',
        code: 'MISSING_PARAMS' 
      })
    }

    const { data: membership, error } = await supabase
      .from('circle_memberships')
      .select('role, is_active')
      .eq('circle_id', circleId)
      .eq('user_id', userId)
      .single()

    if (error || !membership || !membership.is_active) {
      return res.status(403).json({ 
        error: 'Access denied. Not a member of this circle.',
        code: 'NOT_CIRCLE_MEMBER' 
      })
    }

    req.circleRole = membership.role
    next()
  } catch (error) {
    console.error('Circle membership check error:', error)
    return res.status(500).json({ 
      error: 'Failed to verify circle membership',
      code: 'MEMBERSHIP_CHECK_FAILED' 
    })
  }
}

module.exports = {
  authenticateToken,
  optionalAuth,
  checkCircleRole,
  checkCircleMember
}
