# Fitness and Wellness Tracker Frontend
> A comprehensive cross-platform fitness and wellness tracking application built with React + Vite

## Project Overview
This application serves as a holistic health management platform, combining fitness tracking, nutrition monitoring, and mental health assessment with integration support for major fitness platforms.

### Key Features
- 🏃‍♂️ **Fitness Tracking**: Log workouts with heart rate zones and calorie tracking
- 🥗 **Nutrition Monitoring**: Track daily intake with ML-powered recommendations
- 🧘‍♀️ **Mental Health**: Mood tracking and stress analysis with AI insights
- 🎮 **Gamification**: Achievement system with confetti rewards and badges
- 🤖 **AI-Powered**: ML recommendations from Flask AI service (diet, workout, stress)
- ⚡ **Batch API**: Single request fetches all recommendations (saves ~300-400ms)
- 💾 **Session Caching**: 5-minute client-side cache for recommendations
- 🔄 **Cache Invalidation**: Auto-clear on profile updates (gender/DOB changes)
- 📊 **Data Visualization**: Interactive charts with Chart.js and ApexCharts
- 🔗 **Platform Integration**: Google Fit and Fitbit OAuth sync
- 🔔 **Real-time Notifications**: Socket.IO for live updates
- 📱 **Responsive Design**: Mobile-first with React Bootstrap
- ⚡ **Vite Build**: Fast HMR and optimized production builds

## Technical Stack
- **Framework:** React 18+ with Vite 6
- **State Management:** Context API with custom hooks
- **Real-time Updates:** Socket.IO Client
- **Styling:** CSS Modules + React Bootstrap
- **HTTP Client:** Axios
- **Authentication:** JWT with OAuth2 support
- **UI Components:** 
  - React Bootstrap
  - SweetAlert2 for notifications
  - React Toastify for toast messages
  - Font Awesome icons
  - React Icons
- **Data Visualization:** 
  - Chart.js
  - ApexCharts
  - React Chart.js 2
- **Date Handling:** React Datepicker

## Backend Integration

### Flask AI Service
The frontend communicates with a Python Flask AI service for intelligent recommendations:

```
POST /api/ai/diet      → Diet recommendations based on nutrition data
POST /api/ai/stress    → Stress analysis from mood/sleep patterns  
POST /api/ai/workout   → Workout recommendations with heart rate zones
POST /api/ai/all       → Batch endpoint - all 3 in single request (optimized)
```

Configure the AI service URL in your environment:
```env
VITE_API_URL=http://localhost:5000  # or your deployed backend URL
```

The Vite dev server proxies `/api` requests to the backend automatically.

### API Service Layer (`src/services/`)
- `AppleHealthService.js` - Apple HealthKit integration
- `DietRecommendationService.js` - AI diet recommendation API
- `FitbitService.js` - Fitbit OAuth and data sync
- `GamificationService.js` - Achievements and badges API
- `GoogleFitService.js` - Google Fit OAuth and data sync
- `MentalHealthService.js` - Mental health logs and analysis
- `NotificationService.js` - Real-time notifications (Socket.IO)
- `NutritionService.js` - Food logging and nutrition data
- `RecommendationService.js` - **Batch API for all recommendations (optimized)**
- `StressAnalysisService.js` - AI stress analysis API
- `UserService.js` - Authentication and user profile
- `WorkoutRecommenderService.js` - AI workout recommendation API
- `WorkoutService.js` - Workout logging and history

### Core Components (`src/components/`)
- `3D/` - 3D animation components
- `Footer.jsx` - Application footer
- `Navbar.jsx` - Navigation header
- `Notification.jsx` - Real-time notification display
- `PrivateRoute.jsx` - Route protection wrapper
- `UserContext.jsx` - Global user state management

### Page Components (`src/pages/`)
- `AuthCallback.jsx` - OAuth callback handling (Google Fit/Fitbit)
- `Dashboard.jsx` - Main dashboard with health overview
- `Gamification.jsx` - Achievements and leaderboards
- `Home.jsx` - Landing/marketing page
- `Login.jsx` - User authentication
- `MentalHealth.jsx` - Mood and stress tracking
- `Nutrition.jsx` - Food logging and AI recommendations
- `Profile.jsx` - User settings and connected devices
- `Recommendation.jsx` - Personalized AI insights
- `Register.jsx` - User registration
- `Workout.jsx` - Exercise logging and heart rate zones
- `styles/` - Page-specific CSS modules

## Authentication Flow

### OAuth2 Integration
- **Google Fit**: OAuth2 for fitness data sync
- **Fitbit**: OAuth2 for activity and sleep data

OAuth callbacks handled at `/auth/callback` and `/auth/fitbit/callback`

### Protected Routes
Authenticated routes wrapped with `PrivateRoute` component:
- `/dashboard`
- `/workout`
- `/nutrition`
- `/mentalhealth`
- `/gamification`
- `/recommendation`
- `/profile`

## Deployment

### Vercel (Recommended)
The project includes `vercel.json` for zero-config deployment:

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel
```

Configuration handles SPA routing automatically:
```json
{
  "framework": "vite",
  "buildCommand": "npm run build",
  "outputDirectory": "dist",
  "rewrites": [{ "source": "/(.*)", "destination": "/index.html" }]
}
```

### Environment Variables for Production
```env
VITE_API_URL=https://your-backend-url.com
VITE_SOCKET_URL=wss://your-socket-url.com
```

## Development Setup

### Prerequisites
- Node.js >= 18.0.0
- npm >= 9.0.0

### Installation
```bash
# Install dependencies
npm install

# Start development server (with backend proxy)
npm run dev

# Build for production
npm run build

# Preview production build locally
npm run preview

# Run linting
npm run lint
```

### Local Development with Backend
The Vite dev server proxies API requests to the backend:
```javascript
// vite.config.js
proxy: {
  '/api': {
    target: 'http://localhost:5000',
    changeOrigin: true,
  },
}
```

## Project Structure
```
frontend/
├── src/
│   ├── assets/              # Static images and fonts
│   ├── components/          # Reusable UI components
│   │   ├── 3D/             # 3D animation components
│   │   ├── Navbar.jsx
│   │   ├── Footer.jsx
│   │   ├── Notification.jsx
│   │   ├── PrivateRoute.jsx
│   │   └── UserContext.jsx
│   ├── pages/              # Route-level page components
│   │   ├── styles/         # Page-specific CSS modules
│   │   ├── Home.jsx
│   │   ├── Login.jsx
│   │   ├── Register.jsx
│   │   ├── Dashboard.jsx
│   │   ├── Workout.jsx
│   │   ├── Nutrition.jsx
│   │   ├── MentalHealth.jsx
│   │   ├── Gamification.jsx
│   │   ├── Recommendation.jsx
│   │   ├── Profile.jsx
│   │   └── AuthCallback.jsx
│   ├── services/           # API service integrations
│   ├── utils/              # Helper functions
│   │   ├── recommendationsCache.js  # SessionStorage cache for recommendations
│   │   ├── EventEmitter.js          # Custom event bus
│   │   └── logger.js                # Logging utility
│   ├── data/               # Static data/constants
│   ├── App.jsx             # Root component with routing
│   ├── main.jsx            # Entry point
│   ├── index.css           # Global styles
│   └── axiosConfig.js      # Axios interceptors & config
├── public/                 # Public static assets
├── dist/                   # Production build output
├── .env                    # Environment variables
├── vite.config.js          # Vite configuration with proxy
├── vercel.json             # Vercel deployment config
└── package.json
```

## Performance Features

### Vite Build Optimizations
- **Code Splitting**: Manual chunks for vendor, charts, icons
- **Terser Minification**: Console logs stripped in production
- **Source Maps**: Development only
- **Chunk Size Warning**: 1000kb limit monitoring

### Runtime Optimizations
- **Batch API**: `RecommendationService.js` fetches all AI recommendations in single request
- **SessionStorage Caching**: 5-minute TTL cache in `recommendationsCache.js` reduces API calls
- **Cache Invalidation**: `Profile.jsx` clears cache on gender/DOB changes for fresh recommendations
- **Axios Instance**: Configured instance with interceptors for consistent auth handling
- **Graceful Fallback**: Batch failure falls back to individual API calls
- React Bootstrap for efficient component rendering

## Security Measures
- JWT token management
- OAuth2 secure authentication
- Protected routes
- Input validation
- Secure data transmission
- Environment variable protection

## Contributing
1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes with descriptive messages
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Create a Pull Request

## License
MIT License

## Version History
- **v1.1.0** - AI Optimizations
  - Batch API endpoint integration (saves ~300-400ms load time)
  - SessionStorage caching for recommendations (5-minute TTL)
  - Cache invalidation on profile updates
  - Axios instance configuration for connection reuse
  - Graceful fallback to individual API calls

- **v1.0.0** - Initial Release
  - User authentication (JWT + OAuth2)
  - Fitness tracking with Google Fit/Fitbit integration
  - Nutrition logging with AI recommendations
  - Mental health mood/stress tracking
  - Gamification system with achievements
  - Real-time notifications via Socket.IO
  - Responsive React + Vite frontend
  - Flask AI service integration