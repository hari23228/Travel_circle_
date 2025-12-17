const Joi = require('joi')

// Validation middleware factory
const validate = (schema, property = 'body') => {
  return (req, res, next) => {
    const { error, value } = schema.validate(req[property], {
      abortEarly: false,
      allowUnknown: false,
      stripUnknown: true
    })

    if (error) {
      const errors = error.details.map(detail => ({
        field: detail.path.join('.'),
        message: detail.message,
        value: detail.context?.value
      }))

      return res.status(400).json({
        error: 'Validation failed',
        code: 'VALIDATION_ERROR',
        details: errors
      })
    }

    // Replace the request property with the validated and sanitized value
    req[property] = value
    next()
  }
}

// Common validation schemas
const schemas = {
  // User schemas
  signup: Joi.object({
    name: Joi.string().min(2).max(100).required(),
    email: Joi.string().email().required(),
    phone: Joi.string().pattern(/^\+?[1-9]\d{9,14}$/).required(),
    password: Joi.string().min(6).required(),
    dateOfBirth: Joi.date().max('now').required(),
    city: Joi.string().min(2).max(100).required()
  }),

  login: Joi.object({
    email: Joi.string().email().required(),
    password: Joi.string().required()
  }),

  phoneLogin: Joi.object({
    phone: Joi.string().pattern(/^\+?[1-9]\d{9,14}$/).required(),
    otp: Joi.string().length(6).required()
  }),

  sendOTP: Joi.object({
    phone: Joi.string().pattern(/^\+?[1-9]\d{9,14}$/).required()
  }),

  // Profile schemas
  updateProfile: Joi.object({
    full_name: Joi.string().min(2).max(100),
    phone: Joi.string().pattern(/^\+?[1-9]\d{9,14}$/),
    date_of_birth: Joi.date().max('now'),
    city: Joi.string().min(2).max(100),
    bio: Joi.string().max(500),
    username: Joi.string().alphanum().min(3).max(30)
  }).min(1),

  // Circle schemas
  createCircle: Joi.object({
    name: Joi.string().min(3).max(100).required(),
    description: Joi.string().max(1000),
    destination: Joi.string().min(2).max(200),
    target_amount: Joi.number().positive().max(10000000).required(),
    max_members: Joi.number().integer().min(2).max(100).default(50),
    is_private: Joi.boolean().default(false),
    target_date: Joi.date().greater('now')
  }),

  updateCircle: Joi.object({
    name: Joi.string().min(3).max(100),
    description: Joi.string().max(1000),
    destination: Joi.string().min(2).max(200),
    target_amount: Joi.number().positive().max(10000000),
    max_members: Joi.number().integer().min(2).max(100),
    is_private: Joi.boolean(),
    target_date: Joi.date().greater('now')
  }).min(1),

  joinCircle: Joi.object({
    invitation_code: Joi.string().length(8).alphanum().uppercase()
  }),

  // Contribution schemas
  createContribution: Joi.object({
    amount: Joi.number().positive().max(1000000).required(),
    payment_method: Joi.string().valid('upi', 'card', 'netbanking', 'wallet').default('upi'),
    payment_reference: Joi.string().max(100),
    notes: Joi.string().max(500)
  }),

  // Goal schemas
  createGoal: Joi.object({
    title: Joi.string().min(3).max(200).required(),
    description: Joi.string().max(1000),
    destination: Joi.string().min(2).max(200),
    target_amount: Joi.number().positive().max(10000000).required(),
    target_date: Joi.date().greater('now'),
    priority: Joi.string().valid('low', 'medium', 'high').default('medium'),
    category: Joi.string().valid('leisure', 'adventure', 'business', 'family', 'solo').default('leisure')
  }),

  updateGoal: Joi.object({
    title: Joi.string().min(3).max(200),
    description: Joi.string().max(1000),
    destination: Joi.string().min(2).max(200),
    target_amount: Joi.number().positive().max(10000000),
    target_date: Joi.date().greater('now'),
    priority: Joi.string().valid('low', 'medium', 'high'),
    category: Joi.string().valid('leisure', 'adventure', 'business', 'family', 'solo'),
    is_completed: Joi.boolean()
  }).min(1),

  // Booking schemas
  createBooking: Joi.object({
    booking_type: Joi.string().valid('hotel', 'transport', 'package').required(),
    title: Joi.string().min(3).max(200).required(),
    description: Joi.string().max(1000),
    destination: Joi.string().min(2).max(200).required(),
    start_date: Joi.date().greater('now').required(),
    end_date: Joi.date().greater(Joi.ref('start_date')),
    total_amount: Joi.number().positive().max(10000000).required(),
    booking_data: Joi.object().required(),
    provider_name: Joi.string().max(100),
    circle_id: Joi.string().uuid()
  }),

  // Invitation schemas
  createInvitation: Joi.object({
    invitee_email: Joi.string().email(),
    invitee_phone: Joi.string().pattern(/^\+?[1-9]\d{9,14}$/)
  }).xor('invitee_email', 'invitee_phone'),

  // Pagination and filtering
  pagination: Joi.object({
    page: Joi.number().integer().min(1).default(1),
    limit: Joi.number().integer().min(1).max(100).default(20),
    sort: Joi.string().valid('created_at', 'updated_at', 'name', 'amount', 'date').default('created_at'),
    order: Joi.string().valid('asc', 'desc').default('desc')
  }),

  // Generic ID validation
  uuid: Joi.string().uuid().required()
}

// Specific validation middleware functions
const validateSignup = validate(schemas.signup)
const validateLogin = validate(schemas.login)
const validatePhoneLogin = validate(schemas.phoneLogin)
const validateSendOTP = validate(schemas.sendOTP)
const validateUpdateProfile = validate(schemas.updateProfile)
const validateCreateCircle = validate(schemas.createCircle)
const validateUpdateCircle = validate(schemas.updateCircle)
const validateJoinCircle = validate(schemas.joinCircle)
const validateCreateContribution = validate(schemas.createContribution)
const validateCreateGoal = validate(schemas.createGoal)
const validateUpdateGoal = validate(schemas.updateGoal)
const validateCreateBooking = validate(schemas.createBooking)
const validateCreateInvitation = validate(schemas.createInvitation)
const validatePagination = validate(schemas.pagination, 'query')
const validateUUID = (param = 'id') => validate(schemas.uuid, 'params')

module.exports = {
  validate,
  schemas,
  validateSignup,
  validateLogin,
  validatePhoneLogin,
  validateSendOTP,
  validateUpdateProfile,
  validateCreateCircle,
  validateUpdateCircle,
  validateJoinCircle,
  validateCreateContribution,
  validateCreateGoal,
  validateUpdateGoal,
  validateCreateBooking,
  validateCreateInvitation,
  validatePagination,
  validateUUID
}
