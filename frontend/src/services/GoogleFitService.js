import axios from 'axios';

const API_URL = `${import.meta.env.VITE_API_URL}/sync`;

class GoogleFitService {
  static async connect() {
    try {
      console.log('Starting Google Fit connection...');

      const response = await axios.get(`${API_URL}/google-fit/auth-url`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`
        },
        params: {
          redirectUri: `${window.location.origin}/auth/callback`
        }
      });

      console.log('Received auth URL:', response.data.authUrl);

      return new Promise((resolve, reject) => {
        const width = 600;
        const height = 800;
        const left = window.screenX + (window.outerWidth - width) / 2;
        const top = window.screenY + (window.outerHeight - height) / 2;

        const authWindow = window.open(
          response.data.authUrl,
          'Google Fit Auth',
          `width=${width},height=${height},left=${left},top=${top}`
        );

        if (!authWindow) {
          reject(new Error('Popup window was blocked'));
          return;
        }

        const handleMessage = (event) => {
          if (event.origin !== window.location.origin) return;

          if (event.data.type === 'GOOGLE_FIT_AUTH_SUCCESS') {
            window.removeEventListener('message', handleMessage);
            resolve({ success: true });
          } else if (event.data.type === 'GOOGLE_FIT_AUTH_ERROR') {
            window.removeEventListener('message', handleMessage);
            reject(new Error(event.data.error));
          }
        };

        window.addEventListener('message', handleMessage);

        // Timeout after 5 minutes
        setTimeout(() => {
          window.removeEventListener('message', handleMessage);
          reject(new Error('Authentication timed out'));
        }, 300000);
      });
    } catch (error) {
      console.error('Connection error:', error);
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
      return response.data;
    } catch (error) {
      console.error('Disconnect error:', error);
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
      console.error('Health data error:', error);
      throw error;
    }
  }

  static async handleAuthCallback(code) {
    try {
      const response = await fetch('http://localhost:3000/auth/google/callback', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ code }),
      });

      if (!response.ok) {
        throw new Error('Failed to exchange authorization code');
      }

      const data = await response.json();
      // Store the access token or handle the response as needed
      return data;
    } catch (error) {
      console.error('Error handling auth callback:', error);
      throw error;
    }
  }
}

export default GoogleFitService;