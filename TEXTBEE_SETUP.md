# TextBee SMS Integration Setup

This project now uses TextBee instead of Twilio for SMS notifications. TextBee is a cost-effective, open-source SMS gateway that turns any Android device into a powerful SMS messaging system.

## Why TextBee?

- **Cost-effective**: Uses your existing mobile plan, no per-message fees
- **Open source**: Full control and transparency
- **Simple integration**: RESTful API with standard HTTP
- **Free tier**: 50 messages/day, 300/month with 1 device
- **No registration fees**: Unlike Twilio's paid verification system

## Quick Setup Guide

### 1. Create TextBee Account

1. Go to [textbee.dev](https://textbee.dev)
2. Sign up for a free account
3. Access your dashboard at [textbee.dev/dashboard](https://textbee.dev/dashboard)

### 2. Install TextBee Android App

1. Download the TextBee app from Google Play Store or from their website
2. Install it on an Android device (phone or tablet)
3. Log in with your TextBee account credentials

### 3. Register Your Device

1. Open the TextBee app on your Android device
2. Register your device with the service
3. Note down your **Device ID** from the app (you'll need this)

### 4. Get Your API Key

1. In your TextBee dashboard, go to API settings
2. Copy your **API Key** 

### 5. Configure Environment Variables

Create a `.env` file in your project root with:

```env
# TextBee SMS Configuration
TEXTBEE_API_KEY=your-api-key-from-dashboard
TEXTBEE_DEVICE_ID=your-device-id-from-app

# Other existing variables...
DATABASE_URL=file:./pili_jobs.db
JWT_SECRET=your-jwt-secret
```

## How It Works

### Job Application Flow with SMS

1. **Job Seeker Applies**: When someone applies for a job
   - Applicant receives confirmation SMS with job details
   - Employer receives notification SMS about new application

2. **Status Updates**: When employers update application status
   - Applicant receives SMS notification about status changes
   - Different messages for: reviewed, accepted, rejected, interview, etc.

### Sample SMS Messages

**Application Confirmation (to job seeker):**
```
Hi John! Your application for "Marketing Assistant" at ABC Company has been received. We'll contact you soon. - Pili Jobs
```

**New Application (to employer):**
```
New job application received! John Doe has applied for "Marketing Assistant". Check your employer dashboard for details. - Pili Jobs
```

**Status Update (to job seeker):**
```
Congratulations John! Your application for "Marketing Assistant" at ABC Company has been accepted. They will contact you soon. - Pili Jobs
```

## Features

- ✅ Application confirmations
- ✅ Employer notifications  
- ✅ Status update notifications
- ✅ Retry mechanism for failed SMS
- ✅ Graceful fallback when SMS is unavailable
- ✅ Detailed logging for debugging

## Troubleshooting

### SMS Not Sending?

1. **Check Environment Variables**: Ensure `TEXTBEE_API_KEY` and `TEXTBEE_DEVICE_ID` are set
2. **Verify Device Connection**: Make sure your Android device is online and the TextBee app is running
3. **Check API Limits**: Free accounts have daily/monthly limits
4. **Phone Number Format**: Ensure phone numbers include country code (e.g., +63 for Philippines)

### Common Issues

**"TextBee not initialized"**: 
- Check your `.env` file has the correct variables
- Restart the server after adding environment variables

**"SMS sending failed"**:
- Verify your Android device has internet connection
- Check if TextBee app is running and logged in
- Ensure you haven't exceeded your daily SMS limit

### Logs

The application provides detailed logging:
```
TextBee Environment Check: { apiKey: 'Set', deviceId: 'Set' }
TextBee client initialized successfully
Application confirmation SMS sent to +639123456789
```

## Cost Comparison

| Service | Setup Cost | Monthly Cost | Per Message |
|---------|------------|--------------|-------------|
| Twilio | Free | $0+ | $0.0075+ |
| TextBee | Free | $0-20+ | $0 (uses your plan) |

## Security Notes

- Keep your API key secure and never commit it to version control
- Use environment variables for all sensitive configuration
- TextBee uses HTTPS for all API communications
- Your SMS data stays on your device until sent

## Support

- TextBee Documentation: [textbee.dev/docs](https://textbee.dev/docs)
- GitHub Issues: [github.com/vernu/textbee](https://github.com/vernu/textbee)
- Dashboard: [textbee.dev/dashboard](https://textbee.dev/dashboard)

---

The SMS integration is now ready! Job seekers and employers will receive notifications via TextBee when you configure the service.