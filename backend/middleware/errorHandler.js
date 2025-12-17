const { logger } = require('./logger')

// Global error handler
const errorHandler = (err, req, res, next) => {
  // Log the error
  logger.error('Unhandled error', {
    error: err.message,
    stack: err.stack,
    method: req.method,
    url: req.url,
    userId: req.userId || 'anonymous'
  })

  // Don't leak error details in production
  const isProduction = process.env.NODE_ENV === 'production'
  
  // Handle specific error types
  if (err.name === 'ValidationError') {
    return res.status(400).json({
      error: 'Validation failed',
      code: 'VALIDATION_ERROR',
      details: isProduction ? undefined : err.details
    })
  }

  if (err.name === 'UnauthorizedError' || err.message.includes('jwt')) {
    return res.status(401).json({
      error: 'Unauthorized access',
      code: 'UNAUTHORIZED'
    })
  }

  if (err.name === 'CastError') {
    return res.status(400).json({
      error: 'Invalid ID format',
      code: 'INVALID_ID'
    })
  }

  if (err.code === '23505') { // PostgreSQL unique violation
    return res.status(409).json({
      error: 'Resource already exists',
      code: 'DUPLICATE_RESOURCE'
    })
  }

  if (err.code === '23503') { // PostgreSQL foreign key violation
    return res.status(400).json({
      error: 'Referenced resource not found',
      code: 'INVALID_REFERENCE'
    })
  }

  // Default error response
  const statusCode = err.statusCode || err.status || 500
  const message = isProduction ? 'Internal server error' : err.message

  res.status(statusCode).json({
    error: message,
    code: 'INTERNAL_ERROR',
    ...(isProduction ? {} : { 
      stack: err.stack,
      details: err.details 
    })
  })
}

// 404 handler
const notFoundHandler = (req, res) => {
  res.status(404).json({
    error: 'Endpoint not found',
    code: 'NOT_FOUND',
    path: req.path,
    method: req.method
  })
}

// Rate limiting error handler
const rateLimitHandler = (req, res) => {
  logger.warn('Rate limit exceeded', {
    ip: req.ip,
    url: req.url,
    method: req.method
  })

  res.status(429).json({
    error: 'Too many requests, please try again later',
    code: 'RATE_LIMIT_EXCEEDED',
    retryAfter: '1 minute'
  })
}

// Handle uncaught exceptions
process.on('uncaughtException', (err) => {
  logger.error('Uncaught Exception', {
    error: err.message,
    stack: err.stack
  })
  
  // Graceful shutdown
  process.exit(1)
})

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
  logger.error('Unhandled Rejection', {
    reason: reason,
    promise: promise
  })
})

module.exports = {
  errorHandler,
  notFoundHandler,
  rateLimitHandler
}
