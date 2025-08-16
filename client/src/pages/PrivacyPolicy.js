import React from 'react';
import { Container, Typography, Box, Paper } from '@mui/material';

function PrivacyPolicy() {
  return (
    <Container maxWidth="md" sx={{ py: 4 }}>
      <Paper elevation={3} sx={{ p: 4 }}>
        <Typography variant="h3" component="h1" gutterBottom>
          Privacy Policy
        </Typography>
        
        <Typography variant="body2" color="text.secondary" gutterBottom>
          Effective Date: {new Date().toLocaleDateString()}
        </Typography>

        <Box sx={{ mt: 4 }}>
          <Typography variant="h5" gutterBottom>
            1. Information We Collect
          </Typography>
          <Typography paragraph>
            When you use Schedule GLTR-OUS, we collect:
          </Typography>
          <ul>
            <li>Your name and email address when booking appointments</li>
            <li>Meeting preferences (date, time, purpose)</li>
            <li>Google Calendar data necessary to check availability and create events</li>
          </ul>

          <Typography variant="h5" gutterBottom sx={{ mt: 3 }}>
            2. How We Use Your Information
          </Typography>
          <Typography paragraph>
            We use your information solely to:
          </Typography>
          <ul>
            <li>Schedule meetings on Google Calendar</li>
            <li>Send confirmation emails about your appointments</li>
            <li>Display available time slots based on calendar availability</li>
          </ul>

          <Typography variant="h5" gutterBottom sx={{ mt: 3 }}>
            3. Google API Services
          </Typography>
          <Typography paragraph>
            Our app uses Google Calendar API and Gmail API to:
          </Typography>
          <ul>
            <li>Read calendar events to determine availability</li>
            <li>Create calendar events for scheduled meetings</li>
            <li>Send email confirmations through Gmail</li>
          </ul>
          <Typography paragraph>
            We only access the minimum necessary data required for these functions.
            We do not store your Google credentials or calendar data permanently.
          </Typography>

          <Typography variant="h5" gutterBottom sx={{ mt: 3 }}>
            4. Data Storage and Security
          </Typography>
          <Typography paragraph>
            - We do not permanently store your personal calendar data
          </Typography>
          <Typography paragraph>
            - Meeting information is stored only for the duration needed to create the calendar event
          </Typography>
          <Typography paragraph>
            - We use secure HTTPS connections for all data transmission
          </Typography>

          <Typography variant="h5" gutterBottom sx={{ mt: 3 }}>
            5. Data Sharing
          </Typography>
          <Typography paragraph>
            We do not sell, trade, or share your personal information with third parties.
            Your data is only used for the scheduling service you requested.
          </Typography>

          <Typography variant="h5" gutterBottom sx={{ mt: 3 }}>
            6. Your Rights
          </Typography>
          <Typography paragraph>
            You have the right to:
          </Typography>
          <ul>
            <li>Request information about data we have collected</li>
            <li>Request deletion of your data</li>
            <li>Revoke Google Calendar access at any time through your Google Account settings</li>
          </ul>

          <Typography variant="h5" gutterBottom sx={{ mt: 3 }}>
            7. Contact Information
          </Typography>
          <Typography paragraph>
            For privacy concerns or questions, please contact us at:
            privacy@gltr-ous.us
          </Typography>

          <Typography variant="h5" gutterBottom sx={{ mt: 3 }}>
            8. Changes to This Policy
          </Typography>
          <Typography paragraph>
            We may update this privacy policy from time to time. 
            We will notify users of any material changes by updating the "Effective Date" at the top of this policy.
          </Typography>
        </Box>
      </Paper>
    </Container>
  );
}

export default PrivacyPolicy;