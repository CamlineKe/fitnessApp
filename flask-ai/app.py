from flask import Flask, request, jsonify
from flask_cors import CORS
import os
import logging
import sys
import time
import threading
from functools import wraps
from datetime import datetime, timedelta
from collections import OrderedDict

# ✅ Configure logging FIRST (before any logger usage)
env = os.getenv('FLASK_ENV', 'development')
logging.basicConfig(
    level=logging.DEBUG if env == 'development' else logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.StreamHandler(sys.stdout)  # Ensure logs go to stdout for Render
    ]
)
logger = logging.getLogger(__name__)

# ✅ Import model manager for lazy loading
from models.model_manager import get_model, get_model_status, is_model_ready

# ✅ Import recommendation functions (models load lazily on first use)
from models.diet_recommender import get_diet_recommendations
from models.stress_analysis import analyze_stress
from models.workout_recommender import get_workout_recommendations

# ✅ Bounded LRU cache with TTL - prevents memory leaks on free tier
class BoundedTTLCache:
    """LRU cache with TTL and max size to prevent memory unbounded growth"""
    def __init__(self, max_size=100, ttl_minutes=5):
        self.max_size = max_size
        self.ttl = timedelta(minutes=ttl_minutes)
        self._cache = OrderedDict()  # Preserves insertion order for LRU eviction
        self._lock = False  # Simple lock for thread safety (GIL handles basic cases)
    
    def _cleanup_expired(self):
        """Remove expired entries"""
        now = datetime.now()
        expired_keys = [
            k for k, (v, ts) in self._cache.items() 
            if now - ts > self.ttl
        ]
        for k in expired_keys:
            del self._cache[k]
            logger.debug(f"Cache expired for {k}")
        return len(expired_keys)
    
    def get(self, key):
        """Get cached result if not expired - moves to end (most recently used)"""
        if key in self._cache:
            result, timestamp = self._cache[key]
            if datetime.now() - timestamp < self.ttl:
                # Move to end (most recently used)
                self._cache.move_to_end(key)
                logger.debug(f"Cache hit for {key}")
                return result
            else:
                logger.debug(f"Cache expired for {key}")
                self._cache.pop(key, None)  # Safe delete (handles race condition)
        return None
    
    def set(self, key, result):
        """Cache result with timestamp - evicts oldest if at capacity"""
        # Check if key exists (update case)
        if key in self._cache:
            self._cache.move_to_end(key)
        elif len(self._cache) >= self.max_size:
            # Evict oldest (first item in OrderedDict)
            oldest_key = next(iter(self._cache))
            del self._cache[oldest_key]
            logger.debug(f"Cache evicted {oldest_key} (max size reached)")
        
        self._cache[key] = (result, datetime.now())
        logger.debug(f"Cached result for {key} (size: {len(self._cache)})")
    
    def clear(self):
        """Clear all cached entries"""
        self._cache.clear()
    
    def size(self):
        """Get current cache size"""
        return len(self._cache)
    
    def stats(self):
        """Get cache statistics"""
        expired = self._cleanup_expired()
        return {
            'size': len(self._cache),
            'max_size': self.max_size,
            'ttl_minutes': self.ttl.total_seconds() / 60,
            'expired_cleaned': expired
        }

# OPTIMIZED: Bounded cache with 100 entries max, 5 min TTL
_cache = BoundedTTLCache(max_size=100, ttl_minutes=5)
CACHE_TTL_MINUTES = 5  # Kept for backward compatibility

def get_cache_key(endpoint, user_id=None):
    """Generate cache key for endpoint"""
    return f"{endpoint}:{user_id or 'anonymous'}"

def get_cached_result(key):
    """Get cached result if not expired"""
    return _cache.get(key)

def set_cached_result(key, result):
    """Cache result with timestamp"""
    _cache.set(key, result)

def cache_response(endpoint):
    """Decorator to cache endpoint responses"""
    def decorator(f):
        @wraps(f)
        def decorated_function(*args, **kwargs):
            # Get user_id from request if available
            user_id = None
            skip_cache = False
            if request.is_json and request.json:
                user_id = request.json.get('user_id')
                skip_cache = request.json.get('skip_cache', False)
            
            cache_key = get_cache_key(endpoint, user_id)
            
            # Try to get cached result (unless skip_cache is true)
            if not skip_cache:
                cached = get_cached_result(cache_key)
                if cached is not None:
                    return jsonify(cached), 200
            else:
                logger.info(f"[{endpoint}] Cache skip requested for user {user_id}")
            
            # Execute function and cache result
            result = f(*args, **kwargs)
            
            # If successful response, cache it
            if isinstance(result, tuple):
                data, status_code = result
                if status_code == 200:
                    set_cached_result(cache_key, data)
                return jsonify(data), status_code
            else:
                set_cached_result(cache_key, result)
                return jsonify(result), 200
        return decorated_function
    return decorator

app = Flask(__name__)

# Configure CORS with both development and production origins
allowed_origins = [
    # Development URLs
    'http://localhost:3000',  # Local frontend
    'http://localhost:5000',  # Local backend
    'http://localhost:5173',  # Vite dev server
    # Production URLs
    'https://fitness-app-dusky-six.vercel.app',  # Vercel frontend
    'https://fitness-app-backend-ap0r.onrender.com',  # Render backend
]

# Add CORS_ORIGIN from environment variable if provided
if os.getenv('CORS_ORIGIN'):
    allowed_origins.append(os.getenv('CORS_ORIGIN'))

# Remove any None values and duplicates
allowed_origins = list(set(filter(None, allowed_origins)))

# Log allowed origins in development (logger is now defined)
if env == 'development':
    logger.info(f"CORS allowed origins: {allowed_origins}")

CORS(app, resources={
    r"/api/*": {
        "origins": allowed_origins,
        "methods": ["GET", "POST", "OPTIONS"],
        "allow_headers": ["Content-Type", "Authorization"]
    }
})

# ✅ Utility function to validate input data
def validate_request(req):
    if not req.is_json:
        return {'error': 'Invalid request: Content-Type must be application/json'}, 400
    if not req.json:
        return {'error': 'Invalid request: No data provided'}, 400
    return None

@app.route('/api/ping', methods=['GET', 'HEAD'])
def ping():
    """Lightweight endpoint for keep-alive pings - no model loading"""
    return jsonify({'status': 'alive', 'time': datetime.now().isoformat()}), 200

@app.route('/api/health', methods=['GET'])
def health_check():
    # Don't trigger model loading during health check - just report status
    # OPTIMIZED: Use new bounded cache stats method
    cache_info = _cache.stats()
    cache_info['ttl_minutes'] = CACHE_TTL_MINUTES  # Backward compatibility
    return jsonify({
        'status': 'healthy',
        'environment': env,
        'models': get_model_status(),  # This shows loaded status without triggering load
        'cache': cache_info,
        'lazy_loading': True,
        'note': 'Models load on first request to save memory (free tier optimized)'
    }), 200

@app.route('/api/diet', methods=['POST'])
@cache_response('diet')
def diet_recommendations():
    try:
        validation_error = validate_request(request)
        if validation_error:
            return validation_error[0], validation_error[1]

        data = request.json
        recommendations = get_diet_recommendations(data)
        return recommendations, 200
    except Exception as e:
        logger.error(f"Diet API Error: {str(e)}", exc_info=env=='development')
        return {'error': str(e)}, 500

@app.route('/api/stress', methods=['POST'])
@cache_response('stress')
def stress_analysis():
    try:
        validation_error = validate_request(request)
        if validation_error:
            return validation_error[0], validation_error[1]

        data = request.json
        analysis = analyze_stress(data)
        return analysis, 200
    except Exception as e:
        logger.error(f"Stress API Error: {str(e)}", exc_info=env=='development')
        return {'error': str(e)}, 500

@app.route('/api/workout', methods=['POST'])
@cache_response('workout')
def workout_recommendations():
    try:
        validation_error = validate_request(request)
        if validation_error:
            return validation_error[0], validation_error[1]

        data = request.json
        recommendations = get_workout_recommendations(data)
        return recommendations, 200
    except Exception as e:
        logger.error(f"Workout API Error: {str(e)}", exc_info=env=='development')
        return {'error': str(e)}, 500

# ✅ Pre-load all models on startup (configurable: sync, async, or lazy)
def preload_models(async_mode=None):
    """
    Pre-load all ML models on startup to prevent first-request timeout.
    
    Args:
        async_mode: If True, load in background thread. If False, load synchronously.
                   If None, use PRELOAD_ASYNC env var (default: true for production)
    
    Returns:
        List of loaded model names (empty if async) or threading.Event (if async)
    """
    # Determine async mode from env var if not explicitly set
    if async_mode is None:
        async_mode = os.getenv('PRELOAD_ASYNC', 'true').lower() == 'true'
    
    models_to_load = ['diet', 'stress', 'workout']
    
    def _load_all():
        """Internal function to load all models"""
        logger.info("🚀 Pre-loading ML models...")
        start_time = time.time()
        loaded = []
        
        for model_name in models_to_load:
            try:
                logger.info(f"Loading {model_name} model...")
                model = get_model(model_name)
                if model:
                    loaded.append(model_name)
                    logger.info(f"✅ {model_name} model loaded successfully")
                else:
                    logger.warning(f"⚠️ {model_name} model returned None, will use fallback")
            except Exception as e:
                logger.error(f"❌ Failed to load {model_name} model: {e}")
        
        total_time = time.time() - start_time
        logger.info(f"✅ Model pre-loading complete: {len(loaded)}/{len(models_to_load)} models loaded in {total_time:.2f}s")
        return loaded
    
    if async_mode:
        # OPTIMIZED: Async loading - start server immediately, load models in background
        # This prevents Render health check timeouts during model loading
        loaded_event = threading.Event()
        loaded_models = []
        
        def _async_loader():
            nonlocal loaded_models
            loaded_models = _load_all()
            loaded_event.set()
        
        thread = threading.Thread(target=_async_loader, daemon=True, name='model_preloader')
        thread.start()
        logger.info("🔄 Async model loading started (server will be ready immediately)")
        return loaded_event, loaded_models
    else:
        # Synchronous loading - blocks until all models loaded
        return _load_all()

if __name__ == '__main__':
    port = int(os.environ.get('PORT', 5001))
    
    # OPTIMIZED: Async model loading prevents Render health check timeouts
    # Server starts immediately, models load in background thread
    # Set PRELOAD_ASYNC=false for synchronous loading (e.g., local development)
    preload_result = preload_models(async_mode=None)  # Uses PRELOAD_ASYNC env var
    
    logger.info(f"🚀 Starting Flask AI server on port {port} in {env} mode")
    if isinstance(preload_result, tuple):
        logger.info("📊 Models loading asynchronously (server ready immediately)")
    else:
        logger.info(f"📊 Models pre-loaded on startup: {len(preload_result)} models")
    logger.info(f"💾 Responses cached for {CACHE_TTL_MINUTES} minutes")
    app.run(host='0.0.0.0', port=port, debug=env=='development')