const nodemailer = require('nodemailer')
const { logger } = require('../middleware/logger')

// Email transporter configuration
const createTransporter = () => {
  const emailConfig = {
    host: process.env.EMAIL_HOST || 'smtp.gmail.com',
    port: parseInt(process.env.EMAIL_PORT) || 587,
    secure: process.env.EMAIL_SECURE === 'true', // true for 465, false for other ports
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASSWORD
    }
  }

  // If email credentials are not configured, log warning
  if (!emailConfig.auth.user || !emailConfig.auth.pass) {
    logger.warn('Email service not configured. Emails will not be sent.')
    return null
  }

  try {
    const transporter = nodemailer.createTransport(emailConfig)
    return transporter
  } catch (error) {
    logger.error('Failed to create email transporter', { error: error.message })
    return null
  }
}

const transporter = createTransporter()

// Email templates
const emailTemplates = {
  circleInvitation: (data) => {
    const { circleName, inviterName, invitationCode, acceptUrl, circleDestination, targetAmount } = data
    
    return {
      subject: `🌍 Join ${circleName} on Tripzz - Travel Circle Invitation`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
            .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
            .invitation-code { background: white; border: 2px dashed #667eea; padding: 20px; text-align: center; margin: 20px 0; border-radius: 8px; }
            .code { font-size: 32px; font-weight: bold; color: #667eea; letter-spacing: 3px; font-family: monospace; }
            .button { display: inline-block; background: #667eea; color: white; padding: 15px 40px; text-decoration: none; border-radius: 8px; margin: 20px 0; font-weight: bold; }
            .button:hover { background: #5568d3; }
            .details { background: white; padding: 20px; border-radius: 8px; margin: 20px 0; }
            .detail-row { display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid #eee; }
            .footer { text-align: center; color: #666; font-size: 12px; margin-top: 30px; padding-top: 20px; border-top: 1px solid #ddd; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>🎉 You're Invited to Join a Travel Circle!</h1>
            </div>
            <div class="content">
              <p>Hi there!</p>
              
              <p><strong>${inviterName}</strong> has invited you to join their travel circle on Tripzz!</p>
              
              <div class="details">
                <h3 style="margin-top: 0; color: #667eea;">Trip Details:</h3>
                <div class="detail-row">
                  <span><strong>Circle Name:</strong></span>
                  <span>${circleName}</span>
                </div>
                <div class="detail-row">
                  <span><strong>Destination:</strong></span>
                  <span>${circleDestination || 'Various'}</span>
                </div>
                <div class="detail-row" style="border-bottom: none;">
                  <span><strong>Target Amount:</strong></span>
                  <span>₹${targetAmount ? parseInt(targetAmount).toLocaleString() : 'TBD'}</span>
                </div>
              </div>

              <p><strong>What is a Travel Circle?</strong></p>
              <p>Join a group of friends to save money together for your next amazing trip! Everyone contributes regularly, and together you'll reach your travel goals faster.</p>

              <div class="invitation-code">
                <p style="margin: 0 0 10px 0; color: #666;">Your Invitation Code:</p>
                <div class="code">${invitationCode}</div>
              </div>

              <div style="text-align: center;">
                <a href="${acceptUrl}" class="button">Accept Invitation & Join Now</a>
              </div>

              <p style="margin-top: 30px; font-size: 14px; color: #666;">
                Or copy and paste this link into your browser:<br/>
                <span style="color: #667eea; word-break: break-all;">${acceptUrl}</span>
              </p>

              <p style="margin-top: 30px; font-size: 14px; color: #666;">
                You can also manually enter the invitation code on the Tripzz website.
              </p>
            </div>
            <div class="footer">
              <p>This invitation will expire in 7 days.</p>
              <p>If you didn't expect this invitation, you can safely ignore this email.</p>
              <p>&copy; ${new Date().getFullYear()} Tripzz - Travel Together, Save Together</p>
            </div>
          </div>
        </body>
        </html>
      `,
      text: `
You're Invited to Join ${circleName}!

${inviterName} has invited you to join their travel circle on Tripzz.

Trip Details:
- Circle Name: ${circleName}
- Destination: ${circleDestination || 'Various'}
- Target Amount: ₹${targetAmount ? parseInt(targetAmount).toLocaleString() : 'TBD'}

Your Invitation Code: ${invitationCode}

Accept your invitation here:
${acceptUrl}

This invitation will expire in 7 days.

---
Tripzz - Travel Together, Save Together
      `
    }
  },

  invitationAccepted: (data) => {
    const { circleName, memberName, circleUrl } = data
    
    return {
      subject: `✅ ${memberName} has joined ${circleName}`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #10b981 0%, #059669 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
            .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
            .button { display: inline-block; background: #10b981; color: white; padding: 15px 40px; text-decoration: none; border-radius: 8px; margin: 20px 0; font-weight: bold; }
            .footer { text-align: center; color: #666; font-size: 12px; margin-top: 30px; padding-top: 20px; border-top: 1px solid #ddd; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>🎉 New Member Joined!</h1>
            </div>
            <div class="content">
              <p>Great news!</p>
              
              <p><strong>${memberName}</strong> has accepted your invitation and joined <strong>${circleName}</strong>.</p>
              
              <p>Your circle is growing! You're one step closer to your travel goals.</p>

              <div style="text-align: center;">
                <a href="${circleUrl}" class="button">View Circle</a>
              </div>
            </div>
            <div class="footer">
              <p>&copy; ${new Date().getFullYear()} Tripzz - Travel Together, Save Together</p>
            </div>
          </div>
        </body>
        </html>
      `,
      text: `
New Member Joined!

${memberName} has accepted your invitation and joined ${circleName}.

Your circle is growing! You're one step closer to your travel goals.

View your circle: ${circleUrl}

---
Tripzz - Travel Together, Save Together
      `
    }
  }
}

// Send email function
const sendEmail = async (to, templateName, templateData) => {
  if (!transporter) {
    logger.warn('Email not sent - transporter not configured', { to, templateName })
    return { success: false, message: 'Email service not configured' }
  }

  try {
    const emailTemplate = emailTemplates[templateName](templateData)
    
    const mailOptions = {
      from: {
        name: 'Tripzz',
        address: process.env.EMAIL_FROM || process.env.EMAIL_USER
      },
      to,
      subject: emailTemplate.subject,
      text: emailTemplate.text,
      html: emailTemplate.html
    }

    const info = await transporter.sendMail(mailOptions)
    
    logger.info('Email sent successfully', { 
      to, 
      templateName, 
      messageId: info.messageId 
    })
    
    return { 
      success: true, 
      messageId: info.messageId,
      message: 'Email sent successfully'
    }
  } catch (error) {
    logger.error('Failed to send email', { 
      error: error.message, 
      to, 
      templateName 
    })
    
    return { 
      success: false, 
      error: error.message,
      message: 'Failed to send email'
    }
  }
}

// Verify email configuration
const verifyEmailConfig = async () => {
  if (!transporter) {
    return { success: false, message: 'Email service not configured' }
  }

  try {
    await transporter.verify()
    logger.info('Email service verified successfully')
    return { success: true, message: 'Email service is ready' }
  } catch (error) {
    logger.error('Email service verification failed', { error: error.message })
    return { success: false, message: error.message }
  }
}

module.exports = {
  sendEmail,
  verifyEmailConfig,
  emailTemplates
}
