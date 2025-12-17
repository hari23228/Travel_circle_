# Email Invitation Setup Guide

## Overview
This guide explains how to set up email invitations for your Tripzz application so that circle members can receive invitation emails when invited to join a circle.

## Features Fixed
✅ **Nodemailer Integration** - Fixed the nodemailer import issue  
✅ **Accept Invitation Page** - Created `/accept-invitation` page for handling invitation links  
✅ **Redirect Support** - Login and signup pages now support redirect URLs  
✅ **Automatic Circle Join** - Users are automatically added to circles when they accept invitations  

## How It Works

### 1. Sending Invitations
When a circle admin invites a member by email:
1. A unique invitation code is generated
2. An invitation record is created in the database
3. An email is sent with:
   - Circle details (name, destination, target amount)
   - The invitation code
   - A clickable link to accept the invitation

### 2. Accepting Invitations
When a user clicks the invitation link:
1. They are redirected to `/accept-invitation?code=XXXXX`
2. If not logged in, they're redirected to login/signup with the invitation link preserved
3. Once logged in, they're automatically added to the circle
4. The invitation status is updated to "accepted"
5. They're redirected to the circle page

## Email Service Configuration

### Gmail Setup (Recommended for Development)

#### Step 1: Enable 2-Factor Authentication
1. Go to your Google Account settings: https://myaccount.google.com/
2. Navigate to Security
3. Enable 2-Factor Authentication if not already enabled

#### Step 2: Generate App-Specific Password
1. Go to: https://myaccount.google.com/apppasswords
2. Select "Mail" as the app
3. Select "Other (Custom name)" as the device
4. Enter "Tripzz Backend" as the name
5. Click "Generate"
6. Copy the 16-character password (it will look like: `xxxx xxxx xxxx xxxx`)

#### Step 3: Update Backend .env File
Update your `backend/.env` file with:

```env
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_SECURE=false
EMAIL_USER=your-email@gmail.com
EMAIL_PASSWORD=xxxx xxxx xxxx xxxx  # The 16-character app password from Step 2
EMAIL_FROM=noreply@tripzz.com  # Or use your email address
```

### Alternative Email Providers

#### SendGrid
```env
EMAIL_HOST=smtp.sendgrid.net
EMAIL_PORT=587
EMAIL_SECURE=false
EMAIL_USER=apikey
EMAIL_PASSWORD=your_sendgrid_api_key
EMAIL_FROM=noreply@yourdomain.com
```

#### Mailgun
```env
EMAIL_HOST=smtp.mailgun.org
EMAIL_PORT=587
EMAIL_SECURE=false
EMAIL_USER=postmaster@yourdomain.mailgun.org
EMAIL_PASSWORD=your_mailgun_password
EMAIL_FROM=noreply@yourdomain.com
```

#### AWS SES
```env
EMAIL_HOST=email-smtp.us-east-1.amazonaws.com
EMAIL_PORT=587
EMAIL_SECURE=false
EMAIL_USER=your_aws_access_key_id
EMAIL_PASSWORD=your_aws_secret_access_key
EMAIL_FROM=noreply@yourdomain.com
```

## Testing the Invitation Flow

### 1. Start Both Servers
```bash
# Terminal 1 - Backend
cd backend
npm install
npm run start

# Terminal 2 - Frontend
cd frontend
npm install
npm run dev
```

### 2. Test Invitation Process
1. **Create a Circle**
   - Login to your account
   - Go to Dashboard
   - Click "Create Circle"
   - Fill in circle details and create

2. **Invite a Member**
   - Go to your circle page
   - Click "Invite Members" or similar button
   - Enter the invitee's email address
   - Click "Send Invitation"

3. **Check Email**
   - The invitee should receive an email with:
     - Circle details
     - Invitation code
     - "Accept Invitation" button

4. **Accept Invitation**
   - Click the "Accept Invitation" button in the email
   - If not logged in, login or signup
   - After authentication, you'll be automatically added to the circle
   - You'll be redirected to the circle page

### 3. Testing Without Email (Manual Code Entry)
If email is not configured, users can still join using the invitation code:
1. Go to `/join-circle` page
2. Click "Enter Invite Code"
3. Enter the invitation code shown in the admin panel
4. Click "Join Circle"

## Troubleshooting

### Email Not Sending
**Check Backend Logs:**
```
warn: Email service not configured. Emails will not be sent.
```
**Solution:** Verify your EMAIL_USER and EMAIL_PASSWORD in `.env`

**Check for Gmail Authentication Errors:**
```
error: Failed to send email {"error":"Invalid login: 535-5.7.8 Username and Password not accepted"}
```
**Solution:** Make sure you're using an App-Specific Password, not your regular Gmail password

### Invitation Link Not Working
**Issue:** Users see "Invalid invitation code"  
**Solution:** Check that:
- The invitation hasn't expired (default: 7 days)
- The invitation hasn't already been accepted
- The code is entered correctly (case-insensitive)

### User Already Member
**Issue:** "You're already a member of this circle"  
**Solution:** This is expected - each user can only be a member once. They can view the circle directly.

## Database Schema

### circle_invitations Table
```sql
- id: uuid
- circle_id: uuid (foreign key to travel_circles)
- inviter_id: uuid (foreign key to profiles)
- invitee_email: text
- invitee_phone: text (optional)
- invitation_code: text (unique)
- status: text (pending, accepted, declined, expired)
- expires_at: timestamp
- responded_at: timestamp
- created_at: timestamp
```

### circle_memberships Table
```sql
- id: uuid
- circle_id: uuid (foreign key to travel_circles)
- user_id: uuid (foreign key to profiles)
- role: text (admin, moderator, member)
- status: text (active, inactive)
- joined_at: timestamp
```

## Security Considerations

1. **Invitation Expiry:** Invitations expire after 7 days by default
2. **One-Time Use:** Each invitation can only be accepted once
3. **Email Verification:** Invitations are sent to specific email addresses
4. **Authentication Required:** Users must be logged in to accept invitations
5. **Code Uniqueness:** Each invitation has a unique code

## Production Deployment

For production, consider:

1. **Use a Professional Email Service:**
   - SendGrid, Mailgun, or AWS SES
   - Better deliverability than Gmail
   - Tracking and analytics
   - Higher sending limits

2. **Configure SPF/DKIM:**
   - Set up proper email authentication
   - Improves deliverability
   - Prevents emails from going to spam

3. **Use Environment Variables:**
   - Never commit email credentials to git
   - Use secure environment variable management
   - Rotate credentials regularly

4. **Monitor Email Delivery:**
   - Track bounces and failures
   - Log all email attempts
   - Set up alerts for failures

## Need Help?

If you encounter issues:
1. Check the backend logs: `backend/logs/`
2. Verify your email credentials are correct
3. Test with a simple email first
4. Check spam/junk folders for invitation emails
5. Review the browser console for frontend errors

## Files Modified/Created

### Backend
- ✅ `backend/utils/emailService.js` - Fixed nodemailer import
- ✅ `backend/routes/circles.js` - Invitation endpoint (already working)

### Frontend
- ✅ `frontend/app/accept-invitation/page.tsx` - New page for accepting invitations
- ✅ `frontend/app/login/page.tsx` - Added redirect parameter support
- ✅ `frontend/app/signup/page.tsx` - Added redirect parameter support
- ✅ `frontend/app/join-circle/page.tsx` - Already supports manual code entry

## What's Next?

Once email is configured, you can:
- Send invitations to multiple users at once
- Track invitation status (pending, accepted, declined)
- Resend invitations if they expire
- Customize email templates
- Add SMS invitations (using Twilio)
