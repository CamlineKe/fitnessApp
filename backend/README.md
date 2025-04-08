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
- **Runtime:** Node.js
- **Framework:** Express.js 4.21
- **Database:** MongoDB with Mongoose 8.10
- **Real-time:** Socket.IO 4.8
- **Authentication:** JWT + OAuth2
- **HTTP Client:** Axios 1.7
- **Security:** bcryptjs 3.0
- **Environment:** dotenv 16.4
- **CORS:** cors 2.8
- **Development:** nodemon 3.1

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

#### AI Recommendations
```javascript
// AI routes
router.post('/analyze', authMiddleware, aiController.analyzeData);
router.get('/recommendations', authMiddleware, aiController.getRecommendations);
```

## Real-time Implementation

### Socket.IO Configuration
```javascript
// WebSocket setup for real-time updates
const io = new Server(server, {
  cors: {
    origin: [
      'http://localhost:3000',
      'http://localhost:5000',
      process.env.FRONTEND_URL,
      'https://fitness-3doakdbyh-camlinekes-projects.vercel.app'
    ].filter(Boolean),
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    credentials: true,
    allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With"],
    transports: ['websocket', 'polling']
  }
});

// Socket authentication
socket.on('authenticate', async (token) => {
  // Token validation and user room joining
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
# Required environment variables
PORT=5000
MONGODB_URI=your_mongodb_uri
JWT_SECRET=your_jwt_secret
FRONTEND_URL=your_frontend_url

# OAuth Configuration
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
FITBIT_CLIENT_ID=your_fitbit_client_id
FITBIT_CLIENT_SECRET=your_fitbit_client_secret

# OAuth Scopes
GOOGLE_FIT_SCOPES=https://www.googleapis.com/auth/fitness.activity.read https://www.googleapis.com/auth/fitness.heart_rate.read https://www.googleapis.com/auth/fitness.body.read
FITBIT_SCOPES=activity heartrate profile
```

## Project Structure
```
backend/
├── config/         # Configuration files
├── controllers/    # Route controllers
├── middlewares/    # Custom middlewares
├── models/        # Database models
├── routes/        # API routes
├── services/      # Business logic
├── utils/         # Utility functions
├── .env          # Environment variables
├── .env.example  # Example environment variables
├── .env.production # Production environment variables
├── server.js     # Application entry point
└── package.json  # Project dependencies
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

## Deployment
The application is configured for deployment on Render with the following features:
- Environment-specific configuration
- Health check endpoint
- CORS configuration for production
- WebSocket support in production
- Error logging and monitoring

## Contributing Guidelines
1. Fork the repository
2. Create feature branch
3. Follow coding standards
4. Write tests
5. Submit pull request

## License
[Your License Information]

## Version History
- v1.0.0 - Initial Release
  - Basic API implementation
  - Platform integrations
  - Real-time updates
  - User authentication
  - Workout tracking
  - Nutrition monitoring
  - Mental health assessment
  - Gamification features

## Contact
[Your Contact Information]
