import axios from 'axios';
import User from '../models/User.js';

class AppleHealthService {
  static async getAppleHealthData(userId, accessToken) {
    try {
      const response = await axios.get(`https://api.applehealth.com/users/${userId}/data`, {
        headers: {
          'Authorization': `Bearer ${accessToken}`
        }
      });
      return response.data;
    } catch (error) {
      console.error('Failed to fetch Apple Health data:', error);
      throw new Error('Failed to fetch Apple Health data');
    }
  }

  static async connect(userId) {
    try {
      await User.findByIdAndUpdate(userId, {
        'devices.appleHealth': {
          connected: true,
          lastSynced: new Date()
        }
      });
      return { success: true };
    } catch (error) {
      throw new Error('Failed to connect Apple Health');
    }
  }

  static async disconnect(userId) {
    try {
      await User.findByIdAndUpdate(userId, {
        $unset: { 'devices.appleHealth': "" }
      });
      return { success: true };
    } catch (error) {
      throw new Error('Failed to disconnect Apple Health');
    }
  }

  static async getConnectionStatus(userId) {
    try {
      const user = await User.findById(userId);
      return {
        connected: !!(user?.devices?.appleHealth?.connected)
      };
    } catch (error) {
      throw new Error('Failed to get Apple Health connection status');
    }
  }
}

export default AppleHealthService;