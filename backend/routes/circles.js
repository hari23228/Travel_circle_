const express = require('express')
const { supabase, supabaseAdmin } = require('../config/supabase')
const { authenticateToken, checkCircleRole, checkCircleMember } = require('../middleware/auth')
const { 
  validateCreateCircle, 
  validateUpdateCircle, 
  validateJoinCircle,
  validateCreateContribution,
  validateCreateInvitation,
  validatePagination 
} = require('../middleware/validation')
const { logger } = require('../middleware/logger')
const { sendEmail } = require('../utils/emailService')
const router = express.Router()

// Get all public circles or search circles
router.get('/', validatePagination, async (req, res, next) => {
  try {
    const { page, limit, sort, order } = req.query
    const { search, destination } = req.query
    const offset = (page - 1) * limit

    let query = supabase
      .from('circle_details')
      .select('*', { count: 'exact' })
      .eq('is_private', false)
      .eq('is_active', true)

    // Apply search filters
    if (search) {
      query = query.or(`name.ilike.%${search}%,description.ilike.%${search}%`)
    }
    
    if (destination) {
      query = query.ilike('destination', `%${destination}%`)
    }

    const { data: circles, error, count } = await query
      .order(sort, { ascending: order === 'asc' })
      .range(offset, offset + limit - 1)

    if (error) {
      logger.error('Circles fetch error', { error: error.message })
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

// Create a new circle
router.post('/', authenticateToken, validateCreateCircle, async (req, res, next) => {
  try {
    const circleData = {
      ...req.body,
      creator_id: req.userId
    }

    // Create the circle
    const { data: circle, error: circleError } = await supabase
      .from('travel_circles')
      .insert(circleData)
      .select()
      .single()

    if (circleError) {
      logger.error('Circle creation error', { error: circleError.message, userId: req.userId })
      return res.status(400).json({
        error: 'Failed to create circle',
        code: 'CIRCLE_CREATION_FAILED'
      })
    }

    // Automatically add creator as admin member
    const { error: membershipError } = await supabase
      .from('circle_memberships')
      .insert({
        circle_id: circle.id,
        user_id: req.userId,
        role: 'admin'
      })

    if (membershipError) {
      logger.error('Creator membership error', { error: membershipError.message, circleId: circle.id })
      // Don't fail the request, but log the error
    }

    logger.info('Circle created successfully', { circleId: circle.id, userId: req.userId })

    res.status(201).json({
      message: 'Circle created successfully',
      circle
    })

  } catch (error) {
    next(error)
  }
})

// Get circle details
router.get('/:id', async (req, res, next) => {
  try {
    const { id } = req.params

    const { data: circle, error } = await supabase
      .from('circle_details')
      .select('*')
      .eq('id', id)
      .single()

    if (error || !circle) {
      return res.status(404).json({
        error: 'Circle not found',
        code: 'CIRCLE_NOT_FOUND'
      })
    }

    // Check if circle is private and user has access
    if (circle.is_private && req.userId) {
      const { data: membership } = await supabase
        .from('circle_memberships')
        .select('role')
        .eq('circle_id', id)
        .eq('user_id', req.userId)
        .eq('is_active', true)
        .single()

      if (!membership) {
        return res.status(403).json({
          error: 'Access denied to private circle',
          code: 'PRIVATE_CIRCLE_ACCESS_DENIED'
        })
      }
    }

    res.json({ circle })

  } catch (error) {
    next(error)
  }
})

// Update circle (admin/moderator only)
router.put('/:id', authenticateToken, checkCircleRole(['creator', 'admin', 'moderator']), validateUpdateCircle, async (req, res, next) => {
  try {
    const { id } = req.params
    const updates = req.body

    const { data: circle, error } = await supabase
      .from('travel_circles')
      .update({
        ...updates,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single()

    if (error) {
      logger.error('Circle update error', { error: error.message, circleId: id, userId: req.userId })
      return res.status(400).json({
        error: 'Failed to update circle',
        code: 'CIRCLE_UPDATE_FAILED'
      })
    }

    logger.info('Circle updated successfully', { circleId: id, userId: req.userId })

    res.json({
      message: 'Circle updated successfully',
      circle
    })

  } catch (error) {
    next(error)
  }
})

// Join a circle
router.post('/:id/join', authenticateToken, async (req, res, next) => {
  try {
    const { id } = req.params
    const { invitation_code } = req.body

    // Get circle details
    const { data: circle, error: circleError } = await supabase
      .from('travel_circles')
      .select('*')
      .eq('id', id)
      .eq('is_active', true)
      .single()

    if (circleError || !circle) {
      return res.status(404).json({
        error: 'Circle not found',
        code: 'CIRCLE_NOT_FOUND'
      })
    }

    // Check if circle is private and requires invitation
    if (circle.is_private) {
      if (!invitation_code) {
        return res.status(400).json({
          error: 'Invitation code required for private circle',
          code: 'INVITATION_CODE_REQUIRED'
        })
      }

      // Verify invitation code
      const { data: invitation, error: invitationError } = await supabase
        .from('circle_invitations')
        .select('*')
        .eq('circle_id', id)
        .eq('invitation_code', invitation_code)
        .eq('status', 'pending')
        .gt('expires_at', new Date().toISOString())
        .single()

      if (invitationError || !invitation) {
        return res.status(400).json({
          error: 'Invalid or expired invitation code',
          code: 'INVALID_INVITATION'
        })
      }
    }

    // Check if user is already a member
    const { data: existingMembership } = await supabase
      .from('circle_memberships')
      .select('*')
      .eq('circle_id', id)
      .eq('user_id', req.userId)
      .single()

    if (existingMembership) {
      if (existingMembership.is_active) {
        return res.status(409).json({
          error: 'Already a member of this circle',
          code: 'ALREADY_MEMBER'
        })
      } else {
        // Reactivate membership
        const { data: membership, error: reactivateError } = await supabase
          .from('circle_memberships')
          .update({ is_active: true })
          .eq('id', existingMembership.id)
          .select()
          .single()

        if (reactivateError) {
          logger.error('Membership reactivation error', { error: reactivateError.message, circleId: id, userId: req.userId })
          return res.status(400).json({
            error: 'Failed to rejoin circle',
            code: 'REJOIN_FAILED'
          })
        }

        logger.info('User rejoined circle', { circleId: id, userId: req.userId })

        return res.json({
          message: 'Successfully rejoined circle',
          membership
        })
      }
    }

    // Check member limit
    const { count: memberCount } = await supabase
      .from('circle_memberships')
      .select('*', { count: 'exact', head: true })
      .eq('circle_id', id)
      .eq('is_active', true)

    if (memberCount >= circle.max_members) {
      return res.status(400).json({
        error: 'Circle has reached maximum member limit',
        code: 'MEMBER_LIMIT_REACHED'
      })
    }

    // Create membership
    const { data: membership, error: membershipError } = await supabase
      .from('circle_memberships')
      .insert({
        circle_id: id,
        user_id: req.userId,
        role: 'member'
      })
      .select()
      .single()

    if (membershipError) {
      logger.error('Membership creation error', { error: membershipError.message, circleId: id, userId: req.userId })
      return res.status(400).json({
        error: 'Failed to join circle',
        code: 'JOIN_FAILED'
      })
    }

    // Mark invitation as accepted if it was used
    if (invitation_code) {
      await supabase
        .from('circle_invitations')
        .update({ 
          status: 'accepted',
          responded_at: new Date().toISOString()
        })
        .eq('circle_id', id)
        .eq('invitation_code', invitation_code)
    }

    logger.info('User joined circle successfully', { circleId: id, userId: req.userId })

    res.status(201).json({
      message: 'Successfully joined circle',
      membership
    })

  } catch (error) {
    next(error)
  }
})

// Leave a circle
router.post('/:id/leave', authenticateToken, checkCircleMember, async (req, res, next) => {
  try {
    const { id } = req.params

    // Check if user is the creator
    const { data: circle } = await supabase
      .from('travel_circles')
      .select('creator_id')
      .eq('id', id)
      .single()

    if (circle && circle.creator_id === req.userId) {
      return res.status(400).json({
        error: 'Circle creator cannot leave. Transfer ownership or delete the circle.',
        code: 'CREATOR_CANNOT_LEAVE'
      })
    }

    // Deactivate membership
    const { error } = await supabase
      .from('circle_memberships')
      .update({ is_active: false })
      .eq('circle_id', id)
      .eq('user_id', req.userId)

    if (error) {
      logger.error('Leave circle error', { error: error.message, circleId: id, userId: req.userId })
      return res.status(400).json({
        error: 'Failed to leave circle',
        code: 'LEAVE_FAILED'
      })
    }

    logger.info('User left circle', { circleId: id, userId: req.userId })

    res.json({
      message: 'Successfully left circle'
    })

  } catch (error) {
    next(error)
  }
})

// Get circle members
router.get('/:id/members', checkCircleMember, validatePagination, async (req, res, next) => {
  try {
    const { id } = req.params
    const { page, limit, sort, order } = req.query
    const offset = (page - 1) * limit

    const { data: members, error, count } = await supabase
      .from('circle_memberships')
      .select(`
        *,
        profiles(full_name, username, avatar_url, city)
      `, { count: 'exact' })
      .eq('circle_id', id)
      .eq('is_active', true)
      .order(sort === 'name' ? 'profiles.full_name' : sort, { ascending: order === 'asc' })
      .range(offset, offset + limit - 1)

    if (error) {
      logger.error('Circle members fetch error', { error: error.message, circleId: id })
      return res.status(500).json({
        error: 'Failed to fetch circle members',
        code: 'MEMBERS_FETCH_FAILED'
      })
    }

    const totalPages = Math.ceil(count / limit)

    res.json({
      members,
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

// Create invitation (allow circle creator even if membership record missing)
router.post('/:id/invite', authenticateToken, validateCreateInvitation, async (req, res, next) => {
  try {
    const { id } = req.params
    const { invitee_email, invitee_phone } = req.body

    // Authorize: allow if user is circle creator OR has role admin/moderator
    const clientRead = supabaseAdmin || supabase
    const { data: circle } = await clientRead
      .from('travel_circles')
      .select('*, creator:profiles!creator_id(full_name, email)')
      .eq('id', id)
      .single()

    if (!circle) {
      return res.status(404).json({ error: 'Circle not found', code: 'CIRCLE_NOT_FOUND' })
    }

    if (circle.creator_id !== req.userId) {
      const { data: membership } = await supabase
        .from('circle_memberships')
        .select('role, is_active')
        .eq('circle_id', id)
        .eq('user_id', req.userId)
        .eq('is_active', true)
        .single()

      if (!membership || !['creator', 'admin', 'moderator'].includes(membership.role)) {
        return res.status(403).json({
          error: 'You must be an admin or the circle creator to invite members',
          code: 'INVITE_NOT_AUTHORIZED'
        })
      }
    }

    // Get inviter details
    const { data: inviter } = await supabase
      .from('profiles')
      .select('full_name, email')
      .eq('id', req.userId)
      .single()

    // Generate invitation code
    const invitationCode = Math.random().toString(36).substring(2, 10).toUpperCase()

    // Use admin client if available to avoid RLS insert issues
    const client = supabaseAdmin || supabase
    const { data: invitation, error } = await client
      .from('circle_invitations')
      .insert({
        circle_id: id,
        inviter_id: req.userId,
        invitee_email,
        invitee_phone,
        invitation_code: invitationCode
      })
      .select()
      .single()

    if (error) {
      logger.error('Invitation creation error', { error: error.message, circleId: id, userId: req.userId })
      return res.status(400).json({
        error: 'Failed to create invitation',
        code: 'INVITATION_CREATION_FAILED'
      })
    }

    logger.info('Invitation created successfully', { invitationId: invitation.id, circleId: id, userId: req.userId })

    // Send invitation email if email provided
    if (invitee_email) {
      const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000'
      const acceptUrl = `${frontendUrl}/accept-invitation?code=${invitationCode}`
      
      const emailResult = await sendEmail(
        invitee_email,
        'circleInvitation',
        {
          circleName: circle.name,
          inviterName: inviter?.full_name || 'A friend',
          invitationCode: invitationCode,
          acceptUrl: acceptUrl,
          circleDestination: circle.destination,
          targetAmount: circle.target_amount
        }
      )

      if (emailResult.success) {
        logger.info('Invitation email sent', { 
          invitationId: invitation.id, 
          email: invitee_email,
          messageId: emailResult.messageId
        })
      } else {
        logger.error('Failed to send invitation email', { 
          invitationId: invitation.id, 
          email: invitee_email,
          error: emailResult.error,
          message: emailResult.message
        })
        
        // Return warning to user about email failure
        return res.status(201).json({
          message: 'Invitation created, but email failed to send',
          warning: 'Email service may not be configured. Share the invitation code manually.',
          emailError: emailResult.message,
          invitation: {
            id: invitation.id,
            invitation_code: invitation.invitation_code,
            expires_at: invitation.expires_at,
            email_sent: false
          }
        })
      }
    }

    res.status(201).json({
      message: invitee_email 
        ? 'Invitation created and email sent successfully' 
        : 'Invitation created successfully',
      invitation: {
        id: invitation.id,
        invitation_code: invitation.invitation_code,
        expires_at: invitation.expires_at,
        email_sent: invitee_email ? true : false
      }
    })

  } catch (error) {
    next(error)
  }
})

// Join a circle using only invitation code (no circle id needed)
router.post('/join-by-code', authenticateToken, async (req, res, next) => {
  try {
    const { invitation_code } = req.body
    if (!invitation_code) {
      return res.status(400).json({
        error: 'Invitation code is required',
        code: 'INVITATION_CODE_REQUIRED'
      })
    }

    // Find the pending, non-expired invitation
    const { data: invitation, error: inviteErr } = await supabase
      .from('circle_invitations')
      .select('*, circle:travel_circles(name, destination), inviter:profiles!inviter_id(email)')
      .eq('invitation_code', invitation_code)
      .eq('status', 'pending')
      .gt('expires_at', new Date().toISOString())
      .single()

    if (inviteErr || !invitation) {
      return res.status(400).json({
        error: 'Invalid or expired invitation code',
        code: 'INVALID_INVITATION'
      })
    }

    const circleId = invitation.circle_id

    // Check existing membership
    const { data: existing } = await supabase
      .from('circle_memberships')
      .select('*')
      .eq('circle_id', circleId)
      .eq('user_id', req.userId)
      .single()

    if (existing && existing.is_active) {
      return res.status(409).json({
        error: 'Already a member of this circle',
        code: 'ALREADY_MEMBER'
      })
    }

    // Get the new member's profile
    const { data: newMember } = await supabase
      .from('profiles')
      .select('full_name, email')
      .eq('id', req.userId)
      .single()

    // Reactivate or create membership
    let membership
    if (existing) {
      const { data: reactivated, error: reactivateError } = await supabase
        .from('circle_memberships')
        .update({ is_active: true })
        .eq('id', existing.id)
        .select()
        .single()
      if (reactivateError) {
        return res.status(400).json({ error: 'Failed to rejoin circle', code: 'REJOIN_FAILED' })
      }
      membership = reactivated
    } else {
      const { data: created, error: createErr } = await supabase
        .from('circle_memberships')
        .insert({ circle_id: circleId, user_id: req.userId, role: 'member' })
        .select()
        .single()
      if (createErr) {
        return res.status(400).json({ error: 'Failed to join circle', code: 'JOIN_FAILED' })
      }
      membership = created
    }

    // Mark invitation accepted
    await supabase
      .from('circle_invitations')
      .update({ status: 'accepted', responded_at: new Date().toISOString() })
      .eq('id', invitation.id)

    // Send acceptance notification email to inviter
    if (invitation.inviter?.email && newMember) {
      const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000'
      const circleUrl = `${frontendUrl}/circle/${circleId}`
      
      await sendEmail(
        invitation.inviter.email,
        'invitationAccepted',
        {
          circleName: invitation.circle?.name || 'Travel Circle',
          memberName: newMember.full_name || newMember.email,
          circleUrl: circleUrl
        }
      )
    }

    logger.info('User joined circle via invitation code', { 
      circleId, 
      userId: req.userId, 
      invitationId: invitation.id 
    })

    res.status(201).json({ 
      message: 'Successfully joined circle', 
      membership,
      circle: invitation.circle 
    })
  } catch (error) {
    next(error)
  }
})

// Get circle contributions
router.get('/:id/contributions', checkCircleMember, validatePagination, async (req, res, next) => {
  try {
    const { id } = req.params
    const { page, limit, sort, order } = req.query
    const { status, user_id } = req.query
    const offset = (page - 1) * limit

    let query = supabase
      .from('circle_contributions')
      .select(`
        *,
        profiles(full_name, username, avatar_url)
      `, { count: 'exact' })
      .eq('circle_id', id)

    // Apply filters
    if (status) {
      query = query.eq('status', status)
    }
    
    if (user_id) {
      query = query.eq('user_id', user_id)
    }

    const { data: contributions, error, count } = await query
      .order(sort, { ascending: order === 'asc' })
      .range(offset, offset + limit - 1)

    if (error) {
      logger.error('Circle contributions fetch error', { error: error.message, circleId: id })
      return res.status(500).json({
        error: 'Failed to fetch contributions',
        code: 'CONTRIBUTIONS_FETCH_FAILED'
      })
    }

    const totalPages = Math.ceil(count / limit)

    res.json({
      contributions,
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

// Make a contribution to a circle
router.post('/:id/contribute', authenticateToken, checkCircleMember, validateCreateContribution, async (req, res, next) => {
  try {
    const { id } = req.params
    const contributionData = {
      ...req.body,
      circle_id: id,
      user_id: req.userId
    }

    const { data: contribution, error } = await supabase
      .from('circle_contributions')
      .insert(contributionData)
      .select()
      .single()

    if (error) {
      logger.error('Contribution creation error', { error: error.message, circleId: id, userId: req.userId })
      return res.status(400).json({
        error: 'Failed to create contribution',
        code: 'CONTRIBUTION_CREATION_FAILED'
      })
    }

    logger.info('Contribution created successfully', { contributionId: contribution.id, circleId: id, userId: req.userId })

    res.status(201).json({
      message: 'Contribution created successfully',
      contribution
    })

  } catch (error) {
    next(error)
  }
})

module.exports = router
