from flask import Flask, request, jsonify
from flask_cors import CORS
import os
from utils.logger import Logger
from werkzeug.middleware.proxy_fix import ProxyFix
from datetime import datetime

# ✅ Ensure correct imports from models
from models.diet_recommender import get_diet_recommendations
from models.stress_analysis import analyze_stress
from models.workout_recommender import get_workout_recommendations

app = Flask(__name__)

# Security headers middleware
@app.after_request
def add_security_headers(response):
    response.headers['X-Content-Type-Options'] = 'nosniff'
    response.headers['X-Frame-Options'] = 'SAMEORIGIN'
    response.headers['X-XSS-Protection'] = '1; mode=block'
    response.headers['Strict-Transport-Security'] = 'max-age=31536000; includeSubDomains'
    response.headers['Content-Security-Policy'] = "default-src 'self'"
    return response

# Enable CORS with secure defaults
CORS(app, resources={
    r"/api/*": {
        "origins": os.getenv('ALLOWED_ORIGINS', 'http://localhost:3000').split(','),
        "methods": ["POST", "OPTIONS"],
        "allow_headers": ["Content-Type"],
    }
})

# Handle proxy headers correctly
app.wsgi_app = ProxyFix(app.wsgi_app, x_proto=1, x_host=1)

# ✅ Utility function to validate input data
def validate_request(req):
    if not req.json:
        Logger.warning("Invalid request: No data provided")
        return {'error': 'Invalid request: No data provided'}, 400
    return None

@app.route('/api/diet', methods=['POST'])
def diet_recommendations():
    try:
        validation_error = validate_request(request)
        if validation_error:
            return jsonify(validation_error[0]), validation_error[1]

        data = request.json
        Logger.debug(f"Processing diet recommendation request with data: {data}")
        recommendations = get_diet_recommendations(data)
        Logger.info("Successfully generated diet recommendations")
        return jsonify(recommendations), 200
    except Exception as e:
        Logger.error(f"Diet API Error: {str(e)}")
        return jsonify({'error': 'Internal server error'}), 500

@app.route('/api/stress', methods=['POST'])
def stress_analysis():
    try:
        validation_error = validate_request(request)
        if validation_error:
            return jsonify(validation_error[0]), validation_error[1]

        data = request.json
        Logger.debug(f"Processing stress analysis request with data: {data}")
        analysis = analyze_stress(data)
        Logger.info("Successfully generated stress analysis")
        return jsonify(analysis), 200
    except Exception as e:
        Logger.error(f"Stress API Error: {str(e)}")
        return jsonify({'error': 'Internal server error'}), 500

@app.route('/api/workout', methods=['POST'])
def workout_recommendations():
    try:
        validation_error = validate_request(request)
        if validation_error:
            return jsonify(validation_error[0]), validation_error[1]

        data = request.json
        Logger.debug(f"Processing workout recommendation request with data: {data}")
        recommendations = get_workout_recommendations(data)
        Logger.info("Successfully generated workout recommendations")
        return jsonify(recommendations), 200
    except Exception as e:
        Logger.error(f"Workout API Error: {str(e)}")
        return jsonify({'error': 'Internal server error'}), 500

@app.route('/health', methods=['GET'])
def health_check():
    """Health check endpoint for Render."""
    return jsonify({
        "status": "healthy",
        "timestamp": datetime.now().isoformat()
    }), 200

if __name__ == '__main__':
    # Rotate logs on startup
    Logger.rotate_logs(max_days=30)
    
    # Get configuration from environment variables with secure defaults
    port = int(os.environ.get('PORT', 5001))
    host = os.environ.get('HOST', '127.0.0.1')  # Default to localhost
    
    # Determine if we're in production
    is_production = os.environ.get('FLASK_ENV') == 'production'
    
    Logger.info(f"Starting Flask server on {host}:{port} in {'production' if is_production else 'development'} mode")
    
    # In production, ensure debug is off and add SSL if configured
    if is_production:
        ssl_context = None
        cert_path = os.environ.get('SSL_CERT_PATH')
        key_path = os.environ.get('SSL_KEY_PATH')
        
        if cert_path and key_path:
            ssl_context = (cert_path, key_path)
            Logger.info("SSL enabled")
        
        app.run(
            host=host,
            port=port,
            debug=False,
            ssl_context=ssl_context
        )
    else:
        app.run(
            host=host,
            port=port,
            debug=True
        )
