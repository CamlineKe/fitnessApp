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
- Git (optional, only if you want to use version control)

### Required Accounts and API Keys
- Google Cloud Platform account (for Google Fit integration)
- Fitbit Developer account
- MongoDB Atlas account (or local MongoDB instance)

## Installation and Setup

### Option 1: From Zip File
1. **Extract the zip file**
   - Extract the downloaded zip file to your desired location
   - Open the extracted folder in your terminal/command prompt

2. **Backend Setup**
   ```bash
   # Navigate to backend directory
   cd backend

   # Install dependencies
   npm install

   # Copy environment example file
   cp .env.example .env

   # Edit .env file with your configuration
   # (See Environment Variables section below)

   # Start the backend server
   npm run dev
   ```

3. **Frontend Setup**
   ```bash
   # Open a new terminal window
   # Navigate to frontend directory
   cd frontend

   # Install dependencies
   npm install

   # Copy environment example file
   cp .env.example .env

   # Edit .env file with your configuration
   # (See Environment Variables section below)

   # Start the frontend development server
   npm run dev
   ```

4. **AI Service Setup**
   ```bash
   # Open a new terminal window
   # Navigate to flask-ai directory
   cd flask-ai

   # Create virtual environment
   python -m venv venv

   # Activate virtual environment
   # On Windows:
   venv\Scripts\activate
   # On macOS/Linux:
   source venv/bin/activate

   # Install dependencies
   pip install -r requirements.txt

   # Copy environment example file
   cp .env.example .env

   # Edit .env file with your configuration
   # (See Environment Variables section below)

   # Start the AI service
   python app.py
   ```

### Option 2: From Git Repository
```bash
# Clone the repository
git clone https://github.com/CamlineKe/fitnessApp
cd fitnessApp

# Follow steps 2-4 from Option 1
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

## Virtual Environment Setup

### Windows Setup
1. **Install Python**
   - Download Python 3.9 or higher from [python.org](https://www.python.org/downloads/)
   - During installation, check "Add Python to PATH"
   - Verify installation: `python --version`

2. **Create Virtual Environment**
   ```bash
   # Navigate to flask-ai directory
   cd flask-ai

   # Create virtual environment
   python -m venv venv

   # Activate virtual environment
   venv\Scripts\activate

   # Verify activation (should see (venv) at start of prompt)
   ```

3. **Install Dependencies**
   ```bash
   # Make sure virtual environment is activated
   pip install -r requirements.txt
   ```

### macOS Setup
1. **Install Python**
   - Install using Homebrew: `brew install python@3.9`
   - Or download from [python.org](https://www.python.org/downloads/)
   - Verify installation: `python3 --version`

2. **Create Virtual Environment**
   ```bash
   # Navigate to flask-ai directory
   cd flask-ai

   # Create virtual environment
   python3 -m venv venv

   # Activate virtual environment
   source venv/bin/activate

   # Verify activation (should see (venv) at start of prompt)
   ```

3. **Install Dependencies**
   ```bash
   # Make sure virtual environment is activated
   pip install -r requirements.txt
   ```

### Linux Setup
1. **Install Python**
   ```bash
   # Ubuntu/Debian
   sudo apt update
   sudo apt install python3.9 python3.9-venv

   # CentOS/RHEL
   sudo yum install python3.9 python3.9-venv

   # Verify installation
   python3 --version
   ```

2. **Create Virtual Environment**
   ```bash
   # Navigate to flask-ai directory
   cd flask-ai

   # Create virtual environment
   python3 -m venv venv

   # Activate virtual environment
   source venv/bin/activate

   # Verify activation (should see (venv) at start of prompt)
   ```

3. **Install Dependencies**
   ```bash
   # Make sure virtual environment is activated
   pip install -r requirements.txt
   ```

### Common Virtual Environment Commands
```bash
# To deactivate virtual environment
deactivate

# To check if virtual environment is active
# Windows
where python
# macOS/Linux
which python3

# To recreate virtual environment
deactivate
# Windows
rmdir /s /q venv
# macOS/Linux
rm -rf venv
# Then follow setup steps again
```

### Troubleshooting Virtual Environment
1. **Python not found**
   - Verify Python installation
   - Check PATH environment variable
   - Try using full path to Python executable

2. **Permission errors**
   - Use `sudo` on Linux/macOS if needed
   - Run terminal as administrator on Windows

3. **Dependency installation issues**
   - Update pip: `python -m pip install --upgrade pip`
   - Try installing packages individually
   - Check Python version compatibility

4. **Virtual environment activation issues**
   - Verify correct activation command for your OS
   - Check if virtual environment was created successfully
   - Try recreating the virtual environment 