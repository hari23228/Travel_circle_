const express = require('express')
const { supabase } = require('../config/supabase')
const { 
  validateSignup, 
  validateLogin, 
  validatePhoneLogin, 
  validateSendOTP 
} = require('../middleware/validation')
const { authenticateToken } = require('../middleware/auth')
const { logger } = require('../middleware/logger')
const router = express.Router()

// Sign up with email
router.post('/signup', validateSignup, async (req, res, next) => {
  try {
    const { name, email, phone, password, dateOfBirth, city } = req.body

    // Sign up with Supabase Auth
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: name,
          phone,
          date_of_birth: dateOfBirth,
          city
        }
      }
    })

    if (authError) {
      logger.error('Signup error', { 
        error: authError.message, 
        email, 
        code: authError.code,
        status: authError.status 
      })
      
      // Check for various "already exists" error messages from Supabase
      // Common error messages: "User already registered", "Email already exists"
      // Status 422 typically means validation error (duplicate email)
      if (authError.message.toLowerCase().includes('already') || 
          authError.code === 'user_already_exists' ||
          authError.status === 422) {
        return res.status(409).json({
          error: 'This email is already registered. Please try logging in instead.',
          code: 'EMAIL_EXISTS'
        })
      }
      
      return res.status(400).json({
        error: authError.message,
        code: 'SIGNUP_FAILED'
      })
    }

    const { user, session } = authData

    if (!user) {
      return res.status(400).json({
        error: 'User creation failed',
        code: 'USER_CREATION_FAILED'
      })
    }

    // Create profile in our profiles table
    const { error: profileError } = await supabase
      .from('profiles')
      .upsert({
        id: user.id,
        full_name: name,
        phone,
        date_of_birth: dateOfBirth,
        city
      }, {
        onConflict: 'id'
      })

    if (profileError) {
      logger.error('Profile creation error', { error: profileError.message, userId: user.id })
      // Don't fail the signup if profile creation fails - user can update later
    }

    logger.info('User signed up successfully', { userId: user.id, email })

    res.status(201).json({
      message: 'Account created successfully',
      user: {
        id: user.id,
        email: user.email,
        full_name: name,
        phone,
        city,
        email_confirmed: user.email_confirmed_at !== null
      },
      session: session ? {
        access_token: session.access_token,
        refresh_token: session.refresh_token,
        expires_at: session.expires_at
      } : null
    })

  } catch (error) {
    next(error)
  }
})

// Login with email
router.post('/login', validateLogin, async (req, res, next) => {
  try {
    const { email, password } = req.body

    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email,
      password
    })

    if (authError) {
      logger.warn('Login failed', { error: authError.message, email })
      return res.status(401).json({
        error: 'Invalid email or password',
        code: 'INVALID_CREDENTIALS'
      })
    }

    const { user, session } = authData

    // Get user profile
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single()

    if (profileError) {
      logger.error('Profile fetch error', { error: profileError.message, userId: user.id })
    }

    logger.info('User logged in successfully', { userId: user.id, email })

    res.json({
      message: 'Login successful',
      user: {
        id: user.id,
        email: user.email,
        ...profile
      },
      session: {
        access_token: session.access_token,
        refresh_token: session.refresh_token,
        expires_at: session.expires_at
      }
    })

  } catch (error) {
    next(error)
  }
})

// Send OTP for phone login
router.post('/send-otp', validateSendOTP, async (req, res, next) => {
  try {
    const { phone } = req.body

    // For now, using Supabase's phone auth (you may need to enable this in Supabase dashboard)
    const { data, error } = await supabase.auth.signInWithOtp({
      phone: phone
    })

    if (error) {
      logger.error('OTP send error', { error: error.message, phone })
      return res.status(400).json({
        error: 'Failed to send OTP',
        code: 'OTP_SEND_FAILED',
        details: error.message
      })
    }

    logger.info('OTP sent successfully', { phone })

    res.json({
      message: 'OTP sent successfully',
      phone: phone
    })

  } catch (error) {
    next(error)
  }
})

// Verify OTP and login
router.post('/verify-otp', validatePhoneLogin, async (req, res, next) => {
  try {
    const { phone, otp } = req.body

    const { data: authData, error: authError } = await supabase.auth.verifyOtp({
      phone,
      token: otp,
      type: 'sms'
    })

    if (authError) {
      logger.warn('OTP verification failed', { error: authError.message, phone })
      return res.status(401).json({
        error: 'Invalid OTP',
        code: 'INVALID_OTP'
      })
    }

    const { user, session } = authData

    // Get or create user profile
    let { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single()

    if (profileError && profileError.code === 'PGRST116') {
      // Profile doesn't exist, create it
      const { data: newProfile, error: createError } = await supabase
        .from('profiles')
        .insert({
          id: user.id,
          full_name: phone, // Temporary name
          phone: phone
        })
        .select()
        .single()

      if (createError) {
        logger.error('Profile creation error', { error: createError.message, userId: user.id })
      } else {
        profile = newProfile
      }
    }

    logger.info('User logged in with OTP', { userId: user.id, phone })

    res.json({
      message: 'Login successful',
      user: {
        id: user.id,
        phone: user.phone,
        ...profile
      },
      session: {
        access_token: session.access_token,
        refresh_token: session.refresh_token,
        expires_at: session.expires_at
      }
    })

  } catch (error) {
    next(error)
  }
})

// Refresh token
router.post('/refresh', async (req, res, next) => {
  try {
    const { refresh_token } = req.body

    if (!refresh_token) {
      return res.status(400).json({
        error: 'Refresh token required',
        code: 'REFRESH_TOKEN_REQUIRED'
      })
    }

    const { data, error } = await supabase.auth.refreshSession({
      refresh_token
    })

    if (error) {
      logger.warn('Token refresh failed', { error: error.message })
      return res.status(401).json({
        error: 'Invalid refresh token',
        code: 'INVALID_REFRESH_TOKEN'
      })
    }

    const { session, user } = data

    res.json({
      message: 'Token refreshed successfully',
      session: {
        access_token: session.access_token,
        refresh_token: session.refresh_token,
        expires_at: session.expires_at
      }
    })

  } catch (error) {
    next(error)
  }
})

// Logout
router.post('/logout', authenticateToken, async (req, res, next) => {
  try {
    const { error } = await supabase.auth.signOut()

    if (error) {
      logger.error('Logout error', { error: error.message, userId: req.userId })
    }

    logger.info('User logged out', { userId: req.userId })

    res.json({
      message: 'Logged out successfully'
    })

  } catch (error) {
    next(error)
  }
})

// Get current user
router.get('/me', authenticateToken, async (req, res, next) => {
  try {
    // Get user profile with stats
    const { data: profile, error: profileError } = await supabase
      .from('user_dashboard_stats')
      .select('*')
      .eq('id', req.userId)
      .single()

    if (profileError) {
      logger.error('Profile fetch error', { error: profileError.message, userId: req.userId })
      return res.status(404).json({
        error: 'Profile not found',
        code: 'PROFILE_NOT_FOUND'
      })
    }

    res.json({
      user: profile
    })

  } catch (error) {
    next(error)
  }
})

// Request password reset
router.post('/forgot-password', async (req, res, next) => {
  try {
    const { email } = req.body

    if (!email) {
      return res.status(400).json({
        error: 'Email required',
        code: 'EMAIL_REQUIRED'
      })
    }

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${process.env.FRONTEND_URL}/reset-password`
    })

    if (error) {
      logger.error('Password reset request error', { error: error.message, email })
      return res.status(400).json({
        error: 'Failed to send reset email',
        code: 'RESET_EMAIL_FAILED'
      })
    }

    logger.info('Password reset email sent', { email })

    res.json({
      message: 'Password reset email sent'
    })

  } catch (error) {
    next(error)
  }
})

module.exports = router
