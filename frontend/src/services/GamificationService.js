import axios from 'axios';

const API_URL = `${import.meta.env.VITE_API_URL}/gamification`;

// Helper function to get auth headers
const getAuthHeaders = () => {
  const token = localStorage.getItem('token');
  if (!token) {
    throw new Error('No authentication token found');
  }
  return { Authorization: `Bearer ${token}` };
};

class GamificationService {
  static async getGamificationData() {
    try {
      const headers = getAuthHeaders();
      const response = await axios.get(`${API_URL}/data`, { headers });
      return response.data;
    } catch (error) {
      console.error('Error fetching gamification data:', error);
      if (!localStorage.getItem('token')) {
        throw new Error('No authentication token found');
      }
      throw error;
    }
  }

  static async updatePoints(activity, data) {
    try {
      const headers = getAuthHeaders();
      console.log('Attempting to update points:', { activity, data });
      
      // First ensure gamification data exists
      let gamificationData = await this.getGamificationData();
      if (!gamificationData) {
        console.log('No gamification data found, initializing...');
        gamificationData = await this.initializeNewUserData();
      }

      const response = await axios.post(
        `${API_URL}/points`,
        { activity, data },
        { headers }
      );
      console.log('Points updated successfully:', response.data);
      return response.data;
    } catch (error) {
      console.error('Error updating points:', {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status,
        activity,
        data
      });
      throw new Error(error.response?.data?.message || 'Failed to update points. Please try again.');
    }
  }

  static async updateStreak(category) {
    try {
      const headers = getAuthHeaders();
      
      // First ensure gamification data exists
      let gamificationData = await this.getGamificationData();
      if (!gamificationData) {
        console.log('No gamification data found, initializing...');
        gamificationData = await this.initializeNewUserData();
      }

      const response = await axios.post(
        `${API_URL}/streak`,
        { category },
        { headers }
      );
      return response.data;
    } catch (error) {
      console.error('Error updating streak:', error);
      throw new Error(error.response?.data?.message || 'Failed to update streak. Please try again.');
    }
  }

  static async logMood(mood) {
    try {
      const headers = getAuthHeaders();
      const response = await axios.post(
        `${API_URL}/mood`,
        { mood },
        { headers }
      );
      return response.data;
    } catch (error) {
      console.error('Error logging mood:', error);
      throw error;
    }
  }

  static async checkAchievements() {
    try {
      const headers = getAuthHeaders();
      const response = await axios.get(`${API_URL}/achievements`, { headers });
      return response.data;
    } catch (error) {
      console.error('Error checking achievements:', error);
      throw error;
    }
  }

  static async getLeaderboard() {
    try {
      const headers = getAuthHeaders();
      const response = await axios.get(`${API_URL}/leaderboard`, { headers });
      return response.data;
    } catch (error) {
      console.error('Error fetching leaderboard:', error);
      throw error;
    }
  }

  static async initializeNewUserData() {
    try {
      const headers = getAuthHeaders();
      const response = await axios.post(
        `${API_URL}/initialize`,
        {},  // Empty object since backend will create default data
        { headers }
      );
      console.log('Successfully initialized gamification data:', response.data);
      return response.data;
    } catch (error) {
      console.error('Error initializing gamification data:', error.response?.data || error.message);
      throw new Error('Failed to initialize gamification data. Please try again.');
    }
  }

  // Helper methods for calculating achievements and stats
  static calculateLevel(points) {
    return Math.floor((points.workout + points.mental + points.nutrition) / 100) + 1;
  }

  static getStreakEmoji(streak) {
    if (streak >= 30) return '🔥';
    if (streak >= 14) return '💪';
    if (streak >= 7) return '✨';
    return '📈';
  }

  static getMoodEmoji(mood) {
    const moodEmojis = {
      great: '😄',
      good: '🙂',
      okay: '😐',
      bad: '😕',
      terrible: '😢'
    };
    return moodEmojis[mood.toLowerCase()] || '😐';
  }

  static formatDate(date) {
    return new Date(date).toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric'
    });
  }

  static getProgressColor(percentage) {
    if (percentage >= 80) return '#2ecc71';
    if (percentage >= 60) return '#3498db';
    if (percentage >= 40) return '#f1c40f';
    if (percentage >= 20) return '#e67e22';
    return '#e74c3c';
  }
}

export default GamificationService;
