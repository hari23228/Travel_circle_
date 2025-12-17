require('dotenv').config()

const config = {
  // Server Configuration
  port: process.env.PORT || 5000,
  nodeEnv: process.env.NODE_ENV || 'development',
  
  // Frontend Configuration
  frontendUrl: process.env.FRONTEND_URL || 'http://localhost:3000',
  
  // JWT Configuration
  jwt: {
    secret: process.env.JWT_SECRET || 'your-fallback-secret-key',
    expiresIn: process.env.JWT_EXPIRES_IN || '7d'
  },
  
  // Supabase Configuration
  supabase: {
    url: process.env.SUPABASE_URL,
    anonKey: process.env.SUPABASE_ANON_KEY,
    serviceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY
  },
  
  // Email Configuration
  email: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  },
  
  // SMS Configuration
  twilio: {
    accountSid: process.env.TWILIO_ACCOUNT_SID,
    authToken: process.env.TWILIO_AUTH_TOKEN,
    phoneNumber: process.env.TWILIO_PHONE_NUMBER
  },
  
  // File Upload Configuration
  upload: {
    maxFileSize: parseInt(process.env.MAX_FILE_SIZE) || 5242880, // 5MB
    allowedTypes: process.env.ALLOWED_FILE_TYPES?.split(',') || [
      'image/jpeg',
      'image/png', 
      'image/gif',
      'image/webp'
    ]
  }
}

// Validate required environment variables
const requiredEnvVars = [
  'SUPABASE_URL',
  'SUPABASE_ANON_KEY'
]

const missingEnvVars = requiredEnvVars.filter(varName => !process.env[varName])

if (missingEnvVars.length > 0) {
  console.error('Missing required environment variables:', missingEnvVars.join(', '))
  process.exit(1)
}

module.exports = config
