// Simple LRU Cache for Flask AI responses
// Caches identical prediction inputs to reduce ML model calls

class LRUCache {
  constructor(maxSize = 100, ttlMs = 60000) {
    this.maxSize = maxSize;
    this.ttlMs = ttlMs;
    this.cache = new Map();
  }

  generateKey(data) {
    // Create a deterministic key from the request data
    // Only hash the parts that affect the prediction (not timestamps)
    const keyData = {
      user_data: data.user_data,
      daily_intake: data.daily_intake,
      current_stats: data.current_stats,
      current_check_in: data.current_check_in
    };
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
const dietCache = new LRUCache(50, 30000); // 50 entries, 30s TTL
const workoutCache = new LRUCache(50, 30000);
const stressCache = new LRUCache(50, 30000);

export { dietCache, workoutCache, stressCache, LRUCache };
