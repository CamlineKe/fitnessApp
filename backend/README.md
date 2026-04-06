# Fitness and Wellness Tracker Backend
> A robust Node.js backend service supporting the Fitness and Wellness Tracking platform

## Project Overview
This backend service provides the API infrastructure for a comprehensive health management platform, handling fitness data integration, user management, and real-time health metrics synchronization.

### Key Features
- 🔐 Secure user authentication and authorization
- 🔄 Integration with multiple fitness platforms (Google Fit, Fitbit)
- 📊 Real-time data synchronization with Socket.IO
- 🤖 AI-powered health recommendations
- 📱 Cross-platform data management
- 🔌 WebSocket support for real-time updates
- 🏃‍♂️ Workout tracking and management
- 🥗 Nutrition monitoring
- 🧘‍♀️ Mental health assessment
- 🎮 Gamification features

## Technical Stack
- **Runtime:** Node.js 18+
- **Framework:** Express.js 4.21.2
- **Database:** MongoDB with Mongoose 8.10
- **Authentication:** JWT (jsonwebtoken 9.0) + bcryptjs 3.0
- **Real-time:** Socket.IO 4.8
- **Validation:** express-validator 7.3
- **Rate Limiting:** express-rate-limit 7.5
- **Security:** cors, cookie-parser, dotenv
- **HTTP Client:** Axios 1.7
- **Development:** nodemon 3.1
- **External AI:** Flask Python service (diet/stress/workout ML)

## API Architecture

### Core Routes

#### User Management
```javascript
// User routes
router.post('/register', userController.register);
router.post('/login', userController.login);
router.get('/profile', authMiddleware, userController.getProfile);
router.put('/profile', authMiddleware, userController.updateProfile);
```

#### Workout Management
```javascript
// Workout routes
router.post('/', authMiddleware, workoutController.createWorkout);
router.get('/', authMiddleware, workoutController.getWorkouts);
router.get('/:id', authMiddleware, workoutController.getWorkout);
router.put('/:id', authMiddleware, workoutController.updateWorkout);
router.delete('/:id', authMiddleware, workoutController.deleteWorkout);
```

#### Nutrition Tracking
```javascript
// Nutrition routes
router.post('/', authMiddleware, nutritionController.addNutrition);
router.get('/', authMiddleware, nutritionController.getNutrition);
router.get('/stats', authMiddleware, nutritionController.getStats);
```

#### Mental Health
```javascript
// Mental health routes
router.post('/assessment', authMiddleware, mentalHealthController.addAssessment);
router.get('/history', authMiddleware, mentalHealthController.getHistory);
```

#### Gamification
```javascript
// Gamification routes
router.get('/achievements', authMiddleware, gamificationController.getAchievements);
router.post('/progress', authMiddleware, gamificationController.updateProgress);
```

#### Data Synchronization
```javascript
// Sync routes
router.post('/google-fit', authMiddleware, syncController.syncGoogleFit);
router.post('/fitbit', authMiddleware, syncController.syncFitbit);
router.get('/status', authMiddleware, syncController.getSyncStatus);
```

#### AI Recommendations (Flask AI Service Proxy)
```javascript
// AI routes - proxied to Python Flask ML service
router.post('/diet', authMiddleware, aiController.getDietRecommendations);
router.post('/stress', authMiddleware, aiController.analyzeStress);
router.post('/workout', authMiddleware, aiController.getWorkoutRecommendations);
```

The backend acts as a proxy to the Flask AI service running on port 5001.

## Real-time Implementation

### Socket.IO Configuration
```javascript
// WebSocket setup for real-time updates
const io = new Server(server, {
  cors: {
    origin: [
      'http://localhost:3000',
      process.env.FRONTEND_URL
    ].filter(Boolean),
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    credentials: true,
    allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With"],
    transports: ['websocket', 'polling']
  }
});
```

## Development Setup

### Installation
```bash
# Install dependencies
npm install

# Set up environment variables
cp .env.example .env

# Start development server
npm run dev

# Start production server
npm start
```

### Environment Variables
```env
# Required - Database
MONGO_URI=mongodb+srv://username:password@cluster.mongodb.net/fitnessApp
PORT=5000
JWT_SECRET=your_jwt_secret_key
JWT_REFRESH_SECRET=your_refresh_secret_key

# Required - Frontend CORS
FRONTEND_URL=http://localhost:3000

# OAuth - Google Fit
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
GOOGLE_REDIRECT_URI=http://localhost:3000/auth/callback

# OAuth - Fitbit  
FITBIT_CLIENT_ID=your_fitbit_client_id
FITBIT_CLIENT_SECRET=your_fitbit_client_secret
FITBIT_REDIRECT_URI=http://localhost:3000/auth/fitbit/callback

# Flask AI Service
FLASK_AI_URL=http://localhost:5001
```

## Project Structure
```
backend/
├── config/
│   ├── db.js              # MongoDB connection
│   └── validation.js      # Environment variable validation
├── controllers/           # 7 route controllers
│   ├── aiController.js           # Flask AI proxy
│   ├── gamificationController.js
│   ├── mentalHealthController.js
│   ├── nutritionController.js
│   ├── syncController.js         # OAuth + platform sync
│   ├── userController.js
│   └── workoutController.js
├── middlewares/
│   ├── authMiddleware.js   # JWT verification
│   ├── rateLimiter.js     # Express rate limiting
│   └── validation.js      # Request validators
├── models/                # 5 Mongoose models
│   ├── Gamification.js
│   ├── MentalHealth.js
│   ├── Nutrition.js
│   ├── User.js
│   └── Workout.js
├── routes/                # 8 API route modules
│   ├── aiRoutes.js
│   ├── gamificationRoutes.js
│   ├── legalRoutes.js      # Privacy/terms
│   ├── mentalHealthRoutes.js
│   ├── nutritionRoutes.js
│   ├── syncRoutes.js
│   ├── userRoutes.js
│   └── workoutRoutes.js
├── services/              # External platform integrations
│   ├── fitbitService.js
│   └── googleFitService.js
├── utils/
│   ├── aiCache.js         # AI response caching
│   └── logger.js          # Winston logging utility
├── .env                   # Environment variables
├── .env.example           # Example env file
├── render.yaml            # Render deployment config
├── package.json
└── server.js              # Entry point with Socket.IO
```

## Security Implementations
- JWT Authentication with token expiry
- OAuth2 for third-party services
- CORS policy with allowed origins
- Request validation and sanitization
- Secure headers configuration
- Environment variable protection
- Error handling middleware

## Error Handling
```javascript
// Global error handler
app.use((err, req, res, next) => {
  Logger.error('Error:', err);
  res.status(err.status || 500).json({
    error: {
      message: err.message || 'Internal Server Error',
      status: err.status || 500
    }
  });
});

// Uncaught exception handler
process.on('uncaughtException', (error) => {
  Logger.error('Server error:', error);
});
```

## Deployment (Render)

The backend includes `render.yaml` for zero-config deployment:

```yaml
services:
  - type: web
    name: fitness-app-backend
    env: node
    buildCommand: npm install
    startCommand: node server.js
    envVars:
      - key: NODE_ENV
        value: production
      - key: PORT
        value: "5000"
      - key: JWT_SECRET
        generateValue: true
    healthCheckPath: /api/health
    autoDeploy: true
```

### Pre-Deployment Checklist
- [ ] Set `MONGO_URI` in Render environment variables
- [ ] Set `FRONTEND_URL` to your Vercel frontend URL
- [ ] Configure OAuth credentials (Google Fit, Fitbit)
- [ ] Deploy Flask AI service separately and set `FLASK_AI_URL`
- [ ] Ensure CORS origins include your frontend domain

## Contributing
1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes with descriptive messages
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Create a Pull Request

## License
MIT License

## Version History
- **v1.0.0** - Initial Release
  - Express.js REST API with MongoDB
  - JWT authentication with refresh tokens
  - Socket.IO real-time notifications
  - Google Fit & Fitbit OAuth integration
  - 7 controllers: user, workout, nutrition, mental health, gamification, sync, AI proxy
  - Rate limiting and request validation
  - Winston logging utility
  - AI service proxy to Flask backend
