from flask import Flask, request, jsonify
from flask_cors import CORS
import os

# ✅ Ensure correct imports from models
from models.diet_recommender import get_diet_recommendations
from models.stress_analysis import analyze_stress  # Fixed import name
from models.workout_recommender import get_workout_recommendations

app = Flask(__name__)
CORS(app)  # Enable Cross-Origin Resource Sharing

# ✅ Utility function to validate input data
def validate_request(req):
    if not req.json:
        return {'error': 'Invalid request: No data provided'}, 400
    return None

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
        print(f"Diet API Error: {str(e)}")  # Add logging
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
        print(f"Stress API Error: {str(e)}")  # Add logging
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
        print(f"Workout API Error: {str(e)}")  # Add logging
        return jsonify({'error': str(e)}), 500

if __name__ == '__main__':
    port = int(os.environ.get('PORT', 5001))
    app.run(debug=True, host='0.0.0.0', port=port)
