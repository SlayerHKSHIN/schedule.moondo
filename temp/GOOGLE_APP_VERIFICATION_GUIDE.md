# Google OAuth App Verification Guide

This guide explains how to publish your Google OAuth app from test mode to production.

## Current Status
- **App Status**: Testing (limited to test users)
- **Test User**: haneul96@gmail.com
- **Refresh Token Expiry**: 7 days (in test mode)

## Prerequisites Completed ✅
1. ✅ Privacy Policy page created at `/privacy`
2. ✅ Terms of Service page created at `/terms`
3. ✅ OAuth consent screen configured
4. ✅ Application functional with Google Calendar API

## Steps to Publish Your App

### 1. Update OAuth Consent Screen in Google Cloud Console

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Navigate to "APIs & Services" > "OAuth consent screen"
3. Click "EDIT APP"
4. Update the following:
   - **App name**: Schedule GLTR-OUS
   - **User support email**: Your email
   - **App logo**: Upload if available (optional)
   - **Application home page**: `https://hyun-schedule.moondo.ai`
   - **Application privacy policy link**: `https://hyun-schedule.moondo.ai/privacy`
   - **Application terms of service link**: `https://hyun-schedule.moondo.ai/terms`
   - **Authorized domains**: Add `moondo.ai`
   - **Developer contact information**: Your email

### 2. Configure Scopes
Ensure these scopes are added and justified:
- `https://www.googleapis.com/auth/calendar` - To read/write calendar events
- `https://www.googleapis.com/auth/gmail.send` - To send confirmation emails

### 3. Prepare Verification Requirements

#### Required Documents:
1. **Domain Verification**
   - Verify domain ownership via Google Search Console
   - Add TXT record to DNS: `google-site-verification=<your-verification-code>`

2. **OAuth Justification Form**
   - Explain why you need each scope
   - Describe your app's functionality
   - Provide screenshots/video of OAuth flow

3. **Security Assessment** (if using sensitive scopes)
   - May require third-party security audit
   - Costs $15,000-$75,000 (waived for certain cases)

### 4. Submit for Verification

1. In OAuth consent screen, click "PUBLISH APP"
2. Fill out the OAuth verification form:
   ```
   App Name: Schedule GLTR-OUS
   
   Description: 
   Schedule GLTR-OUS is a meeting scheduling application that allows users 
   to book appointments by checking calendar availability and creating events.
   
   Scope Justifications:
   - Calendar API: Required to check availability and create meeting events
   - Gmail API: Required to send confirmation emails to users who book meetings
   
   User Data Usage:
   - Calendar data is only accessed to check availability
   - No data is stored permanently
   - Email is only used for sending confirmations
   ```

3. Submit verification request

### 5. Verification Timeline
- **Initial Review**: 3-5 business days
- **Additional Information**: May be requested
- **Total Time**: 2-6 weeks typically

### 6. Post-Verification Setup

Once approved:
1. Remove test users restriction
2. Refresh tokens won't expire after 7 days
3. No more "unverified app" warning
4. Can serve unlimited users

## Important Notes

### For Multi-User Support
If you want multiple users to use their own calendars:
1. Each user needs to authenticate with their Google account
2. Store refresh tokens per user (encrypted in database)
3. Implement user session management
4. Update privacy policy to reflect multi-user data handling

### Security Best Practices
- Never expose client secret in frontend code
- Use environment variables for sensitive data
- Implement rate limiting
- Use HTTPS for all connections
- Encrypt stored refresh tokens

## Alternative: Keep in Testing Mode
If you only need a few users:
- Add up to 100 test users
- No verification required
- Refresh tokens expire every 7 days
- Must manually refresh tokens weekly

## Monitoring After Publication
- Set up Google Cloud monitoring
- Track API usage and quotas
- Monitor for security issues
- Keep privacy policy updated

## Support Resources
- [Google OAuth 2.0 Documentation](https://developers.google.com/identity/protocols/oauth2)
- [Google API Console Help](https://support.google.com/googleapi)
- [OAuth Verification FAQ](https://support.google.com/cloud/answer/9110914)

## Next Steps
1. Deploy your application to production URL
2. Ensure privacy/terms pages are accessible
3. Verify domain ownership
4. Submit for verification when ready

Remember: You can continue using the app in test mode while verification is pending.