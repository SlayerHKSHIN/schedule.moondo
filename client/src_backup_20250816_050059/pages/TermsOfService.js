import React from 'react';
import { Container, Typography, Box, Paper } from '@mui/material';

function TermsOfService() {
  return (
    <Container maxWidth="md" sx={{ py: 4 }}>
      <Paper elevation={3} sx={{ p: 4 }}>
        <Typography variant="h3" component="h1" gutterBottom>
          Terms of Service
        </Typography>
        
        <Typography variant="body2" color="text.secondary" gutterBottom>
          Effective Date: {new Date().toLocaleDateString()}
        </Typography>

        <Box sx={{ mt: 4 }}>
          <Typography variant="h5" gutterBottom>
            1. Acceptance of Terms
          </Typography>
          <Typography paragraph>
            By using Schedule GLTR-OUS ("the Service"), you agree to be bound by these Terms of Service.
            If you do not agree to these terms, please do not use the Service.
          </Typography>

          <Typography variant="h5" gutterBottom sx={{ mt: 3 }}>
            2. Description of Service
          </Typography>
          <Typography paragraph>
            Schedule GLTR-OUS is an appointment scheduling service that integrates with Google Calendar to:
          </Typography>
          <ul>
            <li>Display available meeting times</li>
            <li>Allow users to book appointments</li>
            <li>Send confirmation emails</li>
            <li>Create calendar events</li>
          </ul>

          <Typography variant="h5" gutterBottom sx={{ mt: 3 }}>
            3. User Responsibilities
          </Typography>
          <Typography paragraph>
            When using the Service, you agree to:
          </Typography>
          <ul>
            <li>Provide accurate information when booking appointments</li>
            <li>Attend scheduled meetings or provide reasonable notice for cancellations</li>
            <li>Not use the Service for spam, harassment, or illegal activities</li>
            <li>Not attempt to disrupt or hack the Service</li>
          </ul>

          <Typography variant="h5" gutterBottom sx={{ mt: 3 }}>
            4. Google Account Integration
          </Typography>
          <Typography paragraph>
            The Service requires Google Calendar integration to function. By using the Service:
          </Typography>
          <ul>
            <li>You authorize us to access your Google Calendar to check availability</li>
            <li>You authorize us to create calendar events on your behalf</li>
            <li>You can revoke this access at any time through your Google Account settings</li>
          </ul>

          <Typography variant="h5" gutterBottom sx={{ mt: 3 }}>
            5. Availability and Reliability
          </Typography>
          <Typography paragraph>
            While we strive to maintain high availability:
          </Typography>
          <ul>
            <li>The Service is provided "as is" without warranties</li>
            <li>We do not guarantee 100% uptime</li>
            <li>We are not responsible for missed appointments due to technical issues</li>
          </ul>

          <Typography variant="h5" gutterBottom sx={{ mt: 3 }}>
            6. Intellectual Property
          </Typography>
          <Typography paragraph>
            All content, features, and functionality of the Service are owned by us and are protected by 
            international copyright, trademark, and other intellectual property laws.
          </Typography>

          <Typography variant="h5" gutterBottom sx={{ mt: 3 }}>
            7. Limitation of Liability
          </Typography>
          <Typography paragraph>
            To the maximum extent permitted by law, we shall not be liable for any indirect, incidental, 
            special, consequential, or punitive damages resulting from your use or inability to use the Service.
          </Typography>

          <Typography variant="h5" gutterBottom sx={{ mt: 3 }}>
            8. Modifications to Service
          </Typography>
          <Typography paragraph>
            We reserve the right to:
          </Typography>
          <ul>
            <li>Modify or discontinue the Service at any time</li>
            <li>Change these Terms of Service with notice</li>
            <li>Update features and functionality</li>
          </ul>

          <Typography variant="h5" gutterBottom sx={{ mt: 3 }}>
            9. Termination
          </Typography>
          <Typography paragraph>
            We may terminate or suspend your access to the Service immediately, without prior notice, 
            for any reason, including breach of these Terms.
          </Typography>

          <Typography variant="h5" gutterBottom sx={{ mt: 3 }}>
            10. Governing Law
          </Typography>
          <Typography paragraph>
            These Terms shall be governed by and construed in accordance with the laws of the United States, 
            without regard to its conflict of law provisions.
          </Typography>

          <Typography variant="h5" gutterBottom sx={{ mt: 3 }}>
            11. Contact Information
          </Typography>
          <Typography paragraph>
            For questions about these Terms of Service, please contact us at:
            legal@gltr-ous.us
          </Typography>
        </Box>
      </Paper>
    </Container>
  );
}

export default TermsOfService;