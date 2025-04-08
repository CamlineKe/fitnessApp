# Fitness and Wellness Tracker Frontend
> A comprehensive cross-platform fitness and wellness tracking application built with React + Vite

## Project Overview
This application serves as a holistic health management platform, combining fitness tracking, nutrition monitoring, and mental health assessment with integration support for major fitness platforms.

### Key Features
- 🏃‍♂️ Fitness tracking with Google Fit and Fitbit integration
- 🥗 Nutrition monitoring and recommendations
- 🧘‍♀️ Mental health assessment and tracking
- 📊 Real-time health data visualization with Chart.js and ApexCharts
- 🎮 Gamification for user engagement
- 📱 Cross-platform compatibility
- 🔔 Real-time notifications with Socket.IO
- 🎨 Modern UI with React Bootstrap and custom styling

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

## Application Structure

### Core Components

#### `App.jsx`
```jsx
// Root component with routing and layout management
<UserProvider>
  <Router>
    <AppWithLayout>
      {/* Protected and public routes */}
      {/* Layout components (Navbar, Footer) */}
    </AppWithLayout>
  </Router>
</UserProvider>
```

### Page Components
- `Home.jsx` - Landing page
- `Login.jsx` - User authentication
- `Register.jsx` - User registration
- `Dashboard.jsx` - Main user interface
- `Workout.jsx` - Workout tracking
- `Nutrition.jsx` - Nutrition management
- `MentalHealth.jsx` - Mental wellness tracking
- `Gamification.jsx` - User engagement features
- `Recommendation.jsx` - Personalized recommendations
- `Profile.jsx` - User profile management
- `AuthCallback.jsx` - OAuth callback handling

### Feature Components
- `Navbar.jsx` - Navigation header
- `Footer.jsx` - Application footer
- `Notification.jsx` - Real-time notifications
- `PrivateRoute.jsx` - Protected route wrapper

## Authentication Flow

### OAuth2 Integration
```javascript
// Supported OAuth providers
- Google Fit
- Fitbit
```

### Protected Routes
```javascript
// Route protection implementation
<Route element={<PrivateRoute />}>
  <Route path="/dashboard" element={<Dashboard />} />
  // ... other protected routes
</Route>
```

## Development Setup

### Installation
```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview

# Run linting
npm run lint
```

### Environment Configuration
```env
# Required environment variables
VITE_API_URL=your_backend_url
VITE_SOCKET_URL=your_socket_url
VITE_GOOGLE_CLIENT_ID=your_google_client_id
VITE_FITBIT_CLIENT_ID=your_fitbit_client_id
```

## Project Structure
```
frontend/
├── src/
│   ├── assets/         # Static assets
│   ├── components/     # Reusable components
│   ├── pages/         # Page components
│   ├── services/      # API and service integrations
│   ├── utils/         # Utility functions
│   ├── data/          # Static data and constants
│   ├── App.jsx        # Root component
│   ├── main.jsx       # Entry point
│   └── index.css      # Global styles
├── public/            # Public assets
└── dist/             # Production build
```

## Code Style Guide

### Component Structure
```jsx
// Standard component template
const ComponentName = () => {
  // 1. Hooks and context
  // 2. State management
  // 3. Effects
  // 4. Event handlers
  // 5. Render methods
};
```

### Best Practices
- Use functional components with hooks
- Implement proper error boundaries
- Follow consistent naming conventions
- Write meaningful comments
- Maintain proper component hierarchy
- Use CSS modules for component-specific styling

## Performance Optimization
- Implement React.memo() for expensive components
- Use lazy loading for routes
- Optimize images and assets
- Implement proper caching strategies
- Monitor and optimize re-renders

## Security Measures
- JWT token management
- OAuth2 secure authentication
- Protected routes
- Input validation
- Secure data transmission
- Environment variable protection

## Contributing
1. Fork the repository
2. Create your feature branch
3. Commit your changes
4. Push to the branch
5. Create a Pull Request

## License
[Your License Information]

## Contact
[Your Contact Information]

## Version History
- v1.0.0 - Initial Release
  - Basic fitness tracking
  - Platform integration
  - User authentication
  - Real-time notifications
  - Data visualization