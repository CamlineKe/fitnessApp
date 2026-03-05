from flask import Flask, request, jsonify
from flask_cors import CORS
import os
import logging

# ✅ Configure logging FIRST (before any logger usage)
env = os.getenv('FLASK_ENV', 'development')
logging.basicConfig(
    level=logging.DEBUG if env == 'development' else logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# ✅ Import models after logging is configured
from models.diet_recommender import get_diet_recommendations
from models.stress_analysis import analyze_stress
from models.workout_recommender import get_workout_recommendations

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

@app.route('/api/health', methods=['GET'])
def health_check():
    return jsonify({
        'status': 'healthy',
        'environment': env,
        'models_loaded': {
            'diet': 'get_diet_recommendations' in dir(),
            'stress': 'analyze_stress' in dir(),
            'workout': 'get_workout_recommendations' in dir()
        }
    }), 200

@app.route('/api/diet', methods=['POST'])
def diet_recommendations():
    try:
        validation_error = validate_request(request)
        if validation_error:
            return jsonify(validation_error[0]), validation_error[1]

        data = request.json
        recommendations = get_diet_recommendations(data)
        return jsonify(recommendations), 200
    except Exception as e:
        logger.error(f"Diet API Error: {str(e)}", exc_info=env=='development')
        return jsonify({'error': str(e)}), 500

@app.route('/api/stress', methods=['POST'])
def stress_analysis():
    try:
        validation_error = validate_request(request)
        if validation_error:
            return jsonify(validation_error[0]), validation_error[1]

        data = request.json
        analysis = analyze_stress(data)
        return jsonify(analysis), 200
    except Exception as e:
        logger.error(f"Stress API Error: {str(e)}", exc_info=env=='development')
        return jsonify({'error': str(e)}), 500

@app.route('/api/workout', methods=['POST'])
def workout_recommendations():
    try:
        validation_error = validate_request(request)
        if validation_error:
            return jsonify(validation_error[0]), validation_error[1]

        data = request.json
        recommendations = get_workout_recommendations(data)
        return jsonify(recommendations), 200
    except Exception as e:
        logger.error(f"Workout API Error: {str(e)}", exc_info=env=='development')
        return jsonify({'error': str(e)}), 500

if __name__ == '__main__':
    port = int(os.environ.get('PORT', 5001))
    logger.info(f"Starting Flask AI server on port {port} in {env} mode")
    app.run(host='0.0.0.0', port=port, debug=env=='development')