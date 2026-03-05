import axios from 'axios';
import User from '../models/User.js';
import Logger from '../utils/logger.js';

class FitbitService {
  static async getAuthUrl() {
    try {
      const scopes = [
        'activity',
        'heartrate',
        'profile'
      ];

      // Add state parameter for security
      const state = Math.random().toString(36).substring(7);

      // Make sure the redirect URI matches exactly what's registered in Fitbit
      const redirectUri = process.env.FITBIT_REDIRECT_URI;
      if (!redirectUri) {
        throw new Error('Fitbit redirect URI not configured');
      }

      const authUrl = `https://www.fitbit.com/oauth2/authorize?` +
        `response_type=code` +
        `&client_id=${process.env.FITBIT_CLIENT_ID}` +
        `&scope=${encodeURIComponent(scopes.join(' '))}` +
        `&redirect_uri=${encodeURIComponent(redirectUri)}` +
        `&state=${state}` +
        `&prompt=consent`;

      return authUrl;
    } catch (error) {
      Logger.error('Error generating Fitbit auth URL:', error);
      throw new Error('Failed to generate Fitbit authentication URL');
    }
  }

  static async exchangeCodeForTokens(code) {
    try {
      // Create Basic auth header
      const auth = Buffer.from(
        `${process.env.FITBIT_CLIENT_ID}:${process.env.FITBIT_CLIENT_SECRET}`
      ).toString('base64');

      // Create form data
      const params = new URLSearchParams();
      params.append('code', code);
      params.append('grant_type', 'authorization_code');
      params.append('redirect_uri', process.env.FITBIT_REDIRECT_URI);
      params.append('client_id', process.env.FITBIT_CLIENT_ID);

      const response = await axios.post(
        'https://api.fitbit.com/oauth2/token',
        params,
        {
          headers: {
            'Authorization': `Basic ${auth}`,
            'Content-Type': 'application/x-www-form-urlencoded'
          }
        }
      );

      return {
        accessToken: response.data.access_token,
        refreshToken: response.data.refresh_token,
        userId: response.data.user_id,
        expiresIn: response.data.expires_in
      };
    } catch (error) {
      Logger.error('Fitbit token exchange error:', error.response?.data || error.message);
      throw new Error('Failed to exchange code for Fitbit tokens');
    }
  }

  static async refreshAccessToken(userId, refreshToken) {
    try {
      Logger.debug('Refreshing Fitbit access token for user:', userId);

      const auth = Buffer.from(
        `${process.env.FITBIT_CLIENT_ID}:${process.env.FITBIT_CLIENT_SECRET}`
      ).toString('base64');

      const params = new URLSearchParams();
      params.append('grant_type', 'refresh_token');
      params.append('refresh_token', refreshToken);

      const response = await axios.post(
        'https://api.fitbit.com/oauth2/token',
        params,
        {
          headers: {
            'Authorization': `Basic ${auth}`,
            'Content-Type': 'application/x-www-form-urlencoded'
          }
        }
      );

      // Update user with new tokens
      await User.findByIdAndUpdate(userId, {
        'devices.fitbit.accessToken': response.data.access_token,
        'devices.fitbit.refreshToken': response.data.refresh_token || refreshToken,
        'devices.fitbit.lastSynced': new Date()
      });

      Logger.info('Successfully refreshed Fitbit token for user:', userId);

      return response.data.access_token;
    } catch (error) {
      Logger.error('Error refreshing Fitbit token:', error.response?.data || error.message);
      
      // If refresh fails, mark as disconnected
      await User.findByIdAndUpdate(userId, {
        'devices.fitbit.connected': false
      });
      
      throw new Error('Failed to refresh Fitbit token');
    }
  }

  static async makeAuthenticatedRequest(userId, requestFn) {
    try {
      const user = await User.findById(userId);
      if (!user?.devices?.fitbit?.connected) {
        throw new Error('Fitbit not connected');
      }

      // Try the request with current token
      return await requestFn(user.devices.fitbit.accessToken);
    } catch (error) {
      // If token expired, try to refresh and retry once
      if (error.response?.status === 401 && user?.devices?.fitbit?.refreshToken) {
        Logger.debug('Fitbit token expired, attempting refresh for user:', userId);
        
        // Refresh the token
        const newToken = await this.refreshAccessToken(userId, user.devices.fitbit.refreshToken);
        
        // Retry the request with new token
        return await requestFn(newToken);
      }
      
      // Re-throw other errors
      throw error;
    }
  }

  static async connect(userId, code) {
    try {
      const tokens = await this.exchangeCodeForTokens(code);
      await User.findByIdAndUpdate(userId, {
        'devices.fitbit': {
          connected: true,
          accessToken: tokens.accessToken,
          refreshToken: tokens.refreshToken,
          userId: tokens.userId,
          lastSynced: new Date()
        }
      });
      return { success: true };
    } catch (error) {
      Logger.error('Error connecting Fitbit:', error);
      throw new Error('Failed to connect Fitbit');
    }
  }

  static async disconnect(userId) {
    try {
      await User.findByIdAndUpdate(userId, {
        $unset: { 'devices.fitbit': "" }
      });
      return { success: true };
    } catch (error) {
      throw new Error('Failed to disconnect Fitbit');
    }
  }

  static async getConnectionStatus(userId) {
    try {
      const user = await User.findById(userId);
      return {
        connected: !!(user?.devices?.fitbit?.connected)
      };
    } catch (error) {
      throw new Error('Failed to get Fitbit connection status');
    }
  }

  static async getCaloriesBurned(userId) {
    try {
      return await this.makeAuthenticatedRequest(userId, async (accessToken) => {
        const today = new Date().toISOString().split('T')[0];

        const response = await axios.get(
          `https://api.fitbit.com/1/user/-/activities/date/${today}.json`,
          {
            headers: {
              'Authorization': `Bearer ${accessToken}`
            }
          }
        );

        const caloriesData = response.data.summary.caloriesOut || 0;

        // Update last synced time
        await User.findByIdAndUpdate(userId, {
          'devices.fitbit.lastSynced': new Date()
        });

        return {
          calories: Math.round(caloriesData),
          lastSynced: new Date()
        };
      });
    } catch (error) {
      Logger.error('Error fetching calories from Fitbit:', error);
      throw new Error('Failed to fetch calories from Fitbit');
    }
  }

  static async getHealthData(userId) {
    try {
      return await this.makeAuthenticatedRequest(userId, async (accessToken) => {
        const today = new Date().toISOString().split('T')[0];

        // Fetch both calories and heart rate data
        const [activitiesResponse, heartRateResponse] = await Promise.all([
          axios.get(
            `https://api.fitbit.com/1/user/-/activities/date/${today}.json`,
            {
              headers: {
                'Authorization': `Bearer ${accessToken}`
              }
            }
          ),
          axios.get(
            `https://api.fitbit.com/1/user/-/activities/heart/date/${today}/1d.json`,
            {
              headers: {
                'Authorization': `Bearer ${accessToken}`
              }
            }
          )
        ]);

        const calories = activitiesResponse.data.summary.caloriesOut || 0;
        const heartRate = heartRateResponse.data['activities-heart'][0]?.value?.restingHeartRate || 0;

        // Update user's health data
        await User.findByIdAndUpdate(userId, {
          'devices.fitbit.healthData': {
            calories: Math.round(calories),
            heartRate: Math.round(heartRate),
            lastUpdated: new Date()
          },
          'devices.fitbit.lastSynced': new Date()
        });

        return {
          calories: Math.round(calories),
          heartRate: Math.round(heartRate),
          lastSynced: new Date()
        };
      });
    } catch (error) {
      Logger.error('Error fetching Fitbit health data:', error);
      throw new Error('Failed to fetch health data from Fitbit');
    }
  }
}

export default FitbitService;