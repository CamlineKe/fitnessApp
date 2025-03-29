import axios from 'axios';

const API_URL = `${import.meta.env.VITE_API_URL}/sync`;

class FitbitService {
  static async connect() {
    try {
      const response = await axios.get(`${API_URL}/fitbit/auth-url`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`
        }
      });

      // Create a popup window for auth
      const width = 600;
      const height = 800;
      const left = window.screenX + (window.outerWidth - width) / 2;
      const top = window.screenY + (window.outerHeight - height) / 2;

      const authUrl = response.data.authUrl;
      const popup = window.open(
        authUrl,
        'Fitbit Auth',
        `width=${width},height=${height},left=${left},top=${top}`
      );

      if (!popup) {
        throw new Error('Popup was blocked. Please enable popups for this site.');
      }

    } catch (error) {
      console.error('Error connecting to Fitbit:', error);
      throw error;
    }
  }

  static async handleAuthCallback(code) {
    try {
      const response = await axios.post(
        `${API_URL}/fitbit/connect`,
        { code },
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`
          }
        }
      );
      return response.data;
    } catch (error) {
      console.error('Error handling Fitbit callback:', error);
      throw error;
    }
  }

  static async disconnect() {
    try {
      const response = await axios.post(
        `${API_URL}/fitbit/disconnect`,
        {},
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`
          }
        }
      );
      return response.data;
    } catch (error) {
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
      throw error;
    }
  }
}

export default FitbitService;