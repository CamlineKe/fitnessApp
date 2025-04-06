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
        userId: response.data.user_id
      };
    } catch (error) {
      Logger.error('Fitbit token exchange error:', error.response?.data || error.message);
      throw new Error('Failed to exchange code for Fitbit tokens');
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
          userId: tokens.userId
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
      const user = await User.findById(userId);
      if (!user?.devices?.fitbit?.connected) {
        throw new Error('Fitbit not connected');
      }

      const today = new Date().toISOString().split('T')[0];

      const response = await axios.get(
        `https://api.fitbit.com/1/user/-/activities/date/${today}.json`,
        {
          headers: {
            'Authorization': `Bearer ${user.devices.fitbit.accessToken}`
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
    } catch (error) {
      if (error.response?.status === 401) {
        // Handle token refresh here if needed
        throw new Error('Authentication expired');
      }
      throw new Error('Failed to fetch calories from Fitbit');
    }
  }

  static async getHealthData(userId) {
    try {
      const user = await User.findById(userId);
      if (!user?.devices?.fitbit?.connected) {
        throw new Error('Fitbit not connected');
      }

      const today = new Date().toISOString().split('T')[0];

      // Fetch both calories and heart rate data
      const [activitiesResponse, heartRateResponse] = await Promise.all([
        axios.get(
          `https://api.fitbit.com/1/user/-/activities/date/${today}.json`,
          {
            headers: {
              'Authorization': `Bearer ${user.devices.fitbit.accessToken}`
            }
          }
        ),
        axios.get(
          `https://api.fitbit.com/1/user/-/activities/heart/date/${today}/1d.json`,
          {
            headers: {
              'Authorization': `Bearer ${user.devices.fitbit.accessToken}`
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
    } catch (error) {
      Logger.error('Error fetching Fitbit health data:', error);
      if (error.response?.status === 401) {
        throw new Error('Authentication expired');
      }
      throw new Error('Failed to fetch health data from Fitbit');
    }
  }
}

export default FitbitService;