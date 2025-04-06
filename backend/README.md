# Fitness and Wellness Tracker Backend
> A robust Node.js backend service supporting the Fitness and Wellness Tracking platform

## Project Overview
This backend service provides the API infrastructure for a comprehensive health management platform, handling fitness data integration, user management, and real-time health metrics synchronization.

### Key Features
- 🔐 Secure user authentication and authorization
- 🔄 Integration with multiple fitness platforms (Google Fit, Fitbit)
- 📊 Real-time data synchronization
- 🤖 AI-powered health recommendations
- 📱 Cross-platform data management
- 🔌 WebSocket support for real-time updates

## Technical Stack
- **Runtime:** Node.js
- **Framework:** Express.js
- **Database:** MongoDB with Mongoose
- **Real-time:** Socket.IO
- **Authentication:** JWT + OAuth2
- **AI Service:** Flask Python backend
- **Logging:** Custom Logger implementation

## API Architecture

### Core Services

#### Authentication Service
```javascript
// JWT authentication implementation
import jwt from 'jsonwebtoken';

// Token generation with expiry
const generateToken = (userId) => {
  return jwt.sign({ userId }, process.env.JWT_SECRET, {
    expiresIn: '24h'
  });
};
```

#### Platform Integration Services

```javascript
// Google Fit Service
class GoogleFitService {
  // OAuth2 authentication URL generation
  static async getAuthUrl() {
    const scopes = [
      'https://www.googleapis.com/auth/fitness.activity.read',
      'https://www.googleapis.com/auth/fitness.heart_rate.read',
      'https://www.googleapis.com/auth/fitness.body.read'
    ];
    // ... auth URL generation logic
  }

  // Health data fetching
  static async getHealthData(userId) {
    // ... health data retrieval logic
  }
}

// Fitbit Service
class FitbitService {
  // Similar implementation for Fitbit integration
}
```

### API Routes

#### User Routes
```javascript
// User management endpoints
router.post('/register', userController.register);
router.post('/login', userController.login);
router.get('/profile', authMiddleware, userController.getProfile);
router.put('/profile', authMiddleware, userController.updateProfile);
```

#### Sync Routes
```javascript
// Data synchronization endpoints
router.post('/sync', authMiddleware, syncController.syncData);
router.get('/health-data', authMiddleware, syncController.getHealthData);
router.get('/device-status', authMiddleware, syncController.getDeviceStatus);
```

## Database Schema

### User Schema
```javascript
// User model definition
const userSchema = new Schema({
  username: { type: String, required: true, unique: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  devices: {
    googleFit: {
      connected: Boolean,
      accessToken: String,
      refreshToken: String,
      lastSynced: Date
    },
    fitbit: {
      connected: Boolean,
      accessToken: String,
      refreshToken: String,
      lastSynced: Date
    }
  }
});
```

## Real-time Implementation

### Socket.IO Configuration
```javascript
// WebSocket setup for real-time updates
const io = new Server(server, {
  cors: {
    origin: ['http://localhost:3000', 'http://localhost:5000'],
    methods: ["GET", "POST"],
    credentials: true
  }
});

// Socket authentication
io.use(async (socket, next) => {
  // ... socket authentication middleware
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
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
FITBIT_CLIENT_ID=your_fitbit_client_id
FITBIT_CLIENT_SECRET=your_fitbit_client_secret
```

## API Documentation

### Authentication Endpoints
```javascript
/**
 * @route POST /api/auth/register
 * @desc Register a new user
 * @access Public
 */

/**
 * @route POST /api/auth/login
 * @desc Authenticate user & get token
 * @access Public
 */
```

### Health Data Endpoints
```javascript
/**
 * @route GET /api/sync/health-data
 * @desc Get user's health data
 * @access Private
 */

/**
 * @route POST /api/sync/
 * @desc Sync data from connected platforms
 * @access Private
 */
```

## Error Handling
```javascript
// Global error handler
const errorHandler = (err, req, res, next) => {
  Logger.error(err.stack);
  res.status(err.status || 500).json({
    message: err.message,
    stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
  });
};
```

## Security Implementations
- JWT Authentication
- OAuth2 for third-party services
- Request rate limiting
- Input validation and sanitization
- Secure headers configuration
- CORS policy

## Testing
```bash
# Run unit tests
npm run test

# Run integration tests
npm run test:integration

# Generate coverage report
npm run test:coverage
```

## Deployment
```bash
# Build for production
npm run build

# Start production server
npm start
```

## Monitoring and Logging
- Custom Logger implementation
- Error tracking
- Performance monitoring
- API usage statistics

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

## Contact
[Your Contact Information]
