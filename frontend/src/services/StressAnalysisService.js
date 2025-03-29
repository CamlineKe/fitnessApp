import axios from 'axios';

const API_URL = `${import.meta.env.VITE_API_URL}/ai/stress`;

const getStressAnalysis = async (mentalLogs = []) => {
  console.log("StressAnalysisService - Received mental logs:", mentalLogs);
  
  const token = localStorage.getItem('token');
  if (!token) {
    throw new Error('Unauthorized: No token found.');
  }

  // Get user data from localStorage
  const userData = JSON.parse(localStorage.getItem('user') || '{}');
  console.log("StressAnalysisService - User data:", userData);

  // If no logs exist, use default values
  const defaultLog = {
    mood: 'neutral',
    stressLevel: 5,
    sleepQuality: 10
  };

  // Use the first log if it exists, otherwise use default
  const currentLog = mentalLogs?.[0] || defaultLog;

  // Prepare the request data
  const requestData = {
    user_data: {
      dateOfBirth: userData.dateOfBirth,
      gender: userData.gender
    },
    daily_logs: mentalLogs,
    current_check_in: currentLog
  };

  console.log("StressAnalysisService - Sending request data:", requestData);

  try {
    const response = await axios.post(API_URL, requestData, {
      headers: { Authorization: `Bearer ${token}` },
    });

    console.log("StressAnalysisService - Received response:", response.data);
    
    // Ensure we always return a valid structure
    const defaultResponse = {
      recommendations: [
        "Welcome to your stress management journey!",
        "- Track your daily mood and stress levels",
        "- Practice basic stress management techniques",
        "- Establish a consistent sleep schedule",
        "- Engage in regular physical activity"
      ],
      analysis: {
        current_state: {
          mood: currentLog.mood,
          stress_level: currentLog.stressLevel,
          sleep_quality: currentLog.sleepQuality
        },
        patterns: {
          stress_trend: 'neutral',
          sleep_trend: 'neutral',
          mood_trend: 'neutral'
        }
      }
    };

    // If response.data is empty or invalid, use default
    if (!response.data || !response.data.recommendations) {
      return defaultResponse;
    }

    return response.data;
  } catch (error) {
    console.error("StressAnalysisService - Error:", error.response?.data || error.message);
    // Return default response on error instead of throwing
    return {
      recommendations: [
        "Welcome to your stress management journey!",
        "- Track your daily mood and stress levels",
        "- Practice basic stress management techniques",
        "- Establish a consistent sleep schedule",
        "- Engage in regular physical activity"
      ],
      analysis: {
        current_state: {
          mood: currentLog.mood,
          stress_level: currentLog.stressLevel,
          sleep_quality: currentLog.sleepQuality
        },
        patterns: {
          stress_trend: 'neutral',
          sleep_trend: 'neutral',
          mood_trend: 'neutral'
        }
      }
    };
  }
};

export default { getStressAnalysis };
