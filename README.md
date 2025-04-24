# Fitness and Wellness Tracking Platform

A comprehensive health and fitness tracking platform that combines workout tracking, nutrition monitoring, mental health assessment, and gamification features.

## Project Overview

This platform consists of three main components:
- **Frontend**: React-based web application
- **Backend**: Node.js/Express.js API server
- **AI Service**: Flask-based AI recommendation engine

## Prerequisites

### Required Software
- Node.js (v18 or higher)
- Python (v3.9 or higher)
- MongoDB (v6.0 or higher)
- Git

### Required Accounts and API Keys
- Google Cloud Platform account (for Google Fit integration)
- Fitbit Developer account
- MongoDB Atlas account (or local MongoDB instance)

## Installation and Setup

### 1. Clone the Repository
```bash
git clone [your-repository-url]
cd fitnessApp
```

### 2. Backend Setup
```bash
cd backend
npm install
cp .env.example .env
# Edit .env with your configuration
npm run dev
```

### 3. Frontend Setup
```bash
cd frontend
npm install
cp .env.example .env
# Edit .env with your configuration
npm start
```

### 4. AI Service Setup
```bash
# Navigate to the flask-ai directory
cd flask-ai

# Create and activate virtual environment
# For Windows:
python -m venv venv

# Configure Python interpreter location
# Edit venv\pyvenv.cfg and set the correct Python path:
home = C:\Path\To\Your\Python
include-system-site-packages = false
version = 3.9

# Activate the virtual environment
venv\Scripts\activate

# For macOS/Linux:
python -m venv venv

# Configure Python interpreter location
# Edit venv/pyvenv.cfg and set the correct Python path:
home = /path/to/your/python
include-system-site-packages = false
version = 3.9

# Activate the virtual environment
source venv/bin/activate

# Verify the virtual environment is active
# The prompt should show (venv) at the beginning
# If not, make sure you're in the correct directory and try activating again

# Install dependencies
pip install -r requirements.txt

# Set up environment variables
cp .env.example .env
# Edit .env with your configuration
# Make sure to set the correct paths and locations:
FLASK_APP=app.py
FLASK_ENV=development
PORT=5001
# Add any other required environment variables

# Run the application
python app.py

# Common virtual environment commands:
# To deactivate the virtual environment:
# Windows/Linux/macOS: deactivate

# To check if virtual environment is active:
# Windows/Linux/macOS: which python  # Should point to venv directory

# If you need to recreate the virtual environment:
# deactivate
# rm -rf venv  # On Windows: rmdir /s /q venv
# Then follow the setup steps again
```

## Environment Variables

### Backend (.env)
```env
PORT=5000
MONGODB_URI=your_mongodb_uri
JWT_SECRET=your_jwt_secret
FRONTEND_URL=http://localhost:3000
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
FITBIT_CLIENT_ID=your_fitbit_client_id
FITBIT_CLIENT_SECRET=your_fitbit_client_secret
```

### Frontend (.env)
```env
REACT_APP_API_URL=http://localhost:5000
REACT_APP_AI_SERVICE_URL=http://localhost:5001
```

### AI Service (.env)
```env
FLASK_APP=app.py
FLASK_ENV=development
PORT=5001
```

## API Integrations

### Google Fit
- Required scopes:
  - fitness.activity.read
  - fitness.heart_rate.read
  - fitness.body.read

### Fitbit
- Required scopes:
  - activity
  - heartrate
  - profile

## Development Workflow

1. Start MongoDB service
2. Start the backend server
3. Start the frontend development server
4. Start the AI service (if needed)

## Testing

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

## Deployment

Each component can be deployed independently:
- Frontend: Vercel/Netlify
- Backend: Render/Heroku
- AI Service: Render/Heroku

## Troubleshooting

Common issues and solutions:
1. MongoDB connection issues
   - Verify MongoDB URI
   - Check if MongoDB service is running
2. CORS errors
   - Verify allowed origins in backend configuration
3. API integration issues
   - Verify API keys and scopes
   - Check OAuth configuration

## Contributing

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Create a Pull Request

## Support

For support, please contact [+254110868049]

## Development Dependencies

### Node.js Dependencies
```json
{
  "dependencies": {
    "express": "^4.21.0",
    "mongoose": "^8.10.0",
    "socket.io": "^4.8.0",
    "axios": "^1.7.0",
    "bcryptjs": "^3.0.0"
  }
}
```

### Python Dependencies
```txt
flask==2.0.1
python-dotenv==0.19.0
requests==2.26.0
numpy==1.21.0
pandas==1.3.0
scikit-learn==0.24.2
```

### Development Tools
- Postman (for API testing)
- MongoDB Compass/Atlas (for database management)
- VS Code (recommended IDE)
- Git (version control)

## Database Setup

### MongoDB Configuration
The application uses MongoDB as its database. The connection is automatically established when you start the backend server using `npm run dev`. Make sure to:

1. Have MongoDB installed locally or use MongoDB Atlas
2. Set the correct `MONGODB_URI` in your `.env` file:
   ```env
   # For local MongoDB
   MONGODB_URI=mongodb://localhost:27017/fitnessApp
   
   # For MongoDB Atlas
   MONGODB_URI=mongodb+srv://<username>:<password>@<cluster>.mongodb.net/fitnessApp
   ```

### Database Initialization
The database will be automatically initialized when you start the server. No additional setup is required.

## Version Control

### Git Guidelines
- Use semantic versioning
- Follow conventional commits
- Branch naming: feature/feature-name, bugfix/bug-name, hotfix/issue-name

### Commit Message Format
```
<type>(<scope>): <description>

[optional body]
[optional footer]
```

Types:
- feat: new feature
- fix: bug fix
- docs: documentation changes
- style: formatting, missing semicolons, etc.
- refactor: code refactoring
- test: adding tests
- chore: maintenance

## API Documentation

### Authentication
- JWT-based authentication
- Token expiration: 24 hours
- Refresh token mechanism

### Rate Limiting
- 100 requests per minute per IP
- 1000 requests per hour per user

### Endpoints
- Base URL: http://localhost:5000/api
- API version: v1
- Documentation: http://localhost:5000/api-docs

## Security Guidelines

### API Keys
- Never commit API keys to version control
- Use environment variables
- Rotate keys regularly
- Use different keys for development and production

### Environment Variables
- Use .env files for local development
- Use platform-specific environment variable management for production
- Encrypt sensitive data

### Security Checklist
- [ ] Enable CORS with specific origins
- [ ] Implement rate limiting
- [ ] Use HTTPS in production
- [ ] Regular security audits
- [ ] Dependency vulnerability scanning

## Performance Requirements

### System Requirements
- CPU: 2+ cores
- RAM: 4GB minimum
- Storage: 10GB minimum
- Network: Stable internet connection

### Recommended Specifications
- CPU: 4+ cores
- RAM: 8GB
- Storage: 20GB SSD
- Network: 10Mbps+ connection

### Performance Benchmarks
- API Response Time: < 200ms
- Database Query Time: < 100ms
- WebSocket Latency: < 50ms
- Frontend Load Time: < 2s 