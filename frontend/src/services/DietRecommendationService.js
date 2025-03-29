import axios from 'axios';

const API_URL = `${import.meta.env.VITE_API_URL}/ai/diet`;

const getDietRecommendations = async () => {
  const token = localStorage.getItem('token');
  if (!token) {
    throw new Error('Unauthorized: No token found.');
  }

  const response = await axios.post(API_URL, null, {
    headers: { Authorization: `Bearer ${token}` },
  });

  // Ensure we have a consistent response format
  const data = response.data;
  return {
    recommendations: data.recommendations || [],
    analysis: data.analysis || {
      current_intake: {},
      targets: {
        calories: 0,
        protein: 0,
        carbs: 0,
        fats: 0
      }
    }
  };
};

export default { getDietRecommendations };
