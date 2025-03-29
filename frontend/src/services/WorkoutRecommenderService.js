import axios from 'axios';

const API_URL = `${import.meta.env.VITE_API_URL}/ai/workout`;

const getWorkoutRecommendations = async () => {
  const token = localStorage.getItem('token');
  if (!token) {
    throw new Error('Unauthorized: No token found.');
  }

  try {
    const response = await axios.post(API_URL, null, {
      headers: { Authorization: `Bearer ${token}` },
    });

    console.log('Workout recommendations response:', response.data);

    // Ensure we have a consistent response format
    const data = response.data;
    return {
      recommendations: data.recommendations || [],
      analysis: data.analysis || {
        current_workout: {},
        weekly_stats: {},
        heart_rate_zones: {},
        profile_data: {}
      },
      profile_complete: data.profile_complete || false
    };
  } catch (error) {
    console.error('Error fetching workout recommendations:', error);
    if (error.response) {
      console.error('Error response data:', error.response.data);
    }
    throw error;
  }
};

export default { getWorkoutRecommendations };