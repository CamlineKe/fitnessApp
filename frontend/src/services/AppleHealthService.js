import axios from 'axios';

const API_URL = `${import.meta.env.VITE_API_URL}/devices`;

class AppleHealthService {
  static async connect() {
    try {
      const response = await axios.post(
        `${API_URL}/apple-health/connect`,
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

  static async disconnect() {
    try {
      const response = await axios.post(
        `${API_URL}/apple-health/disconnect`,
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

  static async getConnectionStatus() {
    try {
      const response = await axios.get(
        `${API_URL}/apple-health/status`,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`
          }
        }
      );
      return response.data.connected;
    } catch (error) {
      throw error;
    }
  }
}

export default AppleHealthService;