const express = require('express')
const cors = require('cors')
const helmet = require('helmet')
const morgan = require('morgan')
require('dotenv').config()

const config = require('./config')
const { requestLogger, errorLogger } = require('./middleware/logger')
const { errorHandler, notFoundHandler } = require('./middleware/errorHandler')

// Import routes
const authRoutes = require('./routes/auth')
const userRoutes = require('./routes/users')
const circleRoutes = require('./routes/circles')
const profileRoutes = require('./routes/profiles')
const itineraryRoutes = require('./routes/itineraries')

// Create Express app
const app = express()

// Trust proxy for production deployment
app.set('trust proxy', 1)

// Security middleware
app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" }
}))

// CORS configuration
app.use(cors({
  origin: [
    config.frontendUrl,
    'http://localhost:3000',
    'http://localhost:3001'
  ],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
}))

// Body parsing middleware
app.use(express.json({ limit: '10mb' }))
app.use(express.urlencoded({ extended: true, limit: '10mb' }))

// Logging middleware
if (config.nodeEnv === 'production') {
  app.use(morgan('combined'))
} else {
  app.use(morgan('dev'))
}
app.use(requestLogger)

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    environment: config.nodeEnv,
    version: process.env.npm_package_version || '1.0.0'
  })
})

// API routes
app.use('/api/auth', authRoutes)
app.use('/api/users', userRoutes)
app.use('/api/circles', circleRoutes)
app.use('/api/profiles', profileRoutes)
app.use('/api/itineraries', itineraryRoutes)

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    message: 'Tripzz Backend API',
    version: '1.0.0',
    environment: config.nodeEnv,
    endpoints: {
      health: '/health',
      auth: '/api/auth',
      users: '/api/users',
      circles: '/api/circles',
      profiles: '/api/profiles',
      itineraries: '/api/itineraries'
    },
    documentation: 'https://docs.tripzz.com/api' // Update with actual docs URL
  })
})

// Error handling middleware
app.use(errorLogger)
app.use(notFoundHandler)
app.use(errorHandler)

// Graceful shutdown handler
const gracefulShutdown = (signal) => {
  console.log(`\n🛑 Received ${signal}. Starting graceful shutdown...`)
  
  server.close((err) => {
    if (err) {
      console.error('❌ Error during server shutdown:', err)
      process.exit(1)
    }
    
    console.log('✅ Server closed successfully')
    process.exit(0)
  })
}

// Start server
const PORT = config.port
const server = app.listen(PORT, () => {
  console.log('🚀 Tripzz Backend Server Started')
  console.log('================================')
  console.log(`🌍 Environment: ${config.nodeEnv}`)
  console.log(`🔗 Server URL: http://localhost:${PORT}`)
  console.log(`📊 Health Check: http://localhost:${PORT}/health`)
  console.log(`🔐 Auth API: http://localhost:${PORT}/api/auth`)
  console.log(`👥 Users API: http://localhost:${PORT}/api/users`)
  console.log(`⭕ Circles API: http://localhost:${PORT}/api/circles`)
  console.log('================================')
  
  if (config.nodeEnv === 'development') {
    console.log('💡 Development Tips:')
    console.log('   • Use /health to check server status')
    console.log('   • Check logs for request/response details')
    console.log('   • API documentation coming soon!')
    console.log('')
  }
})

// Handle graceful shutdown
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'))
process.on('SIGINT', () => gracefulShutdown('SIGINT'))

// Handle uncaught exceptions and unhandled rejections
process.on('uncaughtException', (err) => {
  console.error('💥 Uncaught Exception:', err)
  process.exit(1)
})

process.on('unhandledRejection', (reason, promise) => {
  console.error('💥 Unhandled Rejection at:', promise, 'reason:', reason)
  process.exit(1)
})

module.exports = app
