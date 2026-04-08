import axios from '../axiosConfig';
import Logger from '../utils/logger';

const API_URL = `/gamification`;

// 🔹 Generalized API request handler with proper error handling
const requestHandler = async (method, url, data = null, headers = null) => {
  try {
    Logger.debug(`Making ${method.toUpperCase()} request to ${url}`, {
      method,
      url,
      data
    });

    const config = {
      method,
      url,
      headers: {
        'Content-Type': 'application/json',
        ...headers
      },
      data: data || undefined
    };

    Logger.debug('Request config:', config);
    const response = await axios(config);
    Logger.info(`${method.toUpperCase()} request successful:`, response.data);
    return response.data;
  } catch (error) {
    Logger.error(`Error making ${method.toUpperCase()} request:`, error);
    throw error;
  }
};

class GamificationService {
  static async getGamificationData() {
    try {
      const response = await requestHandler('get', `${API_URL}/data`);
      return response;
    } catch (error) {
      Logger.error('Error fetching gamification data:', error);
      throw error;
    }
  }

  static async updatePoints(activity, data) {
    try {
      Logger.debug('Attempting to update points:', { activity, data });
      
      // First ensure gamification data exists
      let gamificationData = await this.getGamificationData();
      if (!gamificationData) {
        Logger.warn('No gamification data found, initializing...');
        gamificationData = await this.initializeNewUserData();
      }

      const response = await requestHandler('post', `${API_URL}/points`, { activity, data });
      Logger.info('Points updated successfully:', response);
      return response;
    } catch (error) {
      Logger.error('Error updating points:', {
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
      // First ensure gamification data exists
      let gamificationData = await this.getGamificationData();
      if (!gamificationData) {
        Logger.warn('No gamification data found, initializing...');
        gamificationData = await this.initializeNewUserData();
      }

      const response = await requestHandler('post', `${API_URL}/streak`, { category });
      return response;
    } catch (error) {
      Logger.error('Error updating streak:', error);
      throw new Error(error.response?.data?.message || 'Failed to update streak. Please try again.');
    }
  }

  static async logMood(mood) {
    try {
      const response = await requestHandler('post', `${API_URL}/mood`, { mood });
      return response;
    } catch (error) {
      Logger.error('Error logging mood:', error);
      throw error;
    }
  }

  static async checkAchievements() {
    try {
      const response = await requestHandler('get', `${API_URL}/achievements`);
      return response;
    } catch (error) {
      Logger.error('Error checking achievements:', error);
      throw error;
    }
  }

  static async getLeaderboard() {
    try {
      const response = await requestHandler('get', `${API_URL}/leaderboard`);
      return response;
    } catch (error) {
      Logger.error('Error fetching leaderboard:', error);
      throw error;
    }
  }

  static async initializeNewUserData() {
    try {
      const response = await axios.post(`${API_URL}/initialize`, {});
      Logger.info('Successfully initialized gamification data:', response.data);
      return response.data;
    } catch (error) {
      Logger.error('Error initializing gamification data:', error.response?.data || error.message);
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
