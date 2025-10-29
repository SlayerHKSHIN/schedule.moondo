const { google } = require('googleapis');
const fs = require('fs');
const path = require('path');

class TokenManager {
  constructor() {
    this.tokenFile = path.join(__dirname, '../.refresh_token.json');
    this.oauth2Client = new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET,
      process.env.GOOGLE_REDIRECT_URI
    );
    
    this.loadToken();
  }

  loadToken() {
    try {
      // Try userStore first (OAuth login) - read encrypted data directly
      const usersFilePath = path.join(__dirname, '../data/users.json');
      if (fs.existsSync(usersFilePath)) {
        try {
          const usersData = JSON.parse(fs.readFileSync(usersFilePath, 'utf8'));
          const user = Object.values(usersData.users || {}).find(u => u.email === 'haneul96@gmail.com');

          if (user && user.refreshToken && user.accessToken) {
            // Tokens are encrypted but we'll try to decrypt with userStore
            const userStore = require('./userStore');
            const decryptedUser = userStore.getUser(user.googleId);

            if (decryptedUser && decryptedUser.refreshToken) {
              this.oauth2Client.setCredentials({
                refresh_token: decryptedUser.refreshToken,
                access_token: decryptedUser.accessToken,
                expiry_date: decryptedUser.tokenExpiry
              });
              console.log('Token loaded from userStore (OAuth login)');
              return;
            }
          }
        } catch (userStoreError) {
          console.log('Could not load from userStore, trying file/env:', userStoreError.message);
        }
      }

      // Try to load from file
      if (fs.existsSync(this.tokenFile)) {
        const tokenData = JSON.parse(fs.readFileSync(this.tokenFile, 'utf8'));
        this.oauth2Client.setCredentials({
          refresh_token: tokenData.refresh_token,
          access_token: tokenData.access_token,
          expiry_date: tokenData.expiry_date
        });
        console.log('Token loaded from file');
      } else if (process.env.GOOGLE_REFRESH_TOKEN) {
        // Fallback to environment variable
        this.oauth2Client.setCredentials({
          refresh_token: process.env.GOOGLE_REFRESH_TOKEN
        });
        console.log('Token loaded from environment variable');
      }
    } catch (error) {
      console.error('Error loading token:', error);
    }
  }

  saveToken(tokens) {
    try {
      const tokenData = {
        refresh_token: tokens.refresh_token || this.oauth2Client.credentials.refresh_token,
        access_token: tokens.access_token,
        expiry_date: tokens.expiry_date,
        updated_at: new Date().toISOString()
      };

      // Save to .refresh_token.json
      fs.writeFileSync(this.tokenFile, JSON.stringify(tokenData, null, 2));
      console.log('Token saved to file');

      // Also update users.json if the user exists
      try {
        const userStore = require('./userStore');
        const usersFilePath = path.join(__dirname, '../data/users.json');

        if (fs.existsSync(usersFilePath)) {
          const usersData = JSON.parse(fs.readFileSync(usersFilePath, 'utf8'));
          const userEntry = Object.entries(usersData.users || {}).find(
            ([_, u]) => u.email === 'haneul96@gmail.com'
          );

          if (userEntry) {
            const [googleId, user] = userEntry;
            // Update user with new tokens
            const updatedUser = {
              googleId: googleId,
              email: user.email,
              name: user.name,
              picture: user.picture,
              refreshToken: tokenData.refresh_token,
              accessToken: tokenData.access_token,
              tokenExpiry: tokenData.expiry_date
            };

            userStore.saveUser(updatedUser);
            console.log('Token also synced to users.json');
          }
        }
      } catch (syncError) {
        console.warn('Could not sync token to users.json:', syncError.message);
        // Non-critical error, don't throw
      }
    } catch (error) {
      console.error('Error saving token:', error);
    }
  }

  async refreshAccessToken() {
    try {
      const { credentials } = await this.oauth2Client.refreshAccessToken();
      this.oauth2Client.setCredentials(credentials);
      this.saveToken(credentials);
      console.log('Access token refreshed successfully');
      return credentials;
    } catch (error) {
      console.error('Error refreshing access token:', error);
      throw error;
    }
  }

  async getValidClient() {
    try {
      // Check if access token is expired
      const now = Date.now();
      const expiryDate = this.oauth2Client.credentials.expiry_date;

      // Refresh token 10 minutes before expiry to reduce API calls
      // Google OAuth access tokens expire after 1 hour (3600 seconds)
      // Refreshing 10 minutes early provides buffer while minimizing refresh frequency
      const REFRESH_BUFFER_MS = 10 * 60 * 1000; // 10 minutes = 600,000 ms

      if (!expiryDate || now >= expiryDate - REFRESH_BUFFER_MS) {
        console.log('Access token expired or about to expire, refreshing...');
        await this.refreshAccessToken();
      }

      return this.oauth2Client;
    } catch (error) {
      console.error('Error getting valid client:', error);
      throw error;
    }
  }

  getClient() {
    return this.oauth2Client;
  }

  async checkTokenHealth() {
    try {
      const credentials = this.oauth2Client.credentials;

      // Check if refresh token exists
      if (!credentials.refresh_token) {
        return {
          status: 'invalid',
          reason: 'no_refresh_token',
          message: 'Refresh token not found. Please authenticate with Google.'
        };
      }

      // Try to refresh access token to verify refresh token is valid
      try {
        const originalExpiry = credentials.expiry_date;
        await this.refreshAccessToken();

        return {
          status: 'valid',
          message: 'Google Calendar connection is active',
          tokenExpiry: this.oauth2Client.credentials.expiry_date,
          lastRefreshed: new Date().toISOString()
        };
      } catch (refreshError) {
        // Check if refresh token itself has expired
        if (refreshError.message &&
            (refreshError.message.includes('invalid_grant') ||
             refreshError.message.includes('Token has been expired or revoked'))) {
          return {
            status: 'expired',
            reason: 'refresh_token_expired',
            message: 'Google Calendar authentication has expired. Please re-authenticate.'
          };
        }

        // Other refresh errors
        return {
          status: 'error',
          reason: 'refresh_failed',
          message: `Failed to refresh token: ${refreshError.message}`
        };
      }
    } catch (error) {
      return {
        status: 'error',
        reason: 'unknown',
        message: `Token health check failed: ${error.message}`
      };
    }
  }
}

module.exports = new TokenManager();