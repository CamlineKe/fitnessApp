// Nutrition Cache for API responses
// Caches frequently accessed nutrition logs and stats to reduce DB queries

class NutritionCache {
  constructor(maxSize = 200, ttlMs = 5 * 60 * 1000) { // 5 minutes default TTL
    this.maxSize = maxSize;
    this.ttlMs = ttlMs;
    this.cache = new Map();
  }

  // Generate cache key from request parameters
  generateKey(userId, type, params = {}) {
    const keyData = {
      userId: userId.toString(),
      type, // 'logs', 'stats', 'single'
      ...params
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

  // Invalidate cache for a specific user
  invalidate(userId) {
    const userIdStr = userId.toString();
    for (const [key] of this.cache) {
      const parsed = JSON.parse(key);
      if (parsed.userId === userIdStr) {
        this.cache.delete(key);
      }
    }
  }

  // Clear entire cache
  clear() {
    this.cache.clear();
  }

  get size() {
    return this.cache.size;
  }

  // Get cache stats for monitoring
  getStats() {
    let valid = 0;
    let expired = 0;
    const now = Date.now();

    for (const [, entry] of this.cache) {
      if (now - entry.timestamp <= this.ttlMs) {
        valid++;
      } else {
        expired++;
      }
    }

    return {
      total: this.cache.size,
      valid,
      expired,
      maxSize: this.maxSize,
      ttlMs: this.ttlMs
    };
  }
}

// Create singleton cache instance
const nutritionCache = new NutritionCache(200, 5 * 60 * 1000); // 200 entries, 5min TTL

// Middleware to check cache before hitting the database
export const cacheMiddleware = (type) => {
  return (req, res, next) => {
    const userId = req.user._id;
    const params = { ...req.query, ...req.params };
    const cacheKey = nutritionCache.generateKey(userId, type, params);
    
    const cached = nutritionCache.get(cacheKey);
    if (cached) {
      return res.json(cached);
    }

    // Store cache key and cache instance in request for later
    req.cacheKey = cacheKey;
    req.nutritionCache = nutritionCache;
    next();
  };
};

// Helper to cache response data
export const cacheResponse = (req, data) => {
  if (req.cacheKey && req.nutritionCache) {
    req.nutritionCache.set(req.cacheKey, data);
  }
};

// Invalidate user cache after mutations
export const invalidateUserCache = (userId) => {
  nutritionCache.invalidate(userId);
};

export { nutritionCache };
export default nutritionCache;
