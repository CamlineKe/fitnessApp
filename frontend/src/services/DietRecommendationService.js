import axios from '../axiosConfig';
import Logger from '../utils/logger';

const API_URL = `${import.meta.env.VITE_API_URL}/ai/diet`;

const getDietRecommendations = async (userId, skipCache = false) => {
  try {
    console.log('[DietService] Starting request with userId:', userId, 'skipCache:', skipCache);
    console.log('[DietService] API_URL:', API_URL);

    // Send user_id for caching - backend will fetch user data and nutrition logs
    const response = await axios.post(API_URL, { user_id: userId, skip_cache: skipCache });
    // axiosConfig handles auth cookies automatically

    console.log('[DietService] Response received:', response.status, response.data);
    Logger.debug('Diet recommendations response:', response.data);

    // Ensure we have a consistent response format
    const data = response.data;
    return {
      recommendations: data.recommendations || [],
      analysis: data.analysis || {
        current_intake: {
          calories: 0,
          macronutrients: {
            protein: 0,
            carbohydrates: 0,
            fats: 0
          }
        },
        meal_pattern: 'Regular',
        nutrient_balance: {
          protein_ratio: 0,
          carbs_ratio: 0,
          fats_ratio: 0
        },
        profile_data: {
          age: null,
          gender: 'other'
        }
      },
      profile_complete: data.profile_complete || false
    };
  } catch (error) {
    console.error('[DietService] ERROR:', error.message);
    console.error('[DietService] Error config:', error.config);
    if (error.response) {
      console.error('[DietService] Error response status:', error.response.status);
      console.error('[DietService] Error response data:', error.response.data);
    }
    Logger.error('Error fetching diet recommendations:', error);
    if (error.response) {
      Logger.error('Error response data:', error.response.data);
    }
    throw error;
  }
};

export default { getDietRecommendations };