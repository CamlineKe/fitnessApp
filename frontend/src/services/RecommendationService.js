import axios from '../axiosConfig';
import Logger from '../utils/logger';

const API_URL = `${import.meta.env.VITE_API_URL}/ai/all`;

/**
 * Get all recommendations (diet, workout, stress) in a single batch request.
 * Uses the optimized /ai/all endpoint for reduced latency.
 * 
 * @returns {Promise<{diet: object, workout: object, stress: object, cache_hits: object}>}
 */
const getAllRecommendations = async () => {
  try {
    Logger.debug('[RecommendationService] Fetching batch recommendations');
    
    // OPTIMIZED: Single API call replaces 3 separate calls
    // Backend fetches user data from auth cookie (req.user._id)
    const response = await axios.post(API_URL, {});
    
    Logger.debug('[RecommendationService] Batch response:', response.data);
    
    const { diet, workout, stress, cache_hits } = response.data;
    
    return {
      diet: diet || { recommendations: [], analysis: {}, profile_complete: false },
      workout: workout || { recommendations: [], analysis: {}, profile_complete: false },
      stress: stress || { 
        recommendations: [], 
        analysis: { 
          current_state: { mood: 'neutral', stress_level: 5, sleep_quality: 5 },
          patterns: { stress_trend: 'neutral', sleep_trend: 'neutral', mood_trend: 'neutral' }
        },
        profile_complete: false
      },
      cache_hits: cache_hits || { diet: false, workout: false, stress: false }
    };
  } catch (error) {
    Logger.error('[RecommendationService] Batch fetch failed:', error);
    if (error.response) {
      Logger.error('[RecommendationService] Error response:', error.response.data);
    }
    throw error;
  }
};

export default { getAllRecommendations };
