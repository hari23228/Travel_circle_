// Email Configuration Diagnostic Tool
// Run this to check if your email is properly configured

require('dotenv').config()
const nodemailer = require('nodemailer')

console.log('='.repeat(70))
console.log('EMAIL CONFIGURATION DIAGNOSTIC')
console.log('='.repeat(70))

// Check environment variables
console.log('\n1. Environment Variables:')
console.log('-'.repeat(70))
console.log('EMAIL_HOST:', process.env.EMAIL_HOST || '❌ NOT SET')
console.log('EMAIL_PORT:', process.env.EMAIL_PORT || '❌ NOT SET')
console.log('EMAIL_SECURE:', process.env.EMAIL_SECURE || '❌ NOT SET')
console.log('EMAIL_USER:', process.env.EMAIL_USER ? '✅ SET' : '❌ NOT SET')
console.log('EMAIL_PASSWORD:', process.env.EMAIL_PASSWORD ? '✅ SET (hidden)' : '❌ NOT SET')
console.log('EMAIL_FROM:', process.env.EMAIL_FROM || '❌ NOT SET (will use EMAIL_USER)')
console.log('FRONTEND_URL:', process.env.FRONTEND_URL || '❌ NOT SET (using http://localhost:3000)')

// Check if email is configured
if (!process.env.EMAIL_USER || !process.env.EMAIL_PASSWORD) {
  console.log('\n❌ ERROR: Email credentials not configured!')
  console.log('\nTo fix this:')
  console.log('1. Open backend/.env file')
  console.log('2. Add these variables:')
  console.log('   EMAIL_HOST=smtp.gmail.com')
  console.log('   EMAIL_PORT=587')
  console.log('   EMAIL_SECURE=false')
  console.log('   EMAIL_USER=your-email@gmail.com')
  console.log('   EMAIL_PASSWORD=your-app-password')
  console.log('   EMAIL_FROM=noreply@tripzz.com')
  console.log('\n3. For Gmail, generate an App Password:')
  console.log('   https://myaccount.google.com/apppasswords')
  console.log('\nSee EMAIL_SETUP_GUIDE.md for detailed instructions.')
  process.exit(1)
}

// Try to create transporter
console.log('\n2. Creating Email Transporter:')
console.log('-'.repeat(70))

const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST || 'smtp.gmail.com',
  port: parseInt(process.env.EMAIL_PORT) || 587,
  secure: process.env.EMAIL_SECURE === 'true',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASSWORD
  },
  tls: {
    // For development: ignore certificate errors
    rejectUnauthorized: false
  }
})

console.log('✅ Transporter created')

// Verify connection
console.log('\n3. Verifying SMTP Connection:')
console.log('-'.repeat(70))

transporter.verify(async (error, success) => {
  if (error) {
    console.log('❌ SMTP Connection Failed!')
    console.log('Error:', error.message)
    console.log('\nCommon issues:')
    console.log('- Wrong password (use App Password for Gmail, not account password)')
    console.log('- 2-Factor Authentication not enabled (required for Gmail)')
    console.log('- SMTP not enabled for your email provider')
    console.log('- Firewall blocking port 587 or 465')
    console.log('\nFor Gmail users:')
    console.log('1. Enable 2FA: https://myaccount.google.com/security')
    console.log('2. Generate App Password: https://myaccount.google.com/apppasswords')
    process.exit(1)
  } else {
    console.log('✅ SMTP Connection Verified Successfully!')
    
    // Send test email
    console.log('\n4. Sending Test Email:')
    console.log('-'.repeat(70))
    console.log('Enter the email address to send a test email to:')
    console.log('(Or press Ctrl+C to skip)')
    
    process.stdin.once('data', async (data) => {
      const testEmail = data.toString().trim()
      
      if (!testEmail || !testEmail.includes('@')) {
        console.log('\n✅ Email service is configured correctly!')
        console.log('You can now send invitation emails.')
        process.exit(0)
      }
      
      try {
        console.log(`Sending test email to ${testEmail}...`)
        
        const info = await transporter.sendMail({
          from: {
            name: 'Tripzz',
            address: process.env.EMAIL_FROM || process.env.EMAIL_USER
          },
          to: testEmail,
          subject: 'Tripzz Email Test - Configuration Successful! 🎉',
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
              <h1 style="color: #667eea;">✅ Email Configuration Successful!</h1>
              <p>Congratulations! Your Tripzz email service is working correctly.</p>
              <p>You can now send invitation emails to your circle members.</p>
              <hr style="border: none; border-top: 1px solid #ddd; margin: 20px 0;">
              <p style="color: #666; font-size: 12px;">
                This is a test email sent from your Tripzz backend.<br>
                Configuration Date: ${new Date().toLocaleString()}
              </p>
            </div>
          `,
          text: 'Email Configuration Successful! Your Tripzz email service is working correctly.'
        })
        
        console.log('✅ Test email sent successfully!')
        console.log('Message ID:', info.messageId)
        console.log('\nCheck your inbox (and spam folder) for the test email.')
        console.log('\n🎉 Email service is fully configured and working!')
        process.exit(0)
      } catch (error) {
        console.log('❌ Failed to send test email')
        console.log('Error:', error.message)
        process.exit(1)
      }
    })
  }
})

// Timeout after 30 seconds
setTimeout(() => {
  console.log('\n⏱️  Connection timeout. Please check your internet connection and SMTP settings.')
  process.exit(1)
}, 30000)
