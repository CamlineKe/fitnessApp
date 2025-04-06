from flask import Flask, request, jsonify
from flask_cors import CORS
import os
from datetime import datetime
from utils.logger import Logger
from werkzeug.middleware.proxy_fix import ProxyFix

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
        "methods": ["POST", "OPTIONS", "GET"],
        "allow_headers": ["Content-Type", "Authorization"],
    }
})

# Handle proxy headers correctly
app.wsgi_app = ProxyFix(app.wsgi_app, x_proto=1, x_host=1)

# Health check endpoint
@app.route('/health', methods=['GET'])
def health_check():
    """Health check endpoint for monitoring."""
    try:
        return jsonify({
            "status": "healthy",
            "timestamp": datetime.now().isoformat(),
            "environment": os.getenv('FLASK_ENV', 'development'),
            "version": "1.0.0"
        }), 200
    except Exception as e:
        Logger.error(f"Health check failed: {str(e)}")
        return jsonify({
            "status": "unhealthy",
            "error": str(e)
        }), 500

# Error handlers
@app.errorhandler(404)
def not_found(error):
    return jsonify({"error": "Resource not found"}), 404

@app.errorhandler(500)
def internal_error(error):
    return jsonify({"error": "Internal server error"}), 500

# Temporary route responses
@app.route('/api/diet', methods=['POST'])
def diet_recommendations():
    return jsonify({"message": "Diet recommendations temporarily unavailable"}), 503

@app.route('/api/stress', methods=['POST'])
def stress_analysis():
    return jsonify({"message": "Stress analysis temporarily unavailable"}), 503

@app.route('/api/workout', methods=['POST'])
def workout_recommendations():
    return jsonify({"message": "Workout recommendations temporarily unavailable"}), 503

if __name__ == '__main__':
    # Rotate logs on startup
    Logger.rotate_logs(max_days=30)
    
    # Get configuration from environment variables with secure defaults
    port = int(os.environ.get('PORT', 5001))
    host = os.getenv('HOST', '0.0.0.0')  # Changed to 0.0.0.0 for production
    
    # Determine if we're in production
    is_production = os.getenv('FLASK_ENV') == 'production'
    
    Logger.info(f"Starting Flask server on {host}:{port} in {'production' if is_production else 'development'} mode")
    
    if is_production:
        # In production, use gunicorn
        import gunicorn.app.base

        class StandaloneApplication(gunicorn.app.base.BaseApplication):
            def __init__(self, app, options=None):
                self.options = options or {}
                self.application = app
                super().__init__()

            def load_config(self):
                for key, value in self.options.items():
                    self.cfg.set(key.lower(), value)

            def load(self):
                return self.application

        options = {
            'bind': f'{host}:{port}',
            'workers': 4,
            'worker_class': 'sync',
            'timeout': 120,
            'accesslog': '-',
            'errorlog': '-',
            'preload_app': True,
            'reload': False
        }

        StandaloneApplication(app, options).run()
    else:
        app.run(
            host=host,
            port=port,
            debug=True
        )
