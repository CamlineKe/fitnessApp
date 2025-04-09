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

  // Prepare the request data
  const requestData = {
    user_data: {
      dateOfBirth: userData.dateOfBirth,
      gender: userData.gender
    },
    daily_logs: mentalLogs,
    current_check_in: mentalLogs?.[0] || null
  };

  console.log("StressAnalysisService - Sending request data:", requestData);

  try {
    const response = await axios.post(API_URL, requestData, {
      headers: { Authorization: `Bearer ${token}` },
    });

    console.log("StressAnalysisService - Received response:", response.data);
    
    // If response.data is empty or invalid, return empty structure
    if (!response.data) {
      return {
        recommendations: [],
        analysis: {
          current_state: {},
          patterns: {}
        }
      };
    }

    return response.data;
  } catch (error) {
    console.error("StressAnalysisService - Error:", error.response?.data || error.message);
    throw error; // Propagate error to be handled by components
  }
};

export default { getStressAnalysis };
