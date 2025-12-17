const winston = require('winston')

// Create logger instance
const logger = winston.createLogger({
  level: process.env.NODE_ENV === 'production' ? 'info' : 'debug',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  defaultMeta: { service: 'tripzz-backend' },
  transports: [
    new winston.transports.File({ filename: 'logs/error.log', level: 'error' }),
    new winston.transports.File({ filename: 'logs/combined.log' })
  ]
})

// Add console transport in development
if (process.env.NODE_ENV !== 'production') {
  logger.add(new winston.transports.Console({
    format: winston.format.combine(
      winston.format.colorize(),
      winston.format.simple()
    )
  }))
}

// Request logging middleware
const requestLogger = (req, res, next) => {
  const start = Date.now()
  
  // Log request
  logger.info('Request started', {
    method: req.method,
    url: req.url,
    ip: req.ip,
    userAgent: req.get('User-Agent'),
    userId: req.userId || 'anonymous'
  })

  // Override res.end to log response
  const originalEnd = res.end
  res.end = function(chunk, encoding) {
    const duration = Date.now() - start
    
    logger.info('Request completed', {
      method: req.method,
      url: req.url,
      statusCode: res.statusCode,
      duration: `${duration}ms`,
      userId: req.userId || 'anonymous'
    })

    originalEnd.call(this, chunk, encoding)
  }

  next()
}

// Error logging middleware
const errorLogger = (error, req, res, next) => {
  logger.error('Request error', {
    error: error.message,
    stack: error.stack,
    method: req.method,
    url: req.url,
    userId: req.userId || 'anonymous',
    body: req.body,
    params: req.params,
    query: req.query
  })

  next(error)
}

module.exports = {
  logger,
  requestLogger,
  errorLogger
}
