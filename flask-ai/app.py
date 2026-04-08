from flask import Flask, request, jsonify
from flask_cors import CORS
import os
import logging
import sys
import time
from functools import wraps
from datetime import datetime, timedelta

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

# ✅ Simple in-memory cache with TTL
_cache = {}
CACHE_TTL_MINUTES = 5

def get_cache_key(endpoint, user_id=None):
    """Generate cache key for endpoint"""
    return f"{endpoint}:{user_id or 'anonymous'}"

def get_cached_result(key):
    """Get cached result if not expired"""
    if key in _cache:
        result, timestamp = _cache[key]
        if datetime.now() - timestamp < timedelta(minutes=CACHE_TTL_MINUTES):
            logger.debug(f"Cache hit for {key}")
            return result
        else:
            logger.debug(f"Cache expired for {key}")
            del _cache[key]
    return None

def set_cached_result(key, result):
    """Cache result with timestamp"""
    _cache[key] = (result, datetime.now())
    logger.debug(f"Cached result for {key}")

def cache_response(endpoint):
    """Decorator to cache endpoint responses"""
    def decorator(f):
        @wraps(f)
        def decorated_function(*args, **kwargs):
            # Get user_id from request if available
            user_id = None
            if request.is_json and request.json:
                user_id = request.json.get('user_id')
            
            cache_key = get_cache_key(endpoint, user_id)
            
            # Try to get cached result
            cached = get_cached_result(cache_key)
            if cached is not None:
                return jsonify(cached), 200
            
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
    cache_info = {
        'cached_entries': len(_cache),
        'cache_ttl_minutes': CACHE_TTL_MINUTES
    }
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

# ✅ Pre-load all models on startup
def preload_models():
    """Pre-load all ML models on startup to prevent first-request timeout"""
    logger.info("🚀 Pre-loading ML models...")
    start_time = time.time()
    
    models_to_load = ['diet', 'stress', 'workout']
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

if __name__ == '__main__':
    port = int(os.environ.get('PORT', 5001))
    
    # Pre-load models before starting server
    preload_models()
    
    logger.info(f"🚀 Starting Flask AI server on port {port} in {env} mode")
    logger.info(f"📊 Models pre-loaded on startup")
    logger.info(f"💾 Responses cached for {CACHE_TTL_MINUTES} minutes")
    app.run(host='0.0.0.0', port=port, debug=env=='development')