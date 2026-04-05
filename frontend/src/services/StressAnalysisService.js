import axios from '../axiosConfig';
import Logger from '../utils/logger';

const API_URL = `${import.meta.env.VITE_API_URL}/ai/stress`;

const getStressAnalysis = async (mentalLogs = [], userId) => {
  Logger.debug("StressAnalysisService - Received mental logs:", mentalLogs);
  
  const token = localStorage.getItem('token');
  if (!token) {
    throw new Error('Unauthorized: No token found.');
  }

  try {
    // Get user data from localStorage
    const userData = JSON.parse(localStorage.getItem('user') || '{}');
    Logger.debug("StressAnalysisService - User data:", userData);

    // Prepare the request data - backend will use this to fetch additional data
    const requestData = {
      user_id: userId,
      user_data: {
        dateOfBirth: userData.dateOfBirth,
        gender: userData.gender
      },
      daily_logs: mentalLogs,
      current_check_in: mentalLogs?.[0] || null
    };

    Logger.debug("StressAnalysisService - Sending request data:", requestData);

    const response = await axios.post(API_URL, requestData, {
      headers: { 
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
    });

    Logger.debug("StressAnalysisService - Received response:", response.data);
    
    // If response.data is empty or invalid, return empty structure
    if (!response.data) {
      return {
        recommendations: [],
        analysis: {
          current_state: {
            mood: 'neutral',
            stress_level: 5,
            sleep_quality: 5,
            age: null,
            gender: 'other'
          },
          patterns: {
            stress_trend: 'neutral',
            sleep_trend: 'neutral',
            mood_trend: 'neutral'
          }
        },
        profile_complete: false
      };
    }

    return {
      recommendations: response.data.recommendations || [],
      analysis: response.data.analysis || {
        current_state: {
          mood: 'neutral',
          stress_level: 5,
          sleep_quality: 5,
          age: null,
          gender: 'other'
        },
        patterns: {
          stress_trend: 'neutral',
          sleep_trend: 'neutral',
          mood_trend: 'neutral'
        }
      },
      profile_complete: response.data.profile_complete || false
    };
  } catch (error) {
    Logger.error("StressAnalysisService - Error:", error.response?.data || error.message);
    if (error.response) {
      Logger.error("Error response data:", error.response.data);
    }
    throw error; // Propagate error to be handled by components
  }
};

export default { getStressAnalysis };