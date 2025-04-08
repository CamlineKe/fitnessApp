# Fitness and Wellness AI Service
> A Flask-based AI service providing intelligent recommendations for diet, workout, and stress management

## Project Overview
This AI service provides machine learning-powered recommendations for diet, workout plans, and stress management as part of the Fitness and Wellness Tracking platform. It uses trained models to analyze user data and provide personalized recommendations.

### Key Features
- 🥗 Diet recommendations based on nutritional data
- 🏃‍♂️ Workout recommendations based on activity metrics
- 🧘‍♀️ Stress analysis based on mood and sleep data
- 🤖 Machine learning models for personalized recommendations
- 🔄 Model retraining capability
- 🔌 RESTful API endpoints
- 🔒 CORS-enabled for secure cross-origin requests

## Technical Stack
- **Framework:** Flask 2.0.1
- **ML Libraries:** 
  - scikit-learn 1.2.2
  - pandas 1.5.3
  - numpy 1.24.3
- **Database:** pymongo 3.12.0
- **Deployment:** gunicorn 20.1.0
- **Environment:** python-dotenv 0.19.0
- **CORS:** flask-cors 3.0.10

## API Endpoints

### Health Check
```
GET /api/health
```
Returns the health status of the service.

### Diet Recommendations
```
POST /api/diet
```
Provides diet recommendations based on nutritional data.

**Request Body:**
```json
{
  "calories": 2200,
  "protein": 80,
  "carbohydrates": 250,
  "fats": 70
}
```

**Response:**
```json
{
  "recommendation": "High Protein",
  "details": "..."
}
```

### Stress Analysis
```
POST /api/stress
```
Analyzes stress levels based on mood and sleep data.

**Request Body:**
```json
{
  "mood": "happy",
  "stress_level": 5,
  "sleep_quality": 7
}
```

**Response:**
```json
{
  "category": "Low",
  "analysis": "..."
}
```

### Workout Recommendations
```
POST /api/workout
```
Provides workout recommendations based on activity metrics.

**Request Body:**
```json
{
  "activity_type": "Running",
  "duration": 45,
  "calories_burned": 450,
  "heart_rate": 150
}
```

**Response:**
```json
{
  "recommendation": "Increase Intensity",
  "details": "..."
}
```

## Model Training

### Available Models
- **Diet Model:** Recommends diet types based on nutritional data
- **Stress Model:** Analyzes stress levels based on mood and sleep data
- **Workout Model:** Recommends workout adjustments based on activity metrics

### Training Process
The models are trained using the `retrain_models.py` script, which:
1. Generates synthetic training data
2. Preprocesses the data using StandardScaler
3. Trains RandomForestClassifier models
4. Saves the models to the `models/` directory

### Retraining Models
```bash
# Run the retraining script
python retrain_models.py
```

## Development Setup

### Installation
```bash
# Create a virtual environment
python -m venv venv

# Activate the virtual environment
# On Windows
venv\Scripts\activate
# On macOS/Linux
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt
```

### Environment Variables
```env
# Required environment variables
PORT=5001
CORS_ORIGIN=http://localhost:3000
```

### Running the Service
```bash
# Start the development server
python app.py

# Start with gunicorn (production)
gunicorn app:app
```

## Project Structure
```
flask-ai/
├── models/           # Trained ML models
├── app.py           # Main application file
├── retrain_models.py # Model training script
├── requirements.txt  # Python dependencies
├── .env             # Environment variables
├── .env.example     # Example environment variables
└── render.yaml      # Deployment configuration
```

## Deployment
The service is configured for deployment on Render with the following features:
- Python 3.9.0 environment
- Automatic deployment
- Health check endpoint
- Gunicorn as the WSGI server

## Error Handling
The service includes comprehensive error handling:
- Input validation for all API endpoints
- Exception logging
- Structured error responses

## Security
- CORS configuration with allowed origins
- Input validation
- Error message sanitization

## Contributing
1. Fork the repository
2. Create your feature branch
3. Commit your changes
4. Push to the branch
5. Create a Pull Request

## License
[Your License Information]

## Version History
- v1.0.0 - Initial Release
  - Basic API implementation
  - ML model integration
  - Deployment configuration
