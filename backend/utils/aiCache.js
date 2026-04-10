// Simple LRU Cache for Flask AI responses
// Caches identical prediction inputs to reduce ML model calls

class LRUCache {
  constructor(maxSize = 100, ttlMs = 60000) {
    this.maxSize = maxSize;
    this.ttlMs = ttlMs;
    this.cache = new Map();
  }

  generateKey(data, type = 'generic') {
    // OPTIMIZED: Hash only user profile + current day instead of full history
    // This dramatically improves cache hit rate since history changes frequently
    const today = new Date().toISOString().split('T')[0];
    
    const keyData = {
      user_data: data.user_data,
      type: type,
      date: today  // Cache per day, not per history state
    };
    
    // For diet/workout/stress, include the current state (not history)
    if (type === 'diet' && data.daily_intake) {
      keyData.current_intake = {
        calories: Math.round((data.daily_intake.calories || 0) / 50) * 50,  // Bucket to 50-cal increments
        protein: Math.round((data.daily_intake.macronutrients?.protein || 0) / 5) * 5,
        carbs: Math.round((data.daily_intake.macronutrients?.carbohydrates || 0) / 10) * 10,
        fats: Math.round((data.daily_intake.macronutrients?.fats || 0) / 5) * 5
      };
    } else if (type === 'workout' && data.current_stats) {
      keyData.current_workout = {
        activity_type: data.current_stats.activityType,
        duration_bucket: Math.round((data.current_stats.duration || 0) / 5) * 5,  // 5-min buckets
        hr_bucket: Math.round((data.current_stats.heartRate || 0) / 5) * 5  // 5-bpm buckets
      };
    } else if (type === 'stress' && data.current_check_in) {
      keyData.current_mood = data.current_check_in.mood;
      keyData.stress_level = data.current_check_in.stressLevel;
      keyData.sleep_quality = data.current_check_in.sleepQuality;
    }
    
    return JSON.stringify(keyData);
  }

  get(key) {
    const entry = this.cache.get(key);
    if (!entry) return null;

    // Check if entry has expired
    if (Date.now() - entry.timestamp > this.ttlMs) {
      this.cache.delete(key);
      return null;
    }

    // Move to end (most recently used)
    this.cache.delete(key);
    this.cache.set(key, entry);

    return entry.data;
  }

  set(key, data) {
    // If at max size, remove oldest entry
    if (this.cache.size >= this.maxSize) {
      const firstKey = this.cache.keys().next().value;
      this.cache.delete(firstKey);
    }

    this.cache.set(key, {
      data,
      timestamp: Date.now()
    });
  }

  clear() {
    this.cache.clear();
  }

  get size() {
    return this.cache.size;
  }
}

// Create cache instances for each endpoint
// OPTIMIZED: TTL increased to 4 minutes to align with Flask's 5-minute cache
// Reduces redundant Flask API calls while keeping data reasonably fresh
const dietCache = new LRUCache(100, 240000); // 100 entries, 4 min TTL
const workoutCache = new LRUCache(100, 240000);
const stressCache = new LRUCache(100, 240000);

export { dietCache, workoutCache, stressCache, LRUCache };
