from flask import Flask, request, jsonify
from flask_cors import CORS
import os
import logging

# ✅ Ensure correct imports from models
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
    'https://fitness-3doakdbyh-camlinekes-projects.vercel.app',  # Vercel frontend
    'https://fitness-app-backend-dtvo.onrender.com',  # Render backend
    os.getenv('CORS_ORIGIN', 'http://localhost:5173')  # From environment variable
]

# Remove any None values and duplicates
allowed_origins = list(set(filter(None, allowed_origins)))

CORS(app, resources={
    r"/api/*": {
        "origins": allowed_origins,
        "methods": ["GET", "POST", "OPTIONS"],
        "allow_headers": ["Content-Type", "Authorization"]
    }
})

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# ✅ Utility function to validate input data
def validate_request(req):
    if not req.json:
        return {'error': 'Invalid request: No data provided'}, 400
    return None

@app.route('/api/health', methods=['GET'])
def health_check():
    return jsonify({'status': 'healthy'}), 200

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
        logger.error(f"Diet API Error: {str(e)}")
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
        logger.error(f"Stress API Error: {str(e)}")
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
        logger.error(f"Workout API Error: {str(e)}")
        return jsonify({'error': str(e)}), 500

if __name__ == '__main__':
    port = int(os.environ.get('PORT', 5001))
    app.run(host='0.0.0.0', port=port)
