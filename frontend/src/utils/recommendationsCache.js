// Cache utility for recommendations
const CACHE_KEY = 'recommendations_cache';
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes in milliseconds

export const getCachedRecommendations = () => {
  try {
    const cached = sessionStorage.getItem(CACHE_KEY);
    if (!cached) return null;

    const { data, timestamp } = JSON.parse(cached);
    const age = Date.now() - timestamp;

    // Return null if cache is expired
    if (age > CACHE_DURATION) {
      sessionStorage.removeItem(CACHE_KEY);
      return null;
    }

    return data;
  } catch (e) {
    console.warn('Error reading recommendations cache:', e);
    return null;
  }
};

export const setCachedRecommendations = (data) => {
  try {
    const cacheEntry = {
      data,
      timestamp: Date.now()
    };
    sessionStorage.setItem(CACHE_KEY, JSON.stringify(cacheEntry));
  } catch (e) {
    console.warn('Error writing recommendations cache:', e);
  }
};

export const clearRecommendationsCache = () => {
  try {
    sessionStorage.removeItem(CACHE_KEY);
  } catch (e) {
    console.warn('Error clearing recommendations cache:', e);
  }
};

// Check if cache is valid
export const hasValidCache = () => {
  return getCachedRecommendations() !== null;
};
