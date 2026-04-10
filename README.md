# Fitness & Wellness Platform 🏋️‍♂️🧘‍♀️

> A comprehensive health and fitness tracking platform combining workout tracking, nutrition monitoring, mental health assessment, and AI-powered recommendations

[![React](https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)](https://reactjs.org/)
[![Node.js](https://img.shields.io/badge/Node.js-43853D?style=for-the-badge&logo=node.js&logoColor=white)](https://nodejs.org/)
[![Express.js](https://img.shields.io/badge/Express.js-404D59?style=for-the-badge)](https://expressjs.com/)
[![MongoDB](https://img.shields.io/badge/MongoDB-4EA94B?style=for-the-badge&logo=mongodb&logoColor=white)](https://mongodb.com/)
[![Flask](https://img.shields.io/badge/Flask-000000?style=for-the-badge&logo=flask&logoColor=white)](https://flask.palletsprojects.com/)
[![Socket.io](https://img.shields.io/badge/Socket.io-010101?style=for-the-badge&logo=socket.io&logoColor=white)](https://socket.io/)

## 🚀 Overview

A comprehensive health and fitness tracking platform that combines workout tracking, nutrition monitoring, mental health assessment, and gamification features with AI-powered recommendations.

### ✨ Key Features

- **🏃‍♂️ Workout Tracking** - Log exercises, track duration, calories burned, and heart rate with detailed analytics
- **🥗 Nutrition Monitoring** - Comprehensive meal logging with Kenyan cuisine database, macronutrient tracking, and meal suggestions
- **🧠 Mental Health Assessment** - Daily mood check-ins, stress level monitoring, sleep quality tracking with personalized insights
- **🎮 Gamification** - Earn points, maintain streaks across activities, unlock achievements, and level up your fitness journey
- **🤖 AI-Powered Recommendations** - Personalized diet plans, workout suggestions, and stress management advice using ML models
- **📊 Interactive Dashboard** - Visual progress tracking with charts, real-time activity feed, and performance analytics
- **🔌 Device Integration** - Connect with Google Fit and Fitbit to sync health data automatically
- **📱 Responsive Design** - Seamless experience across desktop, tablet, and mobile devices

## 🛠️ Tech Stack

### Frontend
- **Framework**: React 18 with Vite
- **UI Components**: React Bootstrap, Custom CSS with modern variables
- **Charts & Visualizations**: Chart.js, ApexCharts, React-Chartjs-2
- **Forms & Validation**: React Hook Form, DatePicker
- **Notifications**: React Toastify, SweetAlert2
- **Icons**: React Icons, Font Awesome
- **Real-time**: Socket.IO Client
- **HTTP Client**: Axios with interceptors
- **State Management**: React Context API + Custom EventEmitter

### Backend
- **Runtime**: Node.js with ES Modules
- **Framework**: Express.js
- **Database**: MongoDB with Mongoose ODM
- **Authentication**: JWT with bcryptjs
- **Real-time**: Socket.IO for live updates
- **Validation**: Express-validator middleware
- **Logging**: Custom logger with environment-based levels
- **External APIs**: Google Fit API, Fitbit API integration

### AI Service
- **Framework**: Flask 2.0.1
- **ML Libraries**: scikit-learn, pandas, numpy, joblib
- **ML Models**: RandomForest classifiers for diet, stress, and workout recommendations
- **Data Processing**: Pandas for feature engineering, one-hot encoding
- **API**: RESTful endpoints with CORS support

### Development Tools
- **Package Managers**: npm, pip, uv (fast Python package installer)
- **Environment**: dotenv for configuration
- **Process Management**: Nodemon for hot-reload
- **Version Control**: Git with conventional commits

## 🏗️ Project Structure

```
fitnessApp/
├── backend/                 # Node.js backend application
│   ├── config/             # Database configuration
│   ├── controllers/         # Business logic for each feature
│   │   ├── aiController.js      # AI recommendation handling
│   │   ├── gamificationController.js
│   │   ├── mentalHealthController.js
│   │   ├── nutritionController.js
│   │   ├── syncController.js     # Device sync logic
│   │   ├── userController.js
│   │   └── workoutController.js
│   ├── middlewares/         # Auth and validation middleware
│   ├── models/              # MongoDB schemas
│   │   ├── Gamification.js
│   │   ├── MentalHealth.js
│   │   ├── Nutrition.js
│   │   ├── User.js
│   │   └── Workout.js
│   ├── routes/              # API routes
│   ├── services/            # External service integrations
│   │   ├── fitbitService.js
│   │   └── googleFitService.js
│   ├── utils/
│   │   ├── aiCache.js       # AI response caching
│   │   └── logger.js        # Winston logging
│   └── server.js             # Main application entry
│
├── frontend/                 # React frontend application
│   ├── public/               # Static assets
│   │   └── images/           # App images and icons
│   ├── src/
│   │   ├── components/       # Reusable components
│   │   │   ├── 3D/          # 3D background effects
│   │   │   ├── Navbar.jsx
│   │   │   ├── Footer.jsx
│   │   │   ├── Notification.jsx
│   │   │   ├── PrivateRoute.jsx
│   │   │   └── UserContext.jsx
│   │   ├── pages/            # Main application pages
│   │   │   ├── Dashboard.jsx
│   │   │   ├── Workout.jsx
│   │   │   ├── Nutrition.jsx
│   │   │   ├── MentalHealth.jsx
│   │   │   ├── Gamification.jsx
│   │   │   ├── Recommendation.jsx
│   │   │   ├── Profile.jsx
│   │   │   └── AuthCallback.jsx
│   │   ├── services/         # API service layer (12 services)
│   │   │   ├── UserService.js
│   │   │   ├── WorkoutService.js
│   │   │   ├── NutritionService.js
│   │   │   ├── MentalHealthService.js
│   │   │   ├── GamificationService.js
│   │   │   ├── NotificationService.js
│   │   │   ├── GoogleFitService.js
│   │   │   ├── FitbitService.js
│   │   │   ├── DietRecommendationService.js
│   │   │   ├── RecommendationService.js  # Batch API for all recommendations
│   │   │   ├── StressAnalysisService.js
│   │   │   └── WorkoutRecommenderService.js
│   │   ├── utils/            # Helper functions
│   │   └── axiosConfig.js    # Axios interceptors
│   └── vite.config.js         # Vite configuration
│
├── flask-ai/                  # Python AI service
│   ├── models/                 # ML models and recommenders
│   │   ├── diet_recommender.py
│   │   ├── stress_analysis.py
│   │   ├── workout_recommender.py
│   │   ├── model_manager.py   # Lazy loading for ML models
│   │   ├── diet_model.pkl
│   │   ├── stress_model.pkl
│   │   └── workout_model.pkl
│   ├── app.py                  # Flask application
│   ├── retrain_models.py       # Model training script
│   ├── requirements.txt        # Python dependencies
│   └── gunicorn.conf.py       # Production server config
│
└── README.md
```

## 🚦 Getting Started

### Prerequisites

- **Node.js** (v18 or higher)
- **Python** (v3.9 or higher)
- **MongoDB** (v6.0 or higher - local or Atlas)
- **npm** or **yarn** for Node packages
- **pip** or **uv** for Python packages

### Required Accounts & API Keys
- Google Cloud Platform account (for Google Fit integration)
- Fitbit Developer account (for Fitbit integration)
- MongoDB Atlas account (optional, for cloud database)

### Installation

#### Option 1: From Zip File

1. **Extract the zip file**
   ```bash
   # Extract to your desired location
   unzip fitnessApp.zip -d ./fitnessApp
   cd fitnessApp
   ```

2. **Backend Setup**
   ```bash
   # Navigate to backend directory
   cd backend

   # Install dependencies
   npm install

   # Copy environment example file
   cp .env.example .env

   # Edit .env with your configuration (see Environment Variables section)
   # Start the backend server
   npm run dev
   ```

3. **Frontend Setup** (Terminal 2)
   ```bash
   cd frontend

   # Install dependencies
   npm install

   # Create environment file
   echo "VITE_API_URL=http://localhost:5000/api" > .env
   echo "VITE_SOCKET_URL=http://localhost:5000" >> .env

   # Start the frontend server
   npm run dev
   ```

4. **AI Service Setup** (Terminal 3)
   ```bash
   cd flask-ai

   # Create and activate virtual environment
   python -m venv .venv
   
   # Windows:
   .venv\Scripts\activate
   
   # macOS/Linux:
   source .venv/bin/activate

   # Install dependencies
   pip install -r requirements.txt

   # Create environment file
   echo "PORT=5001" > .env
   echo "CORS_ORIGIN=http://localhost:3000" >> .env
   echo "FLASK_ENV=development" >> .env

   # Start the AI service
   python app.py
   ```

#### ⚠️ IMPORTANT: All 3 services must be running simultaneously:
- Backend (Node) on port 5000
- Frontend (Vite) on port 3000  
- AI Service (Flask) on port 5001

#### Option 2: From Git Repository
```bash
# Clone the repository
git clone https://github.com/CamlineKe/fitnessApp.git
cd fitnessApp

# Follow steps 2-4 from Option 1 above
```

### Environment Configuration

#### Backend (.env)
```env
# Server Configuration
PORT=5000
NODE_ENV=development

# Database Configuration
MONGO_URI=mongodb://localhost:27017/fitnessApp
# For MongoDB Atlas:
# MONGO_URI=mongodb+srv://<username>:<password>@<cluster>.mongodb.net/fitnessApp

# JWT Configuration
JWT_SECRET=your-super-secret-jwt-key-min-32-chars
JWT_REFRESH_SECRET=your-refresh-secret-key

# OAuth Credentials
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
GOOGLE_REDIRECT_URI=http://localhost:3000/auth/callback

FITBIT_CLIENT_ID=your_fitbit_client_id
FITBIT_CLIENT_SECRET=your_fitbit_client_secret
FITBIT_REDIRECT_URI=http://localhost:3000/auth/fitbit/callback

# Frontend URL for CORS
FRONTEND_URL=http://localhost:3000

# Flask AI Service URL (base URL only, appends /api automatically)
FLASK_URL=http://localhost:5001
```

#### Frontend (.env.local)
```env
VITE_API_URL=http://localhost:5000/api
VITE_SOCKET_URL=http://localhost:5000
```

#### AI Service (.env)
```env
FLASK_ENV=development
PORT=5001
CORS_ORIGIN=http://localhost:3000
```

### Access the Application

Once all 3 services are running:

- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:5000
- **AI Service**: http://localhost:5001
- **Health Check**: http://localhost:5000/api/health

## 🎮 Usage Guide

### User Authentication
- **Register**: Create account with email verification
- **Login**: Secure JWT-based authentication
- **Profile**: Update personal info, health goals, change password

### Workout Tracking
- Log workouts with activity type, duration, calories, heart rate
- View workout history and progress charts
- Track weekly workout frequency and volume
- Receive AI-powered workout recommendations

### Nutrition Tracking
- Log meals from extensive Kenyan cuisine database
- Auto-fill nutritional information from meal suggestions
- Track daily calories and macronutrients (protein, carbs, fats)
- View meal type distribution and weekly calorie trends

### Mental Health
- Daily mood check-ins (happy, neutral, anxious, sad)
- Track stress levels and sleep quality
- Add notes for context
- Receive personalized stress management recommendations
- View mood trends over time

### Gamification
- Earn points for all activities
- Maintain streaks across workout, mental health, and nutrition
- Unlock achievements and level up
- Track progress with interactive dashboard

### Device Integration
- Connect Google Fit or Fitbit accounts
- Sync health data automatically
- View calories burned and heart rate from connected devices

## 🤖 AI Recommendations

The platform uses machine learning models to provide personalized recommendations:

### Diet Recommendations
- Analyzes meal logs and nutritional patterns
- Provides macronutrient balance advice
- Suggests meal timing improvements
- Confidence scoring for ML predictions

### Workout Recommendations
- Analyzes workout history and intensity
- Provides heart rate zone guidance
- Suggests workout frequency and duration adjustments
- Age and gender-specific recommendations

### Stress Analysis
- Analyzes mood patterns and trends
- Provides personalized coping strategies
- Age and gender-specific wellness tips
- Tracks stress level progression

## 🔌 API Integrations

### Google Fit
- Required scopes:
  - `https://www.googleapis.com/auth/fitness.activity.read`
  - `https://www.googleapis.com/auth/fitness.heart_rate.read`
  - `https://www.googleapis.com/auth/fitness.body.read`

### Fitbit
- Required scopes:
  - activity
  - heartrate
  - profile

## 📊 API Endpoints

### Authentication
- `POST /api/users/register` - User registration
- `POST /api/users/login` - User login
- `GET /api/users/profile` - Get user profile
- `PUT /api/users/profile` - Update profile
- `PUT /api/users/change-password` - Change password

### Workouts
- `GET /api/workouts` - Get all workouts
- `POST /api/workouts` - Create workout log
- `GET /api/workouts/today` - Get today's workout
- `GET /api/workouts/:id` - Get specific workout
- `PUT /api/workouts/:id` - Update workout
- `DELETE /api/workouts/:id` - Delete workout

### Nutrition
- `GET /api/nutrition` - Get nutrition logs
- `POST /api/nutrition` - Create meal log
- `PUT /api/nutrition/:id` - Update meal log
- `DELETE /api/nutrition/:id` - Delete meal log

### Mental Health
- `GET /api/mentalhealth` - Get mental health logs
- `POST /api/mentalhealth` - Create check-in
- `PUT /api/mentalhealth/:id` - Update check-in
- `DELETE /api/mentalhealth/:id` - Delete check-in

### Gamification
- `GET /api/gamification/data` - Get gamification stats
- `POST /api/gamification/points` - Update points
- `POST /api/gamification/streak` - Update streak
- `GET /api/gamification/leaderboard` - Get leaderboard

### AI Recommendations
- `POST /api/ai/diet` - Get diet recommendations
- `POST /api/ai/workout` - Get workout recommendations
- `POST /api/ai/stress` - Get stress analysis
- `POST /api/ai/all` - Get all recommendations in single request (batch)

### Device Sync
- `GET /api/sync/device-status` - Get device connection status
- `GET /api/sync/calories` - Get calories from connected devices
- `GET /api/sync/health-data` - Get health metrics
- `POST /api/sync/:device/connect` - Connect device
- `POST /api/sync/:device/disconnect` - Disconnect device

## 🧪 Testing

### Backend Tests
```bash
cd backend
npm test
```

### Frontend Tests
```bash
cd frontend
npm test
```

### AI Service Tests
```bash
cd flask-ai
python -m pytest
```

## 🚀 Deployment

### Frontend (Vercel)
The frontend includes `vercel.json` for zero-config deployment:

1. Connect GitHub repository to Vercel
2. Add environment variables:
   - `VITE_API_URL`: Your Render backend URL
   - `VITE_SOCKET_URL`: Your Render backend URL
3. Deploy automatically on push

### Backend (Render)
The backend includes `render.yaml` for deployment:

1. Create new Web Service on Render
2. Connect repository
3. Set build command: `npm install`
4. Set start command: `node server.js`
5. Add environment variables (see Environment Configuration section)
6. Deploy

### AI Service (Render)
The AI service includes `render.yaml` with gunicorn configuration:

1. Create new Web Service
2. Set environment: Python 3.12
3. Build command: `pip install -r requirements.txt`
4. Start command: `gunicorn -c gunicorn.conf.py app:app`
5. Add environment variables
6. Deploy

## 🔒 Security Features

- JWT authentication with token expiration
- Password hashing with bcryptjs
- Environment-based configuration
- CORS with allowed origins
- Input validation and sanitization
- Rate limiting on API endpoints
- Secure session management
- Sensitive data redaction in logs

## 📈 Performance Optimizations

- **Backend**: HTTP keep-alive for Flask AI connection reuse
- **Backend**: LRU cache (4-min TTL) with optimized key bucketing
- **Backend**: Batch API reduces round trips from 3 to 1 (~300-500ms saved)
- **Flask AI**: Bounded LRU cache (100 entries) prevents memory leaks
- **Flask AI**: Async model loading eliminates cold-start timeouts
- **Frontend**: SessionStorage caching (5-min TTL) for recommendations
- **Frontend**: Axios instance with connection reuse
- MongoDB indexing for fast queries
- Socket.IO for real-time updates
- Lazy loading of routes and components
- Optimized bundle size with Vite
- Environment-based logging levels

## 🤝 Contributing

1. Fork the repository
2. Create feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit changes (`git commit -m 'feat: add AmazingFeature'`)
4. Push to branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

### Commit Convention
```
feat: add new feature
fix: bug fix
docs: documentation changes
style: formatting, missing semicolons
refactor: code restructuring
test: adding tests
chore: maintenance tasks
```

## 📋 Roadmap

- [x] Basic workout tracking
- [x] Nutrition logging with Kenyan meals
- [x] Mental health check-ins
- [x] Gamification system
- [x] Google Fit integration
- [x] Fitbit integration
- [x] AI-powered recommendations
- [ ] Apple Health integration
- [ ] Social features and challenges
- [ ] Custom workout plans
- [ ] Meal planning and recipes
- [ ] Push notifications
- [ ] Offline mode
- [ ] Wearable device sync

## 🐛 Troubleshooting

### Common Issues

**MongoDB Connection Error**
```
Verify MongoDB is running: mongod
Check connection string in .env
Ensure network allows connection
```

**CORS Errors**
```
Verify FRONTEND_URL in backend .env
Check VITE_API_URL in frontend .env
Confirm ports match configuration
```

**OAuth Integration Issues**
```
Verify redirect URIs in OAuth provider dashboard
Check client ID and secret are correct
Ensure scopes are properly configured
```

**Backend Server Not Starting**
```bash
# Check if MongoDB is running
mongod

# Verify all required env vars are set
cat backend/.env

# Check for port conflicts
lsof -i :5000
```

**AI Service Not Responding**
```bash
# Check if Flask server is running on port 5001
curl http://localhost:5001/api/health

# Verify Python virtual environment is activated
which python

# Check model files exist
ls flask-ai/models/*.pkl

# Reinstall dependencies
pip install -r requirements.txt
```

**Frontend Can't Connect to Backend**
```bash
# Verify backend is running
curl http://localhost:5000/api/health

# Check frontend .env has correct URL
cat frontend/.env

# Ensure VITE_API_URL ends with /api
# Should be: http://localhost:5000/api
```

## 📄 License

This project is licensed under the ISC License.

## 👨‍💻 Author

**Camline** - [CamlineKe](https://github.com/CamlineKe)

## 🙏 Acknowledgments

- Google Fit API team
- Fitbit Developer team
- MongoDB Atlas team
- scikit-learn community
- All open-source contributors

---

**Built with ❤️ for better health and wellness**