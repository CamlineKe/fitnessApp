import axios from 'axios';
import User from '../models/User.js';

class GoogleFitService {
  static async getAuthUrl() {
    try {
      const scopes = [
        'https://www.googleapis.com/auth/fitness.activity.read',
        'https://www.googleapis.com/auth/fitness.heart_rate.read',
        'https://www.googleapis.com/auth/fitness.body.read'
      ];

      const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?` +
        `client_id=${process.env.GOOGLE_CLIENT_ID}` +
        `&redirect_uri=${encodeURIComponent(process.env.GOOGLE_REDIRECT_URI)}` +
        `&response_type=code` +
        `&scope=${encodeURIComponent(scopes.join(' '))}` +
        `&access_type=offline` +
        `&prompt=consent` +
        `&include_granted_scopes=true`;

      console.log('Generated Google Fit Auth URL:', authUrl);
      return authUrl;
    } catch (error) {
      console.error('Error generating Google Fit auth URL:', error);
      throw new Error('Failed to generate Google Fit authentication URL');
    }
  }

  static async exchangeCodeForTokens(code) {
    try {
      const response = await axios.post('https://oauth2.googleapis.com/token', {
        client_id: process.env.GOOGLE_CLIENT_ID,
        client_secret: process.env.GOOGLE_CLIENT_SECRET,
        code,
        grant_type: 'authorization_code',
        redirect_uri: process.env.GOOGLE_REDIRECT_URI
      });

      return {
        accessToken: response.data.access_token,
        refreshToken: response.data.refresh_token
      };
    } catch (error) {
      console.error('Token exchange error:', error.response?.data || error.message);
      throw new Error('Failed to exchange code for tokens');
    }
  }

  static async connect(userId, code) {
    try {
      const tokens = await this.exchangeCodeForTokens(code);
      await User.findByIdAndUpdate(userId, {
        'devices.googleFit': {
          connected: true,
          accessToken: tokens.accessToken,
          refreshToken: tokens.refreshToken
        }
      });
      return { success: true };
    } catch (error) {
      throw new Error('Failed to connect Google Fit');
    }
  }

  static async disconnect(userId) {
    try {
      await User.findByIdAndUpdate(userId, {
        $unset: { 'devices.googleFit': "" }
      });
      return { success: true };
    } catch (error) {
      throw new Error('Failed to disconnect Google Fit');
    }
  }

  static async getConnectionStatus(userId) {
    try {
      const user = await User.findById(userId);
      return {
        connected: !!(user?.devices?.googleFit?.connected)
      };
    } catch (error) {
      throw new Error('Failed to get Google Fit connection status');
    }
  }

  static async getCaloriesBurned(userId) {
    try {
      const user = await User.findById(userId);
      if (!user?.devices?.googleFit?.connected) {
        throw new Error('Google Fit not connected');
      }

      const endTime = new Date();
      const startTime = new Date();
      startTime.setHours(0, 0, 0, 0);

      const response = await axios.post(
        'https://www.googleapis.com/fitness/v1/users/me/dataset:aggregate',
        {
          aggregateBy: [{
            dataTypeName: "com.google.calories.expended"
          }],
          startTimeMillis: startTime.getTime(),
          endTimeMillis: endTime.getTime()
        },
        {
          headers: {
            'Authorization': `Bearer ${user.devices.googleFit.accessToken}`
          }
        }
      );

      const caloriesData = response.data.bucket[0]?.dataset[0]?.point[0]?.value[0]?.fpVal || 0;

      // Update last synced time
      await User.findByIdAndUpdate(userId, {
        'devices.googleFit.lastSynced': new Date()
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
      throw new Error('Failed to fetch calories from Google Fit');
    }
  }

  static async getHealthData(userId) {
    try {
      const user = await User.findById(userId);
      if (!user?.devices?.googleFit?.connected) {
        throw new Error('Google Fit not connected');
      }

      const endTime = new Date();
      const startTime = new Date();
      startTime.setHours(0, 0, 0, 0);

      const [caloriesResponse, heartRateResponse] = await Promise.all([
        axios.post(
          'https://www.googleapis.com/fitness/v1/users/me/dataset:aggregate',
          {
            aggregateBy: [{
              dataTypeName: "com.google.calories.expended"
            }],
            startTimeMillis: startTime.getTime(),
            endTimeMillis: endTime.getTime()
          },
          {
            headers: {
              'Authorization': `Bearer ${user.devices.googleFit.accessToken}`
            }
          }
        ),
        axios.post(
          'https://www.googleapis.com/fitness/v1/users/me/dataset:aggregate',
          {
            aggregateBy: [{
              dataTypeName: "com.google.heart_rate.bpm"
            }],
            startTimeMillis: startTime.getTime(),
            endTimeMillis: endTime.getTime()
          },
          {
            headers: {
              'Authorization': `Bearer ${user.devices.googleFit.accessToken}`
            }
          }
        )
      ]);

      const calories = caloriesResponse.data.bucket[0]?.dataset[0]?.point[0]?.value[0]?.fpVal || 0;
      const heartRate = heartRateResponse.data.bucket[0]?.dataset[0]?.point[0]?.value[0]?.fpVal || 0;

      await User.findByIdAndUpdate(userId, {
        'devices.googleFit.healthData': {
          calories: Math.round(calories),
          heartRate: Math.round(heartRate),
          lastUpdated: new Date()
        },
        'devices.googleFit.lastSynced': new Date()
      });

      return {
        calories: Math.round(calories),
        heartRate: Math.round(heartRate),
        lastSynced: new Date()
      };
    } catch (error) {
      console.error('Error fetching Google Fit health data:', error);
      if (error.response?.status === 401) {
        throw new Error('Authentication expired');
      }
      throw new Error('Failed to fetch health data from Google Fit');
    }
  }
}

export default GoogleFitService;