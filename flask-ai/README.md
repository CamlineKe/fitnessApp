# Fitness App AI Service
> AI-powered recommendation engine for the Fitness and Wellness Tracking platform

## Project Overview
This Flask-based AI service provides intelligent health recommendations, workout suggestions, and diet plans based on user data and fitness metrics. It serves as the AI backend for the main fitness application.

### Key Features
- 🧠 AI-powered health recommendations
- 💪 Personalized workout plans
- 🥗 Diet and nutrition suggestions
- 📊 Stress level analysis
- 🔄 Real-time data processing
- 🛡️ Secure API endpoints with CORS and security headers

## Technical Stack
- **Framework:** Flask
- **ML Libraries:** scikit-learn, TensorFlow, pandas, numpy
- **Security:** Custom security headers, CORS protection
- **Logging:** Custom Logger implementation
- **Environment:** Python 3.8+

## Project Structure
```
flask-ai/
├── app.py              # Main Flask application
├── retrain_models.py   # Model retraining script
├── requirements.txt    # Python dependencies
├── models/            # ML model files
├── utils/             # Utility functions
├── logs/             # Application logs
└── venv/             # Virtual environment
```

## API Endpoints

### Diet Recommendations
```python
POST /api/diet
Content-Type: application/json

Request Body:
{
    "user_metrics": {
        "weight": float,
        "height": float,
        "age": int,
        "activity_level": string,
        "dietary_restrictions": list
    }
}

Response:
{
    "recommendations": list,
    "calories": int,
    "macros": dict
}
```

### Stress Analysis
```python
POST /api/stress
Content-Type: application/json

Request Body:
{
    "heart_rate_variability": float,
    "sleep_quality": float,
    "activity_level": float,
    "reported_stress": int
}

Response:
{
    "stress_level": string,
    "recommendations": list,
    "risk_factors": list
}
```

### Workout Recommendations
```python
POST /api/workout
Content-Type: application/json

Request Body:
{
    "fitness_level": string,
    "goals": list,
    "available_equipment": list,
    "time_available": int
}

Response:
{
    "workout_plan": list,
    "intensity": string,
    "duration": int,
    "calories_burn_estimate": int
}
```

## Security Features
- Custom security headers
- CORS protection
- Input validation
- SSL support in production
- Proxy header handling

## Development Setup

### Installation
```bash
# Create virtual environment
python -m venv venv

# Activate virtual environment
source venv/bin/activate  # Unix
venv\Scripts\activate     # Windows

# Install dependencies
pip install -r requirements.txt

# Set up environment variables
cp .env.example .env
```

### Environment Variables
```env
FLASK_ENV=development
FLASK_APP=app.py
PORT=5001
HOST=127.0.0.1
ALLOWED_ORIGINS=http://localhost:3000
SSL_CERT_PATH=
SSL_KEY_PATH=
```

### Running the Application
```bash
# Development mode
python app.py

# Production mode
FLASK_ENV=production python app.py
```

## Model Retraining
The `retrain_models.py` script handles periodic retraining of ML models:
```bash
# Retrain all models
python retrain_models.py
```

## Logging
- Logs are stored in the `logs/` directory
- Log rotation every 30 days
- Different log levels (DEBUG, INFO, WARNING, ERROR)
- Structured logging format

## Error Handling
- Input validation
- Proper error responses
- Detailed error logging
- Production/Development error differentiation

## Contributing
1. Fork the repository
2. Create your feature branch
3. Follow PEP 8 style guide
4. Write unit tests
5. Submit pull request

## License
[Your License Information]

## Version History
- v1.0.0 - Initial Release
  - Basic recommendation systems
  - Model training pipeline
  - Secure API endpoints
  - Logging system
