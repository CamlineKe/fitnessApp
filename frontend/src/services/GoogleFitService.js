import axios from 'axios';
import Logger from '../utils/logger';

const API_URL = `${import.meta.env.VITE_API_URL}/sync`;

class GoogleFitService {
  static async connect() {
    try {
      Logger.debug('Starting Google Fit connection...');

      const response = await axios.get(`${API_URL}/google-fit/auth-url`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`
        }
      });

      Logger.debug('Received auth URL:', response.data.authUrl);

      // Open the auth URL in a popup - the callback page will handle the redirect
      const width = 600;
      const height = 800;
      const left = window.screenX + (window.outerWidth - width) / 2;
      const top = window.screenY + (window.outerHeight - height) / 2;

      const authWindow = window.open(
        response.data.authUrl,
        'Google Fit Auth',
        `width=${width},height=${height},left=${left},top=${top},scrollbars=yes,resizable=yes`
      );

      if (!authWindow) {
        throw new Error('Popup window was blocked. Please allow popups for this site.');
      }

      // The callback page will handle the rest and redirect back to profile
      return { success: true, message: 'Authentication window opened' };
    } catch (error) {
      Logger.error('Google Fit connection error:', error);
      throw error;
    }
  }

  static async disconnect() {
    try {
      const response = await axios.post(
        `${API_URL}/google-fit/disconnect`,
        {},
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`
          }
        }
      );
      Logger.info('Google Fit disconnected successfully');
      return response.data;
    } catch (error) {
      Logger.error('Google Fit disconnect error:', error);
      throw error;
    }
  }

  static async getHealthData() {
    try {
      const response = await axios.get(`${API_URL}/health-data`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`
        }
      });
      return response.data;
    } catch (error) {
      Logger.error('Health data error:', error);
      throw error;
    }
  }

  static async getAuthUrl() {
    try {
      const response = await axios.get(`${API_URL}/google-fit/auth-url`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`
        }
      });
      return response.data;
    } catch (error) {
      Logger.error('Error getting auth URL:', error);
      throw error;
    }
  }
}

export default GoogleFitService;