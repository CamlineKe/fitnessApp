# Fitness and Wellness AI Service
> A Flask-based AI service providing intelligent recommendations for diet, workout, and stress management using machine learning models with rule-based fallback

## Project Overview
This AI service provides machine learning-powered recommendations for diet, workout plans, and stress management as part of the Fitness and Wellness Tracking platform. It uses trained ML models with automatic fallback to rule-based logic when models are unavailable or confidence is low.

### Key Features
- 🥗 **Diet Recommendations**: Personalized nutrition advice based on intake and profile
- 🏃‍♂️ **Workout Recommendations**: Activity-specific guidance with heart rate zone analysis
- 🧘‍♀️ **Stress Analysis**: Mood and sleep pattern analysis with personalized coping strategies
- 🤖 **ML-Powered**: Trained models with confidence scoring and graceful fallback
- 🔄 **Auto-Refresh**: Models can be retrained with `retrain_models.py`
- 📊 **Feature Engineering**: One-hot encoding for categorical data (moods, activity types)
- 🔌 **RESTful API**: Well-defined endpoints with input validation
- 🔒 **CORS-Enabled**: Secure cross-origin request handling

## Technical Stack
- **Framework:** Flask 2.0.1
- **ML Libraries:** 
  - scikit-learn 1.2.2 (RandomForest models)
  - pandas 1.5.3 (data manipulation)
  - numpy 1.24.3 (numerical operations)
  - joblib (model persistence)
- **Database:** pymongo 3.12.0 (MongoDB integration)
- **Deployment:** gunicorn 20.1.0 (production server)
- **Environment:** python-dotenv 0.19.0
- **CORS:** flask-cors 3.0.10

## API Endpoints

### Health Check
```
GET /api/health
```
Returns the health status of the service and loaded models.

**Response:**
```json
{
  "status": "healthy",
  "environment": "development",
  "models_loaded": {
    "diet": true,
    "stress": true,
    "workout": true
  }
}
```

### Diet Recommendations
```
POST /api/diet
```
Provides diet recommendations based on nutritional data and user profile.

**Request Body:**
```json
{
  "user_data": {
    "dateOfBirth": "1990-01-01",
    "gender": "male"
  },
  "daily_intake": {
    "calories": 2200,
    "macronutrients": {
      "protein": 80,
      "carbohydrates": 250,
      "fats": 70
    }
  },
  "nutrition_logs": []
}
```

**Response:**
```json
{
  "recommendations": ["📊 ML Analysis: Balanced", "..."],
  "analysis": {
    "ml_used": true,
    "ml_prediction": {
      "category": "Balanced",
      "confidence": 0.85
    }
  },
  "profile_complete": true
}
```

### Stress Analysis
```
POST /api/stress
```
Analyzes stress levels based on mood, sleep data, and patterns.

**Request Body:**
```json
{
  "user_data": {
    "dateOfBirth": "1990-01-01",
    "gender": "male"
  },
  "current_check_in": {
    "mood": "happy",
    "stressLevel": 4,
    "sleepQuality": 7
  },
  "daily_logs": []
}
```

**Response:**
```json
{
  "analysis": {
    "current_state": {
      "mood": "happy",
      "stress_level": 4,
      "sleep_quality": 7,
      "age": 34,
      "gender": "male"
    },
    "patterns": {
      "stress_trend": "stable",
      "sleep_trend": "stable",
      "mood_trend": "stable"
    },
    "ml_used": true,
    "ml_prediction": {
      "category": "Low",
      "confidence": 0.78
    }
  },
  "recommendations": ["📊 ML Analysis: Stress level appears low", "..."],
  "profile_complete": true
}
```

### Workout Recommendations
```
POST /api/workout
```
Provides workout recommendations based on activity metrics and history.

**Request Body:**
```json
{
  "user_data": {
    "dateOfBirth": "1990-01-01",
    "gender": "male"
  },
  "current_stats": {
    "activityType": "Running",
    "duration": 30,
    "heartRate": 140,
    "caloriesBurned": 300
  },
  "workout_history": []
}
```

**Response:**
```json
{
  "recommendations": ["📊 ML Analysis: Maintain", "..."],
  "analysis": {
    "current_workout": {
      "activity_type": "Running",
      "duration": 30,
      "heart_rate": 140,
      "calories_burned": 300
    },
    "heart_rate_zones": {
      "recovery": [108, 126],
      "aerobic": [126, 144],
      "anaerobic": [144, 162],
      "vo2max": [162, 180]
    },
    "ml_used": true,
    "ml_prediction": {
      "category": "Maintain",
      "confidence": 0.82
    }
  },
  "profile_complete": true
}
```

## Model Training

### Available Models
- **Diet Model:** 4 features (calories, protein, carbs, fats) → 4 categories
- **Stress Model:** 6 features (one-hot moods + stress_level + sleep_quality) → 3 categories
- **Workout Model:** 10 features (one-hot activities + metrics) → 4 categories

### Training Process
The models are trained using the `retrain_models.py` script, which:
1. Generates 10,000 synthetic samples with realistic distributions
2. Performs feature engineering (one-hot encoding for categorical data)
3. Scales features using StandardScaler
4. Trains RandomForestClassifier models with optimized parameters
5. Saves models with feature names for consistent inference
6. Reports training and testing accuracy

### Retraining Models
```bash
# Run the retraining script (creates models in /models directory)
python retrain_models.py
```

**Sample Output:**
```
📁 Models directory: /path/to/flask-ai/models

🔄 Generating training data...
   Diet data: 10000 samples
   Stress data: 10000 samples
   Workout data: 10000 samples

🥗 Training diet model...
✅ Model saved: models/diet_model.pkl
   Training accuracy: 0.92
   Testing accuracy: 0.89

📊 TRAINING SUMMARY
==================================================
Diet Model:     Accuracy 0.89 - Features: 4
Stress Model:   Accuracy 0.86 - Features: 6
Workout Model:  Accuracy 0.91 - Features: 10
==================================================

✅ All models trained and saved successfully!
```

## Development Setup

### Prerequisites
- Python 3.12+
- pip or uv package manager

### Installation
```bash
# Clone the repository
git clone <repository-url>
cd flask-ai

# Create a virtual environment
python3 -m venv .venv
source .venv/bin/activate

# Install dependencies
pip install -r requirements.txt
```

### Environment Variables
```env
# Required environment variables
PORT=5001
CORS_ORIGIN=http://localhost:3000  # Frontend URL for CORS
FLASK_ENV=development  # Set to 'production' in production
```

### Running the Service
```bash
# Development mode (with debug and auto-reload)
python app.py

# Production mode with gunicorn
gunicorn --bind 0.0.0.0:5001 app:app

# Or with specific worker count
gunicorn --workers 4 --bind 0.0.0.0:5001 app:app
```

## Project Structure
```
flask-ai/
├── models/                    # Trained ML models
│   ├── diet_model.pkl         # Diet recommendation model
│   ├── stress_model.pkl       # Stress analysis model
│   ├── workout_model.pkl      # Workout recommendation model
│   ├── diet_recommender.py    # Diet logic with ML integration
│   ├── stress_analysis.py     # Stress logic with ML integration
│   └── workout_recommender.py # Workout logic with ML integration
├── app.py                     # Main Flask application
├── retrain_models.py          # Model training script
├── requirements.txt           # Python dependencies
├── .env.example               # Example environment variables
├── render.yaml                # Render deployment config
└── README.md                  # This file
```

## Deployment (Render)

The service includes `render.yaml` for easy deployment on Render:

```yaml
services:
  - type: web
    name: fitness-ai-service
    env: python
    buildCommand: pip install -r requirements.txt
    startCommand: gunicorn app:app
    envVars:
      - key: FLASK_ENV
        value: production
      - key: CORS_ORIGIN
        fromEnv: FRONTEND_URL
```

## Error Handling
The service includes comprehensive error handling:
- Input validation with content-type checks
- Model loading errors with fallback to rule-based logic
- Structured error responses
- Environment-based logging (stack traces only in development)

## Security Features
- CORS configuration with allowed origins list
- Input validation and sanitization
- No sensitive data in error messages
- Environment-based debug mode

## Performance Considerations
- Models loaded once at startup (not per request)
- Feature names cached for consistent inference
- Graceful degradation when models unavailable
- Optimized for quick response times (<100ms)

## Contributing
1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License
MIT License - see LICENSE file for details

## Version History
- **v1.1.0** (Current)
  - ML model integration with confidence scoring
  - Automatic fallback to rule-based logic
  - Enhanced health check endpoint
  - Improved error handling and logging
  - One-hot encoding for categorical features
- **v1.0.0** (Initial)
  - Basic API implementation
  - Rule-based recommendation logic
  - Deployment configuration